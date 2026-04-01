import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { capturePaymentIntent, createTransfer } from '@/lib/stripe';

const CRON_SECRET = process.env.CRON_SECRET!;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();

    // Find sessions eligible for payout:
    // status = completed, payout_status = pending,
    // scheduled_at + duration + 24h < now
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);

    const { data: sessions, error: queryError } = await supabase
      .from('sessions')
      .select('*, expert_profiles(stripe_account_id)')
      .eq('status', 'completed')
      .eq('payout_status', 'pending')
      .lt('scheduled_at', cutoffDate.toISOString());

    if (queryError) {
      console.error('Error querying sessions for payout:', queryError);
      return NextResponse.json(
        { error: 'Failed to query sessions' },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        processed: 0,
        succeeded: 0,
        failed: 0,
        message: 'No sessions eligible for payout',
      });
    }

    let succeeded = 0;
    let failed = 0;
    const errors: Array<{ sessionId: string; error: string }> = [];

    for (const session of sessions) {
      try {
        const expertStripeAccountId =
          session.expert_profiles?.stripe_account_id;

        if (!expertStripeAccountId) {
          throw new Error('Expert has no Stripe account');
        }

        if (!session.stripe_payment_intent_id) {
          throw new Error('Session has no payment intent');
        }

        // Capture the payment intent
        await capturePaymentIntent(session.stripe_payment_intent_id);

        // Calculate transfer amount (total - platform fee)
        const transferAmount =
          session.amount_cents - (session.platform_fee_cents || 0);

        // Create transfer to expert's Stripe account
        await createTransfer({
          amount: transferAmount,
          destination: expertStripeAccountId,
          transferGroup: `session_${session.id}`,
        });

        // Update payout status
        await supabase
          .from('sessions')
          .update({
            payout_status: 'transferred',
            payout_transferred_at: new Date().toISOString(),
          })
          .eq('id', session.id);

        succeeded++;
      } catch (err) {
        console.error(`Payout failed for session ${session.id}:`, err);

        // Mark as failed
        await supabase
          .from('sessions')
          .update({ payout_status: 'failed' })
          .eq('id', session.id);

        failed++;
        errors.push({
          sessionId: session.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      processed: sessions.length,
      succeeded,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('GET /api/cron/process-payouts error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
