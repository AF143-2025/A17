'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  PlusCircle,
  Copy,
  Check,
  Trash2,
  Code2,
  BookOpen,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  rateLimit: number;
  status: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  _count: {
    usage: number;
  };
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyModal, setNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'node'>('curl');

  const loadKeys = async () => {
    try {
      const res = await fetch('/api/api-keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() || 'مفتاح API المتجر' }),
      });

      const data = await res.json();
      if (res.ok && data.apiKey) {
        setGeneratedRawKey(data.apiKey.rawKey);
        setNewKeyName('');
        loadKeys();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('هل أنت متأكد من إبطال هذا المفتاح؟ لن تتمكن التطبيقات التي تستخدمه من إرسال طلبات جديدة.')) {
      return;
    }

    try {
      const res = await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadKeys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const codeSnippets = {
    curl: `curl -X POST "http://localhost:3000/api/v1/order" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "service": "SERVICE_ID",
    "link": "https://instagram.com/username",
    "quantity": 1000
  }'`,
    python: `import requests

url = "http://localhost:3000/api/v1/order"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "service": "SERVICE_ID",
    "link": "https://instagram.com/username",
    "quantity": 1000
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    node: `const axios = require('axios');

async function placeOrder() {
  const response = await axios.post('http://localhost:3000/api/v1/order', {
    service: 'SERVICE_ID',
    link: 'https://instagram.com/username',
    quantity: 1000
  }, {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });

  console.log(response.data);
}

placeOrder();`,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-sans flex items-center gap-2">
            <span>واجهة برمجة التطبيقات (API) ونظام الموزعين</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold">
              v1.0 REST
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            أنشئ مفاتيح الـ API لربط متجرك أو موقعك بنظام اصعد وتنفيذ الطلبات آلياً
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedRawKey(null);
            setNewKeyModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 text-xs font-bold text-white shadow-glow hover:opacity-90 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إنشاء مفتاح API جديد</span>
        </button>
      </div>

      {/* Generated Secret Key Alert (Shown Only Once!) */}
      {generatedRawKey && (
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 shadow-glow space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>تنبيه أمني هام: احتفظ بمفتاحك السري الآن!</span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            لأسباب أمنية، لن يتم عرض المفتاح الكامل مرة أخرى بعد إغلاق هذه الصفحة. يرجى نسخه وحفظه في مكان آمن.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400 select-all">
            <span className="flex-1 truncate">{generatedRawKey}</span>
            <button
              onClick={() => handleCopy(generatedRawKey)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-sans font-bold flex items-center gap-1.5 transition shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ المفتاح'}</span>
            </button>
          </div>
        </div>
      )}

      {/* API Keys Table */}
      <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-card-dark">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brand-400" />
            <span>مفاتيح API النشطة</span>
          </h3>
          <span className="text-xs text-slate-400">{keys.length} مفتاح</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-brand-400 mx-auto mb-2" />
            جاري تحميل المفاتيح...
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            لم تقم بإنشاء أي مفتاح API بعد. انقر على الزر أعلاه لإنشاء أول مفتاح.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">اسم المفتاح</th>
                  <th className="py-3 px-4">بادئة المفتاح (Key Prefix)</th>
                  <th className="py-3 px-4">معدل الطلبات</th>
                  <th className="py-3 px-4">الطلبات المنفذة</th>
                  <th className="py-3 px-4">آخر استخدام</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">{k.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{k.keyPrefix}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-300">
                      {k.rateLimit} طلب / دقيقة
                    </td>
                    <td className="py-3.5 px-4 font-sans font-bold text-brand-400">
                      {k._count.usage.toLocaleString('en-US')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {k.lastUsedAt
                        ? new Date(k.lastUsedAt).toLocaleDateString('ar-EG', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'لم يستخدم بعد'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {k.status ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          نشط (Active)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                          معطل (Revoked)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {k.status && (
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                          title="إبطال المفتاح"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* API Documentation Section */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center gap-2 text-white font-bold text-lg pb-3 border-b border-slate-800">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <span>توثيق واجهة البرمجة (API Documentation)</span>
        </div>

        {/* Endpoints Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 mb-3">نقاط النهاية المتاحة (Endpoints):</h4>
          <div className="space-y-2 text-xs font-mono">
            {[
              { method: 'GET', path: '/api/v1/services', desc: 'جلب قائمة جميع الخدمات والأسعار بالدينار' },
              { method: 'GET', path: '/api/v1/balance', desc: 'الاستعلام عن الرصيد المتاح في المحفظة' },
              { method: 'POST', path: '/api/v1/order', desc: 'إنشاء طلب جديد وخصم الرصيد تلقائياً' },
              { method: 'GET', path: '/api/v1/order/{id}', desc: 'الاستعلام عن حالة وتفاصيل طلب معين' },
              { method: 'GET', path: '/api/v1/orders', desc: 'جلب قائمة الطلبات مع الترقيم والفلترة' },
              { method: 'POST', path: '/api/v1/cancel', desc: 'طلب إلغاء طلب قيد الانتظار' },
              { method: 'POST', path: '/api/v1/refill', desc: 'طلب تعويض نقص (Refill) لطلب مكتمل' },
            ].map((ep, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ep.method === 'POST' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-brand-500/20 text-brand-400'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-slate-200">{ep.path}</span>
                </div>
                <span className="text-slate-400 font-sans text-xs">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Code Examples */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-300">أمثلة برمجية لإنشاء طلب (Order Creation Example):</h4>
            <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
              {(['curl', 'python', 'node'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCodeTab(tab)}
                  className={`px-3 py-1 rounded-lg font-mono text-[11px] transition ${
                    activeCodeTab === tab
                      ? 'bg-brand-500 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            <button
              onClick={() => handleCopy(codeSnippets[activeCodeTab])}
              className="absolute left-3 top-3 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-sans transition flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>نسخ الكود</span>
            </button>
            <pre>{codeSnippets[activeCodeTab]}</pre>
          </div>
        </div>
      </div>

      {/* Modal for Creating New Key */}
      {newKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2">إنشاء مفتاح API جديد</h3>
            <p className="text-xs text-slate-400 mb-5">
              حدد اسماً للمفتاح لتمييز استخدامه (مثل: موقعي الخاص، متجر ووردبريس، بوت تيليجرام).
            </p>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  اسم المفتاح
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="مثال: متجر الإلكترونيات - API"
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-700/80 px-4 py-2.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewKeyModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 text-xs font-bold text-white shadow-glow hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? 'جاري الإنشاء...' : 'توليد المفتاح'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
