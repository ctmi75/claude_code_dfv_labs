import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { createSchedulingLink } from '@/lib/calendly';
import { sendSessionBooked, sendRefundIssued } from '@/lib/email';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object;
        const sessionId = checkoutSession.metadata?.session_id;

        if (!sessionId) {
          console.error('No session_id in checkout metadata');
          break;
        }

        // Find the session
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .select('*, expert_profiles(*), users!sessions_client_id_fkey(*)')
          .eq('stripe_checkout_session_id', checkoutSession.id)
          .single();

        if (sessionError || !session) {
          console.error('Session not found for checkout:', checkoutSession.id);
          break;
        }

        // Update session status
        await supabase
          .from('sessions')
          .update({
            status: 'payment_confirmed',
            stripe_payment_intent_id: checkoutSession.payment_intent,
          })
          .eq('id', session.id);

        // Look up expert's Calendly tokens
        const { data: expertProfile } = await supabase
          .from('expert_profiles')
          .select(
            'calendly_access_token, calendly_event_type_uri, name, user_id'
          )
          .eq('id', session.expert_profile_id)
          .single();

        if (
          expertProfile?.calendly_access_token &&
          expertProfile?.calendly_event_type_uri
        ) {
          // Generate scheduling link
          const schedulingLink = await createSchedulingLink(
            expertProfile.calendly_access_token,
            expertProfile.calendly_event_type_uri
          );

          // Save scheduling link to session
          await supabase
            .from('sessions')
            .update({ calendly_scheduling_link: schedulingLink.booking_url })
            .eq('id', session.id);

          // Get expert user email
          const { data: expertUser } = await supabase
            .from('users')
            .select('email')
            .eq('id', expertProfile.user_id)
            .single();

          // Send booking emails
          await sendSessionBooked({
            clientEmail: session.users?.email || '',
            expertEmail: expertUser?.email || '',
            expertName: expertProfile.name || 'Expert',
            sessionDate: 'To be scheduled',
            calendlyLink: schedulingLink.booking_url,
            clientContext: session.client_context || null,
          });
        }

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;

        if (!paymentIntentId) {
          console.error('No payment_intent on refunded charge');
          break;
        }

        // Find session by payment intent
        const { data: session } = await supabase
          .from('sessions')
          .select('*, users!sessions_client_id_fkey(*)')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single();

        if (!session) {
          console.error(
            'Session not found for payment intent:',
            paymentIntentId
          );
          break;
        }

        // Update session status
        await supabase
          .from('sessions')
          .update({ status: 'refunded' })
          .eq('id', session.id);

        // Send refund email
        const refundAmount = (charge.amount_refunded / 100).toFixed(2);
        await sendRefundIssued({
          clientEmail: session.users?.email || '',
          clientName: session.users?.name || 'Client',
          amount: `$${refundAmount}`,
        });

        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('POST /api/stripe/webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
