import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { exchangeCodeForTokens, getCurrentUser } from '@/lib/calendly';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(
        `${APP_URL}/onboarding?step=2&calendly=error&reason=missing_code`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get Calendly user info
    const calendlyUser = await getCurrentUser(tokens.access_token);

    // Get authenticated user
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
      return NextResponse.redirect(
        `${APP_URL}/onboarding?step=2&calendly=error&reason=unauthorized`
      );
    }

    // Update expert profile with Calendly tokens
    const { error: updateError } = await supabase
      .from('expert_profiles')
      .update({
        calendly_access_token: tokens.access_token,
        calendly_refresh_token: tokens.refresh_token,
        calendly_user_uri: calendlyUser.uri,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error saving Calendly tokens:', updateError);
      return NextResponse.redirect(
        `${APP_URL}/onboarding?step=2&calendly=error&reason=db_update_failed`
      );
    }

    return NextResponse.redirect(
      `${APP_URL}/onboarding?step=2&calendly=connected`
    );
  } catch (err) {
    console.error('GET /api/calendly/callback error:', err);
    return NextResponse.redirect(
      `${APP_URL}/onboarding?step=2&calendly=error`
    );
  }
}
