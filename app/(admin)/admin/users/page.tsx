'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Wallet,
  ShieldCheck,
  Ban,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  PlusCircle,
  MinusCircle,
  UserPlus,
  Edit,
  KeyRound,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Phone,
  Mail,
  DollarSign,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Eye,
  Lock,
  Unlock,
  History,
  Send,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Headphones,
  ArrowUpRight,
} from 'lucide-react';

interface UserRecord {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  wallet: {
    id: string;
    balance: number;
    currency: string;
  } | null;
  _count: {
    orders: number;
    payments: number;
    supportTickets?: number;
    apiKeys?: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Copied helper state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 360° Comprehensive Profile Modal
  const [deepViewUser, setDeepViewUser] = useState<UserRecord | null>(null);

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('USER');
  const [newInitialBalance, setNewInitialBalance] = useState('0');
  const [creating, setCreating] = useState(false);

  // Edit User Modal
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [savingEdit, setSavingEdit] = useState(false);

  // Reset / Generate Password Modal
  const [resetPassUser, setResetPassUser] = useState<UserRecord | null>(null);
  const [resetNewPass, setResetNewPass] = useState('');
  const [generatedPassInfo, setGeneratedPassInfo] = useState<{ pass: string; user: string; email: string } | null>(null);
  const [savingPass, setSavingPass] = useState(false);

  // Adjust Balance Modal
  const [adjustModalUser, setAdjustModalUser] = useState<UserRecord | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjusting, setAdjusting] = useState(false);

  // Delete User Modal
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'Esaad#';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetNewPass(res);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
      showFeedback('error', 'فشل في تحميل قائمة المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  // Create User Submit
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_user',
          username: newUsername,
          email: newEmail,
          phone: newPhone,
          password: newPassword,
          role: newRole,
          initialBalance: newInitialBalance,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showFeedback('success', data.message || 'تم إنشاء المستخدم بنجاح');
        setShowCreateModal(false);
        setNewUsername('');
        setNewEmail('');
        setNewPhone('');
        setNewPassword('');
        setNewRole('USER');
        setNewInitialBalance('0');
        loadUsers();
      } else {
        showFeedback('error', data.error || 'فشل في إنشاء المستخدم');
      }
    } catch {
      showFeedback('error', 'حدث خطأ في الاتصال');
    } finally {
      setCreating(false);
    }
  };

  // Edit User Submit
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    setSavingEdit(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editUser.id,
          username: editUsername,
          email: editEmail,
          phone: editPhone,
          role: editRole,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showFeedback('success', 'تم تعديل بيانات المستخدم بنجاح');
        setEditUser(null);
        if (deepViewUser && deepViewUser.id === editUser.id) {
          setDeepViewUser({
            ...deepViewUser,
            username: editUsername,
            email: editEmail,
            phone: editPhone,
            role: editRole,
            status: editStatus,
          });
        }
        loadUsers();
      } else {
        showFeedback('error', data.error || 'فشل تعديل المستخدم');
      }
    } catch {
      showFeedback('error', 'حدث خطأ أثناء حفظ التعديل');
    } finally {
      setSavingEdit(false);
    }
  };

  // Quick 1-Click Status Toggle (Activate/Suspend)
  const handleQuickStatusChange = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      if (res.ok) {
        showFeedback('success', `تم تغيير حالة المستخدم إلى ${newStatus === 'ACTIVE' ? 'نشط' : newStatus === 'SUSPENDED' ? 'مجمد' : 'معطل'}`);
        loadUsers();
        if (deepViewUser && deepViewUser.id === userId) {
          setDeepViewUser({ ...deepViewUser, status: newStatus });
        }
      } else {
        const d = await res.json();
        showFeedback('error', d.error || 'فشل تغيير الحالة');
      }
    } catch {
      showFeedback('error', 'حدث خطأ أثناء تغيير الحالة');
    }
  };

  // Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser || !resetNewPass) return;

    setSavingPass(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resetPassUser.id,
          newPassword: resetNewPass,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedPassInfo({
          pass: resetNewPass,
          user: resetPassUser.username,
          email: resetPassUser.email,
        });
        showFeedback('success', 'تم تغيير كلمة المرور بنجاح. يمكنك الآن نسخ بيانات الدخول وإرسالها للعميل.');
      } else {
        showFeedback('error', data.error || 'فشل تغيير كلمة المرور');
      }
    } catch {
      showFeedback('error', 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setSavingPass(false);
    }
  };

  // Adjust Balance Submit
  const handleAdjustBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalUser || !adjustAmount || !adjustReason.trim()) {
      showFeedback('error', 'يرجى إدخال المبلغ وسبب التعديل المالي');
      return;
    }

    const num = parseFloat(adjustAmount);
    if (isNaN(num) || num <= 0) {
      showFeedback('error', 'المبلغ يجب أن يكون أكبر من الصفر');
      return;
    }

    const finalAmount = adjustType === 'credit' ? num : -num;

    setAdjusting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adjustModalUser.id,
          amount: finalAmount,
          reason: adjustReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showFeedback('error', data.error || 'فشل في تعديل الرصيد');
        return;
      }

      showFeedback('success', data.message || 'تم تعديل الرصيد بنجاح');
      setAdjustModalUser(null);
      setAdjustAmount('');
      setAdjustReason('');
      loadUsers();
      if (deepViewUser && deepViewUser.id === adjustModalUser.id) {
        setDeepViewUser({
          ...deepViewUser,
          wallet: {
            ...deepViewUser.wallet!,
            balance: (deepViewUser.wallet?.balance || 0) + finalAmount,
          },
        });
      }
    } catch {
      showFeedback('error', 'حدث خطأ في الاتصال');
    } finally {
      setAdjusting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!deleteUser) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users?id=${deleteUser.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        showFeedback('success', data.message || 'تم حذف المستخدم بنجاح');
        setDeleteUser(null);
        if (deepViewUser && deepViewUser.id === deleteUser.id) {
          setDeepViewUser(null);
        }
        loadUsers();
      } else {
        showFeedback('error', data.error || 'فشل حذف المستخدم');
      }
    } catch {
      showFeedback('error', 'حدث خطأ أثناء حذف المستخدم');
    } finally {
      setDeleting(false);
    }
  };

  // Summary Metrics
  const totalBalance = users.reduce((sum, u) => sum + (u.wallet?.balance || 0), 0);
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const totalOrders = users.reduce((sum, u) => sum + (u._count?.orders || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* ========================================================================= */}
      {/* 1. Header & World-Class Action Buttons                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white border border-sky-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              إدارة المستخدمين والحسابات
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              مركز التحكم الشامل 🛡️
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            استعراض بيانات العملاء الكاملة (اليوزر، الهاتف، البريد، كلمة المرور)، استرجاع الحسابات، وتعديل الأرصدة فوراً.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة مستخدم جديد ⚡</span>
          </button>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-700 hover:text-blue-600 transition shadow-xs"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Feedback Notification Banner                                           */}
      {/* ========================================================================= */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition shadow-xs animate-in fade-in ${
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

      {/* ========================================================================= */}
      {/* 3. 4 High-End KPI Metric Cards                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-sky-100 shadow-xs flex flex-col justify-between hover:border-purple-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي المسجلين</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-sans tracking-tight">
              {users.length} <span className="text-xs font-bold text-slate-400">عميل</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">قاعدة بيانات المنصة</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-sky-100 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">الحسابات النشطة</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-sans tracking-tight">
              {activeCount} <span className="text-xs font-bold text-emerald-600">نشط</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">جاهزون للشراء والطلب</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-sky-100 shadow-xs flex flex-col justify-between hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">أرصدة المحافظ</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-blue-600 font-sans tracking-tight">
              ${totalBalance.toFixed(2)}{' '}
              <span className="text-xs font-bold text-slate-500 font-mono">USD</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">إجمالي أموال العملاء المتاحة</p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-sky-100 shadow-xs flex flex-col justify-between hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">الطلبات المنفذة</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-sans tracking-tight">
              {totalOrders.toLocaleString('en-US')}{' '}
              <span className="text-xs font-bold text-slate-400">طلب</span>
            </div>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">من كافة المستخدمين</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Live Search & Multi-Filter Bar                                         */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-sky-100 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المستخدم، البريد الإلكتروني، أو رقم الهاتف..."
            className="w-full rounded-2xl bg-sky-50/60 border border-sky-200/80 px-4 py-2.5 pl-10 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs"
          />
          <button
            type="submit"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition"
            title="بحث"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 md:flex-none rounded-2xl bg-white border border-sky-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
          >
            <option value="ALL">جميع الرتب</option>
            <option value="USER">مستخدم عادي (User)</option>
            <option value="RESELLER">موزع معتمد (Reseller)</option>
            <option value="ADMIN">مدير نظام (Admin)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none rounded-2xl bg-white border border-sky-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="ACTIVE">نشط (Active)</option>
            <option value="SUSPENDED">مجمد مؤقتاً (Suspended)</option>
            <option value="DISABLED">معطل (Disabled)</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. Comprehensive Users Table & Mobile Cards                               */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-white border border-sky-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <span className="text-xs font-bold">جاري تحميل بيانات المستخدمين...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs font-bold">
            لا يوجد مستخدمين مطابقين للبحث الحالي
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-sky-50/70 text-slate-600 font-bold border-b border-sky-100">
                  <tr>
                    <th className="py-3.5 px-4">المستخدم</th>
                    <th className="py-3.5 px-4">بيانات الاتصال (الإيميل والهاتف)</th>
                    <th className="py-3.5 px-4">كلمة المرور</th>
                    <th className="py-3.5 px-4">الرصيد المتاح</th>
                    <th className="py-3.5 px-4">الطلبات</th>
                    <th className="py-3.5 px-4">الرتبة والحالة</th>
                    <th className="py-3.5 px-4 text-center">أدوات الإدارة والإنقاذ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 text-slate-700">
                  {users.map((u) => {
                    const hasPhone = Boolean(u.phone && u.phone.trim().length > 3);
                    const cleanPhone = u.phone ? u.phone.replace(/[^0-9+]/g, '') : '';

                    return (
                      <tr key={u.id} className="hover:bg-sky-50/40 transition">
                        {/* 1. User Name & Avatar */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{u.username}</span>
                                <button
                                  onClick={() => handleCopy(u.username, `user-${u.id}`)}
                                  className="text-slate-400 hover:text-blue-600 transition"
                                  title="نسخ اسم المستخدم"
                                >
                                  {copiedKey === `user-${u.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              <span className="font-mono text-[10px] text-slate-400">
                                #{u.id.slice(-6)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Contact: Email & Phone */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {/* Email */}
                            <div className="flex items-center gap-1.5 text-slate-800">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-mono text-[11px]">{u.email}</span>
                              <button
                                onClick={() => handleCopy(u.email, `mail-${u.id}`)}
                                className="text-slate-400 hover:text-blue-600 transition"
                                title="نسخ البريد الإلكتروني"
                              >
                                {copiedKey === `mail-${u.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>

                            {/* Phone */}
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {hasPhone ? (
                                <>
                                  <span className="font-mono text-[11px] font-bold text-slate-800" dir="ltr">
                                    {u.phone}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(u.phone || '', `phone-${u.id}`)}
                                    className="text-slate-400 hover:text-blue-600 transition"
                                    title="نسخ رقم الهاتف"
                                  >
                                    {copiedKey === `phone-${u.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                  <a
                                    href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                                    title="مراسلة واتساب فورية"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </a>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditUser(u);
                                    setEditUsername(u.username);
                                    setEditEmail(u.email);
                                    setEditPhone('');
                                    setEditRole(u.role);
                                    setEditStatus(u.status);
                                  }}
                                  className="text-[10px] text-blue-600 hover:underline font-semibold"
                                >
                                  + إضافة رقم هاتف
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Password Status & Reset */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              <Lock className="w-3 h-3 text-slate-500" />
                              مشفّرة بنظام Bcrypt
                            </span>
                            <div>
                              <button
                                onClick={() => {
                                  setResetPassUser(u);
                                  setResetNewPass('');
                                  setGeneratedPassInfo(null);
                                }}
                                className="text-[11px] text-amber-700 hover:text-amber-800 font-bold hover:underline flex items-center gap-1"
                              >
                                <KeyRound className="w-3 h-3 text-amber-600" />
                                <span>تغيير أو توليد كلمة سر ⚡</span>
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* 4. Live Wallet Balance */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div>
                            <div className="font-sans font-black text-blue-600 text-sm">
                              ${(u.wallet?.balance || 0).toFixed(2)}{' '}
                              <span className="text-[10px] font-bold text-slate-400 font-mono">USD</span>
                            </div>
                            <button
                              onClick={() => {
                                setAdjustModalUser(u);
                                setAdjustAmount('');
                                setAdjustReason('');
                              }}
                              className="text-[10px] text-purple-600 hover:text-purple-700 hover:underline font-bold mt-0.5 flex items-center gap-0.5"
                            >
                              <Wallet className="w-3 h-3" />
                              <span>شحن أو خصم رصيد</span>
                            </button>
                          </div>
                        </td>

                        {/* 5. Orders Count */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Link
                            href={`/admin/orders?search=${u.username}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-blue-700 border border-sky-200 text-xs font-bold transition"
                            title="عرض جميع طلبات هذا العميل"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{u._count.orders.toLocaleString('en-US')} طلب</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>

                        {/* 6. Role & Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {/* Role Badge */}
                            <div>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  u.role === 'ADMIN'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : u.role === 'RESELLER'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {u.role === 'ADMIN' ? 'مدير نظام 🛡️' : u.role === 'RESELLER' ? 'موزع 💎' : 'عميل 👤'}
                              </span>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {u.status === 'ACTIVE' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  نشط
                                </span>
                              ) : u.status === 'SUSPENDED' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  مجمد
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  معطل
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 7. Action Hub */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* 360° Comprehensive Profile */}
                            <button
                              onClick={() => setDeepViewUser(u)}
                              className="p-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                              title="عرض ملف المستخدم الكامل وخيارات الإنقاذ"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit Profile */}
                            <button
                              onClick={() => {
                                setEditUser(u);
                                setEditUsername(u.username);
                                setEditEmail(u.email);
                                setEditPhone(u.phone || '');
                                setEditRole(u.role);
                                setEditStatus(u.status);
                              }}
                              className="p-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
                              title="تعديل بيانات المستخدم"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => {
                                setResetPassUser(u);
                                setResetNewPass('');
                                setGeneratedPassInfo(null);
                              }}
                              className="p-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                              title="تغيير أو توليد كلمة المرور"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {/* Delete User */}
                            <button
                              onClick={() => setDeleteUser(u)}
                              className="p-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                              title="حذف أو تعطيل الحساب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden divide-y divide-sky-100">
              {users.map((u) => {
                const hasPhone = Boolean(u.phone && u.phone.trim().length > 3);
                const cleanPhone = u.phone ? u.phone.replace(/[^0-9+]/g, '') : '';

                return (
                  <div key={u.id} className="p-4 sm:p-5 space-y-3 hover:bg-sky-50/30 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{u.username}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              #{u.id.slice(-6)}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {u.email}
                          </div>
                        </div>
                      </div>

                      <div className="text-left">
                        <div className="font-sans font-black text-blue-600 text-base">
                          ${(u.wallet?.balance || 0).toFixed(2)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">USD</span>
                      </div>
                    </div>

                    {/* Phone & WhatsApp */}
                    {hasPhone && (
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-sky-50/60 border border-sky-100">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>رقم الهاتف:</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800" dir="ltr">{u.phone}</span>
                          <a
                            href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                            title="واتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-sky-100 gap-2">
                      <button
                        onClick={() => setDeepViewUser(u)}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>الملف الشامل</span>
                      </button>

                      <button
                        onClick={() => {
                          setResetPassUser(u);
                          setResetNewPass('');
                          setGeneratedPassInfo(null);
                        }}
                        className="py-2 px-3 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs hover:bg-amber-100 transition flex items-center justify-center gap-1"
                        title="تغيير كلمة المرور"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>كلمة السر</span>
                      </button>

                      <button
                        onClick={() => {
                          setAdjustModalUser(u);
                          setAdjustAmount('');
                          setAdjustReason('');
                        }}
                        className="py-2 px-3 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs hover:bg-purple-100 transition flex items-center justify-center gap-1"
                        title="تعديل الرصيد"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>الرصيد</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. 360° Comprehensive User Profile & Customer Recovery Center Modal        */}
      {/* ========================================================================= */}
      {deepViewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-sky-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {deepViewUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">
                      {deepViewUser.username}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      معرف: #{deepViewUser.id.slice(-8)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    مسجل منذ: {new Date(deepViewUser.createdAt).toLocaleDateString('ar-EG', { dateStyle: 'long' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeepViewUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-sky-50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Deep Profile Content */}
            <div className="mt-5 space-y-6">
              {/* Financial & Activity Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
                  <span className="text-[11px] font-bold text-slate-500 block">رصيد المحفظة</span>
                  <span className="text-xl font-black text-blue-600 font-sans mt-1 block">
                    ${(deepViewUser.wallet?.balance || 0).toFixed(2)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
                  <span className="text-[11px] font-bold text-slate-500 block">إجمالي الطلبات</span>
                  <span className="text-xl font-black text-slate-900 font-sans mt-1 block">
                    {deepViewUser._count.orders}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
                  <span className="text-[11px] font-bold text-slate-500 block">عمليات الشحن</span>
                  <span className="text-xl font-black text-slate-900 font-sans mt-1 block">
                    {deepViewUser._count.payments}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
                  <span className="text-[11px] font-bold text-slate-500 block">حالة الحساب</span>
                  <span className="mt-1 inline-block">
                    {deepViewUser.status === 'ACTIVE' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        نشط ومفعل
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                        {deepViewUser.status}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Complete Identity & Contact Details (كل بيانات المستخدم) */}
              <div className="rounded-2xl border border-sky-100 p-4 space-y-3 bg-white">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>معلومات الحساب والتواصل المباشر</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Username */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">اسم المستخدم (Username):</span>
                      <strong className="text-slate-900 text-xs font-mono">{deepViewUser.username}</strong>
                    </div>
                    <button
                      onClick={() => handleCopy(deepViewUser.username, 'modal-u')}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition"
                      title="نسخ"
                    >
                      {copiedKey === 'modal-u' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Email */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">البريد الإلكتروني:</span>
                      <strong className="text-slate-900 text-xs font-mono">{deepViewUser.email}</strong>
                    </div>
                    <button
                      onClick={() => handleCopy(deepViewUser.email, 'modal-e')}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition"
                      title="نسخ"
                    >
                      {copiedKey === 'modal-e' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Phone */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">رقم الهاتف:</span>
                      <strong className="text-slate-900 text-xs font-mono" dir="ltr">
                        {deepViewUser.phone || 'لم يسجل رقم هاتف'}
                      </strong>
                    </div>
                    {deepViewUser.phone && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(deepViewUser.phone || '', 'modal-p')}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition"
                          title="نسخ"
                        >
                          {copiedKey === 'modal-p' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={`https://wa.me/${deepViewUser.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition"
                          title="واتساب مباشر"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Password Status */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">حالة كلمة المرور:</span>
                      <strong className="text-emerald-700 text-xs flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        مشفرة بنظام Bcrypt آمن
                      </strong>
                    </div>
                    <button
                      onClick={() => {
                        setResetPassUser(deepViewUser);
                        setResetNewPass('');
                        setGeneratedPassInfo(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition shadow-2xs"
                    >
                      تغيير / توليد
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer Recovery Superpowers (إذا فقد المستخدم أي شيء) */}
              <div className="rounded-2xl border-2 border-dashed border-sky-200 p-4 space-y-3 bg-sky-50/40">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>خيارات مساعدة واسترجاع حساب المستخدم (Recovery Toolbox)</span>
                  </h4>
                  <span className="text-[10px] text-blue-600 font-bold">صلاحيات المدير الكاملة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* 1. Reset Password & Copy */}
                  <button
                    onClick={() => {
                      setResetPassUser(deepViewUser);
                      setResetNewPass('');
                      setGeneratedPassInfo(null);
                    }}
                    className="p-3 rounded-xl bg-white border border-amber-200 hover:border-amber-400 text-amber-900 transition flex flex-col items-start gap-1 shadow-2xs group text-right"
                  >
                    <span className="font-bold flex items-center gap-1.5 text-amber-800">
                      <KeyRound className="w-4 h-4 text-amber-600 group-hover:rotate-45 transition-transform" />
                      استرجاع كلمة المرور
                    </span>
                    <span className="text-[10px] text-slate-500">
                      توليد كلمة سر جديدة ونسخ تقرير الدخول لإرساله للعميل
                    </span>
                  </button>

                  {/* 2. Balance Adjust / Top-up */}
                  <button
                    onClick={() => {
                      setAdjustModalUser(deepViewUser);
                      setAdjustAmount('');
                      setAdjustReason('');
                    }}
                    className="p-3 rounded-xl bg-white border border-purple-200 hover:border-purple-400 text-purple-900 transition flex flex-col items-start gap-1 shadow-2xs group text-right"
                  >
                    <span className="font-bold flex items-center gap-1.5 text-purple-800">
                      <Wallet className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                      شحن أو تعويض الرصيد
                    </span>
                    <span className="text-[10px] text-slate-500">
                      إضافة أو خصم رصيد مالي مع توثيق السبب وإشعار العميل
                    </span>
                  </button>

                  {/* 3. Unlock or Activate */}
                  <button
                    onClick={() => handleQuickStatusChange(deepViewUser.id, deepViewUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                    className="p-3 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 text-emerald-900 transition flex flex-col items-start gap-1 shadow-2xs group text-right"
                  >
                    <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                      {deepViewUser.status === 'ACTIVE' ? (
                        <>
                          <Lock className="w-4 h-4 text-amber-600" />
                          تجميد الحساب مؤقتاً
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 text-emerald-600" />
                          إلغاء التجميد والتفعيل
                        </>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {deepViewUser.status === 'ACTIVE' ? 'حظر الدخول مؤقتاً' : 'إعادة تفعيل الحساب فوراً بنقرة واحدة'}
                    </span>
                  </button>
                </div>

                {/* Direct Activity Links */}
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                  <Link
                    href={`/admin/orders?search=${deepViewUser.username}`}
                    className="px-3 py-1.5 rounded-xl bg-white border border-sky-200 hover:bg-sky-50 text-slate-700 font-bold transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                    <span>استعراض سجل طلبات العميل</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Link>

                  <Link
                    href={`/admin/payments?search=${deepViewUser.username}`}
                    className="px-3 py-1.5 rounded-xl bg-white border border-sky-200 hover:bg-sky-50 text-slate-700 font-bold transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>استعراض تحويلات وإيداعات العميل</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-sky-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setEditUser(deepViewUser);
                  setEditUsername(deepViewUser.username);
                  setEditEmail(deepViewUser.email);
                  setEditPhone(deepViewUser.phone || '');
                  setEditRole(deepViewUser.role);
                  setEditStatus(deepViewUser.status);
                }}
                className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-blue-700 font-bold text-xs transition flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>تعديل بيانات الحساب</span>
              </button>

              <button
                onClick={() => setDeepViewUser(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. Reset / Generate Password Modal with WhatsApp/Telegram Recovery Copy   */}
      {/* ========================================================================= */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>إعادة ضبط كلمة المرور: {resetPassUser.username}</span>
              </h3>
              <button
                onClick={() => {
                  setResetPassUser(null);
                  setGeneratedPassInfo(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedPassInfo ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>تم حفظ كلمة المرور الجديدة في النظام بنجاح!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    تم تشفير كلمة المرور وتفعيلها للحساب. انسخ الرسالة الجاهزة أدناه وأرسلها للمستخدم عبر واتساب أو تيليجرام:
                  </p>
                  <div className="p-3 rounded-xl bg-white border border-emerald-200 font-mono text-xs text-slate-800 select-all space-y-1" dir="ltr">
                    <div>User: <strong>{generatedPassInfo.user}</strong></div>
                    <div>Email: <strong>{generatedPassInfo.email}</strong></div>
                    <div>New Password: <strong className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded">{generatedPassInfo.pass}</strong></div>
                    <div>Login URL: <strong>https://esaad.social/login</strong></div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const text = `مرحباً بك في منصة اصعد (esaad.social) 🚀\nتمت استعادة حسابك وتعيين كلمة المرور بنجاح:\n\n👤 اسم المستخدم: ${generatedPassInfo.user}\n📧 البريد الإلكتروني: ${generatedPassInfo.email}\n🔑 كلمة المرور الجديدة: ${generatedPassInfo.pass}\n🔗 رابط تسجيل الدخول: https://esaad.social/login\n\nيرجى تغيير كلمة المرور بعد الدخول للأمان.`;
                      handleCopy(text, 'full-recovery-msg');
                      showFeedback('success', 'تم نسخ الرسالة الجاهزة، يمكنك لصقها الآن في واتساب أو تليجرام');
                    }}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                  >
                    {copiedKey === 'full-recovery-msg' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>تم نسخ تقرير الدخول الكامل ✅</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>نسخ تقرير الدخول للعميل 📋</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setResetPassUser(null);
                      setGeneratedPassInfo(null);
                    }}
                    className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
                <p className="text-xs text-slate-500">
                  يمكنك كمدير إما كتابة كلمة مرور جديدة أو النقر على "توليد تلقائي" لإنشاء كلمة مرور قوية وفورية للعميل.
                </p>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      كلمة المرور الجديدة *
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>توليد كلمة سر عشوائية ⚡</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    placeholder="اكتب كلمة سر جديدة أو اضغط توليد"
                    required
                    minLength={6}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none font-mono font-bold"
                    dir="ltr"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetPassUser(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingPass || !resetNewPass}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-500 transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20"
                  >
                    {savingPass ? 'جاري الحفظ...' : 'تأكيد وحفظ كلمة المرور'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. Adjust Balance Modal (شحن / خصم الرصيد مع التوثيق)                     */}
      {/* ========================================================================= */}
      {adjustModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-purple-600" />
                <span>تعديل رصيد: {adjustModalUser.username}</span>
              </h3>
              <button
                onClick={() => setAdjustModalUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustBalanceSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200/80 flex justify-between items-center">
                <span className="text-slate-600 font-bold">الرصيد الحالي للمستخدم:</span>
                <span className="font-black text-blue-600 font-sans text-base">
                  ${(adjustModalUser.wallet?.balance || 0).toFixed(2)} USD
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع العملية المالية
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('credit')}
                    className={`py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs ${
                      adjustType === 'credit'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>إضافة رصيد (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('debit')}
                    className={`py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-xs ${
                      adjustType === 'debit'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>خصم رصيد (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المبلغ بالدولار ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="مثال: 10.00"
                  required
                  min={0.01}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-none font-sans font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  سبب التعديل المالي (إلزامي للتدقيق وإشعار المستخدم) *
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="مثال: تسوية يدوية لحوالة مالية، تعويض عن طلب، شحن مباشر..."
                  required
                  rows={2}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-xs text-slate-900 focus:bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition disabled:opacity-50 shadow-md shadow-purple-600/20"
                >
                  {adjusting ? 'جاري المعالجة...' : 'تأكيد العملية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. Edit User Modal (تعديل بيانات المستخدم)                                 */}
      {/* ========================================================================= */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600" />
                <span>تعديل بيانات: {editUser.username}</span>
              </h3>
              <button
                onClick={() => setEditUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الهاتف (للتواصل والواتساب)
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="مثال: 07XXXXXXXXX أو 9647XXXXXXXXX"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الرتبة
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="USER">مستخدم عادي</option>
                    <option value="RESELLER">موزع معتمد</option>
                    <option value="ADMIN">مدير نظام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    حالة الحساب
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">نشط (Active)</option>
                    <option value="SUSPENDED">مجمد (Suspended)</option>
                    <option value="DISABLED">معطل (Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {savingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. Create New User Modal                                                 */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 border border-sky-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>إضافة مستخدم جديد للنظام</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المستخدم (Username) *
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="مثال: ahmed_vip"
                  required
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    كلمة المرور *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6 أحرف كحد أدنى"
                    required
                    minLength={6}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="07XXXXXXXXX"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الرتبة والصلاحية
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="USER">مستخدم عادي</option>
                    <option value="RESELLER">موزع معتمد</option>
                    <option value="ADMIN">مدير نظام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الرصيد الأولي ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInitialBalance}
                    onChange={(e) => setNewInitialBalance(e.target.value)}
                    min={0}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none font-sans font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {creating ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. Delete / Disable Confirmation Modal                                   */}
      {/* ========================================================================= */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 border border-sky-100 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              حذف أو تعطيل حساب المستخدم
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              هل أنت متأكد من حذف حساب <strong className="text-slate-900">{deleteUser.username}</strong>؟ إذا كان للمستخدم سجلات مالية أو طلبات سابقة، فسيتم تجميده وتعطيله تلقائياً لحماية الأرشيف المحاسبي.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition disabled:opacity-50 text-xs shadow-md shadow-rose-600/20"
              >
                {deleting ? 'جاري التنفيذ...' : 'نعم، احذف أو عطل الحساب'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
