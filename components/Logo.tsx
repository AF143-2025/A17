import Link from 'next/link';
import { Rocket } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  showTagline?: boolean;
}

export default function Logo({ size = 'md', href = '/', showTagline = true }: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'w-7 h-7', text: 'text-xl', badge: 'text-[10px] px-1.5 py-0.5' },
    md: { icon: 'w-9 h-9', text: 'text-2xl', badge: 'text-xs px-2 py-0.5' },
    lg: { icon: 'w-12 h-12', text: 'text-3xl', badge: 'text-sm px-2.5 py-1' },
  }[size];

  const content = (
    <div className="flex items-center gap-3 select-none group">
      <div
        className={`relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 group-hover:scale-110 ${sizeClasses.icon}`}
      >
        <Rocket className="w-1/2 h-1/2 -rotate-45 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-0.5 animate-float-slow" />
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 opacity-30 blur-sm group-hover:opacity-75 transition duration-300 animate-pulse-glow" />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`font-black tracking-tight text-slate-900 font-sans ${sizeClasses.text}`}>
            اصعد
          </span>
          <span
            className={`rounded-md bg-sky-50 border border-sky-200 text-blue-600 font-bold tracking-wider uppercase font-sans ${sizeClasses.badge}`}
          >
            ESAAD
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] text-slate-500 -mt-1 font-medium">
            منصة خدمات النمو الرقمي
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
