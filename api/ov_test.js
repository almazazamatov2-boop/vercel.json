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

  try {
    if (!redis) return res.status(500).json({ error: 'Database not configured' });
    
    const token = req.cookies.twitch_token;
    if (!token) return res.status(401).json({ error: 'Unauthorized (no token)' });

    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: 'Server config missing (Client ID)' });

    const authRes = await fetch('https://api.twitch.tv/helix/users', {
      headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId },
    });
    
    const authData = await authRes.json();
    if (!authRes.ok || !authData.data?.[0]) {
      return res.status(401).json({ error: 'Twitch auth failed' });
    }

    const userId = authData.data[0].id;
    const userName = authData.data[0].display_name;

    const settings = await redis.hgetall(`overlay:settings:${userId}`) || {};
    const min = parseInt(settings.min_val) || 1;
    const max = parseInt(settings.max_val) || 100;
    const userChoice = Math.floor(Math.random() * (max - min + 1)) + min;

    const payload = {
      triggerId: Math.random().toString(36).substring(7),
      userName,
      userChoice,
      timestamp: Date.now(),
      isTest: true,
    };

    await redis.set(`overlay:trigger:${userId}`, JSON.stringify(payload), { ex: 60 });

    return res.status(200).json({ success: true, userId, payload });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
