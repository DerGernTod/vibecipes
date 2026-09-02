import { recipes, recipeSteps, recipeStepIngredients } from './schema.ts';
import { count, eq } from 'drizzle-orm';

export async function seedDemoRecipes(db: any) {
  try {
    const [{ value }] = await db.select({ value: count() }).from(recipes);
    if (Number(value) > 0) {
      return; // Already seeded
    }

    const now = new Date().toISOString();

    const demoRecipes = [
      {
        id: 'rec_pancakes',
        title: 'Fluffy Oat & Blueberry Pancakes',
        description: 'Golden, fluffy plant-based pancakes made with sifted flour and fresh oat milk.',
        servings: 4,
        imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
        steps: [
          {
            instruction: 'Whisk dry ingredients (flour, sugar, pinch of salt) together in a bowl.',
            ingredients: [
              { canonicalIngredientId: 'ing_flour', amount: 200, unit: 'g', rawText: '200g Flour' },
              { canonicalIngredientId: 'ing_sugar', amount: 20, unit: 'g', rawText: '20g Sugar' },
            ],
          },
          {
            instruction: 'Pour in oat milk and whisk until smooth batter forms. Cook on hot griddle.',
            ingredients: [
              { canonicalIngredientId: 'ing_oat_milk', amount: 300, unit: 'ml', rawText: '300ml Oat Milk' },
            ],
          },
        ],
      },
      {
        id: 'rec_avocado_toast',
        title: 'Creamy Avocado & Lime Toast',
        description: 'Fresh mashed avocado on toasted artisan sourdough bread topped with lime juice and chili flakes.',
        servings: 2,
        imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
        steps: [
          {
            instruction: 'Halve avocados, remove pit, and mash flesh with fresh lime juice and sea salt.',
            ingredients: [
              { canonicalIngredientId: 'ing_avocado', amount: 2, unit: 'piece', rawText: '2 Avocados' },
              { canonicalIngredientId: 'ing_lime', amount: 1, unit: 'piece', rawText: '1 Lime' },
              { canonicalIngredientId: 'ing_salt', amount: 3, unit: 'g', rawText: '3g Sea Salt' },
            ],
          },
        ],
      },
      {
        id: 'rec_mushroom_risotto',
        title: 'Truffle Mushroom Risotto',
        description: 'Rich, creamy Arborio rice slow-cooked with garlic butter and sautéed wild mushrooms.',
        servings: 3,
        imageUrl: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80',
        steps: [
          {
            instruction: 'Sauté minced garlic and sliced mushrooms in golden butter.',
            ingredients: [
              { canonicalIngredientId: 'ing_butter', amount: 50, unit: 'g', rawText: '50g Butter' },
              { canonicalIngredientId: 'ing_garlic', amount: 2, unit: 'piece', rawText: '2 Garlic Cloves' },
            ],
          },
        ],
      },
      {
        id: 'rec_pizza_margherita',
        title: 'Artisanal Neapolitan Pizza Margherita',
        description: 'Wood-fired crust with San Marzano tomato sauce, fresh mozzarella cheese, and sweet basil leaves.',
        servings: 2,
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
        steps: [
          {
            instruction: 'Stretch pizza dough, top with tomato sauce, mozzarella, and bake at 450°C for 2 minutes.',
            ingredients: [
              { canonicalIngredientId: 'ing_flour', amount: 250, unit: 'g', rawText: '250g Flour' },
              { canonicalIngredientId: 'ing_mozzarella', amount: 125, unit: 'g', rawText: '125g Mozzarella' },
              { canonicalIngredientId: 'ing_tomato', amount: 150, unit: 'g', rawText: '150g Tomato Sauce' },
            ],
          },
        ],
      },
      {
        id: 'rec_greek_salad',
        title: 'Classic Mediterranean Greek Salad',
        description: 'Crisp English cucumbers, ripe tomatoes, Kalamata olives, and rich feta cheese tossed in extra virgin olive oil.',
        servings: 2,
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        steps: [
          {
            instruction: 'Combine diced cucumbers, tomatoes, and red onion in a bowl. Drizzle extra virgin olive oil.',
            ingredients: [
              { canonicalIngredientId: 'ing_cucumber', amount: 1, unit: 'piece', rawText: '1 Cucumber' },
              { canonicalIngredientId: 'ing_tomato', amount: 2, unit: 'piece', rawText: '2 Tomatoes' },
              { canonicalIngredientId: 'ing_olive_oil', amount: 30, unit: 'ml', rawText: '30ml Olive Oil' },
            ],
          },
        ],
      },
      {
        id: 'rec_tonkotsu_ramen',
        title: 'Authentic Pork Tonkotsu Ramen',
        description: 'Rich 12-hour pork broth with handmade ramen noodles, tender chashu pork belly, and soft-boiled egg.',
        servings: 2,
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
        steps: [
          {
            instruction: 'Boil ramen noodles, ladle hot tonkotsu pork broth, and top with pork belly and ramen egg.',
            ingredients: [
              { canonicalIngredientId: 'ing_pork_belly', amount: 200, unit: 'g', rawText: '200g Pork Belly' },
              { canonicalIngredientId: 'ing_egg', amount: 2, unit: 'piece', rawText: '2 Eggs' },
            ],
          },
        ],
      },
    ];

    for (const item of demoRecipes) {
      await db.insert(recipes).values({
        id: item.id,
        title: item.title,
        description: item.description,
        servings: item.servings,
        imageUrl: item.imageUrl,
        createdAt: now,
        updatedAt: now,
      });

      for (let sIdx = 0; sIdx < item.steps.length; sIdx++) {
        const step = item.steps[sIdx];
        const stepId = `step_${item.id}_${sIdx + 1}`;

        await db.insert(recipeSteps).values({
          id: stepId,
          recipeId: item.id,
          stepIndex: sIdx,
          instruction: step.instruction,
        });

        for (const ing of step.ingredients) {
          await db.insert(recipeStepIngredients).values({
            id: `rsi_${crypto.randomUUID()}`,
            stepId,
            canonicalIngredientId: ing.canonicalIngredientId,
            rawText: ing.rawText,
            amount: ing.amount,
            unit: ing.unit,
          });
        }
      }
    }
  } catch (err) {
    console.error('Error seeding demo recipes:', err);
  }
}
