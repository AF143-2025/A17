import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'payment' | 'ticket' | 'general';
}

export default function StatusBadge({ status, type = 'order' }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  // Order status configuration
  const orderStyles: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    PENDING: {
      label: 'قيد الانتظار',
      bg: 'bg-amber-500/10 border-amber-500/30',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
    },
    PROCESSING: {
      label: 'قيد التنفيذ',
      bg: 'bg-blue-500/10 border-blue-500/30',
      text: 'text-blue-400',
      dot: 'bg-blue-400 animate-pulse',
    },
    IN_PROGRESS: {
      label: 'جاري العمل',
      bg: 'bg-indigo-500/10 border-indigo-500/30',
      text: 'text-indigo-400',
      dot: 'bg-indigo-400',
    },
    COMPLETED: {
      label: 'مكتمل بنجاح',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
    },
    PARTIAL: {
      label: 'مكتمل جزئياً',
      bg: 'bg-purple-500/10 border-purple-500/30',
      text: 'text-purple-400',
      dot: 'bg-purple-400',
    },
    CANCELED: {
      label: 'ملغي',
      bg: 'bg-rose-50 border-rose-200',
      text: 'text-rose-700',
      dot: 'bg-rose-600',
    },
    REFUNDED: {
      label: 'تم الاسترجاع',
      bg: 'bg-cyan-50 border-cyan-200',
      text: 'text-cyan-700',
      dot: 'bg-cyan-600',
    },
    FAILED: {
      label: 'فشل وتم الاسترجاع',
      bg: 'bg-rose-50 border-rose-200',
      text: 'text-rose-700',
      dot: 'bg-rose-600',
    },
  };

  // Payment status configuration
  const paymentStyles: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    PENDING: {
      label: 'قيد المراجعة',
      bg: 'bg-amber-500/10 border-amber-500/30',
      text: 'text-amber-400',
      dot: 'bg-amber-400 animate-pulse',
    },
    APPROVED: {
      label: 'تم التأكيد والشحن',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
    },
    REJECTED: {
      label: 'مرفوض',
      bg: 'bg-rose-500/10 border-rose-500/30',
      text: 'text-rose-400',
      dot: 'bg-rose-400',
    },
    EXPIRED: {
      label: 'منتهي الصلاحية',
      bg: 'bg-slate-500/10 border-slate-500/30',
      text: 'text-slate-400',
      dot: 'bg-slate-400',
    },
  };

  // Ticket status configuration
  const ticketStyles: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    OPEN: {
      label: 'مفتوحة',
      bg: 'bg-blue-500/10 border-blue-500/30',
      text: 'text-blue-400',
      dot: 'bg-blue-400',
    },
    PENDING: {
      label: 'بانتظار الرد',
      bg: 'bg-amber-500/10 border-amber-500/30',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
    },
    ANSWERED: {
      label: 'تم الرد',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
    },
    CLOSED: {
      label: 'مغلقة',
      bg: 'bg-slate-500/10 border-slate-500/30',
      text: 'text-slate-400',
      dot: 'bg-slate-400',
    },
  };

  let config = orderStyles[normalized];
  if (type === 'payment') config = paymentStyles[normalized] || orderStyles[normalized];
  if (type === 'ticket') config = ticketStyles[normalized] || orderStyles[normalized];

  if (!config) {
    config = {
      label: status,
      bg: 'bg-slate-500/10 border-slate-500/30',
      text: 'text-slate-400',
      dot: 'bg-slate-400',
    };
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
