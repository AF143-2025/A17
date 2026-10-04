'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Users,
  Server,
  CreditCard,
  Headphones,
  Settings,
  FileText,
  LogOut,
  X,
  UserCog,
  ChevronLeft,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  desktopOpen?: boolean;
  adminUser?: {
    username: string;
    email: string;
    role: string;
  };
}

export default function AdminSidebar({
  isOpen,
  onClose,
  desktopOpen = true,
  adminUser,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Prevent background scrolling when mobile fullscreen menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { label: 'لوحة الإحصائيات', href: '/admin', icon: LayoutDashboard },
    { label: 'إدارة الطلبات', href: '/admin/orders', icon: ShoppingBag },
    { label: 'الخدمات والتصنيفات', href: '/admin/services', icon: Layers },
    { label: 'المستخدمين والمحافظ', href: '/admin/users', icon: Users },
    { label: 'المزودين (API)', href: '/admin/providers', icon: Server },
    { label: 'المدفوعات والشحن', href: '/admin/payments', icon: CreditCard },
    { label: 'تذاكر الدعم', href: '/admin/tickets', icon: Headphones },
    { label: 'إعدادات المنصة', href: '/admin/settings', icon: Settings },
    { label: 'سجل التدقيق', href: '/admin/audit-logs', icon: FileText },
    { label: 'الملف الشخصي', href: '/admin/profile', icon: UserCog },
  ];

  return (
    <>
      {/* 1. Desktop Fixed Sidebar - ALWAYS clean and fixed on desktop, NO burger toggle */}
      {desktopOpen && (
        <aside className="w-60 fixed inset-y-0 right-0 z-30 hidden md:flex flex-col bg-white border-l border-sky-100 select-none shadow-sm">
          {/* Header */}
          <div className="h-16 px-6 border-b border-sky-100 flex items-center justify-between">
            <Logo size="md" href="/admin" showTagline={false} />
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer User Info & Logout */}
          <div className="p-3 border-t border-sky-100 space-y-2">
            {adminUser && (
              <Link
                href="/admin/profile"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-sky-50/70 hover:bg-sky-100 border border-sky-100 text-xs transition group"
                title="إعدادات الحساب وكلمة المرور"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-900 group-hover:text-blue-600 font-sans truncate">
                    {adminUser.username}
                  </span>
                </div>
                <span className="text-[10px] text-blue-600 font-bold shrink-0">إعداداتي ⚙️</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </aside>
      )}

      {/* 2. Mobile Fullscreen Menu - Opens across the ENTIRE SCREEN when 3-line icon is tapped */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-white flex flex-col animate-in fade-in duration-200">
          {/* Mobile Fullscreen Header with Logo & Clear Close Button */}
          <div className="h-16 px-5 border-b border-sky-100 flex items-center justify-between bg-sky-50/40 shrink-0">
            <div className="flex items-center gap-3">
              <Logo size="sm" href="/admin" showTagline={false} />
              <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-sky-100">
                لوحة الإدارة
              </span>
            </div>

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition flex items-center gap-1.5 shadow-sm active:scale-95"
              aria-label="إغلاق القائمة"
            >
              <span className="text-xs font-bold">إغلاق</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Admin User Card (Mobile) */}
          {adminUser && (
            <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-sky-50 to-blue-50/40 border border-sky-100 rounded-2xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {adminUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{adminUser.username}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{adminUser.email}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                مسؤول
              </span>
            </div>
          )}

          {/* Scrollable Navigation List (Full Screen) */}
          <nav className="flex-1 px-4 py-3 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-semibold transition active:scale-[0.99] ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-sky-50 border border-transparent hover:border-sky-100'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-1.5 rounded-xl ${isActive ? 'bg-white/20' : 'bg-sky-50 text-blue-600'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold">{item.label}</span>
                  </div>
                  <ChevronLeft className={`w-4 h-4 ${isActive ? 'text-white/80' : 'text-slate-300'}`} />
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions (Mobile) */}
          <div className="p-4 border-t border-sky-100 bg-slate-50/50 space-y-2 shrink-0">
            <Link
              href="/admin/profile"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white border border-sky-200 text-xs font-bold text-slate-800 hover:bg-sky-50 shadow-sm transition"
            >
              <UserCog className="w-4 h-4 text-blue-600" />
              <span>إعدادات حساب المسؤول وكلمة المرور</span>
            </Link>

            <button
              onClick={() => {
                onClose();
                handleLogout();
              }}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-sm"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>تسجيل الخروج من لوحة التحكم</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
