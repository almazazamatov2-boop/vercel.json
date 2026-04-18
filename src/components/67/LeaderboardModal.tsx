'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/67/store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Medal, Trophy, Loader2 } from 'lucide-react';

interface Entry {
  rank: number;
  username: string;
  bestScore: number;
  maxCombo: number;
  gamesPlayed: number;
}

export function LeaderboardModal() {
  const { modal, closeModal } = useAppStore();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modal !== 'leaderboard') return;
    let active = true;
    const controller = new AbortController();
    (async () => {
      try {
        const r = await fetch('/api/67/leaderboard?limit=50', { signal: controller.signal });
        const d = await r.json();
        if (active && d.success) setEntries(d.leaderboard);
      } catch { /* abort or network */ }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; controller.abort(); };
  }, [modal]);

  if (modal !== 'leaderboard') return null;

  // Show loading on first fetch when entries empty
  const isLoading = loading && entries.length === 0;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
        <motion.div
          className="relative w-full max-w-md bg-neutral-900 border border-white/[0.08] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-bold text-white">Рейтинг</h2>
            </div>
            <button className="p-1.5 rounded-lg hover:bg-white/[0.06] text-neutral-500 hover:text-white transition-colors" onClick={closeModal}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
              </div>
            ) : entries.length === 0 ? (
              <p className="text-center text-neutral-500 text-sm py-16">Пока нет результатов</p>
            ) : (
              entries.map((e, i) => (
                <motion.div
                  key={e.username}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5) }}
                >
                  <div className="w-7 flex items-center justify-center flex-shrink-0">
                    {e.rank === 1 ? <Crown className="w-4 h-4 text-yellow-500" /> :
                     e.rank === 2 ? <Medal className="w-4 h-4 text-neutral-400" /> :
                     e.rank === 3 ? <Medal className="w-4 h-4 text-amber-700" /> :
                     <span className="text-xs text-neutral-600 font-medium">{e.rank}</span>}
                  </div>
                  <a 
                    href={`https://twitch.tv/${e.login}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex-1 min-w-0 group/link"
                  >
                    <p className="text-sm font-medium text-neutral-200 truncate group-hover/link:text-[#9146FF] transition-colors">{e.username}</p>
                    <p className="text-[10px] text-neutral-600">Нажми, чтобы открыть Twitch</p>
                  </a>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{e.bestScore}</p>
                    <p className="text-[10px] text-neutral-600">комбо {e.maxCombo}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
