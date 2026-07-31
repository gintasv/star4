# Design reference

Source material for the site's visual design. Nothing here is used at build
time — it exists so the design decisions in the code can be traced back to
something, and so a future change can be checked against the original.

## Contents

| File | What it is |
|---|---|
| `star4-design-mockup.mp4` | The approved design walkthrough. 18s screen recording, 1920×1080. Originally `163ddd2d-9a31-4ba9-b042-16cde7035e45.mp4`. |
| `mockup-frames/` | One still per section of that recording, extracted at full resolution. These are the working reference — comparing a built page against the matching frame is faster than scrubbing the video. |
| `test1.pdf` | **Not a Star 4 document.** See the note at the bottom. |

## Where the mockup came from

The recording is not a third-party site used for inspiration. It is a mockup
generated *for* Star 4 Construction, and it already carried the real phone
number, email address and service area. The status bar in the recording shows
it hosted at `northline-contracting.mafosor.chatgpt.site`.

Its one structural problem was that it was a single scrolling page with anchor
navigation, which caps local SEO — see the root `README.md` for why the build
splits it across 28 pages instead. The visual design was kept.

## The palette, and where it came from

Every colour in `src/styles/tokens.css` was sampled pixel-by-pixel from these
frames rather than eyeballed. If the design changes, resample — do not guess.

| Token | Hex | Where it appears in the mockup |
|---|---|---|
| `--ink` | `#040E0B` | Selected-work section, footer |
| `--header` | `#141A1B` | Sticky header bar |
| `--green-deep` | `#1D2B27` | Hero left panel |
| `--green-dark` | `#13211D` | Service-areas section |
| `--green-panel` | `#1F2923` | Inset panel on dark |
| `--orange` | `#F07D57` | "FINISHED RIGHT.", micro-labels, `+` icons |
| `--terracotta` | `#AF5224` | Call button, 3px panel rules |
| `--rust-a` → `--rust-b` | `#79351F` → `#944225` | Closing CTA gradient |
| `--cream` | `#FEF8EF` | Contact strip, process background, card 01 |
| `--bone` | `#F1ECE0` | Services section background |
| `--sand` | `#E9E1D4` | Card 02 |
| `--sage` | `#DBDED4` | Card 03 |
| `--sage-light` | `#EBEEE6` | FAQ background |
| `--tan` | `#DCCDB9` | Diagonal wedge behind "Clear contact." |

### One deliberate departure

`--accent-text: #8F3F17` does **not** appear in the mockup. It had to be added.

The mockup's bright orange fails WCAG AA contrast on every light background it
is used against — 2.29:1 on `--bone`, 1.73:1 on `--tan`, against a 4.5:1
requirement for small text. Terracotta is not much better off cream and fails
outright on the other light neutrals.

So the warm accent is three tokens rather than one:

- `--orange` — dark surfaces only (5.4:1 to 7.3:1, all pass)
- `--terracotta` — button and rule **fills** only (cream on it is 4.9:1)
- `--accent-text` — small type on light surfaces (4.7:1 on tan, the worst case)

`SectionLabel` and `SectionHead` take `surface="dark|light"` rather than a
colour name so the correct token is picked structurally. `npm run contrast`
fails the build if any pairing regresses.

Visually this is close to invisible — the orange still appears exactly where
the mockup put it, which is on the dark sections.

## Type

The mockup's headings are a heavy neo-grotesque: straight diagonal `R` leg,
spurless `G`, horizontal `C` and `S` terminals. **Inter** at weight 800–900
with `-0.022em` tracking and `0.94` line-height matches it closely, and is
free, variable and self-hostable.

It is served from `public/fonts/` as a single 48 KB variable file, preloaded.
No request to Google Fonts — that keeps the critical path short and avoids a
third-party connection on every page load.

## Section inventory

The frames map to the home page in order:

1. **Hero** — split panel, dark green left, project photo right with a caption overlay and a corner bracket
2. **Contact strip** — cream band, three cells divided by hairlines
3. **Core services** — three tinted cards under a 3px orange rule, numbered `01/02/03`
4. **Service areas** — dark section with a bordered town-list panel
5. **Selected work** — mosaic gallery, one large tile beside smaller ones
6. **Process** — three steps, coloured rule beneath each card
7. **FAQ** — accordion with `+` toggles
8. **Closing CTA** — full-width rust gradient
9. **Footer**

Recurring details: zero border-radius throughout, hairline dividers, 3px
terracotta top-borders on panel groups, and letterspaced uppercase micro-labels
preceded by a short rule.

---

## Note on `test1.pdf`

**This file appears to belong to a different project.** Its embedded title is
"IMS Look-and-Feel Design", and the pages show invoice statements, interchange
fees and vendor contracts — it is a design document for
**invoicemanagementsystem.com**, which is the other site in the same AWS
account.

It was moved here only to clear the project root. It has nothing to do with
Star 4 Construction and can be relocated to the IMS project whenever suits.
