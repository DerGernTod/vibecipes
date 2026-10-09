import type { Context } from 'hono';
import type { z } from 'zod';

export type ParsedBody<T> = { ok: true; data: T } | { ok: false; error: string };

// Reads and validates a JSON request body. On failure, `error` is the first schema
// message, so schemas define the 400 text (e.g. "Recipe title is required").
export async function parseJsonBody<T>(c: Context, schema: z.ZodType<T>): Promise<ParsedBody<T>> {
  const raw: unknown = await c.req.json().catch(() => undefined);
  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.issues[0]?.message ?? 'Invalid request body' };
}
