import crypto from 'crypto';
import db from './db';
import { hashPassword } from './auth';
import { sendEmail } from './email';

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 60 minutes

/**
 * Creates a cryptographically secure 32-byte password reset token,
 * stores its SHA-256 hash in the database, and dispatches the reset link email.
 */
export async function createAndSendPasswordResetEmail({
  email,
  origin,
}: {
  email: string;
  origin?: string;
}): Promise<{ success: boolean; error?: string; resetUrl?: string; unconfiguredSmtp?: boolean }> {
  const cleanEmail = email.trim().toLowerCase();

  // Find user
  const user = await db.user.findFirst({
    where: {
      OR: [
        { email: cleanEmail },
        { username: cleanEmail },
      ],
    },
  });

  if (!user) {
    return {
      success: false,
      error: 'هذا البريد الإلكتروني أو اسم المستخدم غير موجود في المنصة.',
    };
  }

  if (user.status === 'DISABLED' || user.status === 'SUSPENDED') {
    return {
      success: false,
      error: 'تم تعطيل أو تجميد هذا الحساب. يرجى التواصل مع إدارة المنصة.',
    };
  }

  // 1. Invalidate any existing unused reset tokens for this user
  await db.emailOtp.updateMany({
    where: {
      email: user.email,
      purpose: 'PASSWORD_RESET',
      isUsed: false,
    },
    data: {
      isUsed: true,
    },
  });

  // 2. Generate 32-byte cryptographically secure random token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  // 3. Store hashed token in database
  const createdRecord = await db.emailOtp.create({
    data: {
      email: user.email,
      userId: user.id,
      otpHash: tokenHash,
      purpose: 'PASSWORD_RESET',
      expiresAt,
      attempts: 0,
      isUsed: false,
    },
  });

  // 4. Construct Reset URL
  const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl.replace(/\/+$/, '')}/reset-password?token=${rawToken}`;

  // 5. Build professional HTML email with direct Reset Link button
  const subject = 'رابط إعادة تعيين كلمة المرور - منصة اصعد';
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F0F8FF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F0F8FF; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="540" style="max-width: 540px; background-color: #ffffff; border-radius: 24px; padding: 36px 32px; border: 1px solid #e0f2fe; box-shadow: 0 10px 30px rgba(8, 112, 184, 0.06); text-align: right;">
              
              <!-- Brand Header -->
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <div style="display: inline-block; padding: 8px 18px; background: linear-gradient(135deg, #0284c7, #2563eb); border-radius: 14px; color: #ffffff; font-weight: 900; font-size: 18px; letter-spacing: -0.5px;">
                    اصعد | ESAAD
                  </div>
                </td>
              </tr>

              <!-- Greeting -->
              <tr>
                <td style="font-size: 16px; font-weight: 800; color: #0f172a; padding-bottom: 12px; text-align: right;">
                  مرحباً ${user.username ? `<span style="color: #2563eb;">${user.username}</span>` : 'عزيزنا العميل'} 👋
                </td>
              </tr>

              <!-- Body Text -->
              <tr>
                <td style="font-size: 13px; line-height: 1.8; color: #334155; padding-bottom: 24px; text-align: right;">
                  تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في <strong>منصة اصعد</strong>.
                  <br>
                  يمكنك إعادة تعيين كلمة المرور مباشرة بالضغط على الزر أدناه:
                </td>
              </tr>

              <!-- Action CTA Button -->
              <tr>
                <td align="center" style="padding: 10px 0 28px;">
                  <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 34px; border-radius: 16px; box-shadow: 0 8px 20px rgba(2, 132, 199, 0.25);">
                    🔐 إعادة تعيين كلمة المرور
                  </a>
                </td>
              </tr>

              <!-- Plain URL fallback -->
              <tr>
                <td style="font-size: 11px; line-height: 1.6; color: #64748b; padding-bottom: 20px; text-align: right; word-break: break-all;">
                  إذا لم يعمل الزر معك، يمكنك نسخ الرابط التالي ولصقه في متصفحك:
                  <br>
                  <a href="${resetUrl}" style="color: #0284c7; text-decoration: underline;">${resetUrl}</a>
                </td>
              </tr>

              <!-- Security Warning -->
              <tr>
                <td style="background-color: #f8fafc; border-radius: 14px; padding: 14px 16px; border: 1px solid #e2e8f0; font-size: 11px; color: #475569; line-height: 1.6; text-align: right;">
                  ⏱️ <strong>ملاحظة أمنية:</strong>
                  <br>• هذا الرابط صالح لمدة <strong>60 دقيقة فقط</strong> ولا يمكن استخدامه إلا لمرة واحدة.
                  <br>• إذا لم تكن أنت من طلب إعادة التعيين، يمكنك تجاهل هذه الرسالة بأمان وستظل كلمة مرورك الحالية دون أي تغيير.
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding-top: 28px; text-align: center; border-top: 1px solid #f1f5f9; margin-top: 24px; font-size: 11px; color: #94a3b8;">
                  © ${new Date().getFullYear()} منصة اصعد - جميع الحقوق محفوظة.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // 6. Check if SMTP email provider is configured in environment
  const hasSmtpConfigured = Boolean(
    process.env.SMTP_USER &&
    (process.env.SMTP_PASSWORD || process.env.SMTP_PASS)
  );

  if (!hasSmtpConfigured) {
    console.log(`[PasswordReset] SMTP is not yet configured in .env. Reset link for ${user.email}: ${resetUrl}`);
    return {
      success: true,
    };
  }

  // 7. Send the email if SMTP is configured
  const emailResult = await sendEmail({
    to: user.email,
    subject,
    html: htmlContent,
    text: `رابط إعادة تعيين كلمة المرور لحسابك في منصة اصعد هو:\n${resetUrl}\nصالح لمدة 60 دقيقة فقط.`,
  });

  if (!emailResult.success) {
    console.error(`[PasswordReset] Email sending failed: ${emailResult.error}`);
    return {
      success: false,
      error: emailResult.error || 'تعذر إرسال رسالة البريد الإلكتروني. يرجى مراجعة إعدادات خادم البريد.',
    };
  }

  return { success: true };
}

/**
 * Validates a reset token and updates the user's password.
 * Marks the token as used so it cannot be replayed.
 */
export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!rawToken || rawToken.trim().length !== 64) {
    return { success: false, error: 'رابط استعادة كلمة المرور غير صالح أو مفقود' };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'كلمة المرور يجب أن لا تقل عن 8 أحرف' };
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

  // Look up token in database
  const record = await db.emailOtp.findFirst({
    where: {
      otpHash: tokenHash,
      purpose: 'PASSWORD_RESET',
      isUsed: false,
    },
  });

  if (!record || !record.userId) {
    return {
      success: false,
      error: 'رابط استعادة كلمة المرور غير صالح أو تم استخدامه مسبقاً. يرجى طلب رابط جديد.',
    };
  }

  // Check expiration (60 minutes)
  if (new Date() > record.expiresAt) {
    await db.emailOtp.update({
      where: { id: record.id },
      data: { isUsed: true },
    });
    return {
      success: false,
      error: 'انتهت صلاحية رابط استعادة كلمة المرور (صلاحية الرابط 60 دقيقة). يرجى طلب رابط جديد.',
    };
  }

  try {
    const passwordHash = await hashPassword(newPassword);

    // Update password in database
    await db.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });

    // Invalidate the token immediately (single use)
    await db.emailOtp.update({
      where: { id: record.id },
      data: { isUsed: true },
    });

    // Send security notification
    await db.notification.create({
      data: {
        userId: record.userId,
        title: 'تم تغيير كلمة المرور بنجاح 🔐',
        message: 'تم تحديث كلمة المرور الخاصة بحسابك عبر رابط إعادة التعيين.',
        type: 'SYSTEM',
        link: '/profile',
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return { success: false, error: 'حدث خطأ في الخادم أثناء تحديث كلمة المرور' };
  }
}
