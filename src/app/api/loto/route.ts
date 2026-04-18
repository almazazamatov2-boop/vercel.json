import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to generate a 6-char lobby code
function generateLobbyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;

    switch (action) {
      case 'auth': {
        const { userId, nickname } = data;
        
        // Upsert user profile
        const { data: user, error } = await supabase
          .from('loto_players')
          .upsert({ 
            id: userId, 
            nickname: nickname || 'Игрок',
            avatar: '👤'
          })
          .select()
          .single();

        if (error) return NextResponse.json({ type: 'error', message: error.message });
        
        return NextResponse.json({ type: 'auth_success', user });
      }

      case 'create_lobby': {
        const { userId, name, maxPlayers } = data;
        const code = generateLobbyCode();
        
        const { data: lobby, error } = await supabase
          .from('loto_lobbies')
          .insert({
            code,
            name,
            admin_id: userId,
            max_players: maxPlayers || 10,
            status: 'waiting'
          })
          .select()
          .single();

        if (error) return NextResponse.json({ type: 'error', message: error.message });
        
        return NextResponse.json({ type: 'lobby_created', lobby });
      }

      case 'join_lobby': {
        const { userId, code } = data;
        
        const { data: lobby, error } = await supabase
          .from('loto_lobbies')
          .select('*')
          .eq('code', code)
          .single();

        if (error || !lobby) return NextResponse.json({ type: 'error', message: 'Лобби не найдено' });
        if (lobby.status !== 'waiting') return NextResponse.json({ type: 'error', message: 'Игра уже идет' });

        return NextResponse.json({ 
          type: 'lobby_joined', 
          lobbyId: lobby.id,
          isAdmin: lobby.admin_id === userId
        });
      }

      case 'start_game': {
        const { userId, lobbyId } = data;
        
        const { error } = await supabase
          .from('loto_lobbies')
          .update({ status: 'playing' })
          .eq('id', lobbyId)
          .eq('admin_id', userId);

        if (error) return NextResponse.json({ type: 'error', message: 'Не удалось начать игру' });
        
        return NextResponse.json({ type: 'game_started' });
      }

      case 'draw_number': {
        const { userId, lobbyId, number } = data;
        
        // Get current drawn numbers
        const { data: lobby } = await supabase
          .from('loto_lobbies')
          .select('drawn_numbers, admin_id')
          .eq('id', lobbyId)
          .single();

        if (!lobby) return NextResponse.json({ type: 'error', message: 'Лобби не найдено' });
        if (lobby.admin_id !== userId) return NextResponse.json({ type: 'error', message: 'Только админ может тянуть бочонки' });

        const newDrawn = [...(lobby.drawn_numbers || []), number];
        
        const { error } = await supabase
          .from('loto_lobbies')
          .update({ drawn_numbers: newDrawn })
          .eq('id', lobbyId);

        if (error) return NextResponse.json({ type: 'error', message: error.message });
        
        return NextResponse.json({ type: 'number_drawn', number, all: newDrawn });
      }

      case 'chat_message': {
        const { userId, lobbyId, text, nickname } = data;
        
        const { data: msg, error } = await supabase
          .from('loto_chat')
          .insert({
            lobby_id: lobbyId,
            user_id: userId,
            nickname: nickname || 'Игрок',
            text
          })
          .select()
          .single();

        if (error) return NextResponse.json({ type: 'error', message: error.message });
        
        return NextResponse.json({ type: 'chat_message', message: msg });
      }

      case 'mark_cell': {
        // We can just return success or update a progress table if needed
        return NextResponse.json({ type: 'progress_updated' });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('Supabase Loto API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'get_state': {
        const lobbyId = searchParams.get('lobbyId');
        if (!lobbyId) return NextResponse.json({ error: 'Missing lobbyId' }, { status: 400 });

        const [lobbyRes, chatRes] = await Promise.all([
          supabase.from('loto_lobbies').select('*').eq('id', lobbyId).single(),
          supabase.from('loto_chat').select('*').eq('lobby_id', lobbyId).order('created_at', { ascending: false }).limit(20)
        ]);

        if (lobbyRes.error) return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });

        return NextResponse.json({
          type: 'state_update',
          lobby: {
             ...lobbyRes.data,
             players: [] // In a simple migration, we could fetch players too, but let's keep it simple first
          },
          drawn: lobbyRes.data.drawn_numbers || [],
          chat: chatRes.data?.map(m => ({ 
            ...m, 
            timestamp: new Date(m.created_at).getTime() 
          })).reverse() || []
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=2'
          }
        });
      }

      case 'list_lobbies': {
        const { data: lobbies } = await supabase
          .from('loto_lobbies')
          .select('*')
          .eq('status', 'waiting')
          .limit(10);
          
        return NextResponse.json(lobbies || []);
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
