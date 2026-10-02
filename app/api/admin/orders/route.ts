import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { syncOrderStatus } from '@/lib/order-engine';
import { creditWalletBalance } from '@/lib/wallet';
import { ProviderRouter } from '@/lib/providers/provider-router';
import { logAdminAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');
    const providerId = searchParams.get('providerId');

    const where: any = {};
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { targetUrl: { contains: search } },
        { providerOrderId: { contains: search } },
        { user: { username: { contains: search } } },
        { user: { email: { contains: search } } },
        { service: { name: { contains: search } } },
      ];
    }
    if (status && status !== 'ALL') where.status = status;
    if (providerId && providerId !== 'ALL') where.providerId = providerId;

    const orders = await db.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
        service: {
          include: {
            category: {
              include: { platform: true },
            },
          },
        },
        provider: true,
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { orderId, action, status, remains, startCount, targetUrl, refundAmount } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { user: true, service: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // Action 1: Sync with external provider
    if (action === 'sync') {
      const synced = await syncOrderStatus(orderId);
      return NextResponse.json({ success: true, order: synced, message: 'تمت مزامنة حالة الطلب بنجاح' });
    }

    // Action 2: Refund order to user's wallet
    if (action === 'refund') {
      if (order.status === 'REFUNDED') {
        return NextResponse.json({ error: 'الطلب مسترجع مسبقاً' }, { status: 400 });
      }

      const refundAmt = refundAmount !== undefined ? parseFloat(refundAmount) : order.price;
      if (isNaN(refundAmt) || refundAmt <= 0) {
        return NextResponse.json({ error: 'مبلغ الاسترجاع غير صالح' }, { status: 400 });
      }

      // Credit wallet
      await creditWalletBalance({
        userId: order.userId,
        amount: refundAmt,
        type: 'REFUND',
        referenceId: order.id,
        description: `استرجاع مالي للطلب #${order.id.slice(-6)} بواسطة المدير (${admin.username})`,
      });

      const updated = await db.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' },
      });

      await db.orderEvent.create({
        data: {
          orderId,
          eventType: 'REFUNDED',
          message: `تم استرجاع مبلغ $${refundAmt.toFixed(2)} إلى محفظة المستخدم بواسطة المدير (${admin.username})`,
        },
      });

      await db.notification.create({
        data: {
          userId: order.userId,
          title: 'استرجاع مالي للطلب 💰',
          message: `تمت إعادة مبلغ $${refundAmt.toFixed(2)} إلى رصيد محفظتك عن الطلب #${order.id.slice(-6)}.`,
          type: 'WALLET',
          link: '/wallet',
        },
      });

      await logAdminAction({
        adminId: admin.id,
        action: 'ORDER_REFUND',
        targetType: 'ORDER',
        targetId: orderId,
        details: { refundAmount: refundAmt },
      });

      return NextResponse.json({
        success: true,
        order: updated,
        message: `تم استرجاع $${refundAmt.toFixed(2)} إلى محفظة العميل بنجاح`,
      });
    }

    // Action 3: Resend to provider
    if (action === 'resend') {
      await db.order.update({
        where: { id: orderId },
        data: { status: 'PENDING' },
      });

      try {
        await ProviderRouter.dispatchOrder({
          orderId: order.id,
          serviceId: order.serviceId,
          targetUrl: order.targetUrl,
          quantity: order.quantity,
          userId: order.userId,
        });
      } catch (e: any) {
        console.error('Failed to re-dispatch order:', e);
      }

      await db.orderEvent.create({
        data: {
          orderId,
          eventType: 'SENT_TO_PROVIDER',
          message: `تمت إعادة إرسال الطلب للمزود بواسطة المدير (${admin.username})`,
        },
      });

      return NextResponse.json({ success: true, message: 'تمت إعادة توجيه الطلب للمزود بنجاح' });
    }

    // Action 4: Update order details / status
    const data: any = {};
    if (status) data.status = status;
    if (remains !== undefined) data.remains = parseInt(remains, 10);
    if (startCount !== undefined) data.startCount = parseInt(startCount, 10);
    if (targetUrl) data.targetUrl = targetUrl.trim();

    const updated = await db.order.update({
      where: { id: orderId },
      data,
    });

    await db.orderEvent.create({
      data: {
        orderId,
        eventType: 'ADMIN_UPDATE',
        message: `تم تعديل بيانات الطلب بواسطة المدير (${admin.username}): ${JSON.stringify(data)}`,
      },
    });

    await logAdminAction({
      adminId: admin.id,
      action: 'ORDER_STATUS_UPDATE',
      targetType: 'ORDER',
      targetId: orderId,
      details: data,
    });

    return NextResponse.json({ success: true, order: updated, message: 'تم تحديث بيانات الطلب بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = req.nextUrl;
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Delete child records first
    await db.orderEvent.deleteMany({ where: { orderId } });
    await db.orderStatusHistory.deleteMany({ where: { orderId } });
    await db.orderItem.deleteMany({ where: { orderId } });
    await db.order.delete({ where: { id: orderId } });

    await logAdminAction({
      adminId: admin.id,
      action: 'ORDER_DELETE',
      targetType: 'ORDER',
      targetId: orderId,
      details: {},
    });

    return NextResponse.json({ success: true, message: 'تم حذف الطلب نهائياً بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'فشل في حذف الطلب' }, { status: 400 });
  }
}
