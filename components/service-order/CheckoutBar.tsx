'use client';

import React from 'react';
import Link from 'next/link';
import { Wallet, Zap, Loader2 } from 'lucide-react';

interface CheckoutBarProps {
  calculatedPrice: number;
  isBalanceSufficient: boolean;
  submitting: boolean;
}

export default function CheckoutBar({
  calculatedPrice,
  isBalanceSufficient,
  submitting,
}: CheckoutBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-sky-100 shadow-xl p-3 sm:p-4">
      <div className="max-w-xl mx-auto space-y-2">
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
                <span>تأكيد الطلب</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
