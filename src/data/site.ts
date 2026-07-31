/**
 * Single source of truth for business identity.
 *
 * NAP (Name / Address / Phone) consistency is a direct local-ranking factor:
 * Google cross-references what is on the site against the Google Business
 * Profile and every directory listing. Byte-for-byte identical strings matter.
 * Everything that displays or emits these values reads from here — never
 * hard-code a phone number or address in a component or page.
 *
 * TODO(martin): confirm `streetAddress` and `geo`. A verified street address
 * measurably strengthens Google Business Profile and LocalBusiness schema.
 * Leave `streetAddress` as null until confirmed — emitting a wrong address is
 * worse than emitting none, because it poisons citation consistency.
 */

export const site = {
  name: 'Star 4 Construction',
  /** Wordmark styling in the header renders this without the space. */
  wordmark: 'STAR4 CONSTRUCTION',
  tagline: 'Flooring & Stair Specialists',
  legalName: 'Star 4 Construction',

  contactName: 'Martin',
  /** Display form. Used in visible copy. */
  phone: '(630) 597-8138',
  /** E.164 form. Used in tel: links and schema. */
  phoneHref: '+16305978138',
  email: 'star4constructionteam@gmail.com',

  address: {
    /** TODO(martin): supply if a street address should be published. */
    streetAddress: null as string | null,
    locality: 'Willow Springs',
    region: 'IL',
    regionName: 'Illinois',
    postalCode: '60480',
    country: 'US',
  },

  /** Approximate centroid of Willow Springs, IL — refine with a real address. */
  geo: { latitude: 41.7386, longitude: -87.8873 },

  /** Radius served, in metres, for LocalBusiness `areaServed`. ~40 km. */
  serviceRadiusMeters: 40000,

  openingHours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '07:00', closes: '18:00' },
    { days: ['Saturday'], opens: '08:00', closes: '16:00' },
  ],

  /** TODO(martin): confirm before publishing — these are trust/E-E-A-T signals. */
  foundedYear: null as number | null,
  licensed: null as boolean | null,
  insured: null as boolean | null,

  social: {
    facebook: null as string | null,
    instagram: null as string | null,
    googleBusiness: null as string | null,
  },

  defaultOgImage: '/og-default.jpg',
} as const;

/** Primary navigation. Kept flat — a five-item bar matches the approved design. */
export const nav = [
  { label: 'Services', href: '/services/' },
  { label: 'Areas', href: '/areas/' },
  { label: 'Work', href: '/projects/' },
  { label: 'Process', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
] as const;

/** Formats the address for display. Omits the street line until confirmed. */
export function formatAddress(): string {
  const { streetAddress, locality, region } = site.address;
  return streetAddress ? `${streetAddress}, ${locality}, ${region}` : `${locality}, ${region}`;
}
