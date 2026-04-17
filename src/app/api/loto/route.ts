import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

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
  if (!redis) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  try {
    const body = await req.json();
    const { action, ...data } = body;

    switch (action) {
      case 'auth': {
        const { userId, nickname } = data;
        const userKey = `loto:user:${userId}`;
        const lowerNick = (nickname || 'Игрок').toLowerCase();
        const existingId = await redis.hget('loto:nicknames', lowerNick);
        if (existingId && existingId !== userId) {
          return NextResponse.json({ type: 'error', message: 'Этот никнейм уже занят другим игроком' });
        }

        // Remove old nickname mapping if user had a different one
        const oldUser: any = await redis.hgetall(userKey);
        if (oldUser && oldUser.nickname) {
          const oldLower = oldUser.nickname.toLowerCase();
          if (oldLower !== lowerNick) {
            await redis.hdel('loto:nicknames', oldLower);
          }
        }

        let user: any = oldUser;
        if (!user || Object.keys(user).length === 0) {
          user = {
            id: userId,
            nickname: nickname || 'Игрок',
            avatar: '👤',
            games_played: '0',
            games_won: '0',
            total_score: '0',
            achievements: '[]',
            friends: '[]',
            settings: '{}',
            created_at: Math.floor(Date.now() / 1000).toString(),
          };
          await redis.hset(userKey, user);
        } else {
          await redis.hset(userKey, { nickname: nickname || user.nickname, last_seen: Math.floor(Date.now() / 1000).toString() });
        }
        await redis.hset('loto:nicknames', { [lowerNick]: userId });
        
        return NextResponse.json({ type: 'auth_success', user });
      }

      case 'create_lobby': {
        const { userId, name, password, maxPlayers, mode, rounds } = data;
        const lobbyId = crypto.randomUUID();
        const code = generateLobbyCode();
        
        const lobby = {
          id: lobbyId,
          code,
          name,
          password: password || '',
          admin_id: userId,
          max_players: maxPlayers || 10,
          status: 'waiting',
          mode: mode || 'classic',
          total_rounds: rounds || 1,
          created_at: Math.floor(Date.now() / 1000).toString(),
        };

        await redis.hset(`loto:lobby:${lobbyId}`, lobby);
        await redis.set(`loto:code_to_id:${code}`, lobbyId);
        await redis.sadd(`loto:active_lobbies`, lobbyId); // Registry
        await redis.sadd(`loto:lobby_players:${lobbyId}`, userId);
        await redis.hset(`loto:player_status:${lobbyId}`, { [userId]: 'ready' });
        
        return NextResponse.json({ type: 'lobby_created', lobby });
      }

      case 'join_lobby': {
        const { userId, code, password } = data;
        const lobbyId = await redis.get<string>(`loto:code_to_id:${code}`);
        if (!lobbyId) return NextResponse.json({ type: 'error', message: 'Лобби не найдено' });

        const lobby: any = await redis.hgetall(`loto:lobby:${lobbyId}`);
        if (lobby.status !== 'waiting') return NextResponse.json({ type: 'error', message: 'Игра уже идет' });
        if (lobby.password && lobby.password !== password) return NextResponse.json({ type: 'error', message: 'Неверный пароль' });

        const playersCount = await redis.scard(`loto:lobby_players:${lobbyId}`);
        if (playersCount >= (lobby.max_players || 10)) return NextResponse.json({ type: 'error', message: 'Лобби заполнено' });

        await redis.sadd(`loto:lobby_players:${lobbyId}`, userId);
        await redis.hset(`loto:player_status:${lobbyId}`, { [userId]: 'waiting' });

        return NextResponse.json({ 
          type: 'lobby_joined', 
          lobbyId,
          isAdmin: lobby.admin_id === userId
        });
      }

      case 'start_game': {
        const { userId, lobbyId } = data;
        const lobby: any = await redis.hgetall(`loto:lobby:${lobbyId}`);
        if (lobby.admin_id !== userId) return NextResponse.json({ type: 'error', message: 'Только админ может начать' });

        await redis.hset(`loto:lobby:${lobbyId}`, { status: 'playing', started_at: Math.floor(Date.now() / 1000).toString() });
        
        return NextResponse.json({ type: 'game_started' });
      }

      case 'draw_number': {
        const { userId, lobbyId, number } = data;
        const lobby: any = await redis.hgetall(`loto:lobby:${lobbyId}`);
        if (!lobby || Object.keys(lobby).length === 0) return NextResponse.json({ type: 'error', message: 'Лобби не найдено' });
        if (lobby.admin_id !== userId) {
          console.warn(`Loto Admin Error: Lobby admin is ${lobby.admin_id}, requester is ${userId}`);
          return NextResponse.json({ type: 'error', message: 'Только админ может тянуть бочонки' });
        }

        await redis.rpush(`loto:drawn:${lobbyId}`, number);
        const drawn = await redis.lrange(`loto:drawn:${lobbyId}`, 0, -1);
        return NextResponse.json({ type: 'number_drawn', number, all: drawn.map(Number), drawn: drawn.map(Number) });
      }

      case 'undo_number': {
        const { userId, lobbyId, number } = data;
        const lobby: any = await redis.hgetall(`loto:lobby:${lobbyId}`);
        if (lobby.admin_id !== userId) return NextResponse.json({ type: 'error', message: 'Только админ может отменять' });

        if (number) {
          await redis.lrem(`loto:drawn:${lobbyId}`, 1, number);
        } else {
          await redis.rpop(`loto:drawn:${lobbyId}`);
        }
        const drawn = await redis.lrange(`loto:drawn:${lobbyId}`, 0, -1);
        return NextResponse.json({ type: 'state_update', all: drawn.map(Number), drawn: drawn.map(Number) });
      }

      case 'reset_numbers': {
        const { userId, lobbyId } = data;
        const lobby: any = await redis.hgetall(`loto:lobby:${lobbyId}`);
        if (lobby.admin_id !== userId) return NextResponse.json({ type: 'error', message: 'Только админ может сбросить' });

        await redis.del(`loto:drawn:${lobbyId}`);
        return NextResponse.json({ type: 'state_update', all: [], drawn: [] });
      }

      case 'chat_message': {
        const { userId, lobbyId, text, nickname, avatar } = data;
        if (!userId || !lobbyId || !text) {
          return NextResponse.json({ type: 'error', message: 'Missing required fields' });
        }
        let finalNick = nickname;
        let finalAvatar = avatar;
        if (!finalNick) {
           const profile: any = await redis.hgetall(`loto:user:${userId}`);
           finalNick = profile?.nickname || 'Игрок';
           finalAvatar = profile?.avatar || '👤';
        }
        const msg = {
          id: crypto.randomUUID(),
          userId,
          nickname: finalNick,
          avatar: finalAvatar,
          text,
          timestamp: Date.now(),
        };
        await redis.rpush(`loto:chat:${lobbyId}`, JSON.stringify(msg));
        await redis.ltrim(`loto:chat:${lobbyId}`, -50, -1); // Keep last 50
        return NextResponse.json({ type: 'chat_message', message: msg });
      }

      case 'update_profile': {
        const { userId, nickname: newNick, avatar: newAvatar } = data;
        if (!userId) return NextResponse.json({ type: 'error', message: 'Missing userId' });
        const profileKey = `loto:user:${userId}`;
        
        if (newNick) {
          const lowerNewNick = newNick.toLowerCase();
          const existingOwner = await redis.hget('loto:nicknames', lowerNewNick);
          if (existingOwner && existingOwner !== userId) {
            return NextResponse.json({ type: 'error', message: 'Этот никнейм уже занят другим игроком' });
          }
          // Remove old nickname mapping
          const oldProfile: any = await redis.hgetall(profileKey);
          if (oldProfile?.nickname) {
            const oldLower = oldProfile.nickname.toLowerCase();
            if (oldLower !== lowerNewNick) {
              await redis.hdel('loto:nicknames', oldLower);
            }
          }
          await redis.hset('loto:nicknames', { [lowerNewNick]: userId });
        }
        
        const updates: any = { last_seen: Math.floor(Date.now() / 1000).toString() };
        if (newNick) updates.nickname = newNick;
        if (newAvatar) updates.avatar = newAvatar;
        await redis.hset(profileKey, updates);
        
        return NextResponse.json({ type: 'profile_updated' });
      }

      case 'mark_cell': {
        const { userId, lobbyId, count } = data;
        await redis.hset(`loto:player_progress:${lobbyId}`, { [userId]: count });
        return NextResponse.json({ type: 'progress_updated' });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('Loto API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!redis) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'get_state': {
        const lobbyId = searchParams.get('lobbyId');
        if (!lobbyId) return NextResponse.json({ error: 'Missing lobbyId' }, { status: 400 });

        const lobby: any = await redis.hgetall(`loto:lobby:${lobbyId}`);
        if (!lobby || Object.keys(lobby).length === 0) return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });

        // Cleanup check (20 minutes inactivity)
        const lastSeen = Number(lobby.last_seen || lobby.created_at || 0);
        if (Date.now() / 1000 - lastSeen > 20 * 60) {
           await redis.srem('loto:active_lobbies', lobbyId);
           await redis.del(`loto:lobby:${lobbyId}`);
           return NextResponse.json({ error: 'Lobby expired' }, { status: 410 });
        }
        await redis.hset(`loto:lobby:${lobbyId}`, { last_seen: Math.floor(Date.now() / 1000).toString() });

        const [playerIds, playerStatuses, drawn, chat, playerProgress] = await Promise.all([
          redis.smembers(`loto:lobby_players:${lobbyId}`),
          redis.hgetall(`loto:player_status:${lobbyId}`),
          redis.lrange(`loto:drawn:${lobbyId}`, 0, -1),
          redis.lrange(`loto:chat:${lobbyId}`, 0, -1),
          redis.hgetall(`loto:player_progress:${lobbyId}`),
        ]);

        // Get profiles for all players
        const players = await Promise.all(playerIds.map(async (pid) => {
          const profile: any = await redis.hgetall(`loto:user:${pid}`);
          return {
            id: pid,
            nickname: profile?.nickname || 'Игрок',
            avatar: profile?.avatar || '👤',
            status: playerStatuses?.[pid] || 'waiting',
            games_played: profile?.games_played || 0,
            progress: playerProgress?.[pid] || 0,
            isAdmin: pid === lobby.admin_id
          };
        }));

        return NextResponse.json({
          type: 'state_update',
          lobby: { ...lobby, players },
          drawn: drawn.map(Number),
          chat: chat.map(m => JSON.parse(m as string))
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=5'
          }
        });
      }

      case 'list_lobbies': {
        const lobbyIds = await redis.smembers(`loto:active_lobbies`);
        const lobbies = await Promise.all(lobbyIds.map(async (id) => {
          const lobby: any = await redis.hgetall(`loto:lobby:${id}`);
          if (!lobby || lobby.status !== 'waiting') return null;
          const playersCount = await redis.scard(`loto:lobby_players:${id}`);
          return {
            id: lobby.id,
            name: lobby.name,
            code: lobby.code,
            players_count: playersCount,
            max_players: lobby.max_players,
            has_password: lobby.password ? 1 : 0
          };
        }));
        return NextResponse.json(lobbies.filter(l => l !== null));
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
