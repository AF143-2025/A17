'use client';

import React, { useState, useEffect } from 'react';
import StatusBadge from '@/components/StatusBadge';
import {
  HeadphonesIcon,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Loader2,
  User,
  ShieldCheck,
  Search,
  RefreshCw,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface SupportMessage {
  id: string;
  senderType: string;
  message: string;
  createdAt: string;
  sender: {
    username: string;
    role: string;
  };
}

interface SupportTicket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
    email: string;
  };
  messages: SupportMessage[];
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadTickets = async () => {
    try {
      const res = await fetch('/api/support');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (selectedTicket) {
          const updated = data.tickets.find((t: SupportTicket) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setReplying(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedTicket.id, message: replyText.trim() }),
      });

      if (res.ok) {
        setReplyText('');
        loadTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch('/api/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedTicket.id, status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
        setTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: newStatus } : t))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchSearch =
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.user.username.toLowerCase().includes(search.toLowerCase()) ||
      t.user.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-sans flex items-center gap-2">
            <HeadphonesIcon className="w-6 h-6 text-blue-600" />
            <span>تذاكر الدعم الفني</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة استفسارات العملاء والرد المباشر وإدارة حالات التذاكر
          </p>
        </div>
        <button
          onClick={loadTickets}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-sky-200 text-slate-700 hover:text-slate-900 hover:bg-sky-50 text-xs font-bold transition shadow-xs w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث التذاكر</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Tickets List */}
        <div className="rounded-3xl bg-white border border-sky-100 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-700">
              صندوق الوارد ({filteredTickets.length})
            </h3>
            <span className="text-[10px] text-slate-400">
              إجمالي: {tickets.length}
            </span>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في التذاكر أو المستخدم..."
                className="w-full rounded-xl bg-slate-50 border border-sky-200 px-3 py-2 pl-8 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'ALL', label: 'الكل' },
                { id: 'OPEN', label: 'مفتوحة' },
                { id: 'PENDING', label: 'قيد الانتظار' },
                { id: 'ANSWERED', label: 'تم الرد' },
                { id: 'CLOSED', label: 'مغلقة' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                    statusFilter === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-sky-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
              جاري تحميل التذاكر...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              لا توجد تذاكر مطابقة
            </div>
          ) : (
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-0.5">
              {filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`w-full text-right p-3.5 rounded-2xl border transition flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 text-slate-900 shadow-xs ring-1 ring-blue-500/20'
                        : 'bg-slate-50/60 border-sky-100 text-slate-700 hover:bg-sky-50/50 hover:border-sky-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs truncate max-w-[170px] text-slate-900">
                        {t.subject}
                      </span>
                      <StatusBadge status={t.status} type="ticket" />
                    </div>

                    <div className="flex items-center justify-between w-full text-[11px] text-slate-500">
                      <span className="font-medium text-slate-700">{t.user.username}</span>
                      <span className="font-sans text-[10px]">
                        {new Date(t.updatedAt).toLocaleDateString('ar-EG', {
                          month: 'numeric',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 2 Cols: Chat Thread */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-sky-100 p-6 flex flex-col justify-between min-h-[550px] shadow-xs">
          {selectedTicket ? (
            <>
              {/* Ticket Top bar */}
              <div className="pb-4 border-b border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedTicket.subject}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      #{selectedTicket.id.slice(-6)}
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>العميل: <strong className="text-slate-900">{selectedTicket.user.username}</strong> ({selectedTicket.user.email})</span>
                    <span>•</span>
                    <span>الأولوية: <strong className="text-amber-600">{selectedTicket.priority}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedTicket.status} type="ticket" />
                  {selectedTicket.status !== 'CLOSED' ? (
                    <button
                      onClick={() => handleStatusChange('CLOSED')}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition flex items-center gap-1"
                      title="إغلاق التذكرة"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>إغلاق</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange('OPEN')}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition flex items-center gap-1"
                      title="إعادة فتح التذكرة"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>إعادة فتح</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 py-4 space-y-3.5 overflow-y-auto max-h-[420px] px-1">
                {selectedTicket.messages.map((m) => {
                  const isAdmin = m.senderType === 'ADMIN';
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-3 max-w-xl ${
                        isAdmin ? 'mr-auto flex-row-reverse' : 'ml-auto'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                          isAdmin
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                          isAdmin
                            ? 'bg-blue-50/90 border-blue-200 text-blue-950'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1 text-[10px] text-slate-500">
                          <span className="font-bold">
                            {isAdmin ? 'أنت (إدارة اصعد)' : m.sender.username}
                          </span>
                          <span className="font-sans">
                            {new Date(m.createdAt).toLocaleDateString('ar-EG', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{m.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-sky-100 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="اكتب ردك على العميل هنا..."
                  className="flex-1 rounded-xl bg-slate-50 border border-sky-200 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none shadow-xs"
                />
                <button
                  type="submit"
                  disabled={replying || !replyText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs"
                >
                  {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>إرسال الرد</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-20">
              <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
              <span className="font-medium">اختر تذكرة من القائمة الجانبية لعرض المحادثة والرد على العميل</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
