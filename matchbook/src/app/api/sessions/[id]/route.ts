import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { issueRefund } from '@/lib/stripe';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createServerClient();
    const { id } = params;

    const { data: session, error } = await supabase
      .from('sessions')
      .select(
        '*, expert_profile:expert_profiles(*), client:users!sessions_client_id_fkey(id, name, email, avatar_url)',
      )
      .eq('id', id)
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ session });
  } catch (err) {
    console.error('GET /api/sessions/[id] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createServerClient();
    const { id } = params;
    const body = await request.json();
    const { status } = body as { status: string };

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 },
      );
    }

    // Authenticate
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

    // Get the session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      );
    }

    // Handle cancellation with refund
    if (status === 'cancelled') {
      // Check refund window
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('refund_window_hours')
        .single();

      const refundWindowHours = settings?.refund_window_hours ?? 24;
      const sessionCreated = new Date(session.created_at);
      const now = new Date();
      const hoursSinceCreation =
        (now.getTime() - sessionCreated.getTime()) / (1000 * 60 * 60);

      let newStatus = 'cancelled';

      if (
        session.stripe_payment_intent_id &&
        hoursSinceCreation <= refundWindowHours
      ) {
        try {
          await issueRefund(session.stripe_payment_intent_id);
          newStatus = 'refunded';
        } catch (refundErr) {
          console.error('Refund failed:', refundErr);
          // Still cancel even if refund fails
        }
      }

      const { data: updated, error: updateError } = await supabase
        .from('sessions')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to cancel session' },
          { status: 500 },
        );
      }

      return NextResponse.json({ session: updated });
    }

    // Handle completion
    if (status === 'completed') {
      const { data: updated, error: updateError } = await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to complete session' },
          { status: 500 },
        );
      }

      return NextResponse.json({ session: updated });
    }

    // Generic status update
    const { data: updated, error: updateError } = await supabase
      .from('sessions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 },
      );
    }

    return NextResponse.json({ session: updated });
  } catch (err) {
    console.error('PATCH /api/sessions/[id] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
