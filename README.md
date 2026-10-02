# منصة اصعد (ESAAD) لخدمات النمو الرقمي وSMM 🚀

منصة احترافية متكاملة لتقديم وإدارة خدمات التسويق والنمو عبر منصات التواصل الاجتماعي (SMM)، مصممة بهوية بصرية أصلية بالكامل باللغة العربية (RTL) مع دعم كامل للوضع الداكن (Premium Dark UI)، وتجربة مستخدم مخصصة للهاتف أولاً (Mobile-First)، وعملة أساسية هي **الدينار العراقي (IQD)**.

---

## 🌟 الميزات الرئيسية

1. **الهوية والتصميم الأصيل**:
   - اسم أصيل وشعار مخصص: **اصعد | ESAAD**.
   - دعم الوضع الداكن الفاخر (Obsidian / Emerald / Cyan).
   - واجهة متجاوبة بالكامل: شريط سفلي في الهاتف (Mobile Bottom Navigation) وشريط جانبي في الشاشات الكبيرة (Sidebar).
   - خط **Cairo** الحديث، وتأثيرات بصرية متوازنة (Glassmorphism & Soft Glows).

2. **نظام المحفظة والمدفوعات الذرية (ACID Transactions & Ledger)**:
   - نظام مالي صارم مبني على المعاملات (Ledger) يمنع الأرصدة السالبة وتكرار الخصم.
   - دعم بوابات الدفع العراقية: زين كاش (Zain Cash)، فاست باي (FastPay)، مصرف العراق الأول (FIB)، بطاقات كي كارد وماستركارد، وخيار الشحن التجريبي الفوري (Instant Mock).

3. **محرك الطلبات ومحول المزودين (Order Engine & Provider Adapters)**:
   - تدفق ذكي: المنصة ← التصنيف ← الخدمة ← الرابط ← الكمية ← السعر التلقائي بالدينار ← التحقق المزدوج (Client & Server).
   - دعم بروتوكول SMM v2 القياسي العالمي بالإضافة إلى محاكي تجريبي فوري (Mock Provider).
   - استرجاع مالي تلقائي (Auto Refund) في حال إلغاء الطلب أو تنفيذه جزئياً (Partial).

4. **واجهة برمجة التطبيقات للموزعين (Client / Reseller REST API v1)**:
   - توليد وإدارة مفاتيح API المشفرة مع معدل استدعاءات محدد (Rate Limiting).
   - نقاط نهاية معيارية:
     - `GET /api/v1/services`
     - `GET /api/v1/balance`
     - `POST /api/v1/order`
     - `GET /api/v1/order/{id}`
     - `GET /api/v1/orders`
     - `POST /api/v1/cancel`
     - `POST /api/v1/refill`

5. **لوحة تحكم المدير المنفصلة (Admin Dashboard)**:
   - إحصائيات حية: إجمالي المبيعات، التكاليف، صافي الأرباح، وأرصدة المزودين والمستخدمين.
   - إدارة المستخدمين وتعديل الأرصدة مع فرض توثيق السبب في سجل التدقيق (Audit Log).
   - إدارة ومزامنة الطلبات وتتبع هوامش الربح لكل طلب.
   - تسعير الخدمات وتحديد هوامش الربح لكل ألف متابع أو تفاعل.
   - إدارة المزودين، فحص الرصيد الخارجي، ومزامنة الخدمات.
   - اعتماد ورفض طلبات الشحن بنقرة واحدة.
   - إدارة كوبونات الخصم وتذاكر الدعم الفني وسجل الرقابة الإدارية.

---

## 🔑 الحسابات الافتراضية الجاهزة للتجربة

| الدور | البريد الإلكتروني / اسم المستخدم | كلمة المرور | الرصيد الافتراضي |
| :--- | :--- | :--- | :--- |
| **المدير العام (Admin)** | `admin@esaad.iq` أو `admin` | `Admin@123456` | 1,000,000 د.ع |
| **مستخدم تجريبي (User)** | `user@esaad.iq` أو `mohammed_iraq` | `User@123456` | 25,000 د.ع |
| **موزع (Reseller)** | `reseller@esaad.iq` أو `pro_reseller` | `Reseller@123456` | 150,000 د.ع |

---

## 🛠️ المعمارية والتقنيات المستخدمة

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS (RTL), Lucide Icons.
- **Backend**: Next.js Server Components & Route Handlers, JWT Sessions with HttpOnly cookies, bcryptjs.
- **Database**: Prisma ORM with SQLite (قابلة للتحويل إلى PostgreSQL عبر تغيير سطر واحد في `.env`).
- **Provider Layer**: Provider Interface Abstraction (`MockSmmAdapter`, `StandardSmmAdapter`).

---

## 🚀 أوامر التشغيل والتهيئة

```bash
# تثبيت الحزم
npm install

# توليد عميل Prisma ومزامنة الجداول
npx prisma generate
npx prisma db push

# زرع البيانات الأولية (المنصات، الخدمات، طرق الدفع، والحسابات)
npx ts-node prisma/seed.ts

# تشغيل خادم التطوير
npm run dev

# بناء الإنتاج
npm run build
npm start
```

---

© 2026 منصة اصعد (ESAAD). جميع الحقوق محفوظة.
