import { describe, it, expect, beforeAll } from 'vitest';
import { app, initDb } from '../../src/server/index.ts';
import type { RecipeDto, CreateRecipeRequest, UpdateRecipeRequest } from '../../src/shared/types.ts';

describe('Recipe CRUD & Auto-Dietary Inferencing API', () => {
  beforeAll(async () => {
    await initDb();
  });

  let createdRecipeId: string;

  it('POST /api/recipes creates a recipe with steps and step ingredients', async () => {
    const payload: CreateRecipeRequest = {
      title: 'Pancake Special',
      description: 'Fluffy vegan pancakes',
      servings: 4,
      steps: [
        {
          instruction: 'Mix dry ingredients',
          timerSec: 60,
          ingredients: [
            {
              canonicalIngredientId: 'ing_flour',
              amount: 200,
              unit: 'g',
              preparationNote: 'sifted',
            },
            {
              canonicalIngredientId: 'ing_sugar',
              amount: 20,
              unit: 'g',
            },
          ],
        },
        {
          instruction: 'Add oat milk and stir',
          ingredients: [
            {
              canonicalIngredientId: 'ing_oat_milk',
              amount: 300,
              unit: 'ml',
            },
          ],
        },
      ],
    };

    const req = new Request('http://localhost/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await app.fetch(req);
    expect(res.status).toBe(201);
    const data: RecipeDto = await res.json();

    expect(data.id).toBeDefined();
    expect(data.title).toBe('Pancake Special');
    expect(data.servings).toBe(4);
    expect(data.steps.length).toBe(2);
    expect(data.calculatedTrait).toBe('VEGAN');
    expect(data.effectiveTrait).toBe('VEGAN');

    createdRecipeId = data.id;
  });

  it('GET /api/recipes lists recipes', async () => {
    const req = new Request('http://localhost/api/recipes');
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    const list: RecipeDto[] = await res.json();

    expect(list.length).toBeGreaterThanOrEqual(1);
    const found = list.find((r) => r.id === createdRecipeId);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Pancake Special');
  });

  it('GET /api/recipes/:id returns detailed recipe with step ingredient populates and aggregated totals', async () => {
    const req = new Request(`http://localhost/api/recipes/${createdRecipeId}`);
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    const data: RecipeDto = await res.json();

    expect(data.id).toBe(createdRecipeId);
    expect(data.steps[0].ingredients[0].ingredient?.primaryNameEn).toBe('All-Purpose Flour');
    expect(data.aggregatedIngredients).toBeDefined();
    expect(data.aggregatedIngredients?.length).toBe(3);
  });

  it('PUT /api/recipes/:id updates recipe and handles dietary trait changes and manual override', async () => {
    // Add butter (VEGETARIAN) to step 2
    const updatePayload: UpdateRecipeRequest = {
      title: 'Pancake Deluxe',
      overrideTrait: 'VEGETARIAN',
      steps: [
        {
          instruction: 'Mix dry ingredients',
          ingredients: [
            {
              canonicalIngredientId: 'ing_flour',
              amount: 200,
              unit: 'g',
            },
          ],
        },
        {
          instruction: 'Melt butter and mix with oat milk',
          ingredients: [
            {
              canonicalIngredientId: 'ing_butter',
              amount: 50,
              unit: 'g',
              preparationNote: 'melted',
            },
            {
              canonicalIngredientId: 'ing_oat_milk',
              amount: 300,
              unit: 'ml',
            },
          ],
        },
      ],
    };

    const req = new Request(`http://localhost/api/recipes/${createdRecipeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });

    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    const data: RecipeDto = await res.json();

    expect(data.title).toBe('Pancake Deluxe');
    expect(data.overrideTrait).toBe('VEGETARIAN');
    expect(data.calculatedTrait).toBe('VEGETARIAN');
    expect(data.effectiveTrait).toBe('VEGETARIAN');
  });

  it('DELETE /api/recipes/:id removes the recipe', async () => {
    const reqDelete = new Request(`http://localhost/api/recipes/${createdRecipeId}`, {
      method: 'DELETE',
    });
    const resDelete = await app.fetch(reqDelete);
    expect(resDelete.status).toBe(200);

    const reqGet = new Request(`http://localhost/api/recipes/${createdRecipeId}`);
    const resGet = await app.fetch(reqGet);
    expect(resGet.status).toBe(404);
  });
});
