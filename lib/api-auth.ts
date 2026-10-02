import { NextRequest } from 'next/server';
import crypto from 'crypto';
import db from './db';

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function generateApiKey(): { rawKey: string; keyPrefix: string; keyHash: string } {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const rawKey = `es_live_${randomBytes}`;
  const keyPrefix = rawKey.substring(0, 12) + '...';
  const keyHash = hashApiKey(rawKey);
  return { rawKey, keyPrefix, keyHash };
}

export async function authenticateApiKey(req: NextRequest, explicitKey?: string) {
  let key: string | null = explicitKey || null;

  // 1. Check Authorization header: Bearer <key>
  if (!key) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      key = authHeader.substring(7).trim();
    }
  }

  // 2. Check query param: ?key=...
  if (!key) {
    key = req.nextUrl.searchParams.get('key');
  }

  // 3. If missing, return 401 error
  if (!key) {
    return { error: 'API key is required', status: 401 };
  }

  const keyHash = hashApiKey(key);
  const apiKeyRecord = await db.apiKey.findUnique({
    where: { keyHash },
    include: {
      user: {
        include: {
          wallet: true,
        },
      },
    },
  });

  if (!apiKeyRecord || !apiKeyRecord.status) {
    return { error: 'Invalid or revoked API key', status: 401 };
  }

  if (!apiKeyRecord.user || apiKeyRecord.user.status !== 'ACTIVE') {
    return { error: 'User account is inactive or disabled', status: 403 };
  }

  // Rate Limiting: check requests in the last 60 seconds
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const recentUsageCount = await db.apiUsage.count({
    where: {
      apiKeyId: apiKeyRecord.id,
      createdAt: { gte: oneMinuteAgo },
    },
  });

  if (recentUsageCount >= apiKeyRecord.rateLimit) {
    return { error: 'Rate limit exceeded. Please slow down your requests.', status: 429 };
  }

  // Log usage asynchronously
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  await db.apiUsage.create({
    data: {
      apiKeyId: apiKeyRecord.id,
      endpoint: req.nextUrl.pathname,
      method: req.method,
      statusCode: 200,
      ipAddress,
    },
  }).catch(() => {});

  await db.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return { user: apiKeyRecord.user, apiKey: apiKeyRecord };
}
