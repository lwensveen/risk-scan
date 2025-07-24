import { z } from 'zod/v4';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';

import {
  cikCacheTable,
  entitySnapshotsTable,
  riskFlagsTable,
} from './schema.js';

export const RiskFlagInsertSchema = createInsertSchema(riskFlagsTable);
export const RiskFlagUpdateSchema = createUpdateSchema(riskFlagsTable);
export const RiskFlagSelectSchema = createSelectSchema(riskFlagsTable);

export type RiskFlag = z.infer<typeof RiskFlagInsertSchema>;
export type RiskFlagUpdate = z.infer<typeof RiskFlagUpdateSchema>;
export type RiskFlagRow = z.infer<typeof RiskFlagSelectSchema>;

export const EntitySnapshotInsertSchema =
  createInsertSchema(entitySnapshotsTable);
export const EntitySnapshotUpdateSchema =
  createUpdateSchema(entitySnapshotsTable);
export const EntitySnapshotSelectSchema =
  createSelectSchema(entitySnapshotsTable);

export type EntitySnapshot = z.infer<typeof EntitySnapshotInsertSchema>;
export type EntitySnapshotUpdate = z.infer<typeof EntitySnapshotUpdateSchema>;
export type EntitySnapshotRow = z.infer<typeof EntitySnapshotSelectSchema>;

export const CikCacheInsertSchema = createInsertSchema(cikCacheTable);
export const CikCacheUpdateSchema = createUpdateSchema(cikCacheTable);
export const CikCacheSelectSchema = createSelectSchema(cikCacheTable);

export type CikCache = z.infer<typeof CikCacheInsertSchema>;
export type CikCacheUpdate = z.infer<typeof CikCacheUpdateSchema>;
export type CikCacheRow = z.infer<typeof CikCacheSelectSchema>;
