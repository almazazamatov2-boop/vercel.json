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
  const trigger = await redis?.get(`overlay:trigger:${userId}`);
  return NextResponse.json(trigger ? (typeof trigger === 'string' ? JSON.parse(trigger) : trigger) : null);
}
