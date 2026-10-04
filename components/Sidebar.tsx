'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';
import {
  LayoutDashboard,
  PlusCircle,
  ShoppingBag,
  Wallet,
  Layers,
  Sparkles,
  HeadphonesIcon,
  User,
  LogOut,
  KeyRound,
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
  balance?: number;
}

export default function Sidebar({ userRole = 'USER', balance = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { label: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard },
    { label: 'طلب جديد', href: '/new-order', icon: PlusCircle, highlight: true },
    { label: 'طلباتي', href: '/orders', icon: ShoppingBag },
    { label: 'المحفظة والمدفوعات', href: '/wallet', icon: Wallet },
    { label: 'دليل الخدمات', href: '/services', icon: Layers },
    { label: 'الدعم الفني', href: '/support', icon: HeadphonesIcon },
    { label: 'الملف الشخصي', href: '/profile', icon: User },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 right-0 z-30 bg-white border-l border-sky-100 select-none shadow-sm">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-sky-100">
        <Logo size="md" href="/dashboard" />
      </div>

      {/* Quick Balance Preview Card */}
      <div className="p-4 mx-4 mt-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>الرصيد المتاح</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="mt-1 text-2xl font-black text-slate-900 font-sans tracking-tight">
          {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          <span className="text-xs font-bold text-emerald-600">$</span>
        </div>
        <Link
          href="/wallet"
          className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition"
        >
          <span>+</span>
          <span>شحن الرصيد</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-sky-100/70 text-blue-700 border border-sky-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-sky-50 hover:text-blue-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-sky-100">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
