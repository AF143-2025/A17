'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Loader2,
  Sparkles,
  Send,
  Copy,
  ExternalLink,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  referenceId?: string;
  description: string;
  createdAt: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedTelegram, setCopiedTelegram] = useState(false);

  const handleCopyTelegram = () => {
    navigator.clipboard.writeText('@Hexc8re');
    setCopiedTelegram(true);
    setTimeout(() => setCopiedTelegram(false), 2500);
  };

  const loadWalletData = async () => {
    try {
      const res = await fetch('/api/wallet');
      if (res.ok) {
        const data = await res.json();
        setBalance(data.wallet?.balance || 0);
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return { label: 'شحن رصيد', color: 'text-emerald-700 bg-emerald-50 border border-emerald-200' };
      case 'ORDER_PAYMENT': return { label: 'دفع طلب', color: 'text-blue-700 bg-blue-50 border border-blue-200' };
      case 'REFUND': return { label: 'استرجاع مالي', color: 'text-purple-700 bg-purple-50 border border-purple-200' };
      case 'ADJUSTMENT': return { label: 'تعديل إداري', color: 'text-amber-700 bg-amber-50 border border-amber-200' };
      default: return { label: type, color: 'text-slate-700 bg-slate-100 border border-slate-200' };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-xs">جاري تحميل المحفظة وسجل المعاملات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Balance Top Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-sky-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Wallet className="w-4 h-4 text-blue-600" />
            <span>الرصيد الكلي في محفظتك</span>
          </div>
          <div className="mt-2 text-4xl sm:text-5xl font-black text-slate-900 font-sans tracking-tight">
            ${balance.toFixed(2)}{' '}
            <span className="text-base sm:text-lg font-bold text-blue-600">دولار أمريكي ($)</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            جميع المعاملات المالية محمية بنظام الـ Ledger الذري غير القابل للتلاعب.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://t.me/Hexc8re"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#0088cc] via-[#009de0] to-[#00b0ff] font-bold text-sm text-white shadow-lg shadow-sky-500/25 hover:opacity-95 transition transform active:scale-95 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>شحن الرصيد عبر تيليجرام (@Hexc8re)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Telegram Direct Recharge Banner (Main Official Recharge Channel) */}
      <div id="deposit-section" className="rounded-3xl p-6 sm:p-8 bg-white border-2 border-sky-200 shadow-sm relative overflow-hidden">
        {/* Ambient subtle glow effects */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-sky-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-sky-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0088cc] to-[#00b0ff] flex items-center justify-center text-white shadow-lg shadow-sky-500/30 shrink-0">
                <Send className="w-7 h-7 -translate-x-0.5 translate-y-0.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-100 border border-sky-300 text-blue-700 text-[11px] font-bold">
                    طريقة الشحن المعتمدة والمباشرة
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  شحن الرصيد الفوري عبر تيليجرام
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  تواصل مباشرة مع الإدارة المالية عبر الحساب المعتمد لشحن رصيدك بالدولار ($) خلال دقائق معدودة
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="https://t.me/Hexc8re"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#0088cc] to-[#00b0ff] hover:from-[#0077b5] hover:to-[#009de0] text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition flex items-center gap-2 transform active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>مراسلة @Hexc8re الآن</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                type="button"
                onClick={handleCopyTelegram}
                className="px-4 py-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-700 text-xs font-bold transition flex items-center gap-2"
                title="نسخ اسم الحساب"
              >
                {copiedTelegram ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">تم نسخ @Hexc8re</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-sky-600" />
                    <span>نسخ المعرف</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instructions Step-by-Step */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-1.5">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center font-sans">
                1
              </div>
              <h4 className="font-bold text-slate-900">تواصل عبر تيليجرام</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                اضغط على زر المراسلة أو ابحث عن المعرف{' '}
                <a
                  href="https://t.me/Hexc8re"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 underline font-mono"
                >
                  @Hexc8re
                </a>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-1.5">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center font-sans">
                2
              </div>
              <h4 className="font-bold text-slate-900">أرسل بيانات حسابك</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                أرسل اسم المستخدم أو بريدك الإلكتروني في المنصة مع المبلغ المراد شحنه بالدولار ($).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-1.5">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center font-sans">
                3
              </div>
              <h4 className="font-bold text-slate-900">اختر وسيلة التحويل</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                حوّل عبر زين كاش، فاست باي، FIB، تحويل بنكي، آسيا حوالة، أو USDT (TRC20).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center font-sans">
                4
              </div>
              <h4 className="font-bold text-emerald-800">شحن فوري وتأكيد</h4>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                يتم إيداع الرصيد في محفظتك فوراً وتستطيع البدء في الرشق والطلب مباشرة!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Financial Notice */}
      <div className="rounded-3xl bg-white p-6 border border-sky-100 text-xs text-slate-600 space-y-2 leading-relaxed shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 font-bold">
          <Sparkles className="w-4 h-4" />
          <span>ضمان الأمان المالي في اصعد</span>
        </div>
        <p>
          تتم معالجة جميع عمليات شحن الرصيد مباشرة وبشكل فوري عبر التواصل مع حساب التيليجرام الرسمي{' '}
          <a
            href="https://t.me/Hexc8re"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-mono font-bold underline"
          >
            @Hexc8re
          </a>
          . كل عملية إيداع توثق بدقة في سجل المعاملات أدناه وتنعكس في رصيدك بالدولار ($) لضمان حقوقك بنسبة 100%.
        </p>
      </div>

      {/* Transactions History Ledger Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900">سجل المعاملات المالية (Transactions Ledger)</h2>
          <span className="text-xs text-slate-500">آخر 50 حركة مالية</span>
        </div>

        <div className="rounded-3xl bg-white border border-sky-100 overflow-hidden shadow-sm">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              لا توجد حركات مالية مسجلة حتى الآن
            </div>
          ) : (
          <>
            {/* Desktop Table (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-sky-50/80 text-slate-700 font-bold border-b border-sky-100">
                  <tr>
                    <th className="py-3.5 px-4">نوع العملية</th>
                    <th className="py-3.5 px-4">المبلغ</th>
                    <th className="py-3.5 px-4">البيان / الوصف</th>
                    <th className="py-3.5 px-4">الرقم المرجعي</th>
                    <th className="py-3.5 px-4">التاريخ</th>
                    <th className="py-3.5 px-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 text-slate-700">
                  {transactions.map((tx) => {
                    const typeConfig = getTransactionTypeLabel(tx.type);
                    const isCredit = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-sky-50/50 transition">
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${typeConfig.color}`}
                          >
                            {typeConfig.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-sans font-black">
                          <span
                            className={
                              isCredit ? 'text-emerald-600' : 'text-slate-800'
                            }
                          >
                            {isCredit ? '+' : ''}${tx.amount.toLocaleString('en-US')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 max-w-sm">
                          {tx.description}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {tx.referenceId ? `#${tx.referenceId.slice(-8)}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                            مكتمل
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< sm) */}
            <div className="sm:hidden divide-y divide-sky-100">
              {transactions.map((tx) => {
                const typeConfig = getTransactionTypeLabel(tx.type);
                const isCredit = tx.amount > 0;
                return (
                  <div key={tx.id} className="p-4 hover:bg-sky-50/40 transition space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                      <span className="font-sans font-black text-sm">
                        <span className={isCredit ? 'text-emerald-600' : 'text-slate-900'}>
                          {isCredit ? '+' : ''}${tx.amount.toLocaleString('en-US')}
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium">
                      {tx.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>{new Date(tx.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="font-mono">{tx.referenceId ? `#${tx.referenceId.slice(-6)}` : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
