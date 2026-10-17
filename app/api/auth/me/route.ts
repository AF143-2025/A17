import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  let balance = user.wallet?.balance || 0;
  if (user.role === 'ADMIN') {
    const providers = await db.provider.findMany({
      where: { status: true },
      select: { balance: true },
    });
    balance = providers.reduce((sum, p) => sum + (p.balance || 0), 0);
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      balance,
      currency: user.wallet?.currency || 'USD',
      createdAt: user.createdAt,
    },
  });
}
