// C:\Users\mrutu\OneDrive\Desktop\bloom\src\components\Canvas\FlowerNode.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Flower } from '../../store/useStore';
import { getColorConfig } from '../../utils/layout';

interface Props {
  flower: Flower;
  isDeleting: boolean;
  isHovered: boolean;
  isSelected: boolean;
  compactView: boolean;
  isSnapTarget?: boolean;
  canvasZoom?: number;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  onDeletePetal: (flowerId: string, petalId: string) => void;
  onDeleteFlower: (flowerId: string) => void;
  onEditFlower: (flowerId: string, name: string) => void;
  onDragStart?: (e: React.MouseEvent, flowerId: string) => void;
  appearing?: boolean;
}

function getSolidFill(colorTheme: string): string {
  const map: Record<string, string> = {
    cyan:   '#004d4d', green:  '#1a4d00', pink:   '#4d0044',
    orange: '#4d2600', blue:   '#002966', purple: '#2d0066', yellow: '#4d4400',
  };
  return map[colorTheme] ?? '#004d4d';
}

function getPetalFill(colorTheme: string): string {
  const map: Record<string, string> = {
    cyan:   '#006666', green:  '#1f6600', pink:   '#660055',
    orange: '#663300', blue:   '#003399', purple: '#3d0080', yellow: '#665c00',
  };
  return map[colorTheme] ?? '#006666';
}

interface TooltipProps {
  flower: Flower;
  size: number;
  color: ReturnType<typeof getColorConfig>;
  onDeletePetal: (flowerId: string, petalId: string) => void;
  onDeleteFlower: (flowerId: string) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  flipLeft?: boolean;
}

export function FlowerTooltip({
  flower, size, color,
  onDeletePetal, onDeleteFlower,
  showDeleteConfirm, setShowDeleteConfirm,
  flipLeft = false,
}: TooltipProps) {
  const tooltipW = 240;
  const petalRowH = 34;
  const tooltipH = 56 + flower.petals.length * petalRowH + 44;
  const xOffset = flipLeft ? -(tooltipW + size * 0.65 + 12) : size * 0.65 + 10;

  if (showDeleteConfirm) {
    return (
      // Task 9: use style={{ isolation: 'isolate' }} equivalent via z-index boosted wrapper
      <g style={{ isolation: 'isolate' } as any}>
        <rect x={-96} y={-52} width={192} height={94} rx={10}
          fill="rgba(9,13,24,0.99)" stroke="rgba(255,70,70,0.4)" strokeWidth={1.5} />
        <text x={0} y={-28} textAnchor="middle"
          style={{ fill: 'rgba(255,255,255,0.88)', fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
          Remove this concept?
        </text>
        <text x={0} y={-14} textAnchor="middle"
          style={{ fill: 'rgba(255,255,255,0.38)', fontSize: 8.5, fontFamily: 'Inter, sans-serif' }}>
          This triggers garden regeneration
        </text>
        <g
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDeleteFlower(flower.id); }}
          style={{ cursor: 'pointer' }}
        >
          <rect x={-84} y={0} width={76} height={28} rx={7}
            fill="rgba(255,50,50,0.22)" stroke="rgba(255,50,50,0.5)" strokeWidth={1} />
          <text x={-46} y={17} textAnchor="middle"
            style={{ fill: '#ff5050', fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
            Confirm
          </text>
        </g>
        <g
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowDeleteConfirm(false); }}
          style={{ cursor: 'pointer' }}
        >
          <rect x={8} y={0} width={76} height={28} rx={7}
            fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          <text x={46} y={17} textAnchor="middle"
            style={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>
            Cancel
          </text>
        </g>
      </g>
    );
  }

  return (
    <g style={{ isolation: 'isolate' } as any}>
      {/* Invisible bridge */}
      <rect
        x={flipLeft ? xOffset - 8 : size * 0.55}
        y={-tooltipH / 2}
        width={tooltipW + 24}
        height={tooltipH}
        fill="transparent"
      />
      {/* Card background */}
      <rect
        x={xOffset}
        y={-tooltipH / 2}
        width={tooltipW}
        height={tooltipH}
        rx={10}
        fill="rgba(9,13,24,0.99)"
        stroke={`${color.stroke}55`}
        strokeWidth={1.3}
      />
      {/* Title */}
      <text x={xOffset + 14} y={-tooltipH / 2 + 19}
        style={{ fill: color.text, fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
        {flower.entity_name.length > 28 ? flower.entity_name.slice(0, 28) + '…' : flower.entity_name}
      </text>
      <text x={xOffset + 14} y={-tooltipH / 2 + 32}
        style={{ fill: 'rgba(255,255,255,0.32)', fontSize: 8, fontFamily: 'Inter, sans-serif' }}>
        {flower.flower_label} · {flower.petals.length} sub-entities
      </text>
      <line
        x1={xOffset + 10} y1={-tooltipH / 2 + 38}
        x2={xOffset + tooltipW - 10} y2={-tooltipH / 2 + 38}
        stroke={`${color.stroke}22`} strokeWidth={1}
      />

      {flower.petals.map((petal, i) => {
        const rowY = -tooltipH / 2 + 48 + i * petalRowH;
        return (
          <g key={petal.id}>
            <circle cx={xOffset + 20} cy={rowY + 10} r={3.5} fill={getPetalFill(flower.color_theme)} stroke={color.stroke} strokeWidth={1} />
            <foreignObject x={xOffset + 30} y={rowY} width={tooltipW - 58} height={petalRowH}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.78)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4, paddingTop: 2, wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                <span style={{ fontWeight: 600, color: color.text }}>{petal.petal_label}:</span>{' '}{petal.sub_entity_name}
              </div>
            </foreignObject>
            <g
              onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDeletePetal(flower.id, petal.id); }}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={xOffset + tooltipW - 14} cy={rowY + 10} r={11} fill="rgba(255,60,60,0.15)" />
              <text x={xOffset + tooltipW - 14} y={rowY + 15} textAnchor="middle"
                style={{ fill: 'rgba(255,80,80,0.9)', fontSize: 16, fontFamily: 'Inter, sans-serif', userSelect: 'none', fontWeight: 700, pointerEvents: 'none' }}>
                −
              </text>
            </g>
          </g>
        );
      })}

      {/* Delete flower button */}
      <g
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowDeleteConfirm(true); }}
        style={{ cursor: 'pointer' }}
      >
        <rect x={xOffset + 12} y={-tooltipH / 2 + tooltipH - 38} width={tooltipW - 24} height={26} rx={7}
          fill="rgba(255,50,50,0.09)" stroke="rgba(255,50,50,0.28)" strokeWidth={1} />
        <text x={xOffset + tooltipW / 2} y={-tooltipH / 2 + tooltipH - 22} textAnchor="middle"
          style={{ fill: 'rgba(255,80,80,0.8)', fontSize: 9, fontFamily: 'Inter, sans-serif', pointerEvents: 'none' }}>
          🗑 Delete Flower
        </text>
      </g>
    </g>
  );
}

function NeonFlowerShape({
  color, colorTheme, petalCount, size, glowIntensity,
  swayX, swayRot, petalPhase, flowerId,
}: {
  color: ReturnType<typeof getColorConfig>;
  colorTheme: string;
  petalCount: number;
  size: number;
  glowIntensity: number;
  swayX: number;
  swayRot: number;
  petalPhase: number;
  flowerId: string;
}) {
  const actualPetals = Math.max(1, Math.min(8, petalCount));
  const coreR = size * 0.22;
  const petalLen = size * 0.42;
  const petalW = size * 0.28;
  const coreFill = getSolidFill(colorTheme);
  const petalFill = getPetalFill(colorTheme);
  const highlightGradId = `fg-hl-${flowerId}`;

  return (
    <g style={{
      filter: `drop-shadow(0 0 ${7 * glowIntensity}px ${color.stroke}) drop-shadow(0 0 ${14 * glowIntensity}px ${color.glow})`,
      transform: `translateX(${swayX}px) rotate(${swayRot}deg)`,
    }}>
      <defs>
        <radialGradient id={highlightGradId} cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" stopOpacity={1} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" stopOpacity={1} />
        </radialGradient>
      </defs>

      {Array.from({ length: actualPetals }).map((_, i) => {
        const angle = (i / actualPetals) * Math.PI * 2 - Math.PI / 2;
        const pcx = Math.cos(angle) * (coreR + petalLen * 0.45);
        const pcy = Math.sin(angle) * (coreR + petalLen * 0.45);
        const rotDeg = (angle * 180) / Math.PI + 90;
        const petalStretch = 1 + Math.sin(petalPhase * Math.PI * 2) * 0.07;
        const petalTilt = Math.sin(petalPhase * Math.PI * 2) * 3.5;
        return (
          <ellipse key={i} cx={pcx} cy={pcy}
            rx={petalW * 0.46} ry={petalLen * 0.5 * petalStretch}
            fill={petalFill} stroke={color.stroke} strokeWidth={1.6}
            transform={`rotate(${rotDeg + petalTilt}, ${pcx}, ${pcy})`}
          />
        );
      })}

      <circle cx={0} cy={0} r={coreR} fill={coreFill} stroke={color.stroke} strokeWidth={2.2} />
      <circle cx={0} cy={0} r={coreR} fill={`url(#${highlightGradId})`} />
      <circle cx={0} cy={0} r={coreR * 0.36} fill={color.stroke} opacity={0.95} />
      <ellipse cx={-coreR * 0.35} cy={-coreR * 0.5} rx={coreR * 0.25} ry={coreR * 0.14} fill="rgba(255,255,255,0.4)" />
    </g>
  );
}

export default function FlowerNode({
  flower, isDeleting, isHovered, isSelected,
  compactView, isSnapTarget = false, canvasZoom = 1,
  onHover, onSelect, onDeletePetal, onDeleteFlower, onDragStart,
}: Props) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const insideRef = useRef(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);

  const cancelTimers = useCallback(() => {
    if (showTimerRef.current) { clearTimeout(showTimerRef.current); showTimerRef.current = null; }
    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
  }, []);

  const handleGroupEnter = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef.current) return;
    insideRef.current = true;
    cancelTimers();
    onHover(flower.id);
    showTimerRef.current = setTimeout(() => {
      if (insideRef.current && !isDraggingRef.current) setTooltipVisible(true);
    }, 280);
  }, [flower.id, onHover, cancelTimers]);

  const handleGroupLeave = useCallback((e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget as Element | null;
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) return;
    insideRef.current = false;
    cancelTimers();
    hideTimerRef.current = setTimeout(() => {
      if (!insideRef.current) {
        setTooltipVisible(false);
        setShowDeleteConfirm(false);
        onHover(null);
      }
    }, 120);
  }, [onHover, cancelTimers]);

  useEffect(() => () => cancelTimers(), [cancelTimers]);
  useEffect(() => {
    if (isDeleting) { setTooltipVisible(false); setShowDeleteConfirm(false); }
  }, [isDeleting]);

  const [swayX, setSwayX] = useState(0);
  const [swayRot, setSwayRot] = useState(0);
  const [petalPhase, setPetalPhase] = useState(0);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    let h = 0;
    for (let i = 0; i < flower.id.length; i++) h = (h * 31 + flower.id.charCodeAt(i)) >>> 0;
    const freq = 0.11 + ((h & 0xff) / 255) * 0.10;
    const phaseOffset = ((h >> 8) & 0xff) / 255;
    const timeOffset = ((h >> 16) & 0xffff) / 0xffff * 10;

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000 + timeOffset;
      const primary = Math.sin(elapsed * freq * Math.PI * 2 + phaseOffset * Math.PI * 2);
      const secondary = Math.sin(elapsed * freq * 1.618 * Math.PI * 2 + phaseOffset) * 0.38;
      const val = (primary + secondary) * 0.5;
      const zoomAmp = Math.max(1, 1.8 / Math.max(0.3, canvasZoom));
      setSwayX(val * 3.5 * zoomAmp);
      setSwayRot(val * 2.2 * zoomAmp);
      setPetalPhase(val * 0.5 + 0.5 - 0.13);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [flower.id, canvasZoom]);

  const color = getColorConfig(flower.color_theme);
  const size = compactView ? 38 : 46;
  const glowIntensity = isHovered || isSelected || isSnapTarget ? 1.9 : 1.0;
  const tx = flower.position_x;
  const ty = flower.position_y;

  return (
    <g
      transform={`translate(${tx}, ${ty})`}
      style={{
        cursor: isDeleting ? 'default' : 'grab',
        opacity: isDeleting ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }}
      onMouseEnter={handleGroupEnter}
      onMouseLeave={handleGroupLeave}
      onClick={(e) => {
        if (!isDraggingRef.current) {
          e.stopPropagation();
          onSelect(isSelected ? null : flower.id);
        }
      }}
      onMouseDown={(e) => {
        if (e.button === 0 && onDragStart) {
          isDraggingRef.current = true;
          cancelTimers();
          setTooltipVisible(false);
          onDragStart(e, flower.id);
        }
      }}
      onMouseUp={() => {
        setTimeout(() => { isDraggingRef.current = false; }, 80);
      }}
    >
      <g style={{
        transform: isDeleting ? 'scale(0.15)' : isHovered || isSnapTarget ? 'scale(1.07)' : 'scale(1)',
        transition: isDeleting ? 'transform 0.35s ease-in' : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transformOrigin: '0px 0px',
      }}>
        {isSnapTarget && (
          <circle cx={0} cy={0} r={size * 0.85}
            fill="none" stroke={color.stroke} strokeWidth={2.8} opacity={0.9}
            style={{ animation: 'snapFlash 0.45s ease-in-out infinite alternate' }}
          />
        )}
        {isSelected && (
          <circle cx={0} cy={0} r={size * 0.78}
            fill="none" stroke={color.stroke} strokeWidth={2}
            strokeDasharray="4 4" opacity={0.65}
          />
        )}
        <NeonFlowerShape
          color={color} colorTheme={flower.color_theme}
          petalCount={flower.petals.length} size={size}
          glowIntensity={glowIntensity} swayX={swayX}
          swayRot={swayRot} petalPhase={petalPhase} flowerId={flower.id}
        />
        {isHovered && flower.petals.map((petal, i) => {
          const angle = (i / flower.petals.length) * Math.PI * 2 - Math.PI / 2;
          const dotR = size * 0.78 + 14;
          return (
            <g key={petal.id}>
              <circle cx={Math.cos(angle) * dotR} cy={Math.sin(angle) * dotR} r={4.5}
                fill={getPetalFill(flower.color_theme)} stroke={color.stroke} strokeWidth={1.4}
                style={{ filter: `drop-shadow(0 0 3px ${color.stroke})` }}
              />
              <circle cx={Math.cos(angle) * dotR} cy={Math.sin(angle) * dotR} r={2} fill={color.stroke} opacity={0.9} />
            </g>
          );
        })}
      </g>

      {/* Task 9: tooltip rendered LAST inside this g so it paints on top in SVG order */}
      {tooltipVisible && isHovered && (
        <FlowerTooltip
          flower={flower}
          size={size}
          color={color}
          onDeletePetal={onDeletePetal}
          onDeleteFlower={onDeleteFlower}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          flipLeft={flower.position_x > 80}
        />
      )}
    </g>
  );
}

export interface FlowerTooltipState {
  flowerId: string;
  visible: boolean;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
}