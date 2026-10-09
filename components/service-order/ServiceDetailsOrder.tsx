'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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
                الخدمة: {currentService?.nameAr || currentService?.name} | الكمية: {quantity} | التكلفة: ${formatSmmPrice(calculatedPrice)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSuccessOrder(null)}
              className="flex-1 py-2 rounded-xl bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 border border-emerald-200 transition"
            >
              طلب خدمة أخرى
            </button>
            <Link
              href="/orders"
              className="flex-1 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 text-center transition shadow-xs"
            >
              عرض الطلب في طلباتي →
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
          balance={balance}
          isBalanceSufficient={isBalanceSufficient}
          balanceDifference={balanceDifference}
          avgTime={currentService?.avgTime}
          speed={currentService?.speed}
        />

        {/* 5. FIXED BOTTOM CHECKOUT BAR */}
        <CheckoutBar
          calculatedPrice={calculatedPrice}
          isBalanceSufficient={isBalanceSufficient}
          submitting={submitting}
        />
      </form>
    </div>
  );
}
