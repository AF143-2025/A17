import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { ProviderFactory } from '@/lib/providers/provider-factory';
import { SyncEngine } from '@/lib/sync/sync-engine';
import { logAdminAction } from '@/lib/audit';
import { encryptText } from '@/lib/crypto';

export async function GET() {
  try {
    await requireAdmin();

    const [providers, syncLogs] = await Promise.all([
      db.provider.findMany({
        include: {
          _count: {
            select: {
              services: true,
              orders: true,
              providerServices: true,
              serviceProviders: true,
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      db.syncLog.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          provider: {
            select: { name: true },
          },
        },
      }),
    ]);

    // Mask the API keys for security
    const masked = providers.map((p) => ({
      ...p,
      apiKey: p.apiKey ? `${p.apiKey.slice(0, 4)}••••••••${p.apiKey.slice(-4)}` : '',
    }));

    return NextResponse.json({
      providers: masked,
      syncLogs,
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
    const { name, apiUrl, apiKey, type, priority, action, providerId } = body;

    // Check Balance or Test Connection action
    if (action === 'check_balance' || action === 'test_connection') {
      const provider = await db.provider.findUnique({
        where: { id: providerId },
      });

      if (!provider) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }

      const adapter = ProviderFactory.getAdapter(provider);
      const balanceData = await adapter.getBalance();

      const updated = await db.provider.update({
        where: { id: provider.id },
        data: {
          balance: balanceData.balance,
          balanceCurrency: balanceData.currency,
          lastSyncAt: new Date(),
          errorCount: 0, // Reset error count on successful connection
        },
      });

      return NextResponse.json({
        success: true,
        balance: balanceData.balance,
        currency: balanceData.currency,
        message: `تم الاتصال بنجاح. الرصيد: $${balanceData.balance.toFixed(2)} ${balanceData.currency}`,
      });
    }

    // Sync Services action using automated SyncEngine
    if (action === 'sync_services') {
      const result = await SyncEngine.syncProviderServices(providerId);

      if (!result.success) {
        return NextResponse.json({
          error: result.error || 'فشلت مزامنة الخدمات من المزود',
          result,
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        result,
        message: `تمت المزامنة بنجاح: ${result.totalSynced} خدمة (${result.newServicesCount} جديدة، ${result.updatedServicesCount} محدثة) في ${result.durationMs}ms`,
      });
    }

    // Toggle Provider Active/Paused status (إيقاف وتشغيل المزود)
    if (action === 'toggle_status') {
      const provider = await db.provider.findUnique({
        where: { id: providerId },
      });

      if (!provider) {
        return NextResponse.json({ error: 'المزود غير موجود' }, { status: 404 });
      }

      const newStatus = body.status !== undefined ? Boolean(body.status) : !provider.status;

      const [updated] = await db.$transaction([
        db.provider.update({
          where: { id: providerId },
          data: { status: newStatus },
        }),
        db.service.updateMany({
          where: { providerId: providerId },
          data: { status: newStatus },
        }),
        db.serviceProvider.updateMany({
          where: { providerId: providerId },
          data: { status: newStatus },
        }),
        db.providerService.updateMany({
          where: { providerId: providerId },
          data: { status: newStatus },
        }),
      ]);

      await logAdminAction({
        adminId: admin.id,
        action: 'PROVIDER_UPDATE',
        targetType: 'PROVIDER',
        targetId: provider.id,
        details: { action: 'toggle_status', oldStatus: provider.status, newStatus },
      });

      return NextResponse.json({
        success: true,
        status: updated.status,
        message: updated.status
          ? `تم تشغيل وتفعيل المزود (${updated.name}) وظهور كافة خدماته للمستخدمين بنجاح 🟢`
          : `تم إيقاف المزود (${updated.name}) وإخفاء كافة خدماته عن المستخدمين بنجاح ⏸️`,
      });
    }

    // Adding a new provider
    if (!name || !apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'يرجى ملء جميع الحقول المطلوبة (الاسم، رابط API، مفتاح API)' },
        { status: 400 }
      );
    }

    const newProvider = await db.provider.create({
      data: {
        name,
        apiUrl: apiUrl.trim(),
        apiKey: encryptText(apiKey.trim()),
        type: type || 'STANDARD_SMM_V2',
        priority: priority ? parseInt(priority, 10) : 0,
        status: true,
      },
    });

    await logAdminAction({
      adminId: admin.id,
      action: 'PROVIDER_CREATE',
      targetType: 'PROVIDER',
      targetId: newProvider.id,
      details: { name, apiUrl, type, priority },
    });

    return NextResponse.json({ success: true, provider: newProvider });
  } catch (error: any) {
    console.error('Admin Provider API Error:', error);
    return NextResponse.json(
      { error: error.message || 'فشل في تنفيذ العملية' },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, name, apiUrl, apiKey, type, priority, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (apiUrl !== undefined) updateData.apiUrl = apiUrl.trim();
    if (apiKey && !apiKey.includes('••••••••')) updateData.apiKey = encryptText(apiKey.trim());
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = parseInt(priority, 10);
    if (status !== undefined) updateData.status = Boolean(status);

    const provider = await db.provider.update({
      where: { id },
      data: updateData,
    });

    if (status !== undefined) {
      const boolStatus = Boolean(status);
      await Promise.all([
        db.service.updateMany({ where: { providerId: id }, data: { status: boolStatus } }),
        db.serviceProvider.updateMany({ where: { providerId: id }, data: { status: boolStatus } }),
        db.providerService.updateMany({ where: { providerId: id }, data: { status: boolStatus } }),
      ]);
    }

    await logAdminAction({
      adminId: admin.id,
      action: 'PROVIDER_UPDATE',
      targetType: 'PROVIDER',
      targetId: provider.id,
      details: updateData,
    });

    return NextResponse.json({
      success: true,
      provider,
      message: 'تم تحديث بيانات المزود بنجاح',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'فشل في تحديث بيانات المزود' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const provider = await db.provider.findUnique({ where: { id } });
    if (!provider) {
      return NextResponse.json({ error: 'المزود غير موجود' }, { status: 404 });
    }

    const newStatus = status !== undefined ? Boolean(status) : !provider.status;

    const [updated] = await db.$transaction([
      db.provider.update({
        where: { id },
        data: { status: newStatus },
      }),
      db.service.updateMany({
        where: { providerId: id },
        data: { status: newStatus },
      }),
      db.serviceProvider.updateMany({
        where: { providerId: id },
        data: { status: newStatus },
      }),
      db.providerService.updateMany({
        where: { providerId: id },
        data: { status: newStatus },
      }),
    ]);

    await logAdminAction({
      adminId: admin.id,
      action: 'PROVIDER_UPDATE',
      targetType: 'PROVIDER',
      targetId: id,
      details: { action: 'toggle_status_patch', oldStatus: provider.status, newStatus },
    });

    return NextResponse.json({
      success: true,
      status: updated.status,
      message: updated.status
        ? `تم تشغيل وتفعيل المزود (${updated.name}) وظهور كافة خدماته للمستخدمين بنجاح 🟢`
        : `تم إيقاف المزود (${updated.name}) وإخفاء كافة خدماته عن المستخدمين بنجاح ⏸️`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'فشل في تحديث حالة المزود' },
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
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // Check if orders exist for this provider
    const ordersCount = await db.order.count({
      where: { providerId: id },
    });

    if (ordersCount > 0) {
      // Soft disable instead of delete
      await db.provider.update({
        where: { id },
        data: { status: false },
      });

      return NextResponse.json({
        success: true,
        message: 'تم تعطيل المزود نظراً لوجود طلبات سابقة مرتبطة به',
      });
    }

    // Delete mappings and provider
    await db.serviceProvider.deleteMany({ where: { providerId: id } });
    await db.providerService.deleteMany({ where: { providerId: id } });
    await db.provider.delete({ where: { id } });

    await logAdminAction({
      adminId: admin.id,
      action: 'PROVIDER_DELETE',
      targetType: 'PROVIDER',
      targetId: id,
      details: {},
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المزود بنجاح',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'فشل في حذف المزود' },
      { status: 400 }
    );
  }
}
