import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { generateApiKey } from '@/lib/api-auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = await db.apiKey.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      rateLimit: true,
      status: true,
      lastUsedAt: true,
      createdAt: true,
      _count: {
        select: { usage: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    const keyName = (name || 'مفتاح API افتراضي').trim();

    const { rawKey, keyPrefix, keyHash } = generateApiKey();

    const apiKey = await db.apiKey.create({
      data: {
        userId: user.id,
        name: keyName,
        keyPrefix,
        keyHash,
        rateLimit: 120, // 120 req/min
        status: true,
      },
    });

    // Return the rawKey ONCE so user can copy it securely
    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        rawKey: rawKey, // Only shown upon creation!
        rateLimit: apiKey.rateLimit,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create API key' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const keyId = searchParams.get('id');

  if (!keyId) {
    return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
  }

  const existing = await db.apiKey.findFirst({
    where: { id: keyId, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 });
  }

  await db.apiKey.update({
    where: { id: keyId },
    data: { status: false },
  });

  return NextResponse.json({ success: true, message: 'تم إبطال المفتاح بنجاح' });
}
