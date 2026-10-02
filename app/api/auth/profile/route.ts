import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, verifyPassword, hashPassword, signToken, getSessionCookieOptions } from '@/lib/auth';
import db from '@/lib/db';
import { logAdminAction } from '@/lib/audit';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'يرجى تسجيل الدخول أولاً' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      balance: user.wallet?.balance || 0,
      createdAt: user.createdAt,
    },
  });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'يرجى تسجيل الدخول أولاً' }, { status: 401 });
  }

  try {
    const { username, email, phone, currentPassword, newPassword, confirmNewPassword } = await req.json();

    const updateData: any = {};
    let shouldUpdateSession = false;

    // 1. Update Username if provided and changed
    if (username !== undefined && username.trim().toLowerCase() !== user.username) {
      const cleanUsername = username.trim().toLowerCase();

      const usernameRegex = /^[a-z0-9_]{3,30}$/;
      if (!usernameRegex.test(cleanUsername)) {
        return NextResponse.json(
          { error: 'اسم المستخدم يجب أن يتكون من 3-30 حرف بالإنجليزية أو أرقام وشرطة سفلية فقط' },
          { status: 400 }
        );
      }

      const existingUser = await db.user.findFirst({
        where: {
          username: cleanUsername,
          id: { not: user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'اسم المستخدم مستخدم بالفعل من قبل حساب آخر' }, { status: 400 });
      }

      updateData.username = cleanUsername;
      shouldUpdateSession = true;
    }

    // 2. Update Email if provided and changed
    if (email !== undefined && email.trim().toLowerCase() !== user.email) {
      const cleanEmail = email.trim().toLowerCase();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json(
          { error: 'يرجى إدخال بريد إلكتروني صالح' },
          { status: 400 }
        );
      }

      const existingEmail = await db.user.findFirst({
        where: {
          email: cleanEmail,
          id: { not: user.id },
        },
      });

      if (existingEmail) {
        return NextResponse.json({ error: 'البريد الإلكتروني مسجل بالفعل لدى حساب آخر' }, { status: 400 });
      }

      updateData.email = cleanEmail;
      shouldUpdateSession = true;
    }

    // 3. Update Phone if provided
    if (phone !== undefined) {
      updateData.phone = phone ? phone.trim() : null;
    }

    // 4. Change Password if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'يرجى إدخال كلمة المرور الحالية لتأكيد التغيير' },
          { status: 400 }
        );
      }

      if (newPassword !== confirmNewPassword) {
        return NextResponse.json(
          { error: 'كلمتا المرور الجديدتان غير متطابقتين' },
          { status: 400 }
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'كلمة المرور الجديدة يجب أن لا تقل عن 8 أحرف لضمان الأمان' },
          { status: 400 }
        );
      }

      // Fetch user with password hash
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
      });

      if (!dbUser) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
      }

      const isCurrentValid = await verifyPassword(currentPassword, dbUser.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: 'كلمة المرور الحالية غير صحيحة' },
          { status: 400 }
        );
      }

      updateData.passwordHash = await hashPassword(newPassword);

      // Create security notification
      await db.notification.create({
        data: {
          userId: user.id,
          title: 'تغيير كلمة المرور 🔐',
          message: 'تم تحديث وتغيير كلمة مرور حسابك بنجاح.',
          type: 'SYSTEM',
          link: user.role === 'ADMIN' ? '/admin/profile' : '/profile',
        },
      });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لم يتم تعديل أي بيانات' }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // If admin, record audit log
    if (user.role === 'ADMIN') {
      await logAdminAction({
        adminId: user.id,
        action: 'ADMIN_PROFILE_UPDATE',
        targetType: 'USER',
        targetId: user.id,
        details: {
          usernameChanged: Boolean(updateData.username),
          emailChanged: Boolean(updateData.email),
          passwordChanged: Boolean(updateData.passwordHash),
        },
      });
    }

    const response = NextResponse.json({
      success: true,
      message: newPassword
        ? 'تم تحديث البيانات وتغيير كلمة المرور بنجاح'
        : 'تم حفظ وتحديث بيانات الحساب بنجاح',
      user: updatedUser,
    });

    // If username or email changed, issue an updated session cookie
    if (shouldUpdateSession) {
      const token = signToken({
        userId: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
      });
      const cookieOptions = getSessionCookieOptions();
      response.cookies.set(cookieOptions.name, token, cookieOptions);
    }

    return response;
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error.message || 'فشل في تحديث بيانات الحساب' },
      { status: 500 }
    );
  }
}
