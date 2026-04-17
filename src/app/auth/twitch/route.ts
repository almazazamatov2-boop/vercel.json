import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/twitch/callback`;
  const scope = 'user:read:email chat:read chat:edit channel:read:redemptions';
  
  if (!clientId) {
    return NextResponse.json({ error: 'TWITCH_CLIENT_ID not configured in .env' }, { status: 500 });
  }

  const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(twitchAuthUrl);
}
