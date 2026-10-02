import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { logAdminAction } from '@/lib/audit';

export async function GET() {
  try {
    await requireAdmin();

    const settings = await db.setting.findMany();
    const settingsMap: Record<string, string> = {};

    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    // Defaults if not set
    if (!settingsMap['site_name']) settingsMap['site_name'] = 'اصعد | ESAAD';
    if (!settingsMap['site_tagline']) settingsMap['site_tagline'] = 'منصة خدمات النمو الرقمي';
    if (!settingsMap['currency']) settingsMap['currency'] = 'USD';
    if (!settingsMap['currency_symbol']) settingsMap['currency_symbol'] = '$';
    if (!settingsMap['telegram_support']) settingsMap['telegram_support'] = '@Hexc8re';
    if (!settingsMap['maintenance_mode']) settingsMap['maintenance_mode'] = 'false';
    if (!settingsMap['allow_registration']) settingsMap['allow_registration'] = 'true';
    if (!settingsMap['announcement']) settingsMap['announcement'] = 'أهلاً بكم في منصة اصعد! شحن الرصيد المباشر عبر تيليجرام @Hexc8re.';

    return NextResponse.json({ settings: settingsMap });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 });
    }

    const updates = Object.entries(settings).map(async ([key, value]) => {
      return await db.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    });

    await Promise.all(updates);

    await logAdminAction({
      adminId: admin.id,
      action: 'SETTINGS_UPDATE',
      targetType: 'SYSTEM',
      targetId: 'GLOBAL_SETTINGS',
      details: settings,
    });

    return NextResponse.json({ success: true, message: 'تم حفظ إعدادات المنصة بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'فشل في حفظ الإعدادات' }, { status: 400 });
  }
}
