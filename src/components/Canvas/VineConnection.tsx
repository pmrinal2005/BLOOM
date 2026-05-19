import { useState, useEffect, useRef } from 'react';
import { Connection, Flower } from '../../store/useStore';
import { getColorConfig, cubicBezierPath } from '../../utils/layout';

interface Props {
  connection: Connection;
  flowers: Flower[];
  isHovered: boolean;
  isDeleting: boolean;
  onHover: (id: string | null) => void;
  // orbPulsePhase: 0..1, driven by CentralOrb heartbeat — triggers energy wave
  orbPulsePhase?: number;
}

export default function VineConnection({
  connection,
  flowers,
  isHovered,
  isDeleting,
  onHover,
  orbPulsePhase = 0,
}: Props) {
  const [drawn, setDrawn] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 100);
    return () => clearTimeout(t);
  }, []);

  let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
  let sourceColor = 'cyan';
  let targetColor = 'cyan';

  if (connection.source_type === 'orb') {
    x1 = 0; y1 = 0;
  } else {
    const srcFlower = flowers.find(f => f.id === connection.source_id);
    if (!srcFlower) return null;
    x1 = srcFlower.position_x;
    y1 = srcFlower.position_y;
    sourceColor = srcFlower.color_theme;
  }

  const tgtFlower = flowers.find(f => f.id === connection.target_id);
  if (!tgtFlower) return null;
  x2 = tgtFlower.position_x;
  y2 = tgtFlower.position_y;
  targetColor = tgtFlower.color_theme;

  const color = getColorConfig(targetColor);
  const srcColorCfg = getColorConfig(connection.source_type === 'orb' ? 'cyan' : sourceColor);
  const pathD = cubicBezierPath(x1, y1, x2, y2);
  const pathLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * 1.2;
  const isCircular = connection.source_type === 'flower';
  const strokeWidth = isHovered ? 2.4 : isCircular ? 1.3 : 1.6;

  // Point 9: energy pulse — animate stroke-dashoffset to create conveyor belt for dotted,
  // and a brightness wave for solid lines.
  // For dotted (flower→flower): continuously offset dasharray
  // For solid (orb→flower): pulse opacity tied to orbPulsePhase

  const handleMouseMove = (e: React.MouseEvent<SVGPathElement>) => {
    const svg = (e.target as SVGPathElement).ownerSVGElement;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    setTooltipPos({ x: svgPt.x, y: svgPt.y });
  };

  const gradId = `vineGrad-${connection.id}`;
  const glowId = `vineGlow-${connection.id}`;

  // Energy wave opacity for solid orb→flower connections
  const energyOpacity = connection.source_type === 'orb'
    ? 0.3 + Math.sin(orbPulsePhase * Math.PI * 2) * 0.5
    : 0.3;

  return (
    <g>
      <defs>
        <linearGradient
          id={gradId}
          x1={`${x1}`} y1={`${y1}`}
          x2={`${x2}`} y2={`${y2}`}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={connection.source_type === 'orb' ? '#00dcff' : srcColorCfg.stroke} stopOpacity={0.35} />
          <stop offset="50%" stopColor={color.stroke} stopOpacity={isHovered ? 0.95 : 0.65} />
          <stop offset="100%" stopColor={color.stroke} stopOpacity={isHovered ? 0.75 : 0.45} />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={isHovered ? 2.5 : 1.5} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow background */}
      <path
        d={pathD}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidth + 2}
        strokeLinecap="round"
        style={{
          filter: `blur(${isHovered ? 3 : 2}px)`,
          opacity: isDeleting ? 0 : energyOpacity,
          transition: 'opacity 0.1s',
          strokeDasharray: drawn ? undefined : `${pathLength}`,
          strokeDashoffset: drawn ? 0 : pathLength,
        }}
      />

      {/* Main path */}
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{
          opacity: isDeleting ? 0 : 1,
          transition: 'opacity 0.5s ease, stroke-width 0.2s',
          // Point 9 dotted conveyor belt: dashoffset animated in CSS via keyframe
          strokeDasharray: drawn
            ? (isCircular ? '6 9' : undefined)
            : `${pathLength}`,
          strokeDashoffset: drawn ? (isCircular ? undefined : 0) : pathLength,
          animation: drawn && isCircular ? `conveyorBelt 2s linear infinite` : undefined,
        }}
        filter={`url(#${glowId})`}
        onMouseEnter={() => onHover(connection.id)}
        onMouseLeave={() => { onHover(null); setTooltipPos(null); }}
        onMouseMove={handleMouseMove}
      />

      {/* Point 9: Energy wave particle for solid orb→flower lines */}
      {drawn && connection.source_type === 'orb' && (
        <>
          <circle r={3} fill="#00dcff" opacity={0.9}>
            <animateMotion dur="1.8s" repeatCount="indefinite" path={pathD} />
          </circle>
          <circle r={1.8} fill="#00ffff" opacity={0.6}>
            <animateMotion dur="1.8s" begin="0.6s" repeatCount="indefinite" path={pathD} />
          </circle>
          <circle r={1.2} fill="#ffffff" opacity={0.4}>
            <animateMotion dur="1.8s" begin="1.2s" repeatCount="indefinite" path={pathD} />
          </circle>
        </>
      )}

      {/* Hover particles for any connection */}
      {drawn && isHovered && (
        <>
          <circle r={2.5} fill={color.stroke} opacity={0.9}>
            <animateMotion dur="1.5s" repeatCount="indefinite" path={pathD} />
          </circle>
          <circle r={1.5} fill={color.stroke} opacity={0.6}>
            <animateMotion dur="1.5s" begin="0.5s" repeatCount="indefinite" path={pathD} />
          </circle>
        </>
      )}

      {/* Tooltip */}
      {isHovered && tooltipPos && (
        <g>
          <rect x={tooltipPos.x + 10} y={tooltipPos.y - 30} width={200} height={42} rx={8}
            fill="rgba(9,13,24,0.97)" stroke={`${color.stroke}40`} strokeWidth={1} />
          <text x={tooltipPos.x + 20} y={tooltipPos.y - 13}
            style={{ fill: 'rgba(255,255,255,0.75)', fontSize: 9.5, fontFamily: 'Inter, sans-serif' }}>
            {connection.relationship_description.length > 30
              ? connection.relationship_description.slice(0, 30) + '…'
              : connection.relationship_description}
          </text>
          <text x={tooltipPos.x + 20} y={tooltipPos.y + 2}
            style={{ fill: color.text, fontSize: 8.5, fontFamily: 'Inter, sans-serif' }}>
            {connection.source_type === 'orb' ? 'Core Soul' : '→'} → {tgtFlower.entity_name.slice(0, 18)}
          </text>
        </g>
      )}
    </g>
  );
}