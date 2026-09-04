import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const ingredients = sqliteTable('ingredients', {
  id: text('id').primaryKey(),
  primaryNameEn: text('primary_name_en').notNull(),
  primaryNameDe: text('primary_name_de').notNull(),
  aliasesJson: text('aliases_json').notNull(), // JSON array of string aliases
  densityGPerMl: real('density_g_per_ml'),
  defaultTrait: text('default_trait').notNull(), // 'VEGAN' | 'VEGETARIAN' | 'OMNIVORE'
  parentGroupId: text('parent_group_id'),
  imageUrl: text('image_url'),
});

export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  servings: integer('servings').notNull().default(4),
  overrideTrait: text('override_trait'),
  imageUrl: text('image_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at'),
});

export const recipeSteps = sqliteTable('recipe_steps', {
  id: text('id').primaryKey(),
  recipeId: text('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  stepIndex: integer('step_index').notNull(),
  instruction: text('instruction').notNull(),
  timerSec: integer('timer_sec'),
});

export const recipeStepIngredients = sqliteTable('recipe_step_ingredients', {
  id: text('id').primaryKey(),
  stepId: text('step_id')
    .notNull()
    .references(() => recipeSteps.id, { onDelete: 'cascade' }),
  canonicalIngredientId: text('canonical_ingredient_id')
    .notNull()
    .references(() => ingredients.id, { onDelete: 'cascade' }),
  rawText: text('raw_text').notNull(),
  amount: real('amount').notNull(),
  unit: text('unit').notNull(),
  preparationNote: text('preparation_note'),
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

