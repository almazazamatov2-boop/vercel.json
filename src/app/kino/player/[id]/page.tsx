'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Play, X } from 'lucide-react'

export default function PlayerPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params?.id as string
  const title = searchParams?.get('title') ?? ''

  // Use our server-side proxy that spoof Referer as velcam.ru → fbsite.fun allows it
  const proxyUrl = `/api/kino/proxy/${id}`

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: '#0a0a0a', fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background: '#111', borderBottom: '1px solid #222' }}
      >
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-semibold text-white truncate max-w-xs">
            {decodeURIComponent(title) || 'Просмотр'}
          </span>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ background: '#222' }}
        >
          <X className="w-3.5 h-3.5" />
          закрыть
        </button>
      </div>

      {/* Iframe via proxy — hides top ~200px ad banner with overflow trick */}
      <div
        className="flex-1 relative"
        style={{ overflow: 'hidden' }}
      >
        {/* Shift iframe up to hide the top ad banner (~190px) */}
        <iframe
          src={proxyUrl}
          style={{
            position: 'absolute',
            top: '-190px',
            left: 0,
            width: '100%',
            height: 'calc(100% + 190px)',
            border: 'none',
            display: 'block',
          }}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          title={decodeURIComponent(title) || 'Player'}
        />
        {/* Block bottom-left Telegram ad popup with transparent overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 120,
            height: 100,
            zIndex: 10,
            background: '#0a0a0a',
          }}
        />
      </div>
    </div>
  )
}
