'use client';

import { useSyncExternalStore, useEffect, useMemo, useRef, useState } from 'react';

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
  rotation: number;
  rotationSpeed: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
}

const COLORS = [
  { text: '#a78bfa', glow: '0 0 12px #a78bfa66' },
  { text: '#c084fc', glow: '0 0 12px #c084fc66' },
  { text: '#818cf8', glow: '0 0 12px #818cf866' },
  { text: '#94a3b8', glow: '0 0 12px #94a3b844' },
  { text: '#6366f1', glow: '0 0 12px #6366f166' },
];

function generateParticles(nicknames: string[]): ParticleState[] {
  if (nicknames.length === 0) return [];
  const count = 200;
  const particles: ParticleState[] = [];

  for (let i = 0; i < count; i++) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const fontSize = Math.floor(Math.random() * 16) + 12;
    const fontWeight = Math.random() > 0.5 ? 600 : 400;

    particles.push({
      id: i,
      text: nicknames[Math.floor(Math.random() * nicknames.length)],
      baseX: Math.random() * 100,
      baseY: Math.random() * 100,
      opacity: Math.random() * 0.4 + 0.1,
      color: color.text,
      glowColor: color.glow,
      fontSize,
      fontWeight,
      freqX1: Math.random() * 0.15 + 0.05,
      freqY1: Math.random() * 0.12 + 0.04,
      freqX2: Math.random() * 0.2 + 0.08,
      freqY2: Math.random() * 0.18 + 0.07,
      ampX1: Math.random() * 80 + 30,
      ampY1: Math.random() * 50 + 20,
      ampX2: Math.random() * 40 + 15,
      ampY2: Math.random() * 30 + 10,
      phaseX1: Math.random() * Math.PI * 2,
      phaseY1: Math.random() * Math.PI * 2,
      phaseX2: Math.random() * Math.PI * 2,
      phaseY2: Math.random() * Math.PI * 2,
      currentRepelX: 0,
      currentRepelY: 0,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    });
  }
  return particles;
}

function generateStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.7 + 0.2,
      twinkleSpeed: Math.random() * 2 + 0.5,
    });
  }
  return stars;
}

export default function FloatingNicknames({ nicknames }: FloatingNicknamesProps) {
  const isClient = useIsClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const elRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const mouseRef = useRef({ x: -9999, y: -9999 });

  const particles = useMemo(() => generateParticles(nicknames), [nicknames]);
  const stars = useMemo(() => generateStars(), []);
  
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

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    const REPEL_RADIUS = 300; // Increased radius
    const REPEL_FORCE = 300;   // Increased force
    const LERP = 0.12;         // Increased LERP for snappier retreat

    const loop = () => {
      const mouse = mouseRef.current;
      const rect = el.getBoundingClientRect();
      const mx = mouse.x - rect.left;
      const my = mouse.y - rect.top;
      const time = performance.now() / 1000;

      for (const p of particlesRef.current) {
        const elSpan = elRefs.current.get(p.id);
        if (!elSpan) continue;

        // Space drifting effect
        const driftX = Math.sin(time * p.freqX1 + p.phaseX1) * p.ampX1 + Math.sin(time * p.freqX2 + p.phaseX2) * p.ampX2;
        const driftY = Math.sin(time * p.freqY1 + p.phaseY1) * p.ampY1 + Math.cos(time * p.freqY2 + p.phaseY2) * p.ampY2;

        const screenX = (p.baseX / 100) * rect.width + driftX;
        const screenY = (p.baseY / 100) * rect.height + driftY;
        
        const dx = (screenX + p.currentRepelX) - mx;
        const dy = (screenY + p.currentRepelY) - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetRX = 0;
        let targetRY = 0;

        if (dist < REPEL_RADIUS && dist > 0.1) {
          // Stronger repulsion when closer
          const ratio = 1 - dist / REPEL_RADIUS;
          const strength = ratio * REPEL_FORCE;
          targetRX = (dx / dist) * strength;
          targetRY = (dy / dist) * strength;
        }

        // Apply snappier lerp
        p.currentRepelX += (targetRX - p.currentRepelX) * LERP;
        p.currentRepelY += (targetRY - p.currentRepelY) * LERP;

        // Floating rotation
        p.rotation += p.rotationSpeed;

        elSpan.style.transform = `translate(${driftX + p.currentRepelX}px, ${driftY + p.currentRepelY}px)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isClient, nicknames, particles]);

  if (!isClient) {
    return <div className="fixed inset-0 bg-[#020205]" />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#020205]">
      {/* Stars Background */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map(star => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white transition-opacity duration-1000"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              boxShadow: star.size > 1.5 ? '0 0 8px rgba(255,255,255,0.8)' : 'none',
              animation: `twinkle ${star.twinkleSpeed}s infinite alternate ease-in-out`
            }}
          />
        ))}
      </div>

      {/* Nebula Glows */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-blue-900/5 blur-[150px]" />
      </div>

      {/* Floating nicknames */}
      <div ref={containerRef} className="absolute inset-0 cursor-default">
        {particles.map((p) => (
          <span
            key={p.id}
            ref={(el) => {
              if (el) elRefs.current.set(p.id, el);
            }}
            className="absolute pointer-events-none select-none whitespace-nowrap blur-[0.4px]"
            style={{
              left: `${p.baseX}%`,
              top: `${p.baseY}%`,
              fontSize: `${p.fontSize}px`,
              fontWeight: p.fontWeight,
              color: p.color,
              opacity: p.opacity,
              textShadow: p.glowColor,
              fontFamily: "'Waffle Soft', sans-serif",
              letterSpacing: '0.05em',
              willChange: 'transform',
            }}
          >
            {p.text}
          </span>
        ))}
      </div>

      {/* Dark Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 20%, rgba(2,2,5,0.6) 100%)',
        }}
      />

      <style jsx global>{`
        @keyframes twinkle {
          0% { opacity: 0.3; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
