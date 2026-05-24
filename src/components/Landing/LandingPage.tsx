import { useEffect, useRef, useState, useCallback, type CSSProperties, type ReactNode } from 'react';

interface Props {
  onEnter: () => void;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; color: string; opacity: number;
}

type FlowerKind = 'daisy' | 'rose' | 'lotus' | 'tulip' | 'blossom';
interface BloomFlower {
  x: string; y: string; size: number; color: string; delay: string;
  duration: string; kind: FlowerKind; petals?: number; tilt?: number; scale?: number; opacity?: number;
}
type SparkleKind = 'star' | 'spark' | 'dot' | 'cross';
interface Sparkle {
  x: string; y: string; size: number; color: string; delay: string;
  duration: string; kind: SparkleKind; opacity: number; rotate: number;
}

const ACCENT_ORANGE = '#f97316';
const ACCENT_YELLOW = '#f59e0b';
const ACCENT_CYAN = '#22d3ee';
const ACCENT_PURPLE = '#a855f7';
const ACCENT_PINK = '#ec4899';
const ACCENT_INDIGO = '#6366f1';
const ACCENT_TEAL = '#14b8a6';
const ACCENT_GREEN = '#10b981';

const FLOWERS: BloomFlower[] = [
  { x: '3%',  y: '16%', size: 62, color: ACCENT_PURPLE, delay: '-1s',   duration: '14s',   kind: 'daisy',   tilt: -16, scale: 1.02, opacity: 0.55 },
  { x: '10%', y: '32%', size: 88, color: ACCENT_PINK,   delay: '-3s',   duration: '16s',   kind: 'rose',    tilt: 14,  scale: 1.00, opacity: 0.62 },
  { x: '16%', y: '77%', size: 54, color: ACCENT_CYAN,   delay: '-5s',   duration: '13s',   kind: 'blossom', tilt: -12, scale: 0.96, opacity: 0.48 },
  { x: '24%', y: '10%', size: 46, color: ACCENT_YELLOW, delay: '-2s',   duration: '12s',   kind: 'tulip',   tilt: 22,  scale: 0.92, opacity: 0.42 },
  { x: '31%', y: '87%', size: 72, color: ACCENT_TEAL,   delay: '-4s',   duration: '15s',   kind: 'lotus',   tilt: -8,  scale: 0.98, opacity: 0.52 },
  { x: '40%', y: '21%', size: 42, color: ACCENT_INDIGO, delay: '-6s',   duration: '11s',   kind: 'blossom', tilt: 10,  scale: 0.86, opacity: 0.34 },
  { x: '48%', y: '8%',  size: 60, color: ACCENT_PINK,   delay: '-2.8s', duration: '14.5s', kind: 'rose',    tilt: -18, scale: 0.95, opacity: 0.45 },
  { x: '55%', y: '17%', size: 34, color: ACCENT_YELLOW, delay: '-1.2s', duration: '10s',   kind: 'daisy',   tilt: 7,   scale: 0.78, opacity: 0.24 },
  { x: '63%', y: '11%', size: 50, color: ACCENT_CYAN,   delay: '-3.5s', duration: '12.5s', kind: 'lotus',   tilt: 18,  scale: 0.84, opacity: 0.38 },
  { x: '70%', y: '27%', size: 90, color: ACCENT_ORANGE, delay: '-4.2s', duration: '17s',   kind: 'tulip',   tilt: 6,   scale: 1.02, opacity: 0.60 },
  { x: '78%', y: '13%', size: 52, color: ACCENT_PURPLE, delay: '-1.8s', duration: '11.8s', kind: 'daisy',   tilt: -14, scale: 0.88, opacity: 0.40 },
  { x: '86%', y: '39%', size: 68, color: ACCENT_PINK,   delay: '-5s',   duration: '13.8s', kind: 'blossom', tilt: 13,  scale: 0.96, opacity: 0.48 },
  { x: '93%', y: '22%', size: 80, color: ACCENT_TEAL,   delay: '-2.5s', duration: '16s',   kind: 'rose',    tilt: -8,  scale: 1.00, opacity: 0.56 },
  { x: '95%', y: '62%', size: 50, color: ACCENT_YELLOW, delay: '-3.4s', duration: '12s',   kind: 'tulip',   tilt: 9,   scale: 0.80, opacity: 0.36 },
  { x: '88%', y: '85%', size: 72, color: ACCENT_CYAN,   delay: '-4.7s', duration: '15s',   kind: 'lotus',   tilt: -16, scale: 0.94, opacity: 0.42 },
  { x: '75%', y: '92%', size: 60, color: ACCENT_GREEN,  delay: '-6s',   duration: '13s',   kind: 'blossom', tilt: 18,  scale: 0.90, opacity: 0.50 },
  { x: '60%', y: '84%', size: 58, color: ACCENT_INDIGO, delay: '-3.1s', duration: '14s',   kind: 'daisy',   tilt: -10, scale: 0.90, opacity: 0.40 },
  { x: '44%', y: '91%', size: 58, color: ACCENT_ORANGE, delay: '-2.7s', duration: '13.4s', kind: 'rose',    tilt: 12,  scale: 0.88, opacity: 0.42 },
  { x: '7%',  y: '65%', size: 52, color: ACCENT_YELLOW, delay: '-1.6s', duration: '11.8s', kind: 'blossom', tilt: 12,  scale: 0.86, opacity: 0.36 },
  { x: '18%', y: '47%', size: 66, color: ACCENT_GREEN,  delay: '-4.1s', duration: '14.6s', kind: 'lotus',   tilt: -14, scale: 0.92, opacity: 0.44 },
  { x: '28%', y: '23%', size: 54, color: ACCENT_ORANGE, delay: '-2.2s', duration: '12.2s', kind: 'rose',    tilt: 20,  scale: 0.84, opacity: 0.35 },
  { x: '52%', y: '73%', size: 84, color: ACCENT_CYAN,   delay: '-3.7s', duration: '16.8s', kind: 'daisy',   tilt: -6,  scale: 0.98, opacity: 0.56 },
  { x: '67%', y: '66%', size: 46, color: ACCENT_PINK,   delay: '-5.2s', duration: '12.8s', kind: 'tulip',   tilt: 10,  scale: 0.82, opacity: 0.34 },
  { x: '82%', y: '58%', size: 64, color: ACCENT_INDIGO, delay: '-2.9s', duration: '14.2s', kind: 'blossom', tilt: -12, scale: 0.90, opacity: 0.42 },
  { x: '90%', y: '76%', size: 56, color: ACCENT_PURPLE, delay: '-1.4s', duration: '11.4s', kind: 'daisy',   tilt: 16,  scale: 0.84, opacity: 0.38 },
  { x: '11%', y: '88%', size: 44, color: ACCENT_ORANGE, delay: '-3.3s', duration: '10.8s', kind: 'tulip',   tilt: -18, scale: 0.78, opacity: 0.28 },
];

const SPARKLES: Sparkle[] = [
  { x: '5%',  y: '14%', size: 18, color: ACCENT_CYAN,   delay: '-1.2s', duration: '4.8s', kind: 'star',  opacity: 0.72, rotate: -10 },
  { x: '8%',  y: '22%', size: 11, color: ACCENT_PURPLE, delay: '-2.4s', duration: '5.2s', kind: 'spark', opacity: 0.60, rotate: 18 },
  { x: '13%', y: '19%', size: 10, color: ACCENT_ORANGE, delay: '-0.8s', duration: '4.5s', kind: 'dot',   opacity: 0.85, rotate: 0 },
  { x: '20%', y: '12%', size: 12, color: ACCENT_YELLOW, delay: '-1.8s', duration: '4.2s', kind: 'spark', opacity: 0.78, rotate: -22 },
  { x: '28%', y: '18%', size: 14, color: ACCENT_TEAL,   delay: '-1.1s', duration: '4.7s', kind: 'star',  opacity: 0.70, rotate: 12 },
  { x: '36%', y: '15%', size: 8,  color: ACCENT_PINK,   delay: '-0.6s', duration: '4.0s', kind: 'dot',   opacity: 0.88, rotate: 0 },
  { x: '45%', y: '11%', size: 13, color: ACCENT_YELLOW, delay: '-1.4s', duration: '4.4s', kind: 'star',  opacity: 0.77, rotate: -8 },
  { x: '54%', y: '17%', size: 8,  color: ACCENT_ORANGE, delay: '-1.0s', duration: '4.1s', kind: 'dot',   opacity: 0.84, rotate: 0 },
  { x: '62%', y: '13%', size: 12, color: ACCENT_CYAN,   delay: '-1.9s', duration: '4.6s', kind: 'spark', opacity: 0.78, rotate: 22 },
  { x: '70%', y: '16%', size: 17, color: ACCENT_ORANGE, delay: '-3.3s', duration: '5.7s', kind: 'cross', opacity: 0.60, rotate: 34 },
  { x: '78%', y: '18%', size: 8,  color: ACCENT_YELLOW, delay: '-1.3s', duration: '4.0s', kind: 'dot',   opacity: 0.90, rotate: 0 },
  { x: '86%', y: '16%', size: 16, color: ACCENT_PINK,   delay: '-1.8s', duration: '4.9s', kind: 'cross', opacity: 0.64, rotate: -26 },
  { x: '91%', y: '23%', size: 12, color: ACCENT_CYAN,   delay: '-2.4s', duration: '5.1s', kind: 'star',  opacity: 0.75, rotate: 16 },
  { x: '7%',  y: '52%', size: 16, color: ACCENT_ORANGE, delay: '-2.1s', duration: '5.4s', kind: 'star',  opacity: 0.68, rotate: 20 },
  { x: '46%', y: '63%', size: 11, color: ACCENT_PINK,   delay: '-1.5s', duration: '4.7s', kind: 'star',  opacity: 0.76, rotate: -18 },
  { x: '86%', y: '62%', size: 15, color: ACCENT_YELLOW, delay: '-1.8s', duration: '5.4s', kind: 'star',  opacity: 0.74, rotate: 22 },
  { x: '10%', y: '81%', size: 12, color: ACCENT_PINK,   delay: '-1.7s', duration: '4.5s', kind: 'spark', opacity: 0.74, rotate: 12 },
  { x: '50%', y: '78%', size: 15, color: ACCENT_PURPLE, delay: '-3.4s', duration: '5.9s', kind: 'spark', opacity: 0.66, rotate: 18 },
  { x: '74%', y: '87%', size: 16, color: ACCENT_PINK,   delay: '-2.7s', duration: '5.5s', kind: 'star',  opacity: 0.70, rotate: 28 },
  { x: '96%', y: '79%', size: 14, color: ACCENT_CYAN,   delay: '-3.1s', duration: '5.2s', kind: 'cross', opacity: 0.64, rotate: 14 },
];

const STATS = [
  { value: '128',    label: 'MoE Experts in Gemma 4',     color: ACCENT_CYAN },
  { value: '256K',   label: 'Context window tokens',      color: ACCENT_PURPLE },
  { value: '26B',    label: 'Parameters, ~3.8B active',   color: ACCENT_PINK },
  { value: '∞',      label: 'Cross-domain combinations',  color: ACCENT_TEAL },
];

const TESTIMONIALS = [
  {
    quote: "Bloom took my urban decay footage and mycelium growth video and synthesized a regenerative city infrastructure concept I'd never have reached alone. Gemma 4's reasoning trace bloomed in real time.",
    name: 'Dr. Priya Nair',
    role: 'Systems Ecologist, Future Cities Lab',
    avatar: 'PN',
    color: ACCENT_CYAN,
  },
  {
    quote: "I planted a medical scan and a quantum interference pattern. Bloom's MoE router collided them and produced a diagnostic hypothesis my entire team found groundbreaking.",
    name: 'Marcus Chen',
    role: 'AI Research Lead, MedVision Institute',
    avatar: 'MC',
    color: ACCENT_PURPLE,
  },
  {
    quote: "The living vine graph showing expert activation in real time is unlike anything I've seen. You watch Gemma 4 think — and the ideas that emerge are genuinely novel.",
    name: 'Aria Patel',
    role: 'Creative Director, Synthesis Studio',
    avatar: 'AP',
    color: ACCENT_PINK,
  },
];

// Task 4: Better nav names matching page contents
const NAV_ITEMS = [
  ['The Garden', 'features'],
  ['MoE Engine', 'whygemma'],
  ['Grow With Us', 'howitworks'],
  ['By the Numbers', 'stats'],
] as const;

// ── useInView ──
function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── Backgrounds ──
function FluidBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', inset: '-14%', background: 'linear-gradient(120deg, rgba(99,102,241,0.16) 0%, rgba(168,85,247,0.12) 24%, rgba(34,211,238,0.14) 52%, rgba(245,158,11,0.10) 78%, rgba(236,72,153,0.10) 100%)', backgroundSize: '240% 240%', filter: 'blur(82px)', opacity: 0.78, animation: 'gradientDrift 26s ease-in-out infinite', mixBlendMode: 'screen' }} />
      <div style={{ position: 'absolute', top: '-18%', left: '-10%', width: '56vw', height: '56vw', background: 'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.26) 0%, rgba(168,85,247,0.14) 35%, transparent 70%)', borderRadius: '50%', filter: 'blur(88px)', animation: 'orbFloat1 16s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: '12%', right: '-12%', width: '52vw', height: '52vw', background: 'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.22) 0%, rgba(20,184,166,0.10) 36%, transparent 72%)', borderRadius: '50%', filter: 'blur(94px)', animation: 'orbFloat2 18s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '18%', width: '68vw', height: '48vw', background: 'radial-gradient(circle at 40% 40%, rgba(245,158,11,0.14) 0%, rgba(236,72,153,0.08) 38%, transparent 72%)', borderRadius: '50%', filter: 'blur(96px)', animation: 'orbFloat3 22s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.045) 1px, transparent 1px)', backgroundSize: '72px 72px', opacity: 0.42 }} />
    </div>
  );
}

function OrbBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(168,85,247,0.08) 50%, transparent 70%)', borderRadius: '50%', animation: 'orbFloat1 12s ease-in-out infinite', filter: 'blur(1px)' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-8%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, rgba(20,184,166,0.06) 50%, transparent 70%)', borderRadius: '50%', animation: 'orbFloat2 15s ease-in-out infinite', filter: 'blur(1px)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
    </div>
  );
}

// Task 1.1: Reusable animated grid background for non-hero sections
function SectionGridBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* Animated drifting gradient — toned down for content sections */}
      <div style={{ position: 'absolute', inset: '-14%', background: 'linear-gradient(120deg, rgba(99,102,241,0.10) 0%, rgba(168,85,247,0.08) 24%, rgba(34,211,238,0.08) 52%, rgba(245,158,11,0.06) 78%, rgba(236,72,153,0.06) 100%)', backgroundSize: '240% 240%', filter: 'blur(82px)', opacity: 0.55, animation: 'gradientDrift 26s ease-in-out infinite', mixBlendMode: 'screen' }} />
      {/* Floating orbs */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '45vw', height: '45vw', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, rgba(168,85,247,0.06) 50%, transparent 70%)', borderRadius: '50%', animation: 'orbFloat1 14s ease-in-out infinite', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-8%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, rgba(20,184,166,0.05) 50%, transparent 70%)', borderRadius: '50%', animation: 'orbFloat2 17s ease-in-out infinite', filter: 'blur(40px)' }} />
      {/* The signature animated grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.045) 1px, transparent 1px)', backgroundSize: '72px 72px', opacity: 0.5, animation: 'gridShift 30s linear infinite' }} />
    </div>
  );
}

function BloomingFlowers() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {FLOWERS.map((flower, i) => (
        <div key={i} style={{ position: 'absolute', left: flower.x, top: flower.y, width: flower.size, height: flower.size, transform: `translate(-50%, -50%) scale(${flower.scale ?? 1}) rotate(${flower.tilt ?? 0}deg)`, opacity: flower.opacity ?? 0.55, filter: `drop-shadow(0 0 18px ${flower.color}35) saturate(1.12)`, mixBlendMode: 'screen' }}>
          <div style={{ position: 'absolute', inset: -flower.size * 0.24, borderRadius: '50%', background: `radial-gradient(circle, ${flower.color}26 0%, transparent 70%)`, filter: 'blur(16px)' }} />
          <div style={{ position: 'absolute', inset: 0, animation: `flowerFloat ${flower.duration} ease-in-out ${flower.delay} infinite` }}>
            <div style={{ position: 'absolute', inset: 0, animation: `flowerPulse ${flower.duration} ease-in-out ${flower.delay} infinite` }}>
              <FlowerArt flower={flower} index={i} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FlowerArt({ flower, index }: { flower: BloomFlower; index: number }) {
  const id = `bloom-flower-${index}`;
  const petalCount = flower.petals ?? (flower.kind === 'lotus' ? 8 : flower.kind === 'daisy' ? 12 : flower.kind === 'rose' ? 6 : flower.kind === 'tulip' ? 3 : 5);
  const outerAngles = Array.from({ length: petalCount }, (_, idx) => idx * (360 / petalCount));
  const innerAngles = Array.from({ length: Math.max(3, Math.floor(petalCount / 2)) }, (_, idx) => idx * (360 / Math.max(3, Math.floor(petalCount / 2))) + 360 / (petalCount * 2));
  const petalGrad = `url(#${id}-petal)`;
  const petalSoft = `url(#${id}-petal-soft)`;
  const coreGrad = `url(#${id}-core)`;
  const stemGrad = `url(#${id}-stem)`;
  const leafGrad = `url(#${id}-leaf)`;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-petal`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" /><stop offset="36%" stopColor={flower.color} stopOpacity="0.98" /><stop offset="100%" stopColor={flower.color} stopOpacity="0.56" /></linearGradient>
        <linearGradient id={`${id}-petal-soft`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.78" /><stop offset="48%" stopColor={flower.color} stopOpacity="0.86" /><stop offset="100%" stopColor={flower.color} stopOpacity="0.42" /></linearGradient>
        <radialGradient id={`${id}-core`}><stop offset="0%" stopColor="#ffffff" stopOpacity="1" /><stop offset="38%" stopColor={flower.color} stopOpacity="0.95" /><stop offset="100%" stopColor={flower.color} stopOpacity="0.18" /></radialGradient>
        <linearGradient id={`${id}-stem`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#86efac" stopOpacity="1" /><stop offset="100%" stopColor="#059669" stopOpacity="0.9" /></linearGradient>
        <linearGradient id={`${id}-leaf`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.95" /><stop offset="100%" stopColor="#10b981" stopOpacity="0.55" /></linearGradient>
      </defs>
      {flower.kind === 'daisy' && (<>{outerAngles.map(a => <ellipse key={`do-${a}`} cx="50" cy="31" rx="8" ry="19" fill={petalGrad} transform={`rotate(${a} 50 50)`} opacity="0.96" />)}{outerAngles.map(a => <ellipse key={`di-${a}`} cx="50" cy="38" rx="5" ry="12" fill={petalSoft} transform={`rotate(${a + 15} 50 50)`} opacity="0.72" />)}<circle cx="50" cy="50" r="16" fill={coreGrad} /><circle cx="50" cy="50" r="6" fill="#fff" opacity="0.88" /></>)}
      {flower.kind === 'rose' && (<>{outerAngles.slice(0, 6).map((a, idx) => <path key={`ro-${a}`} d="M50 22 C59 24 64 32 63 41 C62 51 56 59 50 64 C44 59 38 51 37 41 C36 32 41 24 50 22 Z" fill={petalGrad} transform={`rotate(${a} 50 50) scale(${idx % 2 === 0 ? 1 : 0.94})`} opacity={idx < 3 ? 0.97 : 0.82} />)}<path d="M50 28 C56 29 60 35 59 42 C58 49 54 55 50 59 C46 55 42 49 41 42 C40 35 44 29 50 28 Z" fill={petalSoft} opacity="0.92" /><path d="M50 34 C54 35 56 39 55 43 C54 47 52 51 50 54 C48 51 46 47 45 43 C44 39 46 35 50 34 Z" fill={coreGrad} opacity="0.92" /><path d="M50 61 C50 71 50 81 49 92" stroke={stemGrad} strokeWidth="3" strokeLinecap="round" opacity="0.75" /><path d="M49 73 C42 72 37 68 32 63 C39 63 44 66 49 71 Z" fill={leafGrad} opacity="0.5" /><path d="M50 73 C57 72 62 68 67 63 C60 63 55 66 50 71 Z" fill={leafGrad} opacity="0.48" /></>)}
      {flower.kind === 'lotus' && (<>{outerAngles.map(a => <path key={`lo-${a}`} d="M50 14 C57 26 61 38 50 60 C39 38 43 26 50 14 Z" fill={petalGrad} transform={`rotate(${a} 50 50)`} opacity="0.92" />)}{innerAngles.map(a => <path key={`li-${a}`} d="M50 24 C55 33 57 41 50 54 C43 41 45 33 50 24 Z" fill={petalSoft} transform={`rotate(${a} 50 50)`} opacity="0.78" />)}<circle cx="50" cy="52" r="13" fill={coreGrad} /><circle cx="50" cy="52" r="5" fill="#fff" opacity="0.8" /></>)}
      {flower.kind === 'tulip' && (<><path d="M50 24 C58 25 65 33 66 44 C67 56 61 68 50 76 C39 68 33 56 34 44 C35 33 42 25 50 24 Z" fill={petalGrad} /><path d="M50 27 C55 28 60 35 60 44 C60 53 56 62 50 70 C44 62 40 53 40 44 C40 35 45 28 50 27 Z" fill={petalSoft} opacity="0.88" /><path d="M50 31 C54 32 57 37 57 44 C57 50 54 57 50 63 C46 57 43 50 43 44 C43 37 46 32 50 31 Z" fill={coreGrad} opacity="0.82" /><path d="M50 76 C50 82 50 88 50 95" stroke={stemGrad} strokeWidth="4" strokeLinecap="round" /><path d="M50 76 C43 74 37 68 32 60 C40 61 45 65 50 71 Z" fill={leafGrad} opacity="0.9" /><path d="M50 76 C57 74 63 68 68 60 C60 61 55 65 50 71 Z" fill={leafGrad} opacity="0.88" /></>)}
      {flower.kind === 'blossom' && (<>{Array.from({ length: 5 }, (_, idx) => idx * 72).map(a => <path key={`bo-${a}`} d="M50 26 C58 21 67 28 67 38 C67 49 58 57 50 61 C42 57 33 49 33 38 C33 28 42 21 50 26 Z" fill={petalGrad} transform={`rotate(${a} 50 50)`} opacity="0.92" />)}{Array.from({ length: 5 }, (_, idx) => idx * 72 + 36).map(a => <path key={`bs-${a}`} d="M50 33 C56 29 62 34 62 41 C62 48 56 54 50 57 C44 54 38 48 38 41 C38 34 44 29 50 33 Z" fill={petalSoft} transform={`rotate(${a} 50 50)`} opacity="0.72" />)}<circle cx="50" cy="50" r="12" fill={coreGrad} /><circle cx="50" cy="50" r="4.5" fill="#fff" opacity="0.85" /></>)}
    </svg>
  );
}

function SparkleField() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 2 }}>
      {SPARKLES.map((sparkle, i) => {
        const isDot = sparkle.kind === 'dot';
        const symbol = sparkle.kind === 'star' ? '✦' : sparkle.kind === 'spark' ? '✧' : sparkle.kind === 'cross' ? '✶' : '•';
        return (
          <div key={i} style={{ position: 'absolute', left: sparkle.x, top: sparkle.y, width: sparkle.size * 2, height: sparkle.size * 2, transform: `translate(-50%, -50%) rotate(${sparkle.rotate}deg)`, opacity: sparkle.opacity, mixBlendMode: 'screen', filter: 'saturate(1.2)' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, ${sparkle.color}55 0%, ${sparkle.color}22 24%, transparent 72%)`, filter: 'blur(4px)', animation: `sparkleFloat ${sparkle.duration} ease-in-out ${sparkle.delay} infinite` }} />
            {isDot ? (
              <div style={{ position: 'absolute', left: '50%', top: '50%', width: Math.max(4, sparkle.size * 0.48), height: Math.max(4, sparkle.size * 0.48), marginLeft: -Math.max(4, sparkle.size * 0.24), marginTop: -Math.max(4, sparkle.size * 0.24), borderRadius: '50%', background: sparkle.color, boxShadow: `0 0 10px ${sparkle.color}, 0 0 22px ${sparkle.color}77`, animation: `sparkleTwinkle ${sparkle.duration} ease-in-out ${sparkle.delay} infinite` }} />
            ) : (
              <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: sparkle.size * 1.05, color: sparkle.color, lineHeight: 1, textShadow: `0 0 10px ${sparkle.color}cc, 0 0 22px ${sparkle.color}66`, animation: `sparkleTwinkle ${sparkle.duration} ease-in-out ${sparkle.delay} infinite`, fontWeight: 700 }}>{symbol}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const colors = [ACCENT_CYAN, ACCENT_PURPLE, ACCENT_PINK, ACCENT_INDIGO, ACCENT_TEAL];
    const particles: Particle[] = [];
    const spawn = () => { particles.push({ x: Math.random() * canvas.width, y: canvas.height + 10, vx: (Math.random() - 0.5) * 0.4, vy: -(Math.random() * 0.6 + 0.2), life: 0, maxLife: 180 + Math.random() * 120, size: 1 + Math.random() * 2.5, color: colors[Math.floor(Math.random() * colors.length)], opacity: 0 }); };
    for (let i = 0; i < 40; i++) { spawn(); particles[i].y = Math.random() * canvas.height; particles[i].life = Math.random() * particles[i].maxLife; }
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (Math.random() < 0.35) spawn();
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; p.x += p.vx; p.y += p.vy; p.life++;
        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.7;
        ctx.globalAlpha = alpha; ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        if (p.life >= p.maxLife) particles.splice(i, 1);
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />;
}

function Reveal({ children, delay = 0, style = {} }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0px)' : 'translateY(36px)', transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

function AnimatedCounter({ target }: { target: string }) {
  const [display, setDisplay] = useState('0');
  const { ref, inView } = useInView<HTMLSpanElement>(0.3);
  useEffect(() => {
    if (!inView) return;
    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) { setDisplay(target); return; }
    const prefix = target.match(/^[^0-9]*/)?.[0] ?? '';
    const suf = target.match(/[^0-9.]+$/)?.[0] ?? '';
    let start = 0; const duration = 1800; const step = 16; const steps = duration / step; const inc = num / steps;
    const timer = setInterval(() => {
      start += inc;
      if (start >= num) { setDisplay(`${prefix}${target.replace(/^[^0-9]*/, '')}`); clearInterval(timer); return; }
      setDisplay(`${prefix}${start.toFixed(num % 1 !== 0 ? 1 : 0)}${suf}`);
    }, step);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{inView ? display : '0'}</span>;
}

// ── NAVBAR (Task 5: Sign in removed) ──
function NavBar({ onEnter }: { onEnter: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: '0 32px',
      background: scrolled ? 'rgba(8,11,22,0.55)' : 'rgba(8,11,22,0.25)',
      backdropFilter: 'blur(28px) saturate(1.6)',
      WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
      borderBottom: '1px solid rgba(255,255,255,0.10)',
      transition: 'background 0.4s ease',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/images/logo.png" alt="Bloom Logo" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(90deg, #e2e8f0, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Bloom</span>
        </div>
        {/* Nav links — Task 4: better names */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          {NAV_ITEMS.map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.82)', fontSize: 16, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif', transition: 'color 0.2s', padding: '4px 0', letterSpacing: '-0.01em' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.82)')}
            >{label}</button>
          ))}
        </div>
        {/* CTAs — Task 5: Sign in removed, only Enter the Lab remains */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onEnter} style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif', padding: '10px 22px', borderRadius: 10, boxShadow: '0 0 20px rgba(99,102,241,0.35)', transition: 'all 0.25s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(99,102,241,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(99,102,241,0.35)'; }}
          >Enter the Lab</button>
        </div>
      </div>
    </nav>
  );
}

// ── HERO ──
function HeroSection({ onEnter }: { onEnter: () => void }) {
  const [btnHovered, setBtnHovered] = useState(false);
  const [btn2Hovered, setBtn2Hovered] = useState(false);

  const TYPEWRITER_PHRASES = [
    'planting seeds of inspiration.',
    'growing hybrid solutions.',
    'cultivating ideas from scratch.',
    'harvesting raw genius.',
    'tracing new mental roots.',
    'unearthing hidden pathways.',
    'watching your concepts evolve.',
  ];
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const word = TYPEWRITER_PHRASES[phraseIdx];
    if (typing) {
      if (displayed.length < word.length) {
        const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 60);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 2000);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
        return () => clearTimeout(t);
      } else {
        setPhraseIdx(i => (i + 1) % TYPEWRITER_PHRASES.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, phraseIdx]);

  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', overflow: 'hidden' }}>
      <FluidBackground />
      <OrbBackground />
      <BloomingFlowers />
      <ParticleCanvas />
      <SparkleField />

      <div style={{ position: 'relative', zIndex: 3, maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 999, padding: '6px 18px', marginBottom: 30, animation: 'fadeSlideDown 0.8s ease both' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT_CYAN, boxShadow: `0 0 8px ${ACCENT_CYAN}`, display: 'inline-block', animation: 'pulse 2s ease infinite' }} />
          <span style={{ color: ACCENT_CYAN, fontSize: 14, fontWeight: 700, letterSpacing: '0.04em' }}> Beta Testing Phase • Featuring Gemma 4 26B MoE</span>
        </div>

        {/* Main headline */}
        <div style={{ margin: '0 0 28px', animation: 'fadeSlideDown 0.8s ease 0.1s both' }}>
          <h1 style={{ fontSize: 'clamp(72px, 11vw, 150px)', fontWeight: 900, letterSpacing: '0.0em', lineHeight: 0.92, fontFamily: 'Inter, system-ui, sans-serif', background: 'linear-gradient(120deg, #f59e0b 0%, #fb923c 16%, #f97316 34%, #facc15 52%, #fb7185 74%, #a855f7 100%)', backgroundSize: '340% 340%', backgroundRepeat: 'no-repeat', animation: 'bloomTextFlow 8s ease-in-out infinite', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 10px', willChange: 'background-position' }}>
            BLOOM
          </h1>
          <p style={{ fontSize: 'clamp(48px, 6vw, 80px)', color: '#ffffff', fontWeight: 400, lineHeight: 1.0, letterSpacing: '-0.03em', fontFamily: '"Fleur De Leah", cursive', margin: 0, opacity: 0.98 }}>
            grow beyond limits
          </p>
        </div>

        {/* Task 1: Fix blinking — cursor is now SOLID (no blink animation) */}
        <div style={{ minHeight: '4em', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 'clamp(17px, 2.2vw, 22px)', color: '#94a3b8', fontWeight: 400, lineHeight: 1.7, maxWidth: 680, margin: '0 auto', animation: 'fadeSlideDown 0.8s ease 0.3s both', fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center' }}>
            Your next breakthrough is blooming. Start{' '}
            <span style={{ color: ACCENT_CYAN, fontWeight: 700, borderRight: `2.5px solid ${ACCENT_CYAN}`, paddingRight: 3 }}>
              {displayed}
            </span>
          </p>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', alignItems: 'center', animation: 'fadeSlideDown 0.8s ease 0.4s both', marginTop: 32 }}>
          <button onClick={onEnter} onMouseEnter={() => setBtnHovered(true)} onMouseLeave={() => setBtnHovered(false)}
            style={{ padding: '16px 40px', borderRadius: 13, border: 'none', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', fontSize: 17, fontWeight: 800, fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer', boxShadow: btnHovered ? '0 0 40px rgba(99,102,241,0.6), 0 8px 30px rgba(0,0,0,0.3)' : '0 0 25px rgba(99,102,241,0.35)', transform: btnHovered ? 'translateY(-2px) scale(1.03)' : 'translateY(0) scale(1)', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', letterSpacing: '-0.01em' }}>
            Enter the Lab →
          </button>
          <a href="https://www.youtube.com/watch?v=DEMO_LINK_HERE" target="_blank" rel="noopener noreferrer"
            onMouseEnter={() => setBtn2Hovered(true)} onMouseLeave={() => setBtn2Hovered(false)}
            style={{ padding: '16px 40px', borderRadius: 13, border: `1px solid ${btn2Hovered ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)'}`, background: btn2Hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: 17, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer', backdropFilter: 'blur(12px)', transform: btn2Hovered ? 'translateY(-2px)' : 'translateY(0)', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', letterSpacing: '-0.01em', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            ▶ Watch Demo
          </a>
        </div>

        {/* Social proof */}
        <div style={{ marginTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap', animation: 'fadeSlideDown 0.8s ease 0.5s both' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {['#6366f1', '#a855f7', '#ec4899', '#22d3ee', '#14b8a6'].map((c, i) => (
              <div key={i} style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, ${c}, ${c}99)`, border: '2px solid #080b16', marginLeft: i > 0 ? -10 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                {['S', 'M', 'A', 'J', 'K'][i]}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: 2 }}>{[...Array(5)].map((_, i) => <span key={i} style={{ color: '#fbbf24', fontSize: 15 }}>★</span>)}</div>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}><span style={{ color: '#94a3b8', fontWeight: 700 }}>4.9/5</span> from 2,400+ breakthroughs</p>
          </div>
        </div>
      </div>

      {/* Hero feature cards */}
      <div style={{ position: 'relative', zIndex: 2, marginTop: 96, width: '100%', maxWidth: 1100, animation: 'fadeSlideUp 1s ease 0.6s both', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <HeroFeatureCards />
      </div>
    </section>
  );
}

// ── Hero feature cards ──
function HeroFeatureCards() {
  const HERO_FEATURE_ROWS = [
    {
     icon: '🌱',
     title: 'Plant Your Problem Matrix',
     desc: 'Upload real-world images or video — urban decay, medical scans, factory bottlenecks, personal struggle footage. Bloom\'s AI vision encoder immediately begins reading spatial patterns, textures, and temporal cues directly from your visual input.',
     bg: "url('public/images/problem_matrix.PNG') center/cover no-repeat",
    },
    {
      icon: '🔀',
      title: 'Seed Inspiration Matrices',
      desc: 'Add 2–4 wildly distant domain references — quantum interference patterns, 16th-century manuscripts, bird murmurations, indigenous weaving. Gemma 4\'s 128-expert MoE router collides them with your problem in real time, generating hybrid concepts that have never existed.',
      bg: "url('public/images/inspiration_matrices.PNG') center/cover no-repeat",

    },
    {
      icon: '🌸',
      title: 'Watch the Garden Bloom',
      desc: 'As Gemma 4\'s MoE routing activates specialist experts — spatial-visual, biological-pattern, systems-narrative, ethical-coherence — an interactive vine network blooms in real time. Every flower node is a concept. Every vine is a live reasoning trace. Harvest breakthroughs that couldn\'t exist anywhere else.',
      prompt: 'Harvesting: regenerative city infrastructure protocol',
      color: ACCENT_PINK,
      bg: 'linear-gradient(135deg, #2d0d1f 0%, #220a16 100%)',
      accent: 'rgba(255,255,255,0.1)',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: '0 16px' }}>
      {HERO_FEATURE_ROWS.map((row, i) => {
        const isEven = i % 2 === 0;
        return (
          <Reveal key={row.title} delay={i * 120}>
            <div style={{ display: 'flex', flexDirection: isEven ? 'row' : 'row-reverse', gap: 40, alignItems: 'center', background: 'rgba(255,255,255,0.025)', border: `1px solid ${row.color}22`, borderRadius: 24, overflow: 'hidden', padding: '0', minHeight: 220 }}>
              <div style={{ flex: 1, padding: '40px 44px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 28 }}>{row.icon}</span>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>{row.title}</h3>
                </div>
                <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, fontFamily: 'Inter, system-ui, sans-serif', margin: '0 0 20px' }}>{row.desc}</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${row.color}12`, border: `1px solid ${row.color}30`, borderRadius: 8, padding: '6px 14px' }}>
                  {/*<span style={{ color: row.color, fontSize: 11, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>EXAMPLE</span>*/}
                </div>
              </div>
              <div style={{ width: 420, flexShrink: 0, background: row.bg, padding: '36px 32px', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: row.accent, borderRadius: 0 }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${row.color}, transparent)`, borderRadius: 2, marginBottom: 24 }} />
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.45, margin: 0, letterSpacing: '-0.01em' }}>
                    {row.prompt}
                    <span style={{ display: 'inline-block', width: 2, height: '1.1em', background: row.color, marginLeft: 3, verticalAlign: 'middle' }} />
                  </p>
                  <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${row.color})`, borderRadius: 2, marginTop: 24 }} />
                </div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

// ── FEATURES — "Why Gemma 4 MoE" section ──
function FeaturesSection() {
  // Task 2: Add image paths for each MoE card
  const MOE_CARDS = [
    {
      icon: '⬡',
      label: '#MoE',
      title: 'Sparse Activation',
      subtitle: 'Clean bisociation',
      desc: 'Dense models average distant domains into mush. Gemma 4\'s 128 experts activate only 8+1 per token — keeping biological, quantum, and philosophical specialists isolated and non-interfering. True conceptual collision, not blending.',
      color: ACCENT_CYAN,
      bg: 'linear-gradient(135deg, rgba(34,211,238,0.14), rgba(99,102,241,0.08))',
      image: '/images/abc1.png',
    },
    {
      icon: '🧠',
      label: '#Reasoning',
      title: 'Visible Thinking',
      subtitle: 'MoE as Observatory',
      desc: 'Native `reasoning_details` tokens expose the model\'s own expert activation trace. Bloom maps these to conceptual clusters — spatial-visual, systems-narrative, ethical-coherence — and renders them as a live blooming vine graph. You watch Gemma 4 think.',
      color: ACCENT_PURPLE,
      bg: 'linear-gradient(135deg, rgba(168,85,247,0.14), rgba(236,72,153,0.08))',
      image: '/images/abc2.png',
    },
    {
      icon: '🌡',
      label: '#Router',
      title: 'Temperature as Creative Dial',
      subtitle: 'Steerable softmax',
      desc: 'Focused Mode (temp 0.3): deterministic top-8 experts for rigorous grounding. Divergent Mode (temp 0.85–1.0): softmax broadens to fringe experts — logic blends with poetry, math with biology. This is router steering as art.',
      color: ACCENT_PINK,
      bg: 'linear-gradient(135deg, rgba(236,72,153,0.14), rgba(168,85,247,0.08))',
      image: '/images/abc3.png',
    },
  ];

  return (
    <section id="features" style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Task 1.1: Animated grid background */}
      <SectionGridBackground />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ display: 'inline-block', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 999, padding: '6px 18px', marginBottom: 22, color: ACCENT_PURPLE, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}>Why Gemma 4 26B MoE</div>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', margin: '0 0 16px' }}>The only model that could unlock this</h2>
            <p style={{ color: '#94a3b8', fontSize: 18, maxWidth: 560, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.6 }}>Every concept flower, every vine connection, every breakthrough harvest — imagined by Gemma 4's 128-expert router colliding distant realities in real time.</p>
          </div>
        </Reveal>

        {/* Task 2: MoE cards now with images adjacent to text */}
        <div id="whygemma" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 80 }}>
          {MOE_CARDS.map((card, i) => (
            <Reveal key={card.title} delay={i * 100}>
              <MoECard card={card} />
            </Reveal>
          ))}
        </div>

        <HowPeopleUseBloom />
      </div>
    </section>
  );
}

// Task 2: MoECard updated with image adjacent to text
function MoECard({ card }: { card: { icon: string; label: string; title: string; subtitle: string; desc: string; color: string; bg: string; image: string } }) {
  const [hovered, setHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(true);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? card.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${hovered ? card.color + '50' : 'rgba(255,255,255,0.07)'}`, borderRadius: 22, padding: '32px 28px 36px', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)', transform: hovered ? 'translateY(-8px)' : 'translateY(0)', boxShadow: hovered ? `0 24px 60px rgba(0,0,0,0.4), 0 0 30px ${card.color}18` : '0 4px 20px rgba(0,0,0,0.2)', cursor: 'default', position: 'relative', overflow: 'hidden' }}>
      {/* Top badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${card.color}15`, border: `1px solid ${card.color}30`, borderRadius: 8, padding: '3px 10px', marginBottom: 20 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: card.color, letterSpacing: '0.05em' }}>{card.label}</span>
      </div>
      {/* Icon + title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: `${card.color}18`, border: `1.5px solid ${card.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, boxShadow: hovered ? `0 0 20px ${card.color}35` : 'none', transition: 'box-shadow 0.3s' }}>{card.icon}</div>
        <div>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em', margin: '0 0 4px' }}>{card.title}</h3>
          <p style={{ fontSize: 12, fontWeight: 600, color: card.color, fontFamily: 'Inter, system-ui, sans-serif', margin: 0, letterSpacing: '0.03em' }}>{card.subtitle}</p>
        </div>
      </div>

      {/* Task 2: Image + Text side-by-side layout */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginTop: 8 }}>
        {imgLoaded && (
          <div style={{ flexShrink: 0, width: 100, height: 100, borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${card.color}35`, background: `${card.color}10`, boxShadow: hovered ? `0 0 20px ${card.color}28` : 'none', transition: 'box-shadow 0.3s' }}>
            <img src={card.image} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setImgLoaded(false)} />
          </div>
        )}
        <p style={{ flex: 1, fontSize: 14.5, color: '#94a3b8', lineHeight: 1.68, fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>{card.desc}</p>
      </div>

      <div style={{ position: 'absolute', bottom: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `${card.color}10`, filter: 'blur(20px)', pointerEvents: 'none' }} />
    </div>
  );
}

function HowPeopleUseBloom() {
  const USE_CASES = [
    {
      icon: '🔬',
      title: 'Scientific Discovery',
      desc: 'Upload research images and inspiration from biology, physics, or art. Let Gemma 4\'s MoE router synthesize hypotheses that cross disciplinary walls — generating experiment designs and pseudo-code as concrete artifacts.',
      cta: 'Discover across disciplines.',
      color: ACCENT_CYAN,
    },
    {
      icon: '🏙',
      title: 'Climate & Urban Systems',
      desc: 'Plant satellite video of degraded ecosystems alongside footage of thriving natural systems. Bloom\'s bisociation engine generates regenerative urban protocols, policy interventions, and second-order effect simulations.',
      cta: 'Design regenerative futures.',
      color: ACCENT_TEAL,
    },
    {
      icon: '🎨',
      title: 'Creative & Artistic Work',
      desc: 'Cross-pollinate abstract expressionist paintings with engineering schematics, indigenous weaving with product design. Harvest artistic works, material lists, and production pipelines that exist nowhere else yet.',
      cta: 'Create the never-before-seen.',
      color: ACCENT_PINK,
    },
  ];

  return (
    <div id="howitworks">
      <Reveal>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center', margin: '0 0 16px' }}>How people grow with Bloom</h2>
        <p style={{ color: '#94a3b8', fontSize: 17, textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif', marginBottom: 56 }}>Every session is a high-value, long-context, multimodal, reasoning-enabled breakthrough.</p>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40 }}>
        {USE_CASES.map((uc, i) => (
          <Reveal key={uc.title} delay={i * 100}>
            <div style={{ padding: '8px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${uc.color}18`, border: `1.5px solid ${uc.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 20 }}>{uc.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em', marginBottom: 12 }}>{uc.title}</h3>
              <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, fontFamily: 'Inter, system-ui, sans-serif', marginBottom: 18 }}>{uc.desc}</p>
              <p style={{ fontSize: 14, fontStyle: 'italic', color: uc.color, fontFamily: 'Inter, system-ui, sans-serif', margin: 0, fontWeight: 600 }}>{uc.cta}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ── STATS ──
function StatsSection() {
  return (
    <section id="stats" style={{ padding: '100px 24px', position: 'relative', background: 'rgba(99,102,241,0.03)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      {/* Task 1.1: Animated grid background */}
      <SectionGridBackground />
      <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', margin: '0 0 12px' }}>The architecture behind the breakthroughs</h2>
            <p style={{ color: '#94a3b8', fontSize: 17, fontFamily: 'Inter, system-ui, sans-serif' }}>Gemma 4 26B A4B — built for exactly this.</p>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 100}>
              <div style={{ textAlign: 'center', padding: '40px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-0.04em', fontFamily: 'Inter, system-ui, sans-serif', color: s.color, textShadow: `0 0 30px ${s.color}50`, lineHeight: 1, marginBottom: 12 }}>
                  <AnimatedCounter target={s.value} />
                </div>
                <p style={{ color: '#94a3b8', fontSize: 15, fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── TESTIMONIALS ──
function TestimonialsSection() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <section id="testimonials" style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Task 1.1: Animated grid background */}
      <SectionGridBackground />
      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-block', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 999, padding: '6px 18px', marginBottom: 22, color: ACCENT_CYAN, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}>Breakthroughs</div>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-0.03em', color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>What gardeners are harvesting</h2>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} onClick={() => setActive(i)}
                style={{ padding: '32px', background: active === i ? `linear-gradient(135deg, ${t.color}14, ${t.color}06)` : 'rgba(255,255,255,0.02)', border: `1px solid ${active === i ? t.color + '35' : 'rgba(255,255,255,0.06)'}`, borderRadius: 20, transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', cursor: 'pointer', transform: active === i ? 'translateY(-4px)' : 'translateY(0)', boxShadow: active === i ? `0 20px 50px rgba(0,0,0,0.3), 0 0 30px ${t.color}10` : 'none', backdropFilter: 'blur(8px)' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>{[...Array(5)].map((_, si) => <span key={si} style={{ color: '#fbbf24', fontSize: 15 }}>★</span>)}</div>
                <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, fontFamily: 'Inter, system-ui, sans-serif', fontStyle: 'italic', marginBottom: 24 }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${t.color}, ${t.color}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif' }}>{t.name}</div>
                    <div style={{ color: '#475569', fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 36 }}>
          {TESTIMONIALS.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} style={{ width: active === i ? 24 : 8, height: 8, borderRadius: 999, border: 'none', background: active === i ? ACCENT_CYAN : 'rgba(255,255,255,0.15)', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── PRICING — "Discover Bloom's Full Potential" ──
function PricingSection({ onEnter }: { onEnter: () => void }) {
  const PLATFORM_FEATURES = [
    { icon: '🌿', label: 'Multimodal Problem Seeding', checked: true },
    { icon: '🔀', label: 'Cross-domain Inspiration Matrices', checked: true },
    { icon: '⬡', label: '128-Expert MoE Router Visualization', checked: true },
    { icon: '🧠', label: 'Live Reasoning Stream (thinking tokens)', checked: true },
    { icon: '🌡', label: 'Steerable Temperature (Focused ↔ Divergent)', checked: true },
    { icon: '🎯', label: 'Harvest Panel: Inventions, Protocols, Artifacts', checked: true },
    { icon: '256K', label: '256K Context Garden Memory', checked: true },
    { icon: '📊', label: 'Expert Journey Vine Graph', checked: true },
    { icon: '🔁', label: 'Replant & Evolve Insights', checked: true },
    { icon: '🌐', label: 'Community Gardens (coming soon)', checked: false },
    { icon: '📤', label: 'Export Reasoning Traces', checked: true },
    { icon: '🎨', label: 'Compact + Full Canvas Modes', checked: true },
  ];

  const [hovered, setHovered] = useState(false);

  return (
    <section id="pricing" style={{ padding: '120px 24px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
      {/* Task 1.1: Animated grid background */}
      <SectionGridBackground />
      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Reveal>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '52px 56px', boxShadow: '0 0 80px rgba(99,102,241,0.1)', backdropFilter: 'blur(12px)' }}>
            <div style={{ marginBottom: 36 }}>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.03em', margin: '0 0 10px' }}>Discover Bloom's Full Potential</h2>
              <p style={{ color: '#94a3b8', fontSize: 16, fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>Open access — every feature, no limits, no paywalls. Powered entirely by Gemma 4 26B A4B.</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 32px', marginBottom: 36 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif', marginBottom: 24 }}>Platform Capabilities</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 40px' }}>
                {PLATFORM_FEATURES.map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: feat.checked ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.06)', border: `1.5px solid ${feat.checked ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {feat.checked
                        ? <span style={{ color: ACCENT_INDIGO, fontSize: 13, fontWeight: 900 }}>✓</span>
                        : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>○</span>
                      }
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: feat.checked ? '#e2e8f0' : '#475569', fontFamily: 'Inter, system-ui, sans-serif' }}>{feat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>No account needed. Start growing immediately.</p>
              </div>
              <button onClick={onEnter} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
                style={{ padding: '14px 36px', borderRadius: 13, border: 'none', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', fontSize: 16, fontWeight: 800, fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer', boxShadow: hovered ? '0 0 40px rgba(99,102,241,0.65)' : '0 0 25px rgba(99,102,241,0.35)', transform: hovered ? 'translateY(-2px) scale(1.03)' : 'scale(1)', transition: 'all 0.3s ease', letterSpacing: '-0.01em' }}>
                Enter the Lab →
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── CTA BANNER ──
function CTASection({ onEnter }: { onEnter: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <section style={{ padding: '120px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Task 1.1: Animated grid background */}
      <SectionGridBackground />
      <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Reveal>
          <div style={{ position: 'relative', overflow: 'hidden', padding: '80px 48px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.10), rgba(34,211,238,0.08))', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 28, textAlign: 'center', boxShadow: '0 0 80px rgba(99,102,241,0.12)', backdropFilter: 'blur(12px)' }}>
            <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: '40%', height: '200%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-30%', right: '-10%', width: '40%', height: '200%', background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-0.04em', color: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif', margin: '0 0 16px' }}>Ready to bloom?</h2>
              <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 480, margin: '0 auto 40px', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.6 }}>Plant your first multimodal reality. Watch Gemma 4's 128 experts collide it with something impossible. Harvest what's never existed.</p>
              <button onClick={onEnter} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
                style={{ padding: '16px 44px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', fontSize: 17, fontWeight: 800, fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer', boxShadow: hovered ? '0 0 50px rgba(99,102,241,0.7)' : '0 0 30px rgba(99,102,241,0.4)', transform: hovered ? 'translateY(-3px) scale(1.04)' : 'translateY(0) scale(1)', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
                Enter the Lab — it's free →
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── FOOTER — Task 3: removed all columns, replaced with big "made with love" text ──
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '80px 24px 60px', background: 'rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
      {/* Task 1.1: Animated grid background */}
      <SectionGridBackground />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40 }}>
          <img src="/images/logo.png" alt="Bloom" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(90deg, #e2e8f0, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Bloom</span>
        </div>

        {/* */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{
            fontSize: 'clamp(28px, 4.5vw, 52px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            fontFamily: 'Inter, system-ui, sans-serif',
            margin: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 14,
          }}>
            <span style={{ color: '#e2e8f0' }}>made with</span>
            <span style={{ fontSize: 'clamp(32px, 5vw, 60px)', display: 'inline-block', animation: 'heartBeat 1.6s ease-in-out infinite', filter: 'drop-shadow(0 0 12px rgba(236,72,153,0.55))' }}>❤️</span>
            <span style={{ color: '#e2e8f0' }}>by</span>
            <span style={{
              background: 'linear-gradient(120deg, #f59e0b 0%, #f97316 25%, #ec4899 55%, #a855f7 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'bloomTextFlow 8s ease-in-out infinite',
            }}>Mrinal Parida</span>
          </p>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: '#475569', fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>© 2026 Bloom. Powered by Gemma 4 26B A4B MoE.</p>
          <p style={{ color: '#475569', fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>Built for the impossible.</p>
        </div>
      </div>
    </footer>
  );
}

// ── GLOBAL CSS ──
const GLOBAL_CSS = `
  @keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes bloomTextFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  @keyframes gradientDrift { 0% { background-position: 0% 50%; transform: translate3d(0,0,0) scale(1); } 25% { background-position: 45% 35%; transform: translate3d(2%,-1%,0) scale(1.06); } 50% { background-position: 100% 65%; transform: translate3d(-2%,2%,0) scale(0.96); } 75% { background-position: 40% 45%; transform: translate3d(1%,-2%,0) scale(1.03); } 100% { background-position: 0% 50%; transform: translate3d(0,0,0) scale(1); } }
  @keyframes gridShift { 0% { background-position: 0 0, 0 0; } 100% { background-position: 72px 72px, 72px 72px; } }
  @keyframes flowerFloat { 0%,100% { transform: translate3d(0,0,0) rotate(0deg); } 25% { transform: translate3d(2px,-7px,0) rotate(1.5deg); } 50% { transform: translate3d(-3px,-12px,0) rotate(-2deg); } 75% { transform: translate3d(3px,-5px,0) rotate(1deg); } }
  @keyframes flowerPulse { 0%,100% { transform: scale(0.92) rotate(-1deg); } 50% { transform: scale(1.06) rotate(2deg); } }
  @keyframes sparkleFloat { 0%,100% { transform: translate3d(0,0,0) scale(1) rotate(0deg); } 50% { transform: translate3d(0,-8px,0) scale(1.14) rotate(8deg); } }
  @keyframes sparkleTwinkle { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
  @keyframes orbFloat1 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(3%,4%) scale(1.05); } 66% { transform: translate(-2%,2%) scale(0.97); } }
  @keyframes orbFloat2 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(-3%,-3%) scale(1.04); } 66% { transform: translate(2%,-1%) scale(0.98); } }
  @keyframes orbFloat3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-4%,3%); } }
  @keyframes pulse { 0%,100% { opacity:1; box-shadow: 0 0 8px #22d3ee; } 50% { opacity:0.6; box-shadow: 0 0 18px #22d3ee; } }
  @keyframes heartBeat { 0%,100% { transform: scale(1); } 25% { transform: scale(1.18); } 50% { transform: scale(1); } 75% { transform: scale(1.12); } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #080b16; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #080b16; }
  ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 3px; }
`;

export default function LandingPage({ onEnter }: Props) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = 'bloom-landing-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = GLOBAL_CSS;
      document.head.appendChild(style);
    }
  }, []);

  const handleEnter = useCallback(() => {
    setEntered(true);
    setTimeout(onEnter, 500);
  }, [onEnter]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflowY: entered ? 'hidden' : 'auto', overflowX: 'hidden', background: '#080b16', opacity: entered ? 0 : 1, transition: 'opacity 0.5s ease', pointerEvents: entered ? 'none' : 'auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <NavBar onEnter={handleEnter} />
      <HeroSection onEnter={handleEnter} />
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <PricingSection onEnter={handleEnter} />
      <CTASection onEnter={handleEnter} />
      <Footer />
    </div>
  );
}
