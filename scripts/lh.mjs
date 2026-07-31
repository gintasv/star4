/**
 * Lighthouse run against the *built* output, which is what actually ships.
 *
 *   npx astro build && npx astro preview --port 4322 &
 *   node scripts/lh.mjs
 *
 * Runs a representative page of each template type rather than every page.
 */
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const BASE = process.env.LH_BASE ?? 'http://localhost:4322';

// chrome-launcher also removes its temp profile from the child's exit handler,
// outside any await we control. On Windows that fires EPERM as an uncaught
// exception well after the results are in. Ignore that one case only.
process.on('uncaughtException', (e) => {
  if (e?.code === 'EPERM' && String(e.path ?? '').includes('lighthouse.')) return;
  throw e;
});

const PAGES = [
  ['/', 'home'],
  ['/services/stairs/', 'service'],
  ['/areas/hinsdale/', 'area'],
  ['/projects/carpet-to-oak-stair-treads/', 'project'],
  ['/contact/', 'contact'],
];

// Thresholds we expect to hold. SEO and accessibility are the ones that must
// not regress; performance has some machine-to-machine variance.
const MIN = { performance: 90, accessibility: 95, 'best-practices': 90, seo: 100 };

const chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox'] });
const results = [];
let failed = false;

for (const [path, label] of PAGES) {
  const runner = await lighthouse(
    BASE + path,
    { port: chrome.port, output: 'json', logLevel: 'error' },
    {
      extends: 'lighthouse:default',
      settings: { formFactor: 'desktop', screenEmulation: { disabled: true } },
    },
  );

  // A missing page still produces a report, but scores every category zero.
  // Without this the table silently reads as a catastrophic regression when the
  // real problem is a stale path in this file.
  if (runner.lhr.runtimeError) {
    await chrome.kill().catch(() => {});
    console.error(
      `\n${path} could not be audited: ${runner.lhr.runtimeError.message}\n` +
        'If the page was renamed or removed, update PAGES in scripts/lh.mjs.',
    );
    process.exit(1);
  }

  const cats = runner.lhr.categories;
  const row = { page: label, path };
  for (const key of Object.keys(MIN)) {
    row[key] = Math.round(cats[key].score * 100);
    if (row[key] < MIN[key]) failed = true;
  }

  const a = runner.lhr.audits;
  row.LCP = a['largest-contentful-paint'].displayValue;
  row.CLS = a['cumulative-layout-shift'].displayValue;
  results.push(row);
}

// On Windows the temp-profile cleanup can throw EPERM while Chrome still holds
// a handle. That is a teardown detail, not a result — never let it discard the
// measurements we just spent a minute collecting.
try {
  await chrome.kill();
} catch (e) {
  console.warn(`(chrome cleanup: ${e.code ?? e.message} — ignored)`);
}

console.table(results);
console.log(`\nThresholds: ${JSON.stringify(MIN)}`);

if (failed) {
  console.error('\nAt least one category is below threshold.');
  process.exit(1);
}
console.log('All pages meet thresholds.\n');
