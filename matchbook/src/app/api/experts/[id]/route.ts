import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createServerClient();
    const { id } = params;

    // Get expert profile
    const { data: expert, error } = await supabase
      .from('expert_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !expert) {
      return NextResponse.json(
        { error: 'Expert not found' },
        { status: 404 },
      );
    }

    // Get reviews for this expert
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*, client:users!reviews_client_id_fkey(id, name, avatar_url)')
      .eq('expert_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      expert,
      reviews: reviews ?? [],
      rating_avg: expert.rating_avg,
      review_count: expert.review_count,
    });
  } catch (err) {
    console.error('GET /api/experts/[id] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
