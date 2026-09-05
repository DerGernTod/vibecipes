import * as cheerio from 'cheerio';

export function extractRecipeJsonLd(html: string): any | null {
  const $ = cheerio.load(html);
  let recipe: any = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).html();
      if (text) {
        const json = JSON.parse(text);
        const items = Array.isArray(json) ? json : (json['@graph'] ? json['@graph'] : [json]);
        
        for (const item of items) {
          const type = item['@type'];
          if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) {
            recipe = item;
            break;
          }
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
    if (recipe) return false; // break the cheerio each loop
  });

  return recipe;
}

export interface NormalizedIngredient {
  amount: number;
  unit: string;
  name: string;
  rawText: string;
}

const UNIT_MAP: Record<string, string> = {
  'cup': 'cup',
  'cups': 'cup',
  'tbsp': 'tbsp',
  'tablespoon': 'tbsp',
  'tablespoons': 'tbsp',
  'tsp': 'tsp',
  'teaspoon': 'tsp',
  'teaspoons': 'tsp',
  'g': 'g',
  'gram': 'g',
  'grams': 'g',
  'kg': 'kg',
  'kilogram': 'kg',
  'kilograms': 'kg',
  'ml': 'ml',
  'milliliter': 'ml',
  'milliliters': 'ml',
  'l': 'l',
  'liter': 'l',
  'liters': 'l',
  'oz': 'oz',
  'ounce': 'oz',
  'ounces': 'oz',
  'lb': 'lb',
  'pound': 'lb',
  'pounds': 'lb',
  'pinch': 'pinch',
  'pinches': 'pinch',
  'clove': 'clove',
  'cloves': 'clove'
};

export function normalizeIngredient(rawStr: string): NormalizedIngredient {
  const numRegex = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.\d+|\d+)\s*(.*)/;
  const match = rawStr.trim().match(numRegex);
  
  let amount = 1;
  let unit = 'pc';
  let name = rawStr.trim();
  
  if (match) {
    const numStr = match[1];
    const rest = match[2].trim();
    
    if (numStr.includes('/')) {
      const parts = numStr.split(/\s+/);
      if (parts.length === 2) {
        const [whole, frac] = parts;
        const [n, d] = frac.split('/').map(Number);
        amount = Number(whole) + (n / d);
      } else {
        const [n, d] = numStr.split('/').map(Number);
        amount = n / d;
      }
    } else {
      amount = Number(numStr);
    }
    
    const unitRegex = /^([a-zA-Z]+)\s*(.*)/;
    const unitMatch = rest.match(unitRegex);
    if (unitMatch) {
      const possibleUnit = unitMatch[1].toLowerCase();
      if (UNIT_MAP[possibleUnit]) {
        unit = UNIT_MAP[possibleUnit];
        name = unitMatch[2].trim();
      } else {
        name = rest;
      }
    } else {
      name = rest;
    }
  }
  
  return {
    amount,
    unit,
    name,
    rawText: rawStr
  };
}
