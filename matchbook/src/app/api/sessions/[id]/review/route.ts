import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createServerClient();
    const sessionId = params.id;
    const body = await request.json();
    const { rating, note } = body as { rating: number; note?: string | null };

    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
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
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      );
    }

    // Validate: session must be completed
    if (session.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only review completed sessions' },
        { status: 400 },
      );
    }

    // Validate: reviewer must be the client
    if (session.client_id !== authUser.id) {
      return NextResponse.json(
        { error: 'Only the client can leave a review' },
        { status: 403 },
      );
    }

    // Check for existing review
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'A review already exists for this session' },
        { status: 409 },
      );
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        session_id: sessionId,
        client_id: authUser.id,
        expert_id: session.expert_id,
        rating,
        note: note || null,
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Failed to create review:', reviewError);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 },
      );
    }

    // Update expert rating_avg and review_count
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('expert_id', session.expert_id);

    if (allReviews && allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / allReviews.length;

      await supabase
        .from('expert_profiles')
        .update({
          rating_avg: Math.round(avgRating * 100) / 100,
          review_count: allReviews.length,
        })
        .eq('id', session.expert_id);
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error('POST /api/sessions/[id]/review error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
