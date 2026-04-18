'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Film, Tv, Lightbulb, SkipForward, Trophy, Home, ChevronRight, 
  Search, X, Check, Sparkles, Clapperboard, Eye, Crown, LogIn, 
  Zap, Medal, Menu, User, Inbox, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/67/ui/button'; 
import { AuthProvider, useSession, signIn } from '@/lib/67/authHook'; 
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
}

interface KinokadrState {
  hintsUsed: number;
  guessed: boolean;
  correct: boolean;
  score: number;
  totalScore: number;
  round: number;
  mode: string;
}

type Screen = 'home' | 'game' | 'leaderboard' | 'result';

function AnimatedBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/[0.07] blur-[120px] animate-float-slow" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/[0.06] blur-[140px] animate-float-slow-reverse" />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-blue-500/[0.04] blur-[100px] animate-float-slow" />
    </div>
  );
}

const BLUR_LEVELS = ['blur-xl brightness-[0.35]', 'blur-lg brightness-[0.5]', 'blur-sm brightness-[0.75]', 'blur-0 brightness-100'];
const SCORE_FOR_HINTS = [5, 3, 2, 1];

function KinokadrContent() {
  const { data: session } = useSession();
  const [screen, setScreen] = useState<Screen>('home');
  const [movies, setMovies] = useState<KinokadrMovie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guessInput, setGuessInput] = useState('');
  const [state, setState] = useState<KinokadrState>({ 
    hintsUsed: 0, 
    guessed: false, 
    correct: false, 
    score: 0, 
    totalScore: 0,
    round: 1,
    mode: 'combo' 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lbMode, setLbMode] = useState('combo');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<any>(null);

  // Auto-complete fetch
  useEffect(() => {
    if (guessInput.length < 2 || state.guessed) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/kino/search?query=${encodeURIComponent(guessInput)}`);
        const data = await res.json();
        if (data.films) {
          setSuggestions(data.films.slice(0, 5));
          setShowSuggestions(true);
        }
      } catch (e) {}
    }, 400);

    return () => clearTimeout(searchTimeout.current);
  }, [guessInput, state.guessed]);

  // Load leaderboard
  useEffect(() => {
    if (screen === 'leaderboard') {
      fetchLeaderboard(lbMode);
    }
  }, [screen, lbMode]);

  const fetchLeaderboard = async (mode: string) => {
    try {
      const { data } = await supabase
        .from('kinokadr_scores')
        .select('*, user:user_id(*)')
        .eq('mode', mode)
        .order('score', { ascending: false })
        .limit(10);
      setLeaderboard(data || []);
    } catch (e) {}
  };

  const twitchLogin = () => signIn('kinokadr');

  const fetchMovies = async (mode: string) => {
    setIsLoading(true);
    try {
      let query = supabase.from('kinokadr_movies').select('*');
      if (mode === 'movie') query = query.eq('type', 'movie');
      else if (mode === 'series') query = query.eq('type', 'series');
      
      const { data } = await query.order('id', { ascending: Math.random() > 0.5 }).limit(50);
      
      if (data && data.length > 0) {
        const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 10);
        setMovies(shuffled);
      } else {
        setMovies([{
          id: 'demo-1',
          title: 'Inception',
          title_ru: 'Начало',
          image_url: 'https://media.themoviedb.org/t/p/w1280/w85Z9pG9qMtw6m9QuE6PvKygEh1.jpg',
          type: 'movie',
          category: 'Sci-Fi',
          year: 2010
        }]);
      }
    } catch (e) {}
    setIsLoading(false);
  };

  const startNewGame = (mode: string) => {
    fetchMovies(mode);
    setScreen('game');
    setCurrentIndex(0);
    setState({ 
      hintsUsed: 0, 
      guessed: false, 
      correct: false, 
      score: 0, 
      totalScore: 0,
      round: 1,
      mode 
    });
    setGuessInput('');
  };

  const handleGuess = (inputOverride?: string) => {
    const input = (inputOverride || guessInput).trim();
    if (!input || state.guessed) return;
    
    const current = movies[currentIndex];
    const isCorrect = 
      input.toLowerCase() === current.title.toLowerCase() || 
      input.toLowerCase() === current.title_ru.toLowerCase();

    const earned = isCorrect ? SCORE_FOR_HINTS[state.hintsUsed] : 0;
    
    if (!isCorrect) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    setState(prev => ({ 
      ...prev, 
      guessed: true, 
      correct: isCorrect, 
      score: earned,
      totalScore: prev.totalScore + earned
    }));
    setShowSuggestions(false);
  };

  const handleSkip = () => {
    if (state.guessed) return;
    setState(prev => ({ ...prev, guessed: true, correct: false, score: 0 }));
  };

  const nextMovie = () => {
    if (state.round < 10 && currentIndex < movies.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setState(prev => ({ ...prev, hintsUsed: 0, guessed: false, correct: false, score: 0, round: prev.round + 1 }));
      setGuessInput('');
    } else {
      // Game Over
      setScreen('result');
      if (session?.user) {
        saveFinalScore((session.user as any).id, state.totalScore + (state.correct ? state.score : 0), state.mode);
      }
    }
  };

  const saveFinalScore = async (userId: string, points: number, mode: string) => {
    try {
      await supabase.from('kinokadr_scores').insert({
        user_id: userId,
        score: points,
        mode: mode,
      });
    } catch (e) {}
  };

  const useHint = () => {
    if (state.hintsUsed < 3) {
      setState(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
    }
  };

  const selectSuggestion = (s: any) => {
    const title = s.nameRu || s.nameEn;
    setGuessInput(title);
    setShowSuggestions(false);
    handleGuess(title);
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-black text-white font-sans selection:bg-cyan-500/30">
      <AnimatedBg />

      {/* Header */}
      <header className="relative z-10 w-full border-b border-white/[0.06] backdrop-blur-md bg-black/40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setScreen('home')}>
              <span className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent pr-2">КИНОКАДР</span>
            </div>
            
            {screen === 'game' && (
               <div className="flex items-center gap-6 h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase text-white/30 tracking-widest leading-none">Раунд</span>
                     <span className="text-sm font-black text-cyan-400">{state.round} / 10</span>
                  </div>
                  <div className="w-px h-3 bg-white/10" />
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase text-white/30 tracking-widest leading-none">Счет</span>
                     <span className="text-sm font-black text-white">{state.totalScore}</span>
                  </div>
               </div>
            )}
          </div>

          <div className="flex items-center gap-2">
             <Button variant="ghost" className="text-neutral-400 hover:text-white rounded-lg h-9" onClick={() => setScreen('leaderboard')}>
               Рейтинг
             </Button>
             {session?.user ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                  <img src={(session.user as any).image} className="w-6 h-6 rounded-full" alt="" />
                  <span className="text-xs font-bold truncate max-w-[80px]">{session.user.name}</span>
                </div>
             ) : (
                <Button className="bg-[#9146FF] hover:bg-[#7c3aed] text-white rounded-lg h-9 px-4 text-xs font-bold" onClick={twitchLogin}>
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
              className="text-center space-y-12 max-w-xl w-full"
            >
              <div className="space-y-0 -mt-20">
                <h1 className="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent leading-none uppercase select-none">
                  Угадай <br/> Кадр
                </h1>
              </div>

              <div className="grid grid-cols-1 gap-3 w-full max-w-md mx-auto">
                <button onClick={() => startNewGame('combo')} className="group relative w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 flex items-center gap-4 hover:bg-white/[0.06] transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Inbox className="w-7 h-7 text-cyan-400" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-black tracking-tight uppercase">КОМБО</h3>
                    <p className="text-xs text-neutral-500 font-medium">Фильмы и сериалы из IMDb Top</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-cyan-500/40 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </button>

                <button onClick={() => startNewGame('movie')} className="group relative w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 flex items-center gap-4 hover:bg-white/[0.06] transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Film className="w-7 h-7 text-orange-400" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-black tracking-tight uppercase">ФИЛЬМЫ</h3>
                    <p className="text-xs text-neutral-500 font-medium">Только полнометражное кино</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-orange-500/40 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                </button>

                <button onClick={() => startNewGame('series')} className="group relative w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 flex items-center gap-4 hover:bg-white/[0.06] transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Tv className="w-7 h-7 text-purple-400" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-black tracking-tight uppercase">СЕРИАЛЫ</h3>
                    <p className="text-xs text-neutral-500 font-medium">Лучшие сериалы планеты</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-500/40 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </motion.div>
          )}

          {screen === 'game' && movies[currentIndex] && (
            <motion.div 
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl flex flex-col gap-6"
            >
              {/* Image Container */}
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white/[0.02] backdrop-blur-xl group">
                 {/* Blurred Background (always cover) */}
                 <img src={movies[currentIndex].image_url} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-110" alt="" />
                 
                 {/* Main Image */}
                 <motion.img 
                   layout
                   src={movies[currentIndex].image_url} 
                   className={`relative w-full h-full transition-all duration-700 ease-in-out ${
                     !state.guessed 
                       ? `object-cover object-top scale-[1.35] ${BLUR_LEVELS[state.hintsUsed]}` 
                       : 'object-contain scale-100 blur-0 brightness-100'
                   }`}
                   alt=""
                 />
                 
                 {/* Anti-Cheat Gradient (only while guessing) */}
                 {!state.guessed && (
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none z-10" />
                 )}
                 
                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                 
                 <div className="absolute top-4 left-4 flex gap-2 z-20">
                    <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest leading-none flex items-center h-7">
                      {movies[currentIndex].type === 'movie' ? 'Фильм' : 'Сериал'}
                    </span>
                 </div>

                 {!state.guessed && (
                    <div className="absolute top-4 right-4 animate-pulse z-20">
                       <div className="bg-cyan-500 text-black px-4 py-2 rounded-xl font-black text-xl shadow-lg shadow-cyan-500/30 flex items-center gap-2">
                          <Zap className="w-5 h-5 fill-current" />
                          +{SCORE_FOR_HINTS[state.hintsUsed]}
                       </div>
                    </div>
                 )}
              </div>

              {!state.guessed ? (
                <div className={`space-y-4 ${shake ? 'animate-shake' : ''} relative`}>
                   <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                      </div>
                      <input 
                        className="w-full h-16 pl-14 pr-6 bg-white/[0.03] border border-white/10 rounded-2xl focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 text-xl font-bold transition-all placeholder:text-white/10"
                        placeholder="Название..."
                        value={guessInput}
                        onChange={(e) => setGuessInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      />
                   </div>

                   {/* Autocomplete */}
                   <AnimatePresence>
                     {showSuggestions && suggestions.length > 0 && (
                       <motion.div 
                         initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                         className="absolute bottom-full mb-3 left-0 right-0 bg-[#0c0c0e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 p-1"
                       >
                         {suggestions.map((s, idx) => (
                           <button key={idx} onClick={() => selectSuggestion(s)} className="w-full text-left p-4 hover:bg-white/[0.05] flex flex-col transition-colors rounded-xl group">
                             <span className="font-bold text-white group-hover:text-cyan-400">{s.nameRu || s.nameEn}</span>
                             <span className="text-[10px] text-white/40 uppercase font-black">{s.type === 'TV_SERIES' ? 'Сериал' : 'Фильм'} {s.year && `• ${s.year}`}</span>
                           </button>
                         ))}
                       </motion.div>
                     )}
                   </AnimatePresence>

                   <div className="flex gap-3">
                      <button 
                        onClick={useHint} disabled={state.hintsUsed >= 3}
                        className="flex-1 h-16 rounded-2xl bg-white/[0.05] border border-white/10 flex flex-col items-center justify-center gap-1 font-bold hover:bg-white/[0.1] active:scale-95 transition-all text-neutral-400 hover:text-white disabled:opacity-30"
                      >
                         <Lightbulb className="w-5 h-5" /> 
                         <span className="text-[10px] uppercase font-black tracking-widest">Открыть ({state.hintsUsed}/3)</span>
                      </button>
                      <button 
                        onClick={handleSkip}
                        className="flex-1 h-16 rounded-2xl bg-white/[0.05] border border-white/10 flex flex-col items-center justify-center gap-1 font-bold hover:bg-white/[0.1] active:scale-95 transition-all text-neutral-400 hover:text-white"
                      >
                         <SkipForward className="w-5 h-5" />
                         <span className="text-[10px] uppercase font-black tracking-widest">Пропустить</span>
                      </button>
                      <button 
                        onClick={() => handleGuess()}
                        className="flex-[2] h-16 rounded-2xl bg-cyan-500 text-black flex items-center justify-center gap-2 font-black tracking-wider hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/20"
                      >
                         <Sparkles className="w-6 h-6" /> УГАДАТЬ
                      </button>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                   <div className={`p-6 rounded-3xl border ${state.correct ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'} flex items-center justify-between`}>
                      <div className="flex items-center gap-4">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${state.correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {state.correct ? <Check className="w-8 h-8" /> : <X className="w-8 h-8" />}
                         </div>
                         <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${state.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                               {state.correct ? 'Верно!' : 'Не угадали'}
                            </p>
                            <p className="text-2xl font-black">{movies[currentIndex].title_ru}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Получено</p>
                         <p className="text-3xl font-black text-cyan-400">+{state.score}</p>
                      </div>
                   </div>

                   <Button className="w-full h-16 text-xl font-black rounded-3xl bg-white text-black hover:bg-neutral-200 shadow-xl shadow-cyan-500/10" onClick={nextMovie}>
                     СЛЕДУЮЩИЙ РАУНД <ChevronRight className="w-6 h-6 ml-1" />
                   </Button>
                </div>
              )}
            </motion.div>
          )}

          {screen === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 max-w-lg w-full">
              <div className="relative inline-block">
                <Trophy className="w-32 h-32 text-yellow-500 mx-auto animate-bounce" />
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-4 -right-4 bg-cyan-500 text-black w-14 h-14 rounded-full flex items-center justify-center font-black text-xl border-4 border-black">
                   <Sparkles className="w-6 h-6" />
                </motion.div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase">Игра Окончена!</h2>
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Все 10 раундов позади</p>
              </div>

              <div className="p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-2xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-2">Финальный результат</p>
                 <h3 className="text-8xl font-black leading-none">{state.totalScore}</h3>
              </div>

              <div className="flex gap-4">
                 <Button variant="ghost" className="flex-1 h-14 rounded-2xl border border-white/10 hover:bg-white/5" onClick={() => setScreen('home')}>
                   В МЕНЮ
                 </Button>
                 <Button className="flex-[2] h-14 rounded-2xl bg-cyan-500 text-black font-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20" onClick={() => startNewGame(state.mode)}>
                   ИГРАТЬ СНОВА <RefreshCw className="w-5 h-5 ml-2" />
                 </Button>
              </div>
            </motion.div>
          )}

          {screen === 'leaderboard' && (
             <motion.div key="leaderboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Medal className="w-8 h-8 text-yellow-500" />
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Рейтинг Игроков</h2>
                  </div>
                  
                  <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
                    {['combo', 'movie', 'series'].map(m => (
                      <button key={m} onClick={() => setLbMode(m)} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${lbMode === m ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
                        {m === 'combo' ? 'Комбо' : m === 'movie' ? 'Фильмы' : 'Сериалы'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-6 min-h-[400px]">
                   {leaderboard.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-4">
                        <Inbox className="w-12 h-12 opacity-20" />
                        <span className="uppercase text-xs font-black tracking-widest opacity-50">Данных пока нет</span>
                      </div>
                   ) : (
                     leaderboard.map((p, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] transition-all mb-2">
                           <div className="w-8 flex-shrink-0 text-xl font-black italic text-neutral-600">#{i+1}</div>
                           <img src={p.user?.image || p.avatar} className="w-10 h-10 rounded-full border border-white/10 shadow-lg" alt="" />
                           <div className="flex-1">
                              <p className="font-bold">{p.user?.username || p.name}</p>
                              <p className="text-[10px] text-neutral-500 uppercase font-black">Режим: {p.mode}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-2xl font-black italic text-cyan-400 leading-none">{p.score}</p>
                              <p className="text-[9px] text-neutral-600 uppercase font-black uppercase mt-1">очков</p>
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

      <footer className="relative z-10 border-t border-white/[0.04] py-3 text-center flex flex-col items-center gap-1 bg-black/50">
        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">КиноКадр • Сезон 1</p>
        <p className="text-[9px] text-neutral-600 tracking-tight">Powered by <a href="https://t.me/paracetamolhaze" className="text-orange-500 font-bold hover:text-orange-400 transition-colors">PARACETAMOLHAZE</a></p>
      </footer>
    </div>
  );
}

export default function KinokadrPage() {
  return (
    <AuthProvider>
      <KinokadrContent />
    </AuthProvider>
  );
}
