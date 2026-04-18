'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Film, Tv, Lightbulb, SkipForward, Trophy, Home, ChevronRight, 
  Search, X, Check, Sparkles, Clapperboard, Eye, Crown, LogIn, 
  Zap, Medal, Menu, User
} from 'lucide-react';
import { Button } from '@/components/67/ui/button'; // Reusing the styled button
import { useSession } from '@/lib/67/authHook'; // Reusing session logic
import { supabase } from '@/lib/supabase';

// ============ TYPES ============
interface KinokadrMovie {
  id: string;
  image_url: string;
  type: 'movie' | 'series';
  category: string;
  year: number | null;
  title: string;
  title_ru: string;
  hint1?: string;
  hint2?: string;
  hint3?: string;
}

interface KinokadrState {
  hintsUsed: number;
  guessed: boolean;
  correct: boolean;
  score: number;
}

type Screen = 'home' | 'game' | 'leaderboard';

function AnimatedBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/[0.07] blur-[120px] animate-float-slow" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/[0.06] blur-[140px] animate-float-slow-reverse" />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-blue-500/[0.04] blur-[100px] animate-float-slow" />
    </div>
  );
}

const BLUR_LEVELS = ['blur-2xl brightness-[0.3]', 'blur-lg brightness-[0.5]', 'blur-sm brightness-[0.75]', 'blur-0 brightness-100'];
const SCORE_FOR_HINTS = [5, 3, 2, 1];

export default function KinokadrPage() {
  const { data: session } = useSession();
  const [screen, setScreen] = useState<Screen>('home');
  const [movies, setMovies] = useState<KinokadrMovie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guessInput, setGuessInput] = useState('');
  const [state, setState] = useState<KinokadrState>({ hintsUsed: 0, guessed: false, correct: false, score: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Demo data fallback if Supabase is empty
  const DEMO_MOVIES: KinokadrMovie[] = [
    {
      id: 'demo-1',
      title: 'Inception',
      title_ru: 'Начало',
      image_url: 'https://media.themoviedb.org/t/p/w1280/w85Z9pG9qMtw6m9QuE6PvKygEh1.jpg',
      type: 'movie',
      category: 'Sci-Fi',
      year: 2010,
      hint1: 'Режиссер Кристофер Нолан',
    }
  ];

  const fetchMovies = async () => {
    setIsLoading(true);
    // Real Supabase query would go here:
    // const { data } = await supabase.from('kinokadr_movies').select('*').limit(10);
    // For now, using demo:
    setTimeout(() => {
      setMovies(DEMO_MOVIES);
      setIsLoading(false);
    }, 800);
  };

  const startNewGame = () => {
    fetchMovies();
    setScreen('game');
    setCurrentIndex(0);
    setState({ hintsUsed: 0, guessed: false, correct: false, score: 0 });
    setGuessInput('');
  };

  const handleGuess = async () => {
    if (!guessInput.trim()) return;
    const current = movies[currentIndex];
    
    // Simple logic for demo: exact match or partial match on title/title_ru
    const isCorrect = 
      guessInput.toLowerCase() === current.title.toLowerCase() || 
      guessInput.toLowerCase() === current.title_ru.toLowerCase();

    if (isCorrect) {
      const earned = SCORE_FOR_HINTS[state.hintsUsed];
      setState(prev => ({ ...prev, guessed: true, correct: true, score: earned }));
      
      // Submit score to Supabase if logged in
      if (session?.user) {
        // await supabase.from('kinokadr_scores').insert({ ... });
      }
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const useHint = () => {
    if (state.hintsUsed < 3) {
      setState(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
    }
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-black text-white font-sans selection:bg-cyan-500/30">
      <AnimatedBg />

      {/* Header */}
      <header className="relative z-10 w-full border-b border-white/[0.06] backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setScreen('home')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-blue-400 transition-all">КИНОКАДР</span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
             <Button variant="ghost" className="text-neutral-400 hover:text-white rounded-lg" onClick={() => setScreen('leaderboard')}>
               Рейтинг
             </Button>
             <div className="w-px h-5 bg-white/10 mx-1" />
             {session?.user ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <img src={(session.user as any).image} className="w-6 h-6 rounded-full border border-white/10" alt="" />
                  <span className="text-xs font-bold truncate max-w-[100px]">{session.user.name}</span>
                </div>
             ) : (
                <Button className="bg-[#9146FF] hover:bg-[#7c3aed] text-white rounded-lg h-9 px-4 text-xs">
                  Войти
                </Button>
             )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8 max-w-lg"
            >
              <div className="space-y-2">
                <h1 className="text-7xl sm:text-8xl font-black tracking-tighter bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent leading-none uppercase">
                  Угадай <br/> Кадр
                </h1>
                <p className="text-cyan-400 font-bold tracking-[0.3em] text-xs uppercase opacity-80">Cinematic Challenge</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-2">
                    <Eye className="w-5 h-5 text-cyan-400" />
                  </div>
                  <p className="text-xs text-neutral-400">Смотри на <br/> размытый кадр</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-xs text-neutral-400">Получай баллы <br/> за скорость</p>
                </div>
              </div>

              <Button
                className="h-16 px-16 text-2xl font-black tracking-[0.2em] rounded-3xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]"
                onClick={startNewGame}
              >
                ИГРАТЬ
              </Button>
            </motion.div>
          )}

          {screen === 'game' && movies.length > 0 && (
            <motion.div 
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl flex flex-col gap-6"
            >
              {/* Game View */}
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white/[0.02] backdrop-blur-xl">
                 <img 
                   src={movies[currentIndex].image_url} 
                   className={`w-full h-full object-cover transition-all duration-1000 ${BLUR_LEVELS[state.hintsUsed]}`}
                   alt=""
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                 
                 <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest leading-none flex items-center h-7">
                      {movies[currentIndex].type === 'movie' ? 'Фильм' : 'Сериал'}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-cyan-500/20 backdrop-blur-md border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-widest leading-none flex items-center h-7">
                      {movies[currentIndex].category}
                    </span>
                 </div>

                 <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="space-y-1">
                       <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Текущий балл</p>
                       <p className="text-3xl font-black">{SCORE_FOR_HINTS[state.hintsUsed]}</p>
                    </div>
                    {state.guessed && (
                       <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-right">
                          <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest">Правильный ответ</p>
                          <p className="text-2xl font-black text-white">{movies[currentIndex].title_ru}</p>
                       </motion.div>
                    )}
                 </div>
              </div>

              {/* Controls */}
              {!state.guessed ? (
                <div className={`space-y-4 ${shake ? 'animate-shake' : ''}`}>
                   <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <input 
                        className="w-full h-16 pl-14 pr-6 bg-white/[0.03] border border-white/10 rounded-2xl focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 text-xl font-bold transition-all placeholder:text-white/10"
                        placeholder="Название фильма..."
                        value={guessInput}
                        onChange={(e) => setGuessInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                      />
                   </div>

                   <div className="flex gap-3">
                      <button 
                        onClick={useHint}
                        disabled={state.hintsUsed >= 3}
                        className="flex-1 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center gap-2 font-bold hover:bg-white/[0.1] active:scale-95 transition-all text-neutral-400 hover:text-white disabled:opacity-30"
                      >
                         <Lightbulb className="w-5 h-5" /> Подсказка ({state.hintsUsed}/3)
                      </button>
                      <button 
                        onClick={handleGuess}
                        className="flex-[2] h-14 rounded-2xl bg-cyan-500 text-black flex items-center justify-center gap-2 font-black tracking-wider hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/20"
                      >
                         <Sparkles className="w-5 h-5" /> УГАДАТЬ
                      </button>
                   </div>
                </div>
              ) : (
                <div className="flex gap-4">
                   <Button 
                     className="flex-1 h-16 text-xl font-black rounded-3xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.1]"
                     onClick={() => setScreen('home')}
                   >
                     В МЕНЮ
                   </Button>
                   <Button 
                     className="flex-[2] h-16 text-xl font-black rounded-3xl bg-white text-black hover:bg-neutral-200"
                     onClick={startNewGame}
                   >
                     СЛЕДУЮЩИЙ
                   </Button>
                </div>
              )}
            </motion.div>
          )}

          {screen === 'leaderboard' && (
             <motion.div 
               key="leaderboard"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="w-full max-w-xl space-y-6"
             >
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Лучшие Знатоки</h2>
                </div>

                <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6 space-y-2">
                   {leaderboard.length === 0 ? (
                      <div className="py-12 text-center text-neutral-500 uppercase font-black tracking-widest text-xs opacity-50">
                        Пока нет данных
                      </div>
                   ) : (
                     leaderboard.map((p, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] transition-all">
                           <div className="w-8 flex-shrink-0 text-lg font-black italic text-neutral-500">{i+1}</div>
                           <img src={p.avatar} className="w-10 h-10 rounded-full border border-white/10" alt="" />
                           <div className="flex-1">
                              <p className="font-bold">{p.name}</p>
                              <p className="text-[10px] text-neutral-500 uppercase font-black">{p.games} игр</p>
                           </div>
                           <div className="text-right">
                              <p className="text-2xl font-black italic">{p.score}</p>
                           </div>
                        </div>
                     ))
                   )}
                </div>

                <Button className="w-full h-14 rounded-2xl bg-white/[0.05] border border-white/10" onClick={() => setScreen('home')}>
                   НАЗАД
                </Button>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 py-6 text-center">
         <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Кинокадр • Powered by Paracetamolhaze</p>
      </footer>
    </div>
  );
}
