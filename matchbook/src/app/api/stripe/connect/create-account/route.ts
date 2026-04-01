import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createConnectAccount, createOnboardingLink } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const authHeader = request.headers.get('authorization');
    const token =
      authHeader?.replace('Bearer ', '') ||
      request.cookies.get('sb-access-token')?.value;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify expert role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'expert') {
      return NextResponse.json(
        { error: 'Only experts can create Stripe Connect accounts' },
        { status: 403 }
      );
    }

    // Create Stripe Connect account
    const account = await createConnectAccount(user.email!);

    // Save stripe_account_id to expert_profiles
    const { error: updateError } = await supabase
      .from('expert_profiles')
      .update({ stripe_account_id: account.id })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error saving stripe_account_id:', updateError);
      return NextResponse.json(
        { error: 'Failed to save Stripe account' },
        { status: 500 }
      );
    }

    // Create onboarding link
    const accountLink = await createOnboardingLink(account.id);

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error('POST /api/stripe/connect/create-account error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
