import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { saveImportReport } from '../../src/server/importReports.ts';
import { importReportRequestSchema } from '../../src/shared/schemas.ts';

const extracted = {
  title: 'Fluffy Pancakes',
  description: '',
  servings: 2,
  imageUrl: null,
  ingredients: [{ canonicalIngredientId: 'ing_flour', rawText: '200 g flour', amount: 200, unit: 'g' }],
};

async function readStored(dir: string): Promise<Record<string, unknown>> {
  const [file] = await readdir(dir);
  return JSON.parse(await readFile(path.join(dir, file!), 'utf8')) as Record<string, unknown>;
}

describe('saveImportReport', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'import-reports-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('writes one JSON file per report, named after its id', async () => {
    const { id } = await saveImportReport(dir, {
      url: 'https://example.com/pancakes',
      httpStatus: 200,
      importResult: extracted,
      userMessage: 'Title is missing "fluffy"',
    });

    const files = await readdir(dir);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain(id);

    const stored = await readStored(dir);
    expect(stored).toMatchObject({
      id,
      url: 'https://example.com/pancakes',
      httpStatus: 200,
      importResult: extracted,
      userMessage: 'Title is missing "fluffy"',
    });
    expect(typeof stored.createdAt).toBe('string');
  });

  it('omits userMessage when the user left the note empty', async () => {
    await saveImportReport(dir, {
      url: 'https://example.com/pancakes',
      httpStatus: 200,
      importResult: extracted,
    });

    expect(await readStored(dir)).not.toHaveProperty('userMessage');
  });

  it('rejects a report without an extracted recipe', () => {
    expect(
      importReportRequestSchema.safeParse({ url: 'https://example.com/x', httpStatus: 200 }).success,
    ).toBe(false);
  });
});
