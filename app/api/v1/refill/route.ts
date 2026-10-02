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

  if (order.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Refill can only be requested for completed orders' }, { status: 400 });
  }

  if (order.provider && order.providerOrderId) {
    const adapter = ProviderFactory.getAdapter(order.provider);
    const refilled = await adapter.refillOrder(order.providerOrderId);
    if (!refilled) {
      return NextResponse.json({ error: 'Provider rejected refill request' }, { status: 400 });
    }
  }

  await db.orderEvent.create({
    data: {
      orderId: order.id,
      eventType: 'REFILL_REQUESTED',
      message: 'تم تقديم طلب تعويض (Refill) إلى مزود الخدمة',
    },
  });

  return NextResponse.json({
    status: 'success',
    message: 'Refill requested successfully',
    order: order.id,
  });
}
