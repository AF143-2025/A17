'use client';

import React, { useState } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/services?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالاسم أو رقم الخدمة (ID)..."
          className="w-full h-12 sm:h-13 pr-4 pl-12 rounded-2xl bg-white border border-sky-100 hover:border-sky-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-sans shadow-xs transition outline-hidden"
        />
        <button
          type="submit"
          className="absolute left-2 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-50 hover:bg-blue-600 text-slate-500 hover:text-white flex items-center justify-center transition-colors"
          title="بحث"
          aria-label="بحث"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
