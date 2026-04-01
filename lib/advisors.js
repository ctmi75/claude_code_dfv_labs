export const advisors = [
  {
    id: 'christian',
    name: 'Christian',
    role: 'Managing Partner',
    bio: 'Venture investor, operator, and storytelling nerd. Helps founders sharpen their pitch, fundraising strategy, and go-to-market.',
    tags: ['fundraising', 'pitch', 'GTM', 'storytelling'],
    headshotUrl: 'https://drive.google.com/uc?export=view&id=1d-BgRuTA854bkrNmnBsqaU-v2Mjb46sO',
    calendlyUrls: {
      quick: process.env.CALENDLY_URL_CHRISTIAN_QUICK || 'https://calendly.com/christian-dfruitventures/quick-call',
      working: process.env.CALENDLY_URL_CHRISTIAN_WORKING || 'https://calendly.com/christian-dfruitventures/30min',
      strategy: process.env.CALENDLY_URL_CHRISTIAN_STRATEGY || 'https://calendly.com/christian-dfruitventures/strategy-session',
    },
  },
  {
    id: 'matt',
    name: 'Matt',
    role: 'Partner',
    bio: 'Operator turned investor. Deep experience in product, engineering, and scaling early-stage teams.',
    tags: ['product', 'engineering', 'scaling', 'hiring'],
    headshotUrl: 'https://drive.google.com/uc?export=view&id=1_8RI-uVXcqRxt_bsaGIIpe7vIkMfveZQ',
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
    headshotUrl: 'https://drive.google.com/uc?export=view&id=1XwgZytvN9oXrGhhBH8344e0qMdshcFFZ',
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
