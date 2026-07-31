/**
 * Site-level FAQ. Rendered on the home page and /faq/, and emitted as
 * FAQPage JSON-LD so the answers are eligible for rich results.
 *
 * Questions mirror the approved design. Answers are written to be genuinely
 * useful on their own — Google devalues FAQ markup whose answers exist only to
 * hold keywords.
 */

export interface Faq {
  q: string;
  a: string;
}

export const faqs: Faq[] = [
  {
    q: 'What flooring materials do you work with?',
    a: 'Solid hardwood, engineered wood, luxury vinyl plank, laminate, carpet and ceramic tile. Most of our work is hardwood — installation, sanding and refinishing — but we install the other materials where they are the better fit for the room, which is often the case below grade or over a concrete slab.',
  },
  {
    q: 'Can you rebuild stairs or replace railings?',
    a: 'Yes, both. That includes new treads and risers over an existing staircase, full rebuilds where the structure is past saving, squeak and movement repair, and refinishing to match your floors. On railings we fit new handrails, newel posts, iron balusters, cable systems and glass panels, and we can retrofit balusters into an existing railing without replacing the whole thing.',
  },
  {
    q: 'Do you handle work beyond floors and stairs?',
    a: 'Yes. Alongside flooring and stairs we take on trim and moldings, doors, kitchen updates, interior and exterior painting, decks and exterior woodwork, and general carpentry and repairs. If you are already having floors done, it is usually more efficient to fold the related finish work into the same visit.',
  },
  {
    q: 'Which Chicago suburbs do you serve?',
    a: 'We are based in Willow Springs and work across the western and southwest suburbs, including Burr Ridge, Hinsdale, La Grange, Western Springs, Countryside, Lemont, Palos Park, Palos Hills, Orland Park, Darien and Downers Grove. If your town is not on that list it is still worth calling — nearby locations are often fine.',
  },
  {
    q: 'How do I request an estimate?',
    a: 'Call or email Martin directly. There is no call centre and no intake queue — the person you speak to is the person who will look at the job. For anything beyond a simple room, we prefer to see the space in person, because square footage alone does not tell you the condition of a subfloor or what is under the carpet on a staircase.',
  },
  {
    q: 'What should I have ready when I call?',
    a: 'Roughly what rooms are involved and their approximate size, what is on the floor now, and whether you know what is underneath it. Photos help a great deal, particularly of stairs and of any damaged areas. If you have a target date or are working around other trades, mention that early so the schedule can be planned around it.',
  },
];
