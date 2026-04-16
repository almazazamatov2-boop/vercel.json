'use client';

import { useSyncExternalStore, useEffect, useMemo, useRef } from 'react';

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface FloatingNicknamesProps {
  nicknames: string[];
}

interface ParticleState {
  id: number;
  text: string;
  baseX: number;
  baseY: number;
  opacity: number;
  color: string;
  glowColor: string;
  fontSize: number;
  fontWeight: number;
  freqX1: number;
  freqY1: number;
  freqX2: number;
  freqY2: number;
  ampX1: number;
  ampY1: number;
  ampX2: number;
  ampY2: number;
  phaseX1: number;
  phaseY1: number;
  phaseX2: number;
  phaseY2: number;
  currentRepelX: number;
  currentRepelY: number;
}

const COLORS = [
  { text: '#a78bfa', glow: '0 0 8px #a78bfa44, 0 0 24px #a78bfa22' },
  { text: '#c084fc', glow: '0 0 8px #c084fc44, 0 0 24px #c084fc22' },
  { text: '#e879f9', glow: '0 0 8px #e879f944, 0 0 24px #e879f922' },
  { text: '#818cf8', glow: '0 0 8px #818cf844, 0 0 24px #818cf822' },
  { text: '#f472b6', glow: '0 0 8px #f472b644, 0 0 24px #f472b622' },
  { text: '#94a3b8', glow: '0 0 8px #94a3b833, 0 0 24px #94a3b822' },
  { text: '#cbd5e1', glow: '0 0 8px #cbd5e133, 0 0 24px #cbd5e122' },
  { text: '#f0abfc', glow: '0 0 8px #f0abfc44, 0 0 24px #f0abfc22' },
  { text: '#a5b4fc', glow: '0 0 8px #a5b4fc44, 0 0 24px #a5b4fc22' },
  { text: '#d8b4fe', glow: '0 0 8px #d8b4fe44, 0 0 24px #d8b4fe22' },
];

function generateParticles(nicknames: string[]): ParticleState[] {
  if (nicknames.length === 0) return [];

  const count = Math.max(nicknames.length * 3, 50);
  const particles: ParticleState[] = [];

  for (let i = 0; i < count; i++) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const fontSize = Math.floor(Math.random() * 18) + 14;
    const fontWeight = Math.random() > 0.5 ? 600 : 400;

    particles.push({
      id: i,
      text: nicknames[Math.floor(Math.random() * nicknames.length)],
      baseX: Math.random() * 100,
      baseY: Math.random() * 100,
      opacity: Math.random() * 0.3 + 0.08,
      color: color.text,
      glowColor: color.glow,
      fontSize,
      fontWeight,
      freqX1: Math.random() * 0.2 + 0.08,
      freqY1: Math.random() * 0.15 + 0.06,
      freqX2: Math.random() * 0.3 + 0.12,
      freqY2: Math.random() * 0.25 + 0.1,
      ampX1: Math.random() * 100 + 40,
      ampY1: Math.random() * 60 + 30,
      ampX2: Math.random() * 50 + 20,
      ampY2: Math.random() * 40 + 15,
      phaseX1: Math.random() * Math.PI * 2,
      phaseY1: Math.random() * Math.PI * 2,
      phaseX2: Math.random() * Math.PI * 2,
      phaseY2: Math.random() * Math.PI * 2,
      currentRepelX: 0,
      currentRepelY: 0,
    });
  }
  return particles;
}

export default function FloatingNicknames({ nicknames }: FloatingNicknamesProps) {
  const isClient = useIsClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const elRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const mouseRef = useRef({ x: -9999, y: -9999 });

  const particles = useMemo(() => generateParticles(nicknames), [nicknames]);
  const particlesRef = useRef(particles);

  useEffect(() => {
    particlesRef.current = particles;
    const el = containerRef.current;
    if (!el) return;

    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    el.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    const REPEL_RADIUS = 200;
    const REPEL_FORCE = 140;
    const LERP = 0.07;

    const loop = () => {
      const mouse = mouseRef.current;
      const rect = el.getBoundingClientRect();
      const mx = mouse.x - rect.left;
      const my = mouse.y - rect.top;

      const time = performance.now() / 1000;

      for (const p of particlesRef.current) {
        const elSpan = elRefs.current.get(p.id);
        if (!elSpan) continue;

        // Organic drift via overlapping sine waves
        const driftX =
          Math.sin(time * p.freqX1 + p.phaseX1) * p.ampX1 +
          Math.sin(time * p.freqX2 + p.phaseX2) * p.ampX2;

        const driftY =
          Math.sin(time * p.freqY1 + p.phaseY1) * p.ampY1 +
          Math.cos(time * p.freqY2 + p.phaseY2) * p.ampY2;

        // Calculate screen position (approximate)
        const screenX = (p.baseX / 100) * rect.width + driftX + p.currentRepelX;
        const screenY = (p.baseY / 100) * rect.height + driftY + p.currentRepelY;
        const dx = screenX - mx;
        const dy = screenY - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetRX = 0;
        let targetRY = 0;

        if (dist < REPEL_RADIUS && dist > 0.01) {
          const strength = Math.pow(1 - dist / REPEL_RADIUS, 2) * REPEL_FORCE;
          targetRX = (dx / dist) * strength;
          targetRY = (dy / dist) * strength;
        }

        // Smooth easing for repulsion
        p.currentRepelX += (targetRX - p.currentRepelX) * LERP;
        p.currentRepelY += (targetRY - p.currentRepelY) * LERP;

        if (Math.abs(p.currentRepelX) < 0.05) p.currentRepelX = 0;
        if (Math.abs(p.currentRepelY) < 0.05) p.currentRepelY = 0;

        elSpan.style.transform = `translate(${driftX + p.currentRepelX}px, ${driftY + p.currentRepelY}px)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isClient, nicknames, particles]);

  if (!isClient) {
    return <div className="fixed inset-0 bg-[#111111]" />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#000000]">
      {/* Subtle purple radial glow */}
      <div className="absolute inset-0">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full"
          style={{
            background:
              'radial-gradient(ellipse, rgba(230,168,0,0.05) 0%, rgba(255,69,0,0.02) 40%, transparent 70%)',
          }}
        />
      </div>

      {/* Floating nicknames */}
      <div ref={containerRef} className="absolute inset-0 cursor-default">
        {particles.map((p) => (
          <span
            key={p.id}
            ref={(el) => {
              if (el) elRefs.current.set(p.id, el);
            }}
            className="absolute pointer-events-none select-none whitespace-nowrap"
            style={{
              left: `${p.baseX}%`,
              top: `${p.baseY}%`,
              fontSize: `${p.fontSize}px`,
              fontWeight: p.fontWeight,
              color: p.color,
              opacity: p.opacity,
              textShadow: p.glowColor,
              fontFamily: "'Waffle Soft', sans-serif",
              letterSpacing: '0.02em',
              willChange: 'transform',
            }}
          >
            {p.text}
          </span>
        ))}
      </div>

      {/* Soft vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </div>
  );
}
