import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let balance = auth.user.wallet?.balance ?? 0;
  if (auth.user.role === 'ADMIN') {
    const providers = await db.provider.findMany({
      where: { status: true },
      select: { balance: true },
    });
    balance = providers.reduce((sum, p) => sum + (p.balance || 0), 0);
  }

  return NextResponse.json({
    status: 'success',
    balance: balance,
    currency: 'USD',
    username: auth.user.username,
  });
}
