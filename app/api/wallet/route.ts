import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { getOrCreateWallet } from '@/lib/wallet';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const wallet = await getOrCreateWallet(user.id);

  const [transactions, paymentMethods, pendingPayments] = await Promise.all([
    db.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.paymentMethod.findMany({
      where: { status: true },
    }),
    db.payment.findMany({
      where: { userId: user.id },
      include: { paymentMethod: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    wallet,
    transactions,
    paymentMethods,
    pendingPayments,
  });
}
