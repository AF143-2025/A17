import db from './db';

export interface PriceCalculationParams {
  providerCost: number; // Cost per 1000 in USD
  serviceId?: string;
  categoryId?: string;
  platformId?: string;
}

export interface PriceCalculationResult {
  customerPrice: number;
  markupType: 'PERCENTAGE' | 'FIXED';
  markupValue: number;
  appliedRuleId?: string;
  appliedRuleName: string;
}

/**
 * Dynamic Pricing Engine for ESAAD SMM Platform
 * Calculates customer selling prices using hierarchical markup rules:
 * SERVICE -> CATEGORY -> PLATFORM -> GLOBAL
 */
export async function calculateCustomerPrice(
  {
    providerCost,
    serviceId,
    categoryId,
    platformId,
  }: PriceCalculationParams,
  preloadedRules?: any[]
): Promise<PriceCalculationResult> {
  // If provider cost is 0 or negative, set safe fallback
  const baseCost = Math.max(0, providerCost);

  // Fetch all active pricing rules ordered by priority descending if not preloaded
  const rules = preloadedRules || await db.pricingRule.findMany({
    where: { status: true },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });

  // 1. Check SERVICE level rule
  if (serviceId) {
    const serviceRule = rules.find(
      (r) => r.scope === 'SERVICE' && r.targetId === serviceId
    );
    if (serviceRule) {
      return computePrice(baseCost, serviceRule);
    }
  }

  // 2. Check CATEGORY level rule
  if (categoryId) {
    const categoryRule = rules.find(
      (r) => r.scope === 'CATEGORY' && r.targetId === categoryId
    );
    if (categoryRule) {
      return computePrice(baseCost, categoryRule);
    }
  }

  // 3. Check PLATFORM level rule
  if (platformId) {
    const platformRule = rules.find(
      (r) => r.scope === 'PLATFORM' && r.targetId === platformId
    );
    if (platformRule) {
      return computePrice(baseCost, platformRule);
    }
  }

  // 4. Check GLOBAL rule
  const globalRule = rules.find((r) => r.scope === 'GLOBAL');
  if (globalRule) {
    return computePrice(baseCost, globalRule);
  }

  // 5. Default fallback: EXACT PROVIDER COST (0% markup)
  // No arbitrary markup added automatically - "ما اريد يضيف اسعار من كيفه"
  return {
    customerPrice: roundPrice(baseCost),
    markupType: 'PERCENTAGE',
    markupValue: 0,
    appliedRuleName: 'سعر المزود المباشر (بدون زيادة تلقائية)',
  };
}

function computePrice(baseCost: number, rule: any): PriceCalculationResult {
  let price = baseCost;
  const markup = parseFloat(String(rule.markupValue)) || 0;

  if (rule.markupType === 'FIXED') {
    price = baseCost + markup;
  } else {
    // Default PERCENTAGE
    price = baseCost * (1 + markup / 100);
  }

  return {
    customerPrice: roundPrice(price),
    markupType: rule.markupType as 'PERCENTAGE' | 'FIXED',
    markupValue: markup,
    appliedRuleId: rule.id,
    appliedRuleName: rule.name,
  };
}

function roundPrice(val: number): number {
  if (val <= 0) return 0;
  // High precision for SMM rates without artificial price floors:
  // For micro-rates (< $0.01), keep up to 5 decimals (e.g. 0.00065)
  if (val < 0.01) {
    return Math.round(val * 100000) / 100000;
  }
  // For small rates (< $1.0), keep 4 decimals (e.g. 0.1746)
  if (val < 1) {
    return Math.round(val * 10000) / 10000;
  }
  // For regular rates, keep 3 decimals (e.g. 2.500)
  return Math.round(val * 1000) / 1000;
}

/**
 * Recalculate customer selling prices for all services or a specific service
 * using the best available provider cost and active pricing rules.
 */
export async function recalculateServicePrices(serviceId?: string): Promise<number> {
  // If specific service requested, handle single service calculation
  if (serviceId) {
    const service = await db.service.findUnique({
      where: { id: serviceId },
      include: {
        category: true,
        serviceProviders: {
          where: { status: true },
          orderBy: { costRate: 'asc' },
        },
      },
    });

    if (!service) return 0;

    let bestCost = service.providerCostPer1000 || 0;
    if (service.serviceProviders.length > 0 && service.serviceProviders[0].costRate > 0) {
      bestCost = service.serviceProviders[0].costRate;
    }

    const { customerPrice } = await calculateCustomerPrice({
      providerCost: bestCost,
      serviceId: service.id,
      categoryId: service.categoryId,
      platformId: service.category?.platformId,
    });

    await db.service.update({
      where: { id: serviceId },
      data: {
        providerCostPer1000: bestCost,
        pricePer1000: customerPrice,
      },
    });

    return 1;
  }

  // Global fast recalculation across all services using atomic SQL execution
  // 1. Sync provider cost from service_providers where missing or 0
  await db.$executeRawUnsafe(`
    UPDATE "services" s
    SET "providerCostPer1000" = sp."costRate"
    FROM (
      SELECT DISTINCT ON ("serviceId") "serviceId", "costRate"
      FROM "service_providers"
      WHERE "status" = true AND "costRate" > 0
      ORDER BY "serviceId", "costRate" ASC
    ) sp
    WHERE s."id" = sp."serviceId" AND (s."providerCostPer1000" = 0 OR s."providerCostPer1000" IS NULL);
  `);

  // 2. Default: set pricePer1000 = providerCostPer1000 (0% arbitrary markup)
  const defaultUpdated = await db.$executeRawUnsafe(`
    UPDATE "services"
    SET "pricePer1000" = "providerCostPer1000"
    WHERE "providerCostPer1000" > 0;
  `);

  // 3. Fetch active rules ordered by priority ascending so higher priorities take precedence
  const rules = await db.pricingRule.findMany({
    where: { status: true },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  });

  // 4. Apply rules sequentially
  for (const rule of rules) {
    const markup = parseFloat(String(rule.markupValue)) || 0;
    const isFixed = rule.markupType === 'FIXED';

    if (rule.scope === 'GLOBAL') {
      if (isFixed) {
        await db.$executeRawUnsafe(`
          UPDATE "services"
          SET "pricePer1000" = ROUND(("providerCostPer1000" + ${markup})::numeric, 4)
          WHERE "providerCostPer1000" > 0;
        `);
      } else {
        await db.$executeRawUnsafe(`
          UPDATE "services"
          SET "pricePer1000" = ROUND(("providerCostPer1000" * (1 + ${markup} / 100))::numeric, 4)
          WHERE "providerCostPer1000" > 0;
        `);
      }
    } else if (rule.scope === 'PLATFORM' && rule.targetId) {
      if (isFixed) {
        await db.$executeRawUnsafe(`
          UPDATE "services"
          SET "pricePer1000" = ROUND(("providerCostPer1000" + ${markup})::numeric, 4)
          WHERE "providerCostPer1000" > 0
          AND "categoryId" IN (SELECT "id" FROM "categories" WHERE "platformId" = '${rule.targetId}');
        `);
      } else {
        await db.$executeRawUnsafe(`
          UPDATE "services"
          SET "pricePer1000" = ROUND(("providerCostPer1000" * (1 + ${markup} / 100))::numeric, 4)
          WHERE "providerCostPer1000" > 0
          AND "categoryId" IN (SELECT "id" FROM "categories" WHERE "platformId" = '${rule.targetId}');
        `);
      }
    } else if (rule.scope === 'CATEGORY' && rule.targetId) {
      if (isFixed) {
        await db.$executeRawUnsafe(`
          UPDATE "services"
          SET "pricePer1000" = ROUND(("providerCostPer1000" + ${markup})::numeric, 4)
          WHERE "providerCostPer1000" > 0 AND "categoryId" = '${rule.targetId}';
        `);
      } else {
        await db.$executeRawUnsafe(`
          UPDATE "services"
          SET "pricePer1000" = ROUND(("providerCostPer1000" * (1 + ${markup} / 100))::numeric, 4)
          WHERE "providerCostPer1000" > 0 AND "categoryId" = '${rule.targetId}';
        `);
      }
    } else if (rule.scope === 'SERVICE' && rule.targetId) {
      if (isFixed) {
        await db.$executeRawUnsafe(`
          UPDATE "services"
          SET "pricePer1000" = ROUND(("providerCostPer1000" + ${markup})::numeric, 4)
          WHERE "id" = '${rule.targetId}';
        `);
      } else {
        await db.$executeRawUnsafe(`
          UPDATE "services"
          SET "pricePer1000" = ROUND(("providerCostPer1000" * (1 + ${markup} / 100))::numeric, 4)
          WHERE "id" = '${rule.targetId}';
        `);
      }
    }
  }

  return defaultUpdated;
}
