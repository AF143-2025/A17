'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
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
  AtSign,
} from 'lucide-react';
import PlatformBrandIcon from '@/components/PlatformBrandIcon';

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

          // Filter out 'other' platform
          const fetchedPlatforms: Platform[] = (servicesData.platforms || []).filter(
            (p: Platform) => p.slug !== 'other' && !p.nameAr.includes('أخرى')
          );

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

  // Dynamic target type detection based on service name & category
  const targetConfig = useMemo(() => {
    const textToScan = [
      currentService?.nameAr || '',
      currentService?.name || '',
      currentCategory?.nameAr || '',
      currentPlatform?.nameAr || '',
    ]
      .join(' ')
      .toLowerCase();

    // 1. Followers / Subscribers / Members (متابعين، مشتركين، أعضاء)
    if (
      textToScan.includes('متابع') ||
      textToScan.includes('follower') ||
      textToScan.includes('مشترك') ||
      textToScan.includes('subscrib') ||
      textToScan.includes('عضو') ||
      textToScan.includes('أعضاء') ||
      textToScan.includes('اعضاء') ||
      textToScan.includes('member')
    ) {
      return {
        isUser: true,
        label: 'اسم المستخدم أو رابط الحساب',
        badge: 'متابعين / حساب',
        placeholder: 'username@ أو رابط الحساب المباشر',
        tip: 'تأكد من أن الحساب عام (Public) وليس خاصاً (Private) حتى يكتمل الطلب بنجاح.',
      };
    }

    // 2. Likes / Views / Reels / Video / Post / Retweet / Comments (لايكات، مشاهدات، ريلز، بوست، تعليقات)
    if (
      textToScan.includes('لايك') ||
      textToScan.includes('إعجاب') ||
      textToScan.includes('اعجاب') ||
      textToScan.includes('like') ||
      textToScan.includes('مشاهد') ||
      textToScan.includes('view') ||
      textToScan.includes('ريلز') ||
      textToScan.includes('reel') ||
      textToScan.includes('فيديو') ||
      textToScan.includes('video') ||
      textToScan.includes('منشور') ||
      textToScan.includes('بوست') ||
      textToScan.includes('post') ||
      textToScan.includes('تغريد') ||
      textToScan.includes('tweet') ||
      textToScan.includes('retweet') ||
      textToScan.includes('كومنت') ||
      textToScan.includes('تعليق') ||
      textToScan.includes('comment')
    ) {
      return {
        isUser: false,
        label: 'رابط المنشور أو الفيديو (الريلز)',
        badge: 'منشور / فيديو',
        placeholder: 'https://... رابط المنشور أو الفيديو المباشر',
        tip: 'تأكد من أن المنشور أو الفيديو عام ومتاح للجميع وليس محذوفاً أو مؤقتاً.',
      };
    }

    // 3. Telegram channels / groups
    if (
      textToScan.includes('قناة') ||
      textToScan.includes('مجموعة') ||
      textToScan.includes('جروب') ||
      textToScan.includes('t.me')
    ) {
      return {
        isUser: false,
        label: 'رابط أو معرف القناة / المجموعة',
        badge: 'قناة / تيليجرام',
        placeholder: 'https://t.me/channel أو معرف القناة',
        tip: 'تأكد من أن رابط القناة عام ويعمل بشكل صحيح.',
      };
    }

    // 4. Default fallback
    return {
      isUser: false,
      label: 'رابط الحساب أو المنشور المطلوب',
      badge: 'الرابط المطلوب',
      placeholder: 'https://... أو اسم المستخدم',
      tip: 'يرجى إدخال الرابط بدقة للتأكد من وصول الخدمة لحسابك فوراً.',
    };
  }, [currentService, currentCategory, currentPlatform]);

  // Quick quantity options within min/max bounds
  const quickQuantities = useMemo(() => {
    if (!currentService) return [];
    const min = currentService.minQuantity;
    const max = currentService.maxQuantity;

    const candidates = [
      min,
      500,
      1000,
      2500,
      5000,
      10000,
      max,
    ];

    // Filter valid unique values within min-max range
    const valid = Array.from(new Set(candidates)).filter(
      (v) => v >= min && v <= max
    );

    // Limit to max 5 pills to keep layout neat
    if (valid.length > 5) {
      return [valid[0], valid[1], valid[2], valid[valid.length - 2], valid[valid.length - 1]];
    }
    return valid;
  }, [currentService]);

  // Number format helper (e.g. 1000 -> 1K)
  const formatK = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
    return num.toLocaleString('en-US');
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

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-[#090d16] min-h-screen text-slate-100 font-sans">
      <div className="max-w-xl mx-auto space-y-3.5 pb-40 animate-in fade-in duration-200">
        {/* Success Notification Banner */}
        {successOrder && (
          <div className="p-4 sm:p-5 rounded-3xl bg-emerald-950/50 border border-emerald-800/80 shadow-lg flex flex-col gap-3 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  تم استلام طلبك بنجاح! (#{successOrder.id.slice(-6)})
                </h3>
                <p className="text-[11px] text-emerald-400 mt-0.5">
                  طلبك الآن قيد التنفيذ التلقائي الفوري.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSuccessOrder(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
              >
                طلب خدمة أخرى
              </button>
              <Link
                href="/orders"
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 text-center transition shadow-xs"
              >
                متابعة في طلباتي →
              </Link>
            </div>
          </div>
        )}

        {/* Error Message Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-900/80 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* ========================================================================= */}
          {/* 1. Selected Service Card (بطاقة الخدمة المختارة)                          */}
          {/* ========================================================================= */}
          {currentService && (
            <div className="rounded-3xl bg-[#131926] p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3.5">
              {/* Service Title & Category Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base font-black text-white leading-snug">
                    {currentService.nameAr || currentService.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mt-1">
                    <span className="font-mono px-2 py-0.5 rounded-lg bg-[#1e2738] border border-slate-700/60 text-slate-300 text-[11px] font-bold">
                      #{currentService.id.slice(-4)}
                    </span>
                    <span className="text-slate-600 font-bold">•</span>
                    <span className="truncate text-slate-400">{currentCategory?.nameAr}</span>
                  </div>
                </div>

                {/* Real Official Platform Brand Icon */}
                <PlatformBrandIcon slug={currentPlatform?.slug} size="md" />
              </div>

              {/* 4-Columns Metric Bar (الأدنى, الأقصى, 1000/, التنفيذ) */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 p-2.5 rounded-2xl bg-[#0a0e17] border border-slate-800/80 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">الأدنى</span>
                  <span className="text-xs sm:text-sm font-black text-white font-sans mt-0.5 block">
                    {formatK(currentService.minQuantity)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">الأقصى</span>
                  <span className="text-xs sm:text-sm font-black text-white font-sans mt-0.5 block">
                    {formatK(currentService.maxQuantity)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">1000/</span>
                  <span className="text-xs sm:text-sm font-black text-white font-sans mt-0.5 block">
                    ${currentService.pricePer1000.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">التنفيذ</span>
                  <span className="text-xs sm:text-sm font-black text-white font-sans mt-0.5 block truncate">
                    {currentService.speed || '4320د'}
                  </span>
                </div>
              </div>

              {/* Badges Row (30 يوم ضمان, حقيقي, الأكثر طلباً) */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1c2436] border border-slate-700/60 text-slate-300 text-[10px] sm:text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>30 يوم ضمان</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0f1f38] border border-blue-900/60 text-blue-400 text-[10px] sm:text-xs font-bold">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  <span>حقيقي</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2a1d0d] border border-amber-900/60 text-amber-400 text-[10px] sm:text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>الأكثر طلباً</span>
                </span>
              </div>

              {/* Service Description Card with Expand/Collapse */}
              <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className={`text-xs leading-relaxed text-slate-300 ${descriptionExpanded ? '' : 'line-clamp-2'}`}>
                    {currentService.description || 'الأضافات تكون من حسابات حقيقية ونشطة وآمنة تماماً لحسابك.'}
                  </p>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded((prev) => !prev)}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer transition"
                  >
                    <span>{descriptionExpanded ? 'عرض أقل ˄' : 'عرض المزيد ˅'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. Target Link / Account Card (رابط الحساب أو اسم المستخدم)                 */}
          {/* ========================================================================= */}
          <div className="rounded-3xl bg-[#131926] p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
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
                className="w-full h-12 pr-4 pl-11 rounded-2xl bg-[#0a0e17] border border-slate-800 focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/20 text-xs sm:text-sm text-white font-mono shadow-xs outline-hidden transition placeholder:text-slate-500"
              />
              <Link2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. Quantity Card (الكمية المطلوبة)                                       */}
          {/* ========================================================================= */}
          {currentService && (
            <div className="rounded-3xl bg-[#131926] p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>الكمية المطلوبة</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#2a1d0d] text-amber-400 border border-amber-900/60 font-sans">
                  {formatK(currentService.minQuantity)} – {formatK(currentService.maxQuantity)}
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  dir="ltr"
                  value={quantity || ''}
                  min={currentService.minQuantity}
                  max={currentService.maxQuantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  className="w-full h-12 pr-11 pl-11 rounded-2xl bg-[#0a0e17] border border-slate-800 focus:border-amber-400/80 focus:ring-2 focus:ring-amber-400/20 text-white font-black text-sm font-sans shadow-xs outline-hidden transition text-center sm:text-right"
                />
                <Hash className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-slate-500 pointer-events-none select-none">
                  <span className="text-[8px] leading-tight">▲</span>
                  <span className="text-[8px] leading-tight">▼</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. Order Summary Card (ملخص الطلب)                                       */}
          {/* ========================================================================= */}
          <div className="rounded-3xl bg-[#131926] p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-400">
              <span className="font-sans text-sm sm:text-base font-black">$</span>
              <span className="text-white">ملخص الطلب</span>
            </div>

            {/* 2 Stat Boxes Side-by-Side: التكلفة و رصيدك */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1f1017] border border-rose-950/80 text-center">
                <span className="text-xs text-slate-400 font-bold block mb-1">التكلفة</span>
                <span className="text-lg sm:text-xl font-black text-rose-500 font-sans">
                  ${calculatedPrice.toFixed(4)}
                </span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#211a0e] border border-amber-950/80 text-center">
                <span className="text-xs text-slate-400 font-bold block mb-1">رصيدك</span>
                <span className="text-lg sm:text-xl font-black text-amber-400 font-sans">
                  ${balance.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Balance Status Box */}
            {!isBalanceSufficient ? (
              <Link
                href="/wallet#deposit-section"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1f1017] border border-rose-900/60 text-rose-400 hover:bg-[#28131e] transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#2e131d] text-rose-400 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-400">رصيد غير كافٍ</div>
                    <div className="text-[11px] text-rose-400/80 font-medium font-sans">
                      تحتاج {balanceDifference.toFixed(4)}$ إضافية
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </Link>
            ) : (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#0e2118] border border-emerald-900/60 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>رصيدك كافٍ وجاهز للتنفيذ الفوري ⚡</span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 5. Floating Fixed Action Bar above BottomNav                              */}
          {/* ========================================================================= */}
          <div className="fixed bottom-14 sm:bottom-0 left-0 right-0 z-30 bg-[#090d16]/95 backdrop-blur-md border-t border-slate-800 shadow-2xl p-3 sm:p-4">
            <div className="max-w-xl mx-auto space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-400">التكلفة الإجمالية</span>
                <span className="text-lg font-black text-rose-500 font-sans">
                  ${calculatedPrice.toFixed(4)}
                </span>
              </div>

              {!isBalanceSufficient ? (
                <Link
                  href="/wallet#deposit-section"
                  className="w-full py-3.5 rounded-2xl bg-[#856414] hover:bg-[#967118] active:bg-[#725510] text-[#fef3c7] font-black text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
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
          </div>
        </form>
      </div>
    </div>
  );
}
