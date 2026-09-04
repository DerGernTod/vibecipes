export type DietaryTrait = 'VEGAN' | 'VEGETARIAN' | 'OMNIVORE' | 'UNVERIFIED';

export interface IngredientDto {
  id: string;
  primaryNameEn: string;
  primaryNameDe: string;
  aliases: string[];
  densityGPerMl: number | null;
  defaultTrait: DietaryTrait;
  parentGroupId: string | null;
  imageUrl?: string | null;
}

export interface HealthCheckResponse {
  status: 'ok';
  timestamp: string;
  database: 'connected';
  ingredientCount: number;
}

export interface UserDto {
  id: string;
  username: string;
  displayName: string;
  createdAt: string;
}

export interface AuthStatusResponse {
  user: UserDto | null;
}

export interface RegisterOptionsRequest {
  username: string;
  displayName?: string;
}

export interface LoginOptionsRequest {
  username?: string;
}

export interface VerifyAuthResponse {
  verified: boolean;
  user?: UserDto;
  error?: string;
}

export interface RecipeStepIngredientDto {
  id: string;
  stepId: string;
  canonicalIngredientId: string;
  rawText: string;
  amount: number;
  unit: string;
  preparationNote: string | null;
  ingredient?: IngredientDto;
}

export interface RecipeStepDto {
  id: string;
  recipeId: string;
  stepIndex: number;
  instruction: string;
  timerSec: number | null;
  ingredients: RecipeStepIngredientDto[];
}

export interface AggregatedIngredientDto {
  canonicalIngredientId: string;
  ingredient?: IngredientDto;
  totalAmount: number;
  unit: string;
  preparationNotes: string[];
}

export interface RecipeDto {
  id: string;
  ownerId: string | null;
  ownerDisplayName?: string | null;
  title: string;
  description: string | null;
  servings: number;
  overrideTrait: DietaryTrait | null;
  calculatedTrait: DietaryTrait;
  effectiveTrait: DietaryTrait;
  imageUrl?: string | null;
  steps: RecipeStepDto[];
  aggregatedIngredients?: AggregatedIngredientDto[];
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateRecipeStepIngredientInput {
  canonicalIngredientId: string;
  rawText?: string;
  amount: number;
  unit: string;
  preparationNote?: string;
}

export interface CreateRecipeStepInput {
  instruction: string;
  timerSec?: number | null;
  ingredients: CreateRecipeStepIngredientInput[];
}

export interface CreateRecipeRequest {
  title: string;
  description?: string;
  servings?: number;
  overrideTrait?: DietaryTrait | null;
  imageUrl?: string | null;
  steps: CreateRecipeStepInput[];
}

export interface UpdateRecipeRequest {
  title?: string;
  description?: string;
  servings?: number;
  overrideTrait?: DietaryTrait | null;
  imageUrl?: string | null;
  steps?: CreateRecipeStepInput[];
}


