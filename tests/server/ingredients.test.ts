import { describe, it, expect, beforeAll } from 'vitest';
import { app, initDb } from '../../src/server/index.ts';
import { db } from '../../src/server/db/index.ts';
import { seedIngredients, CANONICAL_INGREDIENTS } from '../../src/server/db/seed.ts';
import type { IngredientDto } from '../../src/shared/types.ts';

describe('Canonical Ingredient Taxonomy & Seed Catalog API', () => {
  beforeAll(async () => {
    await initDb();
  });

  it('seeds canonical ingredients taxonomy into SQLite database (~68 ingredients)', async () => {
    const req = new Request('http://localhost/api/ingredients');
    const res = await app.fetch(req);

    expect(res.status).toBe(200);
    const list: IngredientDto[] = await res.json();
    expect(list.length).toBeGreaterThanOrEqual(60);
    expect(list.length).toBe(CANONICAL_INGREDIENTS.length);
  });

  it('2-pass seed script is idempotent and can be executed multiple times cleanly', async () => {
    await expect(seedIngredients(db)).resolves.not.toThrow();

    const req = new Request('http://localhost/api/ingredients');
    const res = await app.fetch(req);
    const list: IngredientDto[] = await res.json();
    expect(list.length).toBe(CANONICAL_INGREDIENTS.length);
  });

  it('populates parent_group_id relations correctly for smart substitutions', async () => {
    const req = new Request('http://localhost/api/ingredients');
    const res = await app.fetch(req);
    const list: IngredientDto[] = await res.json();

    const oatMilk = list.find((i) => i.id === 'ing_oat_milk');
    expect(oatMilk).toBeDefined();
    expect(oatMilk?.parentGroupId).toBe('ing_milk');

    const cheddar = list.find((i) => i.id === 'ing_cheddar');
    expect(cheddar).toBeDefined();
    expect(cheddar?.parentGroupId).toBe('ing_cheese');

    const milk = list.find((i) => i.id === 'ing_milk');
    expect(milk).toBeDefined();
    expect(milk?.parentGroupId).toBeNull();
  });

  it('filters ingredients by primary English/German names using GET /api/ingredients?q=...', async () => {
    const req = new Request('http://localhost/api/ingredients?q=Hafermilch');
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    const list: IngredientDto[] = await res.json();

    expect(list.some((i) => i.id === 'ing_oat_milk')).toBe(true);
  });

  it('matches ingredients against alias dictionaries (e.g. Süßrahmbutter -> Butter, Panko -> Breadcrumbs)', async () => {
    const reqButter = new Request('http://localhost/api/ingredients?q=S%C3%BC%C3%9Frahmbutter');
    const resButter = await app.fetch(reqButter);
    const listButter: IngredientDto[] = await resButter.json();
    expect(listButter.some((i) => i.id === 'ing_butter')).toBe(true);

    const reqPanko = new Request('http://localhost/api/ingredients?q=panko');
    const resPanko = await app.fetch(reqPanko);
    const listPanko: IngredientDto[] = await resPanko.json();
    expect(listPanko.some((i) => i.id === 'ing_breadcrumbs')).toBe(true);
  });

  it('returns empty array when query does not match any primary name or alias', async () => {
    const req = new Request('http://localhost/api/ingredients?q=nonexistent_xyz_ingredient');
    const res = await app.fetch(req);
    const list: IngredientDto[] = await res.json();
    expect(list).toEqual([]);
  });
});
