import type { z } from 'zod';
import { errorResponseSchema } from '../shared/schemas.ts';

// Accepts fetch Responses and Hono RPC responses alike; both expose `json()`.
type JsonSource = Pick<Response, 'json'>;

// Parses a successful response body against the shared schema for that endpoint.
// Throws a ZodError if the server sends a shape the client does not expect.
export async function readJson<T>(res: JsonSource, schema: z.ZodType<T>): Promise<T> {
  const data: unknown = await res.json();
  return schema.parse(data);
}

// Returns the server's `{ error }` message, or `fallback` when the body has none.
export async function readErrorMessage(res: JsonSource, fallback: string): Promise<string> {
  const data: unknown = await res.json().catch(() => undefined);
  const parsed = errorResponseSchema.safeParse(data);
  return (parsed.success && parsed.data.error) || fallback;
}
