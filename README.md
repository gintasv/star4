# Star 4 Construction

Marketing site for Star 4 Construction — flooring, stairs, railings and finish
carpentry in Willow Springs, IL and the surrounding Chicago suburbs.

Static site built with [Astro](https://astro.build), hosted on S3 behind
CloudFront. No database. No server to keep running.

---

## Quick reference

```bash
npm install          # once
npm run dev          # http://localhost:4321
npm run verify       # build + contrast + SEO audit + handler tests
npm run deploy       # verify, then publish to AWS
```

| Task | Command |
|---|---|
| Add a completed project | `npm run new-project "Job title"` |
| Check SEO / links / schema | `npm run audit` |
| Check colour contrast | `npm run contrast` |
| Lighthouse scores | `npm run preview` then `npm run lh` |
| Screenshot a page | `npm run shoot -- /services/stairs/ stairs` |
| Test the quote form handler | `npm test` |

---

## Adding project photos

This is the thing you will do most often.

```bash
npm run new-project "White Oak Stair in Hinsdale"
```

That creates `src/content/projects/white-oak-stair-in-hinsdale/index.md`.
Then:

1. **Copy the photographs into that same folder.** Name them so they sort in
   the order you want: `01-hero.jpg`, `02-detail.jpg`, and so on.
2. **Edit `index.md`.** Set `cover`, write `coverAlt`, fill in `summary` and
   the body text.
3. **Set `draft: false`.**
4. `npm run dev` to check it, then `npm run deploy`.

The project then appears automatically on `/projects/`, on its own page, on the
home page gallery, and — if you set `area:` and `service:` — on that town's page
and that service's page too.

**Alt text is required.** The build fails if it is missing. That is deliberate:
it is what screen readers announce and one of the only signals Google has for
what a photograph shows.

**Image sizes are handled for you.** Drop in full-resolution photos straight off
the camera. The build generates AVIF and WebP at several widths and serves
whichever fits the visitor's screen. Do not resize anything by hand.

### The gallery layout

The home page uses a large 2×2 lead tile beside smaller ones. That only tiles
without gaps at 5, 9, 13... projects, so below that the grid falls back to
equal tiles. It switches over on its own — see the comment in
`src/components/ProjectGrid.astro`.

> **The three project photos currently in the repo were recovered from the
> design mockup video and are low resolution.** Replace them with the originals
> when you have them.

---

## Editing content

Almost all copy lives in four files, not scattered through the templates:

| File | What it holds |
|---|---|
| `src/data/site.ts` | Name, phone, email, address, hours, nav. **Single source of truth.** |
| `src/data/services.ts` | The five services: copy, checklists, per-service FAQs |
| `src/data/areas.ts` | The twelve towns and their individual page copy |
| `src/data/faqs.ts` | The sitewide FAQ |

Change the phone number in `site.ts` and it updates the header, footer, contact
page, every call button and the structured data at once. **Never hard-code a
phone number or address into a page** — NAP (name/address/phone) consistency is
a direct local-ranking factor and duplicating it is how it drifts.

### Outstanding content decisions

These are marked `TODO(martin)` in `src/data/site.ts`:

- **Street address** — currently unset, so the site says "Willow Springs, IL".
  A real address strengthens the Google Business Profile. Decide whether to
  publish one or run as a service-area business.
- **Licensed / insured / years in business** — trust signals worth showing.
- **Social profile URLs** — feed the `sameAs` field in the structured data.

The twelve town pages in `src/data/areas.ts` were written from general knowledge
of the local housing stock. **Read them and correct anything that does not match
what you actually see on the ground** — they are the pages meant to rank, and
wrong detail is worse than none.

---

## Why the site is shaped this way

The original mockup was a single scrolling page. That caps local SEO: one page
can only target one keyword cluster, so it cannot rank for both "stair
refinishing Hinsdale" and "hardwood floor installation Orland Park".

This rebuild keeps the mockup's design and splits it across 28 pages:

```
/                                   home
/services/  + 5 service pages
/areas/     + 12 town pages
/projects/  + one page per completed job
/about/  /contact/  /faq/  /404
```

Every service page links to every town page and back. That cross-linking, plus
one page per search intent, is what makes the site rankable at all.

### Measured results

`npm run verify` and `npm run lh` currently give:

| | Home | Service | Area | Project | Contact |
|---|---|---|---|---|---|
| SEO | 100 | 100 | 100 | 100 | 100 |
| Accessibility | 100 | 100 | 100 | 100 | 100 |
| Best practices | 100 | 100 | 100 | 100 | 100 |
| Performance | 94 | 94 | 95 | 93 | 95 |
| LCP | 1.5s | 1.4s | 1.4s | 1.6s | 1.4s |
| CLS | 0 | 0 | 0 | 0 | 0 |

Plus: 28 pages audited with zero broken links, no duplicate titles or
descriptions, valid JSON-LD on every page, and alt text on every image.

### The colour system has a constraint worth knowing

The palette came from a design mockup, not an accessibility audit, and the
bright orange fails contrast on every light background (1.7:1 to 2.6:1). So
there are three warm accents rather than one:

- `--orange` — dark backgrounds only
- `--terracotta` — button and rule **fills** only
- `--accent-text` — small type on light backgrounds

`SectionLabel` and `SectionHead` take a `surface="dark|light"` prop rather than
a colour, so the right choice is the obvious one. Run `npm run contrast` after
touching `src/styles/tokens.css`.

---

## Deploying

### One-time setup

```bash
cp infra/deploy.config.example.json infra/deploy.config.json
```

Check the values, then:

```bash
powershell -File infra/inventory.ps1 -Label before   # read-only snapshot
powershell -File infra/provision.ps1                 # creates the two stacks
```

`provision.ps1` prints exactly what it will create and waits for you to type
`YES`. Certificate validation and CloudFront take roughly 15 minutes.

Afterwards it prints the quote-form endpoint. Put it in `.env`:

```
PUBLIC_FORM_ENDPOINT=https://xxxxx.lambda-url.us-east-1.on.aws/
```

Then confirm nothing else in the account changed:

```bash
powershell -File infra/inventory.ps1 -Label after
powershell -File infra/inventory.ps1 -Diff
```

The diff must show additions only, all named `star4-*`.

### Every deploy after that

```bash
npm run deploy
```

---

## AWS layout, and why it is careful

**This AWS account also hosts invoicemanagementsystem.com.** Everything here is
built so it cannot affect it.

```
star4-construction-dns          ACM certificate (apex + www)
                                SES domain identity + DKIM
                                3 DKIM CNAMEs, 1 DMARC TXT

star4-construction-site         S3 bucket (private)
                                CloudFront + Origin Access Control
                                URL-rewrite function
                                Security headers policy
                                Quote-form Lambda + Function URL
                                Apex and www alias records
```

The safeguards, in order of how much they matter:

1. **`deploy.ps1` runs `aws s3 sync --delete`.** Before it writes anything it
   checks the AWS account matches the config, reads the bucket name from
   **CloudFormation stack outputs** rather than guessing, checks the name
   prefix, and confirms the bucket is tagged `Project=Star4Construction`. Any
   failure aborts with nothing changed. The tag check is the real backstop:
   no other bucket in the account carries it.
2. **`provision.ps1` verifies the hosted zone actually belongs to
   star4construction.com** before writing a DNS record, and refuses to run if
   an apex record already exists.
3. **Route 53 zones are never created or deleted.** The existing zone ID is
   passed in as a parameter, and only records the stacks create themselves are
   managed.
4. **Everything is namespaced `star4-construction-*` and tagged.** Deleting the
   stacks removes exactly what they made.
5. **The S3 bucket is `DeletionPolicy: Retain`,** so tearing down the stack
   cannot silently destroy the site content.
6. **No IAM changes to existing users or roles.** One new Lambda role, scoped
   to `ses:SendEmail` through a single domain identity.

Run `infra/inventory.ps1` and read it before running anything else — every call
in it is a List/Describe/Get.

### The quote form

Static page → Lambda Function URL → SES → Martin's inbox. Nothing stored.

The handler lives at `infra/lambda/quote-form/index.js` and is spliced into the
CloudFormation template by `infra/build-template.mjs`, so there is only ever one
copy of that code. Run `npm test` after changing it — the tests cover origin
enforcement, the honeypot and time-trap, and the CR/LF stripping that stops
submitted text being used for email header injection.

**SES stays in the sandbox and that is fine**, because the only recipient is
Martin's own verified address. AWS will send a verification email to
`star4constructionteam@gmail.com` — it must be clicked before the form delivers.

Until `PUBLIC_FORM_ENDPOINT` is set, the contact page shows call and email
buttons instead of a form. That is deliberate: better than a form that
silently fails.

**There is no SPF record, on purpose.** DKIM alignment alone satisfies DMARC,
and an apex SPF TXT is the record most likely to conflict if the domain later
hosts real mailboxes. If you add Google Workspace, you must *merge* SPF rather
than add a second record.

---

## The part that is not code

The website is roughly half of local ranking. The other half:

1. **Claim and complete the Google Business Profile.** Primary category
   *Flooring Contractor*; add *Hardwood Floor Refinishing Service* and
   *Stair Contractor*. Set the service area to the twelve towns.
2. **Get reviews.** This is the single biggest gap against the competition —
   [Big Bro Hardwood](https://bigbrohardwood.com/) ranks partly on 49 Google
   reviews. Ask every satisfied customer, every time.
3. **Keep NAP identical everywhere.** The exact strings from
   `src/data/site.ts`, byte for byte, on every directory listing.
4. **Submit the sitemap** at `https://star4construction.com/sitemap-index.xml`
   in Google Search Console.
5. **Consider a domain email** — `info@star4construction.com` reads as more
   established than a Gmail address and can forward straight to it.

---

## Layout of the repo

```
src/
  data/          content: NAP, services, areas, FAQs
  content/       project folders (markdown + photographs)
  components/    UI pieces
  layouts/       BaseLayout: SEO head, JSON-LD, fonts
  lib/           schema.ts (structured data), projects.ts (project loading)
  pages/         routes
  styles/        tokens.css (the palette), global.css
design/          approved mockup, reference frames, palette notes
infra/           CloudFormation, deploy and inventory scripts, Lambda
scripts/         build and verification tooling
public/fonts/    self-hosted Inter (one 48 KB file, no Google Fonts request)
```

Nothing in `design/` is used at build time — it is the source material the
palette and layout were derived from. See [design/README.md](design/README.md)
for where each colour came from and why the accent had to be split into three
tokens.
