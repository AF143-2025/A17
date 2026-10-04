import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import DashboardSearch from '@/components/DashboardSearch';
import {
  ShoppingBag,
  Zap,
  ArrowLeft,
  Clock,
  TrendingUp,
  Instagram,
  Video,
  Youtube,
  Facebook,
  Send,
  Twitter,
  Sparkles,
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const balance = user.wallet?.balance || 0;

  // Fetch KPI counters, platforms, and recent orders concurrently
  const [
    totalOrdersCount,
    activeOrdersCount,
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

    // 2. Active orders in progress
    db.order.count({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'PROCESSING', 'IN_PROGRESS'] },
      },
    }),

    // 3. Completed orders
    db.order.count({
      where: {
        userId: user.id,
        status: 'COMPLETED',
      },
    }),

    // 4. Total spent on valid orders
    db.order.aggregate({
      where: {
        userId: user.id,
        status: { notIn: ['CANCELED', 'REFUNDED'] },
      },
      _sum: { price: true },
    }),

    // 5. Total active services in platform
    db.service.count({
      where: { status: true },
    }),

    // 6. Active platforms with category and service counts
    db.platform.findMany({
      where: { status: true },
      include: {
        categories: {
          where: { status: true },
          include: {
            _count: {
              select: { services: { where: { status: true } } },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    }),

    // 7. Last 6 user orders for live tracking
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

  const totalSpent = spentAgg._sum.price || 0;

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

  // Platform branding styles matching the signature look
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
      {/* 4. Section Header: المنصات  10 منصة                                       */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-base sm:text-lg font-black text-slate-900 font-sans">
          المنصات
        </h2>
        <span className="text-xs font-bold text-slate-500 font-sans">
          {platforms.length} منصة
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 5. Platforms Grid: شبكة المنصات في عمودين (2 Columns Grid)                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {platforms.map((p) => {
          const Icon = getPlatformIcon(p.slug);
          const style = getPlatformStyle(p.slug);
          const categoriesCount = p.categories.length;
          const servicesCount = p.categories.reduce(
            (acc, cat) => acc + (cat._count?.services || 0),
            0
          );

          return (
            <Link
              key={p.id}
              href={`/new-order?platform=${p.slug}`}
              className="group p-3 sm:p-4 rounded-2xl bg-white border border-sky-100 hover:border-blue-400 shadow-xs hover:shadow-md transition flex items-center justify-between gap-2"
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
            </Link>
          );
        })}
      </div>

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
