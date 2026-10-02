import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithToken } from '@/lib/password-reset';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';

    // Rate limiting: 6 attempts per 15 minutes per IP
    const limiter = rateLimit(`reset-pass:${ip}`, { windowMs: 15 * 60 * 1000, max: 6 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: `تم تجاوز حد المحاولات. يرجى الانتظار ${limiter.reset} ثانية.` },
        { status: 429 }
      );
    }

    const { token, password, confirmPassword } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'رمز استعادة كلمة المرور مفقود أو غير صالح' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور الجديدة يجب أن لا تقل عن 8 أحرف' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'كلمتا المرور غير متطابقتين' },
        { status: 400 }
      );
    }

    const result = await resetPasswordWithToken(token, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'فشل في تحديث كلمة المرور' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم تعيين كلمة المرور الجديدة بنجاح. يمكنك الآن تسجيل الدخول.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم أثناء إعادة تعيين كلمة المرور' },
      { status: 500 }
    );
  }
}
