import { describe, it, expect, beforeAll } from 'vitest';
import { app, initDb } from '../../src/server/index.ts';

describe('Server API Seam (app.fetch)', () => {
  beforeAll(async () => {
    await initDb();
  });

  it('GET /api/health returns 200 OK with database connection status', async () => {
    const req = new Request('http://localhost/api/health');
    const res = await app.fetch(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.database).toBe('connected');
    expect(typeof data.ingredientCount).toBe('number');
    expect(data.ingredientCount).toBeGreaterThan(0);
    expect(data.timestamp).toBeDefined();
  });

  it('GET /api/ingredients returns list of seeded ingredients', async () => {
    const req = new Request('http://localhost/api/ingredients');
    const res = await app.fetch(req);

    expect(res.status).toBe(200);
    const ingredients = await res.json();
    expect(Array.isArray(ingredients)).toBe(true);
    expect(ingredients.length).toBeGreaterThanOrEqual(2);

    const oatMilk = ingredients.find((i: any) => i.id === 'ing_oat_milk');
    expect(oatMilk).toBeDefined();
    expect(oatMilk.primaryNameEn).toBe('Oat Milk');
    expect(oatMilk.defaultTrait).toBe('VEGAN');
    expect(Array.isArray(oatMilk.aliases)).toBe(true);
  });
});
