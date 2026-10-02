import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import db from '@/lib/db';
import { syncOrderStatus } from '@/lib/order-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateApiKey(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const orderId = params.id;
  let order = await db.order.findFirst({
    where: {
      id: orderId,
      userId: auth.user.id,
    },
    include: {
      service: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Attempt sync if order is still processing
  if (['PENDING', 'PROCESSING'].includes(order.status)) {
    const synced = await syncOrderStatus(order.id);
    if (synced) {
      order = synced as any;
    }
  }

  return NextResponse.json({
    status: 'success',
    order: order!.id,
    service_id: order!.serviceId,
    service_name: order!.service.name,
    target: order!.targetUrl,
    charge: order!.price,
    currency: 'USD',
    start_count: order!.startCount,
    status_order: order!.status,
    remains: order!.remains,
    created_at: order!.createdAt,
  });
}
