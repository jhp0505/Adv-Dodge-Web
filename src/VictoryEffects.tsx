import { useEffect, useRef } from 'react';
import type { Team } from './game';

type Spark = { x: number; y: number; vx: number; vy: number; life: number; total: number; color: string; size: number; confetti: boolean; angle: number };

/** Decorative only: no game actions, audio, or timers are changed. */
export function VictoryEffects({ team }: { team: Team }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const palette = team === 'blue' ? ['#70b8ff', '#a7dcff', '#ffdd78', '#fff4c4', '#ffffff'] : ['#ffffff', '#e1d7ff', '#ffdc78', '#ffb775', '#b1e6ff'];
    let width = 1, height = 1, frame = 0, last = 0, burstClock = 0, confettiClock = 0;
    let particles: Spark[] = [];
    const resize = () => {
      width = canvas.clientWidth; height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const burst = () => {
      const x = width * (.08 + Math.random() * .84), y = height * (.08 + Math.random() * .45);
      const color = palette[Math.floor(Math.random() * palette.length)];
      for (let i = 0; i < 70; i++) {
        const angle = Math.PI * 2 * i / 70, speed = 45 + Math.random() * 155;
        const life = 1.4 + Math.random() * .9;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, total: life, color, size: 1.5 + Math.random() * 2, confetti: false, angle });
      }
    };
    const draw = (time: number) => {
      const dt = Math.min((time - (last || time)) / 1000, .05); last = time;
      context.clearRect(0, 0, width, height);
      burstClock -= dt; confettiClock -= dt;
      if (burstClock <= 0) { burst(); burstClock = .6 + Math.random() * .35; }
      if (confettiClock <= 0) {
        for (let i = 0; i < 4; i++) particles.push({ x: Math.random() * width, y: -16, vx: (Math.random() - .5) * 45, vy: 50 + Math.random() * 65, life: 14, total: 14, color: palette[Math.floor(Math.random() * palette.length)], size: 4 + Math.random() * 4, confetti: true, angle: Math.random() * Math.PI });
        confettiClock = .17;
      }
      particles = particles.filter(p => p.life > 0 && p.y < height + 30).slice(-700);
      for (const p of particles) {
        p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (!p.confetti) { p.vy += 30 * dt; p.vx *= Math.exp(-.35 * dt); }
        p.angle += dt * 1.8;
        context.save();
        context.globalAlpha = Math.min(1, p.life / (p.confetti ? 1 : p.total) * 1.3);
        context.fillStyle = p.color;
        if (p.confetti) {
          context.translate(p.x, p.y); context.rotate(p.angle);
          context.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .45);
        } else {
          context.beginPath(); context.arc(p.x, p.y, p.size, 0, Math.PI * 2); context.fill();
        }
        context.restore();
      }
      frame = requestAnimationFrame(draw);
    };
    const restart = () => {
      cancelAnimationFrame(frame); last = 0;
      if (motion.matches) { context.clearRect(0, 0, width, height); particles = []; return; }
      if (!document.hidden) frame = requestAnimationFrame(draw);
    };
    resize(); restart();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', restart);
    motion.addEventListener('change', restart);
    return () => {
      cancelAnimationFrame(frame); particles = [];
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', restart);
      motion.removeEventListener('change', restart);
    };
  }, [team]);
  return <canvas ref={ref} className="victory-effects" aria-hidden="true" />;
}
