import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Connection, Flower, useStore } from '../../store/useStore';
import { getColorConfig, cubicBezierPath } from '../../utils/layout';

interface Props {
  connection: Connection;
  flowers: Flower[];
  isHovered: boolean;
  isDeleting: boolean;
  onHover: (id: string | null) => void;
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
  const { theme } = useStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 100);
    return () => clearTimeout(t);
  }, []);

  let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
  let sourceColor = 'cyan';
  let targetColor = 'cyan';

  if (connection.source_type === 'orb') {
    x1 = 0;
    y1 = 0;
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

  const handleMouseMove = (e: React.MouseEvent<SVGPathElement>) => {
    const svg = (e.currentTarget as SVGPathElement).ownerSVGElement;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    setTooltipPos({ x: svgPt.x, y: svgPt.y });
  };

  const gradId = `vineGrad-${connection.id}`;
  const glowId = `vineGlow-${connection.id}`;

  const energyOpacity = connection.source_type === 'orb'
    ? 0.3 + Math.sin(orbPulsePhase * Math.PI * 2) * 0.5
    : 0.3;

  const tooltip = isHovered && tooltipPos
    ? createPortal(
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 28,
            zIndex: 99999,
            pointerEvents: 'none',
            transform: 'translateY(-100%)',
            padding: '10px 12px',
            minWidth: 220,
            maxWidth: 280,
            borderRadius: 12,
            background: isDark ? 'rgba(9,13,24,0.98)' : 'rgba(255,255,255,0.98)',
            border: `1px solid ${color.stroke}33`,
            boxShadow: isDark
              ? '0 18px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.03)'
              : '0 18px 40px rgba(0,0,0,0.12)',
            color: isDark ? 'rgba(255,255,255,0.82)' : 'rgba(10,14,26,0.82)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div style={{ fontSize: 10.5, lineHeight: 1.55, fontWeight: 600, marginBottom: 4 }}>
            {connection.relationship_description.length > 34
              ? connection.relationship_description.slice(0, 34) + '…'
              : connection.relationship_description}
          </div>
          <div style={{ fontSize: 9, color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.55)' }}>
            {connection.source_type === 'orb' ? 'Core Soul' : 'Flower'} → {tgtFlower.entity_name.slice(0, 18)}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <g>
        <defs>
          <linearGradient
            id={gradId}
            x1={`${x1}`}
            y1={`${y1}`}
            x2={`${x2}`}
            y2={`${y2}`}
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
            strokeDasharray: drawn ? (isCircular ? '6 9' : undefined) : `${pathLength}`,
            strokeDashoffset: drawn ? (isCircular ? undefined : 0) : pathLength,
            animation: drawn && isCircular ? `conveyorBelt 2s linear infinite` : undefined,
          }}
          filter={`url(#${glowId})`}
          onMouseEnter={() => onHover(connection.id)}
          onMouseLeave={() => {
            onHover(null);
            setTooltipPos(null);
          }}
          onMouseMove={handleMouseMove}
        />

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
      </g>
      {tooltip}
    </>
  );
}