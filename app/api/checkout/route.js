import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_MAP = {
  'deck-review': process.env.STRIPE_PRICE_DECK_REVIEW,
  quick: process.env.STRIPE_PRICE_QUICK,
  working: process.env.STRIPE_PRICE_WORKING,
  strategy: process.env.STRIPE_PRICE_STRATEGY,
};

export async function POST(req) {
  try {
    const { packageSlug, advisorId, slotStartTime, slotEndTime } = await req.json();
    const priceId = PRICE_MAP[packageSlug];

    if (!priceId) {
      return Response.json({ error: 'Invalid package' }, { status: 400 });
    }
    if (!advisorId) {
      return Response.json({ error: 'Missing advisor' }, { status: 400 });
    }
    if (!slotStartTime) {
      return Response.json({ error: 'No time slot selected' }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://claude-code-dfv-labs.vercel.app';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      // Collect billing details so we have the customer's name + email for the invite
      billing_address_collection: 'auto',
      success_url: `${origin}/success?package=${packageSlug}&advisor=${advisorId}`,
      cancel_url: `${origin}/${advisorId}`,
      metadata: {
        packageSlug,
        advisorId,
        slotStartTime,
        slotEndTime: slotEndTime || '',
      },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('[checkout]', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
