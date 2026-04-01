import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');

    if (!accountId) {
      return NextResponse.redirect(
        `${APP_URL}/onboarding?step=3&stripe=error&reason=missing_account`
      );
    }

    // Check account status
    const account = await stripe.accounts.retrieve(accountId);

    if (account.charges_enabled) {
      const supabase = createServerClient();

      const { error: updateError } = await supabase
        .from('expert_profiles')
        .update({ stripe_onboarding_complete: true })
        .eq('stripe_account_id', accountId);

      if (updateError) {
        console.error('Error updating stripe onboarding status:', updateError);
        return NextResponse.redirect(
          `${APP_URL}/onboarding?step=3&stripe=error&reason=db_update_failed`
        );
      }

      return NextResponse.redirect(
        `${APP_URL}/onboarding?step=3&stripe=connected`
      );
    }

    // Charges not yet enabled, redirect back to onboarding
    return NextResponse.redirect(
      `${APP_URL}/onboarding?step=3&stripe=pending`
    );
  } catch (err) {
    console.error('GET /api/stripe/connect/callback error:', err);
    return NextResponse.redirect(
      `${APP_URL}/onboarding?step=3&stripe=error`
    );
  }
}
