import type { DietaryTrait } from '../shared/types.ts';

export function calculateRecipeDietaryTrait(
  ingredients: Array<{ defaultTrait: DietaryTrait }>,
  overrideTrait?: DietaryTrait | null
): DietaryTrait {
  if (overrideTrait) {
    return overrideTrait;
  }

  let hasOmnivore = false;
  let hasUnverified = false;
  let hasVegetarian = false;

  for (const item of ingredients) {
    const trait = item.defaultTrait;
    if (trait === 'OMNIVORE') {
      hasOmnivore = true;
    } else if (trait === 'UNVERIFIED') {
      hasUnverified = true;
    } else if (trait === 'VEGETARIAN') {
      hasVegetarian = true;
    }
  }

  if (hasOmnivore) {
    return 'OMNIVORE';
  }
  if (hasUnverified) {
    return 'UNVERIFIED';
  }
  if (hasVegetarian) {
    return 'VEGETARIAN';
  }
  return 'VEGAN';
}
