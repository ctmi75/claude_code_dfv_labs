export const advisors = [
  {
    id: 'christian',
    name: 'Christian',
    email: 'Christian@dfruitventures.com',
    role: 'General Partner',
    bio: 'Venture investor, operator, and storytelling nerd. Helps founders sharpen their pitch, fundraising strategy, and go-to-market.',
    tags: ['fundraising', 'pitch', 'GTM', 'storytelling'],
    headshotUrl: '/headshots/christian.jpg',
    googleCalendarId:
      process.env.GOOGLE_CALENDAR_ID_CHRISTIAN || process.env.GOOGLE_CALENDAR_ID,
  },
  {
    id: 'matt',
    name: 'Matt',
    email: 'Matt@dfruitventures.com',
    role: 'General Partner',
    bio: 'Operator turned investor. Deep experience in product, engineering, and scaling early-stage teams.',
    tags: ['product', 'engineering', 'scaling', 'hiring'],
    headshotUrl: '/headshots/matt.jpg',
    googleCalendarId: process.env.GOOGLE_CALENDAR_ID_MATT || process.env.GOOGLE_CALENDAR_ID,
  },
  {
    id: 'omar',
    name: 'Omar',
    email: 'Omar@dfruitventures.com',
    role: 'General Partner',
    bio: 'Growth and revenue specialist. Helps founders build repeatable sales motions and nail positioning.',
    tags: ['growth', 'sales', 'positioning', 'revenue'],
    headshotUrl: '/headshots/omar.jpg',
    googleCalendarId: process.env.GOOGLE_CALENDAR_ID_OMAR || process.env.GOOGLE_CALENDAR_ID,
  },
  // Virtual advisor for the standalone Deck Review product.
  // Uses a shared team calendar managed by Christian, Matt, and Omar.
  {
    id: 'deck-review',
    name: 'DFV Partner',
    email: 'partnerships@dfruitventures.com',
    role: 'Pitch Deck Review',
    bio: 'Get sharp, actionable feedback on your pitch deck from a DFV partner before you go out to raise. Reviews rotate between Christian, Matt, and Omar.',
    tags: ['deck', 'pitch', 'feedback'],
    headshotUrl: '/logo.png',
    googleCalendarId: process.env.GOOGLE_CALENDAR_ID_DECK_REVIEW || process.env.GOOGLE_CALENDAR_ID,
    // All three partners receive the calendar invite for deck reviews
    deckReviewAttendees: [
      { email: 'Christian@dfruitventures.com', name: 'Christian' },
      { email: 'Matt@dfruitventures.com', name: 'Matt' },
      { email: 'Omar@dfruitventures.com', name: 'Omar' },
    ],
  },
];

export function getAdvisor(id) {
  return advisors.find((a) => a.id === id) || null;
}
