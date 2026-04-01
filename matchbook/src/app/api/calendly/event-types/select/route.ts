import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

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

    const body = await request.json();
    const { eventTypeUri, eventTypeName } = body;

    if (!eventTypeUri || !eventTypeName) {
      return NextResponse.json(
        { error: 'eventTypeUri and eventTypeName are required' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('expert_profiles')
      .update({
        calendly_event_type_uri: eventTypeUri,
        calendly_event_type_name: eventTypeName,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating event type selection:', updateError);
      return NextResponse.json(
        { error: 'Failed to update event type' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/calendly/event-types/select error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
