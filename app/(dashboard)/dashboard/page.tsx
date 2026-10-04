import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DashboardSearch from '@/components/DashboardSearch';
import PlatformServicesView from '@/components/PlatformServicesView';
import { ShoppingBag, Zap } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const balance = user.wallet?.balance || 0;

  // Fetch KPI counters and platforms with categories & services
  const [
    completedOrdersCount,
    totalServicesCount,
    platforms,
  ] = await Promise.all([
    // 1. Completed orders count
    db.order.count({
      where: {
        userId: user.id,
        status: 'COMPLETED',
      },
    }),

    // 2. Total active services in platform
    db.service.count({
      where: { status: true },
    }),

    // 3. Active platforms with categories and services
    db.platform.findMany({
      where: { status: true },
      include: {
        categories: {
          where: { status: true },
          include: {
            services: {
              where: { status: true },
              select: {
                id: true,
                name: true,
                nameAr: true,
                pricePer1000: true,
                minQuantity: true,
                maxQuantity: true,
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200 font-sans max-w-5xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. Top Balance Card (الرصيد يميناً وزر + شحن يساراً)                        */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-sky-100 shadow-sm flex items-center justify-between">
        {/* Right side in RTL: Label "الرصيد" and Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-slate-500">الرصيد</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-sans tracking-tight">
            ${balance.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-slate-400 font-mono">USD</span>
        </div>

        {/* Left side in RTL: Yellow Accent Button "+ شحن" */}
        <Link
          href="/wallet#deposit-section"
          className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 active:bg-amber-500 text-slate-950 text-xs sm:text-sm font-black shadow-xs transition flex items-center gap-1.5 active:scale-95"
        >
          <span className="text-base font-black leading-none">+</span>
          <span>شحن</span>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 2. Sub-Balance Stats: مكتمل  ⚡ خدمة                                      */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-end gap-4 text-xs font-bold text-slate-500 px-1">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-slate-800 font-sans">{totalServicesCount.toLocaleString('en-US')}</span>
          <span>خدمة</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-800 font-sans">{completedOrdersCount.toLocaleString('en-US')}</span>
          <span>مكتمل</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Search Bar: ابحث بالاسم أو رقم الخدمة (ID)...                           */}
      {/* ========================================================================= */}
      <div>
        <DashboardSearch />
      </div>

      {/* ========================================================================= */}
      {/* 4 & 5. Platforms Grid & Interactive Categories Drill-Down (عند الضغط)     */}
      {/* ========================================================================= */}
      <PlatformServicesView platforms={platforms} />
    </div>
  );
}
