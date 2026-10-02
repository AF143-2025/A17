import crypto from 'crypto';
import db from '@/lib/db';
import { sendEmail } from '@/lib/email';

const OTP_SECRET = process.env.ENCRYPTION_KEY || 'esaad_secure_otp_salt_secret_key_2026';
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes strictly
const MAX_ATTEMPTS = 5;

/**
 * Generates a cryptographically secure 6-digit numeric OTP (100000 - 999999).
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Computes a cryptographic SHA-256 HMAC hash of the OTP code with a server-side salt.
 * Ensures the plaintext OTP is NEVER stored in the database.
 */
export function hashOtp(code: string, salt: string = OTP_SECRET): string {
  return crypto
    .createHmac('sha256', salt)
    .update(code.trim())
    .digest('hex');
}

/**
 * Masks an email for safe display (e.g. "mohammed@example.com" -> "m******d@example.com")
 */
export function maskEmail(email: string): string {
  const parts = email.trim().split('@');
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  const first = name[0];
  const last = name[name.length - 1];
  const stars = '*'.repeat(Math.min(name.length - 2, 6));
  return `${first}${stars}${last}@${domain}`;
}

export type OtpPurpose = 'LOGIN' | 'PASSWORD_RESET';

/**
 * Generates, hashes, stores, and sends a real OTP code to the user's email.
 * Automatically invalidates any prior unused OTP for the same (email, purpose).
 * NEVER logs plaintext OTP to console or production logs.
 * NEVER returns plaintext OTP in the function response.
 */
export async function createAndSendOtp({
  email,
  purpose,
  userId,
  ipAddress,
  username,
}: {
  email: string;
  purpose: OtpPurpose;
  userId?: string;
  ipAddress?: string;
  username?: string;
}): Promise<{ success: boolean; expiresAt?: Date; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Invalidate any existing unused OTPs for this email & purpose
  await db.emailOtp.updateMany({
    where: {
      email: cleanEmail,
      purpose,
      isUsed: false,
    },
    data: {
      isUsed: true,
    },
  });

  // 2. Generate cryptographically secure 6-digit code
  const rawCode = generateSecureOtp();
  const otpHash = hashOtp(rawCode);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  // 3. Store hashed OTP in database
  const createdRecord = await db.emailOtp.create({
    data: {
      email: cleanEmail,
      userId: userId || null,
      otpHash,
      purpose,
      expiresAt,
      attempts: 0,
      isUsed: false,
      ipAddress: ipAddress || null,
    },
  });

  // 4. Send email with clean, professional template (Zero marketing, purely auth)
  const subject =
    purpose === 'LOGIN'
      ? 'رمز التحقق لتسجيل الدخول إلى حسابك - منصة اصعد'
      : 'رمز التحقق لإعادة تعيين كلمة المرور - منصة اصعد';

  const actionText =
    purpose === 'LOGIN'
      ? 'تسجيل الدخول إلى حسابك'
      : 'إعادة تعيين كلمة المرور لحسابك';

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
            <table width="100%" max-width="520" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; padding: 36px 32px; border: 1px solid #e0f2fe; box-shadow: 0 10px 30px rgba(8, 112, 184, 0.06); text-align: right;">
              
              <!-- Brand Header -->
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <div style="display: inline-block; padding: 8px 18px; background: linear-gradient(135deg, #0284c7, #2563eb); border-radius: 14px; color: #ffffff; font-weight: 900; font-size: 18px; letter-spacing: -0.5px;">
                    اصعد | ESAAD
                  </div>
                  <div style="font-size: 11px; color: #64748b; margin-top: 6px; font-weight: 600;">
                    بوابة التحقق الآمنة
                  </div>
                </td>
              </tr>

              <!-- Greeting -->
              <tr>
                <td style="font-size: 16px; font-weight: 800; color: #0f172a; padding-bottom: 12px; text-align: right;">
                  مرحباً ${username ? `<span style="color: #2563eb;">${username}</span>` : 'عزيزنا العميل'} 👋
                </td>
              </tr>

              <!-- Body Description -->
              <tr>
                <td style="font-size: 13px; line-height: 1.7; color: #334155; padding-bottom: 20px; text-align: right;">
                  تلقينا طلباً لـ <strong>${actionText}</strong>. يرجى استخدام رمز الأمان التالي لتأكيد هويتك وإتمام العملية:
                </td>
              </tr>

              <!-- OTP Code Display Box -->
              <tr>
                <td align="center" style="padding: 10px 0 20px;">
                  <div style="display: inline-block; background-color: #f0f9ff; border: 2px dashed #0284c7; border-radius: 18px; padding: 16px 36px; text-align: center;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0284c7; display: block;">
                      ${rawCode}
                    </span>
                    <span style="font-size: 11px; font-weight: 700; color: #0369a1; margin-top: 6px; display: block;">
                      ⏱️ صالح لمدة 5 دقائق فقط
                    </span>
                  </div>
                </td>
              </tr>

              <!-- Security Notice -->
              <tr>
                <td style="background-color: #f8fafc; border-radius: 14px; padding: 14px 16px; border: 1px solid #e2e8f0; font-size: 11px; color: #475569; line-height: 1.6; text-align: right;">
                  🔒 <strong>تنبيه أمني هام:</strong>
                  <br>• لا تشارك هذا الرمز مع أي شخص إطلاقاً.
                  <br>• إذا لم تكن أنت صاحب هذا الطلب، يرجى تغيير كلمة المرور فوراً لتأمين حسابك.
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

  // 5. Send actual email
  const emailResult = await sendEmail({
    to: cleanEmail,
    subject,
    html: htmlContent,
    text: `رمز التحقق الخاص بك هو: ${rawCode} (صالح لمدة 5 دقائق فقط). لا تشارك هذا الرمز مع أي شخص.`,
  });

  // If email delivery failed, remove the stored OTP so no invalid state remains
  if (!emailResult.success) {
    await db.emailOtp.delete({
      where: { id: createdRecord.id },
    }).catch(() => {});

    return {
      success: false,
      error: emailResult.error || 'تعذر إرسال رمز التحقق إلى بريدك الإلكتروني. يرجى مراجعة إعدادات خادم البريد.',
    };
  }

  // Success: Return only confirmation and expiry. NEVER return plaintext code.
  return { success: true, expiresAt };
}

/**
 * Validates a submitted OTP code:
 * 1. Checks code existence, purpose match, and whether already used.
 * 2. Checks expiration (5 minutes).
 * 3. Enforces max 5 failed attempts per OTP.
 * 4. Compares hash in constant time (timingSafeEqual).
 * 5. IMMEDIATELY marks as isUsed = true on success to prevent replay attacks.
 */
export async function verifyStoredOtp({
  email,
  inputCode,
  purpose,
}: {
  email: string;
  inputCode: string;
  purpose: OtpPurpose;
}): Promise<{
  success: boolean;
  error?: string;
  otpRecord?: { id: string; email: string; userId: string | null };
}> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = inputCode.trim();

  if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return {
      success: false,
      error: 'يرجى إدخال رمز التحقق المكون من 6 أرقام كاملاً بصيغة صحيحة',
    };
  }

  // Find the latest active OTP for this email and purpose
  const record = await db.emailOtp.findFirst({
    where: {
      email: cleanEmail,
      purpose,
      isUsed: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!record) {
    return {
      success: false,
      error: 'لا يوجد رمز تحقق نشط أو تم استخدام الرمز مسبقاً. يرجى طلب رمز جديد.',
    };
  }

  const now = new Date();

  // Check expiration (5 minutes)
  if (now > record.expiresAt) {
    await db.emailOtp.update({
      where: { id: record.id },
      data: { isUsed: true },
    });
    return {
      success: false,
      error: 'انتهت صلاحية رمز التحقق (صلاحية الرمز 5 دقائق فقط). يرجى طلب رمز جديد.',
    };
  }

  // Check failed attempt limit (max 5)
  if (record.attempts >= MAX_ATTEMPTS) {
    await db.emailOtp.update({
      where: { id: record.id },
      data: { isUsed: true },
    });
    return {
      success: false,
      error: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم إبطال الرمز لحماية حسابك، يرجى طلب رمز جديد.',
    };
  }

  // Compare hash using timingSafeEqual
  const computedHash = hashOtp(cleanCode);
  const isMatch =
    computedHash.length === record.otpHash.length &&
    crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(record.otpHash));

  if (!isMatch) {
    const updatedAttempts = record.attempts + 1;
    const isNowLocked = updatedAttempts >= MAX_ATTEMPTS;

    await db.emailOtp.update({
      where: { id: record.id },
      data: {
        attempts: updatedAttempts,
        isUsed: isNowLocked, // Lock permanently if max reached
      },
    });

    const remaining = MAX_ATTEMPTS - updatedAttempts;
    if (remaining > 0) {
      return {
        success: false,
        error: `رمز التحقق غير صحيح. يرجى التأكد وإعادة المحاولة (متبقي ${remaining} محاولات).`,
      };
    } else {
      return {
        success: false,
        error: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم إبطال الرمز، يرجى طلب رمز جديد.',
      };
    }
  }

  // Success -> IMMEDIATELY mark as isUsed to prevent replay attacks (Single-Use OTP)
  await db.emailOtp.update({
    where: { id: record.id },
    data: { isUsed: true },
  });

  return {
    success: true,
    otpRecord: {
      id: record.id,
      email: record.email,
      userId: record.userId,
    },
  };
}
