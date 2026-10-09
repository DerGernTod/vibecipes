import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Guards the Ember palette against text/background pairs that fall below WCAG AA (4.5:1 for body text).
// Reads opaque hex tokens from theme.css so a token edit is checked without touching the test.

const themeCss = readFileSync(resolve(__dirname, '../../src/client/styles/theme.css'), 'utf8');

function token(name: string): string {
  const match = themeCss.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  if (!match) throw new Error(`theme.css has no opaque hex token --${name}`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg: string, bg: string): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

// [text token, background token] pairs used for body or UI text in the migrated kit and views.
const textPairs: Array<[string, string]> = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text', 'surface-2'],
  ['text', 'surface-inset'],
  ['text-soft', 'surface'],
  ['text-soft', 'surface-2'],
  ['muted', 'bg'],
  ['muted', 'surface'],
  ['muted', 'surface-2'],
  ['muted', 'surface-inset'],
  ['accent', 'bg'],
  ['accent', 'surface'],
  ['danger', 'surface'],
  ['danger', 'surface-inset'],
  ['vegan', 'surface-inset'],
  ['vegetarian', 'surface-inset'],
  ['omnivore', 'surface-inset'],
  ['unverified', 'surface-inset'],
  ['on-fill', 'fill'],
  ['on-fill', 'danger-fill'],
];

describe('theme contrast (WCAG AA, 4.5:1 for text)', () => {
  it.each(textPairs)('--%s on --%s', (fgName, bgName) => {
    const ratio = contrast(token(fgName), token(bgName));
    expect(ratio, `${fgName} on ${bgName} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });
});
