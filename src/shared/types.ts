export type DietaryTrait = 'VEGAN' | 'VEGETARIAN' | 'OMNIVORE' | 'UNVERIFIED';

export interface IngredientDto {
  id: string;
  primaryNameEn: string;
  primaryNameDe: string;
  aliases: string[];
  densityGPerMl: number | null;
  defaultTrait: DietaryTrait;
}

export interface HealthCheckResponse {
  status: 'ok';
  timestamp: string;
  database: 'connected';
  ingredientCount: number;
}
