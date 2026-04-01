import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);

    // Check if requester is admin
    let isAdmin = false;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('sb-access-token')?.value;

    if (token) {
      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        isAdmin = userData?.role === 'admin';
      }
    }

    // Parse query params
    const tags = searchParams.get('tags');
    const minRate = searchParams.get('minRate');
    const maxRate = searchParams.get('maxRate');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabase.from('expert_profiles').select('*', { count: 'exact' });

    // Non-admins only see approved profiles
    if (!isAdmin) {
      query = query.eq('approved', true);
    }

    // Filter by tags (overlap — any matching tag)
    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim());
      query = query.overlaps('tags', tagList);
    }

    // Filter by rate range
    if (minRate) {
      query = query.gte('rate_per_hour', parseFloat(minRate));
    }
    if (maxRate) {
      query = query.lte('rate_per_hour', parseFloat(maxRate));
    }

    // Fuzzy search on name and bio
    if (search) {
      query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%`);
    }

    // Sorting
    switch (sort) {
      case 'rating':
        query = query.order('rating_avg', { ascending: false, nullsFirst: false });
        break;
      case 'price_asc':
        query = query.order('rate_per_hour', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('rate_per_hour', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: experts, error, count } = await query;

    if (error) {
      console.error('Error fetching experts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch experts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      experts: experts || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error('GET /api/experts error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
