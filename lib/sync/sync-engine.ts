import db from '../db';
import { ProviderFactory } from '../providers/provider-factory';
import { calculateCustomerPrice, recalculateServicePrices } from '../pricing-engine';
import { creditWalletBalance } from '../wallet';
import { invalidateServicesCache } from '../services-cache';

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

      // 1. Parallel Preload of All Necessary Tables for Ultra-Fast Bulk Ingestion
      const [
        existingPlatforms,
        existingCategories,
        pricingRules,
        existingProviderServices,
        existingServices,
        existingServiceProviders,
      ] = await Promise.all([
        db.platform.findMany(),
        db.category.findMany(),
        db.pricingRule.findMany({
          where: { status: true },
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        }),
        db.providerService.findMany({
          where: { providerId: provider.id },
          select: {
            externalServiceId: true,
            rate: true,
            min: true,
            max: true,
            name: true,
            status: true,
          },
        }),
        db.service.findMany({
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
        }),
        db.serviceProvider.findMany({
          where: { providerId: provider.id },
          select: {
            id: true,
            serviceId: true,
            costRate: true,
            min: true,
            max: true,
            refillSupported: true,
            cancelSupported: true,
          },
        }),
      ]);

      const platformCache = new Map<string, any>();
      for (const p of existingPlatforms) {
        platformCache.set(p.slug, p);
      }

      const categoryCache = new Map<string, any>();
      for (const c of existingCategories) {
        categoryCache.set(`${c.platformId}:${c.slug}`, c);
      }

      // 2. Discover and Bulk Create Missing Platforms
      const missingPlatforms = new Map<string, { name: string; nameAr: string; slug: string; icon: string; status: boolean }>();
      for (const ext of extServices) {
        const { platformSlug, platformNameAr } = SyncEngine.classifyService(ext.category || '', ext.name || '');
        if (!platformCache.has(platformSlug) && !missingPlatforms.has(platformSlug)) {
          missingPlatforms.set(platformSlug, {
            name: SyncEngine.formatPlatformName(platformSlug),
            nameAr: platformNameAr,
            slug: platformSlug,
            icon: SyncEngine.getPlatformIcon(platformSlug),
            status: true,
          });
        }
      }

      if (missingPlatforms.size > 0) {
        await db.platform.createMany({
          data: Array.from(missingPlatforms.values()),
          skipDuplicates: true,
        });
        const refreshedPlatforms = await db.platform.findMany();
        for (const p of refreshedPlatforms) {
          platformCache.set(p.slug, p);
        }
      }

      // 3. Discover and Bulk Create Missing Categories
      const missingCategories = new Map<string, { platformId: string; name: string; nameAr: string; slug: string; sortOrder: number; status: boolean }>();
      for (const ext of extServices) {
        const { platformSlug, categorySlug, categoryNameAr } = SyncEngine.classifyService(ext.category || '', ext.name || '');
        const platform = platformCache.get(platformSlug);
        if (!platform) continue;
        const catKey = `${platform.id}:${categorySlug}`;
        if (!categoryCache.has(catKey) && !missingCategories.has(catKey)) {
          missingCategories.set(catKey, {
            platformId: platform.id,
            name: categorySlug.replace(/-/g, ' '),
            nameAr: categorySlug === 'general' ? 'الخدمات العامة' : categoryNameAr,
            slug: categorySlug,
            sortOrder: SyncEngine.getCategorySortOrder(categorySlug, platformSlug),
            status: true,
          });
        }
      }

      if (missingCategories.size > 0) {
        await db.category.createMany({
          data: Array.from(missingCategories.values()),
          skipDuplicates: true,
        });
        const refreshedCategories = await db.category.findMany();
        for (const c of refreshedCategories) {
          categoryCache.set(`${c.platformId}:${c.slug}`, c);
        }
      }

      // 4. Bulk Process ProviderServices
      const existingProviderServiceMap = new Map<string, any>();
      for (const ps of existingProviderServices) {
        existingProviderServiceMap.set(ps.externalServiceId, ps);
      }

      const providerServicesToCreate: any[] = [];
      const providerServicesToUpdate: any[] = [];

      for (const ext of extServices) {
        const extId = String(ext.service);
        activeExternalIds.add(extId);

        const rate = parseFloat(String(ext.rate)) || 0;
        const min = parseInt(String(ext.min), 10) || 1;
        const max = parseInt(String(ext.max), 10) || 100000;
        const name = String(ext.name || 'Service');
        const category = String(ext.category || 'General');

        const existing = existingProviderServiceMap.get(extId);
        if (!existing) {
          providerServicesToCreate.push({
            providerId: provider.id,
            externalServiceId: extId,
            name,
            category,
            rate,
            min,
            max,
            type: ext.type || null,
            refill: Boolean(ext.refill),
            cancel: Boolean(ext.cancel),
            status: true,
          });
        } else if (
          Math.abs(existing.rate - rate) > 0.0001 ||
          existing.min !== min ||
          existing.max !== max ||
          existing.name !== name ||
          existing.status !== true
        ) {
          providerServicesToUpdate.push({
            providerId: provider.id,
            externalServiceId: extId,
            name,
            category,
            rate,
            min,
            max,
            type: ext.type || null,
            refill: Boolean(ext.refill),
            cancel: Boolean(ext.cancel),
            status: true,
          });
        }
      }

      // Ingest new provider services in chunks of 500
      for (let i = 0; i < providerServicesToCreate.length; i += 500) {
        await db.providerService.createMany({
          data: providerServicesToCreate.slice(i, i + 500),
          skipDuplicates: true,
        });
      }

      // Update changed provider services in parallel batches
      if (providerServicesToUpdate.length > 0) {
        const BATCH_SIZE = 25;
        for (let i = 0; i < providerServicesToUpdate.length; i += BATCH_SIZE) {
          const batch = providerServicesToUpdate.slice(i, i + BATCH_SIZE);
          await Promise.all(
            batch.map((item) =>
              db.providerService.update({
                where: {
                  providerId_externalServiceId: {
                    providerId: item.providerId,
                    externalServiceId: item.externalServiceId,
                  },
                },
                data: item,
              })
            )
          );
        }
      }

      // 5. Bulk Map Services and ServiceProviders
      const serviceByExtId = new Map<string, any>();
      const serviceByNameAndCat = new Map<string, any>();
      for (const s of existingServices) {
        if (s.providerServiceId) serviceByExtId.set(s.providerServiceId, s);
        serviceByNameAndCat.set(`${s.categoryId}:::${s.name.trim().toLowerCase()}`, s);
      }

      const serviceProviderMap = new Map<string, any>();
      for (const sp of existingServiceProviders) {
        serviceProviderMap.set(sp.serviceId, sp);
      }

      // Cuid-like unique ID generator for bulk inserted services
      const generateCuid = () =>
        `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 8)}`.slice(0, 25);

      const servicesToCreate: any[] = [];
      const servicesToUpdate: {
        id: string;
        providerCostPer1000: number;
        pricePer1000: number;
        minQuantity: number;
        maxQuantity: number;
        avgTime?: string | null;
      }[] = [];
      const serviceProvidersToCreate: any[] = [];
      const serviceProvidersToUpdate: any[] = [];

      for (const ext of extServices) {
        const extId = String(ext.service);
        const rate = parseFloat(String(ext.rate)) || 0;
        const min = parseInt(String(ext.min), 10) || 1;
        const max = parseInt(String(ext.max), 10) || 100000;
        const name = String(ext.name || 'Service');
        const categoryName = String(ext.category || 'General');

        const { platformSlug, categorySlug, categoryNameAr } = SyncEngine.classifyService(categoryName, name);
        const platform = platformCache.get(platformSlug);
        if (!platform) continue;
        const category = categoryCache.get(`${platform.id}:${categorySlug}`);
        if (!category) continue;

        const catNameKey = `${category.id}:::${name.trim().toLowerCase()}`;
        // Prioritize exact external ID mapping, otherwise match unassigned candidate by name & category
        let service = serviceByExtId.get(extId);
        if (!service) {
          const candidate = serviceByNameAndCat.get(catNameKey);
          if (candidate && !candidate.providerServiceId) {
            service = candidate;
            service.providerServiceId = extId;
            serviceByExtId.set(extId, service);
          }
        }

        const { customerPrice } = await calculateCustomerPrice(
          {
            providerCost: rate,
            categoryId: category.id,
            platformId: platform.id,
            serviceId: service?.id,
          },
          pricingRules
        );

        if (!service) {
          const newId = generateCuid();
          const newService = {
            id: newId,
            categoryId: category.id,
            name,
            nameAr: name,
            description: `خدمة ${categoryNameAr} عالية الجودة مع سرعة تسليم فورية واستقرار تام.`,
            minQuantity: min,
            maxQuantity: max,
            pricePer1000: customerPrice,
            providerCostPer1000: rate,
            providerId: provider.id,
            providerServiceId: extId,
            speed: 'فوري ⚡',
            avgTime: (ext as any).time || (ext as any).avg_time || null,
            status: true,
          };

          servicesToCreate.push(newService);
          service = newService;
          serviceByExtId.set(extId, service);
          serviceByNameAndCat.set(catNameKey, service);
          newCount++;
        } else {
          // Update existing service price, cost, and min/max limits
          servicesToUpdate.push({
            id: service.id,
            providerCostPer1000: rate,
            pricePer1000: customerPrice,
            minQuantity: min,
            maxQuantity: max,
            avgTime: (ext as any).time || (ext as any).avg_time || null,
          });
          updatedCount++;
        }

        const existingSp = serviceProviderMap.get(service.id);
        if (!existingSp) {
          const newSp = {
            id: generateCuid(),
            serviceId: service.id,
            providerId: provider.id,
            externalServiceId: extId,
            costRate: rate,
            min,
            max,
            isPrimary: provider.isPrimary,
            refillSupported: Boolean(ext.refill),
            cancelSupported: Boolean(ext.cancel),
            status: true,
          };
          serviceProvidersToCreate.push(newSp);
          serviceProviderMap.set(service.id, newSp);
        } else if (
          Math.abs(existingSp.costRate - rate) > 0.0001 ||
          existingSp.min !== min ||
          existingSp.max !== max ||
          existingSp.refillSupported !== Boolean(ext.refill) ||
          existingSp.cancelSupported !== Boolean(ext.cancel)
        ) {
          serviceProvidersToUpdate.push({
            id: existingSp.id,
            costRate: rate,
            min,
            max,
            refillSupported: Boolean(ext.refill),
            cancelSupported: Boolean(ext.cancel),
          });
        }
      }

      // Ingest new services in chunks of 500
      for (let i = 0; i < servicesToCreate.length; i += 500) {
        await db.service.createMany({
          data: servicesToCreate.slice(i, i + 500),
          skipDuplicates: true,
        });
      }

      // Ingest new service provider relations in chunks of 500
      for (let i = 0; i < serviceProvidersToCreate.length; i += 500) {
        await db.serviceProvider.createMany({
          data: serviceProvidersToCreate.slice(i, i + 500),
          skipDuplicates: true,
        });
      }

      // Batch update changed services (cost, price, min, max)
      if (servicesToUpdate.length > 0) {
        const BATCH_SIZE = 50;
        for (let i = 0; i < servicesToUpdate.length; i += BATCH_SIZE) {
          const batch = servicesToUpdate.slice(i, i + BATCH_SIZE);
          await Promise.all(
            batch.map((item) =>
              db.service.update({
                where: { id: item.id },
                data: {
                  providerCostPer1000: item.providerCostPer1000,
                  pricePer1000: item.pricePer1000,
                  minQuantity: item.minQuantity,
                  maxQuantity: item.maxQuantity,
                  ...(item.avgTime !== undefined ? { avgTime: item.avgTime } : {}),
                  status: true,
                },
              })
            )
          );
        }
      }

      // Batch update changed service provider relations
      if (serviceProvidersToUpdate.length > 0) {
        const BATCH_SIZE = 25;
        for (let i = 0; i < serviceProvidersToUpdate.length; i += BATCH_SIZE) {
          const batch = serviceProvidersToUpdate.slice(i, i + BATCH_SIZE);
          await Promise.all(
            batch.map((item) =>
              db.serviceProvider.update({
                where: { id: item.id },
                data: {
                  costRate: item.costRate,
                  min: item.min,
                  max: item.max,
                  refillSupported: item.refillSupported,
                  cancelSupported: item.cancelSupported,
                },
              })
            )
          );
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

      // Also mark internal services linked to this provider as inactive if removed from provider
      await db.service.updateMany({
        where: {
          providerId: provider.id,
          providerServiceId: { notIn: Array.from(activeExternalIds) },
        },
        data: { status: false },
      });

      // Clear cache so updated services and prices are immediately reflected to all users
      invalidateServicesCache();

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

    if (text.includes('instagram') || text.includes('ig ') || text.includes('انستقرام') || text.includes('إنستغرام')) {
      platformSlug = 'instagram';
      platformNameAr = 'إنستغرام';
    } else if (text.includes('tiktok') || text.includes('tik tok') || text.includes('tt ') || text.includes('تيك توك')) {
      platformSlug = 'tiktok';
      platformNameAr = 'تيك توك';
    } else if (text.includes('youtube') || text.includes('yt ') || text.includes('يوتيوب')) {
      platformSlug = 'youtube';
      platformNameAr = 'يوتيوب';
    } else if (text.includes('facebook') || text.includes('fb ') || text.includes('فيسبوك')) {
      platformSlug = 'facebook';
      platformNameAr = 'فيسبوك';
    } else if (text.includes('telegram') || text.includes('tg ') || text.includes('تيليجرام') || text.includes('تليجرام')) {
      platformSlug = 'telegram';
      platformNameAr = 'تيليجرام';
    } else if (text.includes('twitter') || text.includes(' x ') || text.includes('x -') || text.includes('x /') || text.includes('تويتر') || text.includes('تغريد')) {
      platformSlug = 'x';
      platformNameAr = 'إكس (تويتر)';
    } else if (text.includes('snapchat') || text.includes('snap') || text.includes('سناب')) {
      platformSlug = 'snapchat';
      platformNameAr = 'سناب شات';
    } else if (text.includes('threads') || text.includes('ثريدز')) {
      platformSlug = 'threads';
      platformNameAr = 'ثريدز';
    } else if (text.includes('twitch') || text.includes('تويتش')) {
      platformSlug = 'twitch';
      platformNameAr = 'تويتش';
    } else if (text.includes('discord') || text.includes('ديسكورد')) {
      platformSlug = 'discord';
      platformNameAr = 'ديسكورد';
    } else if (text.includes('whatsapp') || text.includes('واتساب')) {
      platformSlug = 'whatsapp';
      platformNameAr = 'واتساب';
    } else if (text.includes('linkedin') || text.includes('لينكد')) {
      platformSlug = 'linkedin';
      platformNameAr = 'لينكد إن';
    }

    // 2. Identify Category
    let categorySlug = 'general';
    let categoryNameAr = 'الخدمات العامة';

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
    } else if (text.includes('watch') || text.includes('ساعات')) {
      categorySlug = 'watch-time';
      categoryNameAr = 'ساعات المشاهدة';
    } else if (text.includes('live') || text.includes('stream') || text.includes('بث')) {
      categorySlug = 'livestream';
      categoryNameAr = 'مشاهدات البث المباشر';
    } else if (text.includes('save') || text.includes('حفظ') || text.includes('مفضلة')) {
      categorySlug = 'saves';
      categoryNameAr = 'الحفظ والمفضلة';
    } else if (text.includes('vote') || text.includes('poll') || text.includes('تصويت')) {
      categorySlug = 'votes';
      categoryNameAr = 'التصويت والاستطلاعات';
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
      case 'snapchat': return 'Snapchat';
      case 'threads': return 'Threads';
      case 'twitch': return 'Twitch';
      case 'discord': return 'Discord';
      case 'whatsapp': return 'WhatsApp';
      case 'linkedin': return 'LinkedIn';
      default: return 'Other Platforms';
    }
  }

  static getCategorySortOrder(categorySlug: string, platformSlug?: string): number {
    switch (categorySlug) {
      case 'general': return 1;          // 1. الخدمات العامة
      case 'followers': return 2;        // 2. المتابعين والمشتركين
      case 'members': return (platformSlug === 'telegram') ? 2 : 8; // أعضاء القنوات (تيليجرام: 2)
      case 'likes': return 3;            // 3. الإعجابات واللايكات
      case 'views': return 4;            // 4. المشاهدات والظهور
      case 'reactions': return 5;        // 5. تفاعلات الإيموجي
      case 'comments': return 6;         // 6. التعليقات المخصصة
      case 'shares': return 7;           // 7. المشاركات وإعادة النشر
      case 'watch-time': return 9;       // 9. ساعات المشاهدة
      case 'livestream': return 10;      // 10. مشاهدات البث المباشر
      case 'saves': return 11;           // 11. الحفظ والمفضلة
      case 'votes': return 12;           // 12. التصويت والاستطلاعات
      default: return 99;
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
      case 'snapchat': return 'Ghost';
      case 'threads': return 'AtSign';
      case 'twitch': return 'Tv';
      case 'discord': return 'MessageSquare';
      case 'whatsapp': return 'Phone';
      case 'linkedin': return 'Briefcase';
      default: return 'TrendingUp';
    }
  }
}
