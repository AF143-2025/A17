import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const balance = auth.user.wallet?.balance ?? 0;

  return NextResponse.json({
    status: 'success',
    balance: balance,
    currency: 'USD',
    username: auth.user.username,
  });
}
