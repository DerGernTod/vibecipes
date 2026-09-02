import { Hono } from 'hono';
import { eq, inArray } from 'drizzle-orm';
import { db } from './db/index.ts';
import { recipes, recipeSteps, recipeStepIngredients, ingredients, users, sessions } from './db/schema.ts';
import { getSignedCookie } from 'hono/cookie';
import { calculateRecipeDietaryTrait } from '../domain/dietary.ts';
import type {
  RecipeDto,
  RecipeStepDto,
  RecipeStepIngredientDto,
  AggregatedIngredientDto,
  IngredientDto,
  CreateRecipeRequest,
  UpdateRecipeRequest,
  DietaryTrait,
} from '../shared/types.ts';

const COOKIE_SECRET = process.env.COOKIE_SECRET || 'vibecipes-dev-secret-key-32-chars-minimum!';

async function getOptionalUserId(c: any): Promise<string | null> {
  try {
    const sessionId = await getSignedCookie(c, COOKIE_SECRET, 'vibecipes_session');
    if (!sessionId) return null;
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });
    if (!session || new Date(session.expiresAt) < new Date()) return null;
    return session.userId;
  } catch {
    return null;
  }
}

export async function buildRecipeDto(recipeId: string): Promise<RecipeDto | null> {
  const recipeRow = await db.query.recipes.findFirst({
    where: eq(recipes.id, recipeId),
  });

  if (!recipeRow) return null;

  let ownerDisplayName: string | null = null;
  if (recipeRow.ownerId) {
    const owner = await db.query.users.findFirst({
      where: eq(users.id, recipeRow.ownerId),
    });
    if (owner) {
      ownerDisplayName = owner.displayName;
    }
  }

  const stepsRows = await db
    .select()
    .from(recipeSteps)
    .where(eq(recipeSteps.recipeId, recipeId))
    .orderBy(recipeSteps.stepIndex);

  const stepIds = stepsRows.map((s) => s.id);

  let stepIngRows: typeof recipeStepIngredients.$inferSelect[] = [];
  if (stepIds.length > 0) {
    stepIngRows = await db
      .select()
      .from(recipeStepIngredients)
      .where(inArray(recipeStepIngredients.stepId, stepIds));
  }

  const ingredientIds = Array.from(new Set(stepIngRows.map((si) => si.canonicalIngredientId)));
  let ingredientMap = new Map<string, IngredientDto>();
  if (ingredientIds.length > 0) {
    const ingRows = await db
      .select()
      .from(ingredients)
      .where(inArray(ingredients.id, ingredientIds));

    for (const item of ingRows) {
      ingredientMap.set(item.id, {
        id: item.id,
        primaryNameEn: item.primaryNameEn,
        primaryNameDe: item.primaryNameDe,
        aliases: JSON.parse(item.aliasesJson),
        densityGPerMl: item.densityGPerMl,
        defaultTrait: item.defaultTrait as DietaryTrait,
        parentGroupId: item.parentGroupId ?? null,
      });
    }
  }

  const stepsDto: RecipeStepDto[] = stepsRows.map((step) => {
    const stepIngs = stepIngRows
      .filter((si) => si.stepId === step.id)
      .map((si) => {
        const ingDto = ingredientMap.get(si.canonicalIngredientId);
        const dto: RecipeStepIngredientDto = {
          id: si.id,
          stepId: si.stepId,
          canonicalIngredientId: si.canonicalIngredientId,
          rawText: si.rawText,
          amount: si.amount,
          unit: si.unit,
          preparationNote: si.preparationNote ?? null,
          ingredient: ingDto,
        };
        return dto;
      });

    return {
      id: step.id,
      recipeId: step.recipeId,
      stepIndex: step.stepIndex,
      instruction: step.instruction,
      timerSec: step.timerSec ?? null,
      ingredients: stepIngs,
    };
  });

  // Calculate Dietary Trait
  const allConstituentTraits: Array<{ defaultTrait: DietaryTrait }> = [];
  for (const step of stepsDto) {
    for (const ing of step.ingredients) {
      const trait = ing.ingredient?.defaultTrait || 'UNVERIFIED';
      allConstituentTraits.push({ defaultTrait: trait });
    }
  }

  const calculatedTrait = calculateRecipeDietaryTrait(allConstituentTraits);
  const overrideTrait = (recipeRow.overrideTrait as DietaryTrait) || null;
  const effectiveTrait = calculateRecipeDietaryTrait(allConstituentTraits, overrideTrait);

  // Build Aggregated Ingredients
  const aggMap = new Map<string, AggregatedIngredientDto>();
  for (const step of stepsDto) {
    for (const ing of step.ingredients) {
      const key = `${ing.canonicalIngredientId}_${ing.unit}`;
      const existing = aggMap.get(key);
      const notes = ing.preparationNote ? [ing.preparationNote] : [];
      if (existing) {
        existing.totalAmount += ing.amount;
        if (ing.preparationNote && !existing.preparationNotes.includes(ing.preparationNote)) {
          existing.preparationNotes.push(ing.preparationNote);
        }
      } else {
        aggMap.set(key, {
          canonicalIngredientId: ing.canonicalIngredientId,
          ingredient: ing.ingredient,
          totalAmount: ing.amount,
          unit: ing.unit,
          preparationNotes: notes,
        });
      }
    }
  }

  return {
    id: recipeRow.id,
    ownerId: recipeRow.ownerId ?? null,
    ownerDisplayName,
    title: recipeRow.title,
    description: recipeRow.description ?? null,
    servings: recipeRow.servings,
    overrideTrait,
    calculatedTrait,
    effectiveTrait,
    steps: stepsDto,
    aggregatedIngredients: Array.from(aggMap.values()),
    createdAt: recipeRow.createdAt,
    updatedAt: recipeRow.updatedAt ?? null,
  };
}

export const recipeRoutes = new Hono()
  .get('/', async (c) => {
    const allRecipes = await db.select().from(recipes);
    const result: RecipeDto[] = [];
    for (const r of allRecipes) {
      const dto = await buildRecipeDto(r.id);
      if (dto) {
        result.push(dto);
      }
    }
    return c.json(result);
  })

  .get('/:id', async (c) => {
    const id = c.req.param('id');
    const dto = await buildRecipeDto(id);
    if (!dto) {
      return c.json({ error: 'Recipe not found' }, 404);
    }
    return c.json(dto);
  })

  .post('/', async (c) => {
    const body = await c.req.json<CreateRecipeRequest>();
    if (!body.title || body.title.trim().length === 0) {
      return c.json({ error: 'Recipe title is required' }, 400);
    }

    const userId = await getOptionalUserId(c);
    const now = new Date().toISOString();
    const recipeId = crypto.randomUUID();

    await db.insert(recipes).values({
      id: recipeId,
      ownerId: userId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      servings: body.servings && body.servings > 0 ? body.servings : 4,
      overrideTrait: body.overrideTrait || null,
      createdAt: now,
      updatedAt: now,
    });

    if (body.steps && Array.isArray(body.steps)) {
      for (let idx = 0; idx < body.steps.length; idx++) {
        const stepInput = body.steps[idx];
        const stepId = crypto.randomUUID();

        await db.insert(recipeSteps).values({
          id: stepId,
          recipeId,
          stepIndex: idx,
          instruction: stepInput.instruction || '',
          timerSec: stepInput.timerSec ?? null,
        });

        if (stepInput.ingredients && Array.isArray(stepInput.ingredients)) {
          for (const ingInput of stepInput.ingredients) {
            const rawText = ingInput.rawText || `${ingInput.amount}${ingInput.unit} ${ingInput.canonicalIngredientId}`;
            await db.insert(recipeStepIngredients).values({
              id: crypto.randomUUID(),
              stepId,
              canonicalIngredientId: ingInput.canonicalIngredientId,
              rawText,
              amount: ingInput.amount,
              unit: ingInput.unit,
              preparationNote: ingInput.preparationNote || null,
            });
          }
        }
      }
    }

    const dto = await buildRecipeDto(recipeId);
    return c.json(dto, 201);
  })

  .put('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.query.recipes.findFirst({ where: eq(recipes.id, id) });
    if (!existing) {
      return c.json({ error: 'Recipe not found' }, 404);
    }

    const body = await c.req.json<UpdateRecipeRequest>();
    const now = new Date().toISOString();

    await db
      .update(recipes)
      .set({
        title: body.title !== undefined ? body.title.trim() : existing.title,
        description: body.description !== undefined ? (body.description ? body.description.trim() : null) : existing.description,
        servings: body.servings !== undefined ? body.servings : existing.servings,
        overrideTrait: body.overrideTrait !== undefined ? body.overrideTrait : existing.overrideTrait,
        updatedAt: now,
      })
      .where(eq(recipes.id, id));

    if (body.steps && Array.isArray(body.steps)) {
      // Delete existing steps (cascades to step ingredients)
      const existingSteps = await db.select().from(recipeSteps).where(eq(recipeSteps.recipeId, id));
      for (const es of existingSteps) {
        await db.delete(recipeStepIngredients).where(eq(recipeStepIngredients.stepId, es.id));
      }
      await db.delete(recipeSteps).where(eq(recipeSteps.recipeId, id));

      // Re-insert new steps
      for (let idx = 0; idx < body.steps.length; idx++) {
        const stepInput = body.steps[idx];
        const stepId = crypto.randomUUID();

        await db.insert(recipeSteps).values({
          id: stepId,
          recipeId: id,
          stepIndex: idx,
          instruction: stepInput.instruction || '',
          timerSec: stepInput.timerSec ?? null,
        });

        if (stepInput.ingredients && Array.isArray(stepInput.ingredients)) {
          for (const ingInput of stepInput.ingredients) {
            const rawText = ingInput.rawText || `${ingInput.amount}${ingInput.unit} ${ingInput.canonicalIngredientId}`;
            await db.insert(recipeStepIngredients).values({
              id: crypto.randomUUID(),
              stepId,
              canonicalIngredientId: ingInput.canonicalIngredientId,
              rawText,
              amount: ingInput.amount,
              unit: ingInput.unit,
              preparationNote: ingInput.preparationNote || null,
            });
          }
        }
      }
    }

    const dto = await buildRecipeDto(id);
    return c.json(dto, 200);
  })

  .delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await db.query.recipes.findFirst({ where: eq(recipes.id, id) });
    if (!existing) {
      return c.json({ error: 'Recipe not found' }, 404);
    }

    const existingSteps = await db.select().from(recipeSteps).where(eq(recipeSteps.recipeId, id));
    for (const es of existingSteps) {
      await db.delete(recipeStepIngredients).where(eq(recipeStepIngredients.stepId, es.id));
    }
    await db.delete(recipeSteps).where(eq(recipeSteps.recipeId, id));
    await db.delete(recipes).where(eq(recipes.id, id));

    return c.json({ success: true }, 200);
  });
