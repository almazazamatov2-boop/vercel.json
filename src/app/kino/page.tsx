'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Star, Calendar, Clock, Globe, Film, X, ExternalLink, Play, Timer, Info, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

function PlayerModal({ film, onClose }: { film: FilmDetail; onClose: () => void }) {
  const playerUrl = `https://fbsite.fun/${film.kinopoiskId}/`

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#000' }}>
      <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: '#111' }}>
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold text-white">{film.nameRu || film.nameOriginal}</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-all hover:bg-white/10"
        >
          <X className="w-3.5 h-3.5" />
          закрыть
        </button>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <iframe
          src={playerUrl}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          referrerPolicy="no-referrer"
          allow="autoplay; fullscreen; picture-in-picture"
          style={{ border: 'none', display: 'block' }}
          title={film.nameRu || 'Player'}
        />
      </div>
    </div>
  )
}

export default function KinoPage() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<FilmSuggestion[]>([])
  const [selectedFilm, setSelectedFilm] = useState<FilmDetail | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filmLoading, setFilmLoading] = useState(false)
  const [playerOpen, setPlayerOpen] = useState(false)

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

  if (playerOpen && selectedFilm) {
    return <PlayerModal film={selectedFilm} onClose={() => setPlayerOpen(false)} />
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
                    onClick={() => setPlayerOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 active:scale-95"
                    style={{ background: '#8b2fc9' }}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    быстрый просмотр
                  </button>
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-black text-sm transition-all hover:scale-105 active:scale-95"
                    style={{ background: '#e6a800' }}
                    title="Тайминги — скоро"
                    onClick={() => alert('Тайминги скоро!')}
                  >
                    <Timer className="w-4 h-4" />
                    тайминги
                    <Info className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </div>
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
