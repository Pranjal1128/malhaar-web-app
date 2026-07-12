import { pgTable, text, jsonb, serial, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const malhaarData = pgTable('malhaar_data', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
});
