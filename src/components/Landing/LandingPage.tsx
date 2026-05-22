import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  onEnter: () => void;
}

interface BloomFlower {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  petalCount: number;
  rotation: number;
  depth: number;
  duration: number;
  delay: number;
  blur: number;
  opacity: number;
  reverse: boolean;
}

function FlowerSVG({
  color,
  petalCount,
  openness,
  rotation,
}: {
  color: string;
  petalCount: number;
  openness: number;
  rotation: number;
}) {
  const coreR = 4;
  const petalLen = 10 + openness * 7;
  const petalW = 4 + openness * 1.5;
  const glow = 4 + openness * 10;

  return (
    <svg viewBox="-28 -28 56 56" width="100%" height="100%" overflow="visible">
      <g
        transform={`rotate(${rotation})`}
        style={{ filter: `drop-shadow(0 0 ${glow}px ${color})` }}
      >
        {Array.from({ length: petalCount }).map((_, i) => {
          const a = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
          const dist = coreR + petalLen * 0.52;
          const px = Math.cos(a) * dist;
          const py = Math.sin(a) * dist;

          return (
            <ellipse
              key={i}
              cx={px}
              cy={py}
              rx={petalW}
              ry={petalLen * 0.48}
              fill={color}
              opacity={0.72 + openness * 0.28}
              transform={`rotate(${(a * 180) / Math.PI + 90},${px},${py})`}
            />
          );
        })}
        <circle cx={0} cy={0} r={coreR} fill="#fbbf24" opacity={0.92} />
        <circle cx={0} cy={0} r={coreR * 0.45} fill="#f59e0b" />
      </g>
    </svg>
  );
}

function buildArchPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number
) {
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, Math.PI, 0, false);
  ctx.arc(cx, cy, innerR, 0, Math.PI, true);
  ctx.closePath();
}

function setCanvasSize(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number
) {
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

const FLOWER_COLORS = [
  '#fb7185', '#f472b6', '#e879f9', '#c084fc', '#818cf8',
  '#38bdf8', '#22d3ee', '#2dd4bf', '#34d399', '#fbbf24',
  '#f59e0b', '#f87171',
];

function makeFlowers(
  archCX: number,
  archCY: number,
  archRadius: number,
  archThickness: number
): BloomFlower[] {
  const outerR = archRadius + archThickness / 2;
  const count = 60;

  return Array.from({ length: count }, (_, id) => {
    const u = Math.random();
    const angle = Math.PI - u * Math.PI;
    const depth = Math.random();

    const rimR = outerR + archThickness * (0.1 + Math.pow(Math.random(), 0.8) * 1.0);
    const x = archCX - Math.cos(angle) * rimR + (Math.random() - 0.5) * archThickness * 0.3;
    const y = archCY - Math.sin(angle) * rimR + (Math.random() - 0.5) * archThickness * 0.25;

    const duration = 5 + Math.random() * 4;
    const delay = -(Math.random() * duration);

    return {
      id,
      x,
      y,
      size: 16 + depth * 24 + Math.random() * 10,
      color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
      petalCount: 4 + Math.floor(Math.random() * 5),
      rotation: Math.random() * 360,
      depth,
      duration,
      delay,
      blur: depth < 0.25 ? 1.0 : depth < 0.5 ? 0.6 : 0,
      opacity: 0.4 + depth * 0.6,
      reverse: Math.random() > 0.5,
    };
  });
}

export default function LandingPage({ onEnter }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  const [btnHovered, setBtnHovered] = useState(false);
  const [entered, setEntered] = useState(false);

  const [winSize, setWinSize] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1440,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  });

  useEffect(() => {
    const onResize = () =>
      setWinSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Thickness set to 0.28
  const archCX = winSize.w / 2;
  const archRadius = Math.min(winSize.w * 0.36, winSize.h * 0.65);
  const archCY = winSize.h * 0.98;
  const archThickness = archRadius * 0.28; // Changed to 0.28

  const flowers = useMemo(
    () => makeFlowers(archCX, archCY, archRadius, archThickness),
    [archCX, archCY, archRadius, archThickness]
  );

  const backFlowers = useMemo(() => flowers.filter((f) => f.depth < 0.5), [flowers]);
  const frontFlowers = useMemo(() => flowers.filter((f) => f.depth >= 0.5), [flowers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mainCtx = canvas.getContext('2d');
    if (!mainCtx) return;

    const flowCanvas = document.createElement('canvas');
    const maskCanvas = document.createElement('canvas');
    const ringCanvas = document.createElement('canvas');

    const flowCtx = flowCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    const ringCtx = ringCanvas.getContext('2d');

    if (!flowCtx || !maskCtx || !ringCtx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const rebuildMask = () => {
      // Thickness 0.28 applied
      const cx = width / 2;
      const cy = height * 0.98;
      const radius = Math.min(width * 0.36, height * 0.65);
      const outerR = radius + radius * 0.28 / 2; // Changed to 0.28
      const innerR = radius - radius * 0.28 / 2; // Changed to 0.28

      maskCtx.clearRect(0, 0, width, height);

      maskCtx.save();
      buildArchPath(maskCtx, cx, cy, outerR + 50, innerR - 25);
      maskCtx.filter = `blur(${Math.max(35, radius * 0.14)}px)`;
      maskCtx.fillStyle = 'rgba(255,255,255,0.5)';
      maskCtx.fill();
      maskCtx.restore();

      maskCtx.save();
      buildArchPath(maskCtx, cx, cy, outerR, innerR);
      maskCtx.fillStyle = 'rgba(255,255,255,1)';
      maskCtx.fill();
      maskCtx.restore();
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      setCanvasSize(canvas, mainCtx, width, height, dpr);
      setCanvasSize(flowCanvas, flowCtx, width, height, dpr);
      setCanvasSize(maskCanvas, maskCtx, width, height, dpr);
      setCanvasSize(ringCanvas, ringCtx, width, height, dpr);

      rebuildMask();
    };

    resize();
    window.addEventListener('resize', resize);

    const drawMarbleRibbon = (
      t: number,
      offset: number,
      amp: number,
      widthMul: number,
      alpha: number,
      blur: number,
      speed: number,
      phase: number,
      stops: [number, string][],
      composite: GlobalCompositeOperation = 'screen'
    ) => {
      // Thickness 0.28 applied
      const cx = width / 2;
      const cy = height * 0.98;
      const radius = Math.min(width * 0.36, height * 0.65);
      const outerR = radius + radius * 0.28 / 2; // Changed to 0.28
      const centerR = radius;
      const thickness = radius * 0.28; // Changed to 0.28
      const steps = 80;

      const grad = flowCtx.createLinearGradient(cx - outerR, cy - 40, cx + outerR, cy + 40);
      stops.forEach(([p, c]) => grad.addColorStop(p, c));

      flowCtx.save();
      flowCtx.globalCompositeOperation = composite;
      flowCtx.lineCap = 'round';
      flowCtx.lineJoin = 'round';
      flowCtx.filter = `blur(${blur}px)`;
      flowCtx.globalAlpha = alpha;

      flowCtx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const a = Math.PI - u * Math.PI;
        
        const edgeBoost = 0.6 + 0.8 * Math.abs(Math.cos(u * Math.PI));
        const wave =
          Math.sin(u * 4 * Math.PI + phase + t * speed) * amp +
          Math.sin(u * 11 * Math.PI - phase * 1.3 - t * speed * 0.7) * (amp * 0.5) +
          Math.sin(u * 23 * Math.PI + phase * 0.6) * (amp * 0.2);

        const r = centerR + offset + wave * edgeBoost;
        const x = cx - Math.cos(a) * r;
        const y = cy - Math.sin(a) * r;

        if (i === 0) flowCtx.moveTo(x, y);
        else flowCtx.lineTo(x, y);
      }

      flowCtx.lineWidth = thickness * widthMul;
      flowCtx.strokeStyle = grad;
      flowCtx.stroke();

      flowCtx.globalAlpha = alpha * 0.6;
      flowCtx.filter = `blur(${Math.max(2, blur * 0.5)}px)`;
      flowCtx.lineWidth = thickness * widthMul * 0.35;
      flowCtx.strokeStyle = 'rgba(255,255,255,0.7)';
      flowCtx.stroke();
      
      flowCtx.restore();
    };

    const drawMarbleSwirl = (
      t: number,
      uPos: number,
      offset: number,
      sizeMul: number,
      turns: number,
      alpha: number,
      blur: number,
      speed: number,
      phase: number,
      stops: [number, string][]
    ) => {
      // Thickness 0.28 applied
      const cx = width / 2;
      const cy = height * 0.98;
      const radius = Math.min(width * 0.36, height * 0.65);
      const thickness = radius * 0.28; // Changed to 0.28

      const u = uPos + Math.sin(t * speed + phase) * 0.015;
      const a = Math.PI - u * Math.PI;
      const localR = radius + offset + Math.sin(t * speed * 0.7 + phase) * thickness * 0.02;
      const px = cx - Math.cos(a) * localR;
      const py = cy - Math.sin(a) * localR;

      const size = thickness * sizeMul;
      const grad = flowCtx.createLinearGradient(-size, 0, size, 0);
      stops.forEach(([p, c]) => grad.addColorStop(p, c));

      flowCtx.save();
      flowCtx.translate(px, py);
      flowCtx.rotate(a - Math.PI / 2);
      flowCtx.globalCompositeOperation = 'overlay';
      flowCtx.globalAlpha = alpha;
      flowCtx.filter = `blur(${blur}px)`;
      flowCtx.lineCap = 'round';

      const steps = 36;
      flowCtx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const p = i / steps;
        const theta = p * Math.PI * 2 * turns + t * speed * 0.4;
        const rr = size * (1 - p) * (1 - 0.08 * Math.sin(p * 5 + t * 0.5));
        const x = Math.cos(theta) * rr;
        const y = Math.sin(theta) * rr * 0.65;

        if (i === 0) flowCtx.moveTo(x, y);
        else flowCtx.lineTo(x, y);
      }

      flowCtx.lineWidth = size * 0.14;
      flowCtx.strokeStyle = grad;
      flowCtx.stroke();
      flowCtx.restore();
    };

    const drawArch = (t: number) => {
      // Thickness 0.28 applied
      const cx = width / 2;
      const cy = height * 0.98;
      const radius = Math.min(width * 0.36, height * 0.65);
      const outerR = radius + radius * 0.28 / 2; // Changed to 0.28
      const innerR = radius - radius * 0.28 / 2; // Changed to 0.28
      const thickness = radius * 0.28; // Changed to 0.28

      const pad = 180;
      const rectX = cx - outerR - pad;
      const rectY = cy - outerR - pad;
      const rectS = (outerR + pad) * 2;

      flowCtx.clearRect(0, 0, width, height);

      flowCtx.save();
      buildArchPath(flowCtx, cx, cy, outerR, innerR);
      flowCtx.clip();

      const baseGrad = flowCtx.createLinearGradient(cx - outerR, cy - 60, cx + outerR, cy + 60);
      baseGrad.addColorStop(0.0, '#06b6d4');
      baseGrad.addColorStop(0.25, '#10b981');
      baseGrad.addColorStop(0.5, '#9333ea');
      baseGrad.addColorStop(0.65, '#ec4899');
      baseGrad.addColorStop(0.85, '#f59e0b');
      baseGrad.addColorStop(1.0, '#f97316');

      flowCtx.globalAlpha = 1;
      flowCtx.fillStyle = baseGrad;
      flowCtx.fillRect(rectX, rectY, rectS, rectS);

      // Marble Layers
      drawMarbleRibbon(t, -thickness * 0.08, thickness * 0.18, 0.4, 0.5, 8, 0.3, 0, [
        [0, 'rgba(34, 211, 238, 0.9)'],
        [0.5, 'rgba(52, 211, 153, 0.8)'],
        [1, 'rgba(52, 211, 153, 0)'],
      ]);

      drawMarbleRibbon(t, thickness * 0.02, thickness * 0.14, 0.45, 0.45, 10, 0.25, 2, [
        [0, 'rgba(168, 85, 247, 0)'],
        [0.3, 'rgba(192, 132, 252, 0.9)'],
        [0.7, 'rgba(236, 72, 153, 0.85)'],
        [1, 'rgba(244, 114, 182, 0)'],
      ]);

      drawMarbleRibbon(t, thickness * 0.12, thickness * 0.16, 0.38, 0.48, 9, 0.28, 4, [
        [0, 'rgba(251, 191, 36, 0)'],
        [0.4, 'rgba(245, 158, 11, 0.9)'],
        [0.8, 'rgba(251, 146, 60, 0.85)'],
        [1, 'rgba(255, 122, 60, 0)'],
      ]);

      drawMarbleRibbon(t, -thickness * 0.02, thickness * 0.1, 0.3, 0.3, 6, 0.2, 1.5, [
        [0, 'rgba(10, 10, 30, 0)'],
        [0.5, 'rgba(20, 20, 60, 0.5)'],
        [1, 'rgba(10, 10, 30, 0)'],
      ], 'multiply');

      // Swirls
      drawMarbleSwirl(t, 0.12, -thickness * 0.12, 0.55, 2.8, 0.4, 2.5, 0.35, 0, [
        [0, 'rgba(34, 211, 238, 0)'],
        [0.4, 'rgba(34, 211, 238, 0.9)'],
        [1, 'rgba(52, 211, 153, 0)'],
      ]);

      drawMarbleSwirl(t, 0.52, -thickness * 0.04, 0.5, 2.4, 0.35, 2, 0.3, 2.5, [
        [0, 'rgba(168, 85, 247, 0)'],
        [0.5, 'rgba(236, 72, 153, 0.85)'],
        [1, 'rgba(236, 72, 153, 0)'],
      ]);

      drawMarbleSwirl(t, 0.88, -thickness * 0.08, 0.6, 3, 0.42, 2.8, 0.32, 5, [
        [0, 'rgba(251, 191, 36, 0)'],
        [0.5, 'rgba(245, 158, 11, 0.9)'],
        [1, 'rgba(255, 237, 100, 0)'],
      ]);

      flowCtx.restore();

      rebuildMask();

      ringCtx.clearRect(0, 0, width, height);
      ringCtx.save();
      ringCtx.drawImage(flowCanvas, 0, 0, width, height);
      ringCtx.globalCompositeOperation = 'destination-in';
      ringCtx.drawImage(maskCanvas, 0, 0, width, height);
      ringCtx.restore();

      mainCtx.clearRect(0, 0, width, height);

      mainCtx.save();
      mainCtx.globalCompositeOperation = 'screen';
      mainCtx.globalAlpha = 0.7;
      mainCtx.filter = 'blur(40px)';
      mainCtx.drawImage(ringCanvas, 0, 0, width, height);
      mainCtx.restore();

      mainCtx.save();
      mainCtx.globalCompositeOperation = 'screen';
      mainCtx.globalAlpha = 0.85;
      mainCtx.filter = 'blur(14px)';
      mainCtx.drawImage(ringCanvas, 0, 0, width, height);
      mainCtx.restore();

      mainCtx.save();
      mainCtx.globalAlpha = 1;
      mainCtx.filter = 'blur(0.8px)';
      mainCtx.drawImage(ringCanvas, 0, 0, width, height);
      mainCtx.restore();

      // Localized blooms
      const blooms = [
        { u: 0.1, color: 'rgba(6, 182, 212, 0.5)', r: 120 },
        { u: 0.3, color: 'rgba(16, 185, 129, 0.45)', r: 100 },
        { u: 0.5, color: 'rgba(147, 51, 234, 0.55)', r: 140 },
        { u: 0.7, color: 'rgba(236, 72, 153, 0.5)', r: 120 },
        { u: 0.9, color: 'rgba(245, 158, 11, 0.5)', r: 110 },
      ];

      mainCtx.save();
      mainCtx.globalCompositeOperation = 'screen';
      blooms.forEach((b) => {
        const a = Math.PI - b.u * Math.PI;
        const rPos = outerR + 25;
        const x = cx - Math.cos(a) * rPos;
        const y = cy - Math.sin(a) * rPos - 50;
        
        const g = mainCtx.createRadialGradient(x, y, 0, x, y, b.r);
        g.addColorStop(0, b.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        
        mainCtx.fillStyle = g;
        mainCtx.globalAlpha = 0.8;
        mainCtx.fillRect(x - b.r, y - b.r, b.r * 2, b.r * 2);
      });
      mainCtx.restore();
    };

    const loop = () => {
      timeRef.current += 0.008;
      drawArch(timeRef.current);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [archCX, archCY, archRadius, archThickness]);

  const handleEnter = () => {
    setEntered(true);
    setTimeout(onEnter, 650);
  };

  const innerR = archRadius - archThickness / 2;
  const textCenterY = archCY - innerR * 0.4;

  const renderFlower = (flower: BloomFlower) => (
    <div
      key={flower.id}
      style={{
        position: 'absolute',
        left: flower.x,
        top: flower.y,
        width: flower.size,
        height: flower.size,
        transform: 'translate(-50%, -50%)',
        opacity: flower.opacity,
        filter: flower.blur ? `blur(${flower.blur}px)` : 'none',
        pointerEvents: 'none',
        zIndex: flower.depth >= 0.5 ? 10 : 0,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          animation: `flowerDrift ${flower.duration}s ease-in-out ${flower.delay}s infinite`,
          animationDirection: flower.reverse ? 'reverse' : 'normal',
          transformOrigin: '50% 50%',
          willChange: 'transform',
        }}
      >
        <FlowerSVG
          color={flower.color}
          petalCount={flower.petalCount}
          rotation={flower.rotation}
          openness={0.95}
        />
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(ellipse at 50% 100%, #0f172a 0%, #020617 50%, #000000 100%)',
        overflow: 'hidden',
        opacity: entered ? 0 : 1,
        transition: 'opacity 0.65s ease',
        pointerEvents: entered ? 'none' : 'auto',
      }}
    >
      <style>{`
        @keyframes flowerDrift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(0.9) rotate(0deg); }
          50% { transform: translate3d(0, -10px, 0) scale(1.1) rotate(10deg); }
        }
      `}</style>

      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {backFlowers.map(renderFlower)}
      </div>

      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
      />

      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', mixBlendMode: 'screen' }}>
        {frontFlowers.map(renderFlower)}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${textCenterY}px`,
          transform: 'translateY(-50%)',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 24px',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(40px, 6.5vw, 100px)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            fontFamily: 'Inter, system-ui, sans-serif',
            background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 25%, #a855f7 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 0.9,
            marginBottom: 10,
            filter: 'drop-shadow(0 0 25px rgba(34,211,238,0.5)) drop-shadow(0 0 50px rgba(168,85,247,0.4))',
          }}
        >
          BLOOM:
        </div>

        <div
          style={{
            fontSize: 'clamp(18px, 3vw, 44px)',
            fontWeight: 800,
            color: '#6ee7b7',
            fontFamily: 'Inter, system-ui, sans-serif',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: 32,
            textShadow: '0 0 25px rgba(110,231,183,0.6), 0 0 50px rgba(110,231,183,0.3)',
          }}
        >
          grow beyond limits
        </div>

        <button
          onClick={handleEnter}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          style={{
            padding: '12px 32px',
            borderRadius: 999,
            border: `2px solid ${btnHovered ? '#2dd4bf' : '#0f766e'}`,
            background: btnHovered ? 'rgba(13,148,136,0.3)' : 'rgba(2,6,23,0.7)',
            color: '#6ee7b7',
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'Inter, system-ui, sans-serif',
            letterSpacing: '0.03em',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(18px)',
            boxShadow: btnHovered
              ? '0 0 30px rgba(45,212,191,0.4), inset 0 0 12px rgba(45,212,191,0.1)'
              : '0 0 12px rgba(15,118,110,0.25)',
            transform: btnHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          Explore your creative potential
        </button>
      </div>
    </div>
  );
}