import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { db } from './db/index.ts';
import { ingredients } from './db/schema.ts';
import { count } from 'drizzle-orm';
import type { HealthCheckResponse, IngredientDto } from '../shared/types.ts';
import { authRoutes } from './auth.ts';
import { seedIngredients } from './db/seed.ts';

export const app = new Hono();

const routes = app
  .route('/api/auth', authRoutes)
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
    }));

    if (query && query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      mapped = mapped.filter((item) => {
        const matchEn = item.primaryNameEn.toLowerCase().includes(q);
        const matchDe = item.primaryNameDe.toLowerCase().includes(q);
        const matchAlias = item.aliases.some((alias) => alias.toLowerCase().includes(q));
        return matchEn || matchDe || matchAlias;
      });
    }

    return c.json(mapped);
  });

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

    // Execute 2-pass idempotent ingredient seed
    await seedIngredients(db);
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
