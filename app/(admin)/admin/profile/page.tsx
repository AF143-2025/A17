'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  Save,
  KeyRound,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react';

interface UserData {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function AdminProfilePage() {
  const router = useRouter();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Logout state
  const [loggingOut, setLoggingOut] = useState(false);

  // Fetch current admin profile
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUserData(data.user);
          setUsername(data.user.username);
          setEmail(data.user.email);
          setPhone(data.user.phone || '');
        }
      }
    } catch (err) {
      console.error('Failed to load admin profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Account info update (Username, Email, Phone)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل في تحديث بيانات الحساب');
      }

      setProfileMessage({
        type: 'success',
        text: data.message || 'تم تحديث اسم المستخدم والبريد بنجاح',
      });

      if (data.user) {
        setUserData(data.user);
      }
      router.refresh();
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء التحديث' });
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Password change
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'كلمة المرور الجديدة يجب أن لا تقل عن 8 أحرف' });
      setPasswordSaving(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'كلمتا المرور الجديدتان غير متطابقتين' });
      setPasswordSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل في تغيير كلمة المرور');
      }

      setPasswordMessage({
        type: 'success',
        text: data.message || 'تم تغيير كلمة المرور بنجاح',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء تغيير كلمة المرور' });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (!confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة التحكم؟')) {
      return;
    }

    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-xs">جاري تحميل بيانات حساب المدير...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Summary Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/25 shrink-0">
            {userData?.username ? userData.username.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-sans">
                {userData?.username || 'المدير العام'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-[11px] font-bold font-mono">
                ADMIN
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                نشط
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-mono">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>{userData?.email}</span>
            </p>
            {userData?.createdAt && (
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>عضو منذ: {new Date(userData.createdAt).toLocaleDateString('ar-IQ')}</span>
              </p>
            )}
          </div>
        </div>

        {/* Quick Logout Button on Top Card */}
        <div className="relative z-10 w-full md:w-auto">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition transform active:scale-95 shadow-sm"
          >
            {loggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الخروج...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج من الحساب</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form 1: Account Information (Username & Email) */}
        <div className="rounded-3xl bg-white p-6 sm:p-7 border border-sky-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-sky-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">تعديل بيانات الحساب</h2>
              <p className="text-xs text-slate-500">تغيير اسم المستخدم والبريد الإلكتروني للإدارة</p>
            </div>
          </div>

          {profileMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed animate-in fade-in ${
                profileMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {profileMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم المستخدم (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="admin"
                  className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-3 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-sans"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                يُستخدم لتسجيل الدخول ويجب أن يكون فريداً (حروف إنجليزية أو أرقام).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                البريد الإلكتروني (Email)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@esaad.iq"
                  className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-3 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-sans"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رقم الهاتف (اختياري)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+964 770 000 0000"
                  className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-3 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-sans"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50"
            >
              {profileSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ بيانات الحساب</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Form 2: Change Password (Security) */}
        <div className="rounded-3xl bg-white p-6 sm:p-7 border border-sky-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-sky-100">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">تغيير كلمة المرور</h2>
              <p className="text-xs text-slate-500">تحديث كلمة سر لوحة الإدارة بأمان تام</p>
            </div>
          </div>

          {passwordMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed animate-in fade-in ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {passwordMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كلمة المرور الحالية (Current Password)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-3 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-sans"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                مطلوبة لتأكيد هويتك قبل تعيين كلمة السر الجديدة.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كلمة المرور الجديدة (New Password)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="8 أحرف على الأقل"
                  className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-3 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-sans"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تأكيد كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="إعادة كتابة كلمة المرور الجديدة"
                  className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-3 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-sans"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50"
            >
              {passwordSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحديث...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>تحديث كلمة المرور</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Safety & Session Tip */}
      <div className="rounded-3xl bg-white p-6 border border-sky-100 text-xs text-slate-600 flex items-start gap-3 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900">نظام أمان جلسات الإدارة في اصعد</h4>
          <p className="leading-relaxed">
            عند تعديل اسم المستخدم أو البريد الإلكتروني أو كلمة المرور، يتم تجديد رمز الجلسة (Session Token) تلقائياً لضمان بقاء اتصالك نشطاً دون انقطاع. يتم توثيق أي تغيير في حسابك تلقائياً في سجل التدقيق الإداري (Audit Log) لأغراض الحماية.
          </p>
        </div>
      </div>
    </div>
  );
}
