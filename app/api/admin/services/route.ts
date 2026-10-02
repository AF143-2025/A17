import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { logAdminAction } from '@/lib/audit';

export async function GET() {
  try {
    await requireAdmin();

    const services = await db.service.findMany({
      include: {
        category: {
          include: { platform: true },
        },
        provider: true,
      },
      orderBy: [
        { category: { platform: { sortOrder: 'asc' } } },
        { category: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
      ],
    });

    const platforms = await db.platform.findMany({
      include: { categories: true },
      orderBy: { sortOrder: 'asc' },
    });

    const providers = await db.provider.findMany({
      where: { status: true },
    });

    return NextResponse.json({ services, platforms, providers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const {
      categoryId,
      name,
      nameAr,
      description,
      minQuantity,
      maxQuantity,
      pricePer1000,
      providerCostPer1000,
      providerId,
      providerServiceId,
      speed,
      avgTime,
      notes,
    } = body;

    if (!categoryId || !name || !pricePer1000) {
      return NextResponse.json({ error: 'يرجى ملء الحقول الأساسية للخدمة' }, { status: 400 });
    }

    const newService = await db.service.create({
      data: {
        categoryId,
        name,
        nameAr: nameAr || null,
        description: description || '',
        minQuantity: parseInt(minQuantity || 100, 10),
        maxQuantity: parseInt(maxQuantity || 10000, 10),
        pricePer1000: parseFloat(pricePer1000),
        providerCostPer1000: parseFloat(providerCostPer1000 || 0),
        providerId: providerId || null,
        providerServiceId: providerServiceId || null,
        speed: speed || null,
        avgTime: avgTime || null,
        notes: notes || null,
        status: true,
      },
    });

    await logAdminAction({
      adminId: admin.id,
      action: 'SERVICE_CREATE',
      targetType: 'SERVICE',
      targetId: newService.id,
      details: { name, pricePer1000, providerCostPer1000 },
    });

    return NextResponse.json({ success: true, service: newService });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'فشل في إضافة الخدمة' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    if (updateData.minQuantity) updateData.minQuantity = parseInt(updateData.minQuantity, 10);
    if (updateData.maxQuantity) updateData.maxQuantity = parseInt(updateData.maxQuantity, 10);
    if (updateData.pricePer1000) updateData.pricePer1000 = parseFloat(updateData.pricePer1000);
    if (updateData.providerCostPer1000 !== undefined)
      updateData.providerCostPer1000 = parseFloat(updateData.providerCostPer1000);

    const updated = await db.service.update({
      where: { id },
      data: updateData,
    });

    await logAdminAction({
      adminId: admin.id,
      action: 'SERVICE_UPDATE',
      targetType: 'SERVICE',
      targetId: id,
      details: updateData,
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'فشل في تحديث الخدمة' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    const hard = searchParams.get('hard') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    if (hard) {
      const ordersCount = await db.order.count({ where: { serviceId: id } });
      if (ordersCount > 0) {
        await db.service.update({
          where: { id },
          data: { status: false },
        });
        return NextResponse.json({
          success: true,
          message: `تم تعطيل الخدمة بدلاً من حذفها لوجود ${ordersCount} طلبات سابقة مرتبطة بها`,
          disabled: true,
        });
      }

      await db.serviceProvider.deleteMany({ where: { serviceId: id } });
      await db.service.delete({ where: { id } });

      await logAdminAction({
        adminId: admin.id,
        action: 'SERVICE_DELETE',
        targetType: 'SERVICE',
        targetId: id,
      });

      return NextResponse.json({ success: true, message: 'تم حذف الخدمة نهائياً بنجاح' });
    }

    const service = await db.service.findUnique({ where: { id } });
    if (!service) {
      return NextResponse.json({ error: 'الخدمة غير موجودة' }, { status: 404 });
    }

    const newStatus = !service.status;
    await db.service.update({
      where: { id },
      data: { status: newStatus },
    });

    await logAdminAction({
      adminId: admin.id,
      action: newStatus ? 'SERVICE_ENABLE' : 'SERVICE_DISABLE',
      targetType: 'SERVICE',
      targetId: id,
    });

    return NextResponse.json({
      success: true,
      message: newStatus ? 'تم تفعيل الخدمة بنجاح' : 'تم تعطيل الخدمة بنجاح',
      status: newStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'فشل في العملية' }, { status: 400 });
  }
}
