'use client';

import React from 'react';
import { Clock, Tag, Flame, Info, Zap } from 'lucide-react';
import PlatformBrandIcon from '@/components/PlatformBrandIcon';

interface ServiceInfoCardProps {
  service: {
    id: string;
    name: string;
    nameAr?: string;
    description: string;
    minQuantity: number;
    maxQuantity: number;
    pricePer1000: number;
    speed?: string;
    avgTime?: string;
  };
  categoryName: string;
  platformSlug: string;
  descriptionExpanded: boolean;
  onToggleDescription: () => void;
  formatK: (num: number) => string;
}

export default function ServiceInfoCard({
  service,
  categoryName,
  platformSlug,
  descriptionExpanded,
  onToggleDescription,
  formatK,
}: ServiceInfoCardProps) {
  return (
    <div className="rounded-3xl bg-white p-4 sm:p-5 border border-sky-100 shadow-xs space-y-3.5">
      {/* Service Title & Category Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-snug line-clamp-2">
            {service.nameAr || service.name}
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mt-1">
            <span className="font-mono px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
              #{service.id.slice(-4)}
            </span>
            <span>•</span>
            <span className="truncate">{categoryName}</span>
            <span>•</span>
            <span className="text-slate-400">ضمان وتعويض</span>
          </div>
        </div>

        {/* Real Official Platform Brand Icon */}
        <PlatformBrandIcon slug={platformSlug} size="md" />
      </div>

      {/* 4-Columns Metric Bar (الأدنى, الأقصى, السعر, وقت الإنجاز) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 p-2.5 rounded-2xl bg-sky-50/60 border border-sky-100 text-center">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">الأدنى</span>
          <span className="text-xs sm:text-sm font-black text-slate-900 font-sans mt-0.5 block">
            {formatK(service.minQuantity)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">الأقصى</span>
          <span className="text-xs sm:text-sm font-black text-slate-900 font-sans mt-0.5 block">
            {formatK(service.maxQuantity)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">السعر</span>
          <span className="text-xs sm:text-sm font-black text-blue-600 font-sans mt-0.5 block">
            ${service.pricePer1000.toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">التنفيذ</span>
          <span className="text-xs sm:text-sm font-black text-slate-800 font-sans mt-0.5 block truncate text-blue-700">
            {service.speed || 'آلي فوري ⚡'}
          </span>
        </div>
      </div>

      {/* Badges Row (بدء فوري, حقيقي, الأكثر طلباً) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-blue-700 text-[10px] font-bold border border-sky-200">
          <Zap className="w-3 h-3 text-amber-500" />
          <span>بدء فوري ⚡</span>
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
          <Tag className="w-3 h-3 text-emerald-600" />
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
            {service.description || 'خدمة سريعة وآمنة ومضمونة بنسبة 100% لتنمية حسابك.'}
          </p>
        </div>

        {service.description && service.description.length > 80 && (
          <div className="text-left">
            <button
              type="button"
              onClick={onToggleDescription}
              className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>{descriptionExpanded ? 'عرض أقل ˄' : 'عرض المزيد ˅'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
