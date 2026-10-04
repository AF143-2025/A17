'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, PlusCircle } from 'lucide-react';
import Logo from './Logo';
import NotificationDropdown from './NotificationDropdown';
import UserDropdownMenu from './UserDropdownMenu';

interface DashboardHeaderProps {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  balance: number;
}

export default function DashboardHeader({ user, balance }: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isNewOrder = pathname === '/new-order';

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 sm:h-20 bg-white/95 backdrop-blur-xl border-b-0 lg:border-b lg:border-sky-100 px-4 sm:px-8 flex items-center justify-between shadow-xs lg:shadow-sm">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between w-full">
        {isNewOrder ? (
          <>
            {/* Right: Back Arrow Button */}
            <button
              type="button"
              onClick={handleBack}
              className="w-10 h-10 rounded-2xl bg-white border border-sky-100 flex items-center justify-center text-slate-700 hover:text-slate-900 shadow-xs active:scale-95 transition cursor-pointer"
              title="رجوع"
              aria-label="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Center: Title "طلب جديد" */}
            <h1 className="text-base font-black text-slate-900">
              طلب جديد
            </h1>

            {/* Left: Notification Bell */}
            <div className="w-10 h-10 flex items-center justify-center">
              <NotificationDropdown />
            </div>
          </>
        ) : (
          <>
            {/* Default Header: Logo on Right, Notification on Left */}
            <Logo size="sm" href="/dashboard" showTagline={false} />
            <NotificationDropdown />
          </>
        )}
      </div>

      {/* Desktop / Laptop Header */}
      <div className="hidden lg:flex items-center justify-between w-full max-w-5xl mx-auto">
        {isNewOrder ? (
          <>
            {/* Right: Back button + Title */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="w-10 h-10 rounded-2xl bg-white border border-sky-100 flex items-center justify-center text-slate-700 hover:text-slate-900 shadow-xs transition cursor-pointer"
                title="رجوع"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900">طلب جديد</h1>
                <p className="text-xs text-slate-500">اختر تفاصيل الخدمة وأكد طلبك فوراً</p>
              </div>
            </div>

            {/* Center: Official Logo */}
            <div className="flex items-center justify-center">
              <Logo size="sm" href="/dashboard" showTagline={false} />
            </div>

            {/* Left: Notification Bell */}
            <div className="w-10 h-10 flex items-center justify-center">
              <NotificationDropdown />
            </div>
          </>
        ) : (
          <>
            {/* Right in RTL: 3-Lines Hamburger Menu Button */}
            <div className="w-10 h-10 flex items-center justify-center">
              <UserDropdownMenu user={user} balance={balance} />
            </div>

            {/* Center: Official Logo */}
            <div className="flex items-center justify-center">
              <Logo size="sm" href="/dashboard" showTagline={false} />
            </div>

            {/* Left in RTL: Notification Bell */}
            <div className="w-10 h-10 flex items-center justify-center">
              <NotificationDropdown />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
