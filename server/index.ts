import Fastify from 'fastify';
import envPlugin from '@fastify/env';
import cors from '@fastify/cors';

import vouchersRoutes from './routes/vouchers.ts';
import salesRoutes    from './routes/sales.ts';

export const build = () => {
  const app = Fastify({ logger: true });

  // .env
  app.register(envPlugin, {
    dotenv: true,
    schema: {
      type: 'object',
      required: ['DATABASE_URL'],
      properties: { DATABASE_URL: { type: 'string' } },
    },
  });

  // Enable CORS
  app.register(cors, {
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });

  // Routes TS directement (Bun sait les importer)
  app.register(vouchersRoutes);
  app.register(salesRoutes);

  return app;
};

if (import.meta.main) {
  const app = build();
  app.listen({ port: 3001 }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}