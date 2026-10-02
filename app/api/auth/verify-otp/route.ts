import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyTempToken, signToken, getSessionCookieOptions } from '@/lib/auth';
import { verifyStoredOtp } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Rate limiting: 10 verify attempts per 5 minutes per IP
    const limiter = rateLimit(`verify-otp:${ip}`, { windowMs: 5 * 60 * 1000, max: 10 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: `تم تجاوز حد المحاولات المسموح به. يرجى الانتظار ${limiter.reset} ثانية قبل المحاولة مجدداً.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { tempToken, email: rawEmail, code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'يرجى إدخال رمز التحقق المكون من 6 أرقام' },
        { status: 400 }
      );
    }

    let targetEmail = '';
    let targetUserId: string | null = null;

    if (tempToken) {
      const decoded = verifyTempToken(tempToken);
      if (!decoded) {
        return NextResponse.json(
          { error: 'انتهت صلاحية جلسة التحقق المؤقتة، يرجى إعادة تسجيل الدخول.' },
          { status: 401 }
        );
      }
      targetEmail = decoded.email;
      targetUserId = decoded.userId;
    } else if (rawEmail) {
      targetEmail = rawEmail.trim().toLowerCase();
    } else {
      return NextResponse.json(
        { error: 'بيانات التحقق غير مكتملة' },
        { status: 400 }
      );
    }

    // 1. Verify hashed OTP against database records (checks expiry, attempts <= 5, and marks isUsed = true)
    const verification = await verifyStoredOtp({
      email: targetEmail,
      inputCode: code,
      purpose: 'LOGIN',
    });

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error || 'رمز التحقق غير صحيح أو منتهي الصلاحية' },
        { status: 400 }
      );
    }

    // 2. Fetch authenticated user
    const user = await db.user.findFirst({
      where: targetUserId ? { id: targetUserId } : { email: targetEmail },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'لم يتم العثور على الحساب المرتبط' },
        { status: 404 }
      );
    }

    if (user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'هذا الحساب معطل أو مجمد. يرجى مراجعة إدارة المنصة.' },
        { status: 403 }
      );
    }

    // If requested via admin portal, enforce ADMIN role strictly
    if (body.adminOnly && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالدخول عبر بوابة الإدارة. هذه البوابة مخصصة للمشرفين والإدارة فقط.' },
        { status: 403 }
      );
    }

    // If account was pending verification, activate it now
    if (user.status === 'PENDING_VERIFICATION') {
      await db.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' },
      });
    }

    // 3. Issue full authenticated session JWT
    const token = signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // 4. Set HttpOnly, Secure, SameSite cookie
    const cookieOptions = getSessionCookieOptions();
    const response = NextResponse.json({
      success: true,
      message: 'تم التحقق بنجاح وتأكيد تسجيل الدخول.',
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
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم أثناء التحقق من الرمز' },
      { status: 500 }
    );
  }
}
