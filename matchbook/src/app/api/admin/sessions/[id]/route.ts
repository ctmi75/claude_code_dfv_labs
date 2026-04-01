import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  capturePaymentIntent,
  createTransfer,
  issueRefund,
} from '@/lib/stripe';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient();
    const { id } = await params;

    // Verify admin
    const authHeader = request.headers.get('authorization');
    const token =
      authHeader?.replace('Bearer ', '') ||
      request.cookies.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // Get session with expert profile
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, expert_profile:expert_profiles(*)')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'approve_payout': {
        const expertProfile = session.expert_profile as {
          stripe_account_id: string | null;
        } | null;

        if (!session.stripe_payment_intent_id) {
          return NextResponse.json(
            { error: 'No payment intent found' },
            { status: 400 }
          );
        }

        if (!expertProfile?.stripe_account_id) {
          return NextResponse.json(
            { error: 'Expert has no Stripe account' },
            { status: 400 }
          );
        }

        // Capture the payment intent
        await capturePaymentIntent(session.stripe_payment_intent_id);

        // Transfer to expert
        const payoutAmount =
          session.amount_cents - session.platform_fee_cents;

        await createTransfer({
          amount: payoutAmount,
          destination: expertProfile.stripe_account_id,
          transferGroup: `session_${session.id}`,
        });

        const { data: updated, error: updateError } = await supabase
          .from('sessions')
          .update({ payout_status: 'transferred' })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
          );
        }

        return NextResponse.json(updated);
      }

      case 'issue_refund': {
        if (!session.stripe_payment_intent_id) {
          return NextResponse.json(
            { error: 'No payment intent found' },
            { status: 400 }
          );
        }

        await issueRefund(session.stripe_payment_intent_id);

        const { data: updated, error: updateError } = await supabase
          .from('sessions')
          .update({ status: 'refunded' })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
          );
        }

        return NextResponse.json(updated);
      }

      case 'cancel': {
        const { data: updated, error: updateError } = await supabase
          .from('sessions')
          .update({ status: 'cancelled' })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
          );
        }

        return NextResponse.json(updated);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('PATCH /api/admin/sessions/[id] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
