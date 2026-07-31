import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Completed projects.
 *
 * Each project is a folder under src/content/projects/ containing an index.md
 * and its photographs. `npm run new-project "Job name"` scaffolds one.
 *
 * The schema deliberately makes alt text a required field on every image.
 * Alt text is both an accessibility requirement and one of the few signals
 * Google has for what a photograph actually shows, and it is the first thing
 * that gets skipped when it is optional.
 */
const projects = defineCollection({
  loader: glob({
    pattern: '**/index.md',
    base: './src/content/projects',
    // Folder name becomes the URL slug: projects/white-oak-stair/index.md -> white-oak-stair
    generateId: ({ entry }) => entry.replace(/\/index\.md$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      /** Shown as the H1 and the gallery card caption. */
      title: z.string(),
      /** Small label above the title. Matches the design's micro-label. */
      category: z.enum([
        'Stairs & Railings',
        'Floor Refinishing',
        'Floor Installation',
        'Custom Railing',
        'Stair Refinishing',
        'Finish Carpentry',
        'Trim & Moldings',
      ]),
      /** Town slug from src/data/areas.ts. Links the project to its area page. */
      area: z.string().optional(),
      /** Service slug from src/data/services.ts. */
      service: z.string().optional(),
      /**
       * Completion date. Optional, because photographs that arrive via a
       * messaging app have their EXIF stripped and the date is then genuinely
       * unknown. Undated projects simply omit the "Completed" line rather than
       * displaying a guess.
       */
      date: z.coerce.date().optional(),
      /** One or two sentences. Used as the meta description if none is given. */
      summary: z.string().min(20).max(300),
      metaDescription: z.string().max(170).optional(),
      /**
       * Card and hero image.
       *
       * Optional in the schema, then required for anything published — see the
       * superRefine below. A newly scaffolded project has no photographs yet,
       * and making these strictly required would break the build the moment
       * `npm run new-project` runs, before the user has done anything wrong.
       */
      cover: image().optional(),
      coverAlt: z.string().min(10, 'Write descriptive alt text — it is required.').optional(),
      /** Additional photographs, each with its own alt text. */
      gallery: z
        .array(
          z.object({
            src: image(),
            alt: z.string().min(10, 'Write descriptive alt text — it is required.'),
          }),
        )
        .default([]),
      /** Pin to the top of the gallery and use the large mosaic tile. */
      featured: z.boolean().default(false),
      /** Hide without deleting. Drafts are excluded from every page. */
      draft: z.boolean().default(true),
    })
    .superRefine((data, ctx) => {
      // Drafts may be incomplete; anything publishable may not.
      if (data.draft) return;

      if (!data.cover) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cover'],
          message:
            'A published project needs a cover image. Add one, or set `draft: true` while you finish it.',
        });
      }
      if (!data.coverAlt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['coverAlt'],
          message:
            'A published project needs coverAlt describing the photograph. Add it, or set `draft: true`.',
        });
      }
    }),
});

export const collections = { projects };
