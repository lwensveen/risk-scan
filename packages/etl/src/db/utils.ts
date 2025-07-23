import { pgEnum, PgTimestampConfig, timestamp } from 'drizzle-orm/pg-core';
import { categoryValues, severityValues } from '@risk-scan/types';

export const severityPgEnum = pgEnum('severity', severityValues);
export const categoryPgEnum = pgEnum('risk_category', categoryValues);

export const defaultTimestampOptions: PgTimestampConfig = {
  withTimezone: true,
  mode: 'date',
};

export const createTimestampColumn = (
  columnName: string,
  isUpdatedColumn = false
) => {
  const column = timestamp(columnName, defaultTimestampOptions)
    .notNull()
    .defaultNow();
  return isUpdatedColumn ? column.$onUpdateFn(() => new Date()) : column;
};
