'use client';

import React, { useState, useEffect } from 'react';
import {
  Server,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Zap,
  DollarSign,
  Layers,
  Sliders,
  History,
  ShieldCheck,
  AlertTriangle,
  ArrowUpDown,
  Trash2,
  Edit2,
  Key,
  ExternalLink,
  Flame,
  Globe,
  Check,
  Sparkles,
  HelpCircle,
  Power,
  PowerOff,
} from 'lucide-react';

interface ProviderRecord {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  type: string;
  priority: number;
  errorCount: number;
  status: boolean;
  isPrimary?: boolean;
  balance: number;
  balanceCurrency: string;
  lastSyncAt: string | null;
  _count: {
    services: number;
    orders: number;
    providerServices?: number;
    serviceProviders?: number;
  };
}

interface PricingRuleRecord {
  id: string;
  name: string;
  scope: string;
  targetId: string | null;
  markupType: string;
  markupValue: number;
  priority: number;
  status: boolean;
  createdAt: string;
}

interface SyncLogRecord {
  id: string;
  providerId: string | null;
  provider?: { name: string } | null;
  syncType: string;
  status: string;
  itemsCount: number;
  durationMs: number;
  errors: string | null;
  createdAt: string;
}

const REAL_PROVIDER_PRESETS = [
  {
    name: 'SMM World',
    apiUrl: 'https://my.smmworld.org/api/v2',
    website: 'https://my.smmworld.org',
    priority: 10,
    badge: 'المزود المعتمد المباشر',
    tag: 'SMM World V2',
    guide: 'سيرفر معتمد لكافة خدمات مواقع التواصل الاجتماعي والتفاعل الفوري.',
  },
  {
    name: 'KD1S - سيرفر دعمكم (العراق والشرق الأوسط)',
    apiUrl: 'https://kd1s.com/api/v2',
    website: 'https://kd1s.com',
    priority: 10,
    badge: 'الأشهر عراقياً وعربياً',
    tag: 'العراق والشرق الأوسط',
    guide: 'سجل دخولك في موقع kd1s.com واذهب إلى إعدادات الحساب وانسخ الـ API Key.',
  },
  {
    name: 'JustAnotherPanel (JAP - المزود العالمي الأكبر)',
    apiUrl: 'https://justanotherpanel.com/api/v2',
    website: 'https://justanotherpanel.com',
    priority: 9,
    badge: 'المزود الأكبر عالمياً لأسعار الجملة',
    tag: 'عالمي مباشر',
    guide: 'سجل دخولك في موقع JustAnotherPanel واذهب لصفحة الحساب (Account) لنسخ مفتاح الـ API.',
  },
  {
    name: 'SMMKings - ملوك السيرفرات (يوتيوب وتيك توك)',
    apiUrl: 'https://smmkings.com/api/v2',
    website: 'https://smmkings.com',
    priority: 8,
    badge: 'تخصص يوتيوب والمشاهدات',
    tag: 'يوتيوب وتيك توك',
    guide: 'سجل دخولك في SMMKings وانسخ مفتاح API من صفحة إعدادات الحساب.',
  },
  {
    name: 'Peakerr - مزود السرعات الفائقة والضمانات',
    apiUrl: 'https://peakerr.com/api/v2',
    website: 'https://peakerr.com',
    priority: 7,
    badge: 'سرعات فائقة وضمان تعويض',
    tag: 'إنستغرام وتيك توك',
    guide: 'انسخ مفتاح API الخاص بك من قسم الـ API في لوحة تحكم Peakerr.',
  },
  {
    name: 'SMMStone - سيرفر إنستغرام وتيليجرام المباشر',
    apiUrl: 'https://smmstone.com/api/v2',
    website: 'https://smmstone.com',
    priority: 6,
    badge: 'تفاعل إنستغرام وتيليجرام فوري',
    tag: 'تيليجرام وإنستغرام',
    guide: 'انسخ مفتاح API من إعدادات حسابك في موقع SMMStone.',
  },
];

export default function AdminProvidersPage() {
  const [activeTab, setActiveTab] = useState<'providers' | 'pricing' | 'logs'>('providers');
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRuleRecord[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [balanceLoadingId, setBalanceLoadingId] = useState<string | null>(null);
  const [syncLoadingId, setSyncLoadingId] = useState<string | null>(null);
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);
  const [globalActionLoading, setGlobalActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New/Edit Provider Modal
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState({
    name: '',
    apiUrl: '',
    apiKey: '',
    type: 'STANDARD_SMM_V2',
    priority: 0,
    status: true,
  });
  const [savingProvider, setSavingProvider] = useState(false);

  // Pricing Rule Modal
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    scope: 'GLOBAL',
    targetId: '',
    markupType: 'PERCENTAGE',
    markupValue: 50,
    priority: 0,
    recalculateNow: true,
  });
  const [savingRule, setSavingRule] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [providersRes, pricingRes] = await Promise.all([
        fetch('/api/admin/providers'),
        fetch('/api/admin/pricing'),
      ]);

      if (providersRes.ok) {
        const pData = await providersRes.json();
        setProviders(pData.providers || []);
        setSyncLogs(pData.syncLogs || []);
      }

      if (pricingRes.ok) {
        const prData = await pricingRes.json();
        setPricingRules(prData.rules || []);
        setPlatforms(prData.platforms || []);
        setCategories(prData.categories || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'pricing' || tabParam === 'providers' || tabParam === 'logs') {
        setActiveTab(tabParam as any);
      }
    }
    loadData();
  }, []);

  const handleTestConnection = async (id: string) => {
    setBalanceLoadingId(id);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_balance', providerId: id }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        loadData();
      } else {
        setActionMessage({
          type: 'error',
          text: data.error?.includes('Invalid API key')
            ? 'المزود متصل ولكن مفتاح الـ API غير صالح أو بحاجة لتفعيل. يرجى إدخال مفتاح الـ API الخاص بحسابك من موقع المزود.'
            : data.error || 'فشل الاتصال بالمزود',
        });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً' });
    } finally {
      setBalanceLoadingId(null);
    }
  };

  const handleSyncServices = async (id: string) => {
    setSyncLoadingId(id);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_services', providerId: id }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setActionMessage({ type: 'success', text: data.message });
        loadData();
      } else {
        const errorMsg = data?.error || (res.status === 504
          ? 'استغرقت المزامنة وقتاً طويلاً على الخادم، يجري إكمال سحب الخدمات في الخلفية.'
          : res.statusText || 'فشلت المزامنة');

        setActionMessage({
          type: 'error',
          text: errorMsg.includes('Invalid API key')
            ? 'فشلت المزامنة: يرجى وضع مفتاح API صالح من حسابك لدى المزود لبدء سحب الخدمات.'
            : errorMsg,
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message?.includes('Failed to fetch')
          ? 'تعذر الاتصال بالخادم، يرجى إعادة المحاولة بعد لحظات.'
          : 'تعذر الاتصال بالمزود لمزامنة الخدمات',
      });
    } finally {
      setSyncLoadingId(null);
    }
  };

  const handleSyncAll = async () => {
    setGlobalActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/cron/sync?syncServices=true', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `تمت المزامنة الشاملة بنجاح لكافة المزودين النشطين (${data.summary?.ordersSync?.checkedCount || 0} طلب)`,
        });
        loadData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'فشلت المزامنة الشاملة' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'تعذر تشغيل المزامنة الشاملة' });
    } finally {
      setGlobalActionLoading(false);
    }
  };

  const handleRecalculatePrices = async () => {
    setGlobalActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/pricing', { method: 'PATCH' });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
      } else {
        setActionMessage({ type: 'error', text: data.error || 'فشل إعادة حساب الأسعار' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    } finally {
      setGlobalActionLoading(false);
    }
  };

  const handleToggleProviderStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setToggleLoadingId(id);
    setActionMessage(null);
    try {
      // Optimistic UI update
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );

      const res = await fetch('/api/admin/providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: data.message || (newStatus ? 'تم تفعيل وتشغيل المزود بنجاح 🟢' : 'تم إيقاف المزود مؤقتاً ⏸️'),
        });
      } else {
        // Revert on failure
        setProviders((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: currentStatus } : p))
        );
        setActionMessage({ type: 'error', text: data.error || 'فشل تغيير حالة المزود' });
      }
    } catch {
      // Revert on failure
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: currentStatus } : p))
      );
      setActionMessage({ type: 'error', text: 'تعذر الاتصال بالخادم لتغيير حالة المزود' });
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProvider(true);
    try {
      const method = editingProviderId ? 'PUT' : 'POST';
      const body = editingProviderId
        ? { ...providerForm, id: editingProviderId }
        : providerForm;

      const res = await fetch('/api/admin/providers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setProviderModalOpen(false);
        setEditingProviderId(null);
        setProviderForm({
          name: '',
          apiUrl: '',
          apiKey: '',
          type: 'STANDARD_SMM_V2',
          priority: 0,
          status: true,
        });
        setActionMessage({
          type: 'success',
          text: editingProviderId ? 'تم تحديث بيانات المزود ومفتاح API بنجاح' : 'تمت إضافة المزود بنجاح',
        });
        loadData();
      } else {
        const data = await res.json();
        setActionMessage({ type: 'error', text: data.error || 'فشل حفظ المزود' });
      }
    } catch (e) {
      console.error(e);
      setActionMessage({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    } finally {
      setSavingProvider(false);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المزود؟')) return;
    try {
      const res = await fetch(`/api/admin/providers?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        loadData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'فشل حذف المزود' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRule(true);
    try {
      const method = editingRuleId ? 'PUT' : 'POST';
      const body = editingRuleId ? { ...ruleForm, id: editingRuleId } : ruleForm;

      const res = await fetch('/api/admin/pricing', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setRuleModalOpen(false);
        setEditingRuleId(null);
        setRuleForm({
          name: '',
          scope: 'GLOBAL',
          targetId: '',
          markupType: 'PERCENTAGE',
          markupValue: 80,
          priority: 0,
          recalculateNow: true,
        });
        setActionMessage({
          type: 'success',
          text: editingRuleId ? 'تم تحديث قاعدة التسعير وتطبيق هامش الربح فوراً ⚡' : 'تمت إضافة قاعدة التسعير وتحديث الأسعار بنجاح ⚡',
        });
        loadData();
      } else {
        const data = await res.json();
        setActionMessage({ type: 'error', text: data.error || 'فشل حفظ قاعدة التسعير' });
      }
    } catch (e) {
      console.error(e);
      setActionMessage({ type: 'error', text: 'تعذر الاتصال بالخادم لحفظ قاعدة التسعير' });
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف قاعدة التسعير هذه؟')) return;
    try {
      const res = await fetch(`/api/admin/pricing?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        loadData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'فشل الحذف' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'تعذر تنفيذ الحذف' });
    }
  };

  const applyPreset = (preset: (typeof REAL_PROVIDER_PRESETS)[0]) => {
    setProviderForm({
      name: preset.name,
      apiUrl: preset.apiUrl,
      apiKey: '',
      type: 'STANDARD_SMM_V2',
      priority: preset.priority,
      status: true,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
      {/* 1. Header & Global Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-sans tracking-tight">
            إدارة المزودين الحقيقيين والتسعير الذكي
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            الربط التلقائي بمزودي SMM العالميين عبر بروتوكول API V2، محرك التوجيه الذكي، وضبط هوامش الأرباح بالدولار ($)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSyncAll}
            disabled={globalActionLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-sky-50 text-xs font-bold text-slate-700 border border-sky-200 shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${globalActionLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>مزامنة شاملة للطلبات</span>
          </button>

          <button
            onClick={handleRecalculatePrices}
            disabled={globalActionLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-xs font-bold text-amber-800 border border-amber-200 shadow-xs transition disabled:opacity-50"
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            <span>تحديث أسعار الخدمات</span>
          </button>

          <button
            onClick={() => {
              setEditingProviderId(null);
              setProviderForm({
                name: '',
                apiUrl: '',
                apiKey: '',
                type: 'STANDARD_SMM_V2',
                priority: 0,
                status: true,
              });
              setProviderModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة مزود جديد</span>
          </button>
        </div>
      </div>

      {/* 2. Real Providers Quick Guide & Quick Presets Bar */}
      <div className="rounded-2xl bg-white border border-sky-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>المزودون المعتمدون المدعومون بنقرة واحدة (Real SMM Providers)</span>
          </div>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
            Standard API V2 Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          {REAL_PROVIDER_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setEditingProviderId(null);
                applyPreset(p);
                setProviderModalOpen(true);
              }}
              className="p-3 rounded-xl bg-slate-50/70 hover:bg-sky-50 border border-slate-200/80 hover:border-blue-300 transition text-right group flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition truncate">
                  {p.name.split(' - ')[0]}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{p.badge}</div>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold text-blue-600">
                <span>توصيل فوري +</span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white border border-sky-200 text-slate-600">
                  P:{p.priority}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between animate-in slide-in-from-top-2 shadow-xs ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Tabs */}
      <div className="flex items-center gap-2 border-b border-sky-100 pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('providers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
            activeTab === 'providers'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>المزودين المضافين ({providers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
            activeTab === 'pricing'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>قواعد التسعير وهوامش الأرباح ({pricingRules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
            activeTab === 'logs'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجلات المزامنة ({syncLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: PROVIDERS */}
      {activeTab === 'providers' && (
        <>
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-sky-100">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <span className="text-xs font-semibold">جاري تحميل وتحديث حالة المزودين...</span>
            </div>
          ) : providers.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-sky-100 text-slate-500 shadow-sm">
              <Server className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-sm text-slate-800">لا يوجد أي مزود مضاف حالياً</p>
              <p className="text-xs mt-1 text-slate-500">
                اضغط على زر &quot;إضافة مزود جديد&quot; أو اختر أحد المزودين الجاهزين أعلاه للربط التلقائي.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {providers.map((p) => {
                const isHealthy = (p.errorCount || 0) < 3;
                const hasCustomKey = p.apiKey && !p.apiKey.includes('YOUR_') && p.apiKey.length > 5;

                return (
                  <div
                    key={p.id}
                    className={`rounded-3xl bg-white p-6 border transition-all duration-300 flex flex-col justify-between space-y-5 ${
                      p.status
                        ? 'border-sky-100 shadow-sm hover:shadow-md'
                        : 'border-amber-200 bg-amber-50/20 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top Bar of Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs border ${
                            p.status
                              ? 'bg-blue-50 text-blue-600 border-blue-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            <Server className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                              <span>{p.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                                أولوية: {p.priority}
                              </span>
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-bold text-blue-600">
                                {p.type === 'STANDARD_SMM_V3' ? 'SMM v3 ⚡' : p.type === 'STANDARD_SMM_V2' ? 'SMM v2' : p.type}
                              </span>
                              {p.isPrimary && (
                                <span className="text-[9px] px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 font-extrabold">
                                  رئيسي ⭐
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* زر إيقاف وتشغيل المزود التفاعلي (Toggle Switch) */}
                          <button
                            type="button"
                            onClick={() => handleToggleProviderStatus(p.id, p.status)}
                            disabled={toggleLoadingId === p.id}
                            className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all shadow-xs border cursor-pointer active:scale-95 ${
                              p.status
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-emerald-500/10'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 shadow-rose-500/10'
                            }`}
                            title={p.status ? 'المزود نشط ويعمل حالياً - اضغط لإيقافه مؤقتاً' : 'المزود متوقف حالياً - اضغط لتشغيله وتفعيله'}
                          >
                            {toggleLoadingId === p.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                            ) : p.status ? (
                              <Power className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                            ) : (
                              <PowerOff className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
                            )}
                            <span>{p.status ? 'تشغيل 🟢' : 'إيقاف ⏸️'}</span>
                          </button>

                          {isHealthy ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>متصل</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>أخطاء ({p.errorCount})</span>
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setEditingProviderId(p.id);
                              setProviderForm({
                                name: p.name,
                                apiUrl: p.apiUrl,
                                apiKey: '',
                                type: p.type,
                                priority: p.priority,
                                status: p.status,
                              });
                              setProviderModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-sky-50 transition"
                            title="تعديل بيانات المزود"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteProvider(p.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="حذف المزود"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Paused Provider Notice Banner */}
                      {!p.status && (
                        <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <PowerOff className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>المزود متوقف حالياً: محرك التوجيه يستثنيه تلقائياً ولن تُحوّل إليه أي طلبات جديدة.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleProviderStatus(p.id, p.status)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shrink-0"
                          >
                            تشغيل الآن ⚡
                          </button>
                        </div>
                      )}

                      {/* API Key Status Notice */}
                      {!hasCustomKey && (
                        <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>بانتظار إدخال مفتاح الـ API الخاص بحسابك لتفعيل المزامنة</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProviderId(p.id);
                              setProviderForm({
                                name: p.name,
                                apiUrl: p.apiUrl,
                                apiKey: '',
                                type: p.type,
                                priority: p.priority,
                                status: p.status,
                              });
                              setProviderModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition shadow-xs shrink-0"
                          >
                            إدخال المفتاح 🔑
                          </button>
                        </div>
                      )}

                      {/* Info Grid */}
                      <div className="mt-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-semibold">رابط الـ API المعتمد:</span>
                          <span
                            className="font-mono text-slate-800 font-bold truncate max-w-[220px]"
                            title={p.apiUrl}
                          >
                            {p.apiUrl}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-semibold">حالة مفتاح الـ API:</span>
                          <span className="font-mono text-xs">
                            {hasCustomKey ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                مشفّر ومحمي 🔒 {p.apiKey}
                              </span>
                            ) : (
                              <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                                مفتاح افتراضي بحاجة للتحديث
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-semibold">رصيد حسابك لدى المزود:</span>
                          <span className="font-sans font-black text-emerald-600 text-sm">
                            ${p.balance.toFixed(2)} {p.balanceCurrency || 'USD'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-semibold">الخدمات المكتشفة والمربوطة:</span>
                          <span className="font-sans font-bold text-slate-900">
                            {p._count.providerServices || p._count.services} خدمة
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-semibold">آخر مزامنة وفحص:</span>
                          <span className="text-slate-500">
                            {p.lastSyncAt
                              ? new Date(p.lastSyncAt).toLocaleString('ar-EG', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'لم تتم بعد'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions on Card */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2.5">
                      <button
                        onClick={() => handleTestConnection(p.id)}
                        disabled={balanceLoadingId === p.id}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-sky-50 text-xs font-bold text-slate-800 border border-sky-200 transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        {balanceLoadingId === p.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        ) : (
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>فحص الرصيد ⚡</span>
                      </button>

                      <button
                        onClick={() => handleSyncServices(p.id)}
                        disabled={syncLoadingId === p.id}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-700 border border-blue-200 transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            syncLoadingId === p.id ? 'animate-spin text-blue-600' : ''
                          }`}
                        />
                        <span>مزامنة الخدمات 🔄</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: PRICING RULES */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-sky-100">
            <p className="text-xs text-slate-600 font-medium">
              يتم تطبيق هوامش الأرباح بترتيب الأولوية الذكي: (خدمة محددة ← تصنيف ← منصة ← قاعدة عامة).
            </p>

            <button
              onClick={() => {
                setEditingRuleId(null);
                setRuleForm({
                  name: '',
                  scope: 'GLOBAL',
                  targetId: '',
                  markupType: 'PERCENTAGE',
                  markupValue: 50,
                  priority: 0,
                  recalculateNow: true,
                });
                setRuleModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إضافة قاعدة تسعير</span>
            </button>
          </div>

          {pricingRules.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-sky-100 text-slate-500 shadow-sm">
              <Sliders className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-sm text-slate-800">لا توجد قواعد تسعير مخصصة حالياً</p>
              <p className="text-xs mt-1 text-slate-500 max-w-md mx-auto">
                يطبق النظام تلقائياً سعر المزود الحقيقي المباشر (0% زيادة تلقائية) بدون إضافة أي مبالغ عشوائية. يمكنك إضافة قاعدة تسعير لتحديد نسبة ربحك (مثلاً +20% أو +15%).
              </p>
            </div>
          ) : (
            <div className="rounded-3xl bg-white border border-sky-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="bg-sky-50/60 border-b border-sky-100 text-slate-700 font-bold">
                      <th className="p-3.5">اسم القاعدة</th>
                      <th className="p-3.5">النطاق (Scope)</th>
                      <th className="p-3.5">نوع ونسبة الربح</th>
                      <th className="p-3.5">الأولوية</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pricingRules.map((rule) => {
                      const targetPlatform = platforms.find((p) => p.id === rule.targetId);
                      const targetCategory = categories.find((c) => c.id === rule.targetId);

                      return (
                        <tr key={rule.id} className="hover:bg-sky-50/40 transition">
                          <td className="p-3.5 font-bold text-slate-900">{rule.name}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-mono text-[10px] font-bold">
                              {rule.scope}
                            </span>
                            {targetPlatform && (
                              <span className="text-slate-500 mr-2 font-medium">
                                ({targetPlatform.nameAr})
                              </span>
                            )}
                            {targetCategory && (
                              <span className="text-slate-500 mr-2 font-medium">
                                ({targetCategory.nameAr})
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-sans font-bold text-emerald-600">
                            {rule.markupType === 'PERCENTAGE'
                              ? `+${rule.markupValue}%`
                              : `+$${rule.markupValue.toFixed(2)}`}
                          </td>
                          <td className="p-3.5 font-mono text-slate-700">{rule.priority}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              نشط
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingRuleId(rule.id);
                                  setRuleForm({
                                    name: rule.name,
                                    scope: rule.scope as any,
                                    targetId: rule.targetId || '',
                                    markupType: rule.markupType as any,
                                    markupValue: rule.markupValue,
                                    priority: rule.priority,
                                    recalculateNow: true,
                                  });
                                  setRuleModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-sky-50 transition"
                                title="تعديل نسبة الربح"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="حذف القاعدة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SYNC LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {syncLogs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-sky-100 text-slate-500 shadow-sm">
              <History className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-sm text-slate-800">لا توجد سجلات مزامنة سابقة</p>
            </div>
          ) : (
            <div className="rounded-3xl bg-white border border-sky-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="bg-sky-50/60 border-b border-sky-100 text-slate-700 font-bold">
                      <th className="p-3.5">المزود</th>
                      <th className="p-3.5">نوع العملية</th>
                      <th className="p-3.5">العدد</th>
                      <th className="p-3.5">المدة الزمنية</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5">الوقت والتاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {syncLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-sky-50/40 transition">
                        <td className="p-3.5 font-bold text-slate-900">
                          {log.provider?.name || 'مزامنة شاملة'}
                        </td>
                        <td className="p-3.5 font-mono text-blue-700 font-bold">{log.syncType}</td>
                        <td className="p-3.5 font-mono text-slate-700">{log.itemsCount}</td>
                        <td className="p-3.5 font-mono text-slate-500">{log.durationMs}ms</td>
                        <td className="p-3.5">
                          {log.status === 'SUCCESS' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              نجاح
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                              فشل
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {new Date(log.createdAt).toLocaleString('ar-EG')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Add/Edit Provider */}
      {providerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900">
                {editingProviderId ? 'تعديل بيانات المزود ومفتاح API' : 'إضافة مزود خارجي جديد'}
              </h3>
              <button
                onClick={() => setProviderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets in Modal */}
            {!editingProviderId && (
              <div className="mb-4 p-3 rounded-2xl bg-sky-50/70 border border-sky-200/80">
                <span className="text-[11px] font-bold text-slate-700 block mb-2">
                  ⚡ تعبئة سريعة من المزودين المعتمدين:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {REAL_PROVIDER_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-600 hover:text-white border border-sky-200 text-[11px] font-bold text-slate-700 transition"
                    >
                      {p.name.split(' - ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveProvider} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المزود
                </label>
                <input
                  type="text"
                  value={providerForm.name}
                  onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                  placeholder="مثال: KD1S أو JAP"
                  required
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رابط الـ API المعتمد (API URL)
                </label>
                <input
                  type="url"
                  value={providerForm.apiUrl}
                  onChange={(e) => setProviderForm({ ...providerForm, apiUrl: e.target.value })}
                  placeholder="مثال: https://kd1s.com/api/v2 أو https://smm.com/api/v3"
                  required
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 font-mono focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    مفتاح الـ API (API Key)
                  </label>
                  <span className="text-[10px] text-slate-500">
                    تشفير آمن AES-256-GCM 🔒
                  </span>
                </div>
                <input
                  type="password"
                  value={providerForm.apiKey}
                  onChange={(e) => setProviderForm({ ...providerForm, apiKey: e.target.value })}
                  placeholder={editingProviderId ? 'اتركه فارغاً للإبقاء على المفتاح الحالي' : 'انسخ مفتاحك من حسابك لدى المزود'}
                  required={!editingProviderId}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 font-mono focus:border-blue-500 focus:bg-white focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  يمكنك الحصول على المفتاح من لوحة تحكم حسابك لدى المزود في خانة &quot;Account&quot; أو &quot;API&quot;.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الأولوية (Priority)
                  </label>
                  <input
                    type="number"
                    value={providerForm.priority}
                    onChange={(e) =>
                      setProviderForm({ ...providerForm, priority: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-900 font-mono focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    الرقم الأعلى يختاره الراوتر الذكي أولاً
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نوع البروتوكول
                  </label>
                  <select
                    value={providerForm.type}
                    onChange={(e) => setProviderForm({ ...providerForm, type: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    <option value="STANDARD_SMM_V2">Standard SMM v2 (معتمد عالمياً)</option>
                    <option value="STANDARD_SMM_V3">Standard SMM v3 (الإصدار الأحدث v3 ⚡)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  حالة تشغيل المزود
                </label>
                <select
                  value={providerForm.status ? 'true' : 'false'}
                  onChange={(e) => setProviderForm({ ...providerForm, status: e.target.value === 'true' })}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-800 font-bold focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="true">تشغيل (مفعل لاستقبال وتوجيه الطلبات تلقائياً) 🟢</option>
                  <option value="false">إيقاف (معطل ومستثنى من توجيه الطلبات) ⏸️</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProviderModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingProvider}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-md shadow-blue-500/20"
                >
                  {savingProvider ? 'جاري الحفظ...' : editingProviderId ? 'حفظ التعديلات' : 'إضافة المزود'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Pricing Rule */}
      {ruleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-900">
                {editingRuleId ? 'تعديل قاعدة التسعير وهامش الربح' : 'إضافة قاعدة تسعير وهامش ربح'}
              </h3>
              <button
                onClick={() => setRuleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم القاعدة
                </label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="مثال: هامش إنستغرام 40%"
                  required
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    النطاق (Scope)
                  </label>
                  <select
                    value={ruleForm.scope}
                    onChange={(e) => setRuleForm({ ...ruleForm, scope: e.target.value, targetId: '' })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    <option value="GLOBAL">عام (جميع الخدمات)</option>
                    <option value="PLATFORM">منصة محددة</option>
                    <option value="CATEGORY">تصنيف محدد</option>
                  </select>
                </div>

                {ruleForm.scope === 'PLATFORM' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اختر المنصة
                    </label>
                    <select
                      value={ruleForm.targetId}
                      onChange={(e) => setRuleForm({ ...ruleForm, targetId: e.target.value })}
                      required
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                    >
                      <option value="">اختر...</option>
                      {platforms.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nameAr || p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {ruleForm.scope === 'CATEGORY' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اختر التصنيف
                    </label>
                    <select
                      value={ruleForm.targetId}
                      onChange={(e) => setRuleForm({ ...ruleForm, targetId: e.target.value })}
                      required
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                    >
                      <option value="">اختر...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameAr || c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نوع الهامش
                  </label>
                  <select
                    value={ruleForm.markupType}
                    onChange={(e) => setRuleForm({ ...ruleForm, markupType: e.target.value })}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    <option value="PERCENTAGE">نسبة مئوية (%)</option>
                    <option value="FIXED">مبلغ ثابت ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    قيمة الهامش {ruleForm.markupType === 'PERCENTAGE' ? '(%)' : '($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ruleForm.markupValue}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, markupValue: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-900 font-mono focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الأولوية (Priority)
                </label>
                <input
                  type="number"
                  value={ruleForm.priority}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, priority: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-900 font-mono focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingRule}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-md shadow-blue-500/20"
                >
                  {savingRule ? 'جاري الحفظ...' : editingRuleId ? 'تحديث وتطبيق الربح' : 'حفظ وتطبيق القاعدة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
