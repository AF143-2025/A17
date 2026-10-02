import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { adjustWalletBalanceAdmin } from '@/lib/wallet';
import { logAdminAction } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search')?.trim();
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (role && role !== 'ALL') where.role = role;
    if (status && status !== 'ALL') where.status = status;

    const users = await db.user.findMany({
      where,
      include: {
        wallet: true,
        _count: {
          select: { orders: true, payments: true, supportTickets: true, apiKeys: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { action, userId, amount, reason, username, email, phone, password, role, initialBalance } = body;

    // Action 1: Create a new user from Admin Panel
    if (action === 'create_user') {
      if (!username || !email || !password) {
        return NextResponse.json(
          { error: 'يرجى إدخال اسم المستخدم والبريد الإلكتروني وكلمة المرور' },
          { status: 400 }
        );
      }

      const existingUser = await db.user.findFirst({
        where: {
          OR: [
            { username: username.trim().toLowerCase() },
            { email: email.trim().toLowerCase() },
          ],
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'اسم المستخدم أو البريد الإلكتروني مسجل مسبقاً' },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const startingBalance = parseFloat(initialBalance || '0');

      const newUser = await db.user.create({
        data: {
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : null,
          passwordHash,
          role: role || 'USER',
          status: 'ACTIVE',
          wallet: {
            create: {
              balance: startingBalance > 0 ? startingBalance : 0.0,
              currency: 'USD',
            },
          },
        },
        include: { wallet: true },
      });

      if (startingBalance > 0 && newUser.wallet) {
        await db.walletTransaction.create({
          data: {
            walletId: newUser.wallet.id,
            amount: startingBalance,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            description: `رصيد أولي مضاف بواسطة المدير (${admin.username})`,
          },
        });
      }

      await logAdminAction({
        adminId: admin.id,
        action: 'USER_CREATE',
        targetType: 'USER',
        targetId: newUser.id,
        details: { username: newUser.username, email: newUser.email, role: newUser.role, startingBalance },
      });

      return NextResponse.json({
        success: true,
        message: 'تم إنشاء المستخدم بنجاح',
        user: newUser,
      });
    }

    // Action 2: Wallet Balance Adjustment (Default / Legacy)
    if (!userId || amount === undefined || !reason) {
      return NextResponse.json(
        { error: 'يرجى تزويد معرف المستخدم، المبلغ، وسبب التعديل المالي' },
        { status: 400 }
      );
    }

    const adjustAmount = parseFloat(amount);
    if (isNaN(adjustAmount) || adjustAmount === 0) {
      return NextResponse.json({ error: 'المبلغ غير صالح' }, { status: 400 });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    const result = await adjustWalletBalanceAdmin({
      adminId: admin.id,
      userId,
      amount: adjustAmount,
      reason: reason.trim(),
      ipAddress,
    });

    await db.notification.create({
      data: {
        userId,
        title: 'تعديل رصيد المحفظة من الإدارة',
        message: `تم ${adjustAmount > 0 ? 'إضافة' : 'خصم'} مبلغ $${Math.abs(adjustAmount).toFixed(2)} (${reason}). الرصيد الجديد: $${result.wallet.balance.toFixed(2)}`,
        type: 'WALLET',
        link: '/wallet',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تعديل الرصيد وتوثيق العملية في سجل التدقيق بنجاح',
      wallet: result.wallet,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'فشل في العملية' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { userId, status, role, username, email, phone, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const data: any = {};
    if (status) data.status = status;
    if (role) data.role = role;
    if (username) data.username = username.trim().toLowerCase();
    if (email) data.email = email.trim().toLowerCase();
    if (phone !== undefined) data.phone = phone ? phone.trim() : null;

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
      }
      data.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data,
    });

    await logAdminAction({
      adminId: admin.id,
      action: 'USER_UPDATE',
      targetType: 'USER',
      targetId: userId,
      details: { ...data, passwordChanged: Boolean(newPassword) },
    });

    return NextResponse.json({ success: true, user: updatedUser, message: 'تم تحديث بيانات المستخدم بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'فشل التحديث' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json({ error: 'لا يمكنك حذف حسابك الشخصي الحالي' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { orders: true, payments: true },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'لا يمكن حذف حساب مدير' }, { status: 400 });
    }

    // If user has financial history, soft-disable account instead of deleting records
    if (targetUser._count.orders > 0 || targetUser._count.payments > 0) {
      await db.user.update({
        where: { id: userId },
        data: { status: 'DISABLED' },
      });

      await logAdminAction({
        adminId: admin.id,
        action: 'USER_DISABLE_ARCHIVED',
        targetType: 'USER',
        targetId: userId,
        details: {
          reason: 'حماية السجلات المالية والطلبات المرتبطة',
          ordersCount: targetUser._count.orders,
          paymentsCount: targetUser._count.payments,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'تم تعطيل الحساب وتجميده لحماية الأرشيف المحاسبي وسجلات الطلبات المرتبطة به',
      });
    }

    // If no past financial activity, allow safe clean delete
    await db.user.delete({
      where: { id: userId },
    });

    await logAdminAction({
      adminId: admin.id,
      action: 'USER_DELETE',
      targetType: 'USER',
      targetId: userId,
      details: { username: targetUser.username, email: targetUser.email },
    });

    return NextResponse.json({ success: true, message: 'تم حذف حساب المستخدم بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'فشل في معالجة طلب الحذف' }, { status: 400 });
  }
}
