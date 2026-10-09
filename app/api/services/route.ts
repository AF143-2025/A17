import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCachedServicesHierarchy, setCachedServicesHierarchy } from '@/lib/services-cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Check in-memory cache for sub-millisecond response
    const cached = getCachedServicesHierarchy();
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    }

    // 2. Fetch active providers to ensure services belonging to active providers are shown
    const activeProviders = await db.provider.findMany({
      where: { status: true },
      select: { id: true },
    });
    const activeProviderIds = activeProviders.map((p) => p.id);

    // 3. Fast indexed query
    const platforms = await db.platform.findMany({
      where: { status: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        categories: {
          where: { status: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            services: {
              where: {
                status: true,
                pricePer1000: { gt: 0 },
                providerId: { in: activeProviderIds },
              },
              select: {
                id: true,
                categoryId: true,
                name: true,
                nameAr: true,
                description: true,
                minQuantity: true,
                maxQuantity: true,
                pricePer1000: true,
                speed: true,
                avgTime: true,
                notes: true,
                status: true,
                sortOrder: true,
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    // Exclude empty categories and platforms with 0 available services
    const activePlatforms = platforms
      .map((p) => ({
        ...p,
        categories: p.categories.filter((c) => c.services && c.services.length > 0),
      }))
      .filter((p) => p.categories.length > 0);

    const payload = { platforms: activePlatforms };
    setCachedServicesHierarchy(payload);

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error fetching services hierarchy:', error);
    return NextResponse.json({ error: 'Failed to load services' }, { status: 500 });
  }
}
