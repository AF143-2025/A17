import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import { creditWalletBalance } from '@/lib/wallet';
import { logAdminAction } from '@/lib/audit';
import { getExchangeRate, convertIqdToUsd } from '@/lib/currency';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;

    const payments = await db.payment.findMany({
      where,
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unauthorized' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { paymentId, action, notes, creditedAmount } = await req.json();

    if (!paymentId || !action) {
      return NextResponse.json({ error: 'Payment ID and action are required' }, { status: 400 });
    }

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { paymentMethod: true },
    });

    if (!payment) {
      return NextResponse.json({ error: 'الدفعة غير موجودة' }, { status: 404 });
    }

    if (payment.status !== 'PENDING') {
      return NextResponse.json({ error: 'هذه الدفعة تمت معالجتها مسبقاً' }, { status: 400 });
    }

    if (action === 'approve') {
      const exchangeRate = await getExchangeRate();
      const isIqdMethod = ['zain_cash', 'fastpay', 'fib', 'qi_card', 'manual'].includes(payment.paymentMethod.code);

      // Determine USD amount to credit:
      // If admin explicitly provided creditedAmount, use it.
      // If payment amount is IQD (e.g. >= 500), convert using exchange rate.
      let finalUsdAmount = payment.amount;
      if (creditedAmount !== undefined && !isNaN(parseFloat(creditedAmount)) && parseFloat(creditedAmount) > 0) {
        finalUsdAmount = parseFloat(creditedAmount);
      } else if (isIqdMethod && payment.amount >= 500) {
        finalUsdAmount = convertIqdToUsd(payment.amount, exchangeRate);
      }

      // Execute ALL actions inside a single atomic transaction
      const { updatedPayment, wallet } = await db.$transaction(async (tx) => {
        // 1. Guard check inside transaction (optimistic locking)
        const current = await tx.payment.findUnique({
          where: { id: paymentId },
        });

        if (!current || current.status !== 'PENDING') {
          throw new Error('هذه الدفعة تمت معالجتها مسبقاً من قبل مدير آخر');
        }

        // 2. Fetch or create user wallet
        let userWallet = await tx.wallet.findUnique({
          where: { userId: payment.userId },
        });

        if (!userWallet) {
          userWallet = await tx.wallet.create({
            data: {
              userId: payment.userId,
              balance: 0.0,
              currency: 'USD',
            },
          });
        }

        // 3. Atomically increment wallet balance
        const updatedWallet = await tx.wallet.update({
          where: { id: userWallet.id },
          data: {
            balance: {
              increment: finalUsdAmount,
            },
          },
        });

        // 4. Record wallet ledger transaction
        await tx.walletTransaction.create({
          data: {
            walletId: userWallet.id,
            amount: finalUsdAmount,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            referenceId: payment.id,
            description: `شحن رصيد مؤكد عبر ${payment.paymentMethod.name} (مرجع: ${payment.referenceNumber || 'لا يوجد'})`,
            metadata: JSON.stringify({
              paymentId: payment.id,
              submittedAmount: payment.amount,
              creditedUsd: finalUsdAmount,
              exchangeRateUsed: isIqdMethod && payment.amount >= 500 ? exchangeRate : null,
              approvedBy: admin.id,
            }),
          },
        });

        // 5. Update payment status to APPROVED
        const updatedPaymentRecord = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'APPROVED',
            approvedBy: admin.id,
            notes: notes || payment.notes,
          },
        });

        // 6. In-app notification
        await tx.notification.create({
          data: {
            userId: payment.userId,
            title: 'تم تأكيد شحن الرصيد بنجاح ✅',
            message: `تمت الموافقة على طلب الشحن وإيداع $${finalUsdAmount.toFixed(2)} في محفظتك. رصيدك الحالي: $${updatedWallet.balance.toFixed(2)}`,
            type: 'WALLET',
            link: '/wallet',
          },
        });

        return { updatedPayment: updatedPaymentRecord, wallet: updatedWallet };
      });

      // 7. Record audit log
      await logAdminAction({
        adminId: admin.id,
        action: 'PAYMENT_APPROVE',
        targetType: 'PAYMENT',
        targetId: paymentId,
        details: {
          submittedAmount: payment.amount,
          creditedUsd: finalUsdAmount,
          userId: payment.userId,
        },
      });

      return NextResponse.json({
        success: true,
        message: `تمت الموافقة على الدفعة بنجاح وإيداع $${finalUsdAmount.toFixed(2)} في المحفظة`,
        payment: updatedPayment,
        wallet,
      });
    } else if (action === 'reject') {
      const updatedPayment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REJECTED',
          approvedBy: admin.id,
          notes: notes || payment.notes,
        },
      });

      await db.notification.create({
        data: {
          userId: payment.userId,
          title: 'تم رفض طلب شحن الرصيد ❌',
          message: `تم رفض طلب الشحن بمبلغ $${payment.amount.toFixed(2)}. السبب: ${notes || 'بيانات التحويل غير مطابقة'}.`,
          type: 'WALLET',
          link: '/wallet',
        },
      });

      await logAdminAction({
        adminId: admin.id,
        action: 'PAYMENT_REJECT',
        targetType: 'PAYMENT',
        targetId: paymentId,
        details: { amount: payment.amount, userId: payment.userId, reason: notes },
      });

      return NextResponse.json({
        success: true,
        message: 'تم رفض الدفعة بنجاح',
        payment: updatedPayment,
      });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'فشل في معالجة الدفعة' }, { status: 400 });
  }
}
