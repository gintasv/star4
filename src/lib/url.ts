/**
 * Internal link helper.
 *
 * GitHub Pages serves this repo from a sub-path (/star4/), while AWS serves it
 * from the domain root. Astro rewrites the URLs it generates itself — bundled
 * CSS, JS and `<Image>` output — but it cannot rewrite a hand-written
 * `href="/services/"`, so those need prefixing explicitly.
 *
 * At the root deployment BASE_URL is "/", the prefix collapses to "", and
 * url('/services/') returns '/services/' unchanged. Wrapping a link is
 * therefore always safe and never needs undoing.
 *
 *   <a href={url('/services/')}>          ->  /services/      (AWS)
 *                                         ->  /star4/services/ (Pages)
 */

/** BASE_URL is "/" or "/star4/"; strip the trailing slash so paths concatenate. */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function url(path: string): string {
  // Leave absolute URLs and non-navigational schemes (tel:, mailto:, #) alone.
  if (!path.startsWith('/')) return path;
  return `${BASE}${path}`;
}

/** True when this build is a shareable preview rather than the real site. */
export const isPreview = import.meta.env.PUBLIC_PREVIEW === 'true';
