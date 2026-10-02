'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, PlusCircle, Wallet, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { label: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard },
    { label: 'الطلبات', href: '/orders', icon: ShoppingBag },
    { label: 'طلب جديد', href: '/new-order', icon: PlusCircle, isCenter: true },
    { label: 'المحفظة', href: '/wallet', icon: Wallet },
    { label: 'الحساب', href: '/profile', icon: User },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-sky-100 px-2 pt-1.5 shadow-2xl shadow-sky-900/10 transition-all select-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-5 group"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 transition transform active:scale-95 group-hover:scale-105 border-2 border-white">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-blue-600 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className={`text-[11px] mt-1 font-medium ${isActive ? 'font-bold text-blue-600' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
