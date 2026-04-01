import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_MAP = {
  quick: process.env.STRIPE_PRICE_QUICK,
  working: process.env.STRIPE_PRICE_WORKING,
  strategy: process.env.STRIPE_PRICE_STRATEGY,
};

export async function POST(req) {
  try {
    const { packageSlug, advisorId } = await req.json();
    const priceId = PRICE_MAP[packageSlug];

    if (!priceId) {
      return Response.json({ error: 'Invalid package' }, { status: 400 });
    }

    if (!advisorId) {
      return Response.json({ error: 'Missing advisor' }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/success?package=${packageSlug}&advisor=${advisorId}`,
      cancel_url: `${origin}/${advisorId}`,
      metadata: { package: packageSlug, advisor: advisorId },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
