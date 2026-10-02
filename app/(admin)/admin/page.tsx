'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Layers,
  Settings,
  ArrowUpRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface StatsData {
  totalUsers: number;
  newUsersToday: number;
  totalOrders: number;
  ordersToday: number;
  totalRevenue: number;
  totalProfit: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
        <span className="text-xs">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">نظرة عامة</h1>
          <p className="text-xs text-slate-500 mt-0.5">ملخص حركة المنصة والمبيعات</p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-sky-50 transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          <span>تحديث</span>
        </button>
      </div>

      {/* 2. Four Clean Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Orders */}
        <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>إجمالي الطلبات</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-sans">
            {stats.totalOrders.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">
            +{stats.ordersToday} طلب اليوم
          </div>
        </div>

        {/* Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>إجمالي المبيعات</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-sans">
            ${stats.totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            إجمالي المدفوعات المستلمة
          </div>
        </div>

        {/* Profit */}
        <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>صافي الربح</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 font-sans">
            +${stats.totalProfit.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            هامش الربح بعد خصم التكاليف
          </div>
        </div>

        {/* Users */}
        <div className="p-5 rounded-2xl bg-white border border-sky-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>المستخدمين</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-sans">
            {stats.totalUsers.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            +{stats.newUsersToday} مسجل اليوم
          </div>
        </div>
      </div>

      {/* 3. Quick Navigation Links (Simple, Direct 4 Cards) */}
      <div className="pt-2">
        <h2 className="text-sm font-bold text-slate-900 mb-3">إدارة أقسام المنصة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin/orders"
            className="p-4 rounded-2xl bg-white border border-sky-100 hover:border-blue-300 hover:shadow-md transition flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">إدارة الطلبات</span>
                <span className="text-[11px] text-slate-500">متابعة واسترجاع وحذف</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
          </Link>

          <Link
            href="/admin/services"
            className="p-4 rounded-2xl bg-white border border-sky-100 hover:border-blue-300 hover:shadow-md transition flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">الخدمات والتصنيفات</span>
                <span className="text-[11px] text-slate-500">إضافة وتعديل الأسعار</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
          </Link>

          <Link
            href="/admin/users"
            className="p-4 rounded-2xl bg-white border border-sky-100 hover:border-blue-300 hover:shadow-md transition flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">المستخدمين والمحافظ</span>
                <span className="text-[11px] text-slate-500">شحن الرصيد والتحكم</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
          </Link>

          <Link
            href="/admin/settings"
            className="p-4 rounded-2xl bg-white border border-sky-100 hover:border-blue-300 hover:shadow-md transition flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">إعدادات المنصة</span>
                <span className="text-[11px] text-slate-500">تليغرام ووضع الصيانة</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}
