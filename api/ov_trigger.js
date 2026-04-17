import { Redis } from '@upstash/redis';

const redis = process.env.KV_REST_API_URL ? new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
}) : (process.env.UPSTASH_REDIS_REST_URL ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
}) : null);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!redis) return res.status(500).json({ error: 'Database not configured' });

  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const trigger = await redis.get(`overlay:trigger:${userId}`);
  return res.status(200).json(trigger ? JSON.parse(trigger) : null);
}
