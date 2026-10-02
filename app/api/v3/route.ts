import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { authenticateApiKey } from '@/lib/api-auth';
import { placeOrder } from '@/lib/order-engine';

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, any> = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json().catch(() => ({}));
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        body = Object.fromEntries(formData.entries());
      }
    } else {
      // Try parsing json or query
      body = await req.json().catch(() => ({}));
    }

    // Merge searchParams for fallback
    req.nextUrl.searchParams.forEach((val, key) => {
      if (!body[key]) body[key] = val;
    });

    const apiKey = body.key || body.apiKey || body.api_key;
    const auth = await authenticateApiKey(req, apiKey);

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const user = auth.user;
    const action = String(body.action || '').trim().toLowerCase();

    // -------------------------------------------------------------
    // ACTION 1: services - List all available platform services
    // -------------------------------------------------------------
    if (action === 'services') {
      const services = await db.service.findMany({
        where: {
          status: true,
          OR: [
            { provider: { status: true } },
            { serviceProviders: { some: { status: true, provider: { status: true } } } },
          ],
        },
        include: {
          category: true,
        },
        orderBy: [
          { category: { sortOrder: 'asc' } },
          { sortOrder: 'asc' },
        ],
      });

      const response = services.map((s) => ({
        service: s.id,
        name: s.name,
        type: 'Default',
        category: s.category?.name || 'عام',
        rate: s.pricePer1000.toFixed(4),
        min: String(s.minQuantity),
        max: String(s.maxQuantity),
        dripfeed: false,
        refill: true,
        cancel: true,
      }));

      return NextResponse.json(response);
    }

    // -------------------------------------------------------------
    // ACTION 2: balance - Check account wallet balance
    // -------------------------------------------------------------
    if (action === 'balance') {
      const balance = user.wallet?.balance ?? 0;
      return NextResponse.json({
        balance: balance.toFixed(2),
        currency: 'USD',
      });
    }

    // -------------------------------------------------------------
    // ACTION 3: add - Place a new order
    // -------------------------------------------------------------
    if (action === 'add') {
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
        userId: user.id,
        serviceId,
        targetUrl: link,
        quantity,
        couponCode,
      });

      if (!order) {
        return NextResponse.json({ error: 'Failed to place order' }, { status: 400 });
      }

      return NextResponse.json({
        order: order.id,
      });
    }

    // -------------------------------------------------------------
    // ACTION 4: status - Check order status (single or multiple)
    // -------------------------------------------------------------
    if (action === 'status') {
      const statusMap: Record<string, string> = {
        PENDING: 'Pending',
        PROCESSING: 'Processing',
        IN_PROGRESS: 'In progress',
        COMPLETED: 'Completed',
        PARTIAL: 'Partial',
        CANCELED: 'Canceled',
        FAILED: 'Canceled',
        REFUNDED: 'Refunded',
      };

      // Multiple orders check (e.g., orders="123,124,125")
      if (body.orders) {
        const orderIds = String(body.orders)
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);

        const orders = await db.order.findMany({
          where: {
            id: { in: orderIds },
            userId: user.id,
          },
        });

        const result: Record<string, any> = {};
        for (const orderId of orderIds) {
          const found = orders.find((o) => o.id === orderId);
          if (found) {
            result[orderId] = {
              charge: found.price.toFixed(4),
              start_count: String(found.startCount ?? 0),
              status: statusMap[found.status] || 'Processing',
              remains: String(found.remains ?? 0),
              currency: 'USD',
            };
          } else {
            result[orderId] = { error: 'Incorrect order ID' };
          }
        }

        return NextResponse.json(result);
      }

      // Single order check (e.g., order="123")
      const orderId = String(body.order || '').trim();
      if (!orderId) {
        return NextResponse.json({ error: 'order parameter is required' }, { status: 400 });
      }

      const order = await db.order.findFirst({
        where: { id: orderId, userId: user.id },
      });

      if (!order) {
        return NextResponse.json({ error: 'Incorrect order ID' }, { status: 404 });
      }

      return NextResponse.json({
        charge: order.price.toFixed(4),
        start_count: String(order.startCount ?? 0),
        status: statusMap[order.status] || 'Processing',
        remains: String(order.remains ?? 0),
        currency: 'USD',
      });
    }

    // -------------------------------------------------------------
    // ACTION 5: refill - Request refill for an order
    // -------------------------------------------------------------
    if (action === 'refill') {
      const orderId = String(body.order || '').trim();
      if (!orderId) {
        return NextResponse.json({ error: 'order parameter is required' }, { status: 400 });
      }

      const order = await db.order.findFirst({
        where: { id: orderId, userId: user.id },
      });

      if (!order) {
        return NextResponse.json({ error: 'Incorrect order ID' }, { status: 404 });
      }

      return NextResponse.json({
        refill: order.id,
      });
    }

    // -------------------------------------------------------------
    // ACTION 6: cancel - Cancel order
    // -------------------------------------------------------------
    if (action === 'cancel') {
      const orderId = String(body.order || '').trim();
      if (!orderId) {
        return NextResponse.json({ error: 'order parameter is required' }, { status: 400 });
      }

      const order = await db.order.findFirst({
        where: { id: orderId, userId: user.id },
      });

      if (!order) {
        return NextResponse.json({ error: 'Incorrect order ID' }, { status: 404 });
      }

      if (order.status !== 'PENDING') {
        return NextResponse.json({ error: 'Order cannot be canceled in its current status' }, { status: 400 });
      }

      await db.order.update({
        where: { id: order.id },
        data: { status: 'CANCELED' },
      });

      return NextResponse.json({
        cancel: order.id,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: services, balance, add, status, refill, cancel' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('SMM API v3 Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'online',
    version: '3.0',
    protocol: 'Standard SMM API v3',
    endpoint: '/api/v3',
    documentation: 'Send POST requests with key and action (services, balance, add, status, refill, cancel)',
  });
}
