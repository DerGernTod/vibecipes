import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { importReportRequestSchema, type ImportReportRequest } from '../shared/schemas.ts';
import { parseJsonBody } from './parseBody.ts';

export const IMPORT_REPORTS_DIR = path.resolve('import-reports');

// One JSON file per report. The timestamp prefix keeps the directory listing in
// chronological order for whoever reads the reports later.
export async function saveImportReport(dir: string, report: ImportReportRequest): Promise<{ id: string }> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${createdAt.replace(/[:.]/g, '-')}_${id}.json`);
  await writeFile(file, JSON.stringify({ id, createdAt, ...report }, null, 2) + '\n', 'utf8');
  return { id };
}

export const importReportRoutes = new Hono().post('/', async (c) => {
  const parsed = await parseJsonBody(c, importReportRequestSchema);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const { id } = await saveImportReport(IMPORT_REPORTS_DIR, parsed.data);
  return c.json({ id }, 201);
});
