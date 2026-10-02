import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { placeOrder } from '@/lib/order-engine';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '15', 10));
  const status = searchParams.get('status');
  const platform = searchParams.get('platform');
  const search = searchParams.get('search')?.trim();

  const skip = (page - 1) * limit;

  const whereClause: any = {
    userId: user.id,
  };

  if (status && status !== 'ALL') {
    if (status === 'IN_PROGRESS') {
      whereClause.status = { in: ['IN_PROGRESS', 'PROCESSING'] };
    } else if (status === 'PROCESSING') {
      whereClause.status = { in: ['PROCESSING', 'IN_PROGRESS'] };
    } else if (status === 'REFUNDED') {
      whereClause.status = { in: ['REFUNDED', 'FAILED'] };
    } else {
      whereClause.status = status;
    }
  }

  if (platform && platform !== 'ALL') {
    whereClause.service = {
      category: {
        platform: {
          slug: platform,
        },
      },
    };
  }

  if (search) {
    whereClause.OR = [
      { id: { contains: search } },
      { targetUrl: { contains: search } },
      { service: { name: { contains: search } } },
    ];
  }

  const [orders, total, counts] = await Promise.all([
    db.order.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.order.count({ where: whereClause }),
    db.order.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: true,
    }),
  ]);

  const statusCounts: Record<string, number> = {
    ALL: 0,
    PENDING: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    PARTIAL: 0,
    PROCESSING: 0,
    CANCELED: 0,
    REFUNDED: 0,
    FAILED: 0,
  };

  let totalAll = 0;
  for (const c of counts) {
    totalAll += c._count;
    if (c.status === 'PENDING') statusCounts.PENDING += c._count;
    else if (c.status === 'IN_PROGRESS') {
      statusCounts.IN_PROGRESS += c._count;
    } else if (c.status === 'PROCESSING') {
      statusCounts.PROCESSING += c._count;
      statusCounts.IN_PROGRESS += c._count;
    } else if (c.status === 'COMPLETED') statusCounts.COMPLETED += c._count;
    else if (c.status === 'PARTIAL') statusCounts.PARTIAL += c._count;
    else if (c.status === 'CANCELED') statusCounts.CANCELED += c._count;
    else if (c.status === 'REFUNDED') statusCounts.REFUNDED += c._count;
    else if (c.status === 'FAILED') {
      statusCounts.FAILED += c._count;
      statusCounts.REFUNDED += c._count; // Counted in refund ledger as well
    }
  }
  statusCounts.ALL = totalAll;

  // Sanitize orders for regular users (do not leak internal costs, provider IDs or profit)
  const safeOrders = user.role === 'ADMIN' ? orders : orders.map((o) => {
    const { cost, profit, providerId, providerOrderId, idempotencyKey, ...restOrder } = o as any;
    let safeService = restOrder.service;
    if (safeService) {
      const { providerCostPer1000, providerId: sProviderId, providerServiceId, ...restService } = safeService;
      safeService = restService;
    }
    return {
      ...restOrder,
      service: safeService,
    };
  });

  return NextResponse.json({
    orders: safeOrders,
    statusCounts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'يرجى تسجيل الدخول أولاً' }, { status: 401 });
  }

  try {
    const { serviceId, targetUrl, quantity, couponCode, idempotencyKey } = await req.json();

    if (!serviceId || !targetUrl || !quantity) {
      return NextResponse.json(
        { error: 'يرجى تحديد الخدمة، الرابط المستهدف، والكمية المطلوبة' },
        { status: 400 }
      );
    }

    const order = await placeOrder({
      userId: user.id,
      serviceId,
      targetUrl,
      quantity: parseInt(quantity, 10),
      couponCode,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      message: 'تم إرسال الطلب بنجاح',
      order,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'فشل في إنشاء الطلب' },
      { status: 400 }
    );
  }
}
