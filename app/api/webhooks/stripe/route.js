import Stripe from 'stripe';
import { sendBookingConfirmation } from '../../../../lib/email';
import { createCalendarEvent } from '../../../../lib/google-calendar';
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
      console.error('[stripe-webhook] Missing booking data', {
        advisorId,
        packageSlug,
        slotStartTime,
        customerEmail,
      });
      return Response.json({ received: true });
    }

    const endTime =
      slotEndTime ||
      new Date(new Date(slotStartTime).getTime() + pkg.duration * 60 * 1000).toISOString();

    const isDeckReview = advisorId === 'deck-review';

    // For deck reviews, invite all three partners; for 1:1s, invite the specific advisor
    const advisorAttendees = isDeckReview
      ? (advisor.deckReviewAttendees ?? [{ email: advisor.email, name: advisor.name }])
      : [{ email: advisor.email, name: advisor.name }];

    // 1. Create Google Calendar event (sends invites automatically)
    let meetLink = null;
    try {
      const calEvent = await createCalendarEvent({
        calendarId: advisor.googleCalendarId,
        summary: isDeckReview
          ? `Pitch Deck Review — ${customerName}`
          : `${pkg.duration}-min Session with ${advisor.name} — ${customerName}`,
        description: [
          `${pkg.name} booked via Dragon Fruit Ventures`,
          `Customer: ${customerName} <${customerEmail}>`,
          `Package: ${pkg.name} ($${pkg.price})`,
        ].join('\n'),
        startTime: slotStartTime,
        endTime,
        attendees: [
          { email: customerEmail, name: customerName },
          ...advisorAttendees,
        ],
      });
      meetLink = calEvent?.hangoutLink ?? null;
      console.log(`[stripe-webhook] Calendar event created: ${calEvent?.htmlLink}`);
    } catch (err) {
      // Log but don't fail — payment already succeeded
      console.error('[stripe-webhook] Failed to create calendar event:', err.message);
    }

    // 2. Send payment-confirmation email (no ICS — Google Cal handles the invite)
    try {
      await sendBookingConfirmation({
        customerEmail,
        customerName,
        advisorEmail: isDeckReview ? advisor.email : advisor.email,
        advisorName: isDeckReview ? 'a DFV Partner' : advisor.name,
        startTime: slotStartTime,
        endTime,
        packageName: pkg.name,
        packageDuration: pkg.duration,
        packagePrice: pkg.price,
        meetLink,
      });
      console.log(`[stripe-webhook] Confirmation sent to ${customerEmail}`);
    } catch (err) {
      console.error('[stripe-webhook] Failed to send confirmation email:', err.message);
    }
  }

  return Response.json({ received: true });
}
