import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const trigger = await redis.get(`overlay:trigger:${userId}`);
  
  // Optional: clear trigger after reading
  // if (trigger) await redis.del(`overlay:trigger:${userId}`);

  return NextResponse.json(trigger ? JSON.parse(trigger as string) : null);
}
