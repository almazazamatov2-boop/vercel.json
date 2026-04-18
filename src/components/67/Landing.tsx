'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession, signIn, signOut } from '@/lib/67/authHook';
import { useAppStore } from '@/lib/67/store';
import {
  Zap, Trophy, ChevronRight, Camera, Crown, Medal, Menu, X, LogIn,
} from 'lucide-react';
import { Button } from '@/components/67/ui/button';

function AnimatedBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/[0.07] blur-[120px] animate-float-slow" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-red-600/[0.06] blur-[140px] animate-float-slow-reverse" />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-orange-500/[0.04] blur-[100px] animate-float-slow" />
    </div>
  );
}

interface TopEntry {
  rank: number;
  username: string;
  login: string;
  image?: string | null;
  bestScore: number;
  maxCombo: number;
  gamesPlayed: number;
}

export function Landing() {
  const { data: session } = useSession();
  const { openModal, startNewGame } = useAppStore();
  const [top, setTop] = useState<TopEntry[]>([]);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    fetch('/api/67/leaderboard?limit=5')
      .then((r) => r.json())
      .then((d) => { if (d.success) setTop(d.leaderboard); })
      .catch(() => {});
  }, []);

  const play = () => {
    if (!session) { openModal('auth'); } else { startNewGame(); }
  };

  const twitchLogin = () => signIn('twitch', { callbackUrl: '/' });

  return (
    <div className="min-h-screen flex flex-col relative">
      <AnimatedBg />

      {/* Header */}
      <header className="relative z-10 w-full border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">67</span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            {session ? (
              <>
                <Button variant="ghost" className="text-neutral-400 hover:text-white hover:bg-white/[0.04] rounded-lg" onClick={() => openModal('leaderboard')}>
                  Рейтинг
                </Button>
                <Button variant="ghost" className="text-neutral-400 hover:text-white hover:bg-white/[0.04] rounded-lg" onClick={() => openModal('profile')}>
                  Профиль
                </Button>
                <div className="w-px h-5 bg-white/10 mx-1" />
                <Button variant="ghost" className="text-neutral-400 hover:text-white hover:bg-white/[0.04] rounded-lg" onClick={() => openModal('profile')}>
                  <img
                    src={(session.user as any).image || ''}
                    alt=""
                    className="w-6 h-6 rounded-full border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <span className="ml-2 text-sm max-w-[120px] truncate">{session.user?.name}</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-neutral-400 hover:text-white hover:bg-white/[0.04] rounded-lg" onClick={() => openModal('leaderboard')}>
                  Рейтинг
                </Button>
                <Button className="bg-[#9146FF] hover:bg-[#7c3aed] text-white rounded-lg" onClick={() => window.location.href = '/auth/twitch?source=67'}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 mr-1.5 fill-current">
                    <path d="M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43Z" />
                  </svg>
                  Twitch
                </Button>
              </>
            )}
          </div>

          <button className="sm:hidden p-2 text-neutral-400 hover:text-white" onClick={() => setMenu(!menu)}>
            {menu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menu && (
          <motion.div className="sm:hidden border-t border-white/[0.06] bg-black/80 backdrop-blur-xl" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <div className="px-4 py-3 space-y-1">
              {session ? (
                <>
                  <button className="w-full text-left px-3 py-2 text-sm text-neutral-300 rounded-lg hover:bg-white/[0.04]" onClick={() => { openModal('leaderboard'); setMenu(false); }}>Рейтинг</button>
                  <button className="w-full text-left px-3 py-2 text-sm text-neutral-300 rounded-lg hover:bg-white/[0.04]" onClick={() => { openModal('profile'); setMenu(false); }}>Профиль</button>
                  <button className="w-full text-left px-3 py-2 text-sm text-neutral-300 rounded-lg hover:bg-white/[0.04]" onClick={() => { signOut(); setMenu(false); }}>Выйти</button>
                </>
              ) : (
                <>
                  <button className="w-full text-left px-3 py-2 text-sm text-neutral-300 rounded-lg hover:bg-white/[0.04]" onClick={() => { openModal('leaderboard'); setMenu(false); }}>Рейтинг</button>
                  <button className="w-full text-left px-3 py-2 text-sm text-neutral-300 rounded-lg hover:bg-white/[0.04]" onClick={() => { twitchLogin(); setMenu(false); }}>Войти через Twitch</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
        <motion.div className="text-center space-y-8 max-w-lg" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <motion.div className="inline-flex flex-col items-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
            <h1 className="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent leading-none">67</h1>
            <div className="mt-1 h-1 w-24 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500" />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <p className="text-xl sm:text-2xl font-light text-neutral-300">Испытай свою скорость!</p>
            <p className="text-sm text-neutral-500 mt-2">Разреши доступ к камере. подними руки так чтобы их было видно</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Button
              className="h-16 px-12 text-lg font-semibold rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-400 hover:via-red-400 hover:to-pink-400 text-white shadow-2xl shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              onClick={play}
            >
              <Zap className="w-5 h-5 mr-2" />
              ИГРАТЬ
            </Button>
          </motion.div>

          {!session && (
            <motion.p className="text-xs text-neutral-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              Результат сохраняется и идёт в рейтинг при входе через Twitch
            </motion.p>
          )}
        </motion.div>
      </section>

      {/* TOP */}
      <section className="relative z-10 max-w-5xl mx-auto w-full px-4 pb-12">
        <motion.div
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-bold">ТОП ИГРОКОВ</h2>
          </div>

          {top.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-8">Пока нет результатов. Стань первым!</p>
          ) : (
            <div className="space-y-2">
              {top.map((p, i) => (
                <motion.div
                  key={p.login}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="w-8 flex items-center justify-center flex-shrink-0">
                    {p.rank === 1 ? <Crown className="w-5 h-5 text-yellow-500" /> :
                     p.rank === 2 ? <Medal className="w-5 h-5 text-neutral-400" /> :
                     p.rank === 3 ? <Medal className="w-5 h-5 text-amber-700" /> :
                     <span className="text-sm text-neutral-500 font-medium">{p.rank}</span>}
                  </div>
                  {p.image ? (
                    <img src={p.image} alt="" className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-xs text-neutral-500 font-bold">
                      {p.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-200 truncate">{p.username}</p>
                    <p className="text-xs text-neutral-600">{p.gamesPlayed} игр</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-white">{p.bestScore}</p>
                    <p className="text-[10px] text-neutral-600">очков</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <button className="w-full mt-3 flex items-center justify-center gap-1 text-sm text-neutral-500 hover:text-neutral-300 py-2 transition-colors" onClick={() => openModal('leaderboard')}>
            Весь рейтинг <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      </section>



      <footer className="relative z-10 border-t border-white/[0.04] py-8 text-center flex flex-col items-center gap-1">
        <p className="text-[13px] font-bold text-neutral-400 uppercase tracking-widest">67 на скорость</p>
        <p className="text-[11px] text-neutral-600">Powered by <a href="https://t.me/paracetamolhaze" className="text-orange-500 font-bold hover:text-orange-400 transition-colors">PARACETAMOLHAZE</a></p>
      </footer>
    </div>
  );
}
