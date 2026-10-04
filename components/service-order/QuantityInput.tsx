'use client';

import React from 'react';
import { Hash } from 'lucide-react';

interface QuantityInputProps {
  quantity: number;
  onChange: (val: number) => void;
  minQuantity: number;
  maxQuantity: number;
  formatK: (num: number) => string;
  error?: string;
}

export default function QuantityInput({
  quantity,
  onChange,
  minQuantity,
  maxQuantity,
  formatK,
  error,
}: QuantityInputProps) {
  const isOutOfRange = quantity > 0 && (quantity < minQuantity || quantity > maxQuantity);

  return (
    <div className="rounded-3xl bg-white p-4 sm:p-5 border border-sky-100 shadow-xs space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>الكمية المطلوبة</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-sans">
          {formatK(minQuantity)} – {formatK(maxQuantity)}
        </span>
      </div>

      <div className="relative">
        <input
          type="number"
          dir="ltr"
          value={quantity || ''}
          min={minQuantity}
          max={maxQuantity}
          onChange={(e) => onChange(Number(e.target.value))}
          required
          className={`w-full h-12 pr-11 pl-11 rounded-2xl bg-sky-50/30 border ${
            isOutOfRange ? 'border-rose-400 focus:border-rose-500' : 'border-sky-200 focus:border-blue-500'
          } focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-black text-sm font-sans shadow-xs outline-hidden transition text-center sm:text-right`}
        />
        <Hash className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-slate-400 pointer-events-none select-none">
          <span className="text-[8px] leading-tight font-black">▲</span>
          <span className="text-[8px] leading-tight font-black">▼</span>
        </div>
      </div>

      {isOutOfRange && (
        <p className="text-[11px] font-bold text-rose-600">
          ⚠️ الكمية يجب أن تكون بين {minQuantity.toLocaleString()} و {maxQuantity.toLocaleString()}
        </p>
      )}

      {error && !isOutOfRange && (
        <p className="text-[11px] font-bold text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
