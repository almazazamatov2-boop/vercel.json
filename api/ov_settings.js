import { Redis } from '@upstash/redis';

const redis = process.env.KV_REST_API_URL ? new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
}) : (process.env.UPSTASH_REDIS_REST_URL ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
}) : null);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (!redis) return res.status(500).json({ error: 'Database not configured' });
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const settings = await redis.hgetall(`overlay:settings:${userId}`);
    return res.status(200).json(settings || {});
  }

  if (req.method === 'POST') {
    if (!redis) return res.status(500).json({ error: 'Database not configured' });
    const token = req.cookies.twitch_token;
    if (!token) return res.status(401).json({ error: 'Unauthorized (no token)' });

    const clientId = process.env.TWITCH_CLIENT_ID;
    const authRes = await fetch('https://api.twitch.tv/helix/users', {
      headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId },
    });
    const authData = await authRes.json();
    if (!authRes.ok || !authData.data?.[0]) return res.status(401).json({ error: 'Unauthorized' });

    const userId = authData.data[0].id;
    const body = req.body;

    await redis.hset(`overlay:settings:${userId}`, {
      reward_name: body.reward_name,
      min_val: body.min_val,
      max_val: body.max_val,
      panel_bg_color: body.panel_bg_color,
      name_color: body.name_color,
      num_color: body.num_color,
    });

    return res.status(200).json({ success: true, userId });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
