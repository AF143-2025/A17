import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { recalculateServicePrices } from '@/lib/pricing-engine';
import { logAdminAction } from '@/lib/audit';

export async function GET() {
  try {
    await requireAdmin();

    const [rules, platforms, categories] = await Promise.all([
      db.pricingRule.findMany({
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      db.platform.findMany({
        where: { status: true },
        select: { id: true, name: true, nameAr: true, slug: true },
      }),
      db.category.findMany({
        where: { status: true },
        select: { id: true, name: true, nameAr: true, slug: true, platformId: true },
      }),
    ]);

    return NextResponse.json({
      rules,
      platforms,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { name, scope, targetId, markupType, markupValue, priority, recalculateNow } = body;

    if (!name || markupValue === undefined) {
      return NextResponse.json(
        { error: 'يرجى تحديد اسم القاعدة وقيمة هامش الربح' },
        { status: 400 }
      );
    }

    const rule = await db.pricingRule.create({
      data: {
        name,
        scope: scope || 'GLOBAL',
        targetId: targetId || null,
        markupType: markupType || 'PERCENTAGE',
        markupValue: parseFloat(markupValue),
        priority: priority ? parseInt(priority, 10) : 0,
        status: true,
      },
    });

    const recalculatedCount = await recalculateServicePrices();

    await logAdminAction({
      adminId: admin.id,
      action: 'PRICING_RULE_CREATE',
      targetType: 'PRICING_RULE',
      targetId: rule.id,
      details: { name, scope, targetId, markupType, markupValue },
    });

    return NextResponse.json({
      success: true,
      rule,
      recalculatedCount,
      message: 'تم إنشاء قاعدة التسعير وتحديث الأسعار بنجاح',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'فشل في إنشاء قاعدة التسعير' },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, name, scope, targetId, markupType, markupValue, priority, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (scope !== undefined) updateData.scope = scope;
    if (targetId !== undefined) updateData.targetId = targetId;
    if (markupType !== undefined) updateData.markupType = markupType;
    if (markupValue !== undefined) updateData.markupValue = parseFloat(markupValue);
    if (priority !== undefined) updateData.priority = parseInt(priority, 10);
    if (status !== undefined) updateData.status = Boolean(status);

    const rule = await db.pricingRule.update({
      where: { id },
      data: updateData,
    });

    const recalculatedCount = await recalculateServicePrices();

    await logAdminAction({
      adminId: admin.id,
      action: 'PRICING_RULE_UPDATE',
      targetType: 'PRICING_RULE',
      targetId: rule.id,
      details: updateData,
    });

    return NextResponse.json({
      success: true,
      rule,
      recalculatedCount,
      message: 'تم تحديث قاعدة التسعير وإعادة ضبط الأسعار بنجاح',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'فشل في تحديث قاعدة التسعير' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    await db.pricingRule.delete({
      where: { id },
    });

    await logAdminAction({
      adminId: admin.id,
      action: 'PRICING_RULE_DELETE',
      targetType: 'PRICING_RULE',
      targetId: id,
      details: {},
    });

    // Automatically recalculate all service prices upon deleting a rule!
    const recalculatedCount = await recalculateServicePrices();

    return NextResponse.json({
      success: true,
      recalculatedCount,
      message: 'تم حذف قاعدة التسعير وإعادة ضبط جميع الأسعار بنجاح',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'فشل في حذف قاعدة التسعير' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = req.nextUrl;
    const serviceId = searchParams.get('serviceId') || undefined;

    const count = await recalculateServicePrices(serviceId);

    return NextResponse.json({
      success: true,
      recalculatedCount: count,
      message: `تم إعادة احتساب وتحديث أسعار ${count} خدمة بنجاح`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'فشل في إعادة احتساب الأسعار' },
      { status: 400 }
    );
  }
}
