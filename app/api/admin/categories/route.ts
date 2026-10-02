import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { logAdminAction } from '@/lib/audit';

export async function GET() {
  try {
    await requireAdmin();

    const platforms = await db.platform.findMany({
      include: {
        categories: {
          include: {
            _count: {
              select: { services: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ platforms });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { type, platformId, name, nameAr, slug, icon, sortOrder } = body;

    if (type === 'PLATFORM') {
      if (!name || !nameAr || !slug) {
        return NextResponse.json({ error: 'الاسم، الاسم بالعربي، والـ Slug مطلوبين للمنصة' }, { status: 400 });
      }

      const platform = await db.platform.create({
        data: {
          name,
          nameAr,
          slug: slug.toLowerCase().trim(),
          icon: icon || 'Sparkles',
          sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
        },
      });

      await logAdminAction({
        adminId: admin.id,
        action: 'PLATFORM_CREATE',
        targetType: 'PLATFORM',
        targetId: platform.id,
        details: { name, nameAr, slug },
      });

      return NextResponse.json({ success: true, platform });
    }

    if (type === 'CATEGORY') {
      if (!platformId || !name || !nameAr) {
        return NextResponse.json({ error: 'يرجى تحديد المنصة، واسم التصنيف بالعربي والإنجليزي' }, { status: 400 });
      }

      const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const category = await db.category.create({
        data: {
          platformId,
          name,
          nameAr,
          slug: generatedSlug,
          sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
        },
      });

      await logAdminAction({
        adminId: admin.id,
        action: 'CATEGORY_CREATE',
        targetType: 'CATEGORY',
        targetId: category.id,
        details: { platformId, name, nameAr },
      });

      return NextResponse.json({ success: true, category });
    }

    return NextResponse.json({ error: 'نوع غير مدعوم' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'فشل في الإضافة' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { type, id, name, nameAr, slug, icon, sortOrder, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (type === 'PLATFORM') {
      const data: any = {};
      if (name) data.name = name;
      if (nameAr) data.nameAr = nameAr;
      if (slug) data.slug = slug.toLowerCase().trim();
      if (icon) data.icon = icon;
      if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder, 10);
      if (status !== undefined) data.status = Boolean(status);

      const updated = await db.platform.update({
        where: { id },
        data,
      });

      await logAdminAction({
        adminId: admin.id,
        action: 'PLATFORM_UPDATE',
        targetType: 'PLATFORM',
        targetId: id,
        details: data,
      });

      return NextResponse.json({ success: true, platform: updated });
    }

    if (type === 'CATEGORY') {
      const data: any = {};
      if (name) data.name = name;
      if (nameAr) data.nameAr = nameAr;
      if (slug) data.slug = slug.toLowerCase().trim();
      if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder, 10);
      if (status !== undefined) data.status = Boolean(status);

      const updated = await db.category.update({
        where: { id },
        data,
      });

      await logAdminAction({
        adminId: admin.id,
        action: 'CATEGORY_UPDATE',
        targetType: 'CATEGORY',
        targetId: id,
        details: data,
      });

      return NextResponse.json({ success: true, category: updated });
    }

    return NextResponse.json({ error: 'نوع غير مدعوم' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'فشل في التعديل' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (type === 'PLATFORM') {
      // Check if categories or services exist
      const categories = await db.category.findMany({
        where: { platformId: id },
        include: { _count: { select: { services: true } } },
      });

      const totalServices = categories.reduce((acc, c) => acc + c._count.services, 0);
      if (totalServices > 0) {
        return NextResponse.json(
          { error: `لا يمكن حذف المنصة لوجود ${totalServices} خدمة مرتبطة بها. قم بحذف أو نقل الخدمات أولاً.` },
          { status: 400 }
        );
      }

      await db.category.deleteMany({ where: { platformId: id } });
      await db.platform.delete({ where: { id } });

      await logAdminAction({
        adminId: admin.id,
        action: 'PLATFORM_DELETE',
        targetType: 'PLATFORM',
        targetId: id,
      });

      return NextResponse.json({ success: true, message: 'تم حذف المنصة بنجاح' });
    }

    if (type === 'CATEGORY') {
      const servicesCount = await db.service.count({ where: { categoryId: id } });
      if (servicesCount > 0) {
        return NextResponse.json(
          { error: `لا يمكن حذف هذا التصنيف لوجود ${servicesCount} خدمة مسجلة تحته.` },
          { status: 400 }
        );
      }

      await db.category.delete({ where: { id } });

      await logAdminAction({
        adminId: admin.id,
        action: 'CATEGORY_DELETE',
        targetType: 'CATEGORY',
        targetId: id,
      });

      return NextResponse.json({ success: true, message: 'تم حذف التصنيف بنجاح' });
    }

    return NextResponse.json({ error: 'نوع غير مدعوم' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'فشل في الحذف' }, { status: 400 });
  }
}
