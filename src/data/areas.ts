/**
 * Service-area pages.
 *
 * IMPORTANT — these must not become doorway pages. Google explicitly demotes
 * sets of near-identical pages that differ only by place name, and a penalty
 * would cost more than the pages earn. Every entry below therefore carries
 * genuinely distinct body copy tied to that town's actual housing stock and
 * what it means for flooring and stair work.
 *
 * If a new town is added, write real copy for it. Do not clone an existing
 * entry and swap the name.
 *
 * TODO(martin): review each `body` for accuracy before launch. These are
 * written from general knowledge of the area's housing and should be corrected
 * where they do not match what you actually see on the ground.
 */

export interface Area {
  slug: string;
  name: string;
  county: string;
  postalCodes: string[];
  metaTitle: string;
  metaDescription: string;
  /** Short blurb for the areas grid. */
  summary: string;
  /** Unique body copy. Each paragraph is rendered separately. */
  body: string[];
  /** Service slugs most relevant here. Drives contextual internal links. */
  focus: string[];
}

export const areas: Area[] = [
  {
    slug: 'willow-springs',
    name: 'Willow Springs',
    county: 'Cook County',
    postalCodes: ['60480'],
    metaTitle: 'Flooring & Stair Contractor in Willow Springs, IL',
    metaDescription:
      'Star 4 Construction is based in Willow Springs — hardwood flooring, refinishing, stairs and railings. Talk to Martin directly at (630) 597-8138.',
    summary: 'Our home village. Shortest travel time and the fastest scheduling we offer.',
    body: [
      'Willow Springs is where Star 4 Construction is based, so this is the one village where we can often look at a job on short notice. If you are local, you are getting a contractor who is a few minutes away rather than one billing travel time from the other side of the county.',
      'The housing here is genuinely mixed. Older cottages and modest post-war homes sit near the river and the canal, while pockets of newer construction went up on the wooded lots further back. That range means there is no single answer to what is under your carpet — we have pulled it back to find beautiful old-growth oak in one house and builder-grade plywood two streets away.',
      'Homes close to the Des Plaines River corridor are worth a closer look at moisture before any wood goes down. Where a basement or lower level runs at higher humidity, engineered material over a proper moisture barrier will stay flat where solid hardwood may not. We test rather than assume.',
    ],
    focus: ['floor-sanding-refinishing', 'stairs', 'floor-installation'],
  },
  {
    slug: 'burr-ridge',
    name: 'Burr Ridge',
    county: 'DuPage & Cook Counties',
    postalCodes: ['60527'],
    metaTitle: 'Hardwood Flooring & Stair Contractor in Burr Ridge, IL',
    metaDescription:
      'Custom staircases, railings, hardwood installation and refinishing for Burr Ridge homes. Call Martin at (630) 597-8138.',
    summary: 'Larger custom homes with the open two-storey entryways that put a staircase centre stage.',
    body: [
      'Burr Ridge homes tend to be larger and newer than the surrounding older villages, with a lot of the housing stock built from the 1980s onward on generous lots. The interiors that came with that era — open plans, two-storey foyers, wide sightlines — put the staircase on display from the front door.',
      'That changes what matters. In a house where you see the railing from the entry, the kitchen and the landing all at once, baluster style and handrail detail carry real weight. Iron baluster retrofits and cable systems are among the most requested jobs we do here, precisely because they change the whole first impression without touching the structure.',
      'Larger floor areas also make continuity a bigger deal. Running the same material through an open main level, with the staircase finished to match, is what stops a big house reading as a series of disconnected rooms. It takes more planning around transitions and expansion, but the result is worth the extra care.',
    ],
    focus: ['railings', 'stairs', 'floor-installation'],
  },
  {
    slug: 'hinsdale',
    name: 'Hinsdale',
    county: 'DuPage & Cook Counties',
    postalCodes: ['60521', '60522'],
    metaTitle: 'Hardwood Floor Refinishing & Stairs in Hinsdale, IL',
    metaDescription:
      'Refinishing original hardwood, stair restoration and finish carpentry for Hinsdale’s historic homes. Call Martin at (630) 597-8138.',
    summary: 'Historic homes with original hardwood that is almost always worth saving.',
    body: [
      'Hinsdale has one of the better collections of historic housing in the western suburbs, and a great deal of it still has its original hardwood underneath whatever went over the top. Old-growth timber from that period is denser and more tightly grained than anything milled today, which is exactly why it is worth refinishing rather than replacing.',
      'Work in these houses calls for restraint. Aggressive sanding takes irreplaceable material off a floor that may already have been refinished more than once, so the first job is measuring what is left before deciding how much can safely come off. Sometimes the honest answer is a lighter screen-and-recoat rather than a full sand.',
      'The stairs and trim in period homes are their own discipline. Original newel posts, turned balusters and built-up moldings can usually be repaired and refinished rather than torn out, and matching a historic trim profile is normally a matter of building it up from several stock pieces. We would rather save the original detail than replace it with something that never quite reads right.',
    ],
    focus: ['floor-sanding-refinishing', 'trim-moldings', 'stairs'],
  },
  {
    slug: 'la-grange',
    name: 'La Grange',
    county: 'Cook County',
    postalCodes: ['60525'],
    metaTitle: 'Hardwood Flooring & Stair Contractor in La Grange, IL',
    metaDescription:
      'Floor refinishing, stair work and trim carpentry for La Grange’s bungalows and Victorians. Call Martin at (630) 597-8138.',
    summary: 'Bungalows and Victorians with narrow-plank oak and staircases worth restoring.',
    body: [
      'La Grange’s older neighbourhoods run to bungalows, foursquares and Victorians, much of it inside or near the historic district. The flooring that came with those houses is typically narrow-strip red oak, often quartersawn in the better examples, and it responds extremely well to being brought back.',
      'Narrow-plank floors need a different sanding approach than modern wide plank. There is more joint length per square foot, the boards are thinner to begin with, and older installations frequently have cupping or minor height differences between boards that have to be flattened without eating through the wear layer. It is slower work and it is the difference between a floor that looks restored and one that looks merely sanded.',
      'Staircases in these homes were built when finish carpentry was standard rather than an upgrade. Original balusters, heavy newel posts and panelled skirt boards are usually repairable, and reinstating that detail lifts an entryway more than a new floor ever will.',
    ],
    focus: ['floor-sanding-refinishing', 'stairs', 'trim-moldings'],
  },
  {
    slug: 'western-springs',
    name: 'Western Springs',
    county: 'Cook County',
    postalCodes: ['60558'],
    metaTitle: 'Flooring, Stairs & Trim Carpentry in Western Springs, IL',
    metaDescription:
      'Hardwood refinishing, stair work and finish carpentry for Western Springs homes. Call Martin at (630) 597-8138.',
    summary: 'Established early-twentieth-century homes where trim detail matters as much as the floor.',
    body: [
      'Much of Western Springs went up in the first half of the twentieth century, and the Tudor, colonial and foursquare housing from that period came with a level of interior millwork that modern construction rarely matches. Deep baseboards, substantial casing and panelled detail are the norm rather than an upgrade.',
      'That raises the bar on finish carpentry. New trim has to match profiles that are no longer stocked, which usually means building a profile up from several pieces until it reads correctly against what is already there. Getting it near-enough is worse than not doing it — a mismatched casing draws the eye every time you walk past.',
      'On floors, the common request here is continuity: extending original hardwood into a renovated kitchen or a rear addition and having the new work disappear into the old. That is a matter of sourcing the right species and cut, weaving new boards into the existing field rather than butting up against it, and refinishing the whole area as one so the colour reads consistently.',
    ],
    focus: ['trim-moldings', 'floor-sanding-refinishing', 'floor-installation'],
  },
  {
    slug: 'countryside',
    name: 'Countryside',
    county: 'Cook County',
    postalCodes: ['60525'],
    metaTitle: 'Flooring & Stair Contractor in Countryside, IL',
    metaDescription:
      'Hardwood, engineered and vinyl flooring plus stair work for Countryside homes. Call Martin at (630) 597-8138.',
    summary: 'Post-war ranches and split-levels where the practical material choice usually wins.',
    body: [
      'Countryside is a smaller community with housing that runs mainly to post-war ranches and split-levels on compact lots. These are practical, well-built houses, and the flooring decisions that suit them are practical too.',
      'Split-levels raise a specific question worth getting right: the lower level frequently sits partly below grade, and that changes what should go down there. Solid hardwood over a slab or below grade is asking for movement, whereas engineered wood or a good luxury vinyl plank handles the humidity swing without cupping. We check the level and test for moisture before recommending anything.',
      'The short runs of stairs between levels are also disproportionately visible in these homes, since you pass them constantly rather than once on the way to bed. Refinishing those treads, or swapping tired spindles for iron balusters, is a small, contained job that changes how the whole middle of the house feels.',
    ],
    focus: ['floor-installation', 'stairs', 'railings'],
  },
  {
    slug: 'lemont',
    name: 'Lemont',
    county: 'Cook, DuPage & Will Counties',
    postalCodes: ['60439'],
    metaTitle: 'Hardwood Flooring & Stair Contractor in Lemont, IL',
    metaDescription:
      'Floor refinishing, stairs and railings for Lemont’s historic and newer homes alike. Call Martin at (630) 597-8138.',
    summary: 'A genuine split between historic village housing and modern subdivisions on the bluffs.',
    body: [
      'Lemont is two different jobs depending on which part of the village you are in. The historic core near the canal has some of the oldest housing in the area, much of it on steeply graded lots, while the newer development up on the bluffs is standard modern subdivision construction.',
      'In the older housing, nothing is square and nothing is level — floors have settled over a century, and stair treads were often cut to fit conditions rather than to a uniform rise. Working in those homes means scribing and fitting piece by piece rather than relying on repeat cuts. It takes longer, and it is the only way the finished work looks right.',
      'The newer homes on the higher ground are a different proposition entirely: consistent dimensions, modern subfloors, and the open two-storey entryways that make a staircase the focal point of the house. Railing upgrades and full stair refinishing are the jobs we are most often called for up there.',
    ],
    focus: ['stairs', 'floor-sanding-refinishing', 'railings'],
  },
  {
    slug: 'palos-park',
    name: 'Palos Park',
    county: 'Cook County',
    postalCodes: ['60464'],
    metaTitle: 'Flooring, Stairs & Railings in Palos Park, IL',
    metaDescription:
      'Custom flooring, staircases and railings for Palos Park’s wooded-lot homes. Call Martin at (630) 597-8138.',
    summary: 'Wooded lots and custom homes where the interior is expected to answer the view.',
    body: [
      'Palos Park sits among the forest preserves, and the housing reflects it — larger wooded lots, plenty of custom and semi-custom building, and a lot of houses designed around the outlook rather than the street. Interiors here tend toward warmer, more natural material choices.',
      'Where a home has significant glazing onto the trees, the flooring has to hold up to direct sunlight. Some species and stains shift colour noticeably over a few years of strong exposure, and a rug left in place through a bright summer can leave a permanent outline. Species selection and finish choice both make a real difference, and it is worth discussing before the material is ordered rather than after.',
      'Railings are where these houses most often want something specific. Cable systems and horizontal rails keep the sightline to the windows open in a way that a run of traditional spindles simply blocks. If the view is the reason you bought the house, the railing should not be the thing interrupting it.',
    ],
    focus: ['railings', 'floor-installation', 'stairs'],
  },
  {
    slug: 'palos-hills',
    name: 'Palos Hills',
    county: 'Cook County',
    postalCodes: ['60465'],
    metaTitle: 'Flooring & Stair Contractor in Palos Hills, IL',
    metaDescription:
      'Hardwood, engineered and vinyl flooring plus stair and railing work in Palos Hills. Call Martin at (630) 597-8138.',
    summary: 'Mixed housing — ranches, split-levels and townhomes, each wanting a different answer.',
    body: [
      'Palos Hills has a broader mix of housing than its neighbours: post-war ranches, split-levels, and a substantial number of townhomes and attached properties. The right flooring answer varies more here than almost anywhere else we work.',
      'Attached homes bring a consideration that detached houses do not — sound transmission to the neighbour below or alongside. Many associations set minimum acoustic underlayment requirements for hard flooring, and installing without meeting them can mean being told to pull it up. We ask about association rules before quoting, and specify underlayment that meets them.',
      'For the ranches and split-levels, the work is usually straightforward and the value is in doing the unseen parts properly: levelling the subfloor, testing for moisture on lower levels, and getting transitions between rooms flat enough that you never catch a toe on them.',
    ],
    focus: ['floor-installation', 'floor-sanding-refinishing', 'stairs'],
  },
  {
    slug: 'orland-park',
    name: 'Orland Park',
    county: 'Cook County',
    postalCodes: ['60462', '60467'],
    metaTitle: 'Hardwood Flooring, Stairs & Railings in Orland Park, IL',
    metaDescription:
      'Flooring installation, stair refinishing and railing upgrades for Orland Park homes. Call Martin at (630) 597-8138.',
    summary: 'Newer subdivisions where the original builder-grade finishes are now due for replacement.',
    body: [
      'A large share of Orland Park’s housing came out of subdivision building from the 1990s onward — two-storey colonials, open main levels, and the volume-builder finish package that came as standard. Those houses are now at the age where the original specification is wearing out.',
      'The pattern we see repeatedly: builder-grade carpet on the stairs, a laminate or lower-grade engineered floor on the main level, and oak spindles that have not aged well. Replacing carpeted treads with solid hardwood and swapping the spindles for iron balusters is the single most transformative job available in these homes, and it is contained enough to finish inside a few days.',
      'Worth checking before choosing material: many homes of this era have at least part of the lower level on or near slab. That does not rule out a wood floor, but it does point toward engineered material over a proper moisture barrier rather than solid hardwood. We test before recommending.',
    ],
    focus: ['stairs', 'railings', 'floor-installation'],
  },
  {
    slug: 'darien',
    name: 'Darien',
    county: 'DuPage County',
    postalCodes: ['60561'],
    metaTitle: 'Flooring & Stair Contractor in Darien, IL',
    metaDescription:
      'Hardwood flooring, refinishing, stairs and railings for Darien homes. Call Martin at (630) 597-8138.',
    summary: 'Subdivisions from the 1970s to 1990s, now well into their first major refresh.',
    body: [
      'Darien’s housing is dominated by subdivision development from roughly the 1970s through the 1990s — split-levels, quad-levels and two-storey colonials. Many of these homes are on their second owner and going through the first serious interior update since they were built.',
      'The good news in houses of this vintage is that there is frequently real hardwood under the carpet on the main level, because oak was still the default subfloor-and-finish choice for a lot of that construction. Before quoting a new floor, it is always worth pulling back a corner in a closet to see what is already there. More than once that has turned a full replacement quote into a much cheaper refinishing job.',
      'Multi-level layouts mean several short flights rather than one main staircase, so stair work here is often about consistency: getting every flight in the house finished to the same colour and sheen, rather than treating each one as a separate job.',
    ],
    focus: ['floor-sanding-refinishing', 'stairs', 'floor-installation'],
  },
  {
    slug: 'downers-grove',
    name: 'Downers Grove',
    county: 'DuPage County',
    postalCodes: ['60515', '60516'],
    metaTitle: 'Hardwood Flooring & Stair Contractor in Downers Grove, IL',
    metaDescription:
      'Floor refinishing, installation, stairs and trim carpentry across Downers Grove. Call Martin at (630) 597-8138.',
    summary: 'One of the most varied housing stocks in the area — from Victorians to mid-century ranches.',
    body: [
      'Downers Grove covers more ground and more eras than most of the villages around it. Streets near the historic centre hold Victorians and early-century homes, including a notable number of catalogue kit houses, while the outer neighbourhoods run to mid-century ranches and later subdivision building.',
      'That variety means the same job description can mean two completely different pieces of work depending on the address. Refinishing original quartersawn oak in a century-old home near downtown has very little in common with refinishing a 1960s ranch floor — different board widths, different wear layers left, different amounts of movement to flatten out. We quote from what is actually in the house, not from a square-footage rate.',
      'The older homes also carry original interior millwork worth protecting. Where trim needs extending into a renovated area, matching the existing profile properly is what keeps the work invisible, and that is usually a build-up job rather than an off-the-shelf purchase.',
    ],
    focus: ['floor-sanding-refinishing', 'trim-moldings', 'stairs'],
  },
];

export function getArea(slug: string): Area | undefined {
  return areas.find((a) => a.slug === slug);
}

/** Town names only — used by the hero strip and the LocalBusiness areaServed. */
export const areaNames = areas.map((a) => a.name);
