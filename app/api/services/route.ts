import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const platforms = await db.platform.findMany({
      where: { status: true },
      include: {
        categories: {
          where: { status: true },
          include: {
            services: {
              where: {
                status: true,
                OR: [
                  { provider: { status: true } },
                  { serviceProviders: { some: { status: true, provider: { status: true } } } },
                ],
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
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Exclude empty categories and platforms with 0 available services
    const activePlatforms = platforms
      .map((p) => ({
        ...p,
        categories: p.categories.filter((c) => c.services && c.services.length > 0),
      }))
      .filter((p) => p.categories.length > 0);

    return NextResponse.json({ platforms: activePlatforms });
  } catch (error: any) {
    console.error('Error fetching services hierarchy:', error);
    return NextResponse.json({ error: 'Failed to load services' }, { status: 500 });
  }
}
