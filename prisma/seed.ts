import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ESAAD (اصعد) database for Clean Production...');

  // 1. Clean existing records
  await prisma.auditLog.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.apiUsage.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.orderEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.serviceProvider.deleteMany();
  await prisma.providerService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.platform.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.syncLog.deleteMany();
  await prisma.setting.deleteMany();

  // 2. Settings (All in USD)
  await prisma.setting.createMany({
    data: [
      { key: 'site_name', value: 'اصعد | ESAAD', description: 'اسم المنصة' },
      { key: 'site_tagline', value: 'منصة خدمات النمو الرقمي', description: 'شعار المنصة' },
      { key: 'currency', value: 'USD', description: 'العملة الأساسية' },
      { key: 'currency_symbol', value: '$', description: 'رمز العملة' },
      { key: 'maintenance_mode', value: 'false', description: 'وضع الصيانة' },
      { key: 'announcement', value: 'أهلاً بكم في منصة اصعد! تم تفعيل الربط التلقائي بمزودي SMM والتنفيذ الفوري بالدولار ($).', description: 'شريط الإعلانات' },
    ],
  });

  // 3. Admin User (All wallets in USD)
  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@esaad.iq',
      phone: '07801234567',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      wallet: {
        create: {
          balance: 0.0,
          currency: 'USD',
        },
      },
    },
  });

  // 4. Payment Methods (Production USD Limits)
  await prisma.paymentMethod.createMany({
    data: [
      {
        name: 'زين كاش (Zain Cash)',
        code: 'zain_cash',
        instructions: 'قم بتحويل المبلغ المعادل بالدينار العراقي إلى رقم محفظة زين كاش ثم أدخل الرقم المرجعي للتحويل.',
        accountDetails: '07801122334',
        minDeposit: 5.0,
        maxDeposit: 5000.0,
        feePercentage: 0.0,
        status: true,
      },
      {
        name: 'فاست باي (FastPay)',
        code: 'fastpay',
        instructions: 'قم بإرسال المبلغ لحساب فاست باي مع كتابة اسم المستخدم في الملاحظات.',
        accountDetails: '07509988776',
        minDeposit: 5.0,
        maxDeposit: 5000.0,
        feePercentage: 0.0,
        status: true,
      },
      {
        name: 'مصرف العراق الأول (FIB Bank)',
        code: 'fib',
        instructions: 'تحويل مباشر عبر تطبيق FIB إلى رقم الحساب الآتي مع إرفاق رقم العملية.',
        accountDetails: 'FIB-8829102938',
        minDeposit: 5.0,
        maxDeposit: 10000.0,
        feePercentage: 0.0,
        status: true,
      },
      {
        name: 'كي كارد وماستركارد (Qi Card / Visa)',
        code: 'qi_card',
        instructions: 'الدفع الإلكتروني المباشر عبر بطاقات فيزا وماستركارد وكي كارد الرافدين والرشيد.',
        accountDetails: 'بوابة الدفع الإلكتروني المعتمدة',
        minDeposit: 5.0,
        maxDeposit: 5000.0,
        feePercentage: 1.0,
        status: true,
      },
      {
        name: 'USDT (TRC20 / Crypto)',
        code: 'usdt',
        instructions: 'قم بتحويل المبلغ بالـ USDT عبر شبكة TRC20 إلى عنوان المحفظة أدناه ثم أدخل هاش المعاملة (TXID).',
        accountDetails: 'TJ7aX3uEsaadOfficialTRC20WalletAddress',
        minDeposit: 10.0,
        maxDeposit: 10000.0,
        feePercentage: 0.0,
        status: true,
      },
    ],
  });

  // 5. Pricing Rules
  await prisma.pricingRule.createMany({
    data: [
      {
        name: 'هامش الربح العام الافتراضي',
        scope: 'GLOBAL',
        markupType: 'PERCENTAGE',
        markupValue: 50.0, // +50%
        priority: 0,
        status: true,
      },
    ],
  });

  // 6. Platforms, Categories & Clean Initial Services
  // Instagram
  const ig = await prisma.platform.create({
    data: {
      name: 'Instagram',
      nameAr: 'إنستغرام',
      slug: 'instagram',
      icon: 'Instagram',
      sortOrder: 1,
    },
  });

  const igFollowers = await prisma.category.create({
    data: {
      platformId: ig.id,
      name: 'Followers',
      nameAr: 'متابعين إنستغرام',
      slug: 'instagram-followers',
      sortOrder: 1,
    },
  });

  const igLikes = await prisma.category.create({
    data: {
      platformId: ig.id,
      name: 'Likes',
      nameAr: 'لايكات إنستغرام',
      slug: 'instagram-likes',
      sortOrder: 2,
    },
  });

  const igViews = await prisma.category.create({
    data: {
      platformId: ig.id,
      name: 'Views',
      nameAr: 'مشاهدات ريلز وفيديو',
      slug: 'instagram-views',
      sortOrder: 3,
    },
  });

  await prisma.service.create({
    data: {
      categoryId: igFollowers.id,
      name: 'Instagram Followers — High Quality [ضمان عدم نزول / فوري]',
      nameAr: 'متابعين إنستغرام جودة عالية [ضمان 30 يوم / فوري]',
      description: 'متابعين إنستغرام بحسابات حقيقية ونشطة مع ضمان تعويض لمدة 30 يوماً في حال حدوث أي نقص.',
      minQuantity: 100,
      maxQuantity: 50000,
      pricePer1000: 2.80,
      providerCostPer1000: 0.0,
      speed: '10,000 - 30,000 / يوم',
      avgTime: '15 دقيقة',
      notes: 'تأكد من أن الحساب عام (Public) وليس خاص (Private) قبل الطلب.',
      sortOrder: 1,
    },
  });

  await prisma.service.create({
    data: {
      categoryId: igFollowers.id,
      name: 'Instagram Followers — Iraqi & Arab Real Users [عرب حقيقيين]',
      nameAr: 'متابعين إنستغرام عراقيين وعرب حقيقيين',
      description: 'متابعين عرب وعراقيين متفاعلين لحسابات الأفراد والأنشطة التجارية والمتاجر.',
      minQuantity: 100,
      maxQuantity: 20000,
      pricePer1000: 5.50,
      providerCostPer1000: 0.0,
      speed: '5,000 / يوم',
      avgTime: 'ساعة واحدة',
      notes: 'حسابات عربية حقيقية.',
      sortOrder: 2,
    },
  });

  await prisma.service.create({
    data: {
      categoryId: igLikes.id,
      name: 'Instagram Likes — Real Active Users [سريع جداً]',
      nameAr: 'إعجابات إنستغرام حقيقية فائقة السرعة',
      description: 'إعجابات للمنشورات والريلز بجودة عالية تسليم فوري خلال ثوانٍ.',
      minQuantity: 50,
      maxQuantity: 100000,
      pricePer1000: 0.80,
      providerCostPer1000: 0.0,
      speed: '50,000 / يوم',
      avgTime: 'فوري (أقل من دقيقة)',
      notes: 'ضع رابط المنشور أو الريلز.',
      sortOrder: 1,
    },
  });

  await prisma.service.create({
    data: {
      categoryId: igViews.id,
      name: 'Instagram Reels Views — Explore Boost [مشاهدات ريلز اكسبلور]',
      nameAr: 'مشاهدات ريلز إنستغرام لدعم الوصول والاكسبلور',
      description: 'مشاهدات ريلز تدعم خوارزميات الانتشار والظهور في صفحة الاكسبلور.',
      minQuantity: 500,
      maxQuantity: 1000000,
      pricePer1000: 0.40,
      providerCostPer1000: 0.0,
      speed: '100,000+ / يوم',
      avgTime: 'فوري',
      notes: 'ضع رابط مقطع الريلز.',
      sortOrder: 1,
    },
  });

  // TikTok
  const tt = await prisma.platform.create({
    data: {
      name: 'TikTok',
      nameAr: 'تيك توك',
      slug: 'tiktok',
      icon: 'Video',
      sortOrder: 2,
    },
  });

  const ttFollowers = await prisma.category.create({
    data: {
      platformId: tt.id,
      name: 'Followers',
      nameAr: 'متابعين تيك توك',
      slug: 'tiktok-followers',
      sortOrder: 1,
    },
  });

  const ttViews = await prisma.category.create({
    data: {
      platformId: tt.id,
      name: 'Views',
      nameAr: 'مشاهدات تيك توك',
      slug: 'tiktok-views',
      sortOrder: 2,
    },
  });

  await prisma.service.create({
    data: {
      categoryId: ttFollowers.id,
      name: 'TikTok Followers — Instant Delivery [متابعين فوري]',
      nameAr: 'متابعين تيك توك تسليم فوري جودة ممتازة',
      description: 'متابعين تيك توك لفتح ميزة البث المباشر (Live) وزيادة الثقة بالحساب.',
      minQuantity: 100,
      maxQuantity: 50000,
      pricePer1000: 3.50,
      providerCostPer1000: 0.0,
      speed: '10,000 / يوم',
      avgTime: '5 دقائق',
      notes: 'ضع رابط الحساب أو اسم المستخدم (بدون @).',
      sortOrder: 1,
    },
  });

  await prisma.service.create({
    data: {
      categoryId: ttViews.id,
      name: 'TikTok Video Views — High Retention [مشاهدات عالية]',
      nameAr: 'مشاهدات فيديو تيك توك سريعة جداً',
      description: 'مشاهدات تدعم صعود الفيديو في صفحة For You (FYP).',
      minQuantity: 1000,
      maxQuantity: 5000000,
      pricePer1000: 0.20,
      providerCostPer1000: 0.0,
      speed: '500,000 / يوم',
      avgTime: 'فوري',
      notes: 'ضع رابط الفيديو.',
      sortOrder: 1,
    },
  });

  // YouTube
  const yt = await prisma.platform.create({
    data: {
      name: 'YouTube',
      nameAr: 'يوتيوب',
      slug: 'youtube',
      icon: 'Youtube',
      sortOrder: 3,
    },
  });

  const ytSubscribers = await prisma.category.create({
    data: {
      platformId: yt.id,
      name: 'Subscribers',
      nameAr: 'مشتركي يوتيوب',
      slug: 'youtube-subscribers',
      sortOrder: 1,
    },
  });

  const ytViews = await prisma.category.create({
    data: {
      platformId: yt.id,
      name: 'Views',
      nameAr: 'مشاهدات يوتيوب',
      slug: 'youtube-views',
      sortOrder: 2,
    },
  });

  await prisma.service.create({
    data: {
      categoryId: ytSubscribers.id,
      name: 'YouTube Subscribers — Non Drop Stable [مشتركين ثابتين]',
      nameAr: 'مشتركي قنوات يوتيوب مع ضمان عدم النقص مدى الحياة',
      description: 'مشتركون حقيقيون ثابتون لقنوات يوتيوب لتحقيق شروط تحقيق الدخل.',
      minQuantity: 50,
      maxQuantity: 10000,
      pricePer1000: 14.00,
      providerCostPer1000: 0.0,
      speed: '200 - 500 / يوم (أمان كامل)',
      avgTime: '1 - 6 ساعات',
      notes: 'يجب أن تحتوي القناة على فيديو واحد على الأقل.',
      sortOrder: 1,
    },
  });

  await prisma.service.create({
    data: {
      categoryId: ytViews.id,
      name: 'YouTube Views — Monetizable Views [مشاهدات مؤهلة للربح]',
      nameAr: 'مشاهدات يوتيوب حقيقية مؤهلة لتحقيق الأرباح',
      description: 'مشاهدات من مصادر بحث واقتراحات تدعم شروط الشراكة وأمان 100%.',
      minQuantity: 500,
      maxQuantity: 200000,
      pricePer1000: 2.50,
      providerCostPer1000: 0.0,
      speed: '5,000 / يوم',
      avgTime: 'ساعتان',
      notes: 'ضع رابط الفيديو.',
      sortOrder: 1,
    },
  });

  // Telegram
  const tg = await prisma.platform.create({
    data: {
      name: 'Telegram',
      nameAr: 'تيليجرام',
      slug: 'telegram',
      icon: 'Send',
      sortOrder: 4,
    },
  });

  const tgMembers = await prisma.category.create({
    data: {
      platformId: tg.id,
      name: 'Members',
      nameAr: 'أعضاء قنوات ومجموعات',
      slug: 'telegram-members',
      sortOrder: 1,
    },
  });

  await prisma.service.create({
    data: {
      categoryId: tgMembers.id,
      name: 'Telegram Channel Members — 0% Drop [أعضاء قنوات]',
      nameAr: 'أعضاء قنوات ومجموعات تيليجرام جودة عالية بدون نقص',
      description: 'أعضاء ثابتون لقنوات وتجمعات تيليجرام مع تسليم فوري.',
      minQuantity: 100,
      maxQuantity: 50000,
      pricePer1000: 2.20,
      providerCostPer1000: 0.0,
      speed: '20,000 / يوم',
      avgTime: 'فوري',
      notes: 'تأكد من أن القناة عامة (Public link).',
      sortOrder: 1,
    },
  });

  // Facebook
  const fb = await prisma.platform.create({
    data: {
      name: 'Facebook',
      nameAr: 'فيسبوك',
      slug: 'facebook',
      icon: 'Facebook',
      sortOrder: 5,
    },
  });

  const fbFollowers = await prisma.category.create({
    data: {
      platformId: fb.id,
      name: 'Followers',
      nameAr: 'متابعين صفحات',
      slug: 'facebook-followers',
      sortOrder: 1,
    },
  });

  await prisma.service.create({
    data: {
      categoryId: fbFollowers.id,
      name: 'Facebook Page Followers — Real Quality [متابعين صفحات]',
      nameAr: 'متابعين صفحات فيسبوك العامة بجودة عالية',
      description: 'متابعين لصفحات الأنشطة التجارية والشخصية على فيسبوك.',
      minQuantity: 100,
      maxQuantity: 50000,
      pricePer1000: 3.80,
      providerCostPer1000: 0.0,
      speed: '5,000 / يوم',
      avgTime: 'ساعتان',
      notes: 'ضع رابط الصفحة العامة.',
      sortOrder: 1,
    },
  });

  // X (Twitter)
  const xPlatform = await prisma.platform.create({
    data: {
      name: 'X',
      nameAr: 'إكس (تويتر)',
      slug: 'x',
      icon: 'Twitter',
      sortOrder: 6,
    },
  });

  const xFollowers = await prisma.category.create({
    data: {
      platformId: xPlatform.id,
      name: 'Followers',
      nameAr: 'متابعين إكس',
      slug: 'x-followers',
      sortOrder: 1,
    },
  });

  await prisma.service.create({
    data: {
      categoryId: xFollowers.id,
      name: 'X (Twitter) Followers — Real HQ Accounts [متابعين إكس]',
      nameAr: 'متابعين منصة إكس حسابات حقيقية ونشطة',
      description: 'متابعين بجودة ممتازة لحسابات إكس بدون طلب كلمات مرور.',
      minQuantity: 100,
      maxQuantity: 25000,
      pricePer1000: 6.50,
      providerCostPer1000: 0.0,
      speed: '3,000 / يوم',
      avgTime: 'ساعة واحدة',
      notes: 'ضع رابط حسابك على إكس.',
      sortOrder: 1,
    },
  });

  console.log('✅ Clean ESAAD Database seeded! Only Admin user preserved, zero mock providers, zero demo orders.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
