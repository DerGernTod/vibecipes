import { serve } from '@hono/node-server';
import { db } from '../src/server/db/index.ts';
import { ingredients } from '../src/server/db/schema.ts';
import { count } from 'drizzle-orm';
import { Hono } from 'hono';

const app = new Hono();

app.get('/api/health', async (c) => {
  const [{ value }] = await db.select({ value: count() }).from(ingredients);
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected',
    ingredientCount: Number(value),
  });
});

app.get('/api/ingredients', async (c) => {
  const list = await db.select().from(ingredients);
  return c.json(list);
});

// Create table & seed if empty
const client = (db as any).$client;
await client.execute(`
  CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY,
    primary_name_en TEXT NOT NULL,
    primary_name_de TEXT NOT NULL,
    aliases_json TEXT NOT NULL,
    density_g_per_ml REAL,
    default_trait TEXT NOT NULL
  );
`);

const [{ value }] = await db.select({ value: count() }).from(ingredients);
if (Number(value) === 0) {
  await db.insert(ingredients).values([
    {
      id: 'ing_oat_milk',
      primaryNameEn: 'Oat Milk',
      primaryNameDe: 'Hafermilch',
      aliasesJson: JSON.stringify(['Oat Milk', 'Oatmilk', 'Hafermilch']),
      densityGPerMl: 1.03,
      defaultTrait: 'VEGAN',
    },
    {
      id: 'ing_butter',
      primaryNameEn: 'Butter',
      primaryNameDe: 'Butter',
      aliasesJson: JSON.stringify(['Butter', 'Unsalted Butter', 'Süßrahmbutter']),
      densityGPerMl: 0.911,
      defaultTrait: 'VEGETARIAN',
    },
  ]);
}

const server = serve({ fetch: app.fetch, port: 3001 });
console.log('Test Hono server running on port 3001');

const health = await fetch('http://localhost:3001/api/health').then((r) => r.json());
const ingredientList = await fetch('http://localhost:3001/api/ingredients').then((r) => r.json());

console.log('HEALTH RESPONSE:', JSON.stringify(health));
console.log('INGREDIENTS RESPONSE:', JSON.stringify(ingredientList));

server.close();
console.log('Server verified and closed successfully!');
