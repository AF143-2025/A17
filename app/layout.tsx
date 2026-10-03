import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#F0F8FF',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://esaad.social'),
  title: 'خدمات سوشيال ميديا سريعة وموثوقة',
  description: 'عزّز حضورك على منصات التواصل الاجتماعي مع خدمات احترافية، أسعار تنافسية، وتنفيذ سريع.',
  keywords: 'خدمات تواصل اجتماعي, زيادة متابعين إنستغرام, تيك توك, يوتيوب, فيسبوك, تيليجرام, تسويق رقمي, SMM, اصعد',
  alternates: {
    canonical: 'https://esaad.social',
  },
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'خدمات سوشيال ميديا سريعة وموثوقة',
    description: 'عزّز حضورك على منصات التواصل الاجتماعي مع خدمات احترافية، أسعار تنافسية، وتنفيذ سريع.',
    url: 'https://esaad.social',
    type: 'website',
    locale: 'ar_AR',
    siteName: 'خدمات سوشيال ميديا سريعة وموثوقة',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'خدمات سوشيال ميديا سريعة وموثوقة',
    description: 'عزّز حضورك على منصات التواصل الاجتماعي مع خدمات احترافية، أسعار تنافسية، وتنفيذ سريع.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if('scrollRestoration' in history){history.scrollRestoration='manual';}if(window.location.hash){history.replaceState(null,'',window.location.pathname+window.location.search);}window.scrollTo(0,0);document.documentElement.scrollTop=0;window.addEventListener('DOMContentLoaded',function(){window.scrollTo(0,0);document.documentElement.scrollTop=0;});window.addEventListener('pageshow',function(){window.scrollTo(0,0);document.documentElement.scrollTop=0;});}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#F0F8FF] text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
