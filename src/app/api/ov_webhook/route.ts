import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = process.env.KV_REST_API_URL ? new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
}) : null;

export const runtime = 'edge';

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
        const payload = {
          triggerId: Math.random().toString(36).substring(7),
          userName,
          userChoice,
          timestamp: Date.now()
        };
        await redis?.set(`overlay:trigger:${streamerId}`, JSON.stringify(payload), { ex: 30 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
