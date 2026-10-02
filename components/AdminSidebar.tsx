'use client';

import React from 'react';
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Simple, direct navigation items - no clutter, no extra noise
  const navItems = [
    { label: 'الرئيسية', href: '/admin', icon: LayoutDashboard },
    { label: 'الطلبات', href: '/admin/orders', icon: ShoppingBag },
    { label: 'الخدمات', href: '/admin/services', icon: Layers },
    { label: 'المستخدمين', href: '/admin/users', icon: Users },
    { label: 'المزودين (API)', href: '/admin/providers', icon: Server },
    { label: 'المدفوعات', href: '/admin/payments', icon: CreditCard },
    { label: 'تذاكر الدعم', href: '/admin/tickets', icon: Headphones },
    { label: 'إعدادات المنصة', href: '/admin/settings', icon: Settings },
    { label: 'سجل التدقيق', href: '/admin/audit-logs', icon: FileText },
    { label: 'الملف الشخصي', href: '/admin/profile', icon: UserCog },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white border-l border-sky-100 text-slate-700 select-none shadow-sm">
      {/* 1. Header */}
      <div>
        <div className="h-16 px-6 border-b border-sky-100 flex items-center justify-between">
          <Logo size="md" href="/admin" showTagline={false} />
          <button
            onClick={onClose}
            className="md:hidden p-1 text-slate-400 hover:text-slate-700"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Direct, Simple Nav List */}
        <nav className="p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 3. Footer */}
      <div className="p-4 border-t border-sky-100 space-y-2">

        {adminUser && (
          <Link
            href="/admin/profile"
            onClick={onClose}
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-sky-50/70 hover:bg-sky-100 border border-sky-100 text-xs transition group"
            title="إعدادات الحساب وكلمة المرور"
          >
            <span className="font-bold text-slate-900 group-hover:text-blue-600 font-sans transition">
              {adminUser.username}
            </span>
            <span className="text-[10px] text-blue-600 font-mono font-bold">إعداداتي ⚙️</span>
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
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      {desktopOpen && (
        <aside className="w-60 fixed inset-y-0 right-0 z-30 hidden md:block">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 right-0 w-64 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-right z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
