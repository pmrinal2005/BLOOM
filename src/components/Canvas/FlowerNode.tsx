import { useState, useEffect } from 'react';
import { Flower } from '../../store/useStore';
import { getColorConfig } from '../../utils/layout';

interface Props {
  flower: Flower;
  isDeleting: boolean;
  isHovered: boolean;
  isSelected: boolean;
  compactView: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  onDeletePetal: (flowerId: string, petalId: string) => void;
  onDeleteFlower: (flowerId: string) => void;
  onEditFlower: (flowerId: string, name: string) => void;
  appearing?: boolean;
}

function NeonFlowerShape({
  color,
  petalCount,
  size,
  glowIntensity,
}: {
  color: ReturnType<typeof getColorConfig>;
  petalCount: number;
  size: number;
  glowIntensity: number;
}) {
  const actualPetals = Math.max(3, Math.min(12, petalCount));
  const coreR = size * 0.22;
  const petalLen = size * 0.42;
  const petalW = size * 0.28;
  const gradId = `fg-${color.stroke.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <g style={{
      filter: `drop-shadow(0 0 ${6 * glowIntensity}px ${color.stroke}) drop-shadow(0 0 ${12 * glowIntensity}px ${color.glow})`,
    }}>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color.stroke} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color.stroke} stopOpacity={0.05} />
        </radialGradient>
      </defs>
      {Array.from({ length: actualPetals }).map((_, i) => {
        const angle = (i / actualPetals) * Math.PI * 2 - Math.PI / 2;
        const cx = Math.cos(angle) * (coreR + petalLen * 0.45);
        const cy = Math.sin(angle) * (coreR + petalLen * 0.45);
        const rotDeg = (angle * 180) / Math.PI + 90;
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={petalW * 0.45}
            ry={petalLen * 0.5}
            fill={color.fill}
            stroke={color.stroke}
            strokeWidth={1.2}
            transform={`rotate(${rotDeg}, ${cx}, ${cy})`}
          />
        );
      })}
      <circle cx={0} cy={0} r={coreR} fill={`url(#${gradId})`} stroke={color.stroke} strokeWidth={1.5} />
      <circle cx={0} cy={0} r={coreR * 0.55} fill={color.stroke} opacity={0.6} />
      <ellipse cx={-coreR * 0.4} cy={-coreR * 0.6} rx={coreR * 0.3} ry={coreR * 0.18} fill="rgba(255,255,255,0.25)" />
    </g>
  );
}

export default function FlowerNode({
  flower,
  isDeleting,
  isHovered,
  isSelected,
  compactView,
  onHover,
  onSelect,
  onDeletePetal,
  onDeleteFlower,
}: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const color = getColorConfig(flower.color_theme);
  const size = compactView ? 38 : 46;
  const glowIntensity = isHovered || isSelected ? 1.6 : 1.0;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isHovered) {
      timeout = setTimeout(() => setShowTooltip(true), 200);
    } else {
      setShowTooltip(false);
      setShowDeleteConfirm(false);
    }
    return () => clearTimeout(timeout);
  }, [isHovered]);

  const tooltipW = 208;
  const tooltipH = 52 + flower.petals.length * 24 + 34;
  const tx = flower.position_x;
  const ty = flower.position_y;

  return (
    <g
      style={{
        cursor: 'pointer',
        opacity: isDeleting ? 0 : 1,
        transform: `translate(${tx}px, ${ty}px) scale(${isDeleting ? 0.15 : isHovered ? 1.07 : 1})`,
        transition: isDeleting
          ? 'transform 0.35s ease-in, opacity 0.3s ease-in'
          : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transformOrigin: `${tx}px ${ty}px`,
      }}
      onMouseEnter={() => onHover(flower.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(isSelected ? null : flower.id)}
    >
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

      <NeonFlowerShape color={color} petalCount={flower.petals.length} size={size} glowIntensity={glowIntensity} />

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

      {/* Tooltip panel */}
      {showTooltip && !showDeleteConfirm && (
        <g onClick={(e) => e.stopPropagation()} style={{ cursor: 'default' }}>
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
          {/* Title */}
          <text x={size * 0.65 + 18} y={-tooltipH / 2 + 18}
            style={{ fill: color.text, fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
            {flower.entity_name.length > 24 ? flower.entity_name.slice(0, 24) + '…' : flower.entity_name}
          </text>
          <text x={size * 0.65 + 18} y={-tooltipH / 2 + 30}
            style={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontFamily: 'Inter, sans-serif' }}>
            {flower.flower_label} · {flower.petals.length} sub-entities
          </text>
          {/* Divider */}
          <line
            x1={size * 0.65 + 14} y1={-tooltipH / 2 + 36}
            x2={size * 0.65 + tooltipW - 14} y2={-tooltipH / 2 + 36}
            stroke={`${color.stroke}25`} strokeWidth={1}
          />
          {/* Petals */}
          {flower.petals.map((petal, i) => (
            <g key={petal.id}>
              <circle cx={size * 0.65 + 22} cy={-tooltipH / 2 + 50 + i * 24}
                r={3.5} fill={color.fill} stroke={color.stroke} strokeWidth={1} />
              <text x={size * 0.65 + 32} y={-tooltipH / 2 + 54 + i * 24}
                style={{ fill: 'rgba(255,255,255,0.72)', fontSize: 9, fontFamily: 'Inter, sans-serif' }}>
                {petal.petal_label}: {petal.sub_entity_name.length > 20 ? petal.sub_entity_name.slice(0, 20) + '…' : petal.sub_entity_name}
              </text>
              {/* Delete petal */}
              <g onClick={(e) => { e.stopPropagation(); onDeletePetal(flower.id, petal.id); }}
                style={{ cursor: 'pointer' }}>
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
          {/* Delete flower */}
          <g onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} style={{ cursor: 'pointer' }}>
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

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <g onClick={(e) => e.stopPropagation()} style={{ cursor: 'default' }}>
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
          <g onClick={() => onDeleteFlower(flower.id)} style={{ cursor: 'pointer' }}>
            <rect x={-82} y={-2} width={74} height={26} rx={7}
              fill="rgba(255,50,50,0.18)" stroke="rgba(255,50,50,0.4)" strokeWidth={1} />
            <text x={-45} y={13} textAnchor="middle"
              style={{ fill: '#ff6060', fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              Confirm
            </text>
          </g>
          <g onClick={() => setShowDeleteConfirm(false)} style={{ cursor: 'pointer' }}>
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
