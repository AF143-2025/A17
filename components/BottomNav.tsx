'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListOrdered, Wallet, Headphones, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { label: 'الرئيسية', href: '/dashboard', icon: Home },
    { label: 'طلباتي', href: '/orders', icon: ListOrdered },
    { label: 'شحن', href: '/wallet', icon: Wallet },
    { label: 'الدعم', href: '/support', icon: Headphones },
    { label: 'حسابي', href: '/profile', icon: User },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-sky-100 px-2 py-1.5 shadow-2xl shadow-sky-900/10 transition-all select-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all active:scale-90 active:opacity-70 ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
              <span className={`text-[11px] mt-1 ${isActive ? 'font-bold text-blue-600' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
