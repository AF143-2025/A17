'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HeaderLogout() {
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

  return (
    <button
      onClick={handleLogout}
      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 hover:bg-rose-500/10 flex items-center justify-center text-slate-400 hover:text-rose-400 transition"
      title="تسجيل الخروج"
      aria-label="تسجيل الخروج"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
