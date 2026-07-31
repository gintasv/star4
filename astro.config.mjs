// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * Production origin. Drives canonical URLs, OG tags and sitemap.xml.
 * Override with SITE_URL when building for a preview environment.
 */
const SITE_URL = process.env.SITE_URL ?? 'https://star4construction.com';

export default defineConfig({
  site: SITE_URL,

  // Directory-style URLs (/services/stairs/) keep paths clean and stable.
  // The CloudFront function in infra/site-stack.yaml rewrites these to
  // /services/stairs/index.html, which plain S3 origins cannot resolve alone.
  trailingSlash: 'always',
  build: { format: 'directory' },

  integrations: [
    sitemap({
      // Service and area pages are the pages we actually want ranking.
      serialize(item) {
        if (item.url === `${SITE_URL}/`) {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (item.url.includes('/services/') || item.url.includes('/areas/')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        } else if (item.url.includes('/projects/')) {
          item.priority = 0.6;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
  ],

  image: {
    // Sharp emits AVIF/WebP derivatives with explicit dimensions, which is
    // what keeps CLS at zero once Martin starts adding project photography.
    responsiveStyles: true,
    layout: 'constrained',
  },

  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
