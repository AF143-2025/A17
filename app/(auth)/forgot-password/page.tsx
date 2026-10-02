'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import {
  Mail,
  User,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('يرجى إدخال البريد الإلكتروني أو اسم المستخدم');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء معالجة الطلب');
        setLoading(false);
        return;
      }

      setIsSubmitted(true);
      setResendCooldown(60);
    } catch {
      setError('تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'فشل في إعادة إرسال الرابط');
      } else {
        setResendCooldown(60);
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F0F8FF] text-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden py-10 selection:bg-blue-600 selection:text-white font-sans"
      dir="rtl"
    >
      {/* Background ambient glow effects */}
      <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-[38rem] h-[38rem] bg-gradient-to-b from-sky-200/50 via-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-[420px] relative z-10 my-auto">
        <div className="rounded-3xl bg-white/95 backdrop-blur-xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(8,_112,_184,_0.08)] border border-sky-100/80 transition-all duration-300">
          
          {/* Brand Logo & Heading */}
          <div className="text-center mb-7">
            <div className="flex justify-center mb-3">
              <Logo size="lg" showTagline={false} href="" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              استعادة كلمة المرور
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">
              {!isSubmitted
                ? 'أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور'
                : 'تم إرسال رابط إعادة التعيين بنجاح'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs font-semibold leading-relaxed animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Step: Enter Email */}
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  البريد الإلكتروني أو اسم المستخدم المرتبط بالحساب
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="اسم المستخدم أو البريد الإلكتروني"
                    required
                    autoFocus
                    autoComplete="username"
                    dir="ltr"
                    className="w-full text-right rounded-2xl bg-slate-50/60 border border-slate-200/90 px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 font-sans"
                  />
                  <User className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 absolute right-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-600 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>جاري إرسال الرابط...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>إرسال رابط إعادة التعيين 📩</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Confirmation Step: Link Sent */
            <div className="space-y-5 animate-in fade-in duration-300 text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">
                  تم إرسال رابط إعادة التعيين بنجاح!
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  أرسلنا رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني المرتبط بالحساب:
                  <br />
                  <span className="font-mono font-bold text-blue-600 dir-ltr inline-block mt-1">
                    {email}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  يرجى فتح صندوق الوارد في بريدك الإلكتروني والضغط على الرابط لتحديد كلمة مرور جديدة. الرابط صالح لمدة <strong>60 دقيقة</strong> فقط.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2.5">
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 px-4 text-xs font-bold text-white shadow-md transition"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة لصفحة تسجيل الدخول</span>
                </Link>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="w-full text-center text-xs font-medium text-slate-500 hover:text-blue-600 disabled:text-slate-400 py-1.5 transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0
                      ? `إعادة إرسال الرابط بعد (${resendCooldown}s)`
                      : 'لم يصلك البريد؟ إعادة الإرسال'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Login Back Link */}
          {!isSubmitted && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
              تذكرت كلمة المرور؟{' '}
              <Link
                href="/login"
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition"
              >
                تسجيل الدخول
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-[420px] text-center text-[11px] text-slate-600 relative z-10 mt-6 font-medium">
        <p>© {new Date().getFullYear()} اصعد (ESAAD). جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
