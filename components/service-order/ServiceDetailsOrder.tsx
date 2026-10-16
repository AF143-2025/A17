'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2, X, ArrowLeft } from 'lucide-react';
import ServiceInfoCard from './ServiceInfoCard';
import ServiceInput from './ServiceInput';
import QuantityInput from './QuantityInput';
import ServiceExecutionTime from './ServiceExecutionTime';
import OrderSummary from './OrderSummary';
import CheckoutBar from './CheckoutBar';
import { formatSmmPrice } from '@/lib/currency';

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

export default function ServiceDetailsOrder() {
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
  const [inputError, setInputError] = useState<string>('');
  const [quantityError, setQuantityError] = useState<string>('');
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

          // Fallback to first available service
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

  // When current service changes, reset quantity to minQuantity
  useEffect(() => {
    if (currentService) {
      setQuantity(currentService.minQuantity);
    }
  }, [currentService?.id]);

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

    // Followers / Members / Subscribers
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
        label: 'رابط الحساب أو اسم المستخدم',
        placeholder: 'https://instagram.com/username أو اسم المستخدم',
      };
    }

    // Likes / Views / Reels / Video / Post / Retweet / Comments
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
        label: 'رابط المنشور أو الفيديو',
        placeholder: 'https://instagram.com/p/... رابط المنشور أو المقطع',
      };
    }

    // Default
    return {
      isUser: false,
      label: 'رابط الحساب أو اسم المستخدم',
      placeholder: 'https://instagram.com/username',
    };
  }, [currentService, currentCategory, currentPlatform]);

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
    setInputError('');
    setQuantityError('');

    if (!targetUrl.trim()) {
      setInputError('يرجى إدخال الرابط أو اسم المستخدم المطلوب');
      return;
    }

    if (quantity < currentService.minQuantity || quantity > currentService.maxQuantity) {
      setQuantityError(
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
          service: currentService.id,
          targetUrl: targetUrl.trim(),
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
      <div className="max-w-xl mx-auto space-y-4 pb-36 animate-pulse">
        <div className="h-56 bg-slate-100 rounded-3xl border border-sky-100" />
        <div className="h-24 bg-slate-100 rounded-3xl border border-sky-100" />
        <div className="h-24 bg-slate-100 rounded-3xl border border-sky-100" />
        <div className="h-44 bg-slate-100 rounded-3xl border border-sky-100" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-3.5 pb-36 animate-in fade-in duration-200 font-sans">
      {/* Centered Success Modal Popup right in front of user */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 border border-emerald-100 shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Close Button "X" */}
            <button
              type="button"
              onClick={() => setSuccessOrder(null)}
              className="absolute left-4 top-4 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with Green Checkmark Icon */}
            <div className="text-center pt-2 pb-3">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30 overflow-hidden border-t border-l border-white/50 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7)]">
                {/* Specular gloss shine */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/45 via-white/15 to-transparent pointer-events-none" />
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white/40 blur-[1px] pointer-events-none" />
                <CheckCircle2 className="w-7 h-7 relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-sans">
                تم إنشاء طلبك بنجاح!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                رقم الطلب: <span className="font-mono font-bold text-slate-800">#{successOrder.id.slice(-6)}</span>
              </p>
            </div>

            {/* Order Details Grid */}
            <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100/80 space-y-2.5 text-xs text-slate-700 my-2">
              <div className="flex items-center justify-between pb-2 border-b border-sky-100/60">
                <span className="text-slate-500">الخدمة:</span>
                <span
                  className="font-bold text-slate-900 text-right max-w-[210px] truncate"
                  title={currentService?.nameAr || currentService?.name}
                >
                  {currentService?.nameAr || currentService?.name}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-sky-100/60">
                <span className="text-slate-500">الرابط / الحساب:</span>
                <span
                  className="font-mono font-bold text-blue-600 max-w-[210px] truncate"
                  dir="ltr"
                  title={successOrder.targetUrl || targetUrl}
                >
                  {successOrder.targetUrl || targetUrl}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-sky-100/60">
                <span className="text-slate-500">الكمية المطلوبة:</span>
                <span className="font-sans font-bold text-slate-900">
                  {Number(successOrder.quantity || quantity).toLocaleString('en-US')} وحدة
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block">التكلفة الإجمالية:</span>
                  {currentService && (
                    <span className="text-[10px] text-slate-400 font-medium block">
                      السعر: ${formatSmmPrice(currentService.pricePer1000)} لكل 1000
                    </span>
                  )}
                </div>
                <span className="font-sans font-black text-emerald-600 text-sm">
                  ${formatSmmPrice(successOrder.price || calculatedPrice)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-5">
              <Link
                href="/orders"
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white text-center transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
              >
                <span>عرض الطلب في طلباتي</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => setSuccessOrder(null)}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition text-center"
              >
                طلب خدمة أخرى
              </button>
            </div>
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
        {/* 1. SERVICE INFORMATION CARD */}
        {currentService && (
          <ServiceInfoCard
            service={currentService}
            categoryName={currentCategory?.nameAr || ''}
            platformSlug={currentPlatform?.slug || ''}
            descriptionExpanded={descriptionExpanded}
            onToggleDescription={() => setDescriptionExpanded((prev) => !prev)}
            formatK={formatK}
          />
        )}

        {/* 2. ACCOUNT / USERNAME INPUT */}
        <ServiceInput
          targetUrl={targetUrl}
          onChange={(val) => {
            setTargetUrl(val);
            if (inputError) setInputError('');
          }}
          label={targetConfig.label}
          placeholder={targetConfig.placeholder}
          isUser={targetConfig.isUser}
          error={inputError}
        />

        {/* 3. QUANTITY INPUT */}
        {currentService && (
          <QuantityInput
            quantity={quantity}
            onChange={(val) => {
              setQuantity(val);
              if (quantityError) setQuantityError('');
            }}
            minQuantity={currentService.minQuantity}
            maxQuantity={currentService.maxQuantity}
            formatK={formatK}
            error={quantityError}
          />
        )}

        {/* 4. TIME CARD DIRECTLY UNDER QUANTITY INPUT */}
        {currentService && (
          <ServiceExecutionTime service={currentService} />
        )}

        {/* 5. ORDER SUMMARY */}
        <OrderSummary
          calculatedPrice={calculatedPrice}
          pricePer1000={currentService?.pricePer1000}
          balance={balance}
          isBalanceSufficient={isBalanceSufficient}
          balanceDifference={balanceDifference}
          avgTime={currentService?.avgTime}
          speed={currentService?.speed}
        />

        {/* 5. FIXED BOTTOM CHECKOUT BAR */}
        <CheckoutBar
          calculatedPrice={calculatedPrice}
          pricePer1000={currentService?.pricePer1000}
          isBalanceSufficient={isBalanceSufficient}
          submitting={submitting}
        />
      </form>
    </div>
  );
}
