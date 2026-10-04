'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Coins,
  Wallet,
  ArrowLeft,
  Loader2,
  Tag,
  Zap,
  Clock,
  ShieldAlert,
  Send,
  ExternalLink,
} from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  categories: Category[];
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  services: Service[];
}

interface Service {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  minQuantity: number;
  maxQuantity: number;
  pricePer1000: number;
  speed?: string;
  avgTime?: string;
  notes?: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form states
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1000);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successOrder, setSuccessOrder] = useState<any>(null);

  // Fetch services tree and current balance
  useEffect(() => {
    async function loadData() {
      try {
        const [servicesRes, userRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/auth/me'),
        ]);

        if (servicesRes.ok && userRes.ok) {
          const servicesData = await servicesRes.json();
          const userData = await userRes.json();

          const fetchedPlatforms: Platform[] = servicesData.platforms || [];
          setPlatforms(fetchedPlatforms);
          setBalance(userData.user?.balance || 0);

          // Handle query params pre-selection
          const platformSlug = searchParams.get('platform');
          const serviceIdParam = searchParams.get('serviceId');

          if (serviceIdParam) {
            // Find which platform & category this service belongs to
            for (const p of fetchedPlatforms) {
              for (const c of p.categories) {
                const s = c.services.find((serv) => serv.id === serviceIdParam);
                if (s) {
                  setSelectedPlatformId(p.id);
                  setSelectedCategoryId(c.id);
                  setSelectedServiceId(s.id);
                  setQuantity(s.minQuantity);
                  setLoadingInitial(false);
                  return;
                }
              }
            }
          }

          if (platformSlug) {
            const p = fetchedPlatforms.find((item) => item.slug === platformSlug);
            if (p) {
              setSelectedPlatformId(p.id);
              if (p.categories.length > 0) {
                setSelectedCategoryId(p.categories[0].id);
                if (p.categories[0].services.length > 0) {
                  const s = p.categories[0].services[0];
                  setSelectedServiceId(s.id);
                  setQuantity(s.minQuantity);
                }
              }
            }
          } else if (fetchedPlatforms.length > 0) {
            const firstP = fetchedPlatforms[0];
            setSelectedPlatformId(firstP.id);
            if (firstP.categories.length > 0) {
              setSelectedCategoryId(firstP.categories[0].id);
              if (firstP.categories[0].services.length > 0) {
                setSelectedServiceId(firstP.categories[0].services[0].id);
                setQuantity(firstP.categories[0].services[0].minQuantity);
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInitial(false);
      }
    }

    loadData();
  }, [searchParams]);

  // Derived selections
  const currentPlatform = useMemo(
    () => platforms.find((p) => p.id === selectedPlatformId),
    [platforms, selectedPlatformId]
  );

  const availableCategories = useMemo(
    () => currentPlatform?.categories || [],
    [currentPlatform]
  );

  const currentCategory = useMemo(
    () => availableCategories.find((c) => c.id === selectedCategoryId),
    [availableCategories, selectedCategoryId]
  );

  const availableServices = useMemo(
    () => currentCategory?.services || [],
    [currentCategory]
  );

  const currentService = useMemo(
    () => availableServices.find((s) => s.id === selectedServiceId),
    [availableServices, selectedServiceId]
  );

  // When platform changes, reset category & service
  const handlePlatformChange = (pId: string) => {
    setSelectedPlatformId(pId);
    const p = platforms.find((item) => item.id === pId);
    if (p && p.categories.length > 0) {
      setSelectedCategoryId(p.categories[0].id);
      if (p.categories[0].services.length > 0) {
        setSelectedServiceId(p.categories[0].services[0].id);
        setQuantity(p.categories[0].services[0].minQuantity);
      } else {
        setSelectedServiceId('');
      }
    } else {
      setSelectedCategoryId('');
      setSelectedServiceId('');
    }
  };

  // When category changes, reset service
  const handleCategoryChange = (cId: string) => {
    setSelectedCategoryId(cId);
    const c = availableCategories.find((item) => item.id === cId);
    if (c && c.services.length > 0) {
      setSelectedServiceId(c.services[0].id);
      setQuantity(c.services[0].minQuantity);
    } else {
      setSelectedServiceId('');
    }
  };

  // Price calculations
  const calculatedPrice = useMemo(() => {
    if (!currentService || !quantity || quantity <= 0) return 0;
    return Number(((quantity / 1000) * currentService.pricePer1000).toFixed(4));
  }, [currentService, quantity]);

  const balanceAfter = Number((balance - calculatedPrice).toFixed(4));
  const isBalanceInsufficient = balanceAfter < 0;

  const isQuantityValid = useMemo(() => {
    if (!currentService) return true;
    return quantity >= currentService.minQuantity && quantity <= currentService.maxQuantity;
  }, [currentService, quantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedServiceId) {
      setErrorMsg('يرجى اختيار الخدمة');
      return;
    }

    if (!targetUrl.trim()) {
      setErrorMsg('يرجى إدخال رابط الحساب أو المنشور أو اسم المستخدم');
      return;
    }

    if (!isQuantityValid) {
      setErrorMsg(
        `الكمية يجب أن تكون بين ${currentService?.minQuantity.toLocaleString('en-US')} و ${currentService?.maxQuantity.toLocaleString('en-US')}`
      );
      return;
    }

    if (isBalanceInsufficient) {
      setErrorMsg('رصيد محفظتك غير كافٍ لإتمام هذا الطلب. يرجى شحن الرصيد أولاً.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          targetUrl: targetUrl.trim(),
          quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'فشل في إرسال الطلب');
        setSubmitting(false);
        return;
      }

      setSuccessOrder(data.order);
      setBalance((prev) => prev - calculatedPrice);
      setTargetUrl('');
    } catch (err: any) {
      setErrorMsg('تعذر الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-xs">جاري تحميل الخدمات والأسعار...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-sans flex items-center gap-2">
          <span>إنشاء طلب جديد</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-sky-100 border border-sky-300 text-blue-700 font-bold">
            تنفيذ تلقائي ⚡
          </span>
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          اختر قسم ونوع الخدمة وأدخل الرابط والكمية لتأكيد الطلب فوراً ($).
        </p>
      </div>

      {/* Success Modal / Banner */}
      {successOrder && (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                تم استلام طلبك بنجاح! (#{successOrder.id.slice(-6)})
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                طلبك الآن قيد المعالجة والإرسال التلقائي. تم خصم المبلغ من المحفظة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSuccessOrder(null)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              طلب آخر
            </button>
            <button
              onClick={() => router.push('/orders')}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition"
            >
              متابعة في طلباتي →
            </button>
          </div>
        </div>
      )}

      {/* Main Order Form and Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-8 border border-sky-100 shadow-sm space-y-6">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs leading-relaxed animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Category / Service Department Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                1. اختر قسم الخدمة المطلوب
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {platforms.map((p) => {
                  const isSelected = p.id === selectedPlatformId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePlatformChange(p.id)}
                      className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border text-center transition flex flex-col items-center justify-center gap-0.5 sm:gap-1 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-sky-50/60 border-sky-200/80 text-slate-700 hover:border-sky-300 hover:bg-sky-100/50'
                      }`}
                    >
                      <span className="text-xs font-bold">{p.nameAr}</span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Category Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                2. اختر نوع الخدمة المطلوب
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-xl bg-white border border-sky-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm transition"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Service Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                3. اختر الخدمة (Service)
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value);
                  const s = availableServices.find((item) => item.id === e.target.value);
                  if (s) setQuantity(s.minQuantity);
                }}
                className="w-full rounded-xl bg-white border border-sky-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm transition"
              >
                {availableServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — (${s.pricePer1000.toLocaleString('en-US')} لكل 1000)
                  </option>
                ))}
              </select>
            </div>

            {/* Service Details Card */}
            {currentService && (
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-blue-600" />
                    <span>السعر:</span>
                    <strong className="text-blue-600 font-sans">
                      ${currentService.pricePer1000.toLocaleString('en-US')}
                    </strong>
                    <span className="text-[10px] text-slate-500">/ 1,000</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>السرعة:</span>
                    <span className="font-semibold text-slate-800">
                      {currentService.speed || 'فوري'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>وقت البدء:</span>
                    <span className="font-semibold text-slate-800">
                      {currentService.avgTime || '15 دقيقة'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <span>الحد الأدنى: <strong>{currentService.minQuantity.toLocaleString('en-US')}</strong></span>
                    <span>|</span>
                    <span>الحد الأقصى: <strong>{currentService.maxQuantity.toLocaleString('en-US')}</strong></span>
                  </div>
                </div>

                <div className="text-slate-600 leading-relaxed border-t border-sky-200/60 pt-2.5">
                  {currentService.description}
                </div>

                {currentService.notes && (
                  <div className="flex items-start gap-2 text-amber-800 text-[11px] bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>{currentService.notes}</span>
                  </div>
                )}
              </div>
            )}

            {/* 4. Target Link / Username */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                4. الرابط أو اسم المستخدم (Target URL / Username)
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://instagram.com/username أو https://tiktok.com/@username/video/..."
                required
                className="w-full rounded-xl bg-white border border-sky-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm transition font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                تأكد من أن الحساب عام (Public) وليس خاصاً قبل إرسال الطلب.
              </span>
            </div>

            {/* 5. Quantity & Quick Select Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  5. الكمية المطلوبة (Quantity)
                </label>
                {currentService && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    الحدود: {currentService.minQuantity.toLocaleString('en-US')} - {currentService.maxQuantity.toLocaleString('en-US')}
                  </span>
                )}
              </div>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value || '0', 10))}
                min={currentService?.minQuantity || 10}
                max={currentService?.maxQuantity || 1000000}
                step={50}
                required
                className="w-full rounded-xl bg-white border border-sky-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm transition font-sans font-bold"
              />

              {/* Quick quantity chips */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                {[500, 1000, 2500, 5000, 10000].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-[11px] font-semibold text-slate-700 hover:bg-sky-100 hover:text-slate-900 transition font-sans"
                  >
                    +{q.toLocaleString('en-US')}
                  </button>
                ))}
              </div>
            </div>

          </form>
        </div>

        {/* Right 1 Col: Summary & Confirmation Card */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-6 sm:p-7 border border-sky-100 sticky top-24 shadow-sm">
            <h3 className="text-base font-black text-slate-900 pb-3 border-b border-sky-100 flex items-center justify-between">
              <span>ملخص الطلب (Summary)</span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            </h3>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500">الخدمة:</span>
                <span className="font-semibold text-slate-900 text-left line-clamp-2 max-w-[180px]">
                  {currentService?.name || 'لم تحدد'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">الكمية:</span>
                <span className="font-bold text-slate-800 font-sans">
                  {quantity.toLocaleString('en-US')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">السعر الإجمالي:</span>
                <span className="text-base font-black text-blue-600 font-sans">
                  ${calculatedPrice.toFixed(2)}
                </span>
              </div>

              <div className="h-px bg-sky-100 my-2" />

              <div className="flex justify-between items-center">
                <span className="text-slate-500">رصيدك الحالي:</span>
                <span className="font-bold text-slate-700 font-sans">
                  ${balance.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">الرصيد بعد الطلب:</span>
                <span
                  className={`font-black font-sans ${
                    isBalanceInsufficient ? 'text-rose-600' : 'text-slate-800'
                  }`}
                >
                  ${balanceAfter.toFixed(2)}
                </span>
              </div>

              {isBalanceInsufficient && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed space-y-2">
                  <div className="font-bold text-rose-600 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>رصيد محفظتك الحالي غير كافٍ لإتمام هذا الطلب</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    يمكنك شحن رصيدك فوراً عبر مراسلة الدعم المالي المعتمد على تيليجرام:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href="https://t.me/Hexc8re"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#0088cc] to-[#00b0ff] hover:opacity-90 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Send className="w-3 h-3" />
                      <span>شحن عبر تيليجرام (@Hexc8re)</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                    <button
                      type="button"
                      onClick={() => router.push('/wallet')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                    >
                      صفحة المحفظة
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || isBalanceInsufficient || !isQuantityValid}
              className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white font-bold shadow-lg shadow-blue-500/25 hover:opacity-95 transition transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>جاري تأكيد الطلب...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>تأكيد الطلب الآن</span>
                </>
              )}
            </button>

            <div className="mt-4 text-[10px] text-slate-500 text-center leading-relaxed">
              بالنقر على تأكيد الطلب، يتم خصم الرصيد تلقائياً وتوجيه الطلب لنظام المزود.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
