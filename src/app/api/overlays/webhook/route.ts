import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-hub-signature-sha256');
  const messageId = req.headers.get('messenger-message-id');
  const messageTimestamp = req.headers.get('messenger-message-timestamp');

  // Verification logic (optional but recommended for production)
  // ...

  const data = JSON.parse(body);

  if (data.challenge) {
    return new NextResponse(data.challenge);
  }

  const { subscription, event } = data;

  if (subscription.type === 'channel.channel_points_custom_reward_redemption.add') {
    const streamerId = event.broadcaster_user_id;
    const rewardName = event.reward.title;
    const userMessage = event.user_input || '';
    const userName = event.user_name;

    // Load settings to check reward name
    const settings: any = await redis.hgetall(`overlay:settings:${streamerId}`);

    if (settings && settings.reward_name === rewardName) {
      // Parse number from message
      const match = userMessage.match(/\d+/);
      const userChoice = match ? parseInt(match[0]) : null;

      if (userChoice !== null && userChoice >= (settings.min_val || 1) && userChoice <= (settings.max_val || 100)) {
        const triggerId = crypto.randomUUID();
        const payload = {
          triggerId,
          userName,
          userChoice,
          timestamp: Date.now()
        };

        // Store trigger in Redis for the overlay to pick up
        await redis.set(`overlay:trigger:${streamerId}`, JSON.stringify(payload), { ex: 30 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
