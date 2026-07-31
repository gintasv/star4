/**
 * Scaffolds a new project folder for the gallery.
 *
 *   npm run new-project "White Oak Stair in Hinsdale"
 *
 * Creates src/content/projects/<slug>/index.md pre-filled with the required
 * fields, then you drop the photographs into that same folder and fill in the
 * cover, alt text and gallery list.
 *
 * The alt-text fields are required by the content schema, so the build fails
 * loudly if they are left empty rather than shipping images Google and screen
 * readers cannot interpret.
 */
import { mkdir, writeFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';

const CATEGORIES = [
  'Stairs & Railings',
  'Floor Refinishing',
  'Floor Installation',
  'Custom Railing',
  'Stair Refinishing',
  'Finish Carpentry',
  'Trim & Moldings',
];

const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('Usage: npm run new-project "Project title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const dir = join('src', 'content', 'projects', slug);

// Never overwrite an existing project.
try {
  await access(dir);
  console.error(`A project already exists at ${dir}. Pick a different title or edit that one.`);
  process.exit(1);
} catch {
  // Does not exist, which is what we want.
}

await mkdir(dir, { recursive: true });

const today = new Date().toISOString().slice(0, 10);

const frontmatter = `---
title: ${title}
# One of: ${CATEGORIES.join(' | ')}
category: Stairs & Railings
# Optional. Slug from src/data/areas.ts, e.g. hinsdale - links this job to that town's page.
# area:
# Optional. Slug from src/data/services.ts, e.g. stairs - links it to that service page.
# service:
date: ${today}
# One or two sentences. Shown on the card and used as the meta description.
summary: TODO write one or two sentences describing what the job involved.
# Uncomment once you have copied a photo into this folder, and point it at
# the filename. Required before draft can be set to false.
# cover: ./01-hero.jpg
# Required with cover. Describe what is actually in the photo - screen readers
# read this aloud, and it is one of the only signals Google has for an image.
# coverAlt: TODO describe the photograph
# Optional extra photos. Each needs its own alt text.
# gallery:
#   - src: ./02-detail.jpg
#     alt: Close view of the mitred stair nosing and the iron baluster shoe
# Set true to use the large tile on the gallery.
featured: false
# Stays hidden until you set this to false. The build will then insist on a
# cover image and its alt text.
draft: true
---

TODO: a paragraph or two about the job. What was there before, what you did,
and anything a homeowner considering the same work would want to know.

Written as normal prose - it appears on the project's own page.
`;

await writeFile(join(dir, 'index.md'), frontmatter, 'utf8');

const existing = (await readdir(join('src', 'content', 'projects'))).length;

console.log(`
Created ${dir}/index.md

Next:
  1. Copy the photographs into ${dir}
     Name them so they sort correctly: 01-hero.jpg, 02-detail.jpg, ...
  2. Edit index.md - set cover, coverAlt, summary and the body text.
  3. Set draft: false when it is ready to publish.
  4. npm run dev      to check it locally
     npm run deploy   to publish

You now have ${existing} projects. The gallery switches to the large mosaic
layout automatically at 5, 9, 13, ... (see src/components/ProjectGrid.astro).
`);
