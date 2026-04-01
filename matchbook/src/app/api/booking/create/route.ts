import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { expertId, clientContext, duration } = body as {
      expertId: string;
      clientContext?: string;
      duration: number;
    };

    if (!expertId || !duration) {
      return NextResponse.json(
        { error: 'expertId and duration are required' },
        { status: 400 },
      );
    }

    // Authenticate caller
    const authHeader = request.headers.get('authorization');
    const token =
      authHeader?.replace('Bearer ', '') ||
      request.cookies.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser(token);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client user record
    const { data: clientUser, error: clientError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', authUser.id)
      .single();

    if (clientError || !clientUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get expert profile
    const { data: expert, error: expertError } = await supabase
      .from('expert_profiles')
      .select('*')
      .eq('id', expertId)
      .single();

    if (expertError || !expert) {
      return NextResponse.json(
        { error: 'Expert not found' },
        { status: 404 },
      );
    }

    if (!expert.stripe_account_id) {
      return NextResponse.json(
        { error: 'Expert has not completed payment setup' },
        { status: 400 },
      );
    }

    // Calculate amounts
    const amountCents = Math.round(expert.rate_per_hour * (duration / 60));

    // Get platform fee percentage
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('platform_fee_percent')
      .single();

    const feePercent = settings?.platform_fee_percent ?? 15;
    const platformFeeCents = Math.round(amountCents * feePercent / 100);

    // Create session row
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        expert_id: expert.id,
        client_id: clientUser.id,
        status: 'pending_payment',
        duration_minutes: duration,
        amount_cents: amountCents,
        platform_fee_cents: platformFeeCents,
        client_context: clientContext || null,
        payout_status: 'pending',
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error('Failed to create session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 },
      );
    }

    // Create Stripe Checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkoutSession = await createCheckoutSession({
      sessionId: session.id,
      expertStripeAccountId: expert.stripe_account_id,
      amountCents,
      platformFeeCents,
      customerEmail: clientUser.email,
      successUrl: `${appUrl}/booking/success?session_id=${session.id}`,
      cancelUrl: `${appUrl}/booking/cancel?session_id=${session.id}`,
    });

    // Store checkout session ID
    await supabase
      .from('sessions')
      .update({ stripe_checkout_session_id: checkoutSession.id })
      .eq('id', session.id);

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error('POST /api/booking/create error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
