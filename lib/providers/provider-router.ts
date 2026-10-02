import db from '../db';
import { ProviderFactory } from './provider-factory';
import { creditWalletBalance } from '../wallet';

export interface RouteOrderParams {
  orderId: string;
  serviceId: string;
  targetUrl: string;
  quantity: number;
  userId: string;
  idempotencyKey?: string;
}

export interface RouteCandidate {
  serviceProviderId: string;
  providerId: string;
  providerName: string;
  externalServiceId: string;
  costRate: number;
  min: number;
  max: number;
  isPrimary: boolean;
  isFallback: boolean;
  refillSupported: boolean;
  cancelSupported: boolean;
  score: number;
  provider: any;
}

/**
 * Smart Provider Router:
 * Selects the optimal provider based on:
 * - Cost (cheapest rate)
 * - Availability (active status, quantity range)
 * - Provider health (error count, success rate)
 * - Primary/Fallback priority flags
 * - Handles automatic Failover if the primary provider fails.
 */
export class ProviderRouter {
  /**
   * Find and rank all valid providers for a given service and quantity
   */
  static async getRankedCandidates(
    serviceId: string,
    quantity: number
  ): Promise<RouteCandidate[]> {
    // 1. Fetch all mapped providers for this service
    const serviceProviders = await db.serviceProvider.findMany({
      where: {
        serviceId,
        status: true,
      },
      include: {
        provider: true,
      },
    });

    const candidates: RouteCandidate[] = [];

    for (const sp of serviceProviders) {
      const p = sp.provider;

      // Skip disabled providers
      if (!p.status) continue;

      // Check quantity bounds
      if (quantity < sp.min || quantity > sp.max) continue;

      // Check health: if errorCount > 5 and successRate < 70%, downgrade
      const errorPenalty = Math.min(50, p.errorCount * 10);
      const successScore = p.successRate || 100;

      // Cost score: lower cost = higher score
      // Normalize cost: e.g. base 100 - (costRate * 10)
      const costScore = Math.max(0, 100 - sp.costRate * 10);

      // Primary bonus: +50 points
      const primaryBonus = sp.isPrimary ? 50 : 0;
      // Fallback penalty if not needed: -20 points
      const fallbackPenalty = sp.isFallback ? -20 : 0;

      const totalScore =
        costScore * 0.4 +
        successScore * 0.3 +
        primaryBonus +
        fallbackPenalty -
        errorPenalty;

      candidates.push({
        serviceProviderId: sp.id,
        providerId: p.id,
        providerName: p.name,
        externalServiceId: sp.externalServiceId,
        costRate: sp.costRate,
        min: sp.min,
        max: sp.max,
        isPrimary: sp.isPrimary,
        isFallback: sp.isFallback,
        refillSupported: sp.refillSupported,
        cancelSupported: sp.cancelSupported,
        score: totalScore,
        provider: p,
      });
    }

    // Sort by score descending (highest score / best candidate first)
    candidates.sort((a, b) => b.score - a.score);

    // If no mapped serviceProviders, check if the service has a legacy provider attached
    if (candidates.length === 0) {
      const legacyService = await db.service.findUnique({
        where: { id: serviceId },
        include: { provider: true },
      });

      if (
        legacyService &&
        legacyService.provider &&
        legacyService.provider.status &&
        legacyService.providerServiceId
      ) {
        candidates.push({
          serviceProviderId: 'legacy',
          providerId: legacyService.provider.id,
          providerName: legacyService.provider.name,
          externalServiceId: legacyService.providerServiceId,
          costRate: legacyService.providerCostPer1000,
          min: legacyService.minQuantity,
          max: legacyService.maxQuantity,
          isPrimary: true,
          isFallback: false,
          refillSupported: false,
          cancelSupported: false,
          score: 100,
          provider: legacyService.provider,
        });
      }
    }

    return candidates;
  }

  /**
   * Dispatch an order with automatic failover to the next best provider
   */
  static async dispatchOrder({
    orderId,
    serviceId,
    targetUrl,
    quantity,
    userId,
    idempotencyKey,
  }: RouteOrderParams): Promise<{
    success: boolean;
    providerId?: string;
    providerOrderId?: string;
    cost?: number;
    error?: string;
  }> {
    const candidates = await this.getRankedCandidates(serviceId, quantity);

    if (candidates.length === 0) {
      const errMsg = 'لا يوجد مزود متاح حالياً لهذه الخدمة بالكمية المطلوبة';
      await this.recordOrderFailureAndRefund(orderId, userId, errMsg);
      return { success: false, error: errMsg };
    }

    // Iterate through candidates with failover
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const adapter = ProviderFactory.getAdapter(candidate.provider);

      try {
        console.log(
          `[ProviderRouter] Attempting Provider #${i + 1} (${candidate.providerName}) for Order ${orderId}...`
        );

        // Call Provider API with timeout protection
        const res = await Promise.race([
          adapter.createOrder({
            serviceId: candidate.externalServiceId,
            link: targetUrl,
            quantity,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Provider API timeout (15s)')), 15000)
          ),
        ]);

        if (res && res.providerOrderId) {
          const totalCost = (quantity / 1000) * candidate.costRate;

          // Fetch current order to compute profit
          const currentOrder = await db.order.findUnique({
            where: { id: orderId },
          });

          const currentPrice = currentOrder ? currentOrder.price : 0;
          const profit = Math.max(0, currentPrice - totalCost);

          // Update order status to PROCESSING and link provider
          await db.order.update({
            where: { id: orderId },
            data: {
              status: 'PROCESSING',
              providerId: candidate.providerId,
              providerOrderId: res.providerOrderId,
              cost: totalCost,
              profit: profit,
            },
          });

          // Log success event
          await db.orderEvent.create({
            data: {
              orderId,
              eventType: 'SENT_TO_PROVIDER',
              message: `تم توجيه الطلب بنجاح إلى المزود: ${candidate.providerName} (رقم الطلب الخارجي: #${res.providerOrderId})`,
              data: JSON.stringify({
                providerId: candidate.providerId,
                providerOrderId: res.providerOrderId,
                costRate: candidate.costRate,
                totalCost,
              }),
            },
          });

          // Record status history
          await db.orderStatusHistory.create({
            data: {
              orderId,
              oldStatus: 'PENDING',
              newStatus: 'PROCESSING',
              providerStatus: 'Pending',
              remarks: `Routed to ${candidate.providerName}`,
            },
          });

          // Reset provider error count on success
          if (candidate.provider.errorCount > 0) {
            await db.provider.update({
              where: { id: candidate.providerId },
              data: { errorCount: 0 },
            });
          }

          return {
            success: true,
            providerId: candidate.providerId,
            providerOrderId: res.providerOrderId,
            cost: totalCost,
          };
        }
      } catch (err: any) {
        const errorDetails = err.message || 'Unknown provider error';
        console.warn(
          `[ProviderRouter] Provider ${candidate.providerName} failed for Order ${orderId}: ${errorDetails}`
        );

        // Increment provider error count
        await db.provider.update({
          where: { id: candidate.providerId },
          data: {
            errorCount: { increment: 1 },
          },
        });

        // Log failover event
        const hasNext = i + 1 < candidates.length;
        await db.orderEvent.create({
          data: {
            orderId,
            eventType: 'PROVIDER_FAILOVER',
            message: `فشل التنفيذ لدى المزود (${candidate.providerName}): ${errorDetails}.${
              hasNext
                ? ` جاري التحويل التلقائي للمزود البديل (${candidates[i + 1].providerName})...`
                : ' لا يوجد مزود بديل متاح.'
            }`,
            data: JSON.stringify({
              failedProviderId: candidate.providerId,
              error: errorDetails,
              nextCandidate: hasNext ? candidates[i + 1].providerName : null,
            }),
          },
        });

        // Continue loop to try next candidate
      }
    }

    // If all candidates failed, cancel & refund
    const finalErr = 'تعذر تنفيذ الطلب عبر جميع المزودين المتاحين حالياً';
    await this.recordOrderFailureAndRefund(orderId, userId, finalErr);
    return { success: false, error: finalErr };
  }

  /**
   * Safe refund and cancellation when all providers fail
   */
  private static async recordOrderFailureAndRefund(
    orderId: string,
    userId: string,
    reason: string
  ) {
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.status === 'CANCELED' || order.status === 'REFUNDED') {
      return;
    }

    // 1. Update order status to FAILED
    await db.order.update({
      where: { id: orderId },
      data: {
        status: 'FAILED',
      },
    });

    // 2. Refund wallet balance
    if (order.price > 0) {
      await creditWalletBalance({
        userId,
        amount: order.price,
        type: 'REFUND',
        referenceId: orderId,
        description: `استرجاع تلقائي لقيمة الطلب #${orderId.slice(-6)}: ${reason}`,
      });
    }

    // 3. Log event
    await db.orderEvent.create({
      data: {
        orderId,
        eventType: 'ORDER_FAILED_REFUNDED',
        message: `تم إلغاء الطلب واسترجاع المبلغ ($${order.price.toFixed(
          2
        )}) إلى المحفظة تلقائياً. السبب: ${reason}`,
      },
    });

    // 4. Record status history
    await db.orderStatusHistory.create({
      data: {
        orderId,
        oldStatus: order.status,
        newStatus: 'FAILED',
        remarks: reason,
      },
    });
  }
}
