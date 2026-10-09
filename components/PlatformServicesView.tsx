'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  ChevronDown,
  Zap,
} from 'lucide-react';
import PlatformBrandIcon from './PlatformBrandIcon';
import { formatSmmPrice } from '@/lib/currency';

interface ServiceItem {
  id: string;
  name: string;
  nameAr?: string | null;
  pricePer1000: number;
  minQuantity: number;
  maxQuantity: number;
}

interface CategoryItem {
  id: string;
  nameAr: string;
  services: ServiceItem[];
}

interface PlatformItem {
  id: string;
  nameAr: string;
  slug: string;
  categories: CategoryItem[];
}

interface PlatformServicesViewProps {
  platforms: PlatformItem[];
}

export default function PlatformServicesView({ platforms }: PlatformServicesViewProps) {
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  // Restore navigation state on mount (e.g. when returning from /new-order via back button)
  React.useEffect(() => {
    try {
      const savedPlatformId = sessionStorage.getItem('dashboard_selected_platform_id');
      const savedCategoryId = sessionStorage.getItem('dashboard_expanded_category_id');
      const savedServiceId = sessionStorage.getItem('dashboard_last_service_id');
      const savedScroll = sessionStorage.getItem('dashboard_scroll_pos');

      if (savedPlatformId && platforms.some((p) => p.id === savedPlatformId)) {
        setSelectedPlatformId(savedPlatformId);
        if (savedCategoryId) {
          setExpandedCategoryId(savedCategoryId);
        }

        // Smoothly scroll to the service that was clicked
        const timer = setTimeout(() => {
          if (savedServiceId) {
            const el = document.getElementById(`service-item-${savedServiceId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Highlight the service card briefly for great UX
              el.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50/70');
              setTimeout(() => {
                el.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/70');
              }, 1800);
              return;
            }
          }
          if (savedScroll) {
            window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'smooth' });
          }
        }, 120);

        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error('Failed to restore dashboard state:', err);
    }
  }, [platforms]);

  // Filter out any 'other' platform just in case
  const visiblePlatforms = platforms.filter(
    (p) => p.slug !== 'other' && !p.nameAr.includes('أخرى')
  );

  const selectedPlatform = visiblePlatforms.find((p) => p.id === selectedPlatformId);

  const handleSelectPlatform = (platformId: string) => {
    setSelectedPlatformId(platformId);
    setExpandedCategoryId(null);
    try {
      sessionStorage.setItem('dashboard_selected_platform_id', platformId);
      sessionStorage.removeItem('dashboard_expanded_category_id');
      sessionStorage.removeItem('dashboard_last_service_id');
    } catch (e) {}
  };

  const handleClosePlatform = () => {
    setSelectedPlatformId(null);
    setExpandedCategoryId(null);
    try {
      sessionStorage.removeItem('dashboard_selected_platform_id');
      sessionStorage.removeItem('dashboard_expanded_category_id');
      sessionStorage.removeItem('dashboard_last_service_id');
      sessionStorage.removeItem('dashboard_scroll_pos');
    } catch (e) {}
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategoryId((prev) => {
      const next = prev === catId ? null : catId;
      try {
        if (next) {
          sessionStorage.setItem('dashboard_expanded_category_id', next);
        } else {
          sessionStorage.removeItem('dashboard_expanded_category_id');
        }
      } catch (e) {}
      return next;
    });
  };

  const handleOrderClick = (serviceId: string, categoryId: string, platformId: string) => {
    try {
      sessionStorage.setItem('dashboard_selected_platform_id', platformId);
      sessionStorage.setItem('dashboard_expanded_category_id', categoryId);
      sessionStorage.setItem('dashboard_last_service_id', serviceId);
      sessionStorage.setItem('dashboard_scroll_pos', window.scrollY.toString());
    } catch (e) {}
  };

  // =========================================================================
  // VIEW 1: Categories Drill-Down View (عند الضغط على أي منصة)
  // =========================================================================
  if (selectedPlatform) {
    const totalServices = selectedPlatform.categories.reduce(
      (acc, c) => acc + c.services.length,
      0
    );

    return (
      <div className="space-y-3 animate-in fade-in duration-200">
        {/* Selected Platform Header Card with Close Button (X) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-sky-100 shadow-xs flex items-center justify-between gap-3">
          {/* Platform Info (Right in RTL) */}
          <div className="flex items-center gap-3 min-w-0">
            <PlatformBrandIcon slug={selectedPlatform.slug} size="md" />

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {selectedPlatform.nameAr}
              </h2>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5 truncate">
                <span>{selectedPlatform.categories.length} فئة</span>
                <span className="mx-1">•</span>
                <span>{totalServices} خدمة</span>
              </p>
            </div>
          </div>

          {/* Close Button X (Left in RTL) to deselect and return to platforms grid */}
          <button
            type="button"
            onClick={handleClosePlatform}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200/80 flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer"
            title="رجوع إلى المنصات"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Categories Stack (Accordion Cards) */}
        <div className="space-y-2.5">
          {selectedPlatform.categories.length === 0 ? (
            <div className="p-6 text-center text-xs font-bold text-slate-500 bg-white rounded-2xl border border-sky-100">
              لا توجد فئات متاحة حالياً لهذه المنصة.
            </div>
          ) : (
            selectedPlatform.categories.map((cat) => {
              const isExpanded = expandedCategoryId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="rounded-2xl bg-white border border-sky-100 shadow-xs overflow-hidden transition-all hover:border-blue-300"
                >
                  {/* Category Header Row (Clickable) */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-sky-50/40 transition-colors text-right cursor-pointer"
                  >
                    {/* Category Title & Services Count */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <PlatformBrandIcon slug={selectedPlatform.slug} size="sm" />

                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {cat.nameAr}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          {cat.services.length} خدمة
                        </p>
                      </div>
                    </div>

                    {/* Chevron Indicator */}
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 mr-2 ${
                        isExpanded ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>

                  {/* Expanded Services List */}
                  {isExpanded && (
                    <div className="border-t border-sky-100 bg-sky-50/20 p-2.5 sm:p-3 space-y-2">
                      {cat.services.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400 font-semibold">
                          لا توجد خدمات نشطة في هذا القسم حالياً.
                        </div>
                      ) : (
                        cat.services.map((s) => (
                          <div
                            key={s.id}
                            id={`service-item-${s.id}`}
                            className="p-3 rounded-xl bg-white border border-sky-100 hover:border-blue-300 flex items-center justify-between gap-3 transition-all duration-300 shadow-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-900 line-clamp-2">
                                {s.nameAr || s.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-semibold mt-1">
                                <span>الحد الأدنى: {s.minQuantity.toLocaleString('en-US')}</span>
                                <span className="mx-1.5">•</span>
                                <span>الأقصى: {s.maxQuantity.toLocaleString('en-US')}</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className="text-xs font-black text-blue-600 font-sans">
                                ${formatSmmPrice(s.pricePer1000)}
                              </span>
                              <Link
                                href={`/new-order?serviceId=${s.id}`}
                                onClick={() => handleOrderClick(s.id, cat.id, selectedPlatform.id)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition flex items-center gap-1 active:scale-95 cursor-pointer"
                              >
                                <Zap className="w-3 h-3" />
                                <span>طلب</span>
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: Default Platforms Grid (2 Columns Grid)
  // =========================================================================
  return (
    <div className="space-y-3.5">
      {/* Section Header */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-base sm:text-lg font-black text-slate-900 font-sans">
          المنصات
        </h2>
        <span className="text-xs font-bold text-slate-500 font-sans">
          {visiblePlatforms.length} منصة
        </span>
      </div>

      {/* 2-Columns Grid (matches reference on mobile & desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
        {visiblePlatforms.map((p) => {
          const categoriesCount = p.categories.length;
          const servicesCount = p.categories.reduce(
            (acc, cat) => acc + cat.services.length,
            0
          );

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPlatform(p.id)}
              className="group p-3 sm:p-4 rounded-2xl bg-white border border-sky-100 hover:border-blue-400 shadow-xs hover:shadow-md transition flex items-center justify-between gap-2 text-right cursor-pointer active:scale-[0.99]"
            >
              {/* Text Information (Right in RTL) */}
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition">
                  {p.nameAr}
                </h3>
                <div className="text-[10px] sm:text-[11px] text-slate-500 font-semibold mt-0.5 truncate">
                  <span>{categoriesCount} فئة</span>
                  <span className="mx-1">•</span>
                  <span>{servicesCount} خدمة</span>
                </div>
              </div>

              {/* Real Official Platform Brand Icon (Left in RTL) */}
              <PlatformBrandIcon slug={p.slug} size="md" className="group-hover:scale-105 transition-transform" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
