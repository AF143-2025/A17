import db from './db';

export type TransactionType = 'DEPOSIT' | 'ORDER_PAYMENT' | 'REFUND' | 'ADJUSTMENT';

export interface WalletOperationParams {
  userId: string;
  amount: number;
  referenceId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface BalanceAdjustmentParams {
  adminId: string;
  userId: string;
  amount: number;
  reason: string;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Retrieves the user wallet. Creates one if it does not exist.
 */
export async function getOrCreateWallet(userId: string) {
  let wallet = await db.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    wallet = await db.wallet.create({
      data: {
        userId,
        balance: 0.0,
        currency: 'USD',
      },
    });
  }

  return wallet;
}

/**
 * Deducts funds from user wallet inside an atomic database transaction.
 * Throws an error if balance is insufficient or amount is invalid.
 */
export async function deductWalletBalance({
  userId,
  amount,
  referenceId,
  description,
  metadata,
}: WalletOperationParams) {
  if (amount <= 0) {
    throw new Error('المبلغ يجب أن يكون أكبر من الصفر');
  }

  return await db.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error('المحفظة غير موجودة');
    }

    if (wallet.balance < amount) {
      throw new Error(
        `رصيدك الحالي ($${wallet.balance.toFixed(2)}) غير كافٍ لإتمام العملية بمبلغ ($${amount.toFixed(2)})`
      );
    }

    // Atomic update
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    // Record ledger transaction
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -amount,
        type: 'ORDER_PAYMENT',
        status: 'COMPLETED',
        referenceId: referenceId || null,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return { wallet: updatedWallet, transaction };
  });
}

/**
 * Credits funds to user wallet (Deposit, Refund, Adjustment) inside an atomic database transaction.
 */
export async function creditWalletBalance({
  userId,
  amount,
  type = 'DEPOSIT',
  referenceId,
  description,
  metadata,
}: WalletOperationParams & { type?: TransactionType }) {
  if (amount <= 0) {
    throw new Error('المبلغ يجب أن يكون أكبر من الصفر');
  }

  return await db.$transaction(async (tx) => {
    let wallet = await tx.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId,
          balance: 0.0,
          currency: 'USD',
        },
      });
    }

    // Atomic update
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    // Record ledger transaction
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: amount,
        type: type,
        status: 'COMPLETED',
        referenceId: referenceId || null,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return { wallet: updatedWallet, transaction };
  });
}

/**
 * Admin balance adjustment with required audit log.
 */
export async function adjustWalletBalanceAdmin({
  adminId,
  userId,
  amount,
  reason,
  ipAddress,
}: BalanceAdjustmentParams) {
  return await db.$transaction(async (tx) => {
    let wallet = await tx.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId,
          balance: 0.0,
          currency: 'USD',
        },
      });
    }

    const previousBalance = wallet.balance;
    const newBalance = previousBalance + amount;

    if (newBalance < 0) {
      throw new Error('لا يمكن أن يصبح رصيد المحفظة سالبًا');
    }

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
      },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: amount,
        type: 'ADJUSTMENT',
        status: 'COMPLETED',
        description: `تعديل يدوي من الإدارة: ${reason}`,
        metadata: JSON.stringify({
          adminId,
          previousBalance,
          newBalance,
          reason,
        }),
      },
    });

    // Record audit log
    await tx.auditLog.create({
      data: {
        adminId,
        action: 'BALANCE_ADJUSTMENT',
        targetType: 'USER',
        targetId: userId,
        details: JSON.stringify({
          previousBalance,
          newBalance,
          adjustmentAmount: amount,
          reason,
        }),
        ipAddress: ipAddress || null,
      },
    });

    return { wallet: updatedWallet, transaction };
  });
}
