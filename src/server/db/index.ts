import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.ts';

const client = createClient({
  url: 'file:vibecipes_prototype.db',
});

export const db = drizzle(client, { schema });
