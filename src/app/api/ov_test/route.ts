import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = process.env.KV_REST_API_URL ? new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
}) : null;

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  if (!redis) return NextResponse.json({ error: 'DB error' }, { status: 500 });
  const token = req.cookies.get('twitch_token')?.value;
  if (!token) return NextResponse.json({ error: 'Auth error' }, { status: 401 });

  const clientId = process.env.TWITCH_CLIENT_ID;
  const authRes = await fetch('https://api.twitch.tv/helix/users', {
    headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId! },
  });
  const authData = await authRes.json();
  if (!authRes.ok || !authData.data?.[0]) return NextResponse.json({ error: 'Twitch Auth Failed' }, { status: 401 });

  const userId = authData.data[0].id;
  const userName = authData.data[0].display_name;

  const settings: any = await redis.hgetall(`overlay:settings:${userId}`) || {};
  const userChoice = Math.floor(Math.random() * ((settings.max_val || 100) - (settings.min_val || 1) + 1)) + (settings.min_val || 1);

  const payload = {
    triggerId: Math.random().toString(36).substring(7),
    userName,
    userChoice,
    timestamp: Date.now(),
    isTest: true
  };

  await redis.set(`overlay:trigger:${userId}`, JSON.stringify(payload), { ex: 60 });
  return NextResponse.json({ success: true, payload });
}
