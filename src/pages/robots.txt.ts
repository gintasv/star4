import type { APIRoute } from 'astro';

/**
 * Generated rather than static so the sitemap URL always tracks the configured
 * production origin and can never drift from astro.config.mjs.
 */
export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? 'https://star4construction.com';

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${origin}/sitemap-index.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
