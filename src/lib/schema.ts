/**
 * JSON-LD builders.
 *
 * Everything here feeds Google's understanding of who the business is, where
 * it works and what it sells. Validate any change at
 * https://search.google.com/test/rich-results before shipping.
 */

import { site } from '../data/site';
import { areas } from '../data/areas';
import { services } from '../data/services';

/** Stable @id for the business node so other nodes can reference it. */
export const businessId = (origin: string) => `${origin}/#business`;

export function localBusinessSchema(origin: string) {
  const { address, geo, openingHours } = site;

  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': businessId(origin),
    name: site.name,
    legalName: site.legalName,
    description:
      'Flooring, stair, railing and finish carpentry contractor serving Chicago’s western and southwest suburbs.',
    url: `${origin}/`,
    telephone: site.phoneHref,
    email: site.email,
    image: `${origin}${site.defaultOgImage}`,
    priceRange: '$$',

    address: {
      '@type': 'PostalAddress',
      // Only emit streetAddress once it is confirmed — a wrong address is
      // worse than an absent one, because it breaks citation consistency.
      ...(address.streetAddress ? { streetAddress: address.streetAddress } : {}),
      addressLocality: address.locality,
      addressRegion: address.region,
      postalCode: address.postalCode,
      addressCountry: address.country,
    },

    geo: {
      '@type': 'GeoCoordinates',
      latitude: geo.latitude,
      longitude: geo.longitude,
    },

    // Both forms: the circle expresses reach, the named places match queries.
    areaServed: [
      {
        '@type': 'GeoCircle',
        geoMidpoint: {
          '@type': 'GeoCoordinates',
          latitude: geo.latitude,
          longitude: geo.longitude,
        },
        geoRadius: site.serviceRadiusMeters,
      },
      ...areas.map((a) => ({
        '@type': 'City' as const,
        name: a.name,
        addressRegion: 'IL',
      })),
    ],

    openingHoursSpecification: openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),

    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Flooring, stair and finish carpentry services',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.name,
          description: s.summary,
          url: `${origin}/services/${s.slug}/`,
        },
      })),
    },

    ...(site.social.facebook || site.social.instagram || site.social.googleBusiness
      ? {
          sameAs: [
            site.social.facebook,
            site.social.instagram,
            site.social.googleBusiness,
          ].filter((v): v is string => Boolean(v)),
        }
      : {}),
  };
}

export function serviceSchema(
  origin: string,
  service: { slug: string; name: string; summary: string },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.summary,
    url: `${origin}/services/${service.slug}/`,
    serviceType: service.name,
    provider: { '@id': businessId(origin) },
    areaServed: areas.map((a) => ({ '@type': 'City' as const, name: a.name, addressRegion: 'IL' })),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function breadcrumbSchema(origin: string, trail: { name: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${origin}${crumb.href}`,
    })),
  };
}
