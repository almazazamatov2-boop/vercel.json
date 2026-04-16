'use client'

import { useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Play, X } from 'lucide-react'

export default function PlayerPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params?.id as string
  const title = searchParams?.get('title') || ''
  const containerRef = useRef<HTMLDivElement>(null)
  const initRef = useRef(false)

  useEffect(() => {
    if (!id || initRef.current) return
    initRef.current = true

    const kpId = parseInt(id, 10)

    // Dynamically load Kinobox player script
    const script = document.createElement('script')
    script.src = `https://kinobox.tv/kinobox.min.js`
    script.async = true
    script.onload = () => {
      // @ts-ignore
      if (window.kbox && containerRef.current) {
        // @ts-ignore
        window.kbox(containerRef.current, {
          search: { kinopoisk: kpId },
          params: {
            // Try to use Alloha, Collaps, etc in order
            all: { poster: '' },
          },
        })
      }
    }
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [id])

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

      {/* Player area - kinobox renders here */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <div
          ref={containerRef}
          className="kinobox_player w-full h-full"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  )
}
