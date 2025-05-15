import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as service from '../services/voucher.service';
import QRCode from 'qrcode';

export default async function (app: FastifyInstance) {
  const CreateVoucher = z.object({
    type: z.enum(['AMOUNT', 'SESSION', 'PERCENT']),
    value: z.number().positive().optional(),
    sessions: z.number().int().positive().optional(),
    percent: z.number().int().min(1).max(100).optional(),
    expiresAt: z.string().optional(), // ISO
  });

  app.get('/vouchers', async (req, rep) => {
    const vouchers = await service.listVouchers();
    return vouchers;
  });

  app.post('/vouchers', async (req, rep) => {
    const payload = CreateVoucher.parse(req.body);
    const voucher = await service.createVoucher({
      ...payload,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
    });
    const qrSvg = await QRCode.toString(voucher.code, { type: 'svg' });
    return rep.code(201).send({ ...voucher, qrSvg });
  });

  app.get('/vouchers/:code', async (req, rep) => {
    const { code } = req.params as { code: string };
    const voucher = await service.getVoucher(code);
    if (!voucher) return rep.code(404).send({ message: 'Not found' });
    return voucher;
  });

  app.post('/vouchers/:code/redeem', async (req, rep) => {
    const { code } = req.params as { code: string };
    const body = z
      .object({ amount: z.number().optional(), sessions: z.number().int().optional() })
      .parse(req.body);
    try {
      await service.redeemVoucher(code, body.amount ?? 0, body.sessions ?? 0);
      return { status: 'ok' };
    } catch (e: any) {
      return rep.code(400).send({ message: e.message });
    }
  });
}