import db from '../db';
import { ProviderFactory } from '../providers/provider-factory';
import { calculateCustomerPrice, recalculateServicePrices } from '../pricing-engine';
import { creditWalletBalance } from '../wallet';

export interface SyncResult {
  providerId: string;
  providerName: string;
  totalSynced: number;
  newServicesCount: number;
  updatedServicesCount: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

/**
 * Auto-Sync Engine:
 * Fetches services from providers, normalizes platforms and categories,
 * maps provider services to internal services, updates costs & customer prices,
 * and maintains sync logs.
 */
export class SyncEngine {
  /**
   * Sync services from a specific provider
   */
  static async syncProviderServices(providerId: string): Promise<SyncResult> {
    const startTime = Date.now();

    const provider = await db.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new Error(`Provider with ID ${providerId} not found`);
    }

    try {
      const adapter = ProviderFactory.getAdapter(provider);
      const extServices = await adapter.getServices();

      if (!Array.isArray(extServices) || extServices.length === 0) {
        throw new Error('لم يرجع المزود أي خدمات صالحة للمزامنة');
      }

      let newCount = 0;
      let updatedCount = 0;

      // Keep track of active external IDs in this sync
      const activeExternalIds = new Set<string>();

      // 1. In-memory caches for high-performance syncing of large catalogs
      const platformCache = new Map<string, any>();
      const existingPlatforms = await db.platform.findMany();
      for (const p of existingPlatforms) {
        platformCache.set(p.slug, p);
      }

      const categoryCache = new Map<string, any>();
      const existingCategories = await db.category.findMany();
      for (const c of existingCategories) {
        categoryCache.set(`${c.platformId}:${c.slug}`, c);
      }

      // Preload active pricing rules
      const pricingRules = await db.pricingRule.findMany({
        where: { status: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });

      // Preload existing services mapped to this provider or its categories
      const existingServices = await db.service.findMany({
        where: {
          OR: [
            { providerId: provider.id },
            { serviceProviders: { some: { providerId: provider.id } } },
          ],
        },
        select: {
          id: true,
          name: true,
          categoryId: true,
          providerServiceId: true,
          providerCostPer1000: true,
        },
      });

      const serviceByExtId = new Map<string, any>();
      const serviceByNameAndCat = new Map<string, any>();
      for (const s of existingServices) {
        if (s.providerServiceId) serviceByExtId.set(s.providerServiceId, s);
        serviceByNameAndCat.set(`${s.categoryId}:::${s.name.trim().toLowerCase()}`, s);
      }

      // Preload existing provider_services records for this provider
      const existingProviderServices = await db.providerService.findMany({
        where: { providerId: provider.id },
        select: { externalServiceId: true },
      });
      const providerServiceSet = new Set(existingProviderServices.map((ps) => ps.externalServiceId));

      // Preload existing service_providers mappings
      const existingServiceProviders = await db.serviceProvider.findMany({
        where: { providerId: provider.id },
        select: { serviceId: true },
      });
      const serviceProviderSet = new Set(existingServiceProviders.map((sp) => sp.serviceId));

      const getOrCreatePlatform = async (slug: string, nameAr: string, tx: any = db) => {
        let p = platformCache.get(slug);
        if (!p) {
          p = await tx.platform.upsert({
            where: { slug },
            update: { nameAr },
            create: {
              name: SyncEngine.formatPlatformName(slug),
              nameAr,
              slug,
              icon: SyncEngine.getPlatformIcon(slug),
              status: true,
            },
          });
          platformCache.set(slug, p);
        }
        return p;
      };

      const getOrCreateCategory = async (platformId: string, slug: string, nameAr: string, tx: any = db) => {
        const key = `${platformId}:${slug}`;
        let c = categoryCache.get(key);
        if (!c) {
          c = await tx.category.findFirst({
            where: { platformId, slug },
          });
          if (!c) {
            c = await tx.category.create({
              data: {
                platformId,
                name: slug.replace(/-/g, ' '),
                nameAr,
                slug,
                status: true,
              },
            });
          }
          categoryCache.set(key, c);
        }
        return c;
      };

      // Process all services directly with batching for maximum stability across PostgreSQL & poolers
      for (const ext of extServices) {
        try {
          const extId = String(ext.service);
          activeExternalIds.add(extId);

          // 1. Upsert into provider_services table
          if (providerServiceSet.has(extId)) {
            await db.providerService.update({
              where: {
                providerId_externalServiceId: {
                  providerId: provider.id,
                  externalServiceId: extId,
                },
              },
              data: {
                name: ext.name,
                category: ext.category,
                rate: ext.rate,
                min: ext.min,
                max: ext.max,
                type: ext.type || null,
                refill: Boolean(ext.refill),
                cancel: Boolean(ext.cancel),
                status: true,
              },
            });
          } else {
            await db.providerService.create({
              data: {
                providerId: provider.id,
                externalServiceId: extId,
                name: ext.name,
                category: ext.category,
                rate: ext.rate,
                min: ext.min,
                max: ext.max,
                type: ext.type || null,
                refill: Boolean(ext.refill),
                cancel: Boolean(ext.cancel),
                status: true,
              },
            });
            providerServiceSet.add(extId);
          }

          // 2. Identify Platform and Category
          const { platformSlug, platformNameAr, categorySlug, categoryNameAr } =
            this.classifyService(ext.category, ext.name);

          // 3. Ensure Platform exists (cached)
          const platform = await getOrCreatePlatform(platformSlug, platformNameAr, db);

          // 4. Ensure Category exists (cached)
          const category = await getOrCreateCategory(platform.id, categorySlug, categoryNameAr, db);

          // 5. Internal Service Mapping
          const catNameKey = `${category.id}:::${ext.name.trim().toLowerCase()}`;
          let service = serviceByExtId.get(extId) || serviceByNameAndCat.get(catNameKey);

          if (!service) {
            // Compute selling price using pricing engine with preloaded rules
            const { customerPrice } = await calculateCustomerPrice(
              {
                providerCost: ext.rate,
                categoryId: category.id,
                platformId: platform.id,
              },
              pricingRules
            );

            service = await db.service.create({
              data: {
                categoryId: category.id,
                name: ext.name,
                nameAr: ext.name,
                description: `خدمة ${categoryNameAr} عالية الجودة مع سرعة تسليم فورية واستقرار تام.`,
                minQuantity: ext.min,
                maxQuantity: ext.max,
                pricePer1000: customerPrice,
                providerCostPer1000: ext.rate,
                providerId: provider.id,
                providerServiceId: extId,
                speed: 'فوري ⚡',
                avgTime: '15 دقيقة',
                status: true,
              },
            });

            serviceByExtId.set(extId, service);
            serviceByNameAndCat.set(catNameKey, service);
            newCount++;
          } else {
            // Update provider cost if changed
            if (service.providerCostPer1000 !== ext.rate) {
              await db.service.update({
                where: { id: service.id },
                data: { providerCostPer1000: ext.rate },
              });
            }
            updatedCount++;
          }

          // 6. Upsert ServiceProvider link (Multi-Provider mapping)
          if (serviceProviderSet.has(service.id)) {
            await db.serviceProvider.update({
              where: {
                serviceId_providerId: {
                  serviceId: service.id,
                  providerId: provider.id,
                },
              },
              data: {
                externalServiceId: extId,
                costRate: ext.rate,
                min: ext.min,
                max: ext.max,
                refillSupported: Boolean(ext.refill),
                cancelSupported: Boolean(ext.cancel),
                status: true,
              },
            });
          } else {
            await db.serviceProvider.create({
              data: {
                serviceId: service.id,
                providerId: provider.id,
                externalServiceId: extId,
                costRate: ext.rate,
                min: ext.min,
                max: ext.max,
                isPrimary: provider.isPrimary,
                refillSupported: Boolean(ext.refill),
                cancelSupported: Boolean(ext.cancel),
                status: true,
              },
            });
            serviceProviderSet.add(service.id);
          }
        } catch (itemErr) {
          console.error(`Error syncing service ${ext.service} (${ext.name}):`, itemErr);
        }
      }

      // 7. Mark missing provider services as inactive
      await db.providerService.updateMany({
        where: {
          providerId: provider.id,
          externalServiceId: { notIn: Array.from(activeExternalIds) },
        },
        data: { status: false },
      });

      // 8. Update provider last sync
      await db.provider.update({
        where: { id: provider.id },
        data: {
          lastSyncAt: new Date(),
          errorCount: 0,
        },
      });

      const durationMs = Date.now() - startTime;

      // 9. Record Sync Log
      await db.syncLog.create({
        data: {
          providerId: provider.id,
          syncType: 'SERVICES',
          status: 'SUCCESS',
          itemsCount: extServices.length,
          durationMs,
        },
      });

      return {
        providerId: provider.id,
        providerName: provider.name,
        totalSynced: extServices.length,
        newServicesCount: newCount,
        updatedServicesCount: updatedCount,
        durationMs,
        success: true,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err.message || 'Sync failed';

      await db.syncLog.create({
        data: {
          providerId: provider.id,
          syncType: 'SERVICES',
          status: 'FAILED',
          itemsCount: 0,
          durationMs,
          errors: JSON.stringify({ error: errorMsg }),
        },
      });

      return {
        providerId: provider.id,
        providerName: provider.name,
        totalSynced: 0,
        newServicesCount: 0,
        updatedServicesCount: 0,
        durationMs,
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Sync services from all active providers
   */
  static async syncAllActiveProviders(): Promise<SyncResult[]> {
    const activeProviders = await db.provider.findMany({
      where: { status: true },
    });

    const results: SyncResult[] = [];
    for (const provider of activeProviders) {
      try {
        const res = await this.syncProviderServices(provider.id);
        results.push(res);
      } catch (err: any) {
        results.push({
          providerId: provider.id,
          providerName: provider.name,
          totalSynced: 0,
          newServicesCount: 0,
          updatedServicesCount: 0,
          durationMs: 0,
          success: false,
          error: err.message,
        });
      }
    }

    return results;
  }

  /**
   * Sync active order statuses from external providers
   */
  static async syncOrderStatuses(): Promise<{
    checkedCount: number;
    updatedCount: number;
  }> {
    // Find active orders that have a providerOrderId
    const activeOrders = await db.order.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
        providerOrderId: { not: null },
        providerId: { not: null },
      },
      include: {
        provider: true,
      },
      take: 50, // Batch of 50
    });

    let updatedCount = 0;

    for (const order of activeOrders) {
      if (!order.provider || !order.providerOrderId) continue;

      try {
        const adapter = ProviderFactory.getAdapter(order.provider);
        const statusRes = await adapter.getOrderStatus(order.providerOrderId);

        const mappedStatus = this.mapOrderStatus(statusRes.status);

        if (mappedStatus !== order.status) {
          await db.$transaction(async (tx) => {
            // Guard check inside transaction: ensure order is still in an active refundable state
            const current = await tx.order.findUnique({
              where: { id: order.id },
            });

            if (!current || ['COMPLETED', 'CANCELED', 'REFUNDED'].includes(current.status)) {
              return; // Already resolved, prevent duplicate refund
            }

            if (mappedStatus === 'PARTIAL' && current.status === 'PARTIAL') {
              return;
            }

            let refundAmount = 0;
            let eventType = 'STATUS_SYNCED';
            let eventMsg = `تم تحديث حالة الطلب تلقائياً من المزود: ${this.translateStatus(mappedStatus)}`;

            if (mappedStatus === 'PARTIAL' && statusRes.remains && statusRes.remains > 0) {
              const refundRatio = statusRes.remains / current.quantity;
              refundAmount = Math.round(current.price * refundRatio * 100) / 100;
              eventType = 'PARTIAL_REFUND';
              eventMsg = `اكتمل الطلب جزئياً. تم استرجاع $${refundAmount.toFixed(2)} إلى المحفظة تلقائياً عن المتبقي (${statusRes.remains}).`;
            } else if (mappedStatus === 'CANCELED' || mappedStatus === 'REFUNDED') {
              refundAmount = current.price;
              eventType = 'CANCELED_REFUND';
              eventMsg = `تم إلغاء الطلب من قبل المزود واسترجاع كامل المبلغ ($${refundAmount.toFixed(2)}) إلى المحفظة تلقائياً.`;
            }

            // If a refund is due, credit wallet inside the SAME transaction
            if (refundAmount > 0) {
              let wallet = await tx.wallet.findUnique({ where: { userId: current.userId } });
              if (!wallet) {
                wallet = await tx.wallet.create({
                  data: { userId: current.userId, balance: 0.0, currency: 'USD' },
                });
              }

              await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: refundAmount } },
              });

              await tx.walletTransaction.create({
                data: {
                  walletId: wallet.id,
                  amount: refundAmount,
                  type: 'REFUND',
                  status: 'COMPLETED',
                  referenceId: current.id,
                  description: mappedStatus === 'PARTIAL'
                    ? `استرجاع جزئي للطلب #${current.id.slice(-6)} (المتبقي: ${statusRes.remains})`
                    : `استرجاع كامل لقيمة الطلب الملغي #${current.id.slice(-6)}`,
                },
              });

              await tx.notification.create({
                data: {
                  userId: current.userId,
                  title: mappedStatus === 'PARTIAL' ? 'استرجاع جزئي للطلب 💰' : 'إلغاء واسترجاع الطلب 💰',
                  message: eventMsg,
                  type: 'WALLET',
                  link: '/orders',
                },
              });
            }

            // Update order status atomically
            await tx.order.update({
              where: { id: current.id },
              data: {
                status: mappedStatus,
                startCount: statusRes.startCount || current.startCount,
                remains: statusRes.remains !== undefined ? statusRes.remains : current.remains,
              },
            });

            // Record status history
            await tx.orderStatusHistory.create({
              data: {
                orderId: current.id,
                oldStatus: current.status,
                newStatus: mappedStatus,
                providerStatus: statusRes.status,
                remarks: `Synced from provider ${order.provider?.name || 'Provider'}`,
              },
            });

            // Log order event
            await tx.orderEvent.create({
              data: {
                orderId: current.id,
                eventType,
                message: eventMsg,
              },
            });
          });

          updatedCount++;
        }
      } catch (err: any) {
        console.warn(
          `[SyncEngine] Failed to sync status for order ${order.id}: ${err.message}`
        );
      }
    }

    return {
      checkedCount: activeOrders.length,
      updatedCount,
    };
  }

  /**
   * Helper to map provider status string to internal uppercase status
   */
  private static mapOrderStatus(providerStatus: string): string {
    const s = (providerStatus || '').toLowerCase();
    if (s.includes('complete')) return 'COMPLETED';
    if (s.includes('process') || s.includes('progress')) return 'PROCESSING';
    if (s.includes('partial')) return 'PARTIAL';
    if (s.includes('cancel')) return 'CANCELED';
    if (s.includes('refund')) return 'REFUNDED';
    return 'PROCESSING';
  }

  private static translateStatus(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'مكتمل';
      case 'PROCESSING':
        return 'قيد التنفيذ';
      case 'PARTIAL':
        return 'مكتمل جزئياً';
      case 'CANCELED':
        return 'ملغي';
      case 'REFUNDED':
        return 'مسترجع';
      default:
        return status;
    }
  }

  /**
   * Classifier: extracts standard Platform & Category from raw provider strings
   */
  private static classifyService(
    rawCategory: string,
    rawName: string
  ): {
    platformSlug: string;
    platformNameAr: string;
    categorySlug: string;
    categoryNameAr: string;
  } {
    const text = `${rawCategory} ${rawName}`.toLowerCase();

    // 1. Identify Platform
    let platformSlug = 'other';
    let platformNameAr = 'خدمات أخرى';

    if (text.includes('instagram') || text.includes('ig ')) {
      platformSlug = 'instagram';
      platformNameAr = 'إنستغرام';
    } else if (text.includes('tiktok') || text.includes('tik tok') || text.includes('tt ')) {
      platformSlug = 'tiktok';
      platformNameAr = 'تيك توك';
    } else if (text.includes('youtube') || text.includes('yt ')) {
      platformSlug = 'youtube';
      platformNameAr = 'يوتيوب';
    } else if (text.includes('facebook') || text.includes('fb ')) {
      platformSlug = 'facebook';
      platformNameAr = 'فيسبوك';
    } else if (text.includes('telegram') || text.includes('tg ')) {
      platformSlug = 'telegram';
      platformNameAr = 'تيليجرام';
    } else if (text.includes('twitter') || text.includes(' x ') || text.includes('x -') || text.includes('x /')) {
      platformSlug = 'x';
      platformNameAr = 'إكس (تويتر)';
    }

    // 2. Identify Category
    let categorySlug = 'general';
    let categoryNameAr = 'خدمات عامة';

    if (text.includes('follower') || text.includes('متابعين') || text.includes('subscriber') || text.includes('مشترك')) {
      categorySlug = 'followers';
      categoryNameAr = 'المتابعين والمشتركين';
    } else if (text.includes('like') || text.includes('لايك') || text.includes('إعجاب') || text.includes('heart')) {
      categorySlug = 'likes';
      categoryNameAr = 'الإعجابات واللايكات';
    } else if (text.includes('view') || text.includes('مشاهد') || text.includes('impression')) {
      categorySlug = 'views';
      categoryNameAr = 'المشاهدات والظهور';
    } else if (text.includes('comment') || text.includes('تعليق')) {
      categorySlug = 'comments';
      categoryNameAr = 'التعليقات المخصصة';
    } else if (text.includes('share') || text.includes('repost') || text.includes('مشارك')) {
      categorySlug = 'shares';
      categoryNameAr = 'المشاركات وإعادة النشر';
    } else if (text.includes('member') || text.includes('عضو') || text.includes('أعضاء')) {
      categorySlug = 'members';
      categoryNameAr = 'أعضاء القنوات والمجموعات';
    } else if (text.includes('reaction') || text.includes('تفاعل')) {
      categorySlug = 'reactions';
      categoryNameAr = 'تفاعلات الإيموجي';
    }

    return { platformSlug, platformNameAr, categorySlug, categoryNameAr };
  }

  private static formatPlatformName(slug: string): string {
    switch (slug) {
      case 'instagram': return 'Instagram';
      case 'tiktok': return 'TikTok';
      case 'youtube': return 'YouTube';
      case 'facebook': return 'Facebook';
      case 'telegram': return 'Telegram';
      case 'x': return 'X (Twitter)';
      default: return 'Other Platforms';
    }
  }

  private static getPlatformIcon(slug: string): string {
    switch (slug) {
      case 'instagram': return 'Instagram';
      case 'tiktok': return 'Video';
      case 'youtube': return 'Youtube';
      case 'facebook': return 'Facebook';
      case 'telegram': return 'Send';
      case 'x': return 'Twitter';
      default: return 'TrendingUp';
    }
  }
}
