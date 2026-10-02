'use client';

import React, { useState, useEffect } from 'react';
import StatusBadge from '@/components/StatusBadge';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  DollarSign,
  AlertCircle,
  Search,
} from 'lucide-react';

interface PaymentItem {
  id: string;
  amount: number;
  status: string;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  paymentMethod: {
    name: string;
    code: string;
  };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const handleAction = async (paymentId: string, action: 'approve' | 'reject') => {
    const actionText = action === 'approve' ? 'الموافقة وشحن الرصيد' : 'رفض';
    if (!confirm(`هل أنت متأكد من ${actionText} لهذه العملية؟`)) return;

    setActionLoadingId(paymentId);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action }),
      });

      if (res.ok) {
        loadPayments();
      } else {
        const data = await res.json();
        alert(data.error || 'فشلت العملية');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-white font-sans">إدارة المدفوعات والشحن</h1>
        <p className="text-xs text-slate-400 mt-1">
          مراجعة وتأكيد طلبات الشحن اليدوية وإضافة الأرصدة إلى محافظ المستخدمين تلقائياً
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300">تصفية حسب الحالة:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-300 focus:border-purple-500 focus:outline-none"
        >
          <option value="ALL">جميع الحالات</option>
          <option value="PENDING">بانتظار المراجعة (Pending)</option>
          <option value="APPROVED">تمت الموافقة (Approved)</option>
          <option value="REJECTED">مرفوضة (Rejected)</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-card-dark">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-2" />
            <span className="text-xs">جاري تحميل المدفوعات...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            لا توجد عمليات دفع مطابقة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">رقم العملية</th>
                  <th className="py-3.5 px-4">المستخدم</th>
                  <th className="py-3.5 px-4">المبلغ</th>
                  <th className="py-3.5 px-4">طريقة الدفع</th>
                  <th className="py-3.5 px-4">الرقم المرجعي للتحويل</th>
                  <th className="py-3.5 px-4">ملاحظات</th>
                  <th className="py-3.5 px-4">التاريخ</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">إجراءات الإدارة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                      #{p.id.slice(-6)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{p.user.username}</div>
                      <div className="text-[10px] text-slate-500">{p.user.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-sans font-black text-blue-400 text-sm">
                      ${p.amount.toLocaleString('en-US')}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {p.paymentMethod.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-cyan-400">
                      {p.referenceNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {p.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('ar-EG', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={p.status} type="payment" />
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {p.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleAction(p.id, 'approve')}
                            disabled={actionLoadingId === p.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>موافقة وشحن</span>
                          </button>
                          <button
                            onClick={() => handleAction(p.id, 'reject')}
                            disabled={actionLoadingId === p.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>رفض</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">تمت المعالجة</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
