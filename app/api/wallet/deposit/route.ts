import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { creditWalletBalance } from '@/lib/wallet';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { amount, paymentMethodId, referenceNumber, notes } = await req.json();

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json({ error: 'يرجى إدخال مبلغ صحيح' }, { status: 400 });
    }

    const method = await db.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!method || !method.status) {
      return NextResponse.json({ error: 'طريقة الدفع المختارة غير متوفرة' }, { status: 400 });
    }

    if (depositAmount < method.minDeposit || depositAmount > method.maxDeposit) {
      return NextResponse.json(
        {
          error: `المبلغ يجب أن يكون بين $${method.minDeposit.toFixed(2)} و $${method.maxDeposit.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Require reference number for payment verification
    if (!referenceNumber || referenceNumber.trim().length < 2) {
      return NextResponse.json(
        { error: 'يرجى إدخال الرقم المرجعي أو رقم الحوالة للتأكيد' },
        { status: 400 }
      );
    }

    const payment = await db.payment.create({
      data: {
        userId: user.id,
        amount: depositAmount,
        paymentMethodId: method.id,
        status: 'PENDING',
        referenceNumber: referenceNumber.trim(),
        notes: notes?.trim() || null,
      },
    });

    await db.notification.create({
      data: {
        userId: user.id,
        title: 'طلب شحن قيد المراجعة',
        message: `تم استلام طلب شحن بمبلغ $${depositAmount.toFixed(2)} عبر ${method.name}. سيتم التأكيد والإيداع فور التحقق.`,
        type: 'WALLET',
        link: '/wallet',
      },
    });

    return NextResponse.json({
      success: true,
      instant: false,
      message: 'تم إرسال طلب الشحن بنجاح وهو قيد المراجعة لدى الإدارة',
      payment,
    });
  } catch (error: any) {
    console.error('Deposit error:', error);
    return NextResponse.json({ error: error.message || 'فشل في معالجة طلب الشحن' }, { status: 500 });
  }
}
