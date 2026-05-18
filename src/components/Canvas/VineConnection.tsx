import { useState, useEffect, useRef } from 'react';
import { Connection, Flower } from '../../store/useStore';
import { getColorConfig, cubicBezierPath } from '../../utils/layout';

interface Props {
  connection: Connection;
  flowers: Flower[];
  isHovered: boolean;
  isDeleting: boolean;
  onHover: (id: string | null) => void;
}

export default function VineConnection({ connection, flowers, isHovered, isDeleting, onHover }: Props) {
  const [drawn, setDrawn] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Get source and target coordinates
  let x1 = 0, y1 = 0;
  let x2 = 0, y2 = 0;
  let targetColor = 'cyan';

  if (connection.source_type === 'orb') {
    x1 = 0;
    y1 = 0;
  } else {
    const srcFlower = flowers.find(f => f.id === connection.source_id);
    if (!srcFlower) return null;
    x1 = srcFlower.position_x;
    y1 = srcFlower.position_y;
    targetColor = srcFlower.color_theme;
  }

  const tgtFlower = flowers.find(f => f.id === connection.target_id);
  if (!tgtFlower) return null;
  x2 = tgtFlower.position_x;
  y2 = tgtFlower.position_y;
  targetColor = tgtFlower.color_theme;

  const color = getColorConfig(targetColor);
  const pathD = cubicBezierPath(x1, y1, x2, y2);

  // Estimate path length for dash animation
  const pathLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * 1.2;
  const isCircular = connection.source_type === 'flower';

  const handleMouseMove = (e: React.MouseEvent<SVGPathElement>) => {
    const svg = (e.target as SVGPathElement).ownerSVGElement;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    setTooltipPos({ x: svgPt.x, y: svgPt.y });
  };

  const strokeWidth = isHovered ? 2.2 : isCircular ? 1.2 : 1.5;

  return (
    <g>
      <defs>
        <linearGradient
          id={`vineGrad-${connection.id}`}
          x1={`${x1}`} y1={`${y1}`}
          x2={`${x2}`} y2={`${y2}`}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={connection.source_type === 'orb' ? '#00dcff' : color.stroke} stopOpacity={0.3} />
          <stop offset="50%" stopColor={color.stroke} stopOpacity={isHovered ? 0.9 : 0.6} />
          <stop offset="100%" stopColor={color.stroke} stopOpacity={isHovered ? 0.7 : 0.4} />
        </linearGradient>
        <filter id={`vineGlow-${connection.id}`}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={isHovered ? 2.5 : 1.5} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow background path */}
      <path
        d={pathD}
        fill="none"
        stroke={`url(#vineGrad-${connection.id})`}
        strokeWidth={strokeWidth + 2}
        strokeLinecap="round"
        opacity={0.3}
        style={{
          filter: `blur(${isHovered ? 3 : 2}px)`,
          opacity: isDeleting ? 0 : 0.3,
          transition: 'opacity 0.5s ease',
          strokeDasharray: drawn ? undefined : pathLength,
          strokeDashoffset: drawn ? 0 : pathLength,
        }}
      />

      {/* Main path */}
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={`url(#vineGrad-${connection.id})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={isCircular ? '5 8' : undefined}
        style={{
          opacity: isDeleting ? 0 : 1,
          transition: 'opacity 0.5s ease, stroke-width 0.2s',
          strokeDasharray: drawn ? (isCircular ? '5 8' : undefined) : `${pathLength}`,
          strokeDashoffset: drawn ? 0 : pathLength,
        }}
        filter={`url(#vineGlow-${connection.id})`}
        onMouseEnter={() => onHover(connection.id)}
        onMouseLeave={() => { onHover(null); setTooltipPos(null); }}
        onMouseMove={handleMouseMove}
      />

      {/* Animated particles along vine */}
      {drawn && isHovered && (
        <>
          <circle r={2.5} fill={color.stroke} opacity={0.9}>
            <animateMotion dur="2s" repeatCount="indefinite" path={pathD} />
          </circle>
          <circle r={1.5} fill={color.stroke} opacity={0.6}>
            <animateMotion dur="2s" begin="0.7s" repeatCount="indefinite" path={pathD} />
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
            {connection.source_type === 'orb' ? 'Core Soul' : connection.source_id} → {tgtFlower.entity_name.slice(0, 18)}
          </text>
        </g>
      )}
    </g>
  );
}
