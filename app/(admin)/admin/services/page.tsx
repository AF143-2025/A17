'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  TrendingUp,
  Search,
  Sparkles,
  FolderPlus,
  AlertTriangle,
  RefreshCw,
  Folder,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';

interface PlatformItem {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  sortOrder: number;
  categories: {
    id: string;
    name: string;
    nameAr: string;
    slug: string;
    sortOrder: number;
    _count?: { services: number };
  }[];
}

interface ProviderItem {
  id: string;
  name: string;
}

interface ServiceRecord {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  minQuantity: number;
  maxQuantity: number;
  pricePer1000: number;
  providerCostPer1000: number;
  providerServiceId?: string;
  speed?: string;
  avgTime?: string;
  notes?: string;
  status: boolean;
  category: {
    id: string;
    nameAr: string;
    platform: {
      id: string;
      nameAr: string;
    };
  };
  provider?: {
    id: string;
    name: string;
  };
}

export default function AdminServicesPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'categories'>('services');
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [platforms, setPlatforms] = useState<PlatformItem[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('ALL');

  // Service Modal (Create/Edit)
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);
  const [serviceForm, setServiceForm] = useState({
    categoryId: '',
    name: '',
    nameAr: '',
    description: '',
    minQuantity: 100,
    maxQuantity: 50000,
    pricePer1000: 2.5,
    providerCostPer1000: 1.0,
    providerId: '',
    providerServiceId: '',
    speed: '10,000 / يوم',
    avgTime: '15 دقيقة',
    notes: '',
  });

  // Delete Service Modal
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [deletingService, setDeletingService] = useState(false);

  // Platform Modal (Create/Edit)
  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<PlatformItem | null>(null);
  const [platformForm, setPlatformForm] = useState({
    name: '',
    nameAr: '',
    slug: '',
    icon: 'Sparkles',
    sortOrder: 0,
  });

  // Category Modal (Create/Edit)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    platformId: '',
    name: '',
    nameAr: '',
    slug: '',
    sortOrder: 0,
  });

  // Delete Platform/Category
  const [deleteItem, setDeleteItem] = useState<{ type: 'PLATFORM' | 'CATEGORY'; id: string; name: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [srvRes, catRes] = await Promise.all([
        fetch('/api/admin/services'),
        fetch('/api/admin/categories'),
      ]);

      if (srvRes.ok) {
        const data = await srvRes.json();
        setServices(data.services || []);
        setProviders(data.providers || []);
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        setPlatforms(catData.platforms || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- SERVICE ACTIONS ---
  const openCreateServiceModal = () => {
    setEditingService(null);
    const defaultCatId =
      platforms.length > 0 && platforms[0].categories.length > 0
        ? platforms[0].categories[0].id
        : '';
    setServiceForm({
      categoryId: defaultCatId,
      name: '',
      nameAr: '',
      description: '',
      minQuantity: 100,
      maxQuantity: 50000,
      pricePer1000: 2.5,
      providerCostPer1000: 1.0,
      providerId: providers.length > 0 ? providers[0].id : '',
      providerServiceId: '',
      speed: '10,000 / يوم',
      avgTime: '15 دقيقة',
      notes: '',
    });
    setServiceModalOpen(true);
  };

  const openEditServiceModal = (s: ServiceRecord) => {
    setEditingService(s);
    setServiceForm({
      categoryId: s.category.id,
      name: s.name,
      nameAr: s.nameAr || '',
      description: s.description,
      minQuantity: s.minQuantity,
      maxQuantity: s.maxQuantity,
      pricePer1000: s.pricePer1000,
      providerCostPer1000: s.providerCostPer1000,
      providerId: s.provider?.id || '',
      providerServiceId: s.providerServiceId || '',
      speed: s.speed || '',
      avgTime: s.avgTime || '',
      notes: s.notes || '',
    });
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionMessage(null);

    try {
      const method = editingService ? 'PUT' : 'POST';
      const body = editingService ? { id: editingService.id, ...serviceForm } : serviceForm;

      const res = await fetch('/api/admin/services', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setServiceModalOpen(false);
        setActionMessage({ type: 'success', text: editingService ? 'تم تحديث الخدمة بنجاح' : 'تمت إضافة الخدمة بنجاح' });
        loadData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'فشل في حفظ الخدمة' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'حدث خطأ في الاتصال بالخادم' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleServiceStatus = async (s: ServiceRecord) => {
    try {
      const res = await fetch(`/api/admin/services?id=${s.id}`, { method: 'DELETE' });
      if (res.ok) {
        setServices((prev) =>
          prev.map((item) => (item.id === s.id ? { ...item, status: !s.status } : item))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDeleteService = async () => {
    if (!deleteServiceId) return;
    setDeletingService(true);
    try {
      const res = await fetch(`/api/admin/services?id=${deleteServiceId}&hard=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setDeleteServiceId(null);
        loadData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'فشل في حذف الخدمة' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'حدث خطأ أثناء الحذف' });
    } finally {
      setDeletingService(false);
    }
  };

  // --- PLATFORM ACTIONS ---
  const openCreatePlatformModal = () => {
    setEditingPlatform(null);
    setPlatformForm({
      name: '',
      nameAr: '',
      slug: '',
      icon: 'Sparkles',
      sortOrder: platforms.length + 1,
    });
    setPlatformModalOpen(true);
  };

  const openEditPlatformModal = (p: PlatformItem) => {
    setEditingPlatform(p);
    setPlatformForm({
      name: p.name,
      nameAr: p.nameAr,
      slug: p.slug,
      icon: p.icon,
      sortOrder: p.sortOrder,
    });
    setPlatformModalOpen(true);
  };

  const handleSavePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingPlatform ? 'PUT' : 'POST';
      const body = editingPlatform
        ? { type: 'PLATFORM', id: editingPlatform.id, ...platformForm }
        : { type: 'PLATFORM', ...platformForm };

      const res = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setPlatformModalOpen(false);
        setActionMessage({ type: 'success', text: 'تم حفظ بيانات المنصة بنجاح' });
        loadData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'فشل الحفظ' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
    } finally {
      setSaving(false);
    }
  };

  // --- CATEGORY ACTIONS ---
  const openCreateCategoryModal = (platformId?: string) => {
    setEditingCategory(null);
    setCategoryForm({
      platformId: platformId || (platforms.length > 0 ? platforms[0].id : ''),
      name: '',
      nameAr: '',
      slug: '',
      sortOrder: 0,
    });
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (c: any, platformId: string) => {
    setEditingCategory(c);
    setCategoryForm({
      platformId,
      name: c.name,
      nameAr: c.nameAr,
      slug: c.slug,
      sortOrder: c.sortOrder,
    });
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const body = editingCategory
        ? { type: 'CATEGORY', id: editingCategory.id, ...categoryForm }
        : { type: 'CATEGORY', ...categoryForm };

      const res = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setCategoryModalOpen(false);
        setActionMessage({ type: 'success', text: 'تم حفظ التصنيف بنجاح' });
        loadData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'فشل الحفظ' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteItem = async () => {
    if (!deleteItem) return;
    setDeletingItem(true);
    try {
      const res = await fetch(
        `/api/admin/categories?type=${deleteItem.type}&id=${deleteItem.id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setDeleteItem(null);
        loadData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'فشل الحذف' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
    } finally {
      setDeletingItem(false);
    }
  };

  // Filtering
  const filteredServices = services.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.nameAr.includes(search) ||
      s.category.platform.nameAr.includes(search);
    const matchPlatform =
      filterPlatform === 'ALL' || s.category.platform.id === filterPlatform;
    return matchSearch && matchPlatform;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-sans flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-400" />
            <span>إدارة الخدمات والتصنيفات والمنصات</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إضافة وتعديل وحذف الخدمات، المنصات، والتصنيفات والربط مع المزودين
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'services'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            دليل الخدمات ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'categories'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            المنصات والتصنيفات ({platforms.length})
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-start gap-3 border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* ================= TAB 1: SERVICES ================= */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2.5 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن اسم الخدمة أو التصنيف..."
                  className="w-full rounded-2xl bg-slate-900 border border-slate-700/80 px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Platform Filter */}
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="rounded-2xl bg-slate-900 border border-slate-700/80 px-3 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none shrink-0"
              >
                <option value="ALL">جميع المنصات</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={openCreateServiceModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-glow hover:opacity-90 transition shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة خدمة جديدة</span>
            </button>
          </div>

          {/* Services Table */}
          <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-card-dark">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-2" />
                <span className="text-xs">جاري تحميل الخدمات...</span>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="p-16 text-center text-slate-500 text-xs">
                لا توجد خدمات مطابقة لخيارات البحث
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">اسم الخدمة</th>
                      <th className="py-3.5 px-4">المنصة / التصنيف</th>
                      <th className="py-3.5 px-4">سعر البيع (1K)</th>
                      <th className="py-3.5 px-4">تكلفة المزود</th>
                      <th className="py-3.5 px-4">صافي الربح</th>
                      <th className="py-3.5 px-4">الحدود</th>
                      <th className="py-3.5 px-4">المزود المرتبط</th>
                      <th className="py-3.5 px-4">الحالة</th>
                      <th className="py-3.5 px-4 text-center">إجراءات المدير</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredServices.map((s) => {
                      const profit = s.pricePer1000 - s.providerCostPer1000;
                      return (
                        <tr key={s.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-3.5 px-4 font-bold text-white max-w-xs">
                            <div>{s.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {s.id.slice(-8)}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            <span className="font-semibold text-slate-300">{s.category.platform.nameAr}</span> › {s.category.nameAr}
                          </td>
                          <td className="py-3.5 px-4 font-sans font-black text-blue-400">
                            ${s.pricePer1000.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 font-sans text-slate-400">
                            ${s.providerCostPer1000.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 font-sans font-bold text-emerald-400">
                            +${profit.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 font-sans text-slate-400 whitespace-nowrap">
                            {s.minQuantity.toLocaleString('en-US')} - {s.maxQuantity.toLocaleString('en-US')}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {s.provider?.name ? (
                              <span className="text-slate-300 font-medium">
                                {s.provider.name} <span className="text-[10px] font-mono text-purple-400">#{s.providerServiceId || '—'}</span>
                              </span>
                            ) : (
                              <span className="text-slate-500">داخلي / يدوي</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleServiceStatus(s)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                                s.status
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                              }`}
                            >
                              {s.status ? 'مفعلة' : 'معطلة'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditServiceModal(s)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-purple-300 transition"
                                title="تعديل الخدمة"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteServiceId(s.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-400 transition"
                                title="حذف الخدمة نهائياً"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: PLATFORMS & CATEGORIES ================= */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">المنصات والتصنيفات المفعلة</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                يمكنك إضافة منصات جديدة (مثل Threads, Kick) وإنشاء تصنيفات تحتها أو حذفها
              </p>
            </div>

            <button
              onClick={openCreatePlatformModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-glow hover:opacity-90 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة منصة جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {platforms.map((p) => (
              <div
                key={p.id}
                className="rounded-3xl glass-panel p-6 border border-slate-800 space-y-4 hover:border-slate-700 transition"
              >
                {/* Platform Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{p.nameAr}</span>
                        <span className="text-xs text-slate-400 font-sans">({p.name})</span>
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">slug: {p.slug}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openCreateCategoryModal(p.id)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold hover:bg-blue-600/30 transition flex items-center gap-1"
                      title="إضافة تصنيف فرعي"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>تصنيف</span>
                    </button>
                    <button
                      onClick={() => openEditPlatformModal(p)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
                      title="تعديل المنصة"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteItem({ type: 'PLATFORM', id: p.id, name: p.nameAr })}
                      className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20 transition"
                      title="حذف المنصة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Categories List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block">التصنيفات التابعة:</span>
                  {p.categories.length === 0 ? (
                    <div className="text-xs text-slate-500 py-3 text-center">لا توجد تصنيفات تحت هذه المنصة</div>
                  ) : (
                    <div className="space-y-1.5">
                      {p.categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300"
                        >
                          <div className="flex items-center gap-2">
                            <Folder className="w-3.5 h-3.5 text-purple-400" />
                            <span className="font-bold text-white">{cat.nameAr}</span>
                            <span className="text-[10px] text-slate-500 font-sans">({cat.name})</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                              {cat._count?.services || 0} خدمة
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditCategoryModal(cat, p.id)}
                              className="p-1 text-slate-400 hover:text-white"
                              title="تعديل التصنيف"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteItem({ type: 'CATEGORY', id: cat.id, name: cat.nameAr })}
                              className="p-1 text-rose-400 hover:text-rose-300"
                              title="حذف التصنيف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT SERVICE ================= */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <span>{editingService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة بالكامل'}</span>
              </h3>
              <button onClick={() => setServiceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  المنصة والتصنيف (Platform & Category)
                </label>
                <select
                  value={serviceForm.categoryId}
                  onChange={(e) => setServiceForm({ ...serviceForm, categoryId: e.target.value })}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                  required
                >
                  {platforms.map((p) => (
                    <optgroup key={p.id} label={p.nameAr}>
                      {p.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {p.nameAr} › {c.nameAr}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  اسم الخدمة (الظاهر للعملاء)
                </label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="مثال: متابعين إنستغرام جودة عالية [ضمان 30 يوم / فوري]"
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    سعر البيع للمستهلك (لكل 1,000 بالدولار $)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceForm.pricePer1000}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, pricePer1000: parseFloat(e.target.value || '0') })
                    }
                    required
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-blue-400 font-bold focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    تكلفة المزود (لكل 1,000 بالدولار $)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceForm.providerCostPer1000}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        providerCostPer1000: parseFloat(e.target.value || '0'),
                      })
                    }
                    required
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-slate-300 font-bold focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الحد الأدنى للكمية (Min)
                  </label>
                  <input
                    type="number"
                    value={serviceForm.minQuantity}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, minQuantity: parseInt(e.target.value || '0', 10) })
                    }
                    required
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الحد الأقصى للكمية (Max)
                  </label>
                  <input
                    type="number"
                    value={serviceForm.maxQuantity}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, maxQuantity: parseInt(e.target.value || '0', 10) })
                    }
                    required
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    المزود المرتبط (Provider)
                  </label>
                  <select
                    value={serviceForm.providerId}
                    onChange={(e) => setServiceForm({ ...serviceForm, providerId: e.target.value })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">تنفيذ يدوي / داخلي</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    رقم الخدمة لدى المزود (Provider Service ID)
                  </label>
                  <input
                    type="text"
                    value={serviceForm.providerServiceId}
                    onChange={(e) => setServiceForm({ ...serviceForm, providerServiceId: e.target.value })}
                    placeholder="مثال: 101 أو 8219"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    سرعة التنفيذ
                  </label>
                  <input
                    type="text"
                    value={serviceForm.speed}
                    onChange={(e) => setServiceForm({ ...serviceForm, speed: e.target.value })}
                    placeholder="10,000 / يوم"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    متوسط وقت البدء
                  </label>
                  <input
                    type="text"
                    value={serviceForm.avgTime}
                    onChange={(e) => setServiceForm({ ...serviceForm, avgTime: e.target.value })}
                    placeholder="فوري (5 دقائق)"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  وصف وملاحظات الخدمة
                </label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 font-semibold text-slate-300 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ الخدمة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE SERVICE CONFIRMATION ================= */}
      {deleteServiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl glass-panel p-6 border border-rose-500/40 bg-rose-950/20 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">تأكيد حذف الخدمة</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف هذه الخدمة نهائياً من قاعدة البيانات؟
              <br />
              <span className="text-[11px] text-slate-400 mt-1 block">
                ملاحظة: إذا كانت الخدمة تحتوي على طلبات سابقة للمستخدمين، سيقوم النظام بتعطيلها تلقائياً لحماية سلامة السجلات المالية.
              </span>
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteServiceId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 font-semibold text-slate-300 hover:text-white text-xs"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteService}
                disabled={deletingService}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition disabled:opacity-50"
              >
                {deletingService ? 'جاري الحذف...' : 'نعم، احذف الخدمة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT PLATFORM ================= */}
      {platformModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl glass-panel p-6 border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingPlatform ? 'تعديل المنصة' : 'إضافة منصة جديدة'}
              </h3>
              <button onClick={() => setPlatformModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlatform} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الاسم بالعربي (مثال: ثريدز)
                </label>
                <input
                  type="text"
                  value={platformForm.nameAr}
                  onChange={(e) => setPlatformForm({ ...platformForm, nameAr: e.target.value })}
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الاسم بالإنجليزي (مثال: Threads)
                </label>
                <input
                  type="text"
                  value={platformForm.name}
                  onChange={(e) => setPlatformForm({ ...platformForm, name: e.target.value })}
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  معرف الرابط (Slug فريد، مثال: threads)
                </label>
                <input
                  type="text"
                  value={platformForm.slug}
                  onChange={(e) => setPlatformForm({ ...platformForm, slug: e.target.value })}
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPlatformModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 font-semibold text-slate-300 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ المنصة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT CATEGORY ================= */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl glass-panel p-6 border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف فرعي جديد'}
              </h3>
              <button onClick={() => setCategoryModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  المنصة التابع لها
                </label>
                <select
                  value={categoryForm.platformId}
                  onChange={(e) => setCategoryForm({ ...categoryForm, platformId: e.target.value })}
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                >
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr} ({p.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  اسم التصنيف بالعربي (مثال: متابعين ثريدز)
                </label>
                <input
                  type="text"
                  value={categoryForm.nameAr}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameAr: e.target.value })}
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  اسم التصنيف بالإنجليزي (مثال: Followers)
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 font-semibold text-slate-300 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ التصنيف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE PLATFORM / CATEGORY ================= */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl glass-panel p-6 border border-rose-500/40 bg-rose-950/20 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">
                تأكيد حذف {deleteItem.type === 'PLATFORM' ? 'المنصة' : 'التصنيف'}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من حذف ({deleteItem.name}) نهائياً؟
              <br />
              <span className="text-[11px] text-slate-400 mt-1 block">
                تنبيه: لا يمكن حذف المنصة أو التصنيف إذا كانت تحتوي على خدمات مسجلة تحتها.
              </span>
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 font-semibold text-slate-300 hover:text-white text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                disabled={deletingItem}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition disabled:opacity-50"
              >
                {deletingItem ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
