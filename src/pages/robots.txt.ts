import type { APIRoute } from 'astro';
import { isPreview } from '../lib/url';

/**
 * Generated rather than static so the sitemap URL always tracks the configured
 * production origin and can never drift from astro.config.mjs.
 *
 * Preview builds disallow everything. Combined with the per-page noindex in
 * BaseLayout, that keeps a shareable copy of the site out of search results,
 * where it would otherwise compete with the real domain.
 */
export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? 'https://star4construction.com';

  const body = isPreview
    ? ['# Preview build - not for indexing.', 'User-agent: *', 'Disallow: /', ''].join('\n')
    : ['User-agent: *', 'Allow: /', '', `Sitemap: ${origin}/sitemap-index.xml`, ''].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
