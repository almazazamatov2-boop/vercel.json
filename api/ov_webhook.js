import { Redis } from '@upstash/redis';

const redis = process.env.KV_REST_API_URL ? new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
}) : (process.env.UPSTASH_REDIS_REST_URL ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
}) : null);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!redis) return res.status(500).json({ ok: false, error: 'Database unconfigured' });

  const data = req.body;

  if (data.challenge) {
    return res.status(200).send(data.challenge);
  }

  const { subscription, event } = data;

  if (subscription?.type === 'channel.channel_points_custom_reward_redemption.add') {
    const streamerId = event.broadcaster_user_id;
    const rewardName = event.reward.title;
    const userMessage = event.user_input || '';
    const userName = event.user_name;

    const settings = await redis.hgetall(`overlay:settings:${streamerId}`);

    if (settings && settings.reward_name === rewardName) {
      const match = userMessage.match(/\d+/);
      const userChoice = match ? parseInt(match[0]) : null;

      if (userChoice !== null && userChoice >= (parseInt(settings.min_val) || 1) && userChoice <= (parseInt(settings.max_val) || 100)) {
        const payload = {
          triggerId: Math.random().toString(36).substring(7),
          userName,
          userChoice,
          timestamp: Date.now()
        };
        await redis.set(`overlay:trigger:${streamerId}`, JSON.stringify(payload), { ex: 30 });
      }
    }
  }

  return res.status(200).json({ ok: true });
}
