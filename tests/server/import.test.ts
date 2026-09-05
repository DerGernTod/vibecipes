import { describe, it, expect } from 'vitest';
import { extractRecipeJsonLd, normalizeIngredient } from '../../src/domain/import.ts';

describe('normalizeIngredient', () => {
  it('parses whole numbers and known units', () => {
    expect(normalizeIngredient('2 cups chopped onions')).toEqual({
      amount: 2,
      unit: 'cup',
      name: 'chopped onions',
      rawText: '2 cups chopped onions',
    });
  });

  it('parses fractions', () => {
    expect(normalizeIngredient('1 1/2 tsp salt')).toEqual({
      amount: 1.5,
      unit: 'tsp',
      name: 'salt',
      rawText: '1 1/2 tsp salt',
    });
    
    expect(normalizeIngredient('1/2 g pepper')).toEqual({
      amount: 0.5,
      unit: 'g',
      name: 'pepper',
      rawText: '1/2 g pepper',
    });
  });

  it('parses decimals', () => {
    expect(normalizeIngredient('1.5 oz cheese')).toEqual({
      amount: 1.5,
      unit: 'oz',
      name: 'cheese',
      rawText: '1.5 oz cheese',
    });
  });

  it('falls back when unit is unknown', () => {
    expect(normalizeIngredient('3 large eggs')).toEqual({
      amount: 3,
      unit: 'pc',
      name: 'large eggs',
      rawText: '3 large eggs',
    });
  });

  it('falls back when no number is present', () => {
    expect(normalizeIngredient('salt to taste')).toEqual({
      amount: 1,
      unit: 'pc',
      name: 'salt to taste',
      rawText: 'salt to taste',
    });
  });
});

describe('extractRecipeJsonLd', () => {
  it('extracts flat recipe', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org/",
              "@type": "Recipe",
              "name": "Test Recipe",
              "description": "A delicious test",
              "recipeYield": "4 servings",
              "recipeIngredient": [
                "2 cups flour",
                "1 cup sugar"
              ]
            }
          </script>
        </head>
      </html>
    `;
    const result = extractRecipeJsonLd(html);
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Test Recipe');
    expect(result?.description).toBe('A delicious test');
    expect(result?.recipeYield).toBe('4 servings');
    expect(result?.recipeIngredient).toEqual(['2 cups flour', '1 cup sugar']);
  });

  it('extracts from @graph array', () => {
    const html = `
      <html>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org/",
            "@graph": [
              {
                "@type": "Article",
                "name": "Some article"
              },
              {
                "@type": "Recipe",
                "name": "Graph Recipe"
              }
            ]
          }
        </script>
      </html>
    `;
    const result = extractRecipeJsonLd(html);
    expect(result?.name).toBe('Graph Recipe');
  });

  it('handles array of @type', () => {
    const html = `
      <html>
        <script type="application/ld+json">
          {
            "@type": ["Recipe", "HowTo"],
            "name": "Array Type Recipe"
          }
        </script>
      </html>
    `;
    const result = extractRecipeJsonLd(html);
    expect(result?.name).toBe('Array Type Recipe');
  });
});
