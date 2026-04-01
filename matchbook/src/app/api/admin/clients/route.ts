import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

async function verifyAdmin(request: NextRequest) {
  const supabase = createServerClient();
  const authHeader = request.headers.get('authorization');
  const token =
    authHeader?.replace('Bearer ', '') ||
    request.cookies.get('sb-access-token')?.value;

  if (!token) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) return null;

  const { data: dbUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!dbUser || dbUser.role !== 'admin') return null;

  return supabase;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await verifyAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all clients
    const { data: clients, error: clientsError } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false });

    if (clientsError) {
      return NextResponse.json(
        { error: clientsError.message },
        { status: 500 }
      );
    }

    // Get session aggregates per client
    const { data: sessions } = await supabase
      .from('sessions')
      .select('client_id, amount_cents');

    const clientAggregates: Record<
      string,
      { sessions_count: number; total_spent: number }
    > = {};

    for (const s of sessions || []) {
      if (!clientAggregates[s.client_id]) {
        clientAggregates[s.client_id] = { sessions_count: 0, total_spent: 0 };
      }
      clientAggregates[s.client_id].sessions_count += 1;
      clientAggregates[s.client_id].total_spent += s.amount_cents || 0;
    }

    const result = (clients || []).map((client) => ({
      ...client,
      sessions_count: clientAggregates[client.id]?.sessions_count || 0,
      total_spent: clientAggregates[client.id]?.total_spent || 0,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/admin/clients error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await verifyAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { client_id, action } = await request.json();

    if (action === 'revoke') {
      const { error: updateError } = await supabase.auth.admin.deleteUser(
        client_id
      );
      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('PATCH /api/admin/clients error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
