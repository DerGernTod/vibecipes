import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { extractRecipeJsonLd, normalizeIngredient } from '../../src/domain/import.ts';
import { app, initDb } from '../../src/server/index.ts';
import { importedRecipeSchema } from '../../src/shared/schemas.ts';

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

describe('POST /api/recipes/import-url', () => {
  beforeAll(async () => {
    await initDb();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function stubUpstream(html: string, init: ResponseInit = { status: 200 }) {
    return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(html, init));
  }

  function postImport(body: unknown) {
    return app.fetch(new Request('http://localhost/api/recipes/import-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }));
  }

  const flatPage = `
    <html><head><script type="application/ld+json">
      {
        "@context": "https://schema.org/",
        "@type": "Recipe",
        "name": "Pancakes",
        "description": "Fluffy pancakes",
        "recipeYield": "4 servings",
        "image": "https://example.com/pancakes.jpg",
        "recipeIngredient": ["2 cups flour", "1 1/2 tsp salt", "3 large eggs"]
      }
    </script></head></html>
  `;

  it('extracts title, description, servings, image and ingredients from a flat Recipe', async () => {
    stubUpstream(flatPage);

    const res = await postImport({ url: 'https://example.com/pancakes' });

    expect(res.status).toBe(200);
    const data = importedRecipeSchema.parse(await res.json());
    expect(data.title).toBe('Pancakes');
    expect(data.description).toBe('Fluffy pancakes');
    expect(data.servings).toBe(4);
    expect(data.imageUrl).toBe('https://example.com/pancakes.jpg');
    expect(data.ingredients).toHaveLength(3);

    const [flour, salt, eggs] = data.ingredients;
    expect(flour).toMatchObject({ canonicalIngredientId: 'ing_flour', amount: 2, unit: 'cup', rawText: '2 cups flour' });
    expect(salt).toMatchObject({ canonicalIngredientId: 'ing_salt', amount: 1.5, unit: 'tsp', rawText: '1 1/2 tsp salt' });
    expect(eggs).toMatchObject({ amount: 3, unit: 'pc', rawText: '3 large eggs' });
  });

  it('fetches the submitted URL with a browser-like User-Agent', async () => {
    const fetchSpy = stubUpstream(flatPage);

    await postImport({ url: 'https://example.com/pancakes' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe('https://example.com/pancakes');
    expect((calledInit?.headers as Record<string, string>)['User-Agent']).toContain('Mozilla/5.0');
  });

  it('finds a Recipe nested in an @graph alongside other types', async () => {
    stubUpstream(`
      <html><script type="application/ld+json">
        {
          "@context": "https://schema.org/",
          "@graph": [
            { "@type": "WebPage", "name": "Some page" },
            { "@type": "Recipe", "name": "Graph Soup", "recipeIngredient": ["1 tbsp butter"] }
          ]
        }
      </script></html>
    `);

    const res = await postImport({ url: 'https://example.com/soup' });

    expect(res.status).toBe(200);
    const data = importedRecipeSchema.parse(await res.json());
    expect(data.title).toBe('Graph Soup');
    expect(data.ingredients[0]).toMatchObject({ canonicalIngredientId: 'ing_butter', amount: 1, unit: 'tbsp' });
  });

  it('falls back to defaults when yield, name and image are missing', async () => {
    stubUpstream(`
      <html><script type="application/ld+json">
        { "@type": "Recipe", "recipeIngredient": [] }
      </script></html>
    `);

    const res = await postImport({ url: 'https://example.com/bare' });

    expect(res.status).toBe(200);
    const data = importedRecipeSchema.parse(await res.json());
    expect(data.title).toBe('Imported Recipe');
    expect(data.description).toBe('');
    expect(data.servings).toBe(4);
    expect(data.imageUrl).toBeNull();
    expect(data.ingredients).toEqual([]);
  });

  it('reads the servings count from a numeric recipeYield array', async () => {
    stubUpstream(`
      <html><script type="application/ld+json">
        { "@type": "Recipe", "name": "Batch", "recipeYield": ["12 cookies"] }
      </script></html>
    `);

    const res = await postImport({ url: 'https://example.com/batch' });

    const data = importedRecipeSchema.parse(await res.json());
    expect(data.servings).toBe(12);
  });

  it('returns 404 when the page has no Schema.org Recipe data', async () => {
    stubUpstream('<html><body><p>No recipe here</p></body></html>');

    const res = await postImport({ url: 'https://example.com/blog' });

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'No Schema.org Recipe data found on the page' });
  });

  it('returns 400 when the upstream page cannot be fetched', async () => {
    stubUpstream('', { status: 404, statusText: 'Not Found' });

    const res = await postImport({ url: 'https://example.com/missing' });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Failed to fetch URL: Not Found' });
  });

  it('returns 400 when no URL is provided', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const res = await postImport({});

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'URL is required' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
