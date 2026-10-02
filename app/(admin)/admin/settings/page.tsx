'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Save,
  Globe,
  DollarSign,
  Send,
  Bell,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    site_name: 'اصعد | ESAAD',
    site_tagline: 'منصة خدمات النمو الرقمي',
    currency: 'USD',
    currency_symbol: '$',
    usd_to_iqd_rate: '1500',
    telegram_support: '@Hexc8re',
    announcement: '',
    maintenance_mode: 'false',
    allow_registration: 'true',
  });

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setForm((prev) => ({ ...prev, ...data.settings }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: form }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'تم حفظ وتطبيق جميع الإعدادات بنجاح' });
      } else {
        setMessage({ type: 'error', text: data.error || 'فشل في حفظ الإعدادات' });
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
        <span className="text-xs">جاري تحميل إعدادات المنصة...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-sans flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-blue-600" />
            <span>إعدادات وتحكم المنصة الشاملة</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            التحكم بهوية الموقع، سعر الصرف، وسيلة الشحن المعتمدة، وشريط الإعلانات
          </p>
        </div>

        {/* Shortcut to Admin Profile */}
        <Link
          href="/admin/profile"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-sky-50 border border-sky-200 text-xs font-bold text-slate-800 shadow-sm transition group"
        >
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span>تعديل حساب المدير وكلمة المرور</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-[-2px] transition" />
        </Link>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-start gap-3 border shadow-sm ${
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Site Identity Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-sky-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">هوية ومظهر المنصة</h3>
              <p className="text-xs text-slate-500 mt-0.5">اسم المنصة وشعارها اللفظي الظاهر للمستخدمين</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اسم الموقع (Site Name)
              </label>
              <input
                type="text"
                value={form.site_name}
                onChange={(e) => setForm({ ...form, site_name: e.target.value })}
                required
                className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الشعار اللفظي (Tagline)
              </label>
              <input
                type="text"
                value={form.site_tagline}
                onChange={(e) => setForm({ ...form, site_tagline: e.target.value })}
                required
                className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Currency & Exchange Rate Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-sky-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">العملة وسعر الصرف (Currency & Rates)</h3>
              <p className="text-xs text-slate-500 mt-0.5">ضبط سعر صرف الدولار مقابل الدينار العراقي للمدفوعات المحلية</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عملة المنصة الأساسية
              </label>
              <input
                type="text"
                value={form.currency}
                disabled
                className="w-full rounded-xl bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs text-slate-500 font-mono font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رمز العملة
              </label>
              <input
                type="text"
                value={form.currency_symbol}
                disabled
                className="w-full rounded-xl bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs text-slate-500 font-mono font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                سعر الصرف (1$ بالدينار العراقي)
              </label>
              <input
                type="number"
                value={form.usd_to_iqd_rate}
                onChange={(e) => setForm({ ...form, usd_to_iqd_rate: e.target.value })}
                required
                min="1000"
                max="2500"
                className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            يُستخدم هذا السعر لحساب قيمة التحويلات المحلية تلقائياً (زين كاش، فاست باي، FIB) عند موافقة الإدارة على الإيداع.
          </p>
        </div>

        {/* Telegram Recharge & Support Channel */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-sky-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-sky-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0088cc] to-[#00b0ff] text-white flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/20">
              <Send className="w-5 h-5 -translate-x-0.5 translate-y-0.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">حساب تيليجرام المعتمد للشحن والدعم</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                الحساب الذي يتم توجيه العملاء إليه لشحن أرصدتهم واستقبال المدفوعات
              </p>
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              معرف حساب التيليجرام (Telegram Handle)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.telegram_support}
                onChange={(e) => setForm({ ...form, telegram_support: e.target.value })}
                placeholder="@Hexc8re"
                required
                className="flex-1 rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-blue-500 focus:bg-white focus:outline-none"
              />
              <a
                href={`https://t.me/${form.telegram_support.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-blue-700 font-bold transition flex items-center gap-1.5"
              >
                <span>اختبار الرابط</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              يتم تحديث هذا المعرف في صفحة المحفظة، صفحة الطلب الجديد، والدعم الفني فور الحفظ.
            </p>
          </div>
        </div>

        {/* Global Announcement Banner */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-sky-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">شريط الإعلانات العام (Announcement Bar)</h3>
              <p className="text-xs text-slate-500 mt-0.5">رسالة بارزة تظهر في أعلى المنصة لجميع المستخدمين والزوار</p>
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              نص الإعلان (اتركه فارغاً لإخفاء الشريط)
            </label>
            <textarea
              value={form.announcement}
              onChange={(e) => setForm({ ...form, announcement: e.target.value })}
              rows={2}
              placeholder="أهلاً بكم في منصة اصعد! شحن الرصيد المباشر عبر تيليجرام @Hexc8re..."
              className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Platform Modes & Controls */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-sky-100">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">حالات وأمان المنصة</h3>
              <p className="text-xs text-slate-500 mt-0.5">التحكم في وضع الصيانة وإمكانية تسجيل مستخدمين جدد</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Maintenance Mode */}
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">وضع الصيانة (Maintenance Mode)</span>
                <span className="text-[11px] text-slate-500">
                  {form.maintenance_mode === 'true'
                    ? 'المنصة مغلقة مؤقتاً للصيانة'
                    : 'المنصة تعمل وتستقبل الطلبات بشكل طبيعي'}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    maintenance_mode: form.maintenance_mode === 'true' ? 'false' : 'true',
                  })
                }
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  form.maintenance_mode === 'true' ? 'bg-rose-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    form.maintenance_mode === 'true' ? 'right-7' : 'right-1'
                  }`}
                />
              </button>
            </div>

            {/* Allow Registration */}
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">التسجيل الجديد (Signups)</span>
                <span className="text-[11px] text-slate-500">
                  {form.allow_registration === 'true'
                    ? 'يُسمح للمستخدمين الجدد بالتسجيل'
                    : 'التسجيل مغلق بقرار من الإدارة'}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    allow_registration: form.allow_registration === 'true' ? 'false' : 'true',
                  })
                }
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  form.allow_registration === 'true' ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    form.allow_registration === 'true' ? 'right-7' : 'right-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:opacity-95 transition transform active:scale-98 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري حفظ الإعدادات...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>حفظ وتطبيق جميع الإعدادات فوراً</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
