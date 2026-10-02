'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { Menu, X, LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'الرئيسية', targetId: 'hero' },
    { label: 'لماذا اصعد؟', targetId: 'features' },
    { label: 'الخدمات', targetId: 'services-catalog' },
    { label: 'كيف تعمل؟', targetId: 'how-it-works' },
    { label: 'الأسئلة الشائعة', targetId: 'faq' },
  ];

  const handleScroll = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    if (targetId === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex h-16 items-center justify-between rounded-2xl bg-white/90 backdrop-blur-xl border border-sky-100 px-4 sm:px-6 shadow-xl shadow-sky-200/40">
          {/* Brand Logo */}
          <Logo size="md" />

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={(e) => handleScroll(e, item.targetId)}
                className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-2 text-sm font-bold text-sky-800 hover:bg-sky-100 hover:border-sky-300 transition"
            >
              <LogIn className="w-4 h-4 text-blue-600" />
              تسجيل الدخول
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:opacity-95 transition transform active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              ابدأ الآن
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-xl p-2 text-slate-600 hover:bg-sky-50 hover:text-slate-900 transition"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          />
          <div className="md:hidden px-4 mt-2 relative z-50 animate-in slide-in-from-top-3 duration-200">
            <div className="rounded-3xl bg-white p-5 shadow-2xl flex flex-col gap-3.5 border border-sky-100">
            {navLinks.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={(e) => handleScroll(e, item.targetId)}
                className="text-base font-bold text-slate-800 hover:text-blue-600 transition-colors py-1 cursor-pointer text-right w-full"
              >
                {item.label}
              </button>
            ))}
            <div className="h-px bg-sky-100 my-1" />
            <div className="flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 py-2.5 text-sm font-bold text-sky-800"
              >
                <LogIn className="w-4 h-4 text-blue-600" />
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25"
              >
                <UserPlus className="w-4 h-4" />
                ابدأ الآن مجاناً
              </Link>
            </div>
          </div>
        </div>
      </>
    )}
  </header>
  );
}
