/**
 * WCAG contrast check over the design tokens.
 *
 * The palette came from a design mockup, not from an accessibility audit, so
 * several of the warm accents only work on some backgrounds. This encodes
 * which pairings are actually allowed and fails if one stops passing — much
 * cheaper than rediscovering it in a Lighthouse run.
 *
 *   node scripts/contrast.mjs
 */
import { readFile } from 'node:fs/promises';

const css = await readFile('src/styles/tokens.css', 'utf8');

/** Pull `--name: #rrggbb;` pairs straight from the token file. */
const tokens = Object.fromEntries(
  [...css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map(([, k, v]) => [k, v.toLowerCase()]),
);

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const linear = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex) => {
  const [r, g, b] = channels(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const LIGHT = ['cream', 'bone', 'sand', 'sage', 'sage-light', 'tan'];
const DARK = ['ink', 'header', 'green-deep', 'green-dark', 'green-panel'];

// [foreground, backgrounds, minimum, why]
const RULES = [
  ['accent-text', LIGHT, 4.5, 'small accent type on light surfaces'],
  ['text-on-light', LIGHT, 4.5, 'body copy on light surfaces'],
  ['text-on-light-muted', LIGHT, 4.5, 'muted copy on light surfaces'],
  ['orange', DARK, 4.5, 'micro-labels on dark surfaces'],
  ['text-on-dark', DARK, 4.5, 'body copy on dark surfaces'],
  ['text-on-dark-muted', DARK, 4.5, 'muted copy on dark surfaces'],
  ['cream', ['terracotta'], 4.5, 'button label on the terracotta fill'],
];

let failed = false;

for (const [fg, backgrounds, min, why] of RULES) {
  if (!tokens[fg]) {
    console.error(`x unknown token --${fg}`);
    failed = true;
    continue;
  }
  for (const bg of backgrounds) {
    if (!tokens[bg]) {
      console.error(`x unknown token --${bg}`);
      failed = true;
      continue;
    }
    const r = ratio(tokens[fg], tokens[bg]);
    const ok = r >= min;
    if (!ok) failed = true;
    console.log(
      `${ok ? 'pass' : 'FAIL'}  ${r.toFixed(2).padStart(5)}  --${fg} on --${bg}${ok ? '' : `   (needs ${min} — ${why})`}`,
    );
  }
}

// --orange must never be used as text on a light surface. Assert the reason
// stays true so the rule in tokens.css is not quietly wrong.
for (const bg of LIGHT) {
  const r = ratio(tokens.orange, tokens[bg]);
  if (r >= 4.5) {
    console.log(`note  --orange now passes on --${bg} (${r.toFixed(2)}); the dark-only rule could be relaxed`);
  }
}

console.log(failed ? '\nContrast failures present.\n' : '\nAll token pairings pass.\n');
process.exit(failed ? 1 : 0);
