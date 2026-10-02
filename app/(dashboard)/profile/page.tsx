'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Wallet,
  Sparkles,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  LogOut,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  balance: number;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setPhone(data.user.phone || '');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword.length < 6) {
      setMessage({ type: 'error', text: 'كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف أو أرقام' });
      return;
    }

    if (newPassword && newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'كلمتا المرور الجديدتان غير متطابقتين' });
      return;
    }

    if (newPassword && !currentPassword) {
      setMessage({ type: 'error', text: 'يرجى إدخال كلمة المرور الحالية لتأكيد التغيير' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim() || null,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
          confirmNewPassword: confirmNewPassword || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        loadProfile();
      } else {
        setMessage({ type: 'error', text: data.error || 'فشل في تحديث البيانات' });
      }
    } catch {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال بالخادم' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-xs">جاري تحميل الملف الشخصي...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-sans">الملف الشخصي وإعدادات الأمان</h1>
        <p className="text-xs text-slate-500 mt-1">
          بيانات الحساب وتفاصيل الأمان والمعاملات المالية بالدولار ($)
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-start gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-sky-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/25">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>{user.username}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-blue-700 font-semibold border border-sky-300">
                {user.role}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="text-slate-500 block">البريد الإلكتروني</span>
              <span className="font-semibold text-slate-900">{user.email}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center gap-3">
            <Phone className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <span className="text-slate-500 block">رقم الهاتف</span>
              <span className="font-semibold text-slate-900 font-mono">{user.phone || 'غير محدد'}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center gap-3">
            <Wallet className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-slate-500 block">الرصيد المتاح</span>
              <span className="font-black text-emerald-600 text-sm font-sans">
                ${user.balance.toFixed(2)} USD
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <span className="text-slate-500 block">تاريخ الانضمام</span>
              <span className="font-semibold text-slate-900">
                {new Date(user.createdAt).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-sky-100 flex flex-col sm:flex-row gap-3">
          <Link
            href="/services"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-xs font-bold text-slate-800 transition border border-sky-200"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>تصفح دليل الخدمات</span>
          </Link>
          <Link
            href="/wallet"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:opacity-90 transition"
          >
            <Wallet className="w-4 h-4" />
            <span>شحن المحفظة</span>
          </Link>
        </div>
      </div>

      {/* Security & Edit Form Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-sky-100">
          <Lock className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">تحديث البيانات وكلمة المرور</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              يمكنك تحديث رقم الهاتف وتغيير كلمة المرور الخاصة بحسابك بأمان
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              رقم الهاتف
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0770xxxxxxx"
              className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-2.5 text-xs text-slate-900 font-mono focus:border-blue-500 focus:bg-white focus:outline-none transition"
            />
          </div>

          <div className="pt-2 border-t border-sky-100">
            <span className="text-xs font-bold text-slate-800 block mb-3">
              تغيير كلمة المرور (اتركها فارغة إن لم ترغب في التغيير):
            </span>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  كلمة المرور الحالية
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-2.5 text-xs text-slate-900 font-mono focus:border-blue-500 focus:bg-white focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-2.5 text-xs text-slate-900 font-mono focus:border-blue-500 focus:bg-white focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-2.5 text-xs text-slate-900 font-mono focus:border-blue-500 focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition disabled:opacity-50 shadow-md shadow-blue-500/20"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>حفظ التعديلات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Logout Card */}
      <div className="rounded-3xl bg-white p-6 border border-rose-200 bg-rose-50/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h4 className="text-sm font-bold text-slate-900">تسجيل الخروج من الحساب</h4>
          <p className="text-xs text-slate-600 mt-0.5">
            إنهاء الجلسة الحالية وتأمين حسابك على هذا الجهاز.
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            } catch (err) {
              console.error(err);
            }
          }}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-100 border border-rose-200 hover:bg-rose-600 text-rose-700 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
