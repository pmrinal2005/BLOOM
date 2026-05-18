import { Flower } from '../store/useStore';

export function calculateFlowerPositions(count: number, compactView: boolean): Array<{ x: number; y: number; ring: number }> {
  const positions: Array<{ x: number; y: number; ring: number }> = [];
  const baseRadius = compactView ? 200 : 260;
  const secondaryRadius = compactView ? 360 : 440;
  const tertiaryRadius = compactView ? 520 : 640;

  if (count === 0) return positions;

  if (count <= 6) {
    // Primary ring only
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      positions.push({
        x: Math.cos(angle) * baseRadius,
        y: Math.sin(angle) * baseRadius,
        ring: 0,
      });
    }
  } else if (count <= 10) {
    // Primary + secondary rings
    const primaryCount = 6;
    const secondaryCount = count - primaryCount;
    
    for (let i = 0; i < primaryCount; i++) {
      const angle = (i / primaryCount) * Math.PI * 2 - Math.PI / 2;
      positions.push({ x: Math.cos(angle) * baseRadius, y: Math.sin(angle) * baseRadius, ring: 0 });
    }
    for (let i = 0; i < secondaryCount; i++) {
      const angle = (i / secondaryCount) * Math.PI * 2 - Math.PI / 4;
      positions.push({ x: Math.cos(angle) * secondaryRadius, y: Math.sin(angle) * secondaryRadius, ring: 1 });
    }
  } else {
    // Three rings
    const primaryCount = 6;
    const secondaryCount = 5;
    const tertiaryCount = count - primaryCount - secondaryCount;

    for (let i = 0; i < primaryCount; i++) {
      const angle = (i / primaryCount) * Math.PI * 2 - Math.PI / 2;
      positions.push({ x: Math.cos(angle) * baseRadius, y: Math.sin(angle) * baseRadius, ring: 0 });
    }
    for (let i = 0; i < secondaryCount; i++) {
      const angle = (i / secondaryCount) * Math.PI * 2 - Math.PI / 4;
      positions.push({ x: Math.cos(angle) * secondaryRadius, y: Math.sin(angle) * secondaryRadius, ring: 1 });
    }
    for (let i = 0; i < tertiaryCount; i++) {
      const angle = (i / tertiaryCount) * Math.PI * 2;
      positions.push({ x: Math.cos(angle) * tertiaryRadius, y: Math.sin(angle) * tertiaryRadius, ring: 2 });
    }
  }

  return positions;
}

export function assignPositions(flowers: Flower[], compactView: boolean): Flower[] {
  const positions = calculateFlowerPositions(flowers.length, compactView);
  return flowers.map((flower, i) => ({
    ...flower,
    position_x: positions[i]?.x ?? flower.position_x,
    position_y: positions[i]?.y ?? flower.position_y,
    ring: positions[i]?.ring ?? 0,
  }));
}

export function getColorConfig(colorTheme: string) {
  const colorMap: Record<string, { glow: string; stroke: string; fill: string; text: string; bg: string; border: string }> = {
    cyan: {
      glow: 'rgba(0, 255, 255, 0.6)',
      stroke: '#00ffff',
      fill: 'rgba(0, 255, 255, 0.15)',
      text: '#00ffff',
      bg: 'rgba(0, 255, 255, 0.1)',
      border: 'rgba(0, 255, 255, 0.4)',
    },
    green: {
      glow: 'rgba(57, 255, 20, 0.6)',
      stroke: '#39ff14',
      fill: 'rgba(57, 255, 20, 0.15)',
      text: '#39ff14',
      bg: 'rgba(57, 255, 20, 0.1)',
      border: 'rgba(57, 255, 20, 0.4)',
    },
    pink: {
      glow: 'rgba(255, 16, 240, 0.6)',
      stroke: '#ff10f0',
      fill: 'rgba(255, 16, 240, 0.15)',
      text: '#ff10f0',
      bg: 'rgba(255, 16, 240, 0.1)',
      border: 'rgba(255, 16, 240, 0.4)',
    },
    orange: {
      glow: 'rgba(255, 165, 0, 0.6)',
      stroke: '#ffa500',
      fill: 'rgba(255, 165, 0, 0.15)',
      text: '#ffa500',
      bg: 'rgba(255, 165, 0, 0.1)',
      border: 'rgba(255, 165, 0, 0.4)',
    },
    blue: {
      glow: 'rgba(30, 144, 255, 0.6)',
      stroke: '#1e90ff',
      fill: 'rgba(30, 144, 255, 0.15)',
      text: '#1e90ff',
      bg: 'rgba(30, 144, 255, 0.1)',
      border: 'rgba(30, 144, 255, 0.4)',
    },
    purple: {
      glow: 'rgba(180, 0, 255, 0.6)',
      stroke: '#b400ff',
      fill: 'rgba(180, 0, 255, 0.15)',
      text: '#b400ff',
      bg: 'rgba(180, 0, 255, 0.1)',
      border: 'rgba(180, 0, 255, 0.4)',
    },
    yellow: {
      glow: 'rgba(255, 255, 0, 0.6)',
      stroke: '#ffff00',
      fill: 'rgba(255, 255, 0, 0.15)',
      text: '#ffff00',
      bg: 'rgba(255, 255, 0, 0.1)',
      border: 'rgba(255, 255, 0, 0.4)',
    },
  };
  return colorMap[colorTheme] || colorMap.cyan;
}

export function cubicBezierPath(
  x1: number, y1: number,
  x2: number, y2: number
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.min(dist * 0.35, 120);

  // Perpendicular offset for natural curve
  const nx = -dy / dist;
  const ny = dx / dist;
  const offset = curvature * 0.5;

  const cp1x = x1 + dx * 0.35 + nx * offset;
  const cp1y = y1 + dy * 0.35 + ny * offset;
  const cp2x = x1 + dx * 0.65 - nx * offset;
  const cp2y = y1 + dy * 0.65 - ny * offset;

  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}
