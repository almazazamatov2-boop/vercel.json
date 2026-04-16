'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Star, Calendar, Clock, Film, X, ExternalLink, Play, Timer, Info, User, RefreshCw, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Timing {
  id: string
  filmId: string
  author: string
  timeStr: string // e.g. "01:23:45"
  description: string
  createdAt: string
  isSystem?: boolean
}

interface FilmSuggestion {
  filmId: number
  nameRu: string
  nameEn: string | null
  year: string
  genres: { genre: string }[]
  posterUrlPreview: string
  posterUrl: string
}

interface FilmDetail {
  kinopoiskId: number
  nameRu: string
  nameEn: string | null
  nameOriginal: string | null
  year: number
  filmLength: number | null
  description: string | null
  shortDescription: string | null
  ratingKinopoisk: number | null
  ratingImdb: number | null
  genres: { genre: string }[]
  countries: { country: string }[]
  posterUrl: string
  posterUrlPreview: string
  webUrl: string
  type: string
}


export default function KinoPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<FilmSuggestion[]>([])
  const [selectedFilm, setSelectedFilm] = useState<FilmDetail | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filmLoading, setFilmLoading] = useState(false)

  // Timings State
  const [showTimings, setShowTimings] = useState(false)
  const [timings, setTimings] = useState<Timing[]>([])
  const [timingsLoading, setTimingsLoading] = useState(false)
  const [newTimingAuthor, setNewTimingAuthor] = useState('')
  const [newTimingTime, setNewTimingTime] = useState('')
  const [newTimingDesc, setNewTimingDesc] = useState('')
  const [isSubmittingTiming, setIsSubmittingTiming] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Search with debounce
  const handleQueryChange = useCallback((val: string) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/kino/search?query=${encodeURIComponent(val)}`)
        const data = await res.json()
        setSuggestions(data.films ?? [])
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 350)
  }, [])

  // Select film
  const handleSelectFilm = useCallback(async (suggestion: FilmSuggestion) => {
    setShowSuggestions(false)
    setQuery(suggestion.nameRu || suggestion.nameEn || '')
    setFilmLoading(true)
    setSelectedFilm(null)
    try {
      const res = await fetch(`/api/kino/film?id=${suggestion.filmId}`)
      const data: FilmDetail = await res.json()
      setSelectedFilm(data)
      setShowTimings(false) // reset timings view
      setTimings([])
    } catch {
      setSelectedFilm(null)
    } finally {
      setFilmLoading(false)
    }
  }, [])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch Timings
  const fetchTimings = useCallback(async (filmId: string) => {
    setTimingsLoading(true)
    try {
      const res = await fetch(`/api/kino/timings?filmId=${filmId}`)
      const data = await res.json()
      if (Array.isArray(data)) setTimings(data)
    } catch (e) {
      console.error(e)
    } finally {
      setTimingsLoading(false)
    }
  }, [])

  // Add new Timing
  const handleAddTiming = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFilm || !newTimingAuthor.trim() || !newTimingTime.trim() || !newTimingDesc.trim()) return

    setIsSubmittingTiming(true)
    try {
      const res = await fetch('/api/kino/timings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filmId: selectedFilm.kinopoiskId.toString(),
          author: newTimingAuthor,
          timeStr: newTimingTime,
          description: newTimingDesc,
        })
      })
      if (res.ok) {
        setNewTimingTime('')
        setNewTimingDesc('')
        await fetchTimings(selectedFilm.kinopoiskId.toString())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmittingTiming(false)
    }
  }

  const formatLength = (mins: number | null) => {
    if (!mins) return null
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}ч ${m}мин` : `${m}мин`
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0d0d', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-yellow-400 flex items-center justify-center">
            <Play className="w-5 h-5 text-black fill-black" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">КИНО</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>кино и тайминги</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 pt-16 pb-8">
        {/* Search */}
        <div className="w-full max-w-2xl relative">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-200 ${
            showSuggestions && suggestions.length > 0
              ? 'border-yellow-500/60 shadow-[0_0_24px_rgba(234,179,8,0.15)] rounded-b-none'
              : 'border-white/10 hover:border-white/20'
          }`}
            style={{ background: '#1a1a1a' }}
          >
            <Search className={`w-5 h-5 shrink-0 transition-colors ${loading ? 'text-yellow-400 animate-pulse' : 'text-gray-500'}`} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Например: Бесстыжие, Во все тяжкие, Дюна..."
              className="flex-1 bg-transparent text-white placeholder:text-gray-600 outline-none text-base"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setSuggestions([]); setShowSuggestions(false); setSelectedFilm(null) }}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 rounded-b-2xl border border-t-0 border-yellow-500/30 overflow-hidden z-20 max-h-96 overflow-y-auto"
              style={{ background: '#1a1a1a' }}
            >
              {suggestions.slice(0, 10).map((film) => (
                <button
                  key={film.filmId}
                  onClick={() => handleSelectFilm(film)}
                  className="w-full flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-none"
                >
                  {film.posterUrlPreview ? (
                    <img
                      src={film.posterUrlPreview}
                      alt={film.nameRu}
                      className="w-9 h-14 object-cover rounded-md shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-14 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                      <Film className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-white font-medium text-sm truncate">{film.nameRu || film.nameEn}</div>
                    <div className="text-gray-500 text-xs mt-0.5">
                      {film.year} · {film.genres.slice(0, 2).map(g => g.genre).join(', ')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Film loading skeleton */}
        {filmLoading && (
          <div className="w-full max-w-4xl mt-10 animate-pulse">
            <div className="flex gap-8 p-8 rounded-2xl border border-white/10" style={{ background: '#1a1a1a' }}>
              <div className="w-48 h-72 rounded-xl bg-white/10 shrink-0" />
              <div className="flex-1 space-y-4">
                <div className="h-8 w-64 bg-white/10 rounded-lg" />
                <div className="h-4 w-40 bg-white/10 rounded" />
                <div className="h-20 bg-white/10 rounded-lg" />
              </div>
            </div>
          </div>
        )}

        {/* Film detail */}
        {selectedFilm && !filmLoading && (
          <div className="w-full max-w-4xl mt-10">
            <div
              className="flex flex-col md:flex-row gap-8 p-6 md:p-8 rounded-2xl border border-white/10"
              style={{ background: '#1a1a1a' }}
            >
              {/* Poster */}
              <div className="shrink-0">
                {selectedFilm.posterUrl ? (
                  <img
                    src={selectedFilm.posterUrl}
                    alt={selectedFilm.nameRu}
                    className="w-48 rounded-xl object-cover shadow-2xl mx-auto md:mx-0"
                    style={{ maxHeight: 288 }}
                  />
                ) : (
                  <div className="w-48 h-72 rounded-xl bg-white/10 flex items-center justify-center mx-auto md:mx-0">
                    <Film className="w-10 h-10 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                  {selectedFilm.nameRu || selectedFilm.nameOriginal}
                </h1>
                {selectedFilm.nameOriginal && selectedFilm.nameOriginal !== selectedFilm.nameRu && (
                  <div className="text-gray-500 text-sm mt-1">{selectedFilm.nameOriginal}</div>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  {selectedFilm.ratingKinopoisk && (
                    <div className="flex items-center gap-1.5 text-yellow-400">
                      <Star className="w-4 h-4 fill-yellow-400" />
                      <span className="font-bold">{selectedFilm.ratingKinopoisk}</span>
                    </div>
                  )}
                  {selectedFilm.year && (
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedFilm.year}</span>
                    </div>
                  )}
                  {selectedFilm.filmLength && (
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{formatLength(selectedFilm.filmLength)}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm leading-relaxed mt-4 line-clamp-4">
                  {selectedFilm.description || selectedFilm.shortDescription || ''}
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                  {selectedFilm.countries.length > 0 && (
                    <div className="rounded-xl p-3" style={{ background: '#252525' }}>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Страны</div>
                      <div className="text-white text-sm font-medium">
                        {selectedFilm.countries.slice(0, 2).map(c => c.country).join(', ')}
                      </div>
                    </div>
                  )}
                  {selectedFilm.genres.length > 0 && (
                    <div className="rounded-xl p-3" style={{ background: '#252525' }}>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Жанры</div>
                      <div className="text-white text-sm font-medium">
                        {selectedFilm.genres.slice(0, 2).map(g => g.genre).join(', ')}
                      </div>
                    </div>
                  )}
                  {selectedFilm.ratingKinopoisk && (
                    <div className="rounded-xl p-3" style={{ background: '#252525' }}>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">КР Рейтинг</div>
                      <div className="text-white text-sm font-bold">{selectedFilm.ratingKinopoisk}</div>
                    </div>
                  )}
                  {selectedFilm.ratingImdb && (
                    <div className="rounded-xl p-3" style={{ background: '#252525' }}>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">IMDB</div>
                      <div className="text-white text-sm font-bold">{selectedFilm.ratingImdb}</div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 mt-5">
                  {selectedFilm.webUrl && (
                    <a
                      href={selectedFilm.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-black text-sm transition-all hover:scale-105 active:scale-95"
                      style={{ background: '#e6a800' }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      кинопоиск
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (!selectedFilm) return
                      const title = encodeURIComponent(selectedFilm.nameRu || selectedFilm.nameOriginal || '')
                      router.push(`/kino/player/${selectedFilm.kinopoiskId}?title=${title}`)
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 active:scale-95"
                    style={{ background: '#8b2fc9' }}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    быстрый просмотр
                  </button>
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-black text-sm transition-all hover:scale-105 active:scale-95"
                    style={{ background: '#e6a800' }}
                    title="Тайминги"
                    onClick={() => {
                      if (!selectedFilm) return
                      const nextState = !showTimings
                      setShowTimings(nextState)
                      if (nextState) {
                        fetchTimings(selectedFilm.kinopoiskId.toString())
                      }
                    }}
                  >
                    <Timer className="w-4 h-4" />
                    тайминги
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timings Section */}
        {selectedFilm && showTimings && (
          <div className="w-full max-w-4xl mt-6">
            <div className="p-6 md:p-8 rounded-2xl border border-white/10 shadow-lg" style={{ background: '#111' }}>
              <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                    <Timer className="w-5 h-5 text-yellow-500" />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Пользовательские тайминги</h2>
                </div>
                <button
                  onClick={() => fetchTimings(selectedFilm.kinopoiskId.toString())}
                  disabled={timingsLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 hover:bg-white/10 transition-all text-gray-300 disabled:opacity-50 w-full sm:w-auto shrink-0"
                  style={{ background: '#1a1a1a' }}
                >
                  <RefreshCw className={`w-4 h-4 ${timingsLoading ? 'animate-spin' : ''}`} />
                  обновить
                </button>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddTiming} className="mb-8 p-6 rounded-xl border border-white/5 relative overflow-hidden group" style={{ background: '#161616' }}>
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-yellow-500" />
                  Добавить свой тайминг
                </h3>
                <div className="flex flex-col lg:flex-row gap-4">
                  <input
                    type="text"
                    required
                    maxLength={30}
                    placeholder="Ваш никнейм"
                    value={newTimingAuthor}
                    onChange={e => setNewTimingAuthor(e.target.value)}
                    className="flex-1 lg:w-48 px-4 py-3 rounded-lg border border-white/10 outline-none text-sm text-white placeholder:text-gray-600 focus:border-yellow-500/50 focus:bg-white/5 transition-all"
                    style={{ background: '#0a0a0a' }}
                  />
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Время (напр. 01:23:45)"
                    value={newTimingTime}
                    onChange={e => setNewTimingTime(e.target.value)}
                    className="w-full lg:w-48 px-4 py-3 rounded-lg border border-white/10 outline-none text-sm text-yellow-500 placeholder:text-gray-600 focus:border-yellow-500/50 focus:bg-white/5 transition-all font-mono"
                    style={{ background: '#0a0a0a' }}
                  />
                  <input
                    type="text"
                    required
                    maxLength={150}
                    placeholder="Что произошло? (напр. обнаженка / скример)"
                    value={newTimingDesc}
                    onChange={e => setNewTimingDesc(e.target.value)}
                    className="flex-[2] px-4 py-3 rounded-lg border border-white/10 outline-none text-sm text-white placeholder:text-gray-600 focus:border-yellow-500/50 focus:bg-white/5 transition-all"
                    style={{ background: '#0a0a0a' }}
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingTiming}
                    className="px-6 py-3 rounded-lg font-semibold text-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shrink-0 flex justify-center items-center gap-2"
                    style={{ background: '#e6a800' }}
                  >
                    {isSubmittingTiming ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Отправить'}
                  </button>
                </div>
              </form>

              {/* Timings List */}
              <div className="space-y-4">
                {timingsLoading && timings.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-sm animate-pulse">Загрузка таймингов...</div>
                ) : timings.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-sm flex flex-col items-center gap-3">
                    <Timer className="w-8 h-8 opacity-20" />
                    <span>Пока нет таймингов для этого фильма. Будь первым!</span>
                  </div>
                ) : (
                  timings.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-5 md:p-6 rounded-xl border relative overflow-hidden transition-all hover:border-white/10"
                      style={{ 
                        background: t.isSystem ? 'radial-gradient(circle at top right, rgba(239,68,68,0.05), transparent)' : '#161616',
                        borderColor: t.isSystem ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'
                      }}
                    >
                      {t.isSystem && (
                         <div className="absolute top-0 right-0 px-3 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded-bl-xl border-b border-l border-red-500/20">
                           Системное предупреждение
                         </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${t.isSystem ? 'bg-red-500/10' : 'bg-white/5'}`}>
                             <User className={`w-3.5 h-3.5 ${t.isSystem ? 'text-red-400' : 'text-gray-400'}`} />
                          </div>
                          <span className={`font-medium text-sm ${t.isSystem ? 'text-red-400' : 'text-yellow-500'}`}>
                            {t.author}
                          </span>
                        </div>
                        {!t.isSystem && (
                          <span className="text-gray-600 text-xs sm:ml-auto">
                            {new Date(t.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 font-mono font-medium text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-md text-sm border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                          {t.timeStr}
                        </div>
                        <div className={`leading-relaxed text-sm pt-0.5 ${t.isSystem ? 'text-red-200' : 'text-gray-300'}`}>
                          {t.description}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        {/* Empty state */}
        {!selectedFilm && !filmLoading && !query && (
          <div className="mt-20 text-center text-gray-700 text-sm">
            Введите название фильма или сериала
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-700">
          <span>© 2026 КИНО - ВСЕ ПРАВА ЗАЩИЩЕНЫ🔒</span>
          <span>может быть))))</span>
        </div>
      </footer>
    </div>
  )
}
