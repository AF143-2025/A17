import React from 'react';

interface PlatformBrandIconProps {
  slug?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

function GlossyIconShell({
  sizeClasses,
  bgClass,
  shadowClass,
  children,
  className = '',
}: {
  sizeClasses: string;
  bgClass: string;
  shadowClass: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative ${sizeClasses} flex items-center justify-center shrink-0 overflow-hidden ${bgClass} ${shadowClass} text-white border-t border-l border-white/45 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.75),inset_0_-2px_3px_rgba(0,0,0,0.25)] transition-all duration-300 group-hover:scale-105 select-none ${className}`}
    >
      {/* 1. Curved Glass Specular Highlight (لمعة الانعكاس الزجاجي العلوي) */}
      <div className="absolute inset-x-0 top-0 h-[52%] bg-gradient-to-b from-white/50 via-white/18 to-transparent rounded-t-[inherit] pointer-events-none" />

      {/* 2. Top-Right Radial Lens Flare (بؤرة الضوء اللامعة) */}
      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white/40 blur-[1.5px] pointer-events-none" />

      {/* 3. Diagonal Glossy Shimmer Beam (شريط البريق واللمعان) */}
      <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-25 pointer-events-none" />

      {/* 4. Crisp Foreground Icon with 3D drop shadow */}
      <div className="relative z-10 drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.4)] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
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

  // 1. INSTAGRAM (Vibrant 5-Stop Gradient + Glossy Camera Glyph)
  if (normSlug === 'instagram') {
    return (
      <GlossyIconShell
        sizeClasses={sizeClasses}
        bgClass="bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]"
        shadowClass="shadow-lg shadow-pink-500/30"
        className={className}
      >
        <svg
          viewBox="0 0 24 24"
          className={iconSizes}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      </GlossyIconShell>
    );
  }

  // 2. TIKTOK (Deep Satin Black + Authentic 3D Holographic Note)
  if (normSlug === 'tiktok') {
    return (
      <GlossyIconShell
        sizeClasses={sizeClasses}
        bgClass="bg-gradient-to-b from-slate-900 to-black"
        shadowClass="shadow-lg shadow-cyan-500/25 shadow-pink-500/20"
        className={className}
      >
        <div className="relative flex items-center justify-center">
          {/* Cyan 3D Layer (Shifted Top-Left) */}
          <svg
            viewBox="0 0 24 24"
            className={`${iconSizes} absolute -translate-x-[1px] -translate-y-[1px] opacity-90`}
            fill="#00f2fe"
          >
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-.88-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.89-4.47V8.71a8.21 8.21 0 0 0 4.88 1.6V6.86a4.84 4.84 0 0 1-1-.17z" />
          </svg>
          {/* Magenta 3D Layer (Shifted Bottom-Right) */}
          <svg
            viewBox="0 0 24 24"
            className={`${iconSizes} absolute translate-x-[1px] translate-y-[1px] opacity-90`}
            fill="#fe2c55"
          >
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-.88-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.89-4.47V8.71a8.21 8.21 0 0 0 4.88 1.6V6.86a4.84 4.84 0 0 1-1-.17z" />
          </svg>
          {/* White Main Note on Top */}
          <svg
            viewBox="0 0 24 24"
            className={`${iconSizes} relative z-10`}
            fill="#FFFFFF"
          >
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-.88-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.89-4.47V8.71a8.21 8.21 0 0 0 4.88 1.6V6.86a4.84 4.84 0 0 1-1-.17z" />
          </svg>
        </div>
      </GlossyIconShell>
    );
  }

  // 3. TELEGRAM (Sky Gradient + Glossy Paper Airplane)
  if (normSlug === 'telegram') {
    return (
      <GlossyIconShell
        sizeClasses={sizeClasses}
        bgClass="bg-gradient-to-tr from-[#1d98d6] via-[#229ED9] to-[#3db4f0]"
        shadowClass="shadow-lg shadow-sky-400/35"
        className={className}
      >
        <svg
          viewBox="0 0 24 24"
          className={iconSizes}
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      </GlossyIconShell>
    );
  }

  // 4. FACEBOOK (Royal Brand Blue + Glossy 'f')
  if (normSlug === 'facebook') {
    return (
      <GlossyIconShell
        sizeClasses={sizeClasses}
        bgClass="bg-gradient-to-tr from-[#0a5cd8] via-[#1877F2] to-[#3a8efc]"
        shadowClass="shadow-lg shadow-blue-500/35"
        className={className}
      >
        <svg
          viewBox="0 0 24 24"
          className={iconSizes}
          fill="currentColor"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </GlossyIconShell>
    );
  }

  // 5. YOUTUBE (Rich Cherry Red + Glossy White Play Triangle)
  if (normSlug === 'youtube') {
    return (
      <GlossyIconShell
        sizeClasses={sizeClasses}
        bgClass="bg-gradient-to-tr from-[#cc0000] via-[#FF0000] to-[#ff3b3b]"
        shadowClass="shadow-lg shadow-red-500/35"
        className={className}
      >
        <svg
          viewBox="0 0 24 24"
          className={iconSizes}
          fill="currentColor"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </GlossyIconShell>
    );
  }

  // 6. X / TWITTER (Piano Black + Glossy Modern Geometric X)
  if (normSlug === 'x' || normSlug === 'twitter') {
    return (
      <GlossyIconShell
        sizeClasses={sizeClasses}
        bgClass="bg-gradient-to-b from-neutral-800 via-neutral-950 to-black"
        shadowClass="shadow-lg shadow-neutral-900/40"
        className={className}
      >
        <svg
          viewBox="0 0 24 24"
          className={iconSizes}
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </GlossyIconShell>
    );
  }

  // 7. SNAPCHAT (Canary Yellow + Ghost)
  if (normSlug === 'snapchat') {
    return (
      <GlossyIconShell
        sizeClasses={sizeClasses}
        bgClass="bg-gradient-to-tr from-[#ffe600] via-[#FFFC00] to-[#fffda0]"
        shadowClass="shadow-lg shadow-amber-300/40"
        className={className}
      >
        <svg
          viewBox="0 0 24 24"
          className={iconSizes}
          fill="#000000"
        >
          <path d="M12.16 2.08c-3.79 0-5.83 2.68-5.83 5.43 0 .97.35 2.12.79 2.92.14.26.17.43.08.6-.1.19-.38.31-.69.41-.65.2-1.39.43-1.44 1.05-.05.6.5.94 1.05 1.15.53.2 1.1.27 1.48.51.34.22.38.54.21.91-.32.69-.97 1.63-2.07 2.05-.4.15-.59.39-.55.66.05.37.52.55 1.05.65 1.05.2 2.37.1 3.23.63.46.28.69.75 1.13.88.51.15 1.09-.16 1.6-.33.6-.2 1.25-.33 1.89-.33.64 0 1.29.13 1.89.33.51.17 1.09.48 1.6.33.44-.13.67-.6 1.13-.88.86-.53 2.18-.43 3.23-.63.53-.1 1-.28 1.05-.65.04-.27-.15-.51-.55-.66-1.1-.42-1.75-1.36-2.07-2.05-.17-.37-.13-.69.21-.91.38-.24.95-.31 1.48-.51.55-.21 1.1-.55 1.05-1.15-.05-.62-.79-.85-1.44-1.05-.31-.1-.59-.22-.69-.41-.09-.17-.06-.34.08-.6.44-.8.79-1.95.79-2.92 0-2.75-2.04-5.43-5.83-5.43z" />
        </svg>
      </GlossyIconShell>
    );
  }

  // Fallback icon for any other platform (Electric Blue Sheen + Star/Spark)
  return (
    <GlossyIconShell
      sizeClasses={sizeClasses}
      bgClass="bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500"
      shadowClass="shadow-lg shadow-blue-500/35"
      className={className}
    >
      <svg
        viewBox="0 0 24 24"
        className={iconSizes}
        fill="currentColor"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </GlossyIconShell>
  );
}
