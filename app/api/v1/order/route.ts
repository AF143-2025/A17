import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { placeOrder } from '@/lib/order-engine';

export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    let body: any;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json().catch(() => ({}));
    }

    const serviceId = String(body.service || body.serviceId || '').trim();
    const link = String(body.link || body.targetUrl || '').trim();
    const quantity = parseInt(String(body.quantity || 0), 10);
    const couponCode = body.coupon ? String(body.coupon).trim() : undefined;

    if (!serviceId) {
      return NextResponse.json({ error: 'service parameter is required' }, { status: 400 });
    }
    if (!link) {
      return NextResponse.json({ error: 'link parameter is required' }, { status: 400 });
    }
    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: 'quantity must be a positive integer' }, { status: 400 });
    }

    const order = await placeOrder({
      userId: auth.user.id,
      serviceId,
      targetUrl: link,
      quantity,
      couponCode,
    });

    if (!order) {
      return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      order: order.id,
      charge: order.price,
      currency: 'USD',
      remains: order.remains,
      order_status: order.status,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 400 });
  }
}
