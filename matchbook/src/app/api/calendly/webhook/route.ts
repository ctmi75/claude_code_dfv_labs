import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { issueRefund } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, payload } = body;

    if (!event || !payload) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    switch (event) {
      case 'invitee.created': {
        const schedulingLink = payload.scheduling_url;
        const calendlyEventUri = payload.event;
        const scheduledAt = payload.scheduled_event?.start_time || null;

        if (!schedulingLink) {
          console.error('No scheduling_url in invitee.created payload');
          break;
        }

        // Find session by calendly_scheduling_link
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .select('id')
          .eq('calendly_scheduling_link', schedulingLink)
          .single();

        if (sessionError || !session) {
          console.error(
            'Session not found for scheduling link:',
            schedulingLink
          );
          break;
        }

        // Update session with event details
        await supabase
          .from('sessions')
          .update({
            calendly_event_uri: calendlyEventUri,
            status: 'confirmed',
            scheduled_at: scheduledAt,
          })
          .eq('id', session.id);

        break;
      }

      case 'invitee.canceled': {
        const canceledEventUri = payload.event;

        if (!canceledEventUri) {
          console.error('No event URI in invitee.canceled payload');
          break;
        }

        // Find session by calendly_event_uri
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .select('id, scheduled_at, stripe_payment_intent_id, client_id')
          .eq('calendly_event_uri', canceledEventUri)
          .single();

        if (sessionError || !session) {
          console.error(
            'Session not found for event URI:',
            canceledEventUri
          );
          break;
        }

        // Check refund policy: full refund if scheduled_at > 24h away
        const now = new Date();
        const scheduledAt = session.scheduled_at
          ? new Date(session.scheduled_at)
          : null;
        const twentyFourHoursFromNow = new Date(
          now.getTime() + 24 * 60 * 60 * 1000
        );

        if (
          scheduledAt &&
          scheduledAt > twentyFourHoursFromNow &&
          session.stripe_payment_intent_id
        ) {
          // Full refund - more than 24h away
          try {
            await issueRefund(session.stripe_payment_intent_id);
            await supabase
              .from('sessions')
              .update({ status: 'canceled_refunded' })
              .eq('id', session.id);
          } catch (refundErr) {
            console.error('Failed to issue refund:', refundErr);
            await supabase
              .from('sessions')
              .update({ status: 'canceled_refund_failed' })
              .eq('id', session.id);
          }
        } else {
          // No refund - less than 24h away or no scheduled time
          await supabase
            .from('sessions')
            .update({ status: 'canceled_no_refund' })
            .eq('id', session.id);
        }

        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('POST /api/calendly/webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
