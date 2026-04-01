import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/?error=missing_code`);
  }

  try {
    const supabase = createServerClient();

    const { data: sessionData, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !sessionData?.user) {
      return NextResponse.redirect(`${APP_URL}/?error=auth_failed`);
    }

    const userId = sessionData.user.id;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.redirect(`${APP_URL}/onboarding`);
    }

    return NextResponse.redirect(`${APP_URL}/dashboard`);
  } catch {
    return NextResponse.redirect(`${APP_URL}/?error=server_error`);
  }
}
