import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Project loading.
 *
 * The content schema makes `cover` and `coverAlt` optional so that a freshly
 * scaffolded project does not break the build before its photographs have been
 * added (see src/content.config.ts). Everything that renders a project needs
 * them to be present, though, so this module is the one place that filters out
 * drafts and narrows the type accordingly.
 *
 * Always load projects through here rather than calling getCollection directly.
 */

type Entry = CollectionEntry<'projects'>;

/** A project that has passed the draft filter, so its cover is guaranteed. */
export type PublishedProject = Entry & {
  data: Entry['data'] & {
    cover: NonNullable<Entry['data']['cover']>;
    coverAlt: string;
  };
};

const isPublished = (entry: Entry): entry is PublishedProject =>
  Boolean(entry.data.cover) && Boolean(entry.data.coverAlt);

/**
 * Every publishable project, newest first with featured items promoted.
 *
 * @param filter optional extra predicate, e.g. matching a service or town.
 */
export async function getPublishedProjects(
  filter?: (entry: PublishedProject) => boolean,
): Promise<PublishedProject[]> {
  const entries = await getCollection('projects', ({ data }) => !data.draft);

  // The schema already rejects a published project without a cover, so this is
  // a belt-and-braces check rather than an expected path.
  const published = entries.filter(isPublished);

  const ordered = published.sort((a, b) => {
    if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
    // Newest first. Undated projects sort last within their group rather than
    // being treated as epoch-old and jumping to the front.
    const at = a.data.date?.getTime() ?? -Infinity;
    const bt = b.data.date?.getTime() ?? -Infinity;
    return bt - at;
  });

  return filter ? ordered.filter(filter) : ordered;
}
