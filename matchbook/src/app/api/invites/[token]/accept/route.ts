import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { Invite } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch and validate the invite
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      );
    }

    const typedInvite = invite as Invite;

    if (typedInvite.used) {
      return NextResponse.json(
        { error: 'This invite has already been used' },
        { status: 410 }
      );
    }

    if (new Date(typedInvite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invite has expired' },
        { status: 410 }
      );
    }

    // If the invite is tied to a specific email, enforce it
    if (typedInvite.email && typedInvite.email !== email) {
      return NextResponse.json(
        { error: 'Email does not match the invite' },
        { status: 400 }
      );
    }

    // Mark invite as used
    const { error: updateError } = await supabase
      .from('invites')
      .update({ used: true })
      .eq('id', typedInvite.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to process invite' },
        { status: 500 }
      );
    }

    // Send magic link to the invited user
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${APP_URL}/api/auth/callback`,
      },
    });

    if (otpError) {
      // Revert the invite usage on failure
      await supabase
        .from('invites')
        .update({ used: false })
        .eq('id', typedInvite.id);

      return NextResponse.json(
        { error: otpError.message },
        { status: 500 }
      );
    }

    // Pre-create the user record with the role from the invite.
    // We look up the auth user by email so we can use their auth ID.
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find((u) => u.email === email);

    if (authUser) {
      await supabase.from('users').upsert(
        {
          id: authUser.id,
          email,
          role: typedInvite.role,
          name: '',
        },
        { onConflict: 'id' }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
