import React from 'react';

interface PlatformBrandIconProps {
  slug?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function PlatformBrandIcon({
  slug = '',
  className = '',
  size = 'md',
}: PlatformBrandIconProps) {
  const normSlug = slug.toLowerCase();

  // Dimension helpers
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 sm:w-11 sm:h-11 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5 sm:w-6 sm:h-6',
    lg: 'w-6 h-6 sm:w-7 sm:h-7',
  }[size];

  // 1. INSTAGRAM (Official Gradient + Camera Glyph)
  if (normSlug === 'instagram') {
    return (
      <div
        className={`${sizeClasses} flex items-center justify-center shrink-0 shadow-sm bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] text-white ${className}`}
      >
        <svg
          viewBox="0 0 24 24"
          className={iconSizes}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      </div>
    );
  }

  // 2. TIKTOK (Official Black Background + Cyan/Magenta Note)
  if (normSlug === 'tiktok') {
    return (
      <div
        className={`${sizeClasses} flex items-center justify-center shrink-0 shadow-sm bg-slate-950 text-white ${className}`}
      >
        <svg
          viewBox="0 0 24 24"
          className={iconSizes}
          fill="currentColor"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-.88-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.89-4.47V8.71a8.21 8.21 0 0 0 4.88 1.6V6.86a4.84 4.84 0 0 1-1-.17z" />
        </svg>
      </div>
    );
  }

  // 3. TELEGRAM (Official Telegram Paper Airplane on Brand Blue)
  if (normSlug === 'telegram') {
    return (
      <div
        className={`${sizeClasses} flex items-center justify-center shrink-0 shadow-sm bg-[#229ED9] text-white ${className}`}
      >
        <svg
          viewBox="0 0 24 24"
          className={iconSizes}
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      </div>
    );
  }

  // 4. FACEBOOK (Official Facebook Brand Blue + White f)
  if (normSlug === 'facebook') {
    return (
      <div
        className={`${sizeClasses} flex items-center justify-center shrink-0 shadow-sm bg-[#1877F2] text-white ${className}`}
      >
        <svg
          viewBox="0 0 24 24"
          className={iconSizes}
          fill="currentColor"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </div>
    );
  }

  // 5. YOUTUBE (Official Red Brand + White Play Triangle)
  if (normSlug === 'youtube') {
    return (
      <div
        className={`${sizeClasses} flex items-center justify-center shrink-0 shadow-sm bg-[#FF0000] text-white ${className}`}
      >
        <svg
          viewBox="0 0 24 24"
          className={iconSizes}
          fill="currentColor"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </div>
    );
  }

  // 6. X (TWITTER) (Official Modern Geometric X Logo on Black)
  if (normSlug === 'x' || normSlug === 'twitter') {
    return (
      <div
        className={`${sizeClasses} flex items-center justify-center shrink-0 shadow-sm bg-black text-white ${className}`}
      >
        <svg
          viewBox="0 0 24 24"
          className={iconSizes}
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>
    );
  }

  // Fallback icon for any other platform
  return (
    <div
      className={`${sizeClasses} flex items-center justify-center shrink-0 shadow-sm bg-blue-600 text-white ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={iconSizes}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </div>
  );
}
