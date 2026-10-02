import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, signTempToken, signToken, getSessionCookieOptions } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createAndSendOtp, maskEmail } from '@/lib/otp';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';

    // Rate limiting: 5 registrations per 15 minutes per IP
    const limiter = rateLimit(`register:${ip}`, { windowMs: 15 * 60 * 1000, max: 5 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: `تم تجاوز حد إنشاء الحسابات. يرجى المحاولة بعد ${limiter.reset} ثانية.` },
        { status: 429 }
      );
    }

    // Check allow_registration platform setting
    const regSetting = await db.setting.findUnique({ where: { key: 'allow_registration' } });
    if (regSetting && regSetting.value === 'false') {
      return NextResponse.json(
        { error: 'التسجيل في المنصة مغلق حالياً مؤقتاً بقرار من الإدارة' },
        { status: 403 }
      );
    }

    const { username, email, phone, password, confirmPassword } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'يرجى ملء جميع الحقول المطلوبة' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Username format validation
    const usernameRegex = /^[a-z0-9_]{3,30}$/;
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json(
        { error: 'اسم المستخدم يجب أن يتكون من 3-30 حرف باللغة الإنجليزية أو أرقام وشرطة سفلية فقط' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'يرجى إدخال بريد إلكتروني صحيح' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'كلمتا المرور غير متطابقتين' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن لا تقل عن 8 أحرف لضمان أمان حسابك' },
        { status: 400 }
      );
    }

    // Check if username or email is already taken
    const existing = await db.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: cleanEmail },
        ],
      },
    });

    if (existing) {
      if (existing.username === cleanUsername) {
        return NextResponse.json({ error: 'اسم المستخدم مستخدم بالفعل' }, { status: 400 });
      }
      return NextResponse.json({ error: 'البريد الإلكتروني مسجل بالفعل' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const hasSmtpConfigured = Boolean(
      process.env.SMTP_USER &&
      (process.env.SMTP_PASSWORD || process.env.SMTP_PASS)
    );

    // Create user and wallet inside transaction
    const newUser = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          phone: phone ? phone.trim() : null,
          passwordHash,
          role: 'USER',
          status: hasSmtpConfigured ? 'PENDING_VERIFICATION' : 'ACTIVE',
          wallet: {
            create: {
              balance: 0.0,
              currency: 'USD',
            },
          },
        },
        include: {
          wallet: true,
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'مرحباً بك في منصة اصعد! 🚀',
          message: hasSmtpConfigured
            ? 'تم إنشاء حسابك بنجاح. يرجى تفعيل الحساب برمز التحقق المرسل إلى بريدك.'
            : 'تم إنشاء حسابك بنجاح وجاهز للاستخدام الفوري.',
          type: 'SYSTEM',
          link: '/dashboard',
        },
      });

      return user;
    });

    // If SMTP is not yet configured, log the user in immediately
    if (!hasSmtpConfigured) {
      const token = signToken({
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      });

      const cookieOptions = getSessionCookieOptions();
      const response = NextResponse.json({
        success: true,
        otpRequired: false,
        message: 'تم إنشاء الحساب وتسجيل الدخول بنجاح!',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          balance: newUser.wallet?.balance || 0,
        },
      });

      response.cookies.set(cookieOptions.name, token, cookieOptions);
      return response;
    }

    // Generate and send 6-digit OTP to the registered email
    const otpResult = await createAndSendOtp({
      email: newUser.email,
      purpose: 'LOGIN',
      userId: newUser.id,
      ipAddress: ip,
      username: newUser.username,
    });

    if (!otpResult.success) {
      // Rollback newly created pending user to avoid trapping the email/username
      await db.user.delete({ where: { id: newUser.id } }).catch(() => {});

      return NextResponse.json(
        { error: otpResult.error || 'فشل إرسال رمز التحقق إلى بريدك الإلكتروني.' },
        { status: 500 }
      );
    }

    // Create 10-minute temporary token for completing registration OTP step
    const tempToken = signTempToken({
      userId: newUser.id,
      email: newUser.email,
    });

    return NextResponse.json({
      success: true,
      otpRequired: true,
      tempToken,
      email: maskEmail(newUser.email),
      message: `تم إنشاء الحساب بنجاح! تم إرسال رمز التحقق إلى بريدك الإلكتروني (${maskEmail(newUser.email)}).`,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الحساب' }, { status: 500 });
  }
}
