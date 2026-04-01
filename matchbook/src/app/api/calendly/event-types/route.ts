import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getEventTypes } from '@/lib/calendly';

export async function GET(request: NextRequest) {
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

    // Get expert's Calendly access token
    const { data: expertProfile, error: profileError } = await supabase
      .from('expert_profiles')
      .select('calendly_access_token')
      .eq('user_id', user.id)
      .single();

    if (profileError || !expertProfile) {
      return NextResponse.json(
        { error: 'Expert profile not found' },
        { status: 404 }
      );
    }

    if (!expertProfile.calendly_access_token) {
      return NextResponse.json(
        { error: 'Calendly not connected. Please connect your Calendly account first.' },
        { status: 400 }
      );
    }

    const eventTypes = await getEventTypes(expertProfile.calendly_access_token);

    return NextResponse.json({ event_types: eventTypes });
  } catch (err) {
    console.error('GET /api/calendly/event-types error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
