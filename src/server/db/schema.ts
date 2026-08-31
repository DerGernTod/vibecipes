import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const ingredients = sqliteTable('ingredients', {
  id: text('id').primaryKey(),
  primaryNameEn: text('primary_name_en').notNull(),
  primaryNameDe: text('primary_name_de').notNull(),
  aliasesJson: text('aliases_json').notNull(), // JSON array of string aliases
  densityGPerMl: real('density_g_per_ml'),
  defaultTrait: text('default_trait').notNull(), // 'VEGAN' | 'VEGETARIAN' | 'OMNIVORE'
});

export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  servings: integer('servings').notNull().default(4),
  overrideTrait: text('override_trait'),
  createdAt: text('created_at').notNull(),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  createdAt: text('created_at').notNull(),
});

export const authenticators = sqliteTable('authenticators', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  credentialId: text('credential_id').notNull().unique(),
  publicKey: text('public_key').notNull(),
  counter: integer('counter').notNull(),
  transports: text('transports'), // JSON array of AuthenticatorTransport
  createdAt: text('created_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

