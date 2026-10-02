import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      newUsersToday,
      totalOrders,
      ordersToday,
      pendingOrders,
      processingOrders,
      completedOrders,
      allOrders,
      wallets,
      providers,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: todayStart } } }),
      db.order.count(),
      db.order.count({ where: { createdAt: { gte: todayStart } } }),
      db.order.count({ where: { status: 'PENDING' } }),
      db.order.count({ where: { status: 'PROCESSING' } }),
      db.order.count({ where: { status: 'COMPLETED' } }),
      db.order.findMany({
        select: {
          price: true,
          cost: true,
          profit: true,
          status: true,
          createdAt: true,
          service: {
            select: {
              category: {
                select: {
                  platform: {
                    select: { name: true, nameAr: true },
                  },
                },
              },
            },
          },
        },
      }),
      db.wallet.aggregate({
        _sum: { balance: true },
      }),
      db.provider.findMany({
        select: { name: true, balance: true, balanceCurrency: true },
      }),
    ]);

    // Calculate financials from completed & processing orders
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    const platformStats: Record<string, number> = {};

    allOrders.forEach((o) => {
      if (['COMPLETED', 'PROCESSING', 'PARTIAL'].includes(o.status)) {
        totalRevenue += o.price;
        totalCost += o.cost;
        totalProfit += o.profit;
      }

      const pName = o.service?.category?.platform?.nameAr || 'أخرى';
      platformStats[pName] = (platformStats[pName] || 0) + 1;
    });

    const totalProviderBalanceUSD = providers.reduce((acc, p) => acc + p.balance, 0);

    // Build last 7 days chart data
    const last7Days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = allOrders.filter(
        (o) => new Date(o.createdAt) >= dayStart && new Date(o.createdAt) <= dayEnd
      );

      const dayRev = dayOrders.reduce((sum, o) => sum + o.price, 0);

      last7Days.push({
        date: dateStr,
        revenue: dayRev,
        orders: dayOrders.length,
      });
    }

    return NextResponse.json({
      totalUsers,
      newUsersToday,
      totalOrders,
      ordersToday,
      pendingOrders,
      processingOrders,
      completedOrders,
      totalRevenue,
      totalCost,
      totalProfit,
      usersWalletBalance: wallets._sum.balance || 0,
      totalProviderBalanceUSD,
      providers,
      chartData: last7Days,
      platformBreakdown: Object.entries(platformStats).map(([name, value]) => ({ name, value })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 403 });
  }
}
