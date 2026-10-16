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

  const isNewOrder = pathname === '/new-order';

  if (isNewOrder) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-sky-100 px-2 py-1.5 shadow-2xl shadow-sky-900/10 transition-all select-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className="flex flex-col items-center py-0.5 px-3 rounded-xl transition-all active:scale-95 group"
            >
              <div
                className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white shadow-md shadow-blue-500/30 border-t border-white/50'
                    : 'text-slate-500 group-hover:text-slate-900 group-hover:bg-sky-50/60'
                }`}
              >
                {isActive && (
                  <>
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white/40 blur-[1px] pointer-events-none" />
                  </>
                )}
                <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'drop-shadow-xs' : ''}`} />
              </div>
              <span
                className={`text-[10px] mt-0.5 transition-colors ${
                  isActive ? 'font-bold text-blue-600' : 'font-medium text-slate-500 group-hover:text-slate-700'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
