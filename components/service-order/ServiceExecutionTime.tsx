'use client';

import React from 'react';
import { Clock, Zap } from 'lucide-react';
import { getProviderMentionedTime } from '@/lib/service-time';

interface ServiceExecutionTimeProps {
  service: {
    name?: string;
    nameAr?: string;
    description?: string;
    speed?: string;
    avgTime?: string;
  };
}

export default function ServiceExecutionTime({ service }: ServiceExecutionTimeProps) {
  const info = getProviderMentionedTime(service);

  return (
    <div className="rounded-3xl bg-white p-4 sm:p-5 border border-sky-100 shadow-xs space-y-3">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>الوقت المستغرق والتنفيذ</span>
        </div>
        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            info.source === 'provider_explicit' || info.source === 'provider_instant'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : info.source === 'provider_speed'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          {info.badge}
        </span>
      </div>

      {/* Provider Mentioned Time Display Box */}
      <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-slate-500 font-bold block">
              متوسط سرعة وبدء الخدمة:
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 font-sans block mt-0.5 truncate">
              {info.timeText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
