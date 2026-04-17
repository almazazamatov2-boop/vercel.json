import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const baseUrl = request.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(`${baseUrl}/overlays?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/overlays?error=no_code`);
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const redirectUri = `${baseUrl}/api/auth/twitch/callback`;

  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twitch Token Error:', data);
      return NextResponse.redirect(`${baseUrl}/overlays?error=auth_failed`);
    }

    // 1. Fetch user ID to register webhook
    const userRes = await fetch('https://api.twitch.tv/helix/users', {
      headers: { 'Authorization': `Bearer ${data.access_token}`, 'Client-Id': clientId! }
    });
    const userData = await userRes.json();
    
    if (userData?.data?.[0]?.id) {
      const userId = userData.data[0].id;
      
      try {
        // 2. Fetch App Access Token
        const appTokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId!,
            client_secret: clientSecret!,
            grant_type: 'client_credentials'
          })
        });
        const appTokenData = await appTokenRes.json();

        // 3. Register EventSub Webhook
        if (appTokenData.access_token) {
          const subRes = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${appTokenData.access_token}`,
              'Client-Id': clientId!,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'channel.channel_points_custom_reward_redemption.add',
              version: '1',
              condition: { broadcaster_user_id: userId },
              transport: {
                method: 'webhook',
                callback: `${baseUrl}/api/ov_webhook`,
                secret: clientSecret || 'fallback_secret_1234567890123'
              }
            })
          });
          if (!subRes.ok) {
            const subErr = await subRes.json();
            console.error('Webhook Sub Error:', subErr);
          }
        }
      } catch (subErr) {
        console.error('Webhook registration failed:', subErr);
      }
    }

    const res = NextResponse.redirect(`${baseUrl}/overlays/dashboard`);
    res.cookies.set('twitch_token', data.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: data.expires_in,
    });

    return res;
  } catch (err) {
    console.error('Callback error:', err);
    return NextResponse.redirect(`${baseUrl}/overlays?error=server_error`);
  }
}
