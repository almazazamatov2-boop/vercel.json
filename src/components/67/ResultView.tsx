'use client';

import { useAppStore } from '@/lib/67/store';
import { useSession } from '@/lib/67/authHook';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Share2, Crown, Medal, Zap } from 'lucide-react';
import { Button } from '@/components/67/ui/button';

export function ResultView() {
  const { pumps, lastGameResult, startNewGame } = useAppStore();
  const { data: session } = useSession();

  const rank = lastGameResult?.rank || 0;
  const playerName = session?.user?.name || null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-sm space-y-6 text-center"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        {/* Player name or label */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          {playerName ? (
            <div className="space-y-1">
              <p className="text-xs text-neutral-500 uppercase tracking-widest font-medium">Результат</p>
              <p className="text-2xl font-bold text-neutral-200">{playerName}</p>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-medium">Результат</p>
          )}
        </motion.div>

        {/* Score / pumps */}
        <motion.div className="space-y-1" initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}>
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-7 h-7 text-orange-500" />
            <p className="text-7xl font-black text-white">{pumps}</p>
          </div>
          <p className="text-sm text-neutral-500 font-light">повторений за 30 секунд</p>
        </motion.div>

        {/* Rank */}
        {rank > 0 && (
          <motion.div className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            {rank === 1 ? <Crown className="w-5 h-5 text-yellow-500" /> :
             rank <= 3 ? <Medal className="w-5 h-5 text-amber-400" /> :
             <Trophy className="w-5 h-5 text-orange-500" />}
            <span className="text-neutral-300 text-sm font-medium">
              {rank === 1 ? 'Ты #1!' : `Место #${rank}`}
            </span>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-400 hover:via-red-400 hover:to-pink-400 text-white font-semibold shadow-xl shadow-red-500/20" onClick={startNewGame}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Ещё раз
          </Button>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-14 rounded-2xl border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-neutral-400 hover:text-white transition-all"
              onClick={() => useAppStore.getState().setView('landing')}
            >
              В меню
            </Button>
            <Button className="flex-1 h-14 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-white transition-all" onClick={() => useAppStore.getState().openModal('leaderboard')}>
              <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
              Рейтинг
            </Button>
            <Button variant="outline" className="flex-1 h-11 rounded-xl border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.04]" onClick={() => {
              const name = playerName || 'Игрок';
              const text = `${name} сделал ${pumps} повторений в 67! Сможешь лучше?`;
              if (navigator.share) navigator.share({ title: '67', text }).catch(() => {});
              else navigator.clipboard.writeText(text);
            }}>
              <Share2 className="w-4 h-4 mr-1.5" />
              Поделиться
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
