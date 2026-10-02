import db from './db';
import { creditWalletBalance } from './wallet';
import { ProviderFactory } from './providers/provider-factory';
import { ProviderRouter } from './providers/provider-router';

export interface PlaceOrderParams {
  userId: string;
  serviceId: string;
  targetUrl: string;
  quantity: number;
  couponCode?: string;
  idempotencyKey?: string;
}

export async function placeOrder({
  userId,
  serviceId,
  targetUrl,
  quantity,
  couponCode,
  idempotencyKey,
}: PlaceOrderParams) {
  // 0. Check Idempotency to prevent duplicate orders
  if (idempotencyKey) {
    const existingOrder = await db.order.findUnique({
      where: { idempotencyKey },
      include: {
        service: {
          include: {
            category: {
              include: {
                platform: true,
              },
            },
          },
        },
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (existingOrder) {
      return existingOrder;
    }
  }

  // 1. Fetch and validate service
  const service = await db.service.findUnique({
    where: { id: serviceId },
    include: {
      category: {
        include: {
          platform: true,
        },
      },
      provider: true,
      serviceProviders: {
        where: { status: true },
        include: { provider: true },
      },
    },
  });

  if (!service || !service.status) {
    throw new Error('الخدمة المطلوبة غير متوفرة حالياً');
  }

  const hasActiveProvider = Boolean(
    (service.provider && service.provider.status) ||
    service.serviceProviders?.some((sp) => sp.status && sp.provider && sp.provider.status)
  );

  if (!hasActiveProvider) {
    throw new Error('الخدمة المطلوبة غير متوفرة حالياً نظراً لإيقاف المزود الخاص بها مؤقتاً');
  }

  // 2. Validate quantity
  if (quantity < service.minQuantity || quantity > service.maxQuantity) {
    throw new Error(
      `الكمية يجب أن تكون بين ${service.minQuantity.toLocaleString('en-US')} و ${service.maxQuantity.toLocaleString('en-US')}`
    );
  }

  // 3. Validate target link/username
  const cleanedTarget = targetUrl.trim();
  if (!cleanedTarget || cleanedTarget.length < 2) {
    throw new Error('يرجى إدخال رابط الحساب أو اسم المستخدم بشكل صحيح');
  }

  // 4. Calculate pricing (USD)
  const basePrice = (quantity / 1000) * service.pricePer1000;
  const cost = (quantity / 1000) * service.providerCostPer1000;
  let finalPrice = Math.round(basePrice * 100) / 100;
  let discountAmount = 0;
  let couponRecord = null;

  // Check coupon if provided
  if (couponCode) {
    const coupon = await db.coupon.findUnique({
      where: { code: couponCode.toUpperCase().trim() },
    });

    if (
      coupon &&
      coupon.status &&
      coupon.usedCount < coupon.maxUsage &&
      (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) &&
      basePrice >= coupon.minOrderAmount
    ) {
      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = Math.round(((basePrice * coupon.discountValue) / 100) * 100) / 100;
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else {
        discountAmount = Math.min(coupon.discountValue, basePrice);
      }
      finalPrice = Math.max(0, Math.round((basePrice - discountAmount) * 100) / 100);
      couponRecord = coupon;
    }
  }

  const profit = Math.max(0, Math.round((finalPrice - cost) * 100) / 100);

  // 5. Transactional internal order creation and wallet deduction
  const order = await db.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.balance < finalPrice) {
      const currentBalance = wallet ? wallet.balance.toFixed(2) : '0.00';
      throw new Error(
        `رصيدك الحالي ($${currentBalance}) غير كافٍ. المطلوب: $${finalPrice.toFixed(2)}`
      );
    }

    const newOrder = await tx.order.create({
      data: {
        userId,
        serviceId: service.id,
        targetUrl: cleanedTarget,
        quantity,
        price: finalPrice,
        cost,
        profit,
        status: 'PENDING',
        providerId: service.providerId,
        startCount: 0,
        remains: quantity,
        idempotencyKey: idempotencyKey || null,
      },
    });

    // Deduct funds from wallet atomically
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: finalPrice,
        },
      },
    });

    // Record wallet ledger transaction
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -finalPrice,
        type: 'ORDER_PAYMENT',
        status: 'COMPLETED',
        referenceId: newOrder.id,
        description: `طلب خدمة: ${service.name} (الكمية: ${quantity.toLocaleString('en-US')})`,
        metadata: JSON.stringify({
          orderId: newOrder.id,
          serviceId: service.id,
          quantity,
          discountAmount,
        }),
      },
    });

    // Record Order Events
    await tx.orderEvent.create({
      data: {
        orderId: newOrder.id,
        eventType: 'CREATED',
        message: 'تم إنشاء الطلب بنجاح في النظام',
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: newOrder.id,
        eventType: 'PAYMENT_CONFIRMED',
        message: `تم خصم قيمة الطلب ($${finalPrice.toFixed(2)}) من المحفظة بنجاح`,
      },
    });

    // If coupon was applied, record coupon usage
    if (couponRecord) {
      await tx.couponUsage.create({
        data: {
          couponId: couponRecord.id,
          userId,
          orderId: newOrder.id,
          discountAmount,
        },
      });
      await tx.coupon.update({
        where: { id: couponRecord.id },
        data: {
          usedCount: { increment: 1 },
        },
      });
    }

    // Create in-app notification
    await tx.notification.create({
      data: {
        userId,
        title: 'تم استلام طلبك بنجاح',
        message: `طلب #${newOrder.id.slice(-6)} (${service.name}) قيد المعالجة الآن.`,
        type: 'ORDER',
        link: `/orders`,
      },
    });

    return newOrder;
  });

  // 6. Send order to Provider via Smart Provider Router with automatic failover
  try {
    await ProviderRouter.dispatchOrder({
      orderId: order.id,
      serviceId: service.id,
      targetUrl: cleanedTarget,
      quantity,
      userId,
      idempotencyKey,
    });
  } catch (routerError: any) {
    console.error('[OrderEngine] Error in ProviderRouter.dispatchOrder:', routerError);
    // Safety net: ensure order is not left in PENDING without provider order ID
    try {
      await db.$transaction(async (tx) => {
        const ord = await tx.order.findUnique({ where: { id: order.id } });
        if (ord && ord.status === 'PENDING') {
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'FAILED' },
          });

          if (ord.price > 0) {
            let wallet = await tx.wallet.findUnique({ where: { userId } });
            if (wallet) {
              await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: ord.price } },
              });

              await tx.walletTransaction.create({
                data: {
                  walletId: wallet.id,
                  amount: ord.price,
                  type: 'REFUND',
                  status: 'COMPLETED',
                  referenceId: ord.id,
                  description: `استرجاع تلقائي لفشل إرسال الطلب #${ord.id.slice(-6)} للمزود`,
                },
              });
            }
          }

          await tx.orderEvent.create({
            data: {
              orderId: ord.id,
              eventType: 'DISPATCH_FAILED_REFUND',
              message: `تعذر إرسال الطلب للمزود، تم استرجاع $${ord.price.toFixed(2)} إلى المحفظة تلقائياً.`,
            },
          });
        }
      });
    } catch (refundError) {
      console.error('[OrderEngine] Failed to auto-refund stuck order:', refundError);
    }
  }

  return await db.order.findUnique({
    where: { id: order.id },
    include: {
      service: {
        include: {
          category: {
            include: {
              platform: true,
            },
          },
        },
      },
      events: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

/**
 * Synchronizes an order status with its external provider.
 * Automatically processes partial or canceled refunds.
 */
export async function syncOrderStatus(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      provider: true,
      service: true,
    },
  });

  if (!order || !order.provider || !order.providerOrderId) {
    return order;
  }

  if (['COMPLETED', 'CANCELED', 'REFUNDED'].includes(order.status)) {
    return order;
  }

  try {
    const adapter = ProviderFactory.getAdapter(order.provider);
    const statusResult = await adapter.getOrderStatus(order.providerOrderId);

    const statusMap: Record<string, string> = {
      Pending: 'PENDING',
      Processing: 'PROCESSING',
      'In progress': 'PROCESSING',
      Completed: 'COMPLETED',
      Partial: 'PARTIAL',
      Canceled: 'CANCELED',
      Refunded: 'REFUNDED',
    };

    const newStatus = statusMap[statusResult.status] || order.status;

    if (newStatus !== order.status) {
      await db.$transaction(async (tx) => {
        // Guard check inside transaction
        const current = await tx.order.findUnique({
          where: { id: order.id },
        });

        if (!current || ['COMPLETED', 'CANCELED', 'REFUNDED'].includes(current.status)) {
          return;
        }

        if (newStatus === 'PARTIAL' && current.status === 'PARTIAL') {
          return;
        }

        let refundAmount = 0;
        let eventType = 'STATUS_UPDATED';
        let eventMsg = `تغيرت حالة الطلب إلى: ${newStatus}`;

        if (newStatus === 'PARTIAL') {
          const remains = statusResult.remains ?? 0;
          const refundRatio = remains / current.quantity;
          refundAmount = Math.round(current.price * refundRatio * 100) / 100;
          eventType = 'PARTIAL';
          eventMsg = `اكتمل الطلب جزئياً. تم استرجاع $${refundAmount.toFixed(2)} إلى المحفظة عن الكمية المتبقية (${remains}).`;
        } else if (newStatus === 'CANCELED' || newStatus === 'REFUNDED') {
          refundAmount = current.price;
          eventType = 'CANCELED_REFUND';
          eventMsg = `تم إلغاء الطلب من قبل المزود وإعادة المبلغ الكامل ($${current.price.toFixed(2)}) إلى المحفظة تلقائياً.`;
        }

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
              description: newStatus === 'PARTIAL'
                ? `استرجاع جزئي للطلب #${current.id.slice(-6)} (المتبقي: ${statusResult.remains ?? 0})`
                : `استرجاع كامل لمبلغ الطلب الملغى #${current.id.slice(-6)}`,
            },
          });

          await tx.notification.create({
            data: {
              userId: current.userId,
              title: newStatus === 'PARTIAL' ? 'استرجاع جزئي للطلب 💰' : 'إلغاء واسترجاع الطلب 💰',
              message: eventMsg,
              type: 'WALLET',
              link: '/orders',
            },
          });
        }

        await tx.order.update({
          where: { id: current.id },
          data: {
            status: newStatus,
            startCount: statusResult.startCount ?? current.startCount,
            remains: statusResult.remains ?? current.remains,
          },
        });

        await tx.orderEvent.create({
          data: {
            orderId: current.id,
            eventType,
            message: eventMsg,
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: current.id,
            oldStatus: current.status,
            newStatus,
            providerStatus: statusResult.status,
            remarks: `Synced via syncOrderStatus from ${order.provider?.name || 'Provider'}`,
          },
        });
      });
    }

    return await db.order.findUnique({
      where: { id: order.id },
      include: {
        service: true,
        events: true,
      },
    });
  } catch (error: any) {
    console.error(`Failed to sync status for order ${order.id}:`, error);
    return order;
  }
}
