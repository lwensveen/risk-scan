import { FastifyInstance, FastifyRequest } from 'fastify';
import getRawBody from 'raw-body';

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: string;
  }
}

export function registerGetRawBodyHook(app: FastifyInstance) {
  app.addHook('onRequest', async (req: FastifyRequest) => {
    if (req.method === 'POST' && req.url === '/internal/riskscan-daily') {
      req.rawBody = (await getRawBody(req.raw)).toString('utf8');
    }
  });
}
