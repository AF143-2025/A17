/**
 * ESAAD SMM Platform - Emergency Admin Password Reset Tool
 * 
 * Usage:
 *   node scripts/reset-admin.js
 *   node scripts/reset-admin.js "YourNewPassword123"
 *   node scripts/reset-admin.js "YourNewPassword123" "admin_username_or_email"
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('====================================================');
  console.log('🛡️  أداة استعادة وتعيين كلمة سر مدير المنصة (Admin)');
  console.log('====================================================\n');

  const args = process.argv.slice(2);
  let newPassword = args[0];
  const targetIdentifier = args[1];

  // If no password provided, generate a secure random password
  if (!newPassword) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    newPassword = 'Admin#' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  // Find the admin user
  let adminUser;
  if (targetIdentifier) {
    adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: targetIdentifier },
          { email: targetIdentifier },
        ],
      },
    });
  } else {
    adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'ADMIN' },
          { username: 'admin' },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  if (!adminUser) {
    console.error('❌ خطأ: لم يتم العثور على حساب مدير (Admin) في قاعدة البيانات!');
    process.exit(1);
  }

  // Hash the new password with bcrypt
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update in database
  await prisma.user.update({
    where: { id: adminUser.id },
    data: {
      passwordHash: hashedPassword,
      status: 'ACTIVE',
      role: 'ADMIN',
    },
  });

  console.log('✅ تم تحديث وتعيين كلمة مرور المدير بنجاح تام!\n');
  console.log('📋 بيانات تسجيل الدخول الجديدة:');
  console.log('----------------------------------------------------');
  console.log(`👤 اسم المستخدم (Username) : ${adminUser.username}`);
  console.log(`📧 البريد الإلكتروني (Email): ${adminUser.email}`);
  console.log(`🔑 كلمة المرور (Password)   : ${newPassword}`);
  console.log(`🌐 رابط تسجيل دخول الإدارة  : /admin/login`);
  console.log('----------------------------------------------------\n');
  console.log('💡 يمكنك الآن تسجيل الدخول مباشرة بهذه البيانات.');
}

main()
  .catch((err) => {
    console.error('حدث خطأ أثناء تعيين كلمة المرور:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
