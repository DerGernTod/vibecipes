import { describe, it, expect, beforeAll } from 'vitest';
import { app, initDb } from '../../src/server/index.ts';
import { recipeDtoSchema, type CreateRecipeRequest } from '../../src/shared/schemas.ts';

// 1x1 transparent PNG.
const PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const post = (body: unknown) =>
  app.fetch(
    new Request('http://localhost/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );

const baseRecipe = (imageUrl?: string | null): CreateRecipeRequest => ({
  title: 'Photo Import Test',
  servings: 2,
  steps: [
    { instruction: 'Whisk the batter', timerSec: null, imageUrl, ingredients: [] },
    { instruction: 'Fry until golden', timerSec: 120, ingredients: [] },
  ],
});

describe('Step image slots', () => {
  beforeAll(async () => {
    await initDb();
  });

  it('stores a step image and returns it on the recipe detail', async () => {
    const res = await post(baseRecipe(PNG_DATA_URL));
    expect(res.status).toBe(201);
    const created = recipeDtoSchema.parse(await res.json());

    expect(created.steps[0].imageUrl).toBe(PNG_DATA_URL);
    expect(created.steps[1].imageUrl ?? null).toBeNull();

    const detail = recipeDtoSchema.parse(
      await (await app.fetch(new Request(`http://localhost/api/recipes/${created.id}`))).json()
    );
    expect(detail.steps[0].imageUrl).toBe(PNG_DATA_URL);
  });

  it('replaces and clears step images on update', async () => {
    const created = recipeDtoSchema.parse(await (await post(baseRecipe(PNG_DATA_URL))).json());

    const update: CreateRecipeRequest = { ...baseRecipe(null), title: 'Photo Import Test' };
    const res = await app.fetch(
      new Request(`http://localhost/api/recipes/${created.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })
    );
    expect(res.status).toBe(200);
    const updated = recipeDtoSchema.parse(await res.json());
    expect(updated.steps[0].imageUrl ?? null).toBeNull();
  });

  it('rejects step images that are not inline raster data URLs', async () => {
    const remote = await post(baseRecipe('https://example.com/step.jpg'));
    expect(remote.status).toBe(400);

    const script = await post(baseRecipe('javascript:alert(1)'));
    expect(script.status).toBe(400);

    const svg = await post(baseRecipe('data:image/svg+xml;base64,PHN2Zy8+'));
    expect(svg.status).toBe(400);
  });
});
