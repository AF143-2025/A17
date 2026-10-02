import nodemailer, { Transporter } from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465 || process.env.SMTP_SECURE === 'true',
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });

  return transporter;
}

/**
 * Sends an email using SMTP or external webhook.
 * Returns { success: true } on delivery, or { success: false, error } on failure.
 * Plaintext secrets or credentials are NEVER exposed.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<SendEmailResult> {
  const from = process.env.SMTP_FROM || `"منصة اصعد | ESAAD" <${process.env.SMTP_USER || 'no-reply@es3ad.iq'}>`;
  const mailTransporter = getTransporter();

  // 1. Try sending via SMTP
  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from,
        to,
        subject,
        html,
        text: text || subject,
      });
      return { success: true };
    } catch (err: any) {
      console.error('[EmailService] SMTP delivery error:', err?.message || err);
      return {
        success: false,
        error: `فشل في إرسال البريد عبر خادم SMTP: ${err?.message || 'خطأ في الاتصال بالخادم'}`,
      };
    }
  }

  // 2. Try external webhook if configured
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html, text, from }),
      });
      if (res.ok) return { success: true };
      return {
        success: false,
        error: `فشل في إرسال البريد عبر Webhook (رمز الاستجابة: ${res.status})`,
      };
    } catch (err: any) {
      console.error('[EmailService] Webhook dispatch error:', err?.message || err);
      return {
        success: false,
        error: 'تعذر الاتصال بمزود خدمة البريد الخارجي',
      };
    }
  }

  // 3. SMTP is not configured
  console.error('[EmailService] ⚠️ SMTP credentials missing! SMTP_HOST, SMTP_USER, SMTP_PASSWORD not configured.');
  return {
    success: false,
    error: 'خادم إرسال البريد (SMTP) غير مهيأ في إعدادات المنصة. يرجى ضبط SMTP_USER و SMTP_PASSWORD في متغيرات البيئة.',
  };
}
