import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { authenticateApiKey } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const services = await db.service.findMany({
    where: {
      status: true,
      OR: [
        { provider: { status: true } },
        { serviceProviders: { some: { status: true, provider: { status: true } } } },
      ],
    },
    include: {
      category: {
        include: {
          platform: true,
        },
      },
    },
    orderBy: [
      { category: { platform: { sortOrder: 'asc' } } },
      { category: { sortOrder: 'asc' } },
      { sortOrder: 'asc' },
    ],
  });

  const formatted = services.map((s) => ({
    service: s.id,
    name: s.name,
    category: s.category.name,
    platform: s.category.platform.name,
    rate_per_1000: s.pricePer1000,
    currency: 'USD',
    min: s.minQuantity,
    max: s.maxQuantity,
    speed: s.speed,
    avg_time: s.avgTime,
    desc: s.description,
  }));

  return NextResponse.json({
    status: 'success',
    currency: 'USD',
    count: formatted.length,
    services: formatted,
  });
}
