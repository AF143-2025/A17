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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-white font-sans">تذاكر الدعم الفني</h1>
        <p className="text-xs text-slate-400 mt-1">
          متابعة استفسارات العملاء والرد المباشر على التذاكر المفتوحة
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Tickets List */}
        <div className="rounded-3xl glass-panel border border-slate-800 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">
            صندوق الوارد ({tickets.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
              جاري تحميل التذاكر...
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              لا توجد تذاكر حالياً
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`w-full text-right p-3.5 rounded-2xl border transition flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-purple-600/15 border-purple-500 text-white shadow-glow'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs truncate max-w-[180px]">
                        {t.subject}
                      </span>
                      <StatusBadge status={t.status} type="ticket" />
                    </div>

                    <div className="flex items-center justify-between w-full text-[10px] text-slate-500">
                      <span>{t.user.username}</span>
                      <span>
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
        <div className="lg:col-span-2 rounded-3xl glass-panel border border-slate-800 p-6 flex flex-col justify-between min-h-[500px]">
          {selectedTicket ? (
            <>
              <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{selectedTicket.subject}</span>
                    <span className="text-xs text-slate-500 font-mono">
                      #{selectedTicket.id.slice(-6)}
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>المستخدم: <strong className="text-white">{selectedTicket.user.username}</strong></span>
                    <span>•</span>
                    <span>الأولوية: <strong className="text-amber-400">{selectedTicket.priority}</strong></span>
                  </div>
                </div>

                <StatusBadge status={selectedTicket.status} type="ticket" />
              </div>

              {/* Messages Thread */}
              <div className="flex-1 py-4 space-y-3 overflow-y-auto max-h-[400px]">
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
                            ? 'bg-purple-600 text-white'
                            : 'bg-brand-600 text-white'
                        }`}
                      >
                        {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isAdmin
                            ? 'bg-purple-950/40 border border-purple-800/40 text-purple-100'
                            : 'bg-slate-900 border border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1 text-[10px] text-slate-400">
                          <span className="font-bold">
                            {isAdmin ? 'أنت (المدير)' : m.sender.username}
                          </span>
                          <span>
                            {new Date(m.createdAt).toLocaleDateString('ar-EG', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p>{m.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="اكتب ردك على العميل هنا..."
                  className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={replying || !replyText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>إرسال الرد</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs py-16">
              <MessageSquare className="w-10 h-10 mb-2 text-slate-600" />
              <span>اختر تذكرة من القائمة الجانبية للرد على العميل</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
