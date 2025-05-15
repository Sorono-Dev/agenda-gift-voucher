import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export default async function (app: FastifyInstance) {
  const Item = z.object({ id: z.string(), name: z.string(), price: z.number() });
  const SaleBody = z.object({
    items: z.array(Item),
    payments: z.array(
      z.union([
        z.object({ method: z.literal('CARD'), amount: z.number() }),
        z.object({ method: z.literal('CASH'), amount: z.number() }),
        z.object({ method: z.literal('VOUCHER'), code: z.string(), amount: z.number() }),
      ])
    ),
  });

  app.post('/sales', async (req, rep) => {
    const body = SaleBody.parse(req.body);
    // TODO: déduire les bons cadeaux => appeler service.redeemVoucher
    // Enregistrer la vente simplifiée
    
    // Calcul du montant total de la vente
    const totalAmount = body.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Trouver le premier mode de paiement ou utiliser 'MIXED' s'il y en a plusieurs
    const paymentMethod = body.payments.length === 1 
      ? body.payments[0].method 
      : 'MIXED';
    
    // Extraire le code du voucher s'il existe
    const voucherPayment = body.payments.find(p => p.method === 'VOUCHER');
    const voucherCode = voucherPayment && 'code' in voucherPayment ? voucherPayment.code : undefined;
    
    await prisma.sale.create({ 
      data: { 
        amount: totalAmount,
        paymentMethod: paymentMethod.toString(),
        voucherCode: voucherCode,
        products: body.items as any // stocké comme Json
      } 
    });
    
    return rep.code(201).send({ status: 'ok' });
  });
}