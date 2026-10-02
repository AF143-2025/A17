'use client';

import React, { useState, useEffect } from 'react';
import StatusBadge from '@/components/StatusBadge';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Edit,
  Loader2,
  X,
  ExternalLink,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Send,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';

interface AdminOrder {
  id: string;
  targetUrl: string;
  quantity: number;
  price: number;
  cost: number;
  profit: number;
  status: string;
  providerOrderId: string | null;
  startCount: number;
  remains: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  service: {
    name: string;
    category: {
      platform: {
        nameAr: string;
      };
    };
  };
  provider: {
    id: string;
    name: string;
  } | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Order Modal
  const [editOrder, setEditOrder] = useState<AdminOrder | null>(null);
  const [editStatus, setEditStatus] = useState('PROCESSING');
  const [editRemains, setEditRemains] = useState<number>(0);
  const [editStartCount, setEditStartCount] = useState<number>(0);
  const [editTargetUrl, setEditTargetUrl] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Refund Modal
  const [refundOrder, setRefundOrder] = useState<AdminOrder | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [processingRefund, setProcessingRefund] = useState(false);

  // Delete Order Modal
  const [deleteOrder, setDeleteOrder] = useState<AdminOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
      showFeedback('error', 'فشل في تحميل قائمة الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  // Sync with provider
  const handleSync = async (orderId: string) => {
    setSyncingId(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'sync' }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.order) {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o))
          );
        }
        showFeedback('success', data.message || 'تمت مزامنة حالة الطلب بنجاح');
      } else {
        showFeedback('error', data.error || 'فشلت المزامنة مع المزود');
      }
    } catch (e) {
      console.error(e);
      showFeedback('error', 'حدث خطأ أثناء المزامنة');
    } finally {
      setSyncingId(null);
    }
  };

  // Resend to Provider
  const handleResend = async (orderId: string) => {
    if (!confirm('هل تريد إعادة إرسال هذا الطلب إلى المزود الخارجي الآن؟')) return;
    setActionLoadingId(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'resend' }),
      });

      const data = await res.json();
      if (res.ok) {
        showFeedback('success', data.message || 'تمت إعادة توجيه الطلب للمزود بنجاح');
        loadOrders();
      } else {
        showFeedback('error', data.error || 'فشل في إعادة الإرسال');
      }
    } catch {
      showFeedback('error', 'حدث خطأ أثناء إعادة الإرسال');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Save Edit Order Details
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrder) return;

    setSavingEdit(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: editOrder.id,
          status: editStatus,
          remains: editRemains,
          startCount: editStartCount,
          targetUrl: editTargetUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === editOrder.id
              ? {
                  ...o,
                  status: editStatus,
                  remains: editRemains,
                  startCount: editStartCount,
                  targetUrl: editTargetUrl,
                }
              : o
          )
        );
        setEditOrder(null);
        showFeedback('success', 'تم تعديل بيانات الطلب بنجاح');
      } else {
        showFeedback('error', data.error || 'فشل تحديث بيانات الطلب');
      }
    } catch {
      showFeedback('error', 'حدث خطأ أثناء حفظ التعديل');
    } finally {
      setSavingEdit(false);
    }
  };

  // Process Refund
  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrder) return;

    setProcessingRefund(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: refundOrder.id,
          action: 'refund',
          refundAmount: refundAmount ? parseFloat(refundAmount) : refundOrder.price,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showFeedback('success', data.message || 'تم استرجاع المبلغ لمحفظة المستخدم بنجاح');
        setRefundOrder(null);
        loadOrders();
      } else {
        showFeedback('error', data.error || 'فشل الاسترجاع المالي');
      }
    } catch {
      showFeedback('error', 'حدث خطأ أثناء معالجة الاسترجاع');
    } finally {
      setProcessingRefund(false);
    }
  };

  // Delete Order
  const handleDeleteOrder = async () => {
    if (!deleteOrder) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders?id=${deleteOrder.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== deleteOrder.id));
        setDeleteOrder(null);
        showFeedback('success', 'تم حذف الطلب نهائياً بنجاح');
      } else {
        showFeedback('error', data.error || 'فشل حذف الطلب');
      }
    } catch {
      showFeedback('error', 'حدث خطأ أثناء حذف الطلب');
    } finally {
      setDeleting(false);
    }
  };

  // Summary Metrics
  const totalSales = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const totalCost = orders.reduce((sum, o) => sum + (o.cost || 0), 0);
  const totalProfit = orders.reduce((sum, o) => sum + (o.profit || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-sans flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            <span>إدارة الطلبات والعمليات</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تحكم كامل بالطلبات: استرجاع مالي فوري، إعادة إرسال للمزود، تعديل البيانات، والمزامنة اللحظية
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-sky-200 text-slate-700 hover:text-slate-900 hover:bg-sky-50 text-xs font-bold transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث القائمة</span>
        </button>
      </div>

      {/* Alert Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 transition animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-sm">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">إجمالي الطلبات المعروضة</span>
          <span className="text-xl font-black text-slate-900 font-sans">{orders.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-sm">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">إجمالي المبيعات</span>
          <span className="text-xl font-black text-blue-600 font-sans">${totalSales.toFixed(2)}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-sm">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">تكاليف المزودين</span>
          <span className="text-xl font-black text-slate-700 font-sans">${totalCost.toFixed(2)}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-sm">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">صافي الأرباح</span>
          <span className="text-xl font-black text-emerald-600 font-sans">+${totalProfit.toFixed(2)}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-sky-100 flex flex-col md:flex-row items-center gap-3 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث برقم الطلب الداخلي، رقم المزود، اسم المستخدم، الرابط، الخدمة..."
            className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-2.5 pl-10 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition"
          />
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <Search className="w-4 h-4" />
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-auto rounded-xl bg-white border border-sky-200 px-3 py-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none shadow-sm"
        >
          <option value="ALL">جميع الحالات</option>
          <option value="PENDING">قيد الانتظار (Pending)</option>
          <option value="PROCESSING">قيد التنفيذ (Processing)</option>
          <option value="COMPLETED">مكتمل (Completed)</option>
          <option value="PARTIAL">مكتمل جزئياً (Partial)</option>
          <option value="CANCELED">ملغي (Canceled)</option>
          <option value="REFUNDED">مسترجع (Refunded)</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl bg-white border border-sky-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <span className="text-xs">جاري تحميل الطلبات...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            لا توجد طلبات مطابقة للبحث أو الفلتر
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-sky-50/80 text-slate-700 font-bold border-b border-sky-100">
                <tr>
                  <th className="py-3.5 px-4">رقم الطلب</th>
                  <th className="py-3.5 px-4">رقم المزود</th>
                  <th className="py-3.5 px-4">المستخدم</th>
                  <th className="py-3.5 px-4">الخدمة</th>
                  <th className="py-3.5 px-4">الرابط المستهدف</th>
                  <th className="py-3.5 px-4">الكمية</th>
                  <th className="py-3.5 px-4">سعر البيع</th>
                  <th className="py-3.5 px-4">التكلفة</th>
                  <th className="py-3.5 px-4">الربح</th>
                  <th className="py-3.5 px-4">المزود</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100 text-slate-700">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-sky-50/50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500 whitespace-nowrap">
                      #{o.id.slice(-6)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-sky-600 whitespace-nowrap">
                      {o.providerOrderId ? `#${o.providerOrderId}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{o.user.username}</div>
                      <div className="text-[10px] text-slate-500">{o.user.email}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[170px] truncate text-slate-800" title={o.service.name}>
                      <div className="truncate font-medium">{o.service.name}</div>
                      <div className="text-[10px] text-blue-600 truncate">{o.service.category?.platform?.nameAr}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[140px] truncate">
                      <a
                        href={o.targetUrl.startsWith('http') ? o.targetUrl : `https://${o.targetUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline max-w-[120px] truncate"
                        title={o.targetUrl}
                      >
                        <span className="truncate">{o.targetUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4 font-sans font-bold text-slate-800 whitespace-nowrap">
                      {o.quantity.toLocaleString('en-US')}
                      {o.remains > 0 && (
                        <span className="block text-[10px] text-amber-600 font-normal">
                          متبقي: {o.remains}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-black text-blue-600 whitespace-nowrap">
                      ${o.price.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-500 whitespace-nowrap">
                      ${o.cost.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-bold text-emerald-600 whitespace-nowrap">
                      +${o.profit.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {o.provider?.name || 'يدوي'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* Sync */}
                        <button
                          onClick={() => handleSync(o.id)}
                          disabled={syncingId === o.id}
                          className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-700 transition"
                          title="مزامنة مع المزود الخارجي"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingId === o.id ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Resend to Provider */}
                        <button
                          onClick={() => handleResend(o.id)}
                          disabled={actionLoadingId === o.id}
                          className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 transition"
                          title="إعادة إرسال للمزود"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        {/* Refund Modal */}
                        <button
                          onClick={() => {
                            setRefundOrder(o);
                            setRefundAmount(o.price.toString());
                          }}
                          disabled={o.status === 'REFUNDED'}
                          className={`p-1.5 rounded-lg transition ${
                            o.status === 'REFUNDED'
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              : 'bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700'
                          }`}
                          title="استرجاع المبلغ لمحفظة المستخدم"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit details */}
                        <button
                          onClick={() => {
                            setEditOrder(o);
                            setEditStatus(o.status);
                            setEditRemains(o.remains);
                            setEditStartCount(o.startCount);
                            setEditTargetUrl(o.targetUrl);
                          }}
                          className="p-1.5 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 transition"
                          title="تعديل بيانات وحالة الطلب"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Order */}
                        <button
                          onClick={() => setDeleteOrder(o)}
                          className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 transition"
                          title="حذف الطلب نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Order Modal */}
      {editOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600" />
                <span>تعديل الطلب #{editOrder.id.slice(-6)}</span>
              </h3>
              <button
                onClick={() => setEditOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الحالة
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-xl bg-white border border-sky-200 px-3 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  <option value="PENDING">قيد الانتظار (Pending)</option>
                  <option value="PROCESSING">قيد التنفيذ (Processing)</option>
                  <option value="COMPLETED">مكتمل (Completed)</option>
                  <option value="PARTIAL">مكتمل جزئياً (Partial)</option>
                  <option value="CANCELED">ملغي (Canceled)</option>
                  <option value="REFUNDED">مسترجع (Refunded)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الرابط المستهدف
                </label>
                <input
                  type="text"
                  value={editTargetUrl}
                  onChange={(e) => setEditTargetUrl(e.target.value)}
                  className="w-full rounded-xl bg-white border border-sky-200 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    العدد الأولي (Start Count)
                  </label>
                  <input
                    type="number"
                    value={editStartCount}
                    onChange={(e) => setEditStartCount(parseInt(e.target.value || '0', 10))}
                    className="w-full rounded-xl bg-white border border-sky-200 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المتبقي (Remains)
                  </label>
                  <input
                    type="number"
                    value={editRemains}
                    onChange={(e) => setEditRemains(parseInt(e.target.value || '0', 10))}
                    className="w-full rounded-xl bg-white border border-sky-200 px-4 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-slate-700 hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {savingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <span>استرجاع مالي للطلب #{refundOrder.id.slice(-6)}</span>
              </h3>
              <button
                onClick={() => setRefundOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-100 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>المستخدم:</span>
                  <span className="font-bold text-slate-900">{refundOrder.user.username}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>سعر الطلب الأصلي:</span>
                  <span className="font-bold text-blue-600 font-sans">${refundOrder.price.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المبلغ المراد إرجاعه إلى محفظة المستخدم ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="المبلغ بالدولار"
                  required
                  min={0.01}
                  className="w-full rounded-xl bg-white border border-sky-200 px-4 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none font-mono font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  سيتم شحن محفظة المستخدم فوراً بالمبلغ المحدد وإرسال إشعار داخلي إليه وتغيير حالة الطلب إلى REFUNDED.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-slate-700 hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={processingRefund}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {processingRefund ? 'جاري الاسترجاع...' : 'تأكيد الاسترجاع المالي'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 border border-sky-100 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              حذف الطلب نهائياً
            </h3>
            <p className="text-xs text-slate-600 mb-5">
              هل أنت متأكد من حذف الطلب <span className="font-mono text-slate-900 font-bold">#{deleteOrder.id.slice(-6)}</span> نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-slate-700 hover:bg-slate-200 text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition disabled:opacity-50 text-xs"
              >
                {deleting ? 'جاري الحذف...' : 'نعم، احذف الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
