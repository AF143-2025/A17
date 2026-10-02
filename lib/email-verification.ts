import crypto from 'crypto';

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  payload: {
    username: string;
    email: string;
    phone?: string | null;
    passwordHash: string;
  };
}

// In-memory store for email verification OTPs (keyed by lowercase email)
const otpStore = new Map<string, OtpRecord>();

// Clean up expired OTPs every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    otpStore.forEach((record, email) => {
      if (now > record.expiresAt) {
        otpStore.delete(email);
      }
    });
  }, 5 * 60 * 1000);
}

/**
 * Generates and stores a 6-digit verification code for the given email.
 * Valid for 10 minutes.
 */
export async function sendEmailVerificationCode(
  email: string,
  payload: {
    username: string;
    email: string;
    phone?: string | null;
    passwordHash: string;
  }
): Promise<{ success: boolean; code: string; message: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // Generate cryptographically random 6-digit numeric code (100000 - 999999)
  const randomBuffer = crypto.randomBytes(3);
  const codeInt = randomBuffer.readUIntBE(0, 3) % 900000 + 100000;
  const code = codeInt.toString();

  // 10 minutes expiry (600,000 ms)
  const expiresAt = Date.now() + 10 * 60 * 1000;

  otpStore.set(cleanEmail, {
    code,
    expiresAt,
    attempts: 0,
    payload,
  });

  console.log(`[EmailVerification] Generated OTP for ${cleanEmail}: ${code} (Expires in 10m)`);

  // If a webhook or SMTP email service is configured in .env, attempt sending:
  const mailWebhookUrl = process.env.EMAIL_WEBHOOK_URL;
  if (mailWebhookUrl) {
    try {
      await fetch(mailWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cleanEmail,
          subject: 'رمز التحقق لتسجيل حسابك في منصة اصعد (ESAAD)',
          code,
        }),
      });
    } catch (err) {
      console.warn('[EmailVerification] Failed to dispatch via external email webhook:', err);
    }
  }

  return {
    success: true,
    code,
    message: `تم إرسال رمز التحقق إلى ${cleanEmail}`,
  };
}

/**
 * Validates the verification code submitted by the user.
 * Rejects if incorrect, expired, or too many failed attempts.
 */
export function verifyEmailCode(
  email: string,
  inputCode: string
): { success: boolean; error?: string; payload?: OtpRecord['payload'] } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = inputCode.trim();

  const record = otpStore.get(cleanEmail);

  if (!record) {
    return {
      success: false,
      error: 'لم يتم العثور على رمز تحقق نشط لهذا البريد. يرجى طلب رمز جديد.',
    };
  }

  // Check expiration
  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return {
      success: false,
      error: 'انتهت صلاحية رمز التحقق (الصلاحية 10 دقائق). يرجى طلب رمز جديد.',
    };
  }

  // Check brute-force attempts on this OTP
  if (record.attempts >= 5) {
    otpStore.delete(cleanEmail);
    return {
      success: false,
      error: 'تم تجاوز عدد المحاولات الخاطئة المسموح بها لهذا الرمز. يرجى طلب رمز جديد.',
    };
  }

  // Verify the code
  if (record.code !== cleanCode) {
    record.attempts += 1;
    const remaining = 5 - record.attempts;
    return {
      success: false,
      error: `رمز التحقق غير صحيح. يرجى التأكد وإعادة المحاولة (متبقي ${remaining} محاولات).`,
    };
  }

  // Successful verification -> delete record to prevent replay
  const payload = record.payload;
  otpStore.delete(cleanEmail);

  return {
    success: true,
    payload,
  };
}
