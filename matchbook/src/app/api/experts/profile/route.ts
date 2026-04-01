import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('sb-access-token')?.value;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      name,
      bio,
      credentials,
      past_roles,
      tags,
      rate_per_hour,
      headshot_url,
      calendly_event_type_uri,
    } = body;

    if (!name || !bio || !rate_per_hour) {
      return NextResponse.json(
        { error: 'Name, bio, and hourly rate are required' },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const { data: existing } = await supabase
      .from('expert_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Profile already exists. Use PUT to update.' },
        { status: 409 }
      );
    }

    const { data: profile, error: insertError } = await supabase
      .from('expert_profiles')
      .insert({
        user_id: user.id,
        name,
        bio,
        credentials: credentials || null,
        past_roles: past_roles || null,
        tags: tags || [],
        rate_per_hour,
        headshot_url: headshot_url || null,
        calendly_event_type_uri: calendly_event_type_uri || null,
        approved: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating expert profile:', insertError);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    console.error('POST /api/experts/profile error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('sb-access-token')?.value;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin';

    // Determine which profile to update
    let profileUserId = user.id;
    if (body.user_id && isAdmin) {
      profileUserId = body.user_id;
    } else if (body.user_id && !isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can update other profiles' },
        { status: 403 }
      );
    }

    // Build update object with only provided fields
    const updateFields: Record<string, unknown> = {};
    const allowedFields = [
      'name',
      'bio',
      'credentials',
      'past_roles',
      'tags',
      'rate_per_hour',
      'headshot_url',
      'calendly_event_type_uri',
      'calendly_event_type_name',
    ];

    // Admin-only fields
    const adminFields = ['approved'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields[field] = body[field];
      }
    }

    if (isAdmin) {
      for (const field of adminFields) {
        if (body[field] !== undefined) {
          updateFields[field] = body[field];
        }
      }
    }

    updateFields.updated_at = new Date().toISOString();

    const { data: profile, error: updateError } = await supabase
      .from('expert_profiles')
      .update(updateFields)
      .eq('user_id', profileUserId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating expert profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('PUT /api/experts/profile error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
