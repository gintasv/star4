/**
 * Development screenshot helper.
 *
 * Drives the locally installed Chrome via puppeteer-core (no bundled Chromium
 * download) to capture full-page screenshots of the dev server, so layout can
 * be checked against the approved design without a visible browser window.
 *
 *   node scripts/shoot.mjs /                 -> shots/home-desktop.png (+ mobile)
 *   node scripts/shoot.mjs /services/stairs/ stairs
 */
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];

const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!executablePath) {
  console.error('No Chrome or Edge found. Update CHROME_CANDIDATES in scripts/shoot.mjs.');
  process.exit(1);
}

const path = process.argv[2] ?? '/';
const name = process.argv[3] ?? 'home';
const base = process.env.SHOOT_BASE ?? 'http://localhost:4321';
const outDir = process.env.SHOOT_OUT ?? 'shots';

const viewports = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile', width: 390, height: 844, isMobile: true },
];

await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  protocolTimeout: 90000,
  args: ['--no-sandbox', '--force-color-profile=srgb', '--hide-scrollbars'],
});

for (const vp of viewports) {
  const page = await browser.newPage();
  await page.setViewport({
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: 1,
    isMobile: Boolean(vp.isMobile),
  });

  const res = await page.goto(base + path, { waitUntil: 'networkidle0', timeout: 45000 });
  if (!res?.ok()) console.warn(`  ! ${path} returned ${res?.status()}`);

  // The Astro dev toolbar is injected in dev only; keep it out of the shots.
  await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });

  // A fullPage screenshot never scrolls, so loading="lazy" images below the
  // fold are never requested and capture as blank. Promoting them to eager
  // triggers an immediate load without any scroll choreography.
  await page.evaluate(() => {
    for (const img of document.querySelectorAll('img[loading="lazy"]')) {
      img.loading = 'eager';
    }
  });

  // Let the variable font settle so heading metrics are final.
  await page.evaluate(() => document.fonts.ready);

  // Then wait for every image to finish decoding, with a ceiling so one
  // broken asset cannot hang the run.
  await page.evaluate(
    () =>
      Promise.race([
        Promise.all(
          Array.from(document.images).map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((r) => {
                  img.onload = img.onerror = r;
                }),
          ),
        ),
        new Promise((r) => setTimeout(r, 8000)),
      ]),
  );

  const file = `${outDir}/${name}-${vp.label}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(`${file}`);
  await page.close();
}

await browser.close();
