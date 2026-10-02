'use client';

import React, { useState, useEffect } from 'react';
import { FileText, ShieldAlert, Loader2, Search, Clock } from 'lucide-react';

interface AuditLogItem {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  admin: {
    username: string;
    email: string;
  };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetch('/api/admin/audit-logs');
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.admin.username.toLowerCase().includes(search.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-white font-sans">سجل التدقيق والمراقبة (Audit Logs)</h1>
        <p className="text-xs text-slate-400 mt-1">
          سجل غير قابل للتعديل يوثق كافة الإجراءات الإدارية والمالية الحساسة لحماية المنصة
        </p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في سجل العمليات..."
          className="w-full rounded-2xl bg-slate-900 border border-slate-700/80 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
        />
      </div>

      <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-card-dark">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-2" />
            <span className="text-xs">جاري تحميل سجل التدقيق...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            لا توجد سجلات تدقيق مسجلة حتى الآن
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">نوع الإجراء</th>
                  <th className="py-3.5 px-4">المدير المسؤول</th>
                  <th className="py-3.5 px-4">نوع الهدف (Target)</th>
                  <th className="py-3.5 px-4">التفاصيل والبيانات</th>
                  <th className="py-3.5 px-4">عنوان الـ IP</th>
                  <th className="py-3.5 px-4">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-400">
                      {l.action}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {l.admin.username}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono">
                        {l.targetType} {l.targetId ? `(#${l.targetId.slice(-6)})` : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 max-w-md truncate">
                      {l.details || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {l.ipAddress || 'unknown'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
