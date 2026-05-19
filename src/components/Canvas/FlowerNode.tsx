import { useState, useEffect, useRef } from 'react';
import { Flower } from '../../store/useStore';
import { getColorConfig } from '../../utils/layout';

interface Props {
  flower: Flower;
  isDeleting: boolean;
  isHovered: boolean;
  isSelected: boolean;
  compactView: boolean;
  isSnapTarget?: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  onDeletePetal: (flowerId: string, petalId: string) => void;
  onDeleteFlower: (flowerId: string) => void;
  onEditFlower: (flowerId: string, name: string) => void;
  onDragStart?: (e: React.MouseEvent, flowerId: string) => void;
  appearing?: boolean;
}

// Unique per-flower sway seed so each flower moves differently
function useSwaySeed(id: string) {
  const seed = useRef<number>(0);
  useEffect(() => {
    // deterministic but varied per flower
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    seed.current = h;
  }, [id]);
  return seed;
}

function NeonFlowerShape({
  color,
  petalCount,
  size,
  glowIntensity,
  swayPhase,
  flowerId,
}: {
  color: ReturnType<typeof getColorConfig>;
  petalCount: number;
  size: number;
  glowIntensity: number;
  swayPhase: number; // 0..1 oscillation value
  flowerId: string;
}) {
  const actualPetals = Math.max(3, Math.min(12, petalCount));
  const coreR = size * 0.22;
  const petalLen = size * 0.42;
  const petalW = size * 0.28;

  // Unique gradient IDs per flower to avoid SVG id collision
  const gradId = `fg-${flowerId}`;
  const fillGradId = `fg-fill-${flowerId}`;

  // Sway: small translation + rotation driven by swayPhase
  const swayX = Math.sin(swayPhase * Math.PI * 2) * 2.5;
  const swayRot = Math.sin(swayPhase * Math.PI * 2) * 1.8;

  return (
    <g
      style={{
        filter: `drop-shadow(0 0 ${6 * glowIntensity}px ${color.stroke}) drop-shadow(0 0 ${12 * glowIntensity}px ${color.glow})`,
        transform: `translateX(${swayX}px) rotate(${swayRot}deg)`,
        // No CSS transition here — animation is frame-driven via JS
      }}
    >
      <defs>
        {/* Radial gradient for core */}
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color.stroke} stopOpacity={0.55} />
          <stop offset="100%" stopColor={color.stroke} stopOpacity={0.08} />
        </radialGradient>
        {/* Radial gradient for petal fill */}
        <radialGradient id={fillGradId} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor={color.stroke} stopOpacity={0.55} />
          <stop offset="100%" stopColor={color.stroke} stopOpacity={0.18} />
        </radialGradient>
      </defs>

      {/* Petals — filled + independent flutter lag */}
      {Array.from({ length: actualPetals }).map((_, i) => {
        const angle = (i / actualPetals) * Math.PI * 2 - Math.PI / 2;
        const cx = Math.cos(angle) * (coreR + petalLen * 0.45);
        const cy = Math.sin(angle) * (coreR + petalLen * 0.45);
        const rotDeg = (angle * 180) / Math.PI + 90;

        // Each petal lags the sway by a small fraction (secondary motion)
        const petalLag = 0.12;
        const petalPhase = swayPhase - petalLag;
        const petalStretch = 1 + Math.sin(petalPhase * Math.PI * 2) * 0.06;
        const petalTilt = Math.sin(petalPhase * Math.PI * 2) * 3;

        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={petalW * 0.45}
            ry={petalLen * 0.5 * petalStretch}
            // Point 6: filled with gradient, not hollow
            fill={`url(#${fillGradId})`}
            stroke={color.stroke}
            strokeWidth={1.4}
            transform={`rotate(${rotDeg + petalTilt}, ${cx}, ${cy})`}
            style={{ opacity: 0.92 }}
          />
        );
      })}

      {/* Core circle — filled */}
      <circle
        cx={0} cy={0} r={coreR}
        fill={`url(#${gradId})`}
        stroke={color.stroke}
        strokeWidth={1.8}
      />
      {/* Inner bright dot */}
      <circle cx={0} cy={0} r={coreR * 0.52} fill={color.stroke} opacity={0.72} />
      {/* Specular highlight */}
      <ellipse cx={-coreR * 0.4} cy={-coreR * 0.58} rx={coreR * 0.3} ry={coreR * 0.18} fill="rgba(255,255,255,0.3)" />
    </g>
  );
}

export default function FlowerNode({
  flower,
  isDeleting,
  isHovered,
  isSelected,
  compactView,
  isSnapTarget = false,
  onHover,
  onSelect,
  onDeletePetal,
  onDeleteFlower,
  onDragStart,
}: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Point 7 & 8: sway animation state
  const seed = useSwaySeed(flower.id);
  const [swayPhase, setSwayPhase] = useState(0);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    // Derive per-flower timing from seed
    const s = seed.current;
    // freq between 0.12 and 0.22 Hz — slow, organic
    const freq = 0.12 + ((s & 0xff) / 255) * 0.10;
    // phase offset so flowers don't all sway in sync
    const phaseOffset = ((s >> 8) & 0xff) / 255;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000; // seconds
      // Combine two sine waves for irregular, organic motion
      const primary = Math.sin(elapsed * freq * Math.PI * 2 + phaseOffset * Math.PI * 2);
      const secondary = Math.sin(elapsed * freq * 1.618 * Math.PI * 2 + phaseOffset) * 0.35;
      setSwayPhase((primary + secondary) * 0.5 + 0.5); // normalise to 0..1
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [seed]);

  const color = getColorConfig(flower.color_theme);
  const size = compactView ? 38 : 46;
  const glowIntensity = isHovered || isSelected || isSnapTarget ? 1.8 : 1.0;

  // Point 5: smooth tooltip — no blink. Use separate hover state from parent.
  // We control our own tooltip timer here, not dependent on parent re-render.
  const handleMouseEnter = () => {
    onHover(flower.id);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setShowTooltip(true), 250);
  };

  const handleMouseLeave = () => {
    onHover(null);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setShowTooltip(false);
    setShowDeleteConfirm(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  const tooltipW = 208;
  const tooltipH = 52 + flower.petals.length * 24 + 34;
  const tx = flower.position_x;
  const ty = flower.position_y;

  return (
    // Point 4: tooltip z-ordering — render tooltip in a portal-like top-level group
    // We achieve front-rendering by structure: tooltip rendered LAST inside this g
    // Canvas renders all FlowerNodes then a separate <TooltipLayer> on top
    <g
      style={{
        cursor: 'grab',
        opacity: isDeleting ? 0 : 1,
        transform: `translate(${tx}px, ${ty}px) scale(${
          isDeleting ? 0.15 : isHovered || isSnapTarget ? 1.07 : 1
        })`,
        transition: isDeleting
          ? 'transform 0.35s ease-in, opacity 0.3s ease-in'
          : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s',
        transformOrigin: `${tx}px ${ty}px`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(isSelected ? null : flower.id)}
      onMouseDown={(e) => {
        if (e.button === 0 && onDragStart) {
          e.stopPropagation();
          onDragStart(e, flower.id);
        }
      }}
    >
      {/* Snap-target flash ring */}
      {isSnapTarget && (
        <circle
          cx={0} cy={0} r={size * 0.8}
          fill="none"
          stroke={color.stroke}
          strokeWidth={2.5}
          opacity={0.85}
          style={{ animation: 'snapFlash 0.5s ease-in-out infinite alternate' }}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <circle cx={0} cy={0} r={size * 0.75}
          fill="none"
          stroke={color.stroke}
          strokeWidth={2}
          strokeDasharray="4 4"
          opacity={0.6}
        />
      )}

      <NeonFlowerShape
        color={color}
        petalCount={flower.petals.length}
        size={size}
        glowIntensity={glowIntensity}
        swayPhase={swayPhase}
        flowerId={flower.id}
      />

      {/* Petal dots visible on hover */}
      {isHovered && flower.petals.map((petal, i) => {
        const angle = (i / flower.petals.length) * Math.PI * 2 - Math.PI / 2;
        const dotR = size * 0.75 + 14;
        const dpx = Math.cos(angle) * dotR;
        const dpy = Math.sin(angle) * dotR;
        return (
          <g key={petal.id}>
            <circle cx={dpx} cy={dpy} r={4.5}
              fill={color.fill} stroke={color.stroke} strokeWidth={1.2}
              style={{ filter: `drop-shadow(0 0 3px ${color.stroke})` }}
            />
            <circle cx={dpx} cy={dpy} r={2} fill={color.stroke} opacity={0.8} />
          </g>
        );
      })}
    </g>
  );
}

// Point 4: Exported tooltip component rendered separately at top z-level
export function FlowerTooltipLayer({
  flower,
  isHovered,
  showTooltip,
  showDeleteConfirm,
  setShowDeleteConfirm,
  onDeletePetal,
  onDeleteFlower,
  compactView,
}: {
  flower: Flower;
  isHovered: boolean;
  showTooltip: boolean;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  onDeletePetal: (fid: string, pid: string) => void;
  onDeleteFlower: (fid: string) => void;
  compactView: boolean;
}) {
  const color = getColorConfig(flower.color_theme);
  const size = compactView ? 38 : 46;
  const tooltipW = 208;
  const tooltipH = 52 + flower.petals.length * 24 + 34;
  const tx = flower.position_x;
  const ty = flower.position_y;

  if (!isHovered) return null;

  return (
    <g transform={`translate(${tx}, ${ty})`} style={{ pointerEvents: 'none' }}>
      {showTooltip && !showDeleteConfirm && (
        <g style={{ pointerEvents: 'all' }} onClick={(e) => e.stopPropagation()}>
          <rect
            x={size * 0.65 + 6}
            y={-tooltipH / 2}
            width={tooltipW}
            height={tooltipH}
            rx={10}
            fill="rgba(9,13,24,0.98)"
            stroke={`${color.stroke}45`}
            strokeWidth={1.2}
          />
          <text x={size * 0.65 + 18} y={-tooltipH / 2 + 18}
            style={{ fill: color.text, fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
            {flower.entity_name.length > 24 ? flower.entity_name.slice(0, 24) + '…' : flower.entity_name}
          </text>
          <text x={size * 0.65 + 18} y={-tooltipH / 2 + 30}
            style={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontFamily: 'Inter, sans-serif' }}>
            {flower.flower_label} · {flower.petals.length} sub-entities
          </text>
          <line
            x1={size * 0.65 + 14} y1={-tooltipH / 2 + 36}
            x2={size * 0.65 + tooltipW - 14} y2={-tooltipH / 2 + 36}
            stroke={`${color.stroke}25`} strokeWidth={1}
          />
          {flower.petals.map((petal, i) => (
            <g key={petal.id} style={{ pointerEvents: 'all' }}>
              <circle cx={size * 0.65 + 22} cy={-tooltipH / 2 + 50 + i * 24}
                r={3.5} fill={color.fill} stroke={color.stroke} strokeWidth={1} />
              <text x={size * 0.65 + 32} y={-tooltipH / 2 + 54 + i * 24}
                style={{ fill: 'rgba(255,255,255,0.72)', fontSize: 9, fontFamily: 'Inter, sans-serif' }}>
                {petal.petal_label}: {petal.sub_entity_name.length > 20 ? petal.sub_entity_name.slice(0, 20) + '…' : petal.sub_entity_name}
              </text>
              <g onClick={(e) => { e.stopPropagation(); onDeletePetal(flower.id, petal.id); }}
                style={{ cursor: 'pointer', pointerEvents: 'all' }}>
                <circle cx={size * 0.65 + tooltipW - 16} cy={-tooltipH / 2 + 50 + i * 24} r={9}
                  fill="rgba(255,70,70,0.07)" />
                <text x={size * 0.65 + tooltipW - 16} y={-tooltipH / 2 + 55 + i * 24}
                  textAnchor="middle"
                  style={{ fill: 'rgba(255,80,80,0.7)', fontSize: 14, fontFamily: 'Inter, sans-serif', userSelect: 'none' }}>
                  −
                </text>
              </g>
            </g>
          ))}
          <g onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
            style={{ cursor: 'pointer', pointerEvents: 'all' }}>
            <rect x={size * 0.65 + 14} y={-tooltipH / 2 + tooltipH - 30}
              width={tooltipW - 28} height={22} rx={6}
              fill="rgba(255,50,50,0.07)" stroke="rgba(255,50,50,0.2)" strokeWidth={1} />
            <text x={size * 0.65 + tooltipW / 2 + 10} y={-tooltipH / 2 + tooltipH - 15}
              textAnchor="middle"
              style={{ fill: 'rgba(255,80,80,0.65)', fontSize: 9, fontFamily: 'Inter, sans-serif' }}>
              🗑 Delete Flower
            </text>
          </g>
        </g>
      )}
      {showDeleteConfirm && (
        <g style={{ pointerEvents: 'all' }} onClick={(e) => e.stopPropagation()}>
          <rect x={-92} y={-52} width={184} height={90} rx={10}
            fill="rgba(9,13,24,0.99)" stroke="rgba(255,70,70,0.35)" strokeWidth={1.5} />
          <text x={0} y={-28} textAnchor="middle"
            style={{ fill: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
            Remove this concept?
          </text>
          <text x={0} y={-13} textAnchor="middle"
            style={{ fill: 'rgba(255,255,255,0.38)', fontSize: 8.5, fontFamily: 'Inter, sans-serif' }}>
            This triggers garden regeneration
          </text>
          <g onClick={() => onDeleteFlower(flower.id)} style={{ cursor: 'pointer', pointerEvents: 'all' }}>
            <rect x={-82} y={-2} width={74} height={26} rx={7}
              fill="rgba(255,50,50,0.18)" stroke="rgba(255,50,50,0.4)" strokeWidth={1} />
            <text x={-45} y={13} textAnchor="middle"
              style={{ fill: '#ff6060', fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              Confirm
            </text>
          </g>
          <g onClick={() => setShowDeleteConfirm(false)} style={{ cursor: 'pointer', pointerEvents: 'all' }}>
            <rect x={8} y={-2} width={74} height={26} rx={7}
              fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            <text x={45} y={13} textAnchor="middle"
              style={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>
              Cancel
            </text>
          </g>
        </g>
      )}
    </g>
  );
}