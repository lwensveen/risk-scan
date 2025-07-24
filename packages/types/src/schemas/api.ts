import { z } from 'zod/v4';
import { categoryValues } from '../enums.js';

export const FlagsQuerySchema = z.object({
  tickers: z.string().optional(),
  category: z.enum(categoryValues).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  useCreatedAt: z.coerce.boolean().optional(),
});

export const SnapshotQuerySchema = z.object({
  ticker: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
