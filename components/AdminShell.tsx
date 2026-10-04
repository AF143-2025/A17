'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import AdminSidebar from '@/components/AdminSidebar';
import { Menu, LogOut } from 'lucide-react';

interface AdminShellProps {
  adminUser: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  children: React.ReactNode;
}

export default function AdminShell({ adminUser, children }: AdminShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const pathname = usePathname();

  const pageTitles: Record<string, string> = {
    '/admin': 'لوحة الإحصائيات',
    '/admin/orders': 'إدارة الطلبات',
    '/admin/services': 'الخدمات والتصنيفات',
    '/admin/providers': 'المزودين (API)',
    '/admin/users': 'المستخدمين والمحافظ',
    '/admin/payments': 'المدفوعات والشحن',
    '/admin/tickets': 'تذاكر الدعم',
    '/admin/settings': 'إعدادات المنصة',
    '/admin/audit-logs': 'سجل التدقيق',
    '/admin/profile': 'الملف الشخصي وإعدادات الحساب',
  };

  const currentTitle = pageTitles[pathname] || 'لوحة التحكم';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F8FF] text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white admin-theme">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        desktopOpen={true}
        adminUser={adminUser}
      />

      <div className="flex-1 flex flex-col min-h-screen md:pr-60">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-sky-100 px-4 sm:px-6 flex items-center justify-between shadow-sm">
          {/* Right Side (in RTL): Title & Logo */}
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <Logo size="sm" href="/admin" showTagline={false} />
            </div>

            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              {currentTitle}
            </h1>
          </div>

          {/* Left Side (in RTL): User Pill, and 3-Line Hamburger Button on the Far Left! */}
          <div className="flex items-center gap-2.5">

            {/* Clickable Admin Profile Pill */}
            <Link
              href="/admin/profile"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs transition group"
              title="تعديل بيانات الحساب وكلمة المرور"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-900 font-bold group-hover:text-blue-600 transition">{adminUser.username}</span>
            </Link>

            {/* Quick Header Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 transition"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>خروج</span>
            </button>

            {/* ☰ Three-line hamburger icon ONLY ON MOBILE (hidden on laptops: md:hidden) */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-slate-700 hover:text-slate-900 hover:bg-sky-100 transition flex items-center justify-center shadow-sm"
              title="القائمة"
              aria-label="القائمة"
            >
              <Menu className="w-5 h-5 text-blue-600" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
