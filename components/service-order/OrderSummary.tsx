'use client';

import React from 'react';
import Link from 'next/link';
import { Wallet, ArrowUpRight, CheckCircle2, Clock, Zap } from 'lucide-react';

interface OrderSummaryProps {
  calculatedPrice: number;
  balance: number;
  isBalanceSufficient: boolean;
  balanceDifference: number;
  avgTime?: string;
  speed?: string;
}

export default function OrderSummary({
  calculatedPrice,
  balance,
  isBalanceSufficient,
  balanceDifference,
  avgTime,
  speed,
}: OrderSummaryProps) {
  return (
    <div className="rounded-3xl bg-white p-4 sm:p-5 border border-sky-100 shadow-xs space-y-3.5">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
        <span className="w-2 h-2 rounded-full bg-blue-600" />
        <span>ملخص الطلب</span>
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
          <span className="text-lg sm:text-xl font-black text-blue-600 font-sans">
            ${balance.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Estimated Delivery Time Box (الوقت المستغرق التقريبي) */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <span>الوقت المستغرق التقريبي:</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-blue-700 bg-white px-2.5 py-1 rounded-xl border border-sky-200 font-sans shadow-xs flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>{avgTime || '15 دقيقة'}</span>
          </span>
          {speed && (
            <span className="text-[10px] text-slate-500 font-normal hidden sm:inline">
              ({speed})
            </span>
          )}
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
              <div className="text-[11px] text-rose-600 font-semibold font-sans mt-0.5">
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
  );
}
