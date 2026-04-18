import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '50');

    // Fetch records with user info
    const { data: records, error } = await supabase
      .from('game_67_records')
      .select('score, pumps, max_combo, duration, created_at, user:game_67_users(username, login, image)')
      .order('score', { ascending: false })
      .limit(200); // Fetch more to group by user manually if needed, or use a view

    if (error) throw error;

    // Group by user (show only best score per user)
    const uniqueUsers = new Map();
    const lb: any[] = [];

    for (const r of records || []) {
      const user = (r as any).user;
      if (!user) continue;
      if (!uniqueUsers.has(user.login)) {
        uniqueUsers.set(user.login, true);
        lb.push({
          username: user.username,
          login: user.login,
          image: user.image,
          bestScore: r.score,
          maxCombo: r.max_combo,
          gamesPlayed: 1, // Optional: would need a separate count query for accuracy
        });
      }
      if (lb.length >= limit) break;
    }

    const finalLb = lb.map((e, i) => ({ ...e, rank: i + 1 }));

    return NextResponse.json({ success: true, leaderboard: finalLb });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки рейтинга' }, { status: 500 });
  }
}
