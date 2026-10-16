import React from 'react';

interface PlatformBrandIconProps {
  slug?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * High-end glossy glass reflection & 3D light shimmer overlay (لمعة زجاجية احترافية بدون تبهيت اللون)
 */
function IconGlossOverlay() {
  return (
    <>
      {/* Top Specular Gloss Curved Sheen (لمعة زجاجية علوية مقوسة نقية) */}
      <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/25 via-white/8 to-transparent rounded-t-[inherit] pointer-events-none z-20" />

      {/* 45-degree Diagonal Light Sheen Beam (شعاع اللمعة المائل بنعومة) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/12 to-transparent rounded-[inherit] pointer-events-none z-20" />

      {/* Sparkling Crystal Glint Point of Light (نقطة بريق ولمعة كريستالية نقية) */}
      <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-white/95 shadow-[0_0_3px_#ffffff] pointer-events-none z-20" />

      {/* 3D Crystal Inner Bezel & Depth Shadow (عمق وحافة كريستالية ثلاثية الأبعاد) */}
      <div className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.3)] pointer-events-none z-20" />
    </>
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

  const baseContainer = `${sizeClasses} relative overflow-hidden flex items-center justify-center shrink-0 transition-all duration-300 ${className}`;

  // 1. INSTAGRAM (Deep Rich Sunset Violet/Magenta/Red Gradient + 3D Glass Shine)
  if (normSlug === 'instagram') {
    return (
      <div
        className={`${baseContainer} bg-gradient-to-tr from-[#4c1d95] via-[#be185d] via-[#db2777] to-[#ea580c] text-white shadow-md shadow-pink-900/35`}
      >
        <IconGlossOverlay />
        <svg
          viewBox="0 0 24 24"
          className={`${iconSizes} relative z-10 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.45)]`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="20" x="2" y="2" rx="5.5" ry="5.5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      </div>
    );
  }

  // 2. TIKTOK (Deep Jet Black / Obsidian + Crisp White Glyph)
  if (normSlug === 'tiktok') {
    return (
      <div
        className={`${baseContainer} bg-gradient-to-b from-[#1c1c1e] via-[#0d0d0e] to-[#000000] text-white shadow-md shadow-black/60`}
      >
        <IconGlossOverlay />
        <svg
          viewBox="0 0 24 24"
          className={`${iconSizes} relative z-10 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.6)] text-white`}
          fill="currentColor"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-.88-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.89-4.47V8.71a8.21 8.21 0 0 0 4.88 1.6V6.86a4.84 4.84 0 0 1-1-.17z" />
        </svg>
      </div>
    );
  }

  // 3. TELEGRAM (Deep Rich Electric Sapphire Blue + Crisp Paper Plane)
  if (normSlug === 'telegram') {
    return (
      <div
        className={`${baseContainer} bg-gradient-to-b from-[#0088cc] via-[#006ca3] to-[#004e75] text-white shadow-md shadow-sky-900/40`}
      >
        <IconGlossOverlay />
        <svg
          viewBox="0 0 24 24"
          className={`${iconSizes} relative z-10 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.45)] text-white`}
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      </div>
    );
  }

  // 4. FACEBOOK (Deep Royal Navy Blue + Crisp White 'f')
  if (normSlug === 'facebook') {
    return (
      <div
        className={`${baseContainer} bg-gradient-to-b from-[#1877F2] via-[#0d5ec4] to-[#084298] text-white shadow-md shadow-blue-900/45`}
      >
        <IconGlossOverlay />
        <svg
          viewBox="0 0 24 24"
          className={`${iconSizes} relative z-10 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.45)] text-white`}
          fill="currentColor"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </div>
    );
  }

  // 5. YOUTUBE (Deep Crimson Ruby Red + Glossy White Play Triangle)
  if (normSlug === 'youtube') {
    return (
      <div
        className={`${baseContainer} bg-gradient-to-b from-[#e60000] via-[#cc0000] to-[#8b0000] text-white shadow-md shadow-red-900/45`}
      >
        <IconGlossOverlay />
        <svg
          viewBox="0 0 24 24"
          className={`${iconSizes} relative z-10 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.45)] text-white`}
          fill="currentColor"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </div>
    );
  }

  // 6. X (TWITTER) (Deep Carbon Obsidian Black + Metallic White X)
  if (normSlug === 'x' || normSlug === 'twitter') {
    return (
      <div
        className={`${baseContainer} bg-gradient-to-b from-[#27272a] via-[#18181b] to-[#000000] text-white shadow-md shadow-black/60`}
      >
        <IconGlossOverlay />
        <svg
          viewBox="0 0 24 24"
          className={`${iconSizes} relative z-10 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.6)] text-white`}
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>
    );
  }

  // 7. SNAPCHAT (Deep Rich Golden Amber Yellow + High-Contrast Black Ghost)
  if (normSlug === 'snapchat') {
    return (
      <div
        className={`${baseContainer} bg-gradient-to-b from-[#FFB800] via-[#FFA000] to-[#E68A00] text-black shadow-md shadow-amber-600/35`}
      >
        <IconGlossOverlay />
        <svg
          viewBox="0 0 24 24"
          className={`${iconSizes} relative z-10 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] text-slate-950`}
          fill="currentColor"
        >
          <path d="M12.001 2c-3.528 0-6.19 2.518-6.19 5.864 0 1.054.27 2.016.793 2.793-.153.284-.46.541-.852.709-.434.185-.97.23-1.393.23-.23 0-.377.108-.396.28-.02.185.088.35.265.405.807.25 1.547.886 1.95 1.706.077.156.126.326.155.502-.857.247-1.874.836-1.874 1.952 0 .584.34.996.848 1.124.58.146 1.343.02 2.144-.343.342.923 1.135 1.488 2.235 1.583.473.04.994.025 1.52-.08.384.457 1.05.845 1.84.845.79 0 1.455-.388 1.839-.845.526.105 1.047.12 1.52.08 1.1-.095 1.893-.66 2.235-1.583.8.363 1.564.489 2.144.343.508-.128.848-.54.848-1.124 0-1.116-1.017-1.705-1.874-1.952.029-.176.078-.346.155-.502.403-.82 1.143-1.456 1.95-1.706.177-.055.285-.22.265-.405-.019-.172-.166-.28-.396-.28-.423 0-.96-.045-1.393-.23-.392-.168-.699-.425-.852-.709.523-.777.793-1.739.793-2.793C18.19 4.518 15.529 2 12.001 2z" />
        </svg>
      </div>
    );
  }

  // 8. WHATSAPP (Deep Rich Emerald Forest Green + Phone Glyph)
  if (normSlug === 'whatsapp') {
    return (
      <div
        className={`${baseContainer} bg-gradient-to-b from-[#16a34a] via-[#15803d] to-[#065f46] text-white shadow-md shadow-emerald-900/45`}
      >
        <IconGlossOverlay />
        <svg
          viewBox="0 0 24 24"
          className={`${iconSizes} relative z-10 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.45)] text-white`}
          fill="currentColor"
        >
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 17.8c-1.49 0-2.94-.4-4.22-1.16l-.3-.18-3.13.82.83-3.05-.2-.31a7.89 7.89 0 0 1-1.22-4.22c0-4.4 3.58-7.98 7.98-7.98 2.13 0 4.14.83 5.65 2.34a7.93 7.93 0 0 1 2.34 5.64c0 4.4-3.58 7.98-7.98 7.98z" />
        </svg>
      </div>
    );
  }

  // 9. FALLBACK / GENERAL PLATFORMS (Deep Royal Cobalt Blue 3D Glass)
  return (
    <div
      className={`${baseContainer} bg-gradient-to-b from-[#2563eb] via-[#1d4ed8] to-[#1e3a8a] text-white shadow-md shadow-blue-900/40`}
    >
      <IconGlossOverlay />
      <svg
        viewBox="0 0 24 24"
        className={`${iconSizes} relative z-10 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.45)] text-white`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </div>
  );
}
