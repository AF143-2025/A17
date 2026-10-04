'use client';

import React, { Suspense } from 'react';
import ServiceDetailsOrder from '@/components/service-order/ServiceDetailsOrder';
import { Loader2 } from 'lucide-react';

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span className="text-xs font-bold">جاري تحميل تفاصيل الخدمة...</span>
        </div>
      }
    >
      <ServiceDetailsOrder />
    </Suspense>
  );
}
