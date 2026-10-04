import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import DashboardSearch from '@/components/DashboardSearch';
import PlatformServicesView from '@/components/PlatformServicesView';
import { ShoppingBag, Zap, ArrowLeft, Clock } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const balance = user.wallet?.balance || 0;

  // Fetch KPI counters, platforms with full categories & services, and recent orders
  const [
    totalOrdersCount,
    completedOrdersCount,
    spentAgg,
    totalServicesCount,
    platforms,
    recentOrders,
  ] = await Promise.all([
    // 1. Total user orders
    db.order.count({
      where: { userId: user.id },
    }),

    // 2. Completed orders
    db.order.count({
      where: {
        userId: user.id,
        status: 'COMPLETED',
      },
    }),

    // 3. Total spent on valid orders
    db.order.aggregate({
      where: {
        userId: user.id,
        status: { notIn: ['CANCELED', 'REFUNDED'] },
      },
      _sum: { price: true },
    }),

    // 4. Total active services in platform
    db.service.count({
      where: { status: true },
    }),

    // 5. Active platforms with categories and services
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

    // 6. Last 6 user orders for live tracking
    db.order.findMany({
      where: { userId: user.id },
      include: {
        service: {
          include: {
            category: {
              include: { platform: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200 font-sans max-w-5xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. Top Balance Card (مطابق لترتيب الصورة: الرصيد يميناً وزر + شحن يساراً)  */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-sky-100 shadow-sm flex items-center justify-between">
        {/* Right side in RTL: Label "الرصيد" and Value "0.00 USD" */}
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
      {/* 2. Sub-Balance Stats: 34 مكتمل  ⚡ 116 خدمة                                */}
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

      {/* ========================================================================= */}
      {/* 6. Recent Orders Live Tracking (سجل آخر طلباتك)                             */}
      {/* ========================================================================= */}
      <div className="pt-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 font-sans">
              سجل آخر طلباتك
            </h2>
            <p className="text-[11px] text-slate-500">متابعة فورية لحالة وتحديثات طلباتك</p>
          </div>
          <Link
            href="/orders"
            className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
          >
            <span>عرض الكل ({totalOrdersCount})</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl bg-white border border-sky-100 shadow-xs overflow-hidden">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-xs font-bold text-slate-700">لا توجد طلبات سابقة حتى الآن</p>
              <Link
                href="/new-order"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-bold"
              >
                <span>إنشاء طلبك الأول الآن</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-sky-50/70 text-slate-600 font-bold border-b border-sky-100">
                  <tr>
                    <th className="py-3 px-4">رقم الطلب</th>
                    <th className="py-3 px-4">الخدمة</th>
                    <th className="py-3 px-4">الكمية</th>
                    <th className="py-3 px-4">التكلفة</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 text-slate-700">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-sky-50/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        #{order.id.slice(-6)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                        {order.service.name}
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-800">
                        {order.quantity.toLocaleString('en-US')}
                      </td>
                      <td className="py-3 px-4 font-sans font-black text-blue-600">
                        ${order.price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
