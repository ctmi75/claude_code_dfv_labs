import { NextResponse } from 'next/server';
import { getOAuthUrl } from '@/lib/calendly';

export async function GET() {
  try {
    const oauthUrl = getOAuthUrl();
    return NextResponse.redirect(oauthUrl);
  } catch (err) {
    console.error('GET /api/calendly/auth error:', err);
    return NextResponse.json(
      { error: 'Failed to generate Calendly OAuth URL' },
      { status: 500 }
    );
  }
}
