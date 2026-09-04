import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { db } from './db/index.ts';
import { ingredients } from './db/schema.ts';
import { count } from 'drizzle-orm';
import type { HealthCheckResponse, IngredientDto } from '../shared/types.ts';
import { authRoutes } from './auth.ts';
import { recipeRoutes } from './recipes.ts';
import { seedIngredients } from './db/seed.ts';
import { seedDemoRecipes } from './db/seedRecipes.ts';

export const app = new Hono();

const routes = app
  .route('/api/auth', authRoutes)
  .route('/api/recipes', recipeRoutes)
  .get('/api/health', async (c) => {
    const [{ value }] = await db.select({ value: count() }).from(ingredients);
    const res: HealthCheckResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      ingredientCount: Number(value),
    };
    return c.json(res);
  })
  .get('/api/ingredients', async (c) => {
    const query = c.req.query('q') || c.req.query('query');
    const list = await db.select().from(ingredients);

    let mapped: IngredientDto[] = list.map((item) => ({
      id: item.id,
      primaryNameEn: item.primaryNameEn,
      primaryNameDe: item.primaryNameDe,
      aliases: JSON.parse(item.aliasesJson),
      densityGPerMl: item.densityGPerMl,
      defaultTrait: item.defaultTrait as any,
      parentGroupId: item.parentGroupId ?? null,
      imageUrl: item.imageUrl ?? null,
    }));

    if (query && query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      mapped = mapped.filter((item) => {
        const matchEn = fuzzyMatch(q, item.primaryNameEn);
        const matchDe = fuzzyMatch(q, item.primaryNameDe);
        const matchAlias = item.aliases.some((alias) => fuzzyMatch(q, alias));
        return matchEn || matchDe || matchAlias;
      });
    }

    return c.json(mapped);
  });

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (t.includes(q)) return true;

  const qTokens = q.split(/\s+/);
  const tTokens = t.split(/\s+/);
  if (qTokens.every((qt) => tTokens.some((tt) => tt.startsWith(qt) || tt.includes(qt)))) {
    return true;
  }

  if (q.length >= 4) {
    for (const tt of tTokens) {
      if (levenshteinDistance(q, tt) <= (q.length > 6 ? 2 : 1)) {
        return true;
      }
    }
  }
  return false;
}

export type AppType = typeof routes;

// Auto seed SQLite table on startup
export async function initDb() {
  try {
    const client = (db as any).$client;
    try {
      await client.execute(`PRAGMA journal_mode = WAL;`);
      await client.execute(`PRAGMA busy_timeout = 5000;`);
    } catch {
      // Ignored if unsupported
    }
    await client.execute(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id TEXT PRIMARY KEY,
        primary_name_en TEXT NOT NULL,
        primary_name_de TEXT NOT NULL,
        aliases_json TEXT NOT NULL,
        density_g_per_ml REAL,
        default_trait TEXT NOT NULL,
        parent_group_id TEXT
      );
    `);
    try {
      await client.execute(`ALTER TABLE ingredients ADD COLUMN parent_group_id TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE ingredients ADD COLUMN image_url TEXT;`);
    } catch {
      // Column already exists
    }

    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS authenticators (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        credential_id TEXT NOT NULL UNIQUE,
        public_key TEXT NOT NULL,
        counter INTEGER NOT NULL,
        transports TEXT,
        created_at TEXT NOT NULL
      );
    `);
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        servings INTEGER NOT NULL DEFAULT 4,
        override_trait TEXT,
        image_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );
    `);
    try {
      await client.execute(`ALTER TABLE recipes ADD COLUMN owner_id TEXT REFERENCES users(id) ON DELETE CASCADE;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE recipes ADD COLUMN updated_at TEXT;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE recipes ADD COLUMN image_url TEXT;`);
    } catch {}

    await client.execute(`
      CREATE TABLE IF NOT EXISTS recipe_steps (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        step_index INTEGER NOT NULL,
        instruction TEXT NOT NULL,
        timer_sec INTEGER
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS recipe_step_ingredients (
        id TEXT PRIMARY KEY,
        step_id TEXT NOT NULL REFERENCES recipe_steps(id) ON DELETE CASCADE,
        canonical_ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
        raw_text TEXT NOT NULL,
        amount REAL NOT NULL,
        unit TEXT NOT NULL,
        preparation_note TEXT
      );
    `);

    // Execute 2-pass idempotent ingredient seed
    await seedIngredients(db);
    // Seed demo recipes with high-res food images
    await seedDemoRecipes(db);
  } catch (err) {
    console.error('Error auto-initializing database:', err);
  }
}

await initDb();

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT || 3000);
  console.log(`[Server] Hono API server running on http://localhost:${port}`);

  serve({
    fetch: app.fetch,
    port,
  });
}
