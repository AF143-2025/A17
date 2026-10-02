import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import {
  Wallet,
  PlusCircle,
  TrendingUp,
  Clock,
  Zap,
  ArrowLeft,
  CheckCircle2,
  Instagram,
  Video,
  Youtube,
  Facebook,
  Send,
  Twitter,
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

    // 5. Active platforms with service counts
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
      default: return TrendingUp;
    }
  };

  // Platform branding styles
  const getPlatformStyle = (slug: string) => {
    switch (slug) {
      case 'instagram':
        return {
          iconBg: 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white',
          badge: 'bg-pink-50 text-pink-700 border-pink-200',
        };
      case 'tiktok':
        return {
          iconBg: 'bg-slate-900 text-cyan-400',
          badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        };
      case 'youtube':
        return {
          iconBg: 'bg-red-600 text-white',
          badge: 'bg-red-50 text-red-700 border-red-200',
        };
      case 'facebook':
        return {
          iconBg: 'bg-blue-600 text-white',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'telegram':
        return {
          iconBg: 'bg-gradient-to-tr from-[#0088cc] to-[#00b0ff] text-white',
          badge: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      case 'x':
        return {
          iconBg: 'bg-slate-950 text-white',
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
        };
      default:
        return {
          iconBg: 'bg-blue-600 text-white',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
        };
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 font-sans">
      {/* ========================================================================= */}
      {/* 1. Sleek Header: User Welcome & Instant Actions                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white border border-sky-100 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>مرحباً، {user.username} 👋</span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              حساب نشط 🛡️
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            لوحة تحكم حسابك لمتابعة الرصيد والطلبات وإنجاز العمليات فوراً.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/new-order"
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition transform active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Zap className="w-4 h-4" />
            <span>طلب جديد ⚡</span>
          </Link>
          <Link
            href="/wallet#deposit-section"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-blue-700 border border-sky-200 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Wallet className="w-4 h-4 text-blue-600" />
            <span>شحن الرصيد</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Top Spotlight: رصيد المستخدم والطلبات المكتملة في البداية                 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: رصيد المحفظة المتاح (User Balance) */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg shadow-blue-600/15 flex flex-col justify-between">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-blue-50 border border-white/20">
                <Wallet className="w-3.5 h-3.5" />
                رصيد المحفظة المتاح
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black font-sans tracking-tight">
                  ${balance.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-blue-200 font-mono">USD</span>
              </div>
              <p className="text-xs text-blue-100/90 mt-1">
                رصيدك الفعلي الجاهز للاستخدام والتنفيذ الفوري
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-4 border-t border-white/15 flex items-center gap-2.5">
            <Link
              href="/wallet#deposit-section"
              className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold text-center transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>شحن الرصيد 💳</span>
            </Link>
            <Link
              href="/new-order"
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold text-center transition border border-white/20 flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>طلب جديد ⚡</span>
            </Link>
          </div>
        </div>

        {/* Card 2: الطلبات المكتملة بنجاح (Completed Orders) */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-white border border-sky-100 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                الطلبات المكتملة بنجاح
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 font-sans tracking-tight">
                  {completedOrdersCount.toLocaleString('en-US')}
                </span>
                <span className="text-sm font-bold text-emerald-600">طلب مكتمل</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                تم تسليمها بنجاح من إجمالي {totalOrdersCount} طلب منفذ
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-sky-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>قيد التنفيذ: <strong className="text-slate-900 font-sans">{activeOrdersCount}</strong></span>
              </div>
              <div className="text-slate-300">•</div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                <span>المصروف: <strong className="text-slate-900 font-sans">${totalSpent.toFixed(2)}</strong></span>
              </div>
            </div>
            <Link
              href="/orders"
              className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 shrink-0"
            >
              <span>سجل الطلبات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Secondary Account Metrics (الطلبات النشطة والمصروفات)                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-sky-100 shadow-xs flex items-center justify-between hover:border-amber-300 transition">
          <div>
            <span className="text-xs font-bold text-slate-500">طلباتك قيد التنفيذ</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans mt-0.5">
              {activeOrdersCount}{' '}
              <span className="text-xs font-bold text-amber-600 font-sans">
                {activeOrdersCount > 0 ? 'جارية المعالجة ⚡' : 'لا توجد'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-sky-100 shadow-xs flex items-center justify-between hover:border-purple-300 transition">
          <div>
            <span className="text-xs font-bold text-slate-500">إجمالي مصروفات الحساب</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans mt-0.5">
              ${totalSpent.toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-400 font-mono">USD</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Platform Quick Shortcuts (طلب سريع حسب المنصة)                          */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 font-sans">
              طلب سريع حسب المنصة
            </h2>
            <p className="text-xs text-slate-500">اختر المنصة لبدء طلبك فوراً</p>
          </div>
          <Link
            href="/services"
            className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
          >
            <span>دليل الخدمات</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {platforms.map((p) => {
            const Icon = getPlatformIcon(p.slug);
            const style = getPlatformStyle(p.slug);
            const servicesCount = p.categories.reduce(
              (acc, cat) => acc + (cat._count?.services || 0),
              0
            );

            return (
              <Link
                key={p.id}
                href={`/new-order?platform=${p.slug}`}
                className="group p-4 rounded-2xl bg-white border border-sky-100 hover:border-blue-400 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col items-center text-center hover:-translate-y-0.5"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-110 transition duration-200 ${style.iconBg}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-3">
                  {p.nameAr}
                </span>
                <span className="text-[11px] text-blue-600 font-semibold mt-1">
                  {servicesCount > 0 ? `${servicesCount} خدمة` : 'تصفح'}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. User's Recent Orders (سجل آخر طلباتك)                                   */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 font-sans">
              سجل آخر طلباتك
            </h2>
            <p className="text-xs text-slate-500">متابعة فورية لحالة طلباتك المنفذة</p>
          </div>
          <Link
            href="/orders"
            className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
          >
            <span>سجل الطلبات بالكامل ({totalOrdersCount})</span>
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
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
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

              {/* Mobile Cards View */}
              <div className="sm:hidden divide-y divide-sky-100">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href="/orders"
                    className="block p-4 hover:bg-sky-50/40 transition active:bg-sky-50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        #{order.id.slice(-6)}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                      {order.service.name}
                    </h4>
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="font-sans text-slate-600">
                        {order.quantity.toLocaleString('en-US')} وحدة
                      </span>
                      <span className="font-sans font-black text-blue-600">
                        ${order.price.toFixed(2)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
