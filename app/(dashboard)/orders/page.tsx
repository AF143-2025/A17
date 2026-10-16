'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import {
  ShoppingBag,
  Search,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Headphones,
  ArrowUpRight,
  ArrowLeft,
} from 'lucide-react';

interface OrderEvent {
  id: string;
  eventType: string;
  message: string;
  createdAt: string;
}

interface OrderItem {
  id: string;
  targetUrl: string;
  quantity: number;
  price: number;
  status: string;
  startCount: number;
  remains: number;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    name: string;
    category: {
      name: string;
      platform: {
        name: string;
        nameAr: string;
        slug: string;
      };
    };
  };
  events: OrderEvent[];
}

function SmoothCounter({ target }: { target: number }) {
  const [displayCount, setDisplayCount] = useState(target);

  useEffect(() => {
    if (displayCount === target) return;
    const start = displayCount;
    const diff = target - start;
    const duration = 700;
    const startTime = performance.now();

    let animationFrameId: number;

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 2);
      const current = Math.round(start + diff * easedProgress);
      setDisplayCount(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target]);

  return <>{displayCount.toLocaleString('en-US')}</>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    ALL: 0,
    PENDING: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    PARTIAL: 0,
    PROCESSING: 0,
    CANCELED: 0,
    REFUNDED: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal detail view
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Filter tabs definition matching exact user requirements
  const filterTabs = [
    { id: 'ALL', label: 'الكل', key: 'ALL' },
    { id: 'PENDING', label: 'الانتظار', key: 'PENDING' },
    { id: 'IN_PROGRESS', label: 'التنفيذ', key: 'IN_PROGRESS' },
    { id: 'COMPLETED', label: 'مكتمل', key: 'COMPLETED' },
    { id: 'PARTIAL', label: 'جزئي', key: 'PARTIAL' },
    { id: 'PROCESSING', label: 'المعالجة', key: 'PROCESSING' },
    { id: 'CANCELED', label: 'ملغي', key: 'CANCELED' },
    { id: 'REFUNDED', label: 'الاسترداد', key: 'REFUNDED' },
  ];

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts);
        }
        if (selectedOrder) {
          const freshSelected = (data.orders || []).find((o: OrderItem) => o.id === selectedOrder.id);
          if (freshSelected) setSelectedOrder(freshSelected);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  // Live auto-polling: when there are active orders, silently update every 6 seconds
  const hasActiveOrders = orders.some((o) =>
    ['PENDING', 'PROCESSING', 'IN_PROGRESS'].includes(o.status)
  );

  useEffect(() => {
    if (!hasActiveOrders) return;
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [hasActiveOrders, page, statusFilter, search, selectedOrder?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleSyncOrder = async (orderId: string) => {
    setSyncingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? data.order : o))
          );
          if (selectedOrder?.id === orderId) {
            setSelectedOrder(data.order);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingId(null);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const getTimelineSteps = (order: OrderItem) => {
    const isCompleted = order.status === 'COMPLETED';
    const isCanceled = order.status === 'CANCELED';
    const isRefunded = order.status === 'REFUNDED';
    const isPartial = order.status === 'PARTIAL';
    const isProcessing = ['PROCESSING', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL'].includes(order.status);

    return [
      {
        title: 'إنشاء الطلب',
        desc: 'تم تسجيل الطلب في المنصة',
        done: true,
      },
      {
        title: 'تأكيد الدفع',
        desc: 'تم خصم القيمة من المحفظة',
        done: true,
      },
      {
        title: 'الربط بشبكة التنفيذ',
        desc: 'تم توجيه الطلب للتنفيذ المباشر',
        done: isProcessing || isCompleted || isPartial,
      },
      {
        title: 'قيد المعالجة والتنفيذ',
        desc: 'جاري تسليم الخدمة تدريجياً',
        done: isProcessing || isCompleted || isPartial,
      },
      {
        title: isRefunded
          ? 'تم الاسترداد'
          : isCanceled
          ? 'تم إلغاء الطلب'
          : isPartial
          ? 'مكتمل جزئياً'
          : 'مكتمل بالكامل',
        desc: isRefunded
          ? 'تمت إعادة المبلغ إلى محفظتك'
          : isCanceled
          ? 'تم إلغاء الطلب واسترجاع الرصيد'
          : isPartial
          ? 'تم استرجاع المبلغ المتبقي'
          : 'اكتمل تنفيذ الطلب بنجاح',
        done: isCompleted || isCanceled || isRefunded || isPartial,
        isError: isCanceled,
      },
    ];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Status Filter Tabs matching exact user requirements */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-sky-200">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          const count = statusCounts[tab.key] ?? 0;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                  : 'bg-white hover:bg-sky-50 text-slate-700 border-sky-100 shadow-sm'
              }`}
            >
              <span>[{tab.label}]</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-sky-50 text-slate-600 border border-sky-200'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Support Tab */}
        <Link
          href="/support"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border bg-white hover:bg-amber-50 text-amber-700 hover:text-amber-800 border-amber-200 shadow-sm"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>[الدعم الفني]</span>
        </Link>
      </div>

      {/* 2. Main Section Header & Search */}
      <div className="p-5 rounded-3xl bg-white border border-sky-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-sans flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            <span>طلباتي</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            سجل وتفاصيل جميع طلباتك الحالية والسابقة ({totalCount} طلب)
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث برقم الطلب، الخدمة، أو الرابط..."
            className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-2.5 pl-10 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* 3. Orders Table matching exact columns requested */}
      <div className="rounded-3xl bg-white border border-sky-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <span className="text-xs font-medium">جاري تحميل طلباتك...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">لا توجد طلبات في هذا القسم</p>
            <Link
              href="/new-order"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              <span>إنشاء طلب جديد الآن</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-sky-50/70 text-slate-600 font-bold border-b border-sky-100">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">رقم الطلب</th>
                    <th className="py-3.5 px-4">الخدمة</th>
                    <th className="py-3.5 px-4">الرابط</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">التكلفة</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">الكمية</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">الحالة</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 text-slate-700">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-sky-50/50 transition"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500 whitespace-nowrap">
                        #{order.id.slice(-6)}
                      </td>
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="font-bold text-slate-900 truncate" title={order.service.name}>
                          {order.service.name}
                        </div>
                        <div className="text-[10px] text-blue-600 mt-0.5 truncate">
                          {order.service.category?.platform?.nameAr}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px] truncate font-mono text-slate-600">
                        <a
                          href={order.targetUrl.startsWith('http') ? order.targetUrl : `https://${order.targetUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[180px]"
                          title={order.targetUrl}
                        >
                          <span className="truncate">{order.targetUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-black text-blue-600 whitespace-nowrap">
                        ${order.price.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-sans whitespace-nowrap">
                        {order.status === 'COMPLETED' ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="text-emerald-600 font-mono font-black">{order.quantity.toLocaleString('en-US')}</span>
                              <span className="text-slate-400 font-normal text-[11px]">من</span>
                              <span className="font-mono text-slate-700">{order.quantity.toLocaleString('en-US')}</span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>مكتمل بالكامل (100%)</span>
                            </span>
                          </div>
                        ) : ['PROCESSING', 'IN_PROGRESS'].includes(order.status) ? (
                          <div className="space-y-1 min-w-[130px]">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <div className="flex items-center gap-1">
                                <span className="text-blue-600 font-mono font-black">
                                  <SmoothCounter target={Math.max(0, Math.min(order.quantity, order.quantity - order.remains))} />
                                </span>
                                <span className="text-slate-400 font-normal text-[10px]">من</span>
                                <span className="font-mono text-slate-700">{order.quantity.toLocaleString('en-US')}</span>
                              </div>
                              <span className="text-[10px] font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {Math.min(100, Math.max(0, Math.round(((order.quantity - order.remains) / order.quantity) * 100)))}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${Math.max(4, Math.min(100, Math.round(((order.quantity - order.remains) / order.quantity) * 100)))}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                              </span>
                              <span>جاري الرشق...</span>
                            </div>
                          </div>
                        ) : order.status === 'PENDING' ? (
                          <div className="space-y-0.5 font-bold text-slate-800">
                            <div>{order.quantity.toLocaleString('en-US')}</div>
                            <span className="block text-[10px] text-amber-600 font-normal">
                              قيد بدء الرشق
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5 font-bold text-slate-800">
                            <div>{order.quantity.toLocaleString('en-US')}</div>
                            {order.remains > 0 && (
                              <span className="block text-[10px] text-slate-500 font-normal">
                                متبقي: {order.remains.toLocaleString('en-US')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition border border-blue-200"
                          title="عرض تفاصيل الطلب"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>عرض</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< sm) */}
            <div className="sm:hidden divide-y divide-sky-100">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 hover:bg-sky-50/50 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      #{order.id.slice(-6)}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-900 leading-snug">
                      {order.service.name}
                    </h4>
                    <span className="text-[10px] text-blue-600 font-semibold">
                      {order.service.category?.platform?.nameAr}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 truncate" dir="ltr">
                    {order.targetUrl}
                  </div>

                  {/* Active delivery counter & progress bar in mobile */}
                  {['PROCESSING', 'IN_PROGRESS'].includes(order.status) && (
                    <div className="p-2.5 rounded-2xl bg-blue-50/70 border border-blue-100/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-700 flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                          </span>
                          <span>جاري الرشق...</span>
                        </span>
                        <div className="flex items-center gap-1 font-mono text-xs">
                          <span className="font-black text-blue-700">
                            <SmoothCounter target={Math.max(0, Math.min(order.quantity, order.quantity - order.remains))} />
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className="font-bold text-slate-700">{order.quantity.toLocaleString('en-US')}</span>
                          <span className="text-[10px] text-blue-600 font-bold mr-1">
                            ({Math.min(100, Math.max(0, Math.round(((order.quantity - order.remains) / order.quantity) * 100)))}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${Math.max(5, Math.min(100, Math.round(((order.quantity - order.remains) / order.quantity) * 100)))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {order.status === 'COMPLETED' && (
                    <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
                      <span className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>اكتمل الرشق بالكامل</span>
                      </span>
                      <span className="font-mono font-bold">
                        {order.quantity.toLocaleString('en-US')} / {order.quantity.toLocaleString('en-US')} (100%)
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-slate-800">
                        {order.quantity.toLocaleString('en-US')} وحدة
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-sans font-black text-blue-600">
                        ${order.price.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition border border-blue-200"
                      title="عرض تفاصيل الطلب"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>عرض</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-sky-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              صفحة {page} من {totalPages}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg bg-white border border-sky-200 disabled:opacity-40 hover:bg-sky-50 text-slate-700 shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg bg-white border border-sky-200 disabled:opacity-40 hover:bg-sky-50 text-slate-700 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Order Details & Timeline Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-sky-100">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-black text-slate-900 font-sans">
                  تفاصيل الطلب #{selectedOrder.id.slice(-6)}
                </h3>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSyncOrder(selectedOrder.id)}
                  disabled={syncingId === selectedOrder.id}
                  className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-slate-700 border border-sky-200 transition"
                  title="تحديث الحالة الآن"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingId === selectedOrder.id ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-slate-500 hover:text-slate-800 border border-sky-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                مسار تنفيذ الطلب (Timeline)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {getTimelineSteps(selectedOrder).map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border flex sm:flex-col items-center text-right sm:text-center justify-start sm:justify-between gap-3 sm:gap-1 ${
                      step.done
                        ? step.isError
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-white border border-sky-200 shrink-0 text-xs font-bold text-slate-700">
                      {step.done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : idx + 1}
                    </div>
                    <div className="flex flex-col sm:items-center">
                      <span className="text-xs sm:text-[11px] font-bold text-slate-900 leading-tight">
                        {step.title}
                      </span>
                      <span className="text-[10px] sm:text-[9px] text-slate-500 mt-0.5 leading-snug">
                        {step.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Parameters Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 space-y-1">
                <span className="text-slate-500">الخدمة:</span>
                <p className="font-bold text-slate-900">{selectedOrder.service.name}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">الرابط:</span>
                  <button
                    onClick={() => handleCopyLink(selectedOrder.targetUrl)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                  >
                    {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
                <p className="font-mono text-slate-800 truncate" title={selectedOrder.targetUrl}>
                  {selectedOrder.targetUrl}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 space-y-1">
                <span className="text-slate-500">الكمية المطلوبة:</span>
                <p className="font-bold text-slate-900 font-sans">
                  {selectedOrder.quantity.toLocaleString('en-US')}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 space-y-1">
                <span className="text-slate-500">المنجز حتى الآن:</span>
                <p className="font-bold text-blue-600 font-sans">
                  {Math.max(0, Math.min(selectedOrder.quantity, selectedOrder.quantity - selectedOrder.remains)).toLocaleString('en-US')}
                  {selectedOrder.quantity > 0 && (
                    <span className="text-xs font-normal text-slate-500 mr-1.5">
                      ({Math.min(100, Math.round((Math.max(0, selectedOrder.quantity - selectedOrder.remains) / selectedOrder.quantity) * 100))}%)
                    </span>
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 space-y-1">
                <span className="text-slate-500">التكلفة:</span>
                <p className="font-black text-blue-600 font-sans">
                  ${selectedOrder.price.toFixed(2)}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 space-y-1">
                <span className="text-slate-500">الكمية المتبقية:</span>
                <p className="font-mono text-slate-800">{selectedOrder.remains.toLocaleString('en-US')}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 space-y-1">
                <span className="text-slate-500">العداد الأولي:</span>
                <p className="font-mono text-slate-800">{selectedOrder.startCount}</p>
              </div>
            </div>

            {/* Events Log */}
            {selectedOrder.events && selectedOrder.events.length > 0 && (
              <div className="mt-6 pt-4 border-t border-sky-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  سجل أحداث الطلب
                </h4>
                <div className="space-y-2">
                  {selectedOrder.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-sky-50/50 border border-sky-100 flex items-start justify-between text-xs gap-3"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block">{ev.message}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{ev.eventType}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(ev.createdAt).toLocaleDateString('ar-EG', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support Ticket Quick Link */}
            <div className="mt-6 pt-4 border-t border-sky-100 flex justify-end">
              <Link
                href={`/support?orderId=${selectedOrder.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition border border-amber-200"
              >
                <Headphones className="w-4 h-4" />
                <span>فتح تذكرة دعم لهذا الطلب</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
