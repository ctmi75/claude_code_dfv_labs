export const advisors = [
  {
    id: 'christian',
    name: 'Christian',
    role: 'Managing Partner',
    bio: 'Venture investor, operator, and storytelling nerd. Helps founders sharpen their pitch, fundraising strategy, and go-to-market.',
    tags: ['fundraising', 'pitch', 'GTM', 'storytelling'],
    headshotUrl: '/headshots/christian.jpg',
    calendlyUrls: {
      quick: process.env.CALENDLY_URL_CHRISTIAN_QUICK || process.env.CALENDLY_URL_QUICK,
      working: process.env.CALENDLY_URL_CHRISTIAN_WORKING || process.env.CALENDLY_URL_WORKING,
      strategy: process.env.CALENDLY_URL_CHRISTIAN_STRATEGY || process.env.CALENDLY_URL_STRATEGY,
    },
  },
  {
    id: 'matt',
    name: 'Matt',
    role: 'Partner',
    bio: 'Operator turned investor. Deep experience in product, engineering, and scaling early-stage teams.',
    tags: ['product', 'engineering', 'scaling', 'hiring'],
    headshotUrl: '/headshots/matt.jpg',
    calendlyUrls: {
      quick: process.env.CALENDLY_URL_MATT_QUICK,
      working: process.env.CALENDLY_URL_MATT_WORKING,
      strategy: process.env.CALENDLY_URL_MATT_STRATEGY,
    },
  },
  {
    id: 'omar',
    name: 'Omar',
    role: 'Partner',
    bio: 'Growth and revenue specialist. Helps founders build repeatable sales motions and nail positioning.',
    tags: ['growth', 'sales', 'positioning', 'revenue'],
    headshotUrl: '/headshots/omar.jpg',
    calendlyUrls: {
      quick: process.env.CALENDLY_URL_OMAR_QUICK,
      working: process.env.CALENDLY_URL_OMAR_WORKING,
      strategy: process.env.CALENDLY_URL_OMAR_STRATEGY,
    },
  },
];

export function getAdvisor(id) {
  return advisors.find((a) => a.id === id) || null;
}
