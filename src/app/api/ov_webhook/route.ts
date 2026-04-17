import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = process.env.KV_REST_API_URL ? new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
}) : null;

export const runtime = 'edge';

async function getAppToken() {
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: 'client_credentials'
    })
  });
  const data = await res.json();
  return data.access_token;
}

async function getUserAvatar(userId: string, appToken: string) {
  const res = await fetch(`https://api.twitch.tv/helix/users?id=${userId}`, {
    headers: {
      'Authorization': `Bearer ${appToken}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID!
    }
  });
  const data = await res.json();
  return data.data?.[0]?.profile_image_url;
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (data.challenge) return new NextResponse(data.challenge);

  const { subscription, event } = data;
  if (subscription?.type === 'channel.channel_points_custom_reward_redemption.add') {
    const streamerId = event.broadcaster_user_id;
    const rewardName = event.reward.title;
    const userId = event.user_id;
    const userName = event.user_name;
    const userMessage = event.user_input || '';

    const settings: any = await redis?.hgetall(`overlay:settings:${streamerId}`);
    if (settings?.reward_name === rewardName) {
      const match = userMessage.match(/\d+/);
      const userChoice = match ? parseInt(match[0]) : null;
      
      if (userChoice !== null) {
        // Fetch avatar for the redeemer
        const appToken = await getAppToken();
        const userAvatar = await getUserAvatar(userId, appToken);

        const payload = {
          triggerId: Math.random().toString(36).substring(7),
          userName,
          userAvatar,
          userChoice,
          timestamp: Date.now()
        };
        await redis?.set(`overlay:trigger:${streamerId}`, JSON.stringify(payload), { ex: 30 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
