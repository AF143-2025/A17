'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  ChevronDown,
  Zap,
  Instagram,
  Video,
  Youtube,
  Facebook,
  Send,
  Twitter,
  Sparkles,
} from 'lucide-react';

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

  // Platform icon helper
  const getPlatformIcon = (slug: string) => {
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

  // Platform branding styles
  const getPlatformStyle = (slug: string) => {
    switch (slug) {
      case 'instagram':
        return {
          iconBg: 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white',
        };
      case 'tiktok':
        return {
          iconBg: 'bg-slate-900 text-cyan-400',
        };
      case 'youtube':
        return {
          iconBg: 'bg-red-600 text-white',
        };
      case 'facebook':
        return {
          iconBg: 'bg-blue-600 text-white',
        };
      case 'telegram':
        return {
          iconBg: 'bg-gradient-to-tr from-[#0088cc] to-[#00b0ff] text-white',
        };
      case 'x':
        return {
          iconBg: 'bg-slate-950 text-white',
        };
      default:
        return {
          iconBg: 'bg-emerald-600 text-white',
        };
    }
  };

  const selectedPlatform = platforms.find((p) => p.id === selectedPlatformId);

  const toggleCategory = (catId: string) => {
    setExpandedCategoryId((prev) => (prev === catId ? null : catId));
  };

  // =========================================================================
  // VIEW 1: Categories Drill-Down View (عند الضغط على أي منصة - مطابق للصورة)
  // =========================================================================
  if (selectedPlatform) {
    const Icon = getPlatformIcon(selectedPlatform.slug);
    const style = getPlatformStyle(selectedPlatform.slug);
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
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${style.iconBg}`}
            >
              <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
            </div>

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
            onClick={() => {
              setSelectedPlatformId(null);
              setExpandedCategoryId(null);
            }}
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
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${style.iconBg}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

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
                            className="p-3 rounded-xl bg-white border border-sky-100 hover:border-blue-300 flex items-center justify-between gap-3 transition shadow-xs"
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
                                ${s.pricePer1000.toFixed(3)}
                              </span>
                              <Link
                                href={`/new-order?serviceId=${s.id}`}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition flex items-center gap-1 active:scale-95"
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
          {platforms.length} منصة
        </span>
      </div>

      {/* 2-Columns Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {platforms.map((p) => {
          const Icon = getPlatformIcon(p.slug);
          const style = getPlatformStyle(p.slug);
          const categoriesCount = p.categories.length;
          const servicesCount = p.categories.reduce(
            (acc, cat) => acc + cat.services.length,
            0
          );

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedPlatformId(p.id);
                setExpandedCategoryId(null);
              }}
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

              {/* Platform Rounded Squircle Icon (Left in RTL) */}
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition duration-200 ${style.iconBg}`}
              >
                <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
