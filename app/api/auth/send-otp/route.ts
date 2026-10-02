import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyTempToken } from '@/lib/auth';
import { createAndSendOtp, maskEmail, OtpPurpose } from '@/lib/otp';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Rate limiting: 4 resend requests per 10 minutes per IP
    const limiter = rateLimit(`send-otp:${ip}`, { windowMs: 10 * 60 * 1000, max: 4 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: `تم تجاوز حد طلب الرموز. يرجى الانتظار ${limiter.reset} ثانية قبل إعادة الإرسال.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { tempToken, email: rawEmail, purpose: rawPurpose } = body;

    let targetEmail = '';
    let targetUserId: string | undefined;
    let targetPurpose: OtpPurpose = (rawPurpose as OtpPurpose) || 'LOGIN';

    if (tempToken) {
      const decoded = verifyTempToken(tempToken);
      if (!decoded) {
        return NextResponse.json(
          { error: 'انتهت صلاحية الجلسة المؤقتة، يرجى تسجيل الدخول مجدداً.' },
          { status: 401 }
        );
      }
      targetEmail = decoded.email;
      targetUserId = decoded.userId;
      targetPurpose = 'LOGIN';
    } else if (rawEmail) {
      targetEmail = rawEmail.trim().toLowerCase();
    } else {
      return NextResponse.json(
        { error: 'بيانات الطلب غير مكتملة' },
        { status: 400 }
      );
    }

    // Cooldown per email (at least 45 seconds between sends)
    const emailLimiter = rateLimit(`otp-cooldown:${targetEmail}`, { windowMs: 45 * 1000, max: 1 });
    if (!emailLimiter.success) {
      return NextResponse.json(
        { error: `يرجى الانتظار ${emailLimiter.reset} ثانية قبل طلب رمز جديد.` },
        { status: 429 }
      );
    }

    // Lookup user to verify account exists and get username
    const user = await db.user.findFirst({
      where: targetUserId ? { id: targetUserId } : { email: targetEmail },
    });

    if (user && (user.status === 'DISABLED' || user.status === 'SUSPENDED')) {
      return NextResponse.json(
        { error: 'تم تعطيل هذا الحساب. يرجى مراجعة إدارة المنصة.' },
        { status: 403 }
      );
    }

    // Create and dispatch new OTP (invalidates previous ones)
    const otpResult = await createAndSendOtp({
      email: targetEmail,
      purpose: targetPurpose,
      userId: user?.id,
      ipAddress: ip,
      username: user?.username,
    });

    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.error || 'فشل إرسال رمز التحقق إلى بريدك الإلكتروني.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email: maskEmail(targetEmail),
      message: `تم إرسال رمز تحقق جديد بنجاح إلى (${maskEmail(targetEmail)}).`,
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم أثناء إرسال الرمز' },
      { status: 500 }
    );
  }
}
