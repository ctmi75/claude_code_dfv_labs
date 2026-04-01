import Stripe from 'stripe';
import { sendBookingInvites } from '../../../../lib/email';
import { getAdvisor } from '../../../../lib/advisors';
import { packages } from '../../../../lib/packages';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook] Invalid signature:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { advisorId, packageSlug, slotStartTime, slotEndTime } = session.metadata ?? {};

    const advisor = getAdvisor(advisorId);
    const pkg = packages.find((p) => p.id === packageSlug);
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name || 'Guest';

    if (!advisor || !pkg || !slotStartTime || !customerEmail) {
      console.error('[stripe-webhook] Missing booking data', { advisorId, packageSlug, slotStartTime, customerEmail });
      return Response.json({ received: true });
    }

    // Calculate end time from package duration if not stored
    const endTime =
      slotEndTime ||
      new Date(new Date(slotStartTime).getTime() + pkg.duration * 60 * 1000).toISOString();

    try {
      await sendBookingInvites({
        customerEmail,
        customerName,
        advisorEmail: advisor.email,
        advisorName: advisor.name,
        startTime: slotStartTime,
        endTime,
        packageName: pkg.name,
        packageDuration: pkg.duration,
        packagePrice: pkg.price,
      });
      console.log(`[stripe-webhook] Invites sent for ${customerEmail} with ${advisor.name}`);
    } catch (err) {
      // Log but don't fail — payment already succeeded
      console.error('[stripe-webhook] Failed to send invites:', err.message);
    }
  }

  return Response.json({ received: true });
}
