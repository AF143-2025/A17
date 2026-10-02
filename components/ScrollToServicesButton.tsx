'use client';

import React from 'react';

export default function ScrollToServicesButton() {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const elem = document.getElementById('services-catalog');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/80 px-8 py-4 text-base font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition cursor-pointer"
    >
      <span>استعراض الخدمات والباقات</span>
    </button>
  );
}
