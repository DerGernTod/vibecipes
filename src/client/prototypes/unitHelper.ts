import type { IngredientDto } from '../../shared/types.ts';

export type ValidUnit = 'g' | 'kg' | 'ml' | 'l' | 'piece' | 'tbsp' | 'tsp';

export function getValidUnitsForIngredient(ingredient?: IngredientDto | null): ValidUnit[] {
  if (!ingredient) {
    return ['g', 'ml', 'piece'];
  }

  // Count/piece items (density is null and name indicates count item)
  if (
    ingredient.densityGPerMl === null ||
    ingredient.id.includes('avocado') ||
    ingredient.id.includes('lime') ||
    ingredient.id.includes('lemon') ||
    ingredient.id.includes('egg') ||
    ingredient.id.includes('garlic') ||
    ingredient.id.includes('onion') ||
    ingredient.id.includes('apple') ||
    ingredient.id.includes('banana') ||
    ingredient.id.includes('tomato')
  ) {
    return ['piece'];
  }

  // Liquids (milk, oil, water, vinegar, sauce)
  if (
    ingredient.id.includes('milk') ||
    ingredient.id.includes('oil') ||
    ingredient.id.includes('water') ||
    ingredient.id.includes('vinegar') ||
    ingredient.id.includes('sauce') ||
    ingredient.id.includes('juice')
  ) {
    return ['ml', 'l', 'g', 'tbsp', 'tsp'];
  }

  // Powders, spices, solids (flour, salt, sugar, pepper, butter)
  return ['g', 'kg', 'tsp', 'tbsp'];
}

export function getDefaultUnitForIngredient(ingredient?: IngredientDto | null): ValidUnit {
  const units = getValidUnitsForIngredient(ingredient);
  return units[0];
}
