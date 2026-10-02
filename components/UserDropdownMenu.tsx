'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Zap,
  ShoppingBag,
  Wallet,
  Layers,
  Headphones,
  User as UserIcon,
  LogOut,
} from 'lucide-react';

interface UserDropdownMenuProps {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  balance: number;
}

export default function UserDropdownMenu({ user, balance }: UserDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Click outside and escape key listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* ========================================================================= */}
      {/* ☰ Three-Lines Hamburger Icon Trigger Button                               */}
      {/* ========================================================================= */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 rotate-90'
            : 'bg-sky-50/80 hover:bg-sky-100 text-slate-700 hover:text-blue-600 border-sky-200/90 shadow-xs'
        }`}
        title="القائمة (ثلاث خطوط)"
        aria-label="القائمة"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* ========================================================================= */}
      {/* Sleek, Compact Floating Dropdown Card                                     */}
      {/* ========================================================================= */}
      {isOpen && (
        <>
          {/* Mobile backdrop for outside click */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/20 z-40 sm:hidden"
          />
          <div
            className="absolute left-0 mt-2.5 w-64 sm:w-72 max-w-[calc(100vw-1.5rem)] rounded-3xl bg-white border border-sky-100 shadow-2xl shadow-sky-900/15 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-left font-sans"
            dir="rtl"
          >
          {/* User & Wallet Summary Header */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/40 border border-sky-100/80 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1 text-right">
                <div className="font-bold text-slate-900 text-xs truncate">
                  {user.username}
                </div>
                <div className="text-[11px] font-black text-emerald-600 font-sans tracking-tight">
                  ${balance.toFixed(2)}{' '}
                  <span className="text-[9px] font-bold text-slate-400">USD</span>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="متصل" />
            </div>
          </div>

          {/* Requested Navigation Items */}
          <div className="space-y-0.5 text-xs text-right">
            {/* 1. طلب جديد */}
            <Link
              href="/new-order"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 transition"
            >
              <Zap className="w-4 h-4 text-blue-600 shrink-0" />
              <span>طلب جديد ⚡</span>
            </Link>

            {/* 2. سجل الطلبات */}
            <Link
              href="/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-slate-900 transition font-medium"
            >
              <ShoppingBag className="w-4 h-4 text-purple-600 shrink-0" />
              <span>سجل الطلبات</span>
            </Link>

            {/* 3. شحن الرصيد */}
            <Link
              href="/wallet#deposit-section"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-slate-900 transition font-medium"
            >
              <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>شحن الرصيد</span>
            </Link>

            {/* 4. خدماتنا */}
            <Link
              href="/services"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-slate-900 transition font-medium"
            >
              <Layers className="w-4 h-4 text-sky-600 shrink-0" />
              <span>خدماتنا</span>
            </Link>

            {/* 5. الدعم الفني */}
            <Link
              href="/support"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-slate-900 transition font-medium"
            >
              <Headphones className="w-4 h-4 text-amber-600 shrink-0" />
              <span>الدعم الفني</span>
            </Link>

            {/* 6. الملف الشخصي */}
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-sky-50 hover:text-slate-900 transition font-medium"
            >
              <UserIcon className="w-4 h-4 text-slate-600 shrink-0" />
              <span>الملف الشخصي</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="h-px bg-sky-100 my-1.5" />

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-right"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
        </>
      )}
    </div>
  );
}
