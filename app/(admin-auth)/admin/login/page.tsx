'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogIn,
  Lock,
  User,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Rocket,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();

  // Multi-step authentication: 'CREDENTIALS' -> 'OTP'
  const [step, setStep] = useState<'CREDENTIALS' | 'OTP'>('CREDENTIALS');

  // Step 1: Admin Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: OTP State
  const [tempToken, setTempToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpCountdown, setOtpCountdown] = useState(300); // 5 minutes in seconds

  // Status & loading
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Ref for OTP input autofocus
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Countdown timers for OTP validity and resend cooldown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpCountdown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus OTP input when switching to OTP step
  useEffect(() => {
    if (step === 'OTP') {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Step 1: Submit Credentials & Request OTP
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('يرجى إدخال اسم المستخدم أو البريد الإلكتروني للمشرف');
      return;
    }

    if (!password) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          adminOnly: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'بيانات الدخول غير صحيحة أو ليس لديك صلاحية مدير');
        setLoading(false);
        return;
      }

      if (data.otpRequired) {
        setTempToken(data.tempToken || '');
        setMaskedEmail(data.email || cleanEmail);
        setStep('OTP');
        setOtpCode('');
        setOtpCountdown(300);
        setResendCooldown(60);
        setSuccessMessage('تم التحقق من البيانات. تم إرسال رمز الأمان OTP إلى بريدك.');
      } else if (data.user) {
        router.push('/admin');
        router.refresh();
      }
    } catch {
      setError('تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setError('يرجى إدخال رمز التحقق المكون من 6 أرقام كاملاً');
      return;
    }

    if (otpCountdown <= 0) {
      setError('انتهت صلاحية رمز التحقق (5 دقائق). يرجى طلب رمز جديد.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken,
          code: cleanCode,
          adminOnly: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'رمز التحقق غير صحيح، يرجى المحاولة ثانية');
        setLoading(false);
        return;
      }

      setSuccessMessage('تم التحقق بنجاح! جاري تحويلك إلى لوحة الإدارة...');
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 700);
    } catch {
      setError('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً');
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'فشل في إعادة إرسال الرمز');
      } else {
        setResendCooldown(60);
        setOtpCountdown(300);
        setSuccessMessage('تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden py-10 selection:bg-blue-600 selection:text-white font-sans"
      dir="rtl"
    >
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-[38rem] h-[38rem] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Administrative Login Card */}
      <div className="w-full max-w-[420px] relative z-10 my-auto">
        <div className="rounded-3xl bg-slate-900/90 backdrop-blur-xl p-7 sm:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-slate-800 transition-all duration-300">
          
          {/* Brand Header: 1. اصعد -> 2. الشعار -> 3. تسجيل الدخول */}
          <div className="text-center mb-6">
            {/* 1. أول شي: اصعد مع شارة الإدارة */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-3xl font-black text-white font-sans tracking-tight">
                اصعد
              </span>
              <span className="rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold tracking-wider uppercase font-sans text-xs px-2.5 py-1">
                ESAAD
              </span>
            </div>

            {/* 2. وجواه: الشعار */}
            <div className="flex justify-center mb-4">
              <div className="relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 w-14 h-14 group">
                <Rocket className="w-7 h-7 -rotate-45 transition-transform duration-300" />
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 opacity-30 blur-sm pointer-events-none" />
              </div>
            </div>

            {/* 3. وجواه: تسجيل الدخول */}
            <h1 className="text-2xl font-black text-white tracking-tight">
              {step === 'CREDENTIALS' ? 'تسجيل دخول الإدارة' : 'رمز التحقق (OTP)'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {step === 'CREDENTIALS'
                ? 'أدخل بيانات حساب الإدارة للمتابعة'
                : 'أدخل رمز الأمان المكون من 6 أرقام المرسل إلى بريدك'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 flex items-start gap-2.5 text-rose-300 text-xs font-semibold leading-relaxed animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 flex items-start gap-2.5 text-emerald-300 text-xs font-semibold leading-relaxed animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: Admin Credentials Form                                            */}
          {/* ========================================================================= */}
          {step === 'CREDENTIALS' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 animate-in fade-in duration-200">
              {/* Admin Email or Username */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  البريد الإلكتروني أو اسم المستخدم
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
                    className="w-full text-right rounded-2xl bg-slate-800/80 border border-slate-700/80 px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 font-sans"
                  />
                  <User className="w-4 h-4 text-slate-400 group-focus-within:text-blue-400 absolute right-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-2xl bg-slate-800/80 border border-slate-700/80 px-4 py-3 pr-11 pl-11 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 font-sans"
                  />
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-blue-400 absolute right-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1 rounded-md"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                    <span>جاري تسجيل الدخول...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Email OTP Input Verification Form                                 */}
          {/* ========================================================================= */}
          {step === 'OTP' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4 animate-in fade-in duration-200">
              {/* Target Email Info Badge */}
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <User className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-slate-200 font-mono font-bold truncate">{maskedEmail}</span>
                </div>
                <div className="text-[11px] font-bold text-amber-300 shrink-0 bg-slate-900/90 px-2.5 py-0.5 rounded-lg border border-slate-700 shadow-sm">
                  ⏱️ {formatTime(otpCountdown)}
                </div>
              </div>

              {/* 6-Digit OTP Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 text-center">
                  أدخل رمز التحقق (6 أرقام)
                </label>
                <div className="relative">
                  <input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setOtpCode(val);
                      if (val.length === 6) {
                        setTimeout(() => handleOtpSubmit(), 100);
                      }
                    }}
                    placeholder="______"
                    required
                    autoComplete="one-time-code"
                    dir="ltr"
                    className="w-full text-center tracking-[0.45em] font-mono text-2xl font-black rounded-2xl bg-slate-800/90 border-2 border-blue-500/50 px-4 py-3.5 text-white placeholder-slate-600 focus:border-blue-400 focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
                  صلاحية الرمز 5 دقائق • استخدام لمرة واحدة
                </p>
              </div>

              {/* Confirm Button */}
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6 || otpCountdown <= 0}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 transform active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>جاري التحقق من الرمز...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>تأكيد تسجيل الدخول</span>
                  </>
                )}
              </button>

              {/* Actions: Resend OTP & Back */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-blue-400 hover:text-blue-300 hover:underline font-bold disabled:text-slate-600 flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0
                      ? `إعادة الإرسال بعد (${resendCooldown}s)`
                      : 'إعادة إرسال الرمز'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('CREDENTIALS');
                    setError('');
                    setSuccessMessage('');
                    setOtpCode('');
                  }}
                  className="text-slate-400 hover:text-slate-200 font-medium flex items-center gap-1 transition"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>تغيير الحساب</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Minimalist Clean Footer */}
      <footer className="w-full max-w-[420px] text-center text-[11px] text-slate-500 relative z-10 mt-6 font-medium">
        <p>© {new Date().getFullYear()} اصعد (ESAAD). لوحة الإدارة.</p>
      </footer>
    </div>
  );
}
