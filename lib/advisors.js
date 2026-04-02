export const advisors = [
  {
    id: 'christian',
    name: 'Christian',
    email: 'Christian@dfruitventures.com',
    role: 'General Partner',
    bio: 'Venture investor and former operator who\u2019s built and scaled companies from the ground up. Obsessed with storytelling, narrative strategy, and helping founders craft pitches that actually land.',
    tags: ['fundraising', 'pitch', 'GTM', 'storytelling'],
    headshotUrl: '/headshots/christian.jpg',
    // Calendly scheduling URLs per package (booking + payment handled by Calendly)
    calendlyUrls: {
      quick: process.env.CALENDLY_URL_CHRISTIAN_QUICK || '#',
      working: process.env.CALENDLY_URL_CHRISTIAN_WORKING || '#',
      strategy: process.env.CALENDLY_URL_CHRISTIAN_STRATEGY || '#',
    },
  },
  {
    id: 'matt',
    name: 'Matt',
    email: 'Matt@dfruitventures.com',
    role: 'General Partner',
    bio: 'Creator turned investor with deep roots in growth, content, and product. Has driven user acquisition and retention strategy across multiple startups from pre-seed to scale.',
    tags: ['product', 'engineering', 'scaling', 'hiring'],
    headshotUrl: '/headshots/matt.jpg',
    calendlyUrls: {
      quick: process.env.CALENDLY_URL_MATT_QUICK || '#',
      working: process.env.CALENDLY_URL_MATT_WORKING || '#',
      strategy: process.env.CALENDLY_URL_MATT_STRATEGY || '#',
    },
  },
  {
    id: 'omar',
    name: 'Omar',
    email: 'Omar@dfruitventures.com',
    role: 'General Partner',
    bio: 'Former investment banker turned startup operator. Brings a finance-first lens to operations, fundraising, and building the systems that make early-stage companies run.',
    tags: ['growth', 'sales', 'positioning', 'revenue'],
    headshotUrl: '/headshots/omar.jpg',
    calendlyUrls: {
      quick: process.env.CALENDLY_URL_OMAR_QUICK || '#',
      working: process.env.CALENDLY_URL_OMAR_WORKING || '#',
      strategy: process.env.CALENDLY_URL_OMAR_STRATEGY || '#',
    },
  },
  {
    id: 'deck-review',
    name: 'DFV Partner',
    email: 'partnerships@dfruitventures.com',
    role: 'Pitch Deck Review',
    bio: 'A 45-minute live teardown of your pitch deck with a Dragonfruit Ventures partner. Slide-by-slide feedback, narrative coaching, and concrete next steps before you go out to raise.',
    tags: ['deck', 'pitch', 'feedback'],
    headshotUrl: '/DFV-Logo-D-White.png',
    calendlyUrls: {
      'deck-review': process.env.CALENDLY_URL_DECK_REVIEW || 'https://calendly.com/d/cyrm-dsr-3kx/dragonfruit-deck-review',
    },
  },
];

export function getAdvisor(id) {
  return advisors.find((a) => a.id === id) || null;
}
