import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Verify admin
    const authHeader = request.headers.get('authorization');
    const token =
      authHeader?.replace('Bearer ', '') ||
      request.cookies.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Total GMV (sum of amount_cents)
    const { data: gmvData } = await supabase
      .from('sessions')
      .select('amount_cents');

    const total_gmv = (gmvData || []).reduce(
      (sum, s) => sum + (s.amount_cents || 0),
      0
    );

    // Total fees (sum of platform_fee_cents)
    const { data: feeData } = await supabase
      .from('sessions')
      .select('platform_fee_cents');

    const total_fees = (feeData || []).reduce(
      (sum, s) => sum + (s.platform_fee_cents || 0),
      0
    );

    // Total payouts (sum of amount_cents - platform_fee_cents for transferred sessions)
    const { data: payoutData } = await supabase
      .from('sessions')
      .select('amount_cents, platform_fee_cents')
      .eq('payout_status', 'transferred');

    const total_payouts = (payoutData || []).reduce(
      (sum, s) => sum + ((s.amount_cents || 0) - (s.platform_fee_cents || 0)),
      0
    );

    // Expert count (approved)
    const { count: expert_count } = await supabase
      .from('expert_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('approved', true);

    // Client count
    const { count: client_count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'client');

    // Session count
    const { count: session_count } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true });

    // Recent sessions (last 10)
    const { data: recent_sessions } = await supabase
      .from('sessions')
      .select('*, expert_profile:expert_profiles(*), client:users!sessions_client_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(10);

    // Top experts by revenue
    const { data: allSessions } = await supabase
      .from('sessions')
      .select('expert_id, amount_cents, expert_profile:expert_profiles(name, rating_avg)')
      .in('status', ['completed', 'confirmed', 'payment_confirmed']);

    const expertRevenueMap: Record<
      string,
      { name: string; revenue: number; sessions: number; rating: number | null }
    > = {};

    for (const s of allSessions || []) {
      const profile = s.expert_profile as unknown as { name: string; rating_avg: number | null } | null;
      if (!profile) continue;

      if (!expertRevenueMap[s.expert_id]) {
        expertRevenueMap[s.expert_id] = {
          name: profile.name,
          revenue: 0,
          sessions: 0,
          rating: profile.rating_avg,
        };
      }
      expertRevenueMap[s.expert_id].revenue += s.amount_cents || 0;
      expertRevenueMap[s.expert_id].sessions += 1;
    }

    const top_experts = Object.values(expertRevenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      total_gmv,
      total_fees,
      total_payouts,
      expert_count: expert_count || 0,
      client_count: client_count || 0,
      session_count: session_count || 0,
      recent_sessions: recent_sessions || [],
      top_experts,
    });
  } catch (err) {
    console.error('GET /api/admin/stats error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
