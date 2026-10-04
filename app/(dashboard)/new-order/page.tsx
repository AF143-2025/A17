'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Wallet,
  Clock,
  Tag,
  Flame,
  Info,
  Link2,
  Hash,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Instagram,
  Video,
  Youtube,
  Facebook,
  Send,
  Twitter,
  Sparkles,
  ChevronDown,
  Layers,
} from 'lucide-react';
import NotificationDropdown from '@/components/NotificationDropdown';

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

interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  services: Service[];
}

interface Platform {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  categories: Category[];
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
  const [descriptionExpanded, setDescriptionExpanded] = useState<boolean>(false);
  const [selectorOpen, setSelectorOpen] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successOrder, setSuccessOrder] = useState<any>(null);

  // Fetch platforms & balance
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
            for (const p of fetchedPlatforms) {
              for (const c of p.categories) {
                const s = c.services.find((serv) => serv.id === serviceIdParam);
                if (s) {
                  setSelectedPlatformId(p.id);
                  setSelectedCategoryId(c.id);
                  setSelectedServiceId(s.id);
                  setQuantity(s.minQuantity);
                  return;
                }
              }
            }
          }

          if (platformSlug) {
            const foundPlatform = fetchedPlatforms.find((p) => p.slug === platformSlug);
            if (foundPlatform && foundPlatform.categories.length > 0) {
              setSelectedPlatformId(foundPlatform.id);
              const firstCat = foundPlatform.categories[0];
              setSelectedCategoryId(firstCat.id);
              if (firstCat.services.length > 0) {
                const firstServ = firstCat.services[0];
                setSelectedServiceId(firstServ.id);
                setQuantity(firstServ.minQuantity);
                return;
              }
            }
          }

          // Default fallback to first available
          if (fetchedPlatforms.length > 0) {
            const p = fetchedPlatforms[0];
            setSelectedPlatformId(p.id);
            if (p.categories.length > 0) {
              const c = p.categories[0];
              setSelectedCategoryId(c.id);
              if (c.services.length > 0) {
                const s = c.services[0];
                setSelectedServiceId(s.id);
                setQuantity(s.minQuantity);
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

  // Derived objects
  const currentPlatform = useMemo(() => {
    return platforms.find((p) => p.id === selectedPlatformId) || platforms[0] || null;
  }, [platforms, selectedPlatformId]);

  const availableCategories = useMemo(() => {
    return currentPlatform?.categories || [];
  }, [currentPlatform]);

  const currentCategory = useMemo(() => {
    return availableCategories.find((c) => c.id === selectedCategoryId) || availableCategories[0] || null;
  }, [availableCategories, selectedCategoryId]);

  const availableServices = useMemo(() => {
    return currentCategory?.services || [];
  }, [currentCategory]);

  const currentService = useMemo(() => {
    return availableServices.find((s) => s.id === selectedServiceId) || availableServices[0] || null;
  }, [availableServices, selectedServiceId]);

  // Calculate live order cost
  const calculatedPrice = useMemo(() => {
    if (!currentService) return 0;
    const qty = Number(quantity) || 0;
    return (currentService.pricePer1000 * qty) / 1000;
  }, [currentService, quantity]);

  const isBalanceSufficient = balance >= calculatedPrice;
  const balanceDifference = Math.max(0, calculatedPrice - balance);

  // Number format helper (e.g. 1000 -> 1K)
  const formatK = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
    return num.toLocaleString('en-US');
  };

  // Platform icon helper
  const getPlatformIcon = (slug?: string) => {
    switch (slug) {
      case 'instagram': return Instagram;
      case 'tiktok': return Video;
      case 'youtube': return Youtube;
      case 'facebook': return Facebook;
      case 'telegram': return Send;
      case 'x': return Twitter;
      default: return Sparkles;
    }
  };

  // Platform style helper
  const getPlatformStyle = (slug?: string) => {
    switch (slug) {
      case 'instagram':
        return { iconBg: 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white' };
      case 'tiktok':
        return { iconBg: 'bg-slate-900 text-cyan-400' };
      case 'youtube':
        return { iconBg: 'bg-red-600 text-white' };
      case 'facebook':
        return { iconBg: 'bg-blue-600 text-white' };
      case 'telegram':
        return { iconBg: 'bg-gradient-to-tr from-[#0088cc] to-[#00b0ff] text-white' };
      case 'x':
        return { iconBg: 'bg-slate-950 text-white' };
      default:
        return { iconBg: 'bg-emerald-600 text-white' };
    }
  };

  const handlePlatformChange = (pId: string) => {
    setSelectedPlatformId(pId);
    const p = platforms.find((item) => item.id === pId);
    if (p && p.categories.length > 0) {
      setSelectedCategoryId(p.categories[0].id);
      if (p.categories[0].services.length > 0) {
        const s = p.categories[0].services[0];
        setSelectedServiceId(s.id);
        setQuantity(s.minQuantity);
      }
    }
  };

  const handleCategoryChange = (cId: string) => {
    setSelectedCategoryId(cId);
    const c = availableCategories.find((item) => item.id === cId);
    if (c && c.services.length > 0) {
      const s = c.services[0];
      setSelectedServiceId(s.id);
      setQuantity(s.minQuantity);
    }
  };

  const handleServiceChange = (sId: string) => {
    setSelectedServiceId(sId);
    const s = availableServices.find((item) => item.id === sId);
    if (s) {
      setQuantity(s.minQuantity);
    }
  };

  // Submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentService) return;
    setErrorMsg('');

    if (!targetUrl.trim()) {
      setErrorMsg('يرجى إدخال الرابط أو اسم المستخدم المطلوب');
      return;
    }

    if (quantity < currentService.minQuantity || quantity > currentService.maxQuantity) {
      setErrorMsg(
        `الكمية يجب أن تكون بين ${currentService.minQuantity.toLocaleString()} و ${currentService.maxQuantity.toLocaleString()}`
      );
      return;
    }

    if (!isBalanceSufficient) {
      setErrorMsg('رصيدك الحالي غير كافٍ. يرجى شحن الرصيد أولاً.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: currentService.id,
          link: targetUrl.trim(),
          quantity: Number(quantity),
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
        <span className="text-xs font-bold">جاري تجهيز تفاصيل الخدمة...</span>
      </div>
    );
  }

  const PlatformIcon = getPlatformIcon(currentPlatform?.slug);
  const platformStyle = getPlatformStyle(currentPlatform?.slug);

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-20 animate-in fade-in duration-200 font-sans">
      {/* ========================================================================= */}
      {/* 1. Header: زر رجوع يميناً، "طلب جديد" بالوسط، وجرس الإشعارات يساراً          */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between py-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-white border border-sky-100 flex items-center justify-center text-slate-700 hover:text-slate-900 shadow-xs active:scale-95 transition"
          title="رجوع"
          aria-label="رجوع"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <h1 className="text-base sm:text-lg font-black text-slate-900">
          طلب جديد
        </h1>

        <div className="w-10 h-10 flex items-center justify-center">
          <NotificationDropdown />
        </div>
      </div>

      {/* Success Notification Banner */}
      {successOrder && (
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-xs flex flex-col gap-3 animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                تم استلام طلبك بنجاح! (#{successOrder.id.slice(-6)})
              </h3>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                طلبك الآن قيد التنفيذ التلقائي الفوري.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setSuccessOrder(null)}
              className="flex-1 py-2 rounded-xl bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 border border-emerald-200 transition"
            >
              طلب خدمة أخرى
            </button>
            <Link
              href="/orders"
              className="flex-1 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 text-center transition shadow-xs"
            >
              متابعة في طلباتي →
            </Link>
          </div>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* ========================================================================= */}
        {/* 2. Top Selected Service Card (بطاقة الخدمة المختارة)                        */}
        {/* ========================================================================= */}
        {currentService && (
          <div className="rounded-3xl bg-white p-4 sm:p-5 border border-sky-100 shadow-xs space-y-3.5">
            {/* Service Title & Category Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-snug line-clamp-2">
                  {currentService.nameAr || currentService.name}
                </h2>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mt-1">
                  <span className="font-mono px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                    #{currentService.id.slice(-4)}
                  </span>
                  <span>•</span>
                  <span className="truncate">{currentCategory?.nameAr}</span>
                </div>
              </div>

              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${platformStyle.iconBg}`}
              >
                <PlatformIcon className="w-5 h-5" />
              </div>
            </div>

            {/* Quick Switch Button (لتغيير الخدمة إذا رغب المستخدم) */}
            <button
              type="button"
              onClick={() => setSelectorOpen((prev) => !prev)}
              className="w-full py-2 px-3 rounded-xl bg-sky-50/70 hover:bg-sky-100 border border-sky-100 text-[11px] font-bold text-blue-600 flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>تغيير القسم أو الخدمة</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${selectorOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Collapsible Selector for Platform / Category / Service */}
            {selectorOpen && (
              <div className="p-3 rounded-2xl bg-sky-50/40 border border-sky-100 space-y-2.5 text-xs animate-in fade-in duration-150">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">المنصة:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {platforms.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePlatformChange(p.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          p.id === selectedPlatformId
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-700 border border-sky-200'
                        }`}
                      >
                        {p.nameAr}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">الفئة:</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full h-9 rounded-xl bg-white border border-sky-200 px-3 text-xs text-slate-800 font-semibold"
                  >
                    {availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">الخدمة:</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full h-9 rounded-xl bg-white border border-sky-200 px-3 text-xs text-slate-800 font-semibold"
                  >
                    {availableServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameAr || s.name} (${s.pricePer1000.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 4-Columns Metric Bar (الأدنى, الأقصى, 1000/, التنفيذ) */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 p-2.5 rounded-2xl bg-sky-50/60 border border-sky-100 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">الأدنى</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 font-sans mt-0.5 block">
                  {formatK(currentService.minQuantity)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">الأقصى</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 font-sans mt-0.5 block">
                  {formatK(currentService.maxQuantity)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">1000/</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 font-sans mt-0.5 block">
                  ${currentService.pricePer1000.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">التنفيذ</span>
                <span className="text-xs sm:text-sm font-black text-blue-600 font-sans mt-0.5 block truncate">
                  {currentService.speed || 'خلال دقائق'}
                </span>
              </div>
            </div>

            {/* Badges Row (30 يوم ضمان, حقيقي, الأكثر طلباً) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                <Clock className="w-3 h-3 text-sky-600" />
                <span>30 يوم ضمان</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-blue-700 text-[10px] font-bold border border-sky-200">
                <Tag className="w-3 h-3 text-blue-600" />
                <span>حقيقي</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>الأكثر طلباً</span>
              </span>
            </div>

            {/* Service Description Card with Expand/Collapse */}
            <div className="p-3 rounded-2xl bg-sky-50/40 border border-sky-100/70 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className={`text-[11px] sm:text-xs leading-relaxed ${descriptionExpanded ? '' : 'line-clamp-2'}`}>
                  {currentService.description || 'خدمة سريعة وآمنة ومضمونة بنسبة 100% لتنمية حسابك.'}
                </p>
              </div>

              {currentService.description && currentService.description.length > 80 && (
                <div className="text-left">
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded((prev) => !prev)}
                    className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{descriptionExpanded ? 'عرض أقل ˄' : 'عرض المزيد ˅'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. Target URL / Account Card (رابط الحساب أو اسم المستخدم)                 */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-white p-4 sm:p-5 border border-sky-100 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>رابط الحساب أو اسم المستخدم</span>
          </div>

          <div className="relative">
            <input
              type="text"
              dir="ltr"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://instagram.com/username"
              required
              className="w-full h-12 pr-4 pl-11 rounded-2xl bg-sky-50/30 border border-sky-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs sm:text-sm text-slate-900 font-mono shadow-xs outline-hidden transition"
            />
            <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. Quantity Card (الكمية المطلوبة)                                       */}
        {/* ========================================================================= */}
        {currentService && (
          <div className="rounded-3xl bg-white p-4 sm:p-5 border border-sky-100 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>الكمية المطلوبة</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-sans">
                {formatK(currentService.minQuantity)} – {formatK(currentService.maxQuantity)}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                dir="ltr"
                value={quantity}
                min={currentService.minQuantity}
                max={currentService.maxQuantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full h-12 pr-4 pl-11 rounded-2xl bg-sky-50/30 border border-sky-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-black text-sm font-sans shadow-xs outline-hidden transition"
              />
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. Order Summary Card (ملخص الطلب)                                       */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-white p-4 sm:p-5 border border-sky-100 shadow-xs space-y-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
            <span className="font-sans text-sm font-black">$</span>
            <span className="text-slate-900">ملخص الطلب</span>
          </div>

          {/* 2 Stat Boxes Side-by-Side: التكلفة و رصيدك */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 text-center">
              <span className="text-xs text-slate-500 font-bold block mb-1">التكلفة</span>
              <span className="text-lg sm:text-xl font-black text-rose-600 font-sans">
                ${calculatedPrice.toFixed(4)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 text-center">
              <span className="text-xs text-slate-500 font-bold block mb-1">رصيدك</span>
              <span className="text-lg sm:text-xl font-black text-slate-900 font-sans">
                ${balance.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Balance Status Box */}
          {!isBalanceSufficient ? (
            <Link
              href="/wallet#deposit-section"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-700 hover:bg-rose-100 transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-900">رصيد غير كافٍ</div>
                  <div className="text-[11px] text-rose-600 font-semibold">
                    تحتاج ${balanceDifference.toFixed(4)} إضافية
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </Link>
          ) : (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>رصيدك كافٍ وجاهز للتنفيذ الفوري ⚡</span>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 6. Sticky Action Footer Bar (التكلفة الإجمالية وزر التأكيد أو الشحن)       */}
        {/* ========================================================================= */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500">التكلفة الإجمالية</span>
            <span className="text-lg font-black text-rose-600 font-sans">
              ${calculatedPrice.toFixed(4)}
            </span>
          </div>

          {!isBalanceSufficient ? (
            <Link
              href="/wallet#deposit-section"
              className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 active:bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              <span>اشحن رصيدك أولاً</span>
            </Link>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري تأكيد الطلب...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>تأكيد الطلب ⚡</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
