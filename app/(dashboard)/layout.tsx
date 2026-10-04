import React from 'react';
import BottomNav from '@/components/BottomNav';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { redirect } from 'next/navigation';
import HeaderLogout from '@/components/HeaderLogout';
import DashboardHeader from '@/components/DashboardHeader';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Enforce maintenance mode for non-admin users
  if (user.role !== 'ADMIN') {
    const maintenanceSetting = await db.setting.findUnique({
      where: { key: 'maintenance_mode' },
    });

    if (maintenanceSetting && maintenanceSetting.value === 'true') {
      return (
        <div className="min-h-screen bg-[#F0F8FF] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-5 shadow-sm border border-amber-200">
            <span className="text-4xl">🛠️</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">المنصة في وضع الصيانة والتطوير</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
            نقوم حالياً بإجراء تحديثات دورية لتحسين سرعة وجودة تنفيذ الطلبات. سنعود للعمل مجدداً خلال وقت قصير جداً.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://t.me/Hexc8re"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0088cc] to-[#00b0ff] text-white font-bold text-xs shadow-md shadow-sky-500/20 hover:opacity-95 transition"
            >
              مراسلة الدعم الفني المباشر (@Hexc8re)
            </a>
            <HeaderLogout />
          </div>
        </div>
      );
    }
  }

  const balance = user.wallet?.balance || 0;

  return (
    <div className="min-h-screen bg-[#F0F8FF] text-slate-900 flex flex-col">
      {/* Dashboard Header */}
      <DashboardHeader
        user={{
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        }}
        balance={balance}
      />

      {/* Main Content Area - Clean, centered, and NO SIDEBAR */}
      <div className="flex-1 flex flex-col min-h-screen pb-24 sm:pb-28">
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Bottom Navigation (Mobile & Laptop) */}
      <BottomNav />
    </div>
  );
}
