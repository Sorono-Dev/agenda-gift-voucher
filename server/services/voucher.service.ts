import { customAlphabet } from 'nanoid/non-secure';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

const genCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

export const listVouchers = async () => {
  return prisma.giftVoucher.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

export const createVoucher = async (payload: {
  type: 'AMOUNT' | 'SESSION' | 'PERCENT';
  value?: number;
  sessions?: number;
  percent?: number;
  expiresAt?: Date | null;
}) => {
  const code = genCode();
  return prisma.giftVoucher.create({
    data: {
      code,
      type: payload.type,
      initialValue: payload.value,
      remainingValue: payload.value,
      initialSessions: payload.sessions,
      remainingSessions: payload.sessions,
      percent: payload.percent,
      expiresAt: payload.expiresAt ?? null,
    },
  });
};

export const getVoucher = (code: string) =>
  prisma.giftVoucher.findUnique({ where: { code } });

export const redeemVoucher = async (code: string, amount = 0, sessions = 0) => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const v = await tx.giftVoucher.findUniqueOrThrow({ where: { code } });
    if (!v.isActive) throw new Error('Voucher inactive');

    const newRemaining = (v.remainingValue ?? 0) - amount;
    const newSessions = (v.remainingSessions ?? 0) - sessions;
    if (newRemaining < 0 || newSessions < 0) throw new Error('Insufficient balance');

    await tx.giftVoucher.update({
      where: { code },
      data: {
        remainingValue: newRemaining,
        remainingSessions: newSessions,
        isActive: newRemaining === 0 && newSessions === 0 ? false : true,
      },
    });

    await tx.redemption.create({
      data: { voucher: { connect: { code } }, amount, sessions },
    });
  });
};