import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') || '20', 10));
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10));
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: { userId: auth.user.id },
      include: { service: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.order.count({
      where: { userId: auth.user.id },
    }),
  ]);

  return NextResponse.json({
    status: 'success',
    page,
    limit,
    total,
    orders: orders.map((o) => ({
      order: o.id,
      service: o.service.name,
      target: o.targetUrl,
      quantity: o.quantity,
      charge: o.price,
      currency: 'USD',
      status: o.status,
      remains: o.remains,
      created_at: o.createdAt,
    })),
  });
}
