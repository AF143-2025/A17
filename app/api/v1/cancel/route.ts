import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import db from '@/lib/db';
import { ProviderFactory } from '@/lib/providers/provider-factory';

export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const orderId = String(body.order || body.orderId || '').trim();

  if (!orderId) {
    return NextResponse.json({ error: 'order parameter is required' }, { status: 400 });
  }

  const order = await db.order.findFirst({
    where: { id: orderId, userId: auth.user.id },
    include: { provider: true },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status !== 'PENDING' && order.status !== 'PROCESSING') {
    return NextResponse.json({ error: 'Order cannot be canceled in its current state' }, { status: 400 });
  }

  if (order.provider && order.providerOrderId) {
    const adapter = ProviderFactory.getAdapter(order.provider);
    const canceled = await adapter.cancelOrder(order.providerOrderId);
    if (!canceled) {
      return NextResponse.json({ error: 'Provider rejected cancellation request' }, { status: 400 });
    }
  }

  // Atomically update order status and credit wallet
  await db.$transaction(async (tx) => {
    // 1. Update order status
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELED',
        remains: order.quantity,
      },
    });

    // 2. Refund wallet if order had a price
    if (order.price > 0) {
      let wallet = await tx.wallet.findUnique({
        where: { userId: auth.user.id },
      });

      if (wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: order.price,
            },
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: order.price,
            type: 'REFUND',
            status: 'COMPLETED',
            referenceId: order.id,
            description: `استرجاع كامل لمبلغ الطلب الملغى عبر API #${order.id.slice(-6)}`,
          },
        });
      }
    }

    // 3. Log order event
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        eventType: 'API_CANCELED_REFUND',
        message: `تم إلغاء الطلب بنجاح عبر API واسترجاع المبلغ ($${order.price.toFixed(2)}) إلى المحفظة تلقائياً.`,
      },
    });

    // 4. Log status history
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: 'CANCELED',
        providerStatus: 'Canceled',
        remarks: 'Canceled via API v1 cancel endpoint',
      },
    });
  });

  return NextResponse.json({
    status: 'success',
    message: 'Order canceled and funds refunded successfully',
    order: order.id,
    refunded_amount: order.price,
  });
}
