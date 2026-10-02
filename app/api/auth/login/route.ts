import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyPassword, signTempToken, signToken, getSessionCookieOptions } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createAndSendOtp, maskEmail } from '@/lib/otp';

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Rate limiting: 6 login attempts per minute per IP to prevent brute-forcing
    const limiter = rateLimit(`login:${ip}`, { windowMs: 60 * 1000, max: 6 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: `تم حظر المحاولات مؤقتاً لتكرار الطلب. يرجى الانتظار ${limiter.reset} ثانية قبل المحاولة مجدداً.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const identifier = (body.email || body.username || body.login || body.identifier || '').trim().toLowerCase();
    const password = body.password ? String(body.password) : null;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني وكلمة المرور' },
        { status: 400 }
      );
    }

    // Look up user by email or username
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
      include: {
        wallet: true,
      },
    });

    // Timing-attack mitigation: if user not found, perform dummy password hash check
    if (!user) {
      await verifyPassword(password, '$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV012345');
      return NextResponse.json(
        { error: 'بيانات تسجيل الدخول أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    if (user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'تم تعطيل أو تجميد هذا الحساب. يرجى مراجعة إدارة المنصة.' },
        { status: 403 }
      );
    }

    // Verify password
    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'بيانات تسجيل الدخول أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // If requested via admin portal, enforce ADMIN role strictly
    if (body.adminOnly && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالدخول عبر بوابة الإدارة. هذه البوابة مخصصة للمشرفين والإدارة فقط.' },
        { status: 403 }
      );
    }

    // If SMTP email server is not configured in .env, authenticate directly so admin/users are not locked out
    const hasSmtpConfigured = Boolean(
      process.env.SMTP_USER &&
      (process.env.SMTP_PASSWORD || process.env.SMTP_PASS)
    );

    if (!hasSmtpConfigured) {
      const token = signToken({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });

      const cookieOptions = getSessionCookieOptions();
      const response = NextResponse.json({
        success: true,
        otpRequired: false,
        message: 'تم تسجيل الدخول بنجاح.',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          balance: user.wallet?.balance || 0,
        },
      });

      response.cookies.set(cookieOptions.name, token, cookieOptions);
      return response;
    }

    // Credentials are valid and SMTP is configured -> Generate and send cryptographically secure 6-digit OTP
    const otpResult = await createAndSendOtp({
      email: user.email,
      purpose: 'LOGIN',
      userId: user.id,
      ipAddress: ip,
      username: user.username,
    });

    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.error || 'فشل إرسال رمز التحقق إلى بريدك الإلكتروني.' },
        { status: 500 }
      );
    }

    // Create a 10-minute temporary token for completing the 2FA step
    const tempToken = signTempToken({
      userId: user.id,
      email: user.email,
    });

    // Return response: strictly NEVER expose plaintext OTP code
    return NextResponse.json({
      success: true,
      otpRequired: true,
      email: maskEmail(user.email),
      tempToken,
      message: `تم إرسال رمز التحقق إلى بريدك الإلكتروني (${maskEmail(user.email)}).`,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم أثناء التحقق من البيانات' },
      { status: 500 }
    );
  }
}
