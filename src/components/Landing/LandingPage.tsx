import { useEffect, useRef, useState, useCallback, type CSSProperties, type ReactNode } from 'react';

interface Props {
  onEnter: () => void;
}

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  opacity: number;
}

type FlowerKind = 'daisy' | 'rose' | 'lotus' | 'tulip' | 'blossom';

interface BloomFlower {
  x: string;
  y: string;
  size: number;
  color: string;
  delay: string;
  duration: string;
  kind: FlowerKind;
  petals?: number;
  tilt?: number;
  scale?: number;
  opacity?: number;
}

type SparkleKind = 'star' | 'spark' | 'dot' | 'cross';

interface Sparkle {
  x: string;
  y: string;
  size: number;
  color: string;
  delay: string;
  duration: string;
  kind: SparkleKind;
  opacity: number;
  rotate: number;
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
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
  { x: '10%', y: '32%', size: 88, color: ACCENT_PINK,    delay: '-3s',   duration: '16s',   kind: 'rose',    tilt: 14,  scale: 1.00, opacity: 0.62 },
  { x: '16%', y: '77%', size: 54, color: ACCENT_CYAN,    delay: '-5s',   duration: '13s',   kind: 'blossom', tilt: -12, scale: 0.96, opacity: 0.48 },
  { x: '24%', y: '10%', size: 46, color: ACCENT_YELLOW,  delay: '-2s',   duration: '12s',   kind: 'tulip',   tilt: 22,  scale: 0.92, opacity: 0.42 },
  { x: '31%', y: '87%', size: 72, color: ACCENT_TEAL,    delay: '-4s',   duration: '15s',   kind: 'lotus',   tilt: -8,  scale: 0.98, opacity: 0.52 },
  { x: '40%', y: '21%', size: 42, color: ACCENT_INDIGO,  delay: '-6s',   duration: '11s',   kind: 'blossom', tilt: 10,  scale: 0.86, opacity: 0.34 },
  { x: '48%', y: '8%',  size: 60, color: ACCENT_PINK,    delay: '-2.8s', duration: '14.5s', kind: 'rose',    tilt: -18, scale: 0.95, opacity: 0.45 },
  { x: '55%', y: '17%', size: 34, color: ACCENT_YELLOW,  delay: '-1.2s', duration: '10s',   kind: 'daisy',   tilt: 7,   scale: 0.78, opacity: 0.24 },
  { x: '63%', y: '11%', size: 50, color: ACCENT_CYAN,    delay: '-3.5s', duration: '12.5s', kind: 'lotus',   tilt: 18,  scale: 0.84, opacity: 0.38 },
  { x: '70%', y: '27%', size: 90, color: ACCENT_ORANGE,  delay: '-4.2s', duration: '17s',   kind: 'tulip',   tilt: 6,   scale: 1.02, opacity: 0.60 },
  { x: '78%', y: '13%', size: 52, color: ACCENT_PURPLE,  delay: '-1.8s', duration: '11.8s', kind: 'daisy',   tilt: -14, scale: 0.88, opacity: 0.40 },
  { x: '86%', y: '39%', size: 68, color: ACCENT_PINK,    delay: '-5s',   duration: '13.8s', kind: 'blossom', tilt: 13,  scale: 0.96, opacity: 0.48 },
  { x: '93%', y: '22%', size: 80, color: ACCENT_TEAL,    delay: '-2.5s', duration: '16s',   kind: 'rose',    tilt: -8,  scale: 1.00, opacity: 0.56 },
  { x: '95%', y: '62%', size: 50, color: ACCENT_YELLOW,  delay: '-3.4s', duration: '12s',   kind: 'tulip',   tilt: 9,   scale: 0.80, opacity: 0.36 },
  { x: '88%', y: '85%', size: 72, color: ACCENT_CYAN,    delay: '-4.7s', duration: '15s',   kind: 'lotus',   tilt: -16, scale: 0.94, opacity: 0.42 },
  { x: '75%', y: '92%', size: 60, color: ACCENT_GREEN,   delay: '-6s',   duration: '13s',   kind: 'blossom', tilt: 18,  scale: 0.90, opacity: 0.50 },
  { x: '60%', y: '84%', size: 58, color: ACCENT_INDIGO,  delay: '-3.1s', duration: '14s',   kind: 'daisy',   tilt: -10, scale: 0.90, opacity: 0.40 },
  { x: '44%', y: '91%', size: 58, color: ACCENT_ORANGE,  delay: '-2.7s', duration: '13.4s', kind: 'rose',    tilt: 12,  scale: 0.88, opacity: 0.42 },

  // extra flowers
  { x: '7%',  y: '65%', size: 52, color: ACCENT_YELLOW,  delay: '-1.6s', duration: '11.8s', kind: 'blossom', tilt: 12,  scale: 0.86, opacity: 0.36 },
  { x: '18%', y: '47%', size: 66, color: ACCENT_GREEN,   delay: '-4.1s', duration: '14.6s', kind: 'lotus',   tilt: -14, scale: 0.92, opacity: 0.44 },
  { x: '28%', y: '23%', size: 54, color: ACCENT_ORANGE,  delay: '-2.2s', duration: '12.2s', kind: 'rose',    tilt: 20,  scale: 0.84, opacity: 0.35 },
  { x: '52%', y: '73%', size: 84, color: ACCENT_CYAN,    delay: '-3.7s', duration: '16.8s', kind: 'daisy',   tilt: -6,  scale: 0.98, opacity: 0.56 },
  { x: '67%', y: '66%', size: 46, color: ACCENT_PINK,    delay: '-5.2s', duration: '12.8s', kind: 'tulip',   tilt: 10,  scale: 0.82, opacity: 0.34 },
  { x: '82%', y: '58%', size: 64, color: ACCENT_INDIGO,  delay: '-2.9s', duration: '14.2s', kind: 'blossom', tilt: -12, scale: 0.90, opacity: 0.42 },
  { x: '90%', y: '76%', size: 56, color: ACCENT_PURPLE,  delay: '-1.4s', duration: '11.4s', kind: 'daisy',   tilt: 16,  scale: 0.84, opacity: 0.38 },
  { x: '11%', y: '88%', size: 44, color: ACCENT_ORANGE,  delay: '-3.3s', duration: '10.8s', kind: 'tulip',   tilt: -18, scale: 0.78, opacity: 0.28 },
];

const SPARKLES: Sparkle[] = [
  { x: '5%',  y: '14%', size: 18, color: ACCENT_CYAN,    delay: '-1.2s', duration: '4.8s', kind: 'star',  opacity: 0.72, rotate: -10 },
  { x: '8%',  y: '22%', size: 11, color: ACCENT_PURPLE,  delay: '-2.4s', duration: '5.2s', kind: 'spark', opacity: 0.60, rotate: 18 },
  { x: '13%', y: '19%', size: 10, color: ACCENT_ORANGE,  delay: '-0.8s', duration: '4.5s', kind: 'dot',   opacity: 0.85, rotate: 0 },
  { x: '16%', y: '35%', size: 16, color: ACCENT_PINK,    delay: '-3.0s', duration: '5.9s', kind: 'cross', opacity: 0.68, rotate: 40 },
  { x: '20%', y: '12%', size: 12, color: ACCENT_YELLOW,  delay: '-1.8s', duration: '4.2s', kind: 'spark', opacity: 0.78, rotate: -22 },
  { x: '24%', y: '27%', size: 9,  color: ACCENT_CYAN,    delay: '-2.7s', duration: '5.3s', kind: 'dot',   opacity: 0.72, rotate: 0 },
  { x: '28%', y: '18%', size: 14, color: ACCENT_TEAL,    delay: '-1.1s', duration: '4.7s', kind: 'star',  opacity: 0.70, rotate: 12 },
  { x: '31%', y: '39%', size: 11, color: ACCENT_ORANGE,  delay: '-2.9s', duration: '5.1s', kind: 'spark', opacity: 0.66, rotate: -12 },
  { x: '36%', y: '15%', size: 8,  color: ACCENT_PINK,    delay: '-0.6s', duration: '4.0s', kind: 'dot',   opacity: 0.88, rotate: 0 },
  { x: '40%', y: '29%', size: 18, color: ACCENT_CYAN,    delay: '-3.8s', duration: '6.1s', kind: 'cross', opacity: 0.58, rotate: 26 },
  { x: '45%', y: '11%', size: 13, color: ACCENT_YELLOW,  delay: '-1.4s', duration: '4.4s', kind: 'star',  opacity: 0.77, rotate: -8 },
  { x: '49%', y: '24%', size: 10, color: ACCENT_PURPLE,  delay: '-2.2s', duration: '5.0s', kind: 'spark', opacity: 0.74, rotate: 14 },
  { x: '54%', y: '17%', size: 8,  color: ACCENT_ORANGE,  delay: '-1.0s', duration: '4.1s', kind: 'dot',   opacity: 0.84, rotate: 0 },
  { x: '58%', y: '31%', size: 15, color: ACCENT_PINK,    delay: '-2.8s', duration: '5.8s', kind: 'star',  opacity: 0.66, rotate: -18 },
  { x: '62%', y: '13%', size: 12, color: ACCENT_CYAN,    delay: '-1.9s', duration: '4.6s', kind: 'spark', opacity: 0.78, rotate: 22 },
  { x: '66%', y: '26%', size: 9,  color: ACCENT_GREEN,   delay: '-0.7s', duration: '4.3s', kind: 'dot',   opacity: 0.82, rotate: 0 },
  { x: '70%', y: '16%', size: 17, color: ACCENT_ORANGE,  delay: '-3.3s', duration: '5.7s', kind: 'cross', opacity: 0.60, rotate: 34 },
  { x: '74%', y: '34%', size: 11, color: ACCENT_PURPLE,  delay: '-2.0s', duration: '5.2s', kind: 'star',  opacity: 0.72, rotate: -14 },
  { x: '78%', y: '18%', size: 8,  color: ACCENT_YELLOW,  delay: '-1.3s', duration: '4.0s', kind: 'dot',   opacity: 0.90, rotate: 0 },
  { x: '82%', y: '29%', size: 14, color: ACCENT_TEAL,    delay: '-2.6s', duration: '5.5s', kind: 'spark', opacity: 0.69, rotate: 10 },
  { x: '86%', y: '16%', size: 16, color: ACCENT_PINK,    delay: '-1.8s', duration: '4.9s', kind: 'cross', opacity: 0.64, rotate: -26 },
  { x: '91%', y: '23%', size: 12, color: ACCENT_CYAN,    delay: '-2.4s', duration: '5.1s', kind: 'star',  opacity: 0.75, rotate: 16 },
  { x: '95%', y: '44%', size: 9,  color: ACCENT_ORANGE,  delay: '-0.9s', duration: '4.2s', kind: 'dot',   opacity: 0.84, rotate: 0 },

  { x: '7%',  y: '52%', size: 16, color: ACCENT_ORANGE,  delay: '-2.1s', duration: '5.4s', kind: 'star',  opacity: 0.68, rotate: 20 },
  { x: '14%', y: '61%', size: 10, color: ACCENT_CYAN,    delay: '-1.1s', duration: '4.5s', kind: 'dot',   opacity: 0.88, rotate: 0 },
  { x: '22%', y: '48%', size: 13, color: ACCENT_PURPLE,  delay: '-3.1s', duration: '5.6s', kind: 'spark', opacity: 0.70, rotate: -12 },
  { x: '30%', y: '58%', size: 8,  color: ACCENT_YELLOW,  delay: '-0.7s', duration: '4.0s', kind: 'dot',   opacity: 0.80, rotate: 0 },
  { x: '38%', y: '50%', size: 15, color: ACCENT_GREEN,   delay: '-2.9s', duration: '5.8s', kind: 'cross', opacity: 0.62, rotate: 36 },
  { x: '46%', y: '63%', size: 11, color: ACCENT_PINK,    delay: '-1.5s', duration: '4.7s', kind: 'star',  opacity: 0.76, rotate: -18 },
  { x: '54%', y: '57%', size: 9,  color: ACCENT_CYAN,    delay: '-2.0s', duration: '4.3s', kind: 'dot',   opacity: 0.86, rotate: 0 },
  { x: '62%', y: '50%', size: 16, color: ACCENT_TEAL,    delay: '-3.6s', duration: '6.0s', kind: 'spark', opacity: 0.68, rotate: 14 },
  { x: '70%', y: '60%', size: 12, color: ACCENT_ORANGE,  delay: '-1.3s', duration: '4.6s', kind: 'cross', opacity: 0.70, rotate: -30 },
  { x: '78%', y: '53%', size: 10, color: ACCENT_PURPLE,  delay: '-2.2s', duration: '5.0s', kind: 'dot',   opacity: 0.82, rotate: 0 },
  { x: '86%', y: '62%', size: 15, color: ACCENT_YELLOW,  delay: '-1.8s', duration: '5.4s', kind: 'star',  opacity: 0.74, rotate: 22 },
  { x: '93%', y: '58%', size: 11, color: ACCENT_CYAN,    delay: '-3.0s', duration: '5.3s', kind: 'spark', opacity: 0.66, rotate: -10 },

  { x: '10%', y: '81%', size: 12, color: ACCENT_PINK,    delay: '-1.7s', duration: '4.5s', kind: 'spark', opacity: 0.74, rotate: 12 },
  { x: '18%', y: '72%', size: 9,  color: ACCENT_YELLOW,  delay: '-0.9s', duration: '4.0s', kind: 'dot',   opacity: 0.86, rotate: 0 },
  { x: '26%', y: '83%', size: 17, color: ACCENT_INDIGO,  delay: '-2.8s', duration: '5.6s', kind: 'cross', opacity: 0.62, rotate: 24 },
  { x: '34%', y: '76%', size: 14, color: ACCENT_TEAL,    delay: '-1.4s', duration: '5.1s', kind: 'star',  opacity: 0.70, rotate: -8 },
  { x: '42%', y: '86%', size: 8,  color: ACCENT_ORANGE,  delay: '-0.8s', duration: '4.1s', kind: 'dot',   opacity: 0.84, rotate: 0 },
  { x: '50%', y: '78%', size: 15, color: ACCENT_PURPLE,  delay: '-3.4s', duration: '5.9s', kind: 'spark', opacity: 0.66, rotate: 18 },
  { x: '58%', y: '88%', size: 11, color: ACCENT_CYAN,    delay: '-1.2s', duration: '4.7s', kind: 'cross', opacity: 0.72, rotate: -22 },
  { x: '66%', y: '79%', size: 9,  color: ACCENT_GREEN,   delay: '-2.1s', duration: '4.3s', kind: 'dot',   opacity: 0.88, rotate: 0 },
  { x: '74%', y: '87%', size: 16, color: ACCENT_PINK,    delay: '-2.7s', duration: '5.5s', kind: 'star',  opacity: 0.70, rotate: 28 },
  { x: '82%', y: '80%', size: 12, color: ACCENT_YELLOW,  delay: '-1.5s', duration: '4.6s', kind: 'spark', opacity: 0.76, rotate: -14 },
  { x: '90%', y: '89%', size: 10, color: ACCENT_ORANGE,  delay: '-0.7s', duration: '4.0s', kind: 'dot',   opacity: 0.82, rotate: 0 },
  { x: '96%', y: '79%', size: 14, color: ACCENT_CYAN,    delay: '-3.1s', duration: '5.2s', kind: 'cross', opacity: 0.64, rotate: 14 },
];

const FEATURES = [
  {
    icon: '✦',
    title: 'AI-Powered Insights',
    desc: 'Harness machine learning to surface patterns, predict outcomes, and deliver actionable recommendations in real time.',
    color: ACCENT_CYAN,
    grad: 'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(99,102,241,0.06))',
    border: 'rgba(34,211,238,0.25)',
  },
  {
    icon: '◈',
    title: 'Visual Analytics',
    desc: 'Beautiful, interactive charts that transform raw data into compelling stories your entire team can understand.',
    color: ACCENT_PURPLE,
    grad: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(236,72,153,0.06))',
    border: 'rgba(168,85,247,0.25)',
  },
  {
    icon: '⬡',
    title: 'Real-Time Collaboration',
    desc: 'Work alongside your team simultaneously with live cursors, instant sync, and conflict-free editing.',
    color: ACCENT_PINK,
    grad: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(168,85,247,0.06))',
    border: 'rgba(236,72,153,0.25)',
  },
  {
    icon: '◉',
    title: 'Smart Automation',
    desc: 'Build powerful workflows that eliminate repetitive tasks and free your team to focus on what matters most.',
    color: ACCENT_TEAL,
    grad: 'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(34,211,238,0.06))',
    border: 'rgba(20,184,166,0.25)',
  },
  {
    icon: '⟡',
    title: 'Enterprise Security',
    desc: 'Bank-grade encryption, SSO, audit logs, and compliance tools built directly into every layer of the platform.',
    color: ACCENT_INDIGO,
    grad: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.06))',
    border: 'rgba(99,102,241,0.25)',
  },
  {
    icon: '✿',
    title: 'Seamless Integrations',
    desc: 'Connect with 200+ tools in one click. Slack, Notion, GitHub, Salesforce and more — all in your workflow.',
    color: ACCENT_GREEN,
    grad: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(20,184,166,0.06))',
    border: 'rgba(16,185,129,0.25)',
  },
];

const STATS = [
  { value: '98%',   label: 'Customer satisfaction',  color: ACCENT_CYAN },
  { value: '3.2×',  label: 'Avg. productivity gain', color: ACCENT_PURPLE },
  { value: '200+',  label: 'Integrations available', color: ACCENT_PINK },
  { value: '<50ms', label: 'Global response time',   color: ACCENT_TEAL },
];

const TESTIMONIALS = [
  {
    quote: "Bloom transformed how our entire organisation approaches data. The insights are extraordinary — it's like having an analyst who never sleeps.",
    name: 'Sofia Reyes',
    role: 'Head of Product, Nexus AI',
    avatar: 'SR',
    color: ACCENT_CYAN,
  },
  {
    quote: "We cut our reporting time by 70% in the first month. The automation features alone are worth ten times the price.",
    name: 'Marcus Chen',
    role: 'CTO, Velocity Labs',
    avatar: 'MC',
    color: ACCENT_PURPLE,
  },
  {
    quote: "The collaboration tools are best-in-class. Our distributed team finally feels like we're in the same room.",
    name: 'Aria Patel',
    role: 'VP Engineering, Stratos',
    avatar: 'AP',
    color: ACCENT_PINK,
  },
];

const PRICING = [
  {
    name: 'Starter',
    price: '$29',
    period: '/mo',
    desc: 'Perfect for small teams getting started.',
    features: ['Up to 5 users', '10 projects', 'Core analytics', 'Email support', '5GB storage'],
    color: ACCENT_CYAN,
    grad: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(99,102,241,0.04))',
    border: 'rgba(34,211,238,0.2)',
    cta: 'Start free trial',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$79',
    period: '/mo',
    desc: 'For growing teams who need more power.',
    features: ['Up to 25 users', 'Unlimited projects', 'AI insights', 'Priority support', '100GB storage', 'Custom dashboards'],
    color: ACCENT_PURPLE,
    grad: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.08))',
    border: 'rgba(168,85,247,0.4)',
    cta: 'Start free trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'Tailored solutions for large organisations.',
    features: ['Unlimited users', 'Dedicated infra', 'Advanced security', 'SLA guarantee', 'Unlimited storage', 'Custom integrations'],
    color: ACCENT_TEAL,
    grad: 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(34,211,238,0.04))',
    border: 'rgba(20,184,166,0.2)',
    cta: 'Contact sales',
    popular: false,
  },
];

const NAV_ITEMS = [
  ['Features', 'features'],
  ['Stats', 'stats'],
  ['Testimonials', 'testimonials'],
  ['Pricing', 'pricing'],
] as const;

/* ─────────────────────────────────────────────
   HOOK: useInView (intersection observer)
───────────────────────────────────────────── */
function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

// Full-page blurred fluid gradient background
function FluidBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute',
        inset: '-14%',
        background: 'linear-gradient(120deg, rgba(99,102,241,0.16) 0%, rgba(168,85,247,0.12) 24%, rgba(34,211,238,0.14) 52%, rgba(245,158,11,0.10) 78%, rgba(236,72,153,0.10) 100%)',
        backgroundSize: '240% 240%',
        filter: 'blur(82px)',
        opacity: 0.78,
        animation: 'gradientDrift 26s ease-in-out infinite',
        mixBlendMode: 'screen',
      }} />
      <div style={{
        position: 'absolute',
        top: '-18%',
        left: '-10%',
        width: '56vw',
        height: '56vw',
        background: 'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.26) 0%, rgba(168,85,247,0.14) 35%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(88px)',
        animation: 'orbFloat1 16s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        top: '12%',
        right: '-12%',
        width: '52vw',
        height: '52vw',
        background: 'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.22) 0%, rgba(20,184,166,0.10) 36%, transparent 72%)',
        borderRadius: '50%',
        filter: 'blur(94px)',
        animation: 'orbFloat2 18s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '18%',
        width: '68vw',
        height: '48vw',
        background: 'radial-gradient(circle at 40% 40%, rgba(245,158,11,0.14) 0%, rgba(236,72,153,0.08) 38%, transparent 72%)',
        borderRadius: '50%',
        filter: 'blur(96px)',
        animation: 'orbFloat3 22s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.045) 1px, transparent 1px)
        `,
        backgroundSize: '72px 72px',
        opacity: 0.42,
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 50% 10%, rgba(255,255,255,0.06), transparent 28%)',
      }} />
    </div>
  );
}

// Animated gradient orb background
function OrbBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '55vw',
        height: '55vw',
        background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(168,85,247,0.08) 50%, transparent 70%)',
        borderRadius: '50%',
        animation: 'orbFloat1 12s ease-in-out infinite',
        filter: 'blur(1px)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-8%',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, rgba(20,184,166,0.06) 50%, transparent 70%)',
        borderRadius: '50%',
        animation: 'orbFloat2 15s ease-in-out infinite',
        filter: 'blur(1px)',
      }} />
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '40%',
        width: '30vw',
        height: '30vw',
        background: 'radial-gradient(circle, rgba(236,72,153,0.10) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'orbFloat3 18s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />
    </div>
  );
}

// Redesigned flowers from scratch: mixed types, slightly reduced-ish compared to huge dense layouts, now more lively
function BloomingFlowers() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {FLOWERS.map((flower, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: flower.x,
            top: flower.y,
            width: flower.size,
            height: flower.size,
            transform: `translate(-50%, -50%) scale(${flower.scale ?? 1}) rotate(${flower.tilt ?? 0}deg)`,
            opacity: flower.opacity ?? 0.55,
            filter: `drop-shadow(0 0 18px ${flower.color}35) saturate(1.12)`,
            mixBlendMode: 'screen',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: -flower.size * 0.24,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${flower.color}26 0%, transparent 70%)`,
              filter: 'blur(16px)',
            }}
          />

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

  const petalCount =
    flower.petals ??
    (flower.kind === 'lotus'
      ? 8
      : flower.kind === 'daisy'
        ? 12
        : flower.kind === 'rose'
          ? 6
          : flower.kind === 'tulip'
            ? 3
            : 5);

  const outerAngles = Array.from({ length: petalCount }, (_, idx) => idx * (360 / petalCount));
  const innerAngles = Array.from(
    { length: Math.max(3, Math.floor(petalCount / 2)) },
    (_, idx) => idx * (360 / Math.max(3, Math.floor(petalCount / 2))) + 360 / (petalCount * 2)
  );

  const petalGrad = `url(#${id}-petal)`;
  const petalSoft = `url(#${id}-petal-soft)`;
  const coreGrad = `url(#${id}-core)`;
  const stemGrad = `url(#${id}-stem)`;
  const leafGrad = `url(#${id}-leaf)`;

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${id}-petal`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
          <stop offset="36%" stopColor={flower.color} stopOpacity="0.98" />
          <stop offset="100%" stopColor={flower.color} stopOpacity="0.56" />
        </linearGradient>

        <linearGradient id={`${id}-petal-soft`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.78" />
          <stop offset="48%" stopColor={flower.color} stopOpacity="0.86" />
          <stop offset="100%" stopColor={flower.color} stopOpacity="0.42" />
        </linearGradient>

        <radialGradient id={`${id}-core`}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="38%" stopColor={flower.color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={flower.color} stopOpacity="0.18" />
        </radialGradient>

        <linearGradient id={`${id}-stem`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#86efac" stopOpacity="1" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id={`${id}-leaf`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {flower.kind === 'daisy' && (
        <>
          {outerAngles.map((angle) => (
            <ellipse
              key={`daisy-o-${angle}`}
              cx="50"
              cy="31"
              rx="8"
              ry="19"
              fill={petalGrad}
              transform={`rotate(${angle} 50 50)`}
              opacity="0.96"
            />
          ))}
          {outerAngles.map((angle) => (
            <ellipse
              key={`daisy-i-${angle}`}
              cx="50"
              cy="38"
              rx="5"
              ry="12"
              fill={petalSoft}
              transform={`rotate(${angle + 15} 50 50)`}
              opacity="0.72"
            />
          ))}
          <circle cx="50" cy="50" r="16" fill={coreGrad} />
          <circle cx="50" cy="50" r="6" fill="#fff" opacity="0.88" />
        </>
      )}

      {flower.kind === 'rose' && (
        <>
          {outerAngles.slice(0, 6).map((angle, idx) => (
            <path
              key={`rose-o-${angle}`}
              d="M50 22 C59 24 64 32 63 41 C62 51 56 59 50 64 C44 59 38 51 37 41 C36 32 41 24 50 22 Z"
              fill={petalGrad}
              transform={`rotate(${angle} 50 50) scale(${idx % 2 === 0 ? 1 : 0.94})`}
              opacity={idx < 3 ? 0.97 : 0.82}
            />
          ))}
          <path
            d="M50 28 C56 29 60 35 59 42 C58 49 54 55 50 59 C46 55 42 49 41 42 C40 35 44 29 50 28 Z"
            fill={petalSoft}
            opacity="0.92"
          />
          <path
            d="M50 34 C54 35 56 39 55 43 C54 47 52 51 50 54 C48 51 46 47 45 43 C44 39 46 35 50 34 Z"
            fill={coreGrad}
            opacity="0.92"
          />
          <path d="M50 61 C50 71 50 81 49 92" stroke={stemGrad} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
          <path d="M49 73 C42 72 37 68 32 63 C39 63 44 66 49 71 Z" fill={leafGrad} opacity="0.5" />
          <path d="M50 73 C57 72 62 68 67 63 C60 63 55 66 50 71 Z" fill={leafGrad} opacity="0.48" />
        </>
      )}

      {flower.kind === 'lotus' && (
        <>
          {outerAngles.map((angle) => (
            <path
              key={`lotus-o-${angle}`}
              d="M50 14 C57 26 61 38 50 60 C39 38 43 26 50 14 Z"
              fill={petalGrad}
              transform={`rotate(${angle} 50 50)`}
              opacity="0.92"
            />
          ))}
          {innerAngles.map((angle) => (
            <path
              key={`lotus-i-${angle}`}
              d="M50 24 C55 33 57 41 50 54 C43 41 45 33 50 24 Z"
              fill={petalSoft}
              transform={`rotate(${angle} 50 50)`}
              opacity="0.78"
            />
          ))}
          <circle cx="50" cy="52" r="13" fill={coreGrad} />
          <circle cx="50" cy="52" r="5" fill="#fff" opacity="0.8" />
        </>
      )}

      {flower.kind === 'tulip' && (
        <>
          <path
            d="M50 24 C58 25 65 33 66 44 C67 56 61 68 50 76 C39 68 33 56 34 44 C35 33 42 25 50 24 Z"
            fill={petalGrad}
          />
          <path
            d="M50 27 C55 28 60 35 60 44 C60 53 56 62 50 70 C44 62 40 53 40 44 C40 35 45 28 50 27 Z"
            fill={petalSoft}
            opacity="0.88"
          />
          <path
            d="M50 31 C54 32 57 37 57 44 C57 50 54 57 50 63 C46 57 43 50 43 44 C43 37 46 32 50 31 Z"
            fill={coreGrad}
            opacity="0.82"
          />
          <path d="M50 76 C50 82 50 88 50 95" stroke={stemGrad} strokeWidth="4" strokeLinecap="round" />
          <path d="M50 76 C43 74 37 68 32 60 C40 61 45 65 50 71 Z" fill={leafGrad} opacity="0.9" />
          <path d="M50 76 C57 74 63 68 68 60 C60 61 55 65 50 71 Z" fill={leafGrad} opacity="0.88" />
        </>
      )}

      {flower.kind === 'blossom' && (
        <>
          {Array.from({ length: 5 }, (_, idx) => idx * 72).map((angle) => (
            <path
              key={`blossom-${angle}`}
              d="M50 26 C58 21 67 28 67 38 C67 49 58 57 50 61 C42 57 33 49 33 38 C33 28 42 21 50 26 Z"
              fill={petalGrad}
              transform={`rotate(${angle} 50 50)`}
              opacity="0.92"
            />
          ))}
          {Array.from({ length: 5 }, (_, idx) => idx * 72 + 36).map((angle) => (
            <path
              key={`blossom-soft-${angle}`}
              d="M50 33 C56 29 62 34 62 41 C62 48 56 54 50 57 C44 54 38 48 38 41 C38 34 44 29 50 33 Z"
              fill={petalSoft}
              transform={`rotate(${angle} 50 50)`}
              opacity="0.72"
            />
          ))}
          <circle cx="50" cy="50" r="12" fill={coreGrad} />
          <circle cx="50" cy="50" r="4.5" fill="#fff" opacity="0.85" />
        </>
      )}
    </svg>
  );
}

function SparkleField() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 2 }}>
      {SPARKLES.map((sparkle, i) => {
        const isDot = sparkle.kind === 'dot';
        const symbol = sparkle.kind === 'star'
          ? '✦'
          : sparkle.kind === 'spark'
            ? '✧'
            : sparkle.kind === 'cross'
              ? '✶'
              : '•';

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: sparkle.x,
              top: sparkle.y,
              width: sparkle.size * 2,
              height: sparkle.size * 2,
              transform: `translate(-50%, -50%) rotate(${sparkle.rotate}deg)`,
              opacity: sparkle.opacity,
              mixBlendMode: 'screen',
              filter: 'saturate(1.2)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${sparkle.color}55 0%, ${sparkle.color}22 24%, transparent 72%)`,
                filter: 'blur(4px)',
                animation: `sparkleFloat ${sparkle.duration} ease-in-out ${sparkle.delay} infinite`,
              }}
            />
            {isDot ? (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: Math.max(4, sparkle.size * 0.48),
                  height: Math.max(4, sparkle.size * 0.48),
                  marginLeft: -Math.max(4, sparkle.size * 0.24),
                  marginTop: -Math.max(4, sparkle.size * 0.24),
                  borderRadius: '50%',
                  background: sparkle.color,
                  boxShadow: `0 0 10px ${sparkle.color}, 0 0 22px ${sparkle.color}77`,
                  animation: `sparkleTwinkle ${sparkle.duration} ease-in-out ${sparkle.delay} infinite`,
                }}
              />
            ) : (
              <span
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: sparkle.size * 1.05,
                  color: sparkle.color,
                  lineHeight: 1,
                  textShadow: `0 0 10px ${sparkle.color}cc, 0 0 22px ${sparkle.color}66`,
                  animation: `sparkleTwinkle ${sparkle.duration} ease-in-out ${sparkle.delay} infinite`,
                  fontWeight: 700,
                }}
              >
                {symbol}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Floating particle canvas for hero
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const colors = [ACCENT_CYAN, ACCENT_PURPLE, ACCENT_PINK, ACCENT_INDIGO, ACCENT_TEAL];
    const particles: Particle[] = [];

    const spawn = () => {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.6 + 0.2),
        life: 0,
        maxLife: 180 + Math.random() * 120,
        size: 1 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0,
      });
    };

    for (let i = 0; i < 40; i++) {
      spawn();
      particles[i].y = Math.random() * canvas.height;
      particles[i].life = Math.random() * particles[i].maxLife;
    }

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (Math.random() < 0.35) spawn();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.7;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife) particles.splice(i, 1);
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
    />
  );
}

// Glass card component
function GlassCard({ children, style = {}, hover = true }: {
  children: ReactNode;
  style?: CSSProperties;
  hover?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 20,
        backdropFilter: 'blur(16px)',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)'
          : '0 4px 20px rgba(0,0,0,0.25)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Animated counter
function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  const [display, setDisplay] = useState('0');
  const { ref, inView } = useInView<HTMLSpanElement>(0.3);

  useEffect(() => {
    if (!inView) return;

    const num = parseFloat(target.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) {
      setDisplay(target);
      return;
    }

    const prefix = target.match(/^[^0-9]*/)?.[0] ?? '';
    const suf = target.match(/[^0-9.]+$/)?.[0] ?? suffix;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const steps = duration / step;
    const inc = num / steps;

    const timer = setInterval(() => {
      start += inc;
      if (start >= num) {
        setDisplay(`${prefix}${target.replace(/^[^0-9]*/, '')}${suf !== suffix ? '' : suffix}`);
        clearInterval(timer);
        return;
      }
      const decimals = num % 1 !== 0 ? 1 : 0;
      setDisplay(`${prefix}${start.toFixed(decimals)}${suf !== suffix ? suf : suffix}`);
    }, step);

    return () => clearInterval(timer);
  }, [inView, target, suffix]);

  return <span ref={ref}>{inView ? display : '0'}</span>;
}

// Section reveal wrapper
function Reveal({ children, delay = 0, style = {} }: {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
}) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0px)' : 'translateY(36px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Nav bar
function NavBar({ onEnter }: { onEnter: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '0 24px',
      background: scrolled ? 'rgba(8,11,22,0.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      transition: 'all 0.4s ease',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 68,
      }}>
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 900,
            color: '#fff',
            boxShadow: '0 0 20px rgba(168,85,247,0.4)',
          }}>B</div>
          <span style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(90deg, #e2e8f0, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Bloom</span>
        </div>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }} className="nav-links-desktop">
          {NAV_ITEMS.map(([label, id]) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                fontSize: 14,
                fontWeight: 500,
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: 'color 0.2s',
                padding: '4px 0',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onEnter}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'Inter, system-ui, sans-serif',
              padding: '8px 16px',
              borderRadius: 8,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          >
            Sign in
          </button>
          <button
            onClick={onEnter}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'Inter, system-ui, sans-serif',
              padding: '9px 20px',
              borderRadius: 10,
              boxShadow: '0 0 20px rgba(99,102,241,0.35)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(99,102,241,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(99,102,241,0.35)';
            }}
          >
            Get started
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────
   SECTION COMPONENTS
───────────────────────────────────────────── */

// ── HERO ──
function HeroSection({ onEnter }: { onEnter: () => void }) {
  const [btnHovered, setBtnHovered] = useState(false);
  const [btn2Hovered, setBtn2Hovered] = useState(false);

  const words = ['productivity', 'creativity', 'collaboration', 'innovation'];
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const word = words[wordIdx];
    if (typing) {
      if (displayed.length < word.length) {
        const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 1800);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
        return () => clearTimeout(t);
      } else {
        setWordIdx(i => (i + 1) % words.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, wordIdx]);

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px 24px 80px',
      overflow: 'hidden',
    }}>
      <FluidBackground />
      <OrbBackground />
      <BloomingFlowers />
      <ParticleCanvas />
      <SparkleField />

      <div style={{ position: 'relative', zIndex: 3, maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 999,
          padding: '6px 16px',
          marginBottom: 30,
          animation: 'fadeSlideDown 0.8s ease both',
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: ACCENT_CYAN,
            boxShadow: `0 0 8px ${ACCENT_CYAN}`,
            display: 'inline-block',
            animation: 'pulse 2s ease infinite',
          }} />
          <span style={{ color: ACCENT_CYAN, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>
            Now in public beta — join 10,000+ teams
          </span>
        </div>

        {/* Main headline */}
        <div style={{ margin: '0 0 24px', animation: 'fadeSlideDown 0.8s ease 0.1s both' }}>
          <h1 style={{
            fontSize: 'clamp(72px, 11vw, 150px)',
            fontWeight: 900,
            letterSpacing: '0.0em',
            lineHeight: 0.92,
            fontFamily: 'Inter, system-ui, sans-serif',
            background: 'linear-gradient(120deg, #f59e0b 0%, #fb923c 16%, #f97316 34%, #facc15 52%, #fb7185 74%, #a855f7 100%)',
            backgroundSize: '340% 340%',
            backgroundRepeat: 'no-repeat',
            animation: 'bloomTextFlow 8s ease-in-out infinite',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: '0 0 10px',
            textShadow: '0 0 34px rgba(249,115,22,0.18)',
            willChange: 'background-position',
          }}>
            BLOOM
          </h1>
          <p style={{
            fontSize: 'clamp(80px, 6vw, 80px)',
            color: '#ffffff',
            fontWeight: 400,
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            fontFamily: '"Fleur De Leah", cursive',
            margin: 0,
            opacity: 0.98,
          }}>
            grow beyond limits
          </p>
        </div>

        {/* Typewriter tagline with fixed height to avoid layout shift */}
        <div style={{ minHeight: '3.2em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{
            fontSize: 'clamp(18px, 2.5vw, 24px)',
            color: '#64748b',
            fontWeight: 400,
            lineHeight: 1.6,
            maxWidth: 640,
            margin: '0 auto 48px',
            animation: 'fadeSlideDown 0.8s ease 0.3s both',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            The all-in-one platform that amplifies your team's&nbsp;
            <span style={{
              color: ACCENT_CYAN,
              fontWeight: 600,
              borderRight: '2px solid ' + ACCENT_CYAN,
              paddingRight: 2,
              animation: 'blink 1s step-end infinite',
            }}>
              {displayed}
            </span>
          </p>
        </div>

        {/* CTA buttons */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          justifyContent: 'center',
          alignItems: 'center',
          animation: 'fadeSlideDown 0.8s ease 0.4s both',
          marginTop: 24,
        }}>
          <button
            onClick={onEnter}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              padding: '15px 36px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'Inter, system-ui, sans-serif',
              cursor: 'pointer',
              boxShadow: btnHovered
                ? '0 0 40px rgba(99,102,241,0.6), 0 8px 30px rgba(0,0,0,0.3)'
                : '0 0 25px rgba(99,102,241,0.35), 0 4px 15px rgba(0,0,0,0.2)',
              transform: btnHovered ? 'translateY(-2px) scale(1.03)' : 'translateY(0) scale(1)',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              letterSpacing: '-0.01em',
            }}>
            Start for free →
          </button>
          <button
            onClick={onEnter}
            onMouseEnter={() => setBtn2Hovered(true)}
            onMouseLeave={() => setBtn2Hovered(false)}
            style={{
              padding: '15px 36px',
              borderRadius: 12,
              border: `1px solid ${btn2Hovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
              background: btn2Hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
              color: '#e2e8f0',
              fontSize: 16,
              fontWeight: 600,
              fontFamily: 'Inter, system-ui, sans-serif',
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              transform: btn2Hovered ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              letterSpacing: '-0.01em',
            }}>
            View demo
          </button>
        </div>

        {/* Social proof row */}
        <div style={{
          marginTop: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          flexWrap: 'wrap',
          animation: 'fadeSlideDown 0.8s ease 0.5s both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {['#6366f1', '#a855f7', '#ec4899', '#22d3ee', '#14b8a6'].map((c, i) => (
              <div key={i} style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${c}, ${c}99)`,
                border: '2px solid #080b16',
                marginLeft: i > 0 ? -10 : 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
              }}>
                {['S', 'M', 'A', 'J', 'K'][i]}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{ color: '#fbbf24', fontSize: 14 }}>★</span>
              ))}
            </div>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>4.9/5</span> from 2,400+ reviews
            </p>
          </div>
        </div>
      </div>

      {/* Hero dashboard mockup */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        marginTop: 80,
        width: '100%',
        maxWidth: 1000,
        animation: 'fadeSlideUp 1s ease 0.6s both',
      }}>
        <DashboardMockup />
      </div>
    </section>
  );
}

// Mini dashboard mockup for hero
function DashboardMockup() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const bars = [65, 82, 54, 90, 73, 88, 62, 95, 78, 85, 70, 92];
  const animated = bars.map((b, i) => b * (0.6 + 0.4 * Math.sin((tick * 0.8 + i * 0.4))));

  return (
    <div style={{
      background: 'rgba(15,20,40,0.8)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05), 0 0 80px rgba(99,102,241,0.08)',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Window chrome */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
        ))}
        <div style={{
          flex: 1,
          textAlign: 'center',
          color: '#475569',
          fontSize: 12,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 6,
          padding: '3px 0',
          maxWidth: 240,
          margin: '0 auto',
        }}>
          app.bloom.io/dashboard
        </div>
      </div>

      {/* Dashboard content */}
      <div style={{ padding: '20px', display: 'flex', gap: 16 }}>
        {/* Sidebar */}
        <div style={{
          width: 44,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          paddingTop: 4,
        }}>
          {[ACCENT_INDIGO, ACCENT_CYAN, ACCENT_PURPLE, ACCENT_TEAL].map((c, i) => (
            <div key={i} style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: i === 0
                ? `linear-gradient(135deg, ${c}, #a855f7)`
                : 'rgba(255,255,255,0.04)',
              border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: i === 0 ? 'rgba(255,255,255,0.6)' : c, opacity: 0.7 }} />
            </div>
          ))}
        </div>

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Top stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { label: 'Revenue', val: '$84.2k', change: '+12%', color: ACCENT_CYAN },
              { label: 'Users',   val: '24.8k',  change: '+8%',  color: ACCENT_PURPLE },
              { label: 'Projects', val: '142',   change: '+5%',  color: ACCENT_PINK },
              { label: 'Tasks',   val: '1,204',   change: '+19%', color: ACCENT_TEAL },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '10px 12px',
              }}>
                <div style={{ color: '#475569', fontSize: 10, marginBottom: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>{stat.label}</div>
                <div style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>{stat.val}</div>
                <div style={{ color: stat.color, fontSize: 10, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>{stat.change}</div>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: '14px',
          }}>
            <div style={{ color: '#475569', fontSize: 11, marginBottom: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>
              Analytics Overview
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 70 }}>
              {animated.map((h, i) => (
                <div key={i} style={{
                  flex: 1,
                  height: `${h * 0.7}%`,
                  background: `linear-gradient(to top, ${ACCENT_INDIGO}aa, ${ACCENT_CYAN}66)`,
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 1.5s cubic-bezier(0.4,0,0.2,1)',
                  minHeight: 4,
                }} />
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 10,
              padding: '10px 12px',
            }}>
              <div style={{ color: '#475569', fontSize: 10, marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>Recent Activity</div>
              {[
                { label: 'Report generated', color: ACCENT_CYAN },
                { label: 'User milestone hit', color: ACCENT_PURPLE },
                { label: 'Integration synced', color: ACCENT_TEAL },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <div style={{ color: '#64748b', fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 10,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
              <div style={{ color: '#475569', fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>Distribution</div>
              <svg width="52" height="52" viewBox="0 0 52 52">
                {[
                  { color: ACCENT_INDIGO, pct: 40 },
                  { color: ACCENT_CYAN,   pct: 30 },
                  { color: ACCENT_PURPLE, pct: 20 },
                  { color: ACCENT_PINK,   pct: 10 },
                ].reduce<{ els: ReactNode[]; offset: number }>((acc, seg) => {
                  const r = 20, circ = 2 * Math.PI * r;
                  const dash = (seg.pct / 100) * circ;
                  const el = (
                    <circle
                      key={seg.color}
                      cx="26"
                      cy="26"
                      r={r}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="8"
                      strokeDasharray={`${dash} ${circ}`}
                      strokeDashoffset={-acc.offset}
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '26px 26px' }}
                    />
                  );
                  return { els: [...acc.els, el], offset: acc.offset + dash };
                }, { els: [], offset: 0 }).els}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FEATURES ──
function FeaturesSection() {
  const { ref } = useInView(0.05);

  return (
    <section id="features" style={{ padding: '120px 24px', position: 'relative' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.25)',
              borderRadius: 999,
              padding: '5px 14px',
              marginBottom: 20,
              color: ACCENT_PURPLE,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              Capabilities
            </div>
            <h2 style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#f1f5f9',
              fontFamily: 'Inter, system-ui, sans-serif',
              margin: '0 0 16px',
            }}>
              Everything your team needs
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: 18,
              maxWidth: 520,
              margin: '0 auto',
              fontFamily: 'Inter, system-ui, sans-serif',
              lineHeight: 1.6,
            }}>
              A complete toolkit built for modern teams who refuse to settle for ordinary.
            </p>
          </div>
        </Reveal>

        <div ref={ref} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <FeatureCard feature={f} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature: f }: { feature: typeof FEATURES[0] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? f.grad : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? f.border : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 20,
        padding: '28px 28px 32px',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? `0 20px 60px rgba(0,0,0,0.35), 0 0 30px ${f.color}14` : '0 4px 20px rgba(0,0,0,0.2)',
        cursor: 'default',
      }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: `${f.color}18`,
        border: `1px solid ${f.color}35`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        color: f.color,
        marginBottom: 20,
        transition: 'all 0.3s ease',
        boxShadow: hovered ? `0 0 20px ${f.color}30` : 'none',
      }}>
        {f.icon}
      </div>
      <h3 style={{
        fontSize: 18,
        fontWeight: 700,
        color: '#e2e8f0',
        fontFamily: 'Inter, system-ui, sans-serif',
        letterSpacing: '-0.02em',
        marginBottom: 10,
      }}>
        {f.title}
      </h3>
      <p style={{
        fontSize: 15,
        color: '#64748b',
        lineHeight: 1.65,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {f.desc}
      </p>
    </div>
  );
}

// ── STATS ──
function StatsSection() {
  return (
    <section
      id="stats"
      style={{
        padding: '100px 24px',
        position: 'relative',
        background: 'rgba(99,102,241,0.03)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#f1f5f9',
              fontFamily: 'Inter, system-ui, sans-serif',
              margin: '0 0 12px',
            }}>
              Trusted by teams worldwide
            </h2>
            <p style={{ color: '#64748b', fontSize: 17, fontFamily: 'Inter, system-ui, sans-serif' }}>
              The numbers speak for themselves.
            </p>
          </div>
        </Reveal>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 24,
        }}>
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 100}>
              <div style={{
                textAlign: 'center',
                padding: '40px 24px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20,
                transition: 'all 0.3s ease',
              }}>
                <div style={{
                  fontSize: 'clamp(40px, 5vw, 60px)',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  color: s.color,
                  textShadow: `0 0 30px ${s.color}50`,
                  lineHeight: 1,
                  marginBottom: 12,
                }}>
                  <AnimatedCounter target={s.value} />
                </div>
                <p style={{
                  color: '#64748b',
                  fontSize: 15,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  margin: 0,
                }}>
                  {s.label}
                </p>
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
    const t = setInterval(() => setActive(a => (a + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="testimonials" style={{ padding: '120px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(34,211,238,0.08)',
              border: '1px solid rgba(34,211,238,0.2)',
              borderRadius: 999,
              padding: '5px 14px',
              marginBottom: 20,
              color: ACCENT_CYAN,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              Testimonials
            </div>
            <h2 style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#f1f5f9',
              fontFamily: 'Inter, system-ui, sans-serif',
              margin: 0,
            }}>
              Loved by builders everywhere
            </h2>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                onClick={() => setActive(i)}
                style={{
                  padding: '32px',
                  background: active === i
                    ? `linear-gradient(135deg, ${t.color}14, ${t.color}06)`
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${active === i ? t.color + '35' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 20,
                  transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                  cursor: 'pointer',
                  transform: active === i ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: active === i ? `0 20px 50px rgba(0,0,0,0.3), 0 0 30px ${t.color}10` : 'none',
                }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
                  {[...Array(5)].map((_, si) => (
                    <span key={si} style={{ color: '#fbbf24', fontSize: 14 }}>★</span>
                  ))}
                </div>
                <p style={{
                  fontSize: 16,
                  color: '#94a3b8',
                  lineHeight: 1.7,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontStyle: 'italic',
                  marginBottom: 24,
                }}>
                  "{t.quote}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${t.color}, ${t.color}80)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{
                      color: '#e2e8f0',
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}>{t.name}</div>
                    <div style={{
                      color: '#475569',
                      fontSize: 13,
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 36 }}>
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: active === i ? 24 : 8,
                height: 8,
                borderRadius: 999,
                border: 'none',
                background: active === i ? ACCENT_CYAN : 'rgba(255,255,255,0.15)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── PRICING ──
function PricingSection({ onEnter }: { onEnter: () => void }) {
  return (
    <section
      id="pricing"
      style={{
        padding: '120px 24px',
        background: 'rgba(0,0,0,0.2)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(20,184,166,0.08)',
              border: '1px solid rgba(20,184,166,0.22)',
              borderRadius: 999,
              padding: '5px 14px',
              marginBottom: 20,
              color: ACCENT_TEAL,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              Pricing
            </div>
            <h2 style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#f1f5f9',
              fontFamily: 'Inter, system-ui, sans-serif',
              margin: '0 0 16px',
            }}>
              Simple, transparent pricing
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: 17,
              maxWidth: 480,
              margin: '0 auto',
              fontFamily: 'Inter, system-ui, sans-serif',
              lineHeight: 1.6,
            }}>
              No hidden fees. No surprises. Cancel anytime.
            </p>
          </div>
        </Reveal>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
          alignItems: 'start',
        }}>
          {PRICING.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 100}>
              <PricingCard plan={plan} onEnter={onEnter} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ plan: p, onEnter }: { plan: typeof PRICING[0]; onEnter: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '36px 32px 40px',
        background: hovered ? p.grad : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered || p.popular ? p.border : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 24,
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        transform: p.popular
          ? (hovered ? 'scale(1.03)' : 'scale(1.01)')
          : (hovered ? 'translateY(-6px)' : 'translateY(0)'),
        boxShadow: hovered
          ? `0 24px 70px rgba(0,0,0,0.4), 0 0 40px ${p.color}15`
          : p.popular
            ? `0 0 40px ${p.color}20`
            : '0 4px 20px rgba(0,0,0,0.2)',
      }}>
      {/* Popular badge */}
      {p.popular && (
        <div style={{
          position: 'absolute',
          top: -14,
          left: '50%',
          transform: 'translateX(-50%)',
          background: `linear-gradient(90deg, ${ACCENT_INDIGO}, ${ACCENT_PURPLE})`,
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          padding: '5px 16px',
          borderRadius: 999,
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          boxShadow: `0 0 20px ${ACCENT_PURPLE}50`,
        }}>
          Most Popular
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <p style={{
          fontSize: 14,
          fontWeight: 600,
          color: p.color,
          fontFamily: 'Inter, system-ui, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 8,
        }}>
          {p.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
          <span style={{
            fontSize: 52,
            fontWeight: 900,
            color: '#f1f5f9',
            fontFamily: 'Inter, system-ui, sans-serif',
            letterSpacing: '-0.04em',
          }}>
            {p.price}
          </span>
          {p.period && (
            <span style={{ color: '#475569', fontSize: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>
              {p.period}
            </span>
          )}
        </div>
        <p style={{ color: '#64748b', fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>
          {p.desc}
        </p>
      </div>

      <button
        onClick={onEnter}
        style={{
          width: '100%',
          padding: '13px',
          borderRadius: 12,
          marginBottom: 28,
          border: p.popular ? 'none' : `1px solid ${p.color}50`,
          background: p.popular
            ? `linear-gradient(135deg, ${ACCENT_INDIGO}, ${ACCENT_PURPLE})`
            : 'transparent',
          color: p.popular ? '#fff' : p.color,
          fontSize: 15,
          fontWeight: 700,
          fontFamily: 'Inter, system-ui, sans-serif',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: p.popular ? `0 0 25px ${ACCENT_PURPLE}40` : 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        {p.cta}
      </button>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {p.features.map(feat => (
          <li
            key={feat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#94a3b8',
              fontSize: 14,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <span style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: `${p.color}18`,
              border: `1px solid ${p.color}35`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: p.color,
              fontSize: 10,
              fontWeight: 700,
            }}>
              ✓
            </span>
            {feat}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── CTA BANNER ──
function CTASection({ onEnter }: { onEnter: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <section style={{ padding: '120px 24px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <Reveal>
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '80px 48px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.10), rgba(34,211,238,0.08))',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 28,
            textAlign: 'center',
            boxShadow: '0 0 80px rgba(99,102,241,0.12)',
          }}>
            <div style={{
              position: 'absolute',
              top: '-30%',
              left: '-10%',
              width: '40%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30%',
              right: '-10%',
              width: '40%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{
                fontSize: 'clamp(32px, 5vw, 56px)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                color: '#f1f5f9',
                fontFamily: 'Inter, system-ui, sans-serif',
                margin: '0 0 16px',
              }}>
                Ready to bloom?
              </h2>
              <p style={{
                fontSize: 18,
                color: '#64748b',
                maxWidth: 460,
                margin: '0 auto 40px',
                fontFamily: 'Inter, system-ui, sans-serif',
                lineHeight: 1.6,
              }}>
                Join thousands of teams already growing beyond their limits with Bloom.
              </p>
              <button
                onClick={onEnter}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                  padding: '16px 44px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: '#fff',
                  fontSize: 17,
                  fontWeight: 700,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  cursor: 'pointer',
                  boxShadow: hovered
                    ? '0 0 50px rgba(99,102,241,0.7), 0 8px 30px rgba(0,0,0,0.3)'
                    : '0 0 30px rgba(99,102,241,0.4)',
                  transform: hovered ? 'translateY(-3px) scale(1.04)' : 'translateY(0) scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  letterSpacing: '-0.01em',
                }}>
                Get started — it's free →
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── FOOTER ──
function Footer({ onEnter }: { onEnter: () => void }) {
  const cols = [
    { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
    { title: 'Resources', links: ['Docs', 'API Reference', 'Community', 'Support'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
  ];

  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '64px 24px 40px',
      background: 'rgba(0,0,0,0.3)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr repeat(4,1fr)',
          gap: 40,
          marginBottom: 56,
        }}>
          {/* Brand col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 900,
                color: '#fff',
              }}>B</div>
              <span style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(90deg, #e2e8f0, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Bloom</span>
            </div>
            <p style={{
              color: '#475569',
              fontSize: 14,
              lineHeight: 1.65,
              fontFamily: 'Inter, system-ui, sans-serif',
              maxWidth: 240,
            }}>
              Empowering teams to grow beyond every limit, every day.
            </p>
          </div>

          {/* Link columns */}
          {cols.map(col => (
            <div key={col.title}>
              <p style={{
                color: '#e2e8f0',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'Inter, system-ui, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 16,
              }}>{col.title}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(link => (
                  <li key={link}>
                    <button
                      onClick={onEnter}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#475569',
                        fontSize: 14,
                        fontFamily: 'Inter, system-ui, sans-serif',
                        padding: 0,
                        transition: 'color 0.2s',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <p style={{ color: '#334155', fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>
            © 2025 Bloom, Inc. All rights reserved.
          </p>
          <p style={{ color: '#334155', fontSize: 13, fontFamily: 'Inter, system-ui, sans-serif', margin: 0 }}>
            Built with ♥ for creative teams
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   GLOBAL CSS (injected once)
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @keyframes fadeSlideDown {
    from { opacity: 0; transform: translateY(-20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bloomTextFlow {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes gradientDrift {
    0%   { background-position: 0% 50%; transform: translate3d(0,0,0) scale(1); }
    25%  { background-position: 45% 35%; transform: translate3d(2%, -1%, 0) scale(1.06); }
    50%  { background-position: 100% 65%; transform: translate3d(-2%, 2%, 0) scale(0.96); }
    75%  { background-position: 40% 45%; transform: translate3d(1%, -2%, 0) scale(1.03); }
    100% { background-position: 0% 50%; transform: translate3d(0,0,0) scale(1); }
  }
  @keyframes flowerFloat {
    0%,100% { transform: translate3d(0,0,0) rotate(0deg); }
    25%     { transform: translate3d(2px, -7px, 0) rotate(1.5deg); }
    50%     { transform: translate3d(-3px, -12px, 0) rotate(-2deg); }
    75%     { transform: translate3d(3px, -5px, 0) rotate(1deg); }
  }
  @keyframes flowerPulse {
    0%,100% { transform: scale(0.92) rotate(-1deg); }
    50%     { transform: scale(1.06) rotate(2deg); }
  }
  @keyframes sparkleFloat {
    0%,100% { transform: translate3d(0,0,0) scale(1) rotate(0deg); }
    50%     { transform: translate3d(0,-8px,0) scale(1.14) rotate(8deg); }
  }
  @keyframes sparkleTwinkle {
    0%,100% { opacity: 0.5; filter: blur(0px); }
    50%     { opacity: 1; filter: blur(0.25px); }
  }
  @keyframes orbFloat1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(3%,4%) scale(1.05); }
    66%      { transform: translate(-2%,2%) scale(0.97); }
  }
  @keyframes orbFloat2 {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(-3%,-3%) scale(1.04); }
    66%      { transform: translate(2%,-1%) scale(0.98); }
  }
  @keyframes orbFloat3 {
    0%,100% { transform: translate(0,0); }
    50%      { transform: translate(-4%,3%); }
  }
  @keyframes pulse {
    0%,100% { opacity:1; box-shadow: 0 0 8px #22d3ee; }
    50%      { opacity:0.6; box-shadow: 0 0 18px #22d3ee; }
  }
  @keyframes blink {
    0%,100% { border-color: transparent; }
    50%      { border-color: #22d3ee; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #080b16; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #080b16; }
  ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 3px; }
`;

/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
export default function LandingPage({ onEnter }: Props) {
  const [entered, setEntered] = useState(false);

  // Inject global styles once
  useEffect(() => {
    const id = 'bloom-landing-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = GLOBAL_CSS;
      document.head.appendChild(style);
    }
    return () => {
      // keep styles — they're harmless
    };
  }, []);

  const handleEnter = useCallback(() => {
    setEntered(true);
    setTimeout(onEnter, 500);
  }, [onEnter]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      overflowY: entered ? 'hidden' : 'auto',
      overflowX: 'hidden',
      background: '#080b16',
      opacity: entered ? 0 : 1,
      transition: 'opacity 0.5s ease',
      pointerEvents: entered ? 'none' : 'auto',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <NavBar onEnter={handleEnter} />
      <HeroSection onEnter={handleEnter} />
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <PricingSection onEnter={handleEnter} />
      <CTASection onEnter={handleEnter} />
      <Footer onEnter={handleEnter} />
    </div>
  );
}