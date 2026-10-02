import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { verifyStoredOtp } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Rate limiting: 6 attempts per 10 minutes per IP
    const limiter = rateLimit(`change-password:${ip}`, { windowMs: 10 * 60 * 1000, max: 6 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: `تم تجاوز حد المحاولات. يرجى الانتظار ${limiter.reset} ثانية قبل المحاولة مجدداً.` },
        { status: 429 }
      );
    }

    const { email, code, newPassword, confirmPassword } = await req.json();

    if (!email || !code || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'يرجى ملء جميع الحقول المطلوبة' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'كلمتا المرور غير متطابقتين' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن لا تقل عن 8 أحرف لضمان أمان الحساب' },
        { status: 400 }
      );
    }

    // 1. Verify hashed OTP from database (5 minutes expiry, max 5 attempts, auto-invalidate on success)
    const verification = await verifyStoredOtp({
      email: cleanEmail,
      inputCode: cleanCode,
      purpose: 'PASSWORD_RESET',
    });

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error || 'رمز التحقق غير صحيح أو منتهي الصلاحية' },
        { status: 400 }
      );
    }

    // 2. Find associated user
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'تعذر العثور على الحساب المطلوب' },
        { status: 404 }
      );
    }

    if (user.status === 'DISABLED') {
      return NextResponse.json(
        { error: 'هذا الحساب معطل حالياً' },
        { status: 403 }
      );
    }

    // 3. Hash new password with bcrypt
    const passwordHash = await hashPassword(newPassword);

    // 4. Update user password
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // 5. Send security notification to user account
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'تنبيه أمان: تم تغيير كلمة المرور 🔐',
        message: 'تم تغيير كلمة المرور لحسابك بنجاح عبر تأكيد رمز البريد الإلكتروني (OTP).',
        type: 'SYSTEM',
        link: '/profile',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم أثناء تحديث كلمة المرور' },
      { status: 500 }
    );
  }
}
