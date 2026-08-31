# Drizzle ORM SQLite Schema Design & Canonical Ingredient Starter Taxonomy Seed Strategy

**Document Status:** Complete / Architectural Research  
**Target Issue:** Issue #3  
**Domain Alignment:** Matches `CONTEXT.md` & `plan.md`  

---

## 1. Executive Summary

This research report provides the complete Drizzle ORM SQLite schema specification and canonical ingredient taxonomy seed strategy for Vibecipes (Issue #3).

### Key Architectural Decisions:
1. **Drizzle ORM for SQLite**: Utilizing `drizzle-orm/sqlite-core` for type-safe SQLite schema definition. SQLite supports standard scalar types (`text`, `integer`, `real`). Booleans are stored as `integer({ mode: 'boolean' })`, timestamps as `integer({ mode: 'timestamp' })` or ISO strings in `text`, and JSON payloads (aliases, snapshot JSON) as `text` fields.
2. **WebAuthn / Passkeys (`authenticators`)**: Passkey authentication requires storing WebAuthn credential metadata (credential ID, public key, counter, device type, backup state, transports list).
3. **Step-Based Ingredients & Canonical Taxonomy**: Recipes separate procedural instructions (`recipe_steps`) from step-specific ingredient allocations (`recipe_step_ingredients`). Step ingredients reference `canonical_ingredients` which store localized EN/DE primary names, search aliases, volumetric densities ($g/ml$), default dietary traits (`VEGAN`, `VEGETARIAN`, `OMNIVORE`), and parent links for smart substitutions.
4. **Hierarchical Collections & Access Controls**: Collections support self-referencing tree structures (`parentId`). A join table `recipe_collections` manages M:N recipe-to-collection mapping. Access controls (`share_permissions`) handle per-recipe, per-collection, and global (`SHARE_ALL`) permissions with `VIEWER` or `EDITOR` roles.
5. **Idempotent 2-Pass Seeding Strategy**: Seeding ~65 core starter canonical ingredients handles self-referencing `parentGroupId` relationships using a two-pass insertion strategy to avoid foreign key dependency order conflicts.

---

## 2. Drizzle ORM SQLite Schema Definition (`src/db/schema.ts`)

```typescript
import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// ==========================================
// 1. USERS & WEBAUTHN AUTHENTICATORS
// ==========================================

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const authenticators = sqliteTable('authenticators', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  credentialId: text('credential_id').notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  credentialPublicKey: text('credential_public_key').notNull(), // Base64 / Hex encoded public key
  counter: integer('counter').notNull().default(0),
  credentialDeviceType: text('credential_device_type').notNull(), // e.g., 'singleDevice' | 'multiDevice'
  credentialBackedUp: integer('credential_backed_up', { mode: 'boolean' }).notNull().default(false),
  transports: text('transports'), // JSON string array e.g. '["internal","hybrid"]'
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  userIdIdx: index('idx_authenticators_user_id').on(table.userId),
}));

// ==========================================
// 2. CANONICAL INGREDIENTS & TAXONOMY
// ==========================================

export const canonicalIngredients = sqliteTable('canonical_ingredients', {
  id: text('id').primaryKey(), // e.g. "ing_oat_milk", "ing_olive_oil"
  primaryNameEn: text('primary_name_en').notNull(),
  primaryNameDe: text('primary_name_de').notNull(),
  aliasesJson: text('aliases_json').notNull(), // JSON string array of EN & DE aliases
  densityGPerMl: real('density_g_per_ml'), // Volumetric mass density in g/mL (null for count/piece items)
  defaultTrait: text('default_trait', { enum: ['VEGAN', 'VEGETARIAN', 'OMNIVORE'] }).notNull(),
  parentGroupId: text('parent_group_id').references((): any => canonicalIngredients.id, {
    onDelete: 'set null',
  }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  parentIdx: index('idx_canonical_ingredients_parent').on(table.parentGroupId),
}));

// ==========================================
// 3. RECIPES, STEPS & INGREDIENT ALLOCATIONS
// ==========================================

export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  servings: integer('servings').notNull().default(4),
  overrideTrait: text('override_trait', { enum: ['VEGAN', 'VEGETARIAN', 'OMNIVORE'] }), // Null = calculated from ingredients
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  isUnlisted: integer('is_unlisted', { mode: 'boolean' }).notNull().default(false),
  currentVersion: integer('current_version').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  ownerIdx: index('idx_recipes_owner').on(table.ownerId),
  publicIdx: index('idx_recipes_public').on(table.isPublic),
}));

export const recipeSteps = sqliteTable('recipe_steps', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  recipeId: text('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  stepIndex: integer('step_index').notNull(),
  instruction: text('instruction').notNull(),
  timerSec: integer('timer_sec'),
}, (table) => ({
  recipeStepIdx: index('idx_recipe_steps_recipe_index').on(table.recipeId, table.stepIndex),
}));

export const recipeStepIngredients = sqliteTable('recipe_step_ingredients', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  stepId: text('step_id')
    .notNull()
    .references(() => recipeSteps.id, { onDelete: 'cascade' }),
  canonicalIngredientId: text('canonical_ingredient_id')
    .notNull()
    .references(() => canonicalIngredients.id, { onDelete: 'restrict' }),
  rawText: text('raw_text').notNull(), // Original text parsed or input
  amount: real('amount').notNull(),
  unit: text('unit').notNull(), // Base metric unit: "g", "ml", "piece"
  preparationNote: text('preparation_note'), // e.g. "finely chopped", "melted"
}, (table) => ({
  stepIdx: index('idx_recipe_step_ingredients_step').on(table.stepId),
  ingredientIdx: index('idx_recipe_step_ingredients_canonical').on(table.canonicalIngredientId),
}));

// ==========================================
// 4. REVISIONS HISTORY
// ==========================================

export const recipeRevisions = sqliteTable('recipe_revisions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  recipeId: text('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  editNote: text('edit_note'),
  snapshotJson: text('snapshot_json').notNull(), // Complete JSON snapshot of recipe, steps, ingredients
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  recipeVersionIdx: uniqueIndex('idx_recipe_revisions_recipe_version').on(table.recipeId, table.version),
}));

// ==========================================
// 5. COLLECTIONS & JOIN TABLE
// ==========================================

export const collections = sqliteTable('collections', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  parentId: text('parent_id').references((): any => collections.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  ownerIdx: index('idx_collections_owner').on(table.ownerId),
  parentIdx: index('idx_collections_parent').on(table.parentId),
}));

export const recipeCollections = sqliteTable('recipe_collections', {
  recipeId: text('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  collectionId: text('collection_id')
    .notNull()
    .references(() => collections.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.recipeId, table.collectionId] }),
  collectionIdx: index('idx_recipe_collections_collection').on(table.collectionId),
}));

// ==========================================
// 6. PANTRY ITEMS
// ==========================================

export const pantryItems = sqliteTable('pantry_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  canonicalIngredientId: text('canonical_ingredient_id')
    .notNull()
    .references(() => canonicalIngredients.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  unit: text('unit').notNull(), // "g", "ml", "piece"
  isStaple: integer('is_staple', { mode: 'boolean' }).notNull().default(false), // Salt, pepper, water, oil
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  userIngredientIdx: uniqueIndex('idx_pantry_user_ingredient').on(table.userId, table.canonicalIngredientId),
}));

// ==========================================
// 7. SHARE PERMISSIONS
// ==========================================

export const sharePermissions = sqliteTable('share_permissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  grantorId: text('grantor_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  granteeId: text('grantee_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  scope: text('scope', { enum: ['RECIPE', 'COLLECTION', 'SHARE_ALL'] }).notNull(),
  role: text('role', { enum: ['VIEWER', 'EDITOR'] }).notNull(),
  recipeId: text('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }),
  collectionId: text('collection_id').references(() => collections.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  granteeIdx: index('idx_share_permissions_grantee').on(table.granteeId),
  grantorIdx: index('idx_share_permissions_grantor').on(table.grantorId),
}));
```

---

## 3. Canonical Ingredient Starter Taxonomy Data (~65 Core Ingredients)

The starter dataset spans 10 major culinary categories with bilingual primary names, aliases, densities ($g/mL$), default traits, and parent substitution links.

---

## 4. Idempotent Two-Pass Seed Strategy Script (`src/db/seed.ts`)

Because canonical ingredients contain self-referencing foreign keys (`parentGroupId`), inserting items with parent references out-of-order can violate foreign key constraints in SQLite. A **Two-Pass Insertion Strategy** solves this cleanly:

1. **Pass 1 (Base Insert)**: Insert all canonical ingredients into `canonical_ingredients` with `parentGroupId = null`. Use `ON CONFLICT (id) DO UPDATE` to refresh English/German names, aliases, densities, and traits.
2. **Pass 2 (Parent Link Resolution)**: Execute a second pass updating `parentGroupId` for items that specify a valid substitution parent.

---

## 5. Domain Logic Integration Guidelines

### 5.1 Unit Densities & Conversion Formulas
The density field `density_g_per_ml` ($\rho$ in $g/mL$) enables automatic dynamic conversions between mass ($g$) and volume ($mL$):

$$\text{Mass } (g) = \text{Volume } (mL) \times \rho$$
$$\text{Volume } (mL) = \frac{\text{Mass } (g)}{\rho}$$

* **Example 1**: $100\,mL$ of Extra Virgin Olive Oil ($\rho = 0.92\,g/mL$) $\rightarrow 92\,g$.
* **Example 2**: $200\,g$ of All-Purpose Flour ($\rho = 0.53\,g/mL$) $\rightarrow 377.36\,mL$.
* If `densityGPerMl` is `null`, mass-to-volume cross-conversions are disabled, and only direct unit scaling is permitted.

### 5.2 Dynamic Dietary Trait Calculation Algorithm
Per `CONTEXT.md`, recipe trait is auto-calculated from constituent step ingredients unless an explicit creator override (`overrideTrait`) is set.

---
*Report generated for main agent execution on GitHub issue #3.*
