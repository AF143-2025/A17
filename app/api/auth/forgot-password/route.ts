import { NextRequest, NextResponse } from 'next/server';
import { createAndSendPasswordResetEmail } from '@/lib/password-reset';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';

    // Rate limiting: 20 attempts per 15 minutes per IP
    const limiter = rateLimit(`forgot-pass:${ip}`, { windowMs: 15 * 60 * 1000, max: 20 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: `تم تجاوز حد المحاولات. يرجى الانتظار ${limiter.reset} ثانية قبل المحاولة مرة أخرى.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const identifier = (body.identifier || body.email || body.username || '').trim();

    if (!identifier) {
      return NextResponse.json(
        { error: 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم' },
        { status: 400 }
      );
    }

    // Determine the base origin (e.g. https://... or http://localhost:3000)
    const origin = req.headers.get('origin') || req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const result = await createAndSendPasswordResetEmail({
      email: identifier,
      origin,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'فشل في إرسال رابط إعادة تعيين كلمة المرور' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح. يرجى مراجعة صندوق الوارد.',
    });
  } catch (error: any) {
    console.error('Forgot password route error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}
