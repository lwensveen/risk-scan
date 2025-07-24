import type { FastifyCachingOptions } from '@fastify/caching';

declare module 'fastify' {
  interface FastifyContextConfig {
    cache?: FastifyCachingOptions;
  }
}
