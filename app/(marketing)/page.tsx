import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Logo from '@/components/Logo';
import HeroAnimatedLogo from '@/components/HeroAnimatedLogo';
import FaqAccordion from '@/components/FaqAccordion';
import ScrollToServicesButton from '@/components/ScrollToServicesButton';
import {
  Zap,
  ShieldCheck,
  Headphones,
  TrendingUp,
  Cpu,
  Coins,
  Instagram,
  Video,
  Youtube,
  Facebook,
  Send,
  Twitter,
  ChevronDown,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Tag,
  Gift,
  Flame,
  Check,
} from 'lucide-react';

export default function LandingPage() {

  const features = [
    {
      icon: Zap,
      title: 'سرعة التنفيذ الفائقة',
      description: 'تبدأ معالجة طلباتك خلال ثوانٍ معدودة بفضل محرك الربط الآلي الفوري مع أقوى شبكات التزويد العالمية.',
      color: 'from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-200',
    },
    {
      icon: Coins,
      title: 'أسعار تنافسية ($)',
      description: 'نقدم أفضل وأرخص الأسعار العالمية المباشرة ($) بدون أي عمولات خفية وبأعلى مستويات الجودة.',
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200',
    },
    {
      icon: TrendingUp,
      title: 'متابعة حية لمسار الطلبات',
      description: 'نظام تتبع ذكي يوضح لك بالتفصيل مسار تنفيذ طلبك خطوة بخطوة من لحظة الإنشاء حتى الاكتمال.',
      color: 'from-blue-500/10 to-cyan-500/10 text-blue-600 border-blue-200',
    },
    {
      icon: Headphones,
      title: 'دعم فني مباشر ومخصص',
      description: 'فريق دعم فني متخصص جاهز لمساعدتك عبر نظام التذاكر المباشر على مدار الساعة لضمان رضاك التام.',
      color: 'from-purple-500/10 to-pink-500/10 text-purple-600 border-purple-200',
    },
    {
      icon: Sparkles,
      title: 'نظام شفاف وتقارير دقيقة',
      description: 'لوحة تحكم توفر لك تتبعاً فورياً لكل طلب خطوة بخطوة مع وضوح تام في تفاصيل الرصيد والكميات.',
      color: 'from-indigo-500/10 to-violet-500/10 text-indigo-600 border-indigo-200',
    },
    {
      icon: ShieldCheck,
      title: 'نظام آمن ومحمي بالكامل',
      description: 'لا نطلب كلمات مرور حساباتك نهائياً، مع حماية متقدمة لمعاملات المحفظة وسجل مالي غير قابل للتلاعب.',
      color: 'from-cyan-500/10 to-emerald-500/10 text-cyan-600 border-cyan-200',
    },
  ];

  const servicesList = [
    {
      name: 'Instagram',
      title: 'خدمات إنستغرام',
      icon: Instagram,
      color: 'text-pink-600 bg-pink-50 border-pink-200',
      badge: 'فوري ⚡',
      features: ['متابعين حقيقيين مع ضمان', 'لايكات فورية للمنشورات', 'مشاهدات ريلز واكسبلور', 'تعليقات وحفظ تفاعلي'],
      href: '/new-order?platform=instagram',
    },
    {
      name: 'TikTok',
      title: 'خدمات تيك توك',
      icon: Video,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      badge: 'عالي السرعة 🚀',
      features: ['متابعين لفتح البث المباشر', 'مشاهدات فيديو بالملايين', 'إعجابات وتفضيلات سريعة', 'مشاركات وإكسبلور نشط'],
      href: '/new-order?platform=tiktok',
    },
    {
      name: 'YouTube',
      title: 'خدمات يوتيوب',
      icon: Youtube,
      color: 'text-red-600 bg-red-50 border-red-200',
      badge: 'ثابت ومضمون 🛡️',
      features: ['مشتركين ثابتين بدون نقص', 'ساعات مشاهدة لتحقيق شروط الربح', 'إعجابات وتفاعل الفيديوهات', 'مشاهدات شورتس سريعة'],
      href: '/new-order?platform=youtube',
    },
    {
      name: 'Facebook',
      title: 'خدمات فيسبوك',
      icon: Facebook,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      badge: 'نشط 👥',
      features: ['متابعين صفحات وحسابات شخصية', 'إعجابات وتفاعلات للمنشورات', 'مشاهدات فيديو وبث مباشر', 'أعضاء وتفاعل للمجموعات'],
      href: '/new-order?platform=facebook',
    },
    {
      name: 'Telegram',
      title: 'خدمات تيليجرام',
      icon: Send,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      badge: 'فوري ✈️',
      features: ['أعضاء قنوات ومجموعات نشطة', 'مشاهدات سريعة للمنشورات', 'تفاعلات إيموجي على الرسائل', 'تصويت استطلاعات الرأي'],
      href: '/new-order?platform=telegram',
    },
    {
      name: 'X',
      title: 'خدمات منصة إكس (تويتر)',
      icon: Twitter,
      color: 'text-slate-800 bg-slate-100 border-slate-200',
      badge: 'موثوق 🌟',
      features: ['متابعين لحسابات شخصية وتجارية', 'إعادة تغريد (Retweets) سريعة', 'إعجابات وتفاعل للتغريدات', 'مشاهدات فيديو وتغريدات'],
      href: '/new-order?platform=x',
    },
  ];

  const steps = [
    { num: '01', title: 'أنشئ حسابك مجاناً', desc: 'سجل في أقل من دقيقة باسم مستخدم وبريد إلكتروني فقط.' },
    { num: '02', title: 'اشحن رصيد المحفظة', desc: 'استخدم وسائل الدفع الرقمية الآمنة، البطاقات الإلكترونية أو التحويل الفوري.' },
    { num: '03', title: 'اختر الخدمة المناسبة', desc: 'تصفح باقة واسعة من خدمات النمو لأهم منصات التواصل.' },
    { num: '04', title: 'أدخل الرابط والكمية', desc: 'ضع رابط حسابك أو منشورك والكمية المطلوبة وسيحسب السعر آلياً.' },
    { num: '05', title: 'أرسل الطلب فوراً', desc: 'اضغط تأكيد وسيتم البدء في التنفيذ خلال لحظات.' },
    { num: '06', title: 'تابع مسار الإنجاز', desc: 'راقب حالة الطلب ونسب الاكتمال مباشرة من لوحة التحكم.' },
  ];

  const faqs = [
    {
      q: 'هل أحتاج إلى تقديم كلمة مرور حسابي للاستفادة من الخدمات؟',
      a: 'كلا على الإطلاق! منصة اصعد لا تطلب كلمة مرور حسابك نهائياً تحت أي ظرف. كل ما تحتاجه هو رابط الحساب العام أو رابط المنشور فقط.',
    },
    {
      q: 'ما هي طرق الدفع المتاحة لشحن الرصيد؟',
      a: 'ندعم خيارات دفع متعددة ومحلية وعالمية تشمل زين كاش، فاست باي، FIB، التحويلات البنكية، وUSDT. يتم شحن الرصيد مباشرة وفورياً ($) عبر التواصل مع حساب الدعم المالي المعتمد على تيليجرام: @Hexc8re.',
    },
    {
      q: 'كم يستغرق بدء تنفيذ الطلب بعد إرساله؟',
      a: 'معظم الخدمات تبدأ تلقائياً وبشكل فوري خلال 5 إلى 15 دقيقة من إرسال الطلب. تختلف السرعة الإجمالية باختلاف نوع الخدمة والكمية المطلوبة وتفاصيل كل باقة.',
    },
    {
      q: 'ماذا يحدث إذا تم إلغاء الطلب أو لم يكتمل بالكامل؟',
      a: 'نظام اصعد مزود بآلية استرجاع ذكية وتلقائية (Automatic Refund). إذا أُلغي الطلب أو تم تنفيذ جزء منه، يُعاد المبلغ المتبقي فوراً إلى رصيد محفظتك مع توثيقه في سجل المعاملات.',
    },
    {
      q: 'كيف يتم احتساب تكلفة الطلب في المنصة؟',
      a: 'تُحسب التكلفة تلقائياً وبدقة بناءً على الكمية المحددة وسعر الخدمة لكل 1000 وحدة ($) بدون أي عمولات خفية، مع توضيح الرصيد المتبقي قبل تأكيد الطلب.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F0F8FF] text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Fixed Header */}
      <Navbar />

      {/* Hero Section */}
      <section id="hero" className="relative pt-24 pb-16 md:pt-28 md:pb-20 lg:pt-24 lg:pb-16 overflow-hidden">
        {/* Background ambient glow effects */}
        <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
          
          {/* Animated Hero Emblem / Logo */}
          <HeroAnimatedLogo />

          {/* Main Title */}
          <div className="max-w-4xl mx-auto mt-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight font-sans">
              <span className="block text-slate-900 mb-2 text-5xl sm:text-7xl lg:text-8xl tracking-normal">
                اصعد
              </span>
              <span className="gradient-text drop-shadow-[0_0_25px_rgba(59,130,246,0.25)]">
                منصة خدمات النمو الرقمي
              </span>
            </h1>
          </div>

          {/* Value Proposition Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-700 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-sky-100 text-slate-800 shadow-sm backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>بدء فوري خلال دقائق</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-sky-100 text-slate-800 shadow-sm backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>جودة عالية وضمان تعويض</span>
            </span>
          </div>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            وجهتك الأولى لتعزيز حضورك وتوسيع انتشار حساباتك بأعلى معايير الجودة وبأفضل الأسعار التنافسية ($).
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition transform active:scale-95"
            >
              <span>ابدأ الآن مجاناً</span>
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <ScrollToServicesButton />
          </div>

          {/* Platform Capability Highlights */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto">
            {[
              { label: 'سرعة التنفيذ', val: 'فوري وآلي' },
              { label: 'تتبع الطلبات', val: 'متابعة حية' },
              { label: 'تغطية المنصات', val: 'شاملة ومتنوعة' },
              { label: 'الدفع المعتمد', val: 'معتمد ($ / USD)' },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white border border-sky-100 text-center shadow-sm hover:border-blue-400 hover:shadow-md transition duration-300">
                <div className="text-lg sm:text-xl font-black text-slate-900 font-sans">{stat.val}</div>
                <div className="text-xs text-slate-500 mt-1 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why ESAAD (Features) Section */}
      <section id="features" className="py-20 bg-[#EAF4FC]/70 border-y border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
              المزايا الاستثنائية
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              لماذا يختار المحترفون منصة اصعد؟
            </h3>
            <p className="mt-4 text-sm sm:text-base text-slate-600">
              صممنا النظام بأحدث التقنيات ليوفر للمستخدم تجربة فريدة تجمع بين السرعة الفائقة والأمان المالي التام.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-sky-100 p-6 hover:border-blue-300 transition duration-300 group hover:-translate-y-1 shadow-sm hover:shadow-md"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border bg-gradient-to-br ${item.color} mb-5 group-hover:scale-110 transition duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services-catalog" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
              حلول نمو متكاملة
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              الخدمات المتاحة
            </h3>
            <p className="mt-4 text-slate-600 text-sm sm:text-base">
              خدمات نمو حقيقية ومضمونة لكافة قنواتك الرقمية مع سرعة تنفيذ فائقة وأسعار تنافسية ($).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesList.map((service, i) => {
              const Icon = service.icon;
              return (
                <div
                  key={i}
                  className="rounded-3xl bg-white p-6 border border-sky-100 flex flex-col justify-between hover:border-blue-300 hover:-translate-y-1 transition duration-300 shadow-sm hover:shadow-lg group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-2xl border ${service.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-bold">
                        {service.badge}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 mb-2">{service.title}</h4>

                    <div className="space-y-2 my-4 pt-2 border-t border-sky-100">
                      {service.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-600">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-sky-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>جودة مضمونة</span>
                    </div>
                    <Link
                      href={service.href}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-100 transition group-hover:scale-105"
                    >
                      <span>طلب الخدمة</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-[#EAF4FC]/70 border-y border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
              البساطة والسرعة
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              كيف تعمل المنصة؟
            </h3>
            <p className="mt-4 text-slate-600 text-sm sm:text-base">
              6 خطوات سلسة تفصلك عن تعزيز حضورك والوصول إلى جمهورك المستهدف.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <div key={idx} className="relative rounded-2xl bg-white p-6 border border-sky-100 shadow-sm">
                <div className="text-3xl font-black text-blue-500/25 font-sans mb-3">
                  {step.num}
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">{step.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
              كل ما تود معرفته
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              الأسئلة الشائعة
            </h3>
          </div>

          <FaqAccordion faqs={faqs} />
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl shadow-blue-500/20 text-white">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h3 className="text-3xl sm:text-4xl font-black text-white">
                جاهز للانطلاق نحو القمة؟
              </h3>
              <p className="mt-4 text-sm sm:text-base text-blue-100 leading-relaxed">
                انضم الآن إلى آلاف المستخدمين والمتاجر وصناع المحتوى الذين يعتمدون على منصة اصعد يومياً لتنمية أعمالهم.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-base font-bold text-blue-700 shadow-lg hover:bg-blue-50 transition transform active:scale-95"
                >
                  <span>إنشاء حساب مجاني</span>
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 border border-white/30 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/25 transition"
                >
                  <span>تسجيل الدخول</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-sky-100 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="md" />

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
              <Link href="/services" className="hover:text-blue-600 transition font-medium">دليل الخدمات</Link>
              <Link href="/support" className="hover:text-blue-600 transition font-medium">الدعم الفني</Link>
              <Link href="/login" className="hover:text-blue-600 transition font-medium">تسجيل الدخول</Link>
              <Link href="/register" className="hover:text-blue-600 transition font-medium">إنشاء حساب</Link>
            </div>

            <div className="text-xs text-slate-400 text-center md:text-left font-sans">
              © {new Date().getFullYear()} اصعد (ESAAD). جميع الحقوق محفوظة.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
