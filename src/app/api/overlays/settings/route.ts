import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const settings = await redis.hgetall(`overlay:settings:${userId}`);
  return NextResponse.json(settings || {});
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('twitch_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify user via /api/auth/me logic
  const clientId = process.env.TWITCH_CLIENT_ID;
  const authRes = await fetch('https://api.twitch.tv/helix/users', {
    headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId! },
  });
  const authData = await authRes.json();
  if (!authRes.ok || !authData.data?.[0]) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const userId = authData.data[0].id;
  const body = await request.json();

  await redis.hset(`overlay:settings:${userId}`, {
    reward_name: body.reward_name,
    min_val: body.min_val,
    max_val: body.max_val,
    color_bg: body.color_bg,
    color_name: body.color_name,
    color_num: body.color_num,
    updated_at: Date.now(),
  });

  return NextResponse.json({ success: true });
}
