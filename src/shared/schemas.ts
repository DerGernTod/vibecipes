import { z } from 'zod';

// Single source of truth for every JSON shape exchanged between client and server.
// Types are inferred; never hand-write a parallel interface.

export const dietaryTraitSchema = z.enum(['VEGAN', 'VEGETARIAN', 'OMNIVORE', 'UNVERIFIED']);
export type DietaryTrait = z.infer<typeof dietaryTraitSchema>;

export const errorResponseSchema = z.object({ error: z.string() });

export const ingredientDtoSchema = z.object({
  id: z.string(),
  primaryNameEn: z.string(),
  primaryNameDe: z.string(),
  aliases: z.array(z.string()),
  densityGPerMl: z.number().nullable(),
  defaultTrait: dietaryTraitSchema,
  parentGroupId: z.string().nullable(),
  imageUrl: z.string().nullish(),
});
export type IngredientDto = z.infer<typeof ingredientDtoSchema>;

export const healthCheckResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
  database: z.literal('connected'),
  ingredientCount: z.number(),
});
export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;

export const userDtoSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  createdAt: z.string(),
});
export type UserDto = z.infer<typeof userDtoSchema>;

export const authStatusResponseSchema = z.object({ user: userDtoSchema.nullable() });
export type AuthStatusResponse = z.infer<typeof authStatusResponseSchema>;

// Passkey flows. The browser library owns the full WebAuthn JSON; these schemas
// check the fields the client and server rely on and pass the rest through.
export const registerOptionsRequestSchema = z.object({
  username: z.string({ error: 'Username is required' }).trim().min(1, 'Username is required'),
  displayName: z.string().optional(),
});
export type RegisterOptionsRequest = z.infer<typeof registerOptionsRequestSchema>;

export const loginOptionsRequestSchema = z
  .object({ username: z.string().optional() })
  .optional();
export type LoginOptionsRequest = z.infer<typeof loginOptionsRequestSchema>;

export const registrationOptionsResponseSchema = z.looseObject({
  challenge: z.string(),
  rp: z.looseObject({ name: z.string() }),
  user: z.looseObject({ id: z.string(), name: z.string(), displayName: z.string() }),
  pubKeyCredParams: z.array(z.looseObject({ alg: z.number(), type: z.literal('public-key') })),
  authenticatorSelection: z.looseObject({ residentKey: z.enum(['discouraged', 'preferred', 'required']) }),
});

export const authenticationOptionsResponseSchema = z.looseObject({
  challenge: z.string(),
  rpId: z.string(),
});

export const authenticatorTransportSchema = z.enum([
  'ble',
  'cable',
  'hybrid',
  'internal',
  'nfc',
  'smart-card',
  'usb',
]);

export const registrationResponseSchema = z.looseObject({
  id: z.string(),
  rawId: z.string(),
  type: z.literal('public-key'),
  response: z.looseObject({
    clientDataJSON: z.string(),
    attestationObject: z.string(),
    transports: z.array(authenticatorTransportSchema).optional(),
  }),
  clientExtensionResults: z.looseObject({}),
});

export const authenticationResponseSchema = z.looseObject({
  id: z.string(),
  rawId: z.string(),
  type: z.literal('public-key'),
  response: z.looseObject({
    clientDataJSON: z.string(),
    authenticatorData: z.string(),
    signature: z.string(),
    userHandle: z.string().optional(),
  }),
  clientExtensionResults: z.looseObject({}),
});

// Success only. Failures come back as `errorResponseSchema`.
export const verifyAuthResponseSchema = z.object({
  verified: z.literal(true),
  user: userDtoSchema,
});
export type VerifyAuthResponse = z.infer<typeof verifyAuthResponseSchema>;

export const recipeStepIngredientDtoSchema = z.object({
  id: z.string(),
  stepId: z.string(),
  canonicalIngredientId: z.string(),
  rawText: z.string(),
  amount: z.number(),
  unit: z.string(),
  preparationNote: z.string().nullable(),
  ingredient: ingredientDtoSchema.optional(),
});
export type RecipeStepIngredientDto = z.infer<typeof recipeStepIngredientDtoSchema>;

// A step photo is a cropped image sent inline as a base64 data URL. Only raster image types are accepted.
const STEP_IMAGE_MAX_CHARS = 1_000_000;
export const stepImageDataUrlSchema = z
  .string()
  .max(STEP_IMAGE_MAX_CHARS, 'Step image is too large')
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/, 'Step image must be a JPEG, PNG or WebP data URL');

export const recipeStepDtoSchema = z.object({
  id: z.string(),
  recipeId: z.string(),
  stepIndex: z.number(),
  instruction: z.string(),
  timerSec: z.number().nullable(),
  imageUrl: z.string().nullish(),
  ingredients: z.array(recipeStepIngredientDtoSchema),
});
export type RecipeStepDto = z.infer<typeof recipeStepDtoSchema>;

export const aggregatedIngredientDtoSchema = z.object({
  canonicalIngredientId: z.string(),
  ingredient: ingredientDtoSchema.optional(),
  totalAmount: z.number(),
  unit: z.string(),
  preparationNotes: z.array(z.string()),
});
export type AggregatedIngredientDto = z.infer<typeof aggregatedIngredientDtoSchema>;

export const recipeDtoSchema = z.object({
  id: z.string(),
  ownerId: z.string().nullable(),
  ownerDisplayName: z.string().nullish(),
  title: z.string(),
  description: z.string().nullable(),
  servings: z.number(),
  overrideTrait: dietaryTraitSchema.nullable(),
  calculatedTrait: dietaryTraitSchema,
  effectiveTrait: dietaryTraitSchema,
  imageUrl: z.string().nullish(),
  steps: z.array(recipeStepDtoSchema),
  aggregatedIngredients: z.array(aggregatedIngredientDtoSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type RecipeDto = z.infer<typeof recipeDtoSchema>;

export const createRecipeStepIngredientSchema = z.object({
  canonicalIngredientId: z.string(),
  rawText: z.string().optional(),
  amount: z.number(),
  unit: z.string(),
  preparationNote: z.string().optional(),
});
export type CreateRecipeStepIngredientInput = z.infer<typeof createRecipeStepIngredientSchema>;

export const createRecipeStepSchema = z.object({
  instruction: z.string(),
  timerSec: z.number().nullish(),
  imageUrl: stepImageDataUrlSchema.nullish(),
  ingredients: z.array(createRecipeStepIngredientSchema),
});
export type CreateRecipeStepInput = z.infer<typeof createRecipeStepSchema>;

export const createRecipeRequestSchema = z.object({
  title: z.string({ error: 'Recipe title is required' }).trim().min(1, 'Recipe title is required'),
  description: z.string().optional(),
  servings: z.number().optional(),
  overrideTrait: dietaryTraitSchema.nullish(),
  imageUrl: z.string().nullish(),
  steps: z.array(createRecipeStepSchema),
});
export type CreateRecipeRequest = z.infer<typeof createRecipeRequestSchema>;

export const updateRecipeRequestSchema = z.object({
  title: z.string().trim().optional(),
  description: z.string().optional(),
  servings: z.number().optional(),
  overrideTrait: dietaryTraitSchema.nullish(),
  imageUrl: z.string().nullish(),
  steps: z.array(createRecipeStepSchema).optional(),
});
export type UpdateRecipeRequest = z.infer<typeof updateRecipeRequestSchema>;

export const importUrlRequestSchema = z.object({
  url: z.string({ error: 'URL is required' }).trim().min(1, 'URL is required'),
});

export const importedIngredientSchema = z.object({
  canonicalIngredientId: z.string(),
  rawText: z.string(),
  amount: z.number(),
  unit: z.string(),
  preparationNote: z.string().nullish(),
});
export type ImportedIngredient = z.infer<typeof importedIngredientSchema>;

export const importedRecipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  servings: z.number(),
  imageUrl: z.string().nullable(),
  ingredients: z.array(importedIngredientSchema),
});
export type ImportedRecipe = z.infer<typeof importedRecipeSchema>;

// A report about an import the user applied: the URL, the fetch's HTTP status, and the recipe the extractor returned.
export const importReportRequestSchema = z.object({
  url: z.string({ error: 'URL is required' }).trim().min(1, 'URL is required'),
  httpStatus: z.number().int(),
  importResult: importedRecipeSchema,
  userMessage: z.string().trim().max(2000).optional(),
});
export type ImportReportRequest = z.infer<typeof importReportRequestSchema>;

export const importReportResponseSchema = z.object({
  id: z.string(),
});

export const ingredientListSchema = z.array(ingredientDtoSchema);
export const recipeListSchema = z.array(recipeDtoSchema);
