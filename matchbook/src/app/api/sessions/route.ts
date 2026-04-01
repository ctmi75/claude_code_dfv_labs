import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);

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

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', authUser.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const statusParam = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query with joins
    let query = supabase
      .from('sessions')
      .select(
        '*, expert_profile:expert_profiles(*), client:users!sessions_client_id_fkey(id, name, email, avatar_url)',
        { count: 'exact' },
      );

    // Filter by role
    if (userData.role === 'expert') {
      // Get expert profile id
      const { data: profile } = await supabase
        .from('expert_profiles')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (profile) {
        query = query.eq('expert_id', profile.id);
      } else {
        return NextResponse.json({ sessions: [], total: 0 });
      }
    } else {
      query = query.eq('client_id', userData.id);
    }

    // Filter by statuses
    if (statusParam) {
      const statuses = statusParam.split(',').map((s) => s.trim());
      query = query.in('status', statuses);
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: sessions, error, count } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      sessions: sessions ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error('GET /api/sessions error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
