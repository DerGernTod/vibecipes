export type DietaryTrait = 'VEGAN' | 'VEGETARIAN' | 'OMNIVORE' | 'UNVERIFIED';

export interface IngredientDto {
  id: string;
  primaryNameEn: string;
  primaryNameDe: string;
  aliases: string[];
  densityGPerMl: number | null;
  defaultTrait: DietaryTrait;
  parentGroupId: string | null;
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

