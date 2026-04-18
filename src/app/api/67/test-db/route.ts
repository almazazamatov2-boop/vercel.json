import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: {
      has_url: !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
      has_key: !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
      has_twitch_id: !!process.env.TWITCH_CLIENT_ID,
    }
  };

  try {
    // Attempt a simple query
    const { data, error } = await supabase.from('game_67_users').select('count', { count: 'exact', head: true });
    
    if (error) {
      diagnostics.supabase_error = error;
      diagnostics.status = '❌ Database error';
    } else {
      diagnostics.status = '✅ Connection successful';
      diagnostics.user_count = data;
    }
  } catch (e: any) {
    diagnostics.exception = e.message;
    diagnostics.status = '🔥 Crash during test';
  }

  return NextResponse.json(diagnostics);
}
