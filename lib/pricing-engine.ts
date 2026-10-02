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
  const baseCost = Math.max(0.001, providerCost);

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

  // 5. Default fallback: +50% markup
  const defaultMarkupPercent = 50.0;
  const calculated = baseCost * (1 + defaultMarkupPercent / 100);
  return {
    customerPrice: roundPrice(calculated),
    markupType: 'PERCENTAGE',
    markupValue: defaultMarkupPercent,
    appliedRuleName: 'افتراضي (+50%)',
  };
}

function computePrice(baseCost: number, rule: any): PriceCalculationResult {
  let price = baseCost;
  if (rule.markupType === 'FIXED') {
    price = baseCost + rule.markupValue;
  } else {
    // Default PERCENTAGE
    price = baseCost * (1 + rule.markupValue / 100);
  }

  return {
    customerPrice: roundPrice(price),
    markupType: rule.markupType as 'PERCENTAGE' | 'FIXED',
    markupValue: rule.markupValue,
    appliedRuleId: rule.id,
    appliedRuleName: rule.name,
  };
}

function roundPrice(val: number): number {
  // Round to 3 decimal places, min 0.01
  const rounded = Math.round(val * 1000) / 1000;
  return Math.max(0.01, rounded);
}

/**
 * Recalculate customer selling prices for all services or a specific service
 * using the best available provider cost and active pricing rules.
 */
export async function recalculateServicePrices(serviceId?: string): Promise<number> {
  const whereClause: any = { status: true };
  if (serviceId) {
    whereClause.id = serviceId;
  }

  const services = await db.service.findMany({
    where: whereClause,
    include: {
      category: {
        include: { platform: true },
      },
      serviceProviders: {
        where: { status: true },
        include: { provider: true },
        orderBy: { costRate: 'asc' }, // Cheapest first
      },
    },
  });

  let updatedCount = 0;

  for (const s of services) {
    // Best cost: either from the cheapest active serviceProvider or existing cost
    let bestCost = s.providerCostPer1000;

    const activeProviders = s.serviceProviders.filter(
      (sp) => sp.status && sp.provider.status
    );

    if (activeProviders.length > 0) {
      bestCost = activeProviders[0].costRate;
    }

    const { customerPrice } = await calculateCustomerPrice({
      providerCost: bestCost,
      serviceId: s.id,
      categoryId: s.categoryId,
      platformId: s.category.platformId,
    });

    await db.service.update({
      where: { id: s.id },
      data: {
        providerCostPer1000: bestCost,
        pricePer1000: customerPrice,
      },
    });

    updatedCount++;
  }

  return updatedCount;
}
