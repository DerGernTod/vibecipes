import { describe, it, expect } from 'vitest';
import { calculateRecipeDietaryTrait } from '../../src/domain/dietary.ts';
import type { DietaryTrait } from '../../src/shared/types.ts';

describe('calculateRecipeDietaryTrait', () => {
  it('returns VEGAN if no ingredients exist', () => {
    const result = calculateRecipeDietaryTrait([]);
    expect(result).toBe('VEGAN');
  });

  it('returns VEGAN when all ingredients are VEGAN', () => {
    const ingredients = [
      { defaultTrait: 'VEGAN' as DietaryTrait },
      { defaultTrait: 'VEGAN' as DietaryTrait },
    ];
    expect(calculateRecipeDietaryTrait(ingredients)).toBe('VEGAN');
  });

  it('returns VEGETARIAN when ingredients include VEGETARIAN and VEGAN', () => {
    const ingredients = [
      { defaultTrait: 'VEGAN' as DietaryTrait },
      { defaultTrait: 'VEGETARIAN' as DietaryTrait },
    ];
    expect(calculateRecipeDietaryTrait(ingredients)).toBe('VEGETARIAN');
  });

  it('returns OMNIVORE when any ingredient is OMNIVORE', () => {
    const ingredients = [
      { defaultTrait: 'VEGAN' as DietaryTrait },
      { defaultTrait: 'VEGETARIAN' as DietaryTrait },
      { defaultTrait: 'OMNIVORE' as DietaryTrait },
    ];
    expect(calculateRecipeDietaryTrait(ingredients)).toBe('OMNIVORE');
  });

  it('returns OMNIVORE even if UNVERIFIED ingredient is present alongside OMNIVORE', () => {
    const ingredients = [
      { defaultTrait: 'OMNIVORE' as DietaryTrait },
      { defaultTrait: 'UNVERIFIED' as DietaryTrait },
    ];
    expect(calculateRecipeDietaryTrait(ingredients)).toBe('OMNIVORE');
  });

  it('returns UNVERIFIED when an UNVERIFIED ingredient is present and no OMNIVORE', () => {
    const ingredients = [
      { defaultTrait: 'VEGAN' as DietaryTrait },
      { defaultTrait: 'UNVERIFIED' as DietaryTrait },
    ];
    expect(calculateRecipeDietaryTrait(ingredients)).toBe('UNVERIFIED');
  });

  it('honors manual overrideTrait over calculated trait', () => {
    const ingredients = [
      { defaultTrait: 'OMNIVORE' as DietaryTrait },
    ];
    expect(calculateRecipeDietaryTrait(ingredients, 'VEGAN')).toBe('VEGAN');
    expect(calculateRecipeDietaryTrait(ingredients, 'VEGETARIAN')).toBe('VEGETARIAN');
  });
});
