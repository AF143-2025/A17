import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { syncOrderStatus } from '@/lib/order-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orderId = params.id;
  let order = await db.order.findFirst({
    where: {
      id: orderId,
      ...(user.role !== 'ADMIN' ? { userId: user.id } : {}),
    },
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
      // Do NOT expose provider credentials or sensitive provider data to normal users
      provider: user.role === 'ADMIN' ? true : false,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
  }

  // Attempt sync if order is in progress and hasn't been synced in the last 60 seconds
  if (['PENDING', 'PROCESSING'].includes(order.status)) {
    const lastSyncAgo = Date.now() - new Date(order.updatedAt).getTime();
    if (lastSyncAgo > 60 * 1000) {
      const synced = await syncOrderStatus(order.id);
      if (synced) {
        order = synced as any;
      }
    }
  }

  return NextResponse.json({ order });
}
