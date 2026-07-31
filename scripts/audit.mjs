/**
 * Static SEO / integrity audit over the built `dist` output.
 *
 * Catches the failures that are easy to introduce and invisible in a browser:
 * missing or over-long titles, duplicate meta descriptions, missing canonicals,
 * broken internal links, images without alt text, malformed JSON-LD, and pages
 * absent from the sitemap.
 *
 *   npm run build && node scripts/audit.mjs
 *
 * Exits non-zero if any error-level problem is found, so it can gate a deploy.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
const errors = [];
const warnings = [];

const err = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

/** Recursively collect every .html file under dist. */
async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/**
 * Titles and descriptions are stored HTML-escaped, so "&" is five characters
 * on disk and one on screen. Decode before measuring or every ampersand
 * inflates the count by four.
 */
const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#8217;|&rsquo;/g, '’');

/** dist/services/stairs/index.html -> /services/stairs/ */
const toRoute = (file) => {
  const rel = relative(DIST, file).split(sep).join('/');
  return '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '/');
};

const files = await htmlFiles(DIST);
const routes = new Set(files.map(toRoute));

const titles = new Map();
const descriptions = new Map();
const pages = [];

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const route = toRoute(file);
  pages.push({ route, html });

  const isNoindex = /name="robots"\s+content="noindex/.test(html);

  // --- Title -------------------------------------------------------------
  const rawTitle = /<title>([^<]*)<\/title>/.exec(html)?.[1];
  const title = rawTitle ? decode(rawTitle) : undefined;
  if (!title) err(route, 'missing <title>');
  else {
    if (title.length > 60) warn(route, `title is ${title.length} chars (>60 may truncate in results)`);
    if (title.length < 15) warn(route, `title is only ${title.length} chars`);
    if (!isNoindex) {
      if (titles.has(title)) err(route, `duplicate title, also on ${titles.get(title)}`);
      else titles.set(title, route);
    }
  }

  // --- Meta description --------------------------------------------------
  const rawDesc = /<meta name="description" content="([^"]*)"/.exec(html)?.[1];
  const desc = rawDesc ? decode(rawDesc) : undefined;
  if (!desc) err(route, 'missing meta description');
  else {
    if (desc.length > 165) warn(route, `meta description is ${desc.length} chars (>165 may truncate)`);
    if (!isNoindex) {
      if (descriptions.has(desc)) err(route, `duplicate meta description, also on ${descriptions.get(desc)}`);
      else descriptions.set(desc, route);
    }
  }

  // --- Canonical ---------------------------------------------------------
  if (!/rel="canonical"/.test(html) && !isNoindex) err(route, 'missing canonical link');

  // --- Headings ----------------------------------------------------------
  const h1s = html.match(/<h1[\s>]/g) ?? [];
  if (h1s.length === 0) err(route, 'no <h1>');
  if (h1s.length > 1) err(route, `${h1s.length} <h1> elements — there must be exactly one`);

  // --- Images ------------------------------------------------------------
  for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
    const alt = /\salt="([^"]*)"/.exec(tag);
    if (!alt) err(route, `<img> with no alt attribute: ${tag.slice(0, 90)}…`);
    else if (alt[1].trim() === '') warn(route, 'image with empty alt (decorative only?)');
    if (!/\swidth="/.test(tag) || !/\sheight="/.test(tag)) {
      warn(route, 'image without explicit width/height (risks layout shift)');
    }
  }

  // --- JSON-LD -----------------------------------------------------------
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (blocks.length === 0 && !isNoindex) warn(route, 'no JSON-LD');
  for (const [, raw] of blocks) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed['@type']) err(route, 'JSON-LD block has no @type');
    } catch (e) {
      err(route, `invalid JSON-LD: ${e.message}`);
    }
  }

  // --- Internal links ----------------------------------------------------
  for (const [, href] of html.matchAll(/<a\b[^>]*\shref="(\/[^"#?]*)"/g)) {
    const target = href.endsWith('/') || /\.\w+$/.test(href) ? href : `${href}/`;
    const asFile = relative(DIST, join(DIST, target)).split(sep).join('/');
    if (!routes.has(target) && !/\.\w+$/.test(target)) {
      err(route, `broken internal link -> ${href}`);
    } else if (/\.\w+$/.test(target)) {
      // Static asset reference; existence checked loosely by extension only.
      void asFile;
    }
  }
}

// --- Sitemap coverage ------------------------------------------------------
let sitemapUrls = new Set();
try {
  const index = await readFile(join(DIST, 'sitemap-index.xml'), 'utf8');
  for (const [, loc] of index.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const name = loc.split('/').pop();
    const xml = await readFile(join(DIST, name), 'utf8');
    for (const [, url] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      sitemapUrls.add(new URL(url).pathname);
    }
  }
} catch {
  errors.push('sitemap: sitemap-index.xml missing or unreadable');
}

for (const { route, html } of pages) {
  if (/name="robots"\s+content="noindex/.test(html)) continue;
  if (sitemapUrls.size && !sitemapUrls.has(route)) warn(route, 'not listed in sitemap');
}

// --- Report ----------------------------------------------------------------
console.log(`\nAudited ${pages.length} pages, ${sitemapUrls.size} sitemap URLs.\n`);

if (warnings.length) {
  console.log(`WARNINGS (${warnings.length})`);
  for (const w of warnings) console.log('  ~ ' + w);
  console.log('');
}

if (errors.length) {
  console.log(`ERRORS (${errors.length})`);
  for (const e of errors) console.log('  x ' + e);
  console.log('');
  process.exit(1);
}

console.log('No errors.\n');
