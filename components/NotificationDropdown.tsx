'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'POST' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* ========================================================================= */}
      {/* Notification Bell Button (احترافي ومتناسق)                                 */}
      {/* ========================================================================= */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${
          isOpen
            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
            : 'bg-sky-50/80 hover:bg-sky-100 text-slate-700 hover:text-blue-600 border-sky-200/90 shadow-xs'
        }`}
        aria-label="الإشعارات"
        title="الإشعارات"
      >
        <Bell className="w-5 h-5 transition-transform group-hover:scale-105" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ========================================================================= */}
      {/* Dropdown Floating Panel (متناسق مع الهوية السماوية البيضاء ومضبوط للشاشة)   */}
      {/* ========================================================================= */}
      {isOpen && (
        <>
          {/* Mobile backdrop to easily close on tap outside */}
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-2xs z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="fixed top-16 sm:top-full left-3 right-3 sm:left-0 sm:right-auto sm:mt-2.5 sm:w-96 rounded-3xl bg-white border border-sky-100 shadow-2xl shadow-sky-900/15 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top font-sans text-right max-w-full"
            dir="rtl"
          >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">الإشعارات والتنبيهات</span>
              {unreadCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  {unreadCount} جديد
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 transition font-bold"
              >
                <Check className="w-3.5 h-3.5" />
                <span>تحديد الكل كمقروء</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-sky-100 mt-1">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-blue-600 flex items-center justify-center mx-auto border border-sky-100">
                  <Bell className="w-5 h-5 opacity-60" />
                </div>
                <p className="text-xs font-semibold text-slate-500">لا توجد إشعارات جديدة حالياً</p>
                <p className="text-[10px] text-slate-400">ستصلك تنبيهات مسار طلباتك هنا فور تحديثها</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`py-3 px-1 transition rounded-xl ${
                    n.isRead ? 'opacity-70 hover:opacity-100' : 'bg-sky-50/40 px-2'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                      <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {new Date(n.createdAt).toLocaleDateString('ar-EG', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-2 font-bold"
                    >
                      <span>عرض التفاصيل</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
          </div>
        </>
      )}
    </div>
  );
}
