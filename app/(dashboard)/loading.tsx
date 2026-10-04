import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto animate-pulse">
      {/* Top bar loading shimmer */}
      <div className="h-24 bg-white/70 border border-sky-100 rounded-3xl" />
      <div className="flex justify-end gap-3 px-2">
        <div className="h-4 w-20 bg-sky-100 rounded-lg" />
        <div className="h-4 w-20 bg-sky-100 rounded-lg" />
      </div>
      <div className="h-12 bg-white/70 border border-sky-100 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-20 bg-white/70 border border-sky-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
