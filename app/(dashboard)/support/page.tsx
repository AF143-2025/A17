'use client';

import React, { useState, useEffect } from 'react';
import StatusBadge from '@/components/StatusBadge';
import {
  HeadphonesIcon,
  PlusCircle,
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
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
  messages: SupportMessage[];
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // New Ticket Modal
  const [newTicketModal, setNewTicketModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply state
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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, priority, message }),
      });

      if (res.ok) {
        setSubject('');
        setMessage('');
        setNewTicketModal(false);
        loadTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-sans flex items-center gap-2">
            <span>مركز الدعم الفني والمساعدة</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-sky-100 border border-sky-300 text-blue-700 font-bold">
              متاح 24/7
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            فريق دعم اصعد جاهز لمساعدتك في أي استفسار أو مشكلة متعلقة بالطلبات والمدفوعات
          </p>
        </div>

        <button
          onClick={() => setNewTicketModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>فتح تذكرة دعم جديدة</span>
        </button>
      </div>

      {/* Telegram Direct Support Banner */}
      <div className="rounded-3xl p-5 sm:p-6 bg-white border border-sky-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0088cc] to-[#00b0ff] flex items-center justify-center text-white shrink-0 shadow-lg shadow-sky-500/25">
            <Send className="w-6 h-6 -translate-x-0.5 translate-y-0.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>الدعم المالي وشحن الرصيد الفوري عبر تيليجرام</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              لأي استفسار عاجل حول شحن الرصيد أو المدفوعات، يمكنك مراسلتنا مباشرة على معرف التيليجرام الرسمي: <span className="text-blue-600 font-mono font-bold">@Hexc8re</span>
            </p>
          </div>
        </div>

        <a
          href="https://t.me/Hexc8re"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0088cc] to-[#00b0ff] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition flex items-center justify-center gap-2 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>مراسلة @Hexc8re</span>
        </a>
      </div>

      {/* Tickets List and Conversation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Tickets List */}
        <div className="rounded-3xl bg-white border border-sky-100 p-4 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 pt-1">
            تذاكري ({tickets.length})
          </h3>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
              جاري تحميل التذاكر...
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              لا توجد لديك تذاكر دعم حالياً.
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTicket(t);
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setTimeout(() => {
                          document.getElementById('ticket-chat-pane')?.scrollIntoView({ behavior: 'smooth' });
                        }, 80);
                      }
                    }}
                    className={`w-full text-right p-3.5 rounded-2xl border transition flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-sky-50 border-blue-500 text-slate-900 shadow-sm'
                        : 'bg-white border-sky-100 text-slate-700 hover:bg-sky-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs truncate max-w-[180px]">
                        {t.subject}
                      </span>
                      <StatusBadge status={t.status} type="ticket" />
                    </div>

                    <div className="flex items-center justify-between w-full text-[10px] text-slate-500">
                      <span>#{t.id.slice(-6)}</span>
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

        {/* Right 2 Cols: Selected Ticket Chat Thread */}
        <div id="ticket-chat-pane" className="lg:col-span-2 rounded-3xl bg-white border border-sky-100 p-4 sm:p-6 flex flex-col justify-between min-h-[450px] sm:min-h-[500px] shadow-sm">
          {selectedTicket ? (
            <>
              {/* Ticket Top Meta */}
              <div className="pb-4 border-b border-sky-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>{selectedTicket.subject}</span>
                      <span className="text-xs text-slate-500 font-mono">
                        #{selectedTicket.id.slice(-6)}
                      </span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="lg:hidden text-[10px] font-semibold text-blue-600 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-lg border border-sky-200 transition"
                      title="العودة لأعلى الصفحة"
                    >
                      ↑ القائمة
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span>
                      الأولوية:{' '}
                      <strong className="text-amber-600">{selectedTicket.priority}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      التاريخ:{' '}
                      {new Date(selectedTicket.createdAt).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
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
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isAdmin
                            ? 'bg-purple-50 border border-purple-200 text-purple-950'
                            : 'bg-sky-50 border border-sky-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1 text-[10px] text-slate-500">
                          <span className="font-bold">
                            {isAdmin ? 'فريق الدعم الفني (اصعد)' : m.sender.username}
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
              {selectedTicket.status !== 'CLOSED' ? (
                <form onSubmit={handleSendReply} className="pt-4 border-t border-sky-100 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب ردك هنا..."
                    className="flex-1 rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:bg-white transition"
                  />
                  <button
                    type="submit"
                    disabled={replying || !replyText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {replying ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4" />}
                    <span>إرسال</span>
                  </button>
                </form>
              ) : (
                <div className="pt-3 border-t border-sky-100 text-center text-xs text-slate-500">
                  تم إغلاق هذه التذكرة. إذا كنت بحاجة لمزيد من المساعدة، يرجى فتح تذكرة جديدة.
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs py-16">
              <MessageSquare className="w-10 h-10 mb-2 text-slate-400" />
              <span>اختر تذكرة من القائمة الجانبية لعرض المحادثة والردود</span>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {newTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">فتح تذكرة دعم جديدة</h3>
              <button
                onClick={() => setNewTicketModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  عنوان التذكرة / الموضوع
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: استفسار عن طلب متابعين إنستغرام #12345"
                  required
                  className="w-full rounded-xl bg-white border border-sky-200 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  درجة الأهمية
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-xl bg-white border border-sky-200 px-3 py-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="LOW">منخفضة</option>
                  <option value="MEDIUM">متوسطة (عادي)</option>
                  <option value="HIGH">عالية (مستعجل)</option>
                  <option value="URGENT">حرجة جداً</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  نص الرسالة والتفاصيل
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="اشرح المشكلة بالتفصيل مع إرفاق رقم الطلب أو المعاملة إن وجد..."
                  required
                  className="w-full rounded-xl bg-white border border-sky-200 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewTicketModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {submitting ? 'جاري الإرسال...' : 'إرسال التذكرة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
