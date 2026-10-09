import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { SyncEngine } from '@/lib/sync/sync-engine';
import { ProviderFactory } from '@/lib/providers/provider-factory';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const authHeader = req.headers.get('authorization');
  const secretParam = searchParams.get('secret');
  const syncServices = searchParams.get('syncServices') === 'true';
  const syncPrices = searchParams.get('syncPrices') !== 'false'; // Automatically true by default to ensure real-time price updates

  // Check auth: Bearer token, query secret, or Admin session
  const cronSecret = process.env.CRON_SECRET || 'esaad-cron-secret-2026';
  const isSecretValid =
    (authHeader && authHeader === `Bearer ${cronSecret}`) ||
    secretParam === cronSecret;

  if (!isSecretValid) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startTime = Date.now();
  const summary: any = {
    timestamp: new Date().toISOString(),
    ordersSync: null,
    servicesSync: null,
    providersBalance: [],
  };

  try {
    // 1. Sync Active Orders Status (Pending / Processing)
    const orderSyncResult = await SyncEngine.syncOrderStatuses();
    summary.ordersSync = orderSyncResult;

    // 2. Sync Provider Balances
    const activeProviders = await db.provider.findMany({
      where: { status: true },
    });

    for (const provider of activeProviders) {
      try {
        const adapter = ProviderFactory.getAdapter(provider);
        const balanceData = await adapter.getBalance();
        await db.provider.update({
          where: { id: provider.id },
          data: {
            balance: balanceData.balance,
            balanceCurrency: balanceData.currency,
            lastSyncAt: new Date(),
          },
        });
        summary.providersBalance.push({
          provider: provider.name,
          balance: balanceData.balance,
          currency: balanceData.currency,
          success: true,
        });
      } catch (err: any) {
        summary.providersBalance.push({
          provider: provider.name,
          success: false,
          error: err.message,
        });
      }
    }

    // 3. Optional: Sync Services from All Providers
    if (syncServices) {
      const servicesSyncResult = await SyncEngine.syncAllActiveProviders();
      summary.servicesSync = servicesSyncResult;
    }

    // 4. Optional: Recalculate & Normalize All Prices
    if (syncPrices) {
      const { recalculateServicePrices } = await import('@/lib/pricing-engine');
      const count = await recalculateServicePrices();
      summary.recalculatedPricesCount = count;
    }

    summary.durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('[CronSync] Error during sync:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal sync error',
        summary,
      },
      { status: 500 }
    );
  }
}
