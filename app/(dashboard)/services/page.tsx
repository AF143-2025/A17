'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Layers, Zap, Clock, Coins, ArrowLeft, Loader2 } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  categories: {
    id: string;
    name: string;
    nameAr: string;
    services: {
      id: string;
      name: string;
      description: string;
      pricePer1000: number;
      minQuantity: number;
      maxQuantity: number;
      speed?: string;
      avgTime?: string;
    }[];
  }[];
}

export default function ServicesPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          setPlatforms(data.platforms || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Restore scroll position to clicked service when returning via back button
  useEffect(() => {
    if (!loading && platforms.length > 0) {
      try {
        const lastId = sessionStorage.getItem('services_last_id');
        if (lastId) {
          sessionStorage.removeItem('services_last_id');
          setTimeout(() => {
            const el = document.getElementById(`service-item-${lastId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50/70');
              setTimeout(() => {
                el.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/70');
              }, 1800);
            }
          }, 120);
        }
      } catch (e) {}
    }
  }, [loading, platforms.length]);

  // Filter services
  const filteredList = React.useMemo(() => {
    const list: any[] = [];
    platforms.forEach((p) => {
      if (selectedPlatform !== 'ALL' && p.slug !== selectedPlatform) return;
      p.categories.forEach((c) => {
        c.services.forEach((s) => {
          const matchSearch =
            !search.trim() ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.description.toLowerCase().includes(search.toLowerCase()) ||
            c.nameAr.includes(search) ||
            p.nameAr.includes(search);

          if (matchSearch) {
            list.push({
              ...s,
              categoryName: c.nameAr,
              platformName: p.nameAr,
              platformSlug: p.slug,
            });
          }
        });
      });
    });
    return list;
  }, [platforms, selectedPlatform, search]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-xs">جاري تحميل دليل الخدمات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-slate-900 font-sans">دليل الخدمات والأسعار</h1>
        <p className="text-xs text-slate-500 mt-1">
          استعرض قائمة كافة الخدمات المتاحة وأسعارها ($)
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-sky-100 flex flex-col md:flex-row items-center gap-3 shadow-sm">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن أي خدمة أو منصة..."
            className="w-full rounded-xl bg-sky-50/60 border border-sky-200 px-4 py-2.5 pl-10 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:bg-white transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
          className="w-full md:w-auto rounded-xl bg-white border border-sky-200 px-3 py-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none shadow-sm"
        >
          <option value="ALL">جميع الأقسام والخدمات</option>
          {platforms.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.nameAr} ({p.name})
            </option>
          ))}
        </select>
      </div>

      {/* Services Table */}
      <div className="rounded-3xl bg-white border border-sky-100 overflow-hidden shadow-sm">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            لا توجد خدمات مطابقة لبحثك
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-sky-50/80 text-slate-700 font-bold border-b border-sky-100">
                  <tr>
                    <th className="py-3.5 px-4">رقم الخدمة</th>
                    <th className="py-3.5 px-4">القسم</th>
                    <th className="py-3.5 px-4">التصنيف</th>
                    <th className="py-3.5 px-4">اسم الخدمة</th>
                    <th className="py-3.5 px-4">السعر لكل 1,000</th>
                    <th className="py-3.5 px-4">الحدود (Min / Max)</th>
                    <th className="py-3.5 px-4">السرعة</th>
                    <th className="py-3.5 px-4 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100 text-slate-700">
                  {filteredList.map((service) => (
                    <tr
                      key={service.id}
                      id={`service-item-${service.id}`}
                      className="hover:bg-sky-50/50 transition-all duration-300"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        #{service.id.slice(-5)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {service.platformName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {service.categoryName}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-bold text-slate-900 leading-snug">{service.name}</div>
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          {service.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-black text-blue-600">
                        ${service.pricePer1000.toLocaleString('en-US')}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-600 whitespace-nowrap">
                        {service.minQuantity.toLocaleString('en-US')} - {service.maxQuantity.toLocaleString('en-US')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {service.speed || 'فوري'}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Link
                          href={`/new-order?serviceId=${service.id}`}
                          onClick={() => {
                            try {
                              sessionStorage.setItem('services_last_id', service.id);
                            } catch (e) {}
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-100 border border-sky-300 text-blue-700 hover:bg-sky-200 text-xs font-bold transition shadow-sm"
                        >
                          <span>طلب</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< sm) */}
            <div className="sm:hidden divide-y divide-sky-100">
              {filteredList.map((service) => (
                <div
                  key={service.id}
                  id={`service-item-${service.id}`}
                  className="p-4 space-y-2.5 hover:bg-sky-50/40 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                      {service.platformName} • {service.categoryName}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      #{service.id.slice(-5)}
                    </span>
                  </div>

                  <h3 className="text-xs font-black text-slate-900 leading-snug">
                    {service.name}
                  </h3>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">السعر لكل 1,000</span>
                      <span className="font-sans font-black text-blue-600 text-sm">
                        ${service.pricePer1000.toLocaleString('en-US')}
                      </span>
                    </div>

                    <div className="text-left text-[11px] text-slate-600">
                      <span className="block font-medium">الحدود: {service.minQuantity} - {service.maxQuantity}</span>
                      <span className="block text-[10px] text-emerald-600 font-bold">{service.speed || 'فوري ⚡'}</span>
                    </div>
                  </div>

                  <Link
                    href={`/new-order?serviceId=${service.id}`}
                    onClick={() => {
                      try {
                        sessionStorage.setItem('services_last_id', service.id);
                      } catch (e) {}
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition transform active:scale-95"
                  >
                    <span>طلب هذه الخدمة الآن</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
