import { describe, expect, it } from 'vitest';
import { createTimestampColumn } from './utils.js';
import { pgTable, text } from 'drizzle-orm/pg-core';

describe('createTimestampColumn', () => {
  it('works in a table definition', () => {
    const myTable = pgTable('my_table', {
      id: text('id').primaryKey(),
      createdAt: createTimestampColumn('createdAt'),
      updatedAt: createTimestampColumn('updatedAt', true),
    });

    expect(myTable).toBeDefined();
    expect(myTable.createdAt).toBeDefined();
    expect(myTable.updatedAt).toBeDefined();
  });
});
