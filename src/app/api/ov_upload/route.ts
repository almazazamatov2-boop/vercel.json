import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = process.env.KV_REST_API_URL ? new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
}) : null;

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({});
  const assets = await redis?.hgetall(`overlay:assets:${userId}`);
  return NextResponse.json(assets || {});
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('twitch_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = process.env.TWITCH_CLIENT_ID;
  const authRes = await fetch('https://api.twitch.tv/helix/users', {
    headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId! },
  });
  const authData = await authRes.json();
  const userId = authData.data?.[0]?.id;
  if (!userId) return NextResponse.json({ error: 'Auth fail' }, { status: 401 });

  const { key, asset } = await req.json();
  await redis?.hset(`overlay:assets:${userId}`, { [key]: asset });
  
  return NextResponse.json({ success: true });
}
