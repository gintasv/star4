/**
 * The five service pages. Each becomes /services/<slug>/ and is the page we
 * want ranking for "<service> <suburb>" searches, cross-linked from every
 * area page.
 *
 * `title` is the H1. `metaTitle` is the <title> tag — kept separate because the
 * two want different things: the H1 reads as design copy, the title tag has to
 * carry the keyword and stay under ~60 characters.
 */

export interface Service {
  slug: string;
  /** Short label for cards and navigation. */
  name: string;
  /** H1 on the service page. */
  title: string;
  metaTitle: string;
  metaDescription: string;
  /** One-line summary used on cards. */
  summary: string;
  /** Slash-separated keyword strip shown at the foot of each card. */
  keywords: string[];
  /** Body copy for the service page. */
  intro: string;
  /** What the job actually involves — becomes a checklist on the page. */
  includes: string[];
  /** Questions specific to this service, rendered as FAQPage schema. */
  faqs: { q: string; a: string }[];
}

export const services: Service[] = [
  {
    slug: 'floor-sanding-refinishing',
    name: 'Floor Sanding & Refinishing',
    title: 'Floor Sanding & Refinishing',
    metaTitle: 'Hardwood Floor Refinishing & Sanding | Chicago Suburbs',
    metaDescription:
      'Dust-controlled hardwood floor sanding, staining and refinishing across Willow Springs, Hinsdale, La Grange and the western suburbs. Call Martin at (630) 597-8138.',
    summary:
      'Restore worn hardwood with professional sanding, stain, sealing, and a clean final finish.',
    keywords: ['Sand', 'Stain', 'Seal', 'Refinish'],
    intro:
      'Most hardwood that looks past saving is not. Under the scratches, pet damage and greyed-out finish there is usually solid wood with plenty of life left. Sanding back to bare timber and rebuilding the finish costs a fraction of replacement and leaves the floor looking new.',
    includes: [
      'Multi-stage sanding from coarse grit through to a fine finish cut',
      'Edge and corner work done by hand where the machine cannot reach',
      'Board repairs and replacement of anything too far gone to save',
      'Gap filling and re-nailing of loose or squeaking boards',
      'Stain sample panels laid on your actual floor before committing',
      'Two to three coats of finish, with the sheen level you choose',
    ],
    faqs: [
      {
        q: 'How many times can a hardwood floor be refinished?',
        a: 'Solid hardwood can usually take four to six full sandings over its lifetime, depending on board thickness and how much material previous refinishes removed. Engineered wood depends on the thickness of its top wear layer — some can be refinished once or twice, others not at all. We check the wear layer before quoting.',
      },
      {
        q: 'How much mess does sanding make?',
        a: 'Far less than it used to. We run dust-containment equipment connected directly to the sanders, which captures the great majority of airborne dust at source. There is still some fine settling, so we seal off adjacent rooms, but you will not find a house coated in sawdust.',
      },
      {
        q: 'How long before I can walk on the floor?',
        a: 'Light foot traffic in socks is usually fine within 24 hours of the final coat. Furniture should wait 48 to 72 hours, and rugs should stay off for around two weeks so the finish can fully cure and off-gas. Exact timing depends on the finish product and the humidity that week.',
      },
      {
        q: 'Can you match the stain on my existing floors?',
        a: 'Usually, yes. We lay sample panels directly onto your sanded floor rather than relying on a colour chart, because the same stain reads differently on red oak, white oak and maple. You pick from samples on your own timber, in your own light.',
      },
    ],
  },
  {
    slug: 'floor-installation',
    name: 'Floor Installation',
    title: 'Floor Installation',
    metaTitle: 'Hardwood & Engineered Floor Installation | Chicago Suburbs',
    metaDescription:
      'Hardwood, engineered wood, vinyl, laminate, carpet and tile installation across Chicago’s western and southwest suburbs. Talk to Martin at (630) 597-8138.',
    summary:
      'Installation for hardwood, engineered wood, vinyl, laminate, carpet, and ceramic tile.',
    keywords: ['Wood', 'Vinyl', 'Laminate', 'Tile', 'Carpet'],
    intro:
      'A floor is only as good as what is under it and how carefully it was laid. Subfloor prep, acclimation and expansion gaps are the parts nobody sees and the parts that decide whether a floor stays flat and quiet in five years.',
    includes: [
      'Subfloor inspection, levelling and moisture testing before anything is laid',
      'Material acclimation on site so boards settle to your home’s humidity',
      'Removal and disposal of the existing floor covering',
      'Correct expansion gaps at every wall and transition',
      'Transitions, thresholds and trim to finish the edges properly',
      'Site-finished or prefinished, whichever suits the room and the timeline',
    ],
    faqs: [
      {
        q: 'Solid hardwood or engineered — which should I choose?',
        a: 'Mostly it comes down to what is underneath. Over a concrete slab or below grade, engineered is the safer choice because it handles moisture movement far better. On a standard wood subfloor above grade, solid hardwood gives you more refinishes over the life of the floor. We look at the subfloor before recommending either.',
      },
      {
        q: 'Do I need to move the furniture myself?',
        a: 'No. We move standard furniture as part of the job. Pianos, safes, large aquariums and anything else specialist are worth flagging when we quote so we can plan for them.',
      },
      {
        q: 'How long does a typical installation take?',
        a: 'For a normal room count, expect a few days for prefinished material and longer for site-finished, since that adds sanding and coating time on top. Material acclimation may add several days before work starts. We give a firm schedule once we have seen the space.',
      },
    ],
  },
  {
    slug: 'stairs',
    name: 'Stairs',
    title: 'Stairs & Staircases',
    metaTitle: 'Stair Installation, Refinishing & Repair | Chicago Suburbs',
    metaDescription:
      'New stair treads, risers, full staircase rebuilds, refinishing and squeak repair across the Chicago suburbs. Call Martin at (630) 597-8138.',
    summary:
      'New treads, risers, full rebuilds, refinishing, and repairs to stairs that squeak or sag.',
    keywords: ['Build', 'Repair', 'Refinish'],
    intro:
      'A staircase sits in the middle of the house and gets looked at more than any floor in it. It is also the most demanding finish work in a home — every cut is visible, every joint is at eye level, and nothing is square.',
    includes: [
      'Carpet removal and assessment of the timber hiding underneath',
      'New solid treads and risers, cut and fitted on site',
      'Full staircase rebuilds where the existing structure is past repair',
      'Squeak and movement repair, refastening treads to stringers',
      'Sanding and refinishing to match your floors',
      'Skirt boards, nosings and returns detailed properly',
    ],
    faqs: [
      {
        q: 'There is carpet on my stairs. Is there hardwood underneath?',
        a: 'Often there is, but it varies. Many builders used lower-grade timber for treads that were always going to be carpeted, and the risers may be plywood or MDF. We pull back a corner to check before quoting, then tell you honestly whether refinishing what is there will look good or whether new treads are the better spend.',
      },
      {
        q: 'Can you fix stairs that squeak?',
        a: 'Yes, and it is one of the more common jobs we get called for. Squeaks come from treads working loose against the stringers or from shrinkage opening gaps. Fixing it properly means refastening from above or below rather than just adding screws through the tread face.',
      },
      {
        q: 'Can I use the stairs while you are working on them?',
        a: 'Partly. We stage the work so there is a safe route up and down at the end of each day, but there will be periods during the day when the staircase is out of action. If it is the only staircase in the house, we plan the schedule around that.',
      },
    ],
  },
  {
    slug: 'railings',
    name: 'Railings',
    title: 'Railings & Balusters',
    metaTitle: 'Stair Railings, Balusters & Cable Systems | Chicago Suburbs',
    metaDescription:
      'Custom stair railings, handrails, newel posts, iron balusters and cable systems installed across the Chicago suburbs. Call Martin at (630) 597-8138.',
    summary:
      'Handrails, posts, balusters and cable systems, installed new or swapped into an existing staircase.',
    keywords: ['Handrails', 'Posts', 'Balusters', 'Cable'],
    intro:
      'Swapping a railing changes the character of an entryway more than almost any other single job. Replacing tired spindles with iron balusters or a cable system is a contained piece of work that reads as a whole-house update.',
    includes: [
      'Iron baluster retrofit into an existing timber railing',
      'Cable and horizontal rail systems for a more modern line',
      'New newel posts, handrails and fittings',
      'Glass panel infill where you want the sightline kept open',
      'Code-compliant baluster spacing and handrail heights',
      'Refinishing the existing handrail to match new components',
    ],
    faqs: [
      {
        q: 'Can I change just the balusters and keep my existing handrail?',
        a: 'Usually yes, and it is one of the best-value updates available. The old spindles come out, the holes are prepared, and iron or new timber balusters go in. If the handrail and newel posts are sound, they can be refinished to tie the whole thing together.',
      },
      {
        q: 'Do railings have to meet a code requirement?',
        a: 'Yes. Baluster spacing, handrail height and graspability are all governed by residential code, and the spacing rule exists specifically to stop a small child passing through. We build to those requirements as standard. Local amendments vary by municipality, so we confirm the rules for your village.',
      },
      {
        q: 'How long does a railing change take?',
        a: 'A straightforward baluster swap on a single flight is often a one- to two-day job. Full railing replacement with new posts and handrails takes longer, and adding refinishing extends it further because of coating and cure times.',
      },
    ],
  },
  {
    slug: 'trim-moldings',
    name: 'Trim & Moldings',
    title: 'Trim, Moldings & Finish Carpentry',
    metaTitle: 'Trim, Crown Molding & Finish Carpentry | Chicago Suburbs',
    metaDescription:
      'Baseboards, crown molding, casing, wainscoting and finish carpentry across Chicago’s western and southwest suburbs. Call Martin at (630) 597-8138.',
    summary:
      'Baseboards, casing, crown molding, wainscoting and the finish carpentry that completes a room.',
    keywords: ['Base', 'Casing', 'Crown', 'Panelling'],
    intro:
      'Trim is what makes a room look finished rather than merely painted. It is also unforgiving work: joints that open up, mitres that do not close and coping done badly are visible from across the room and stay visible forever.',
    includes: [
      'Baseboard, shoe molding and quarter round',
      'Door and window casing, including replacement of builder-grade trim',
      'Crown molding, including built-up profiles on taller rooms',
      'Wainscoting, board and batten, and panelled accent walls',
      'Coped inside corners rather than mitred, so joints stay closed as the house moves',
      'Doors hung and adjusted, plus general finish carpentry and repairs',
    ],
    faqs: [
      {
        q: 'Can you match the trim profile in an older home?',
        a: 'In most cases yes. Many historic profiles are still milled or have close modern equivalents, and where nothing matches, a profile can be built up from several stock pieces to reproduce the original line. We take a sample of the existing trim before sourcing.',
      },
      {
        q: 'Should trim go in before or after flooring?',
        a: 'Generally the floor goes down first, then baseboard sits on top of it, which hides the expansion gap and avoids awkward scribing. Where existing baseboard is staying put, shoe molding covers the gap instead. If we are doing both jobs, we sequence them correctly as a matter of course.',
      },
      {
        q: 'Do you paint the trim as well?',
        a: 'Yes — painting is one of the additional services we take on. We can supply trim primed and finish it on site, or install pre-finished material where that suits the schedule better.',
      },
    ],
  },
];

/** Additional work Martin takes on, shown in the "finish the rest" band. */
export const additionalServices = [
  'Kitchen updates',
  'Doors & trim',
  'Interior & exterior painting',
  'Decks & exterior woodwork',
  'General carpentry & repairs',
] as const;

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
