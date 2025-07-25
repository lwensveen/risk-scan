import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { RiskFlag } from './types.js';
import { sql } from 'drizzle-orm';
import { riskFlagsTable } from './schema.js';

export async function persistFlags(flags: RiskFlag[], pool?: Pool) {
  if (flags.length === 0) return { inserted: 0 };

  const pgPool =
    pool ?? new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pgPool);

  const rows = flags.map((f) => ({
    category: f.category,
    ticker: f.ticker,
    flags: f.flags,
    severity: f.severity,
  }));

  await db
    .insert(riskFlagsTable)
    .values(rows)
    .onConflictDoUpdate({
      target: [
        riskFlagsTable.category,
        riskFlagsTable.ticker,
        riskFlagsTable.updatedAt,
      ],
      set: {
        flags: sql`EXCLUDED.flags`,
        severity: sql`EXCLUDED.severity`,
      },
    });

  return { inserted: rows.length };
}
