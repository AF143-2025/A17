'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import {
  User,
  Mail,
  Phone,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  UserPlus,
  KeyRound,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  // Multi-step: 'FORM' -> 'OTP'
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');

  // Step 1: Form inputs
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });

  // Step 2: OTP State
  const [tempToken, setTempToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpCountdown, setOtpCountdown] = useState(300); // 5 minutes

  // Status & loading
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Timers
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

  useEffect(() => {
    if (step === 'OTP') {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Step 1: Submit Registration Form
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      setError('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    if (formData.password.length < 8) {
      setError('كلمة المرور يجب أن لا تقل عن 8 أحرف لضمان أمان حسابك');
      return;
    }

    if (!formData.agreeTerms) {
      setError('يرجى الموافقة على شروط الاستخدام للمتابعة');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء إنشاء الحساب');
        setLoading(false);
        return;
      }

      // If OTP verification is required (default secure path)
      if (data.otpRequired) {
        setTempToken(data.tempToken || '');
        setMaskedEmail(data.email || formData.email);
        setStep('OTP');
        setOtpCode('');
        setOtpCountdown(300);
        setResendCooldown(60);
        setSuccessMessage('تم إرسال رمز التحقق إلى بريدك الإلكتروني لتفعيل الحساب.');
      } else {
        setSuccessMessage('تم إنشاء حسابك بنجاح! جاري تحويلك...');
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1000);
      }
    } catch {
      setError('تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP to Activate Account
  const handleVerifyOtp = async (e?: React.FormEvent) => {
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'رمز التحقق غير صحيح، يرجى المحاولة ثانية');
        setLoading(false);
        return;
      }

      setSuccessMessage('تم تأكيد البريد وتفعيل حسابك بنجاح! جاري الدخول...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 800);
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
      className="min-h-screen bg-[#F0F8FF] text-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden py-10 selection:bg-blue-600 selection:text-white font-sans"
      dir="rtl"
    >
      {/* Background ambient glow effects */}
      <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-[38rem] h-[38rem] bg-gradient-to-b from-sky-200/50 via-blue-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-[440px] relative z-10 my-auto">
        <div className="rounded-3xl bg-white/95 backdrop-blur-xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(8,_112,_184,_0.08)] border border-sky-100/80 transition-all duration-300">
          
          {/* Brand Logo & Heading */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <Logo size="lg" showTagline={false} href="" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {step === 'FORM' ? 'إنشاء حساب جديد' : 'تأكيد البريد الإلكتروني'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {step === 'FORM'
                ? 'أدخل بياناتك للمتابعة وإنشاء الحساب'
                : 'أدخل رمز التحقق (6 أرقام) المرسل إلى بريدك لتفعيل حسابك'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs font-semibold leading-relaxed animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs font-semibold leading-relaxed animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: Registration Form                                                 */}
          {/* ========================================================================= */}
          {step === 'FORM' && (
            <form onSubmit={handleRegister} className="space-y-3.5 animate-in fade-in duration-200">
              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المستخدم <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="user123"
                    required
                    dir="ltr"
                    className="w-full text-right rounded-2xl bg-slate-50/60 border border-slate-200/90 px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-sans"
                  />
                  <User className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البريد الإلكتروني <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                    dir="ltr"
                    className="w-full text-right rounded-2xl bg-slate-50/60 border border-slate-200/90 px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-sans"
                  />
                  <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                </div>
              </div>

              {/* Phone (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الهاتف <span className="text-xs text-slate-400 font-normal">(اختياري)</span>
                </label>
                <div className="relative group">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+964 770 000 0000"
                    dir="ltr"
                    className="w-full text-right rounded-2xl bg-slate-50/60 border border-slate-200/90 px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-sans"
                  />
                  <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="8 أحرف على الأقل"
                    required
                    className="w-full rounded-2xl bg-slate-50/60 border border-slate-200/90 px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-sans"
                  />
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تأكيد كلمة المرور <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="أعد إدخال كلمة المرور"
                    required
                    className="w-full rounded-2xl bg-slate-50/60 border border-slate-200/90 px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-sans"
                  />
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                  />
                  <span className="text-xs text-slate-600">
                    أوافق على <span className="font-bold text-blue-600">شروط الاستخدام</span> و{' '}
                    <span className="font-bold text-blue-600">سياسة الخصوصية</span>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-600 py-3 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>جاري إنشاء الحساب وإرسال الرمز...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>إنشاء الحساب ومتابعة التحقق</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Email OTP Verification Form                                       */}
          {/* ========================================================================= */}
          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
              {/* Target Email Info Badge */}
              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-slate-800 font-mono font-bold truncate">{maskedEmail}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-600 shrink-0 bg-white px-2 py-0.5 rounded-lg border border-sky-100 shadow-sm">
                  ⏱️ {formatTime(otpCountdown)}
                </div>
              </div>

              {/* 6-Digit OTP Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
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
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(val);
                      setError('');
                    }}
                    placeholder="______"
                    required
                    autoComplete="one-time-code"
                    className="w-full text-center tracking-[0.45em] text-2xl font-mono font-black py-3.5 rounded-2xl bg-sky-50/70 border-2 border-sky-300 text-slate-900 placeholder-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none transition shadow-inner"
                  />
                  <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 text-center mt-1.5 font-medium">
                  صلاحية الرمز 5 دقائق فقط • لا يمكن الدخول دون تفعيل الحساب
                </p>
              </div>

              {/* Submit OTP Button */}
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6 || otpCountdown <= 0}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 transform active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>جاري التحقق وتفعيل الحساب...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>تأكيد وتفعيل الحساب</span>
                  </>
                )}
              </button>

              {/* Resend & Back actions */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-blue-600 hover:underline font-bold disabled:text-slate-400 flex items-center gap-1.5 transition"
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
                    setStep('FORM');
                    setError('');
                    setSuccessMessage('');
                    setOtpCode('');
                  }}
                  className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>تعديل البيانات</span>
                </button>
              </div>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
            لديك حساب بالفعل؟{' '}
            <Link
              href="/login"
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-[440px] text-center text-[11px] text-slate-600 relative z-10 mt-6 font-medium">
        <p>© {new Date().getFullYear()} اصعد (ESAAD). جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
