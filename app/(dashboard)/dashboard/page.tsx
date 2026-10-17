import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DashboardSearch from '@/components/DashboardSearch';
import PlatformServicesView from '@/components/PlatformServicesView';
import { ShoppingBag, Zap } from 'lucide-react';
import { formatSmmBalance } from '@/lib/currency';

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
      where: {
        status: true,
        slug: { not: 'other' },
        NOT: { nameAr: { contains: 'أخرى' } },
      },
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

  let providerBalance = 0;
  let clientsBalance = 0;

  if (user.role === 'ADMIN') {
    const [providersSum, clientsSum] = await Promise.all([
      db.provider.findMany({
        where: { status: true },
        select: { balance: true },
      }),
      db.wallet.aggregate({
        where: { user: { role: 'USER' } },
        _sum: { balance: true },
      }),
    ]);
    providerBalance = providersSum.reduce((acc, p) => acc + (p.balance || 0), 0);
    clientsBalance = clientsSum._sum.balance || 0;
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200 font-sans max-w-5xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. Top Balance Card (الرصيد يميناً وزر + شحن يساراً)                        */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 1. Top Balance Card (الرصيد يميناً وزر + شحن يساراً)                        */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-sky-100 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Right side in RTL: Label "الرصيد" and Value */}
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold text-slate-500">
              {user.role === 'ADMIN' ? 'رصيد محفظتك' : 'الرصيد'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-sans tracking-tight">
              ${formatSmmBalance(balance)}
            </span>
            <span className="text-xs font-bold text-slate-400 font-mono">USD</span>
          </div>

          {/* Left side in RTL: Yellow Accent Button "+ شحن" or Admin Link */}
          {user.role === 'ADMIN' ? (
            <Link
              href="/admin"
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow-xs transition flex items-center gap-1.5 active:scale-95"
            >
              <span>لوحة الإدارة ⚡</span>
            </Link>
          ) : (
            <Link
              href="/wallet#deposit-section"
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 active:bg-amber-500 text-slate-950 text-xs sm:text-sm font-black shadow-xs transition flex items-center gap-1.5 active:scale-95"
            >
              <span className="text-base font-black leading-none">+</span>
              <span>شحن</span>
            </Link>
          )}
        </div>

        {/* Admin Exclusive: Clear Distinction between Provider Balance & Clients Balance */}
        {user.role === 'ADMIN' && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3 pt-3 border-t border-sky-100">
            <Link
              href="/admin/providers"
              className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/70 transition group"
            >
              <span className="text-[11px] font-bold text-slate-700">رصيدك عند المزود:</span>
              <span className="text-xs font-black text-blue-700 font-sans group-hover:underline">
                ${formatSmmBalance(providerBalance)} USD
              </span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/70 transition group"
            >
              <span className="text-[11px] font-bold text-slate-700">رصيد العملاء:</span>
              <span className="text-xs font-black text-emerald-700 font-sans group-hover:underline">
                ${formatSmmBalance(clientsBalance)} USD
              </span>
            </Link>
          </div>
        )}
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
