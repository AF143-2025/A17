'use client';

import React from 'react';
import { Link2, AtSign } from 'lucide-react';

interface ServiceInputProps {
  targetUrl: string;
  onChange: (val: string) => void;
  label: string;
  placeholder: string;
  isUser?: boolean;
  error?: string;
}

export default function ServiceInput({
  targetUrl,
  onChange,
  label,
  placeholder,
  isUser = false,
  error,
}: ServiceInputProps) {
  return (
    <div className="rounded-3xl bg-white p-4 sm:p-5 border border-sky-100 shadow-xs space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
        <span className="w-2 h-2 rounded-full bg-blue-600" />
        <span>{label}</span>
      </div>

      <div className="relative">
        <input
          type="text"
          dir="ltr"
          value={targetUrl}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className={`w-full h-12 pr-4 pl-11 rounded-2xl bg-sky-50/30 border ${
            error ? 'border-rose-400 focus:border-rose-500' : 'border-sky-200 focus:border-blue-500'
          } focus:ring-4 focus:ring-blue-500/10 text-xs sm:text-sm text-slate-900 font-mono shadow-xs outline-hidden transition placeholder:text-slate-400`}
        />
        {isUser ? (
          <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        ) : (
          <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        )}
      </div>

      {error && (
        <p className="text-[11px] font-bold text-rose-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
