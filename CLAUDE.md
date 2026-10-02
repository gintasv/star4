# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Static marketing site for Star 4 Construction, a flooring/stair/finish-carpentry
contractor in Willow Springs, IL. Astro, no database, deployed to S3 +
CloudFront. The whole point of the build is local SEO ranking, so anything that
degrades crawlability or Core Web Vitals is a regression, not a detail.

## Commands

```bash
npm run dev            # localhost:4321
npm run verify         # build + contrast + SEO audit + handler tests. Run before any commit.
npm run deploy         # verify, then guarded publish to AWS
```

Individual checks:

| Command | What it gates |
|---|---|
| `npm run audit` | Per-page titles/descriptions/canonicals, one `<h1>`, alt text, JSON-LD validity, broken internal links, sitemap coverage. Exits non-zero on error. |
| `npm run contrast` | WCAG ratios for every allowed token pairing in `src/styles/tokens.css`. |
| `npm test` | Quote-form Lambda handler. Single test: `node --test --test-name-pattern="honeypot" infra/lambda/quote-form/index.test.mjs` |
| `npm run lh` | Lighthouse. Needs a build served first: `npm run build && npx astro preview --port 4322`. |
| `npm run shoot -- /services/stairs/ stairs` | Full-page desktop + mobile screenshots into `shots/`. |

`audit` and `lh` read `dist/`, so build first.

### Two Windows gotchas

- **Run `scripts/shoot.mjs` through PowerShell, not the Bash tool.** MSYS rewrites a
  leading `/` argument into a Windows path, so the URL arrives mangled.
- **`infra/*.ps1` must stay pure ASCII.** Windows PowerShell 5.1 reads `.ps1` as
  ANSI; a single em-dash in a string breaks parsing with a misleading error far
  from the actual line.

## Content lives in data files, not templates

Nearly all copy is in four files. Editing a page template to change wording is
almost always wrong.

- `src/data/site.ts` — **single source of truth for NAP** (name/address/phone).
  Feeds header, footer, contact page, every call button and the structured data.
  Never hard-code a phone number or address anywhere else: NAP consistency is a
  direct local-ranking factor and duplication is how it drifts.
- `src/data/services.ts` — the five services, their checklists and per-service FAQs.
- `src/data/areas.ts` — the twelve suburb pages. **Each needs genuinely distinct
  body copy.** Google demotes near-identical pages that differ only by place
  name, and a penalty would cost more than the pages earn. Never clone an entry
  and swap the town.
- `src/data/faqs.ts` — sitewide FAQ, emitted as `FAQPage` JSON-LD.

## Architecture notes

### Every internal link goes through `url()`

`src/lib/url.ts`. GitHub Pages serves this repo from `/star4/`; AWS serves from
the domain root. Astro rewrites its own asset URLs but *cannot* rewrite a
hand-written `href="/services/"`, so those 404 under a sub-path.

Wrap every internal href: `<a href={url('/services/')}>`. At the root
deployment `BASE_URL` is `/`, the prefix collapses to `""`, and the helper is a
no-op — so wrapping is always safe. This also applies to canonical URLs, the
font preload, favicon, sitemap link, and the URLs built in `src/lib/schema.ts`.

Build variants are driven by env vars (see `.github/workflows/preview.yml`):

| | Production | Preview |
|---|---|---|
| `SITE_URL` | `https://star4construction.com` | `https://gintasv.github.io` |
| `BASE_PATH` | unset | `/star4` |
| `PUBLIC_PREVIEW` | unset | `true` |

`PUBLIC_PREVIEW=true` forces `noindex` on every page and makes `robots.txt`
disallow everything. **Do not remove that** — without it the preview is a second
indexable copy competing with the real domain for the searches this site exists
to win.

### Three warm accents, not one

The palette came from a design mockup, not an accessibility audit, and its
orange fails contrast on every light background (1.7:1–2.6:1 against a 4.5:1
requirement). Hence:

- `--orange` — dark surfaces only
- `--terracotta` — button and rule **fills** only (cream on it is 4.9:1)
- `--accent-text` — small type on light surfaces

`SectionLabel` and `SectionHead` take `surface="dark" | "light"` rather than a
colour name, so the correct token is a structural consequence rather than a
judgement call. Run `npm run contrast` after touching `tokens.css`.

### Projects load through one function

Always use `getPublishedProjects()` from `src/lib/projects.ts`, never
`getCollection('projects')` directly. It filters drafts and narrows the type so
`cover`/`coverAlt` are non-optional downstream.

`cover`, `coverAlt` and `date` are optional in the schema on purpose:

- A freshly scaffolded project has no photographs yet. Making them required
  would break the build the moment `npm run new-project` runs. A `superRefine`
  requires them once `draft: false`.
- `date` is optional because photos arriving via a messaging app have EXIF
  stripped, so the completion date is genuinely unknown. Those projects omit
  the "Completed" line rather than showing a guess.

`draft` defaults to **true** — a new project is invisible until deliberately published.

The gallery mosaic (`ProjectGrid.astro`) only tiles without gaps when
`n % 4 === 1 && n >= 5`, because the lead tile consumes four cells of a
four-column grid. At any other count it falls back to a uniform grid
automatically. Don't "fix" this by forcing the mosaic on.

### Adding project photos

```bash
npm run new-project "Job title"
```

Scaffolds `src/content/projects/<slug>/index.md`. Drop full-resolution photos in
the same folder, fill in `cover`/`coverAlt`/`summary`, set `draft: false`.

Alt text is schema-required and the build fails without it. Images are optimised
at build time — never resize by hand. Sharp re-encodes everything, which also
strips EXIF, so capture times and GPS never reach the published site.

## AWS: the account is shared

**This AWS account also hosts invoicemanagementsystem.com.** Nothing here may
modify or delete a resource it did not create.

- `infra/inventory.ps1` is read-only (List/Describe/Get only). Snapshot before
  provisioning and diff after; the diff must show additions only, all named `star4-*`.
- `infra/provision.ps1` verifies the account, verifies the hosted zone actually
  belongs to the configured domain, aborts if an apex record already exists, and
  requires typing `YES`.
- `infra/deploy.ps1` runs `aws s3 sync --delete`. Four assertions precede any
  write: account ID match, targets read from **CloudFormation stack outputs**
  (never guessed), bucket-name prefix, and a `Project=Star4Construction` bucket
  tag. The tag check is the real backstop — no other bucket in the account has it.

Route 53 zones are never created or deleted; the existing zone ID is passed in
as a parameter and only records the stacks create themselves are managed.

### The Lambda handler is single-sourced

`infra/lambda/quote-form/index.js` is the only copy. `infra/build-template.mjs`
strips its comments with esbuild and splices it into `site-stack.yaml` at the
`@@QUOTE_FORM_HANDLER@@` placeholder, producing `site-stack.generated.yaml`.

- **Never edit `site-stack.generated.yaml`** — it is regenerated on every deploy.
- CloudFormation caps inline code at **4096 characters** after stripping. The
  generator fails the build if exceeded.
- The handler must be **pure ASCII with escape-sequence regexes** (`/[\x00-\x1f]/`,
  not literal control bytes). A raw control character corrupts the YAML block scalar.
- It is CommonJS deliberately — inline Lambda code lands as `index.js` with no
  `package.json`. The local `package.json` in that folder sets
  `"type": "commonjs"` only so Node locally matches the runtime.

The quote form renders call/email buttons instead of a form when
`PUBLIC_FORM_ENDPOINT` is unset, which is better than a form that silently fails.

## What is deliberately not in the repo

`Project Photos/` (45 originals, mostly unpublished photographs of customers'
homes) and `design/test1.pdf` (belongs to the invoicemanagementsystem.com
project). Both are gitignored because `gintasv/star4` is public. Keep it that way.
