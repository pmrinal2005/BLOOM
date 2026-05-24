import { useState } from 'react';
import { useStore } from '../../store/useStore';

interface Props {
  pulseBright: boolean;
}

export default function CentralOrb({ pulseBright }: Props) {
  const { modelParams, growthMode, theme } = useStore();
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isDark = theme === 'dark';

  const orbSize = 90;
  const r = orbSize / 2;

  return (
    <g>
      {/* Outer ring glow circles */}
      <circle cx={0} cy={0} r={r + 40} fill="none" stroke="rgba(0,220,255,0.04)" strokeWidth={1} />
      <circle cx={0} cy={0} r={r + 60} fill="none" stroke="rgba(0,220,255,0.03)" strokeWidth={1} />
      <circle cx={0} cy={0} r={r + 80} fill="none" stroke="rgba(0,220,255,0.02)" strokeWidth={1} />

      {/* Animated rings */}
      <g style={{ transformOrigin: '0 0' }} className="orb-ring-1">
        <ellipse cx={0} cy={0} rx={r + 28} ry={r + 12} fill="none" stroke="rgba(0,220,255,0.15)" strokeWidth={1.5} strokeDasharray="4 8" />
      </g>
      <g style={{ transformOrigin: '0 0' }} className="orb-ring-2">
        <ellipse cx={0} cy={0} rx={r + 22} ry={r + 16} fill="none" stroke="rgba(180,0,255,0.12)" strokeWidth={1} strokeDasharray="3 12" />
      </g>

      <defs>
        <radialGradient id="orbGradient" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="rgba(200,255,255,0.9)" />
          <stop offset="35%" stopColor="rgba(0,220,255,0.8)" />
          <stop offset="65%" stopColor="rgba(0,120,200,0.6)" />
          <stop offset="100%" stopColor="rgba(0,40,80,0.3)" />
        </radialGradient>
        <radialGradient id="orbGlowBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,220,255,0.35)" />
          <stop offset="100%" stopColor="rgba(0,220,255,0)" />
        </radialGradient>
        <filter id="orbBlur">
          <feGaussianBlur stdDeviation={pulseBright ? 12 : 8} />
        </filter>
        <filter id="orbBlurLight">
          <feGaussianBlur stdDeviation={3} />
        </filter>
        {/* Task 7: dark mode filter — invert white bg to black, preserve blue lines */}
        <filter id="orbImgFilterDark">
          <feColorMatrix type="matrix"
            values="-1 0 0 0 1
                    0 -1 0 0 1
                    0 0 -1 0 1
                    0 0 0 1 0"
          />
        </filter>
        <clipPath id="orbCircleClip">
          <circle cx={0} cy={0} r={r - 1} />
        </clipPath>
      </defs>

      {/* Outer glow background */}
      <circle cx={0} cy={0} r={r + 35} fill="url(#orbGlowBg)" filter="url(#orbBlur)" />

      {/* Core orb */}
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          cursor: 'default',
          filter: pulseBright
            ? 'drop-shadow(0 0 25px rgba(0,220,255,1)) drop-shadow(0 0 50px rgba(0,220,255,0.6))'
            : hovered
            ? 'drop-shadow(0 0 20px rgba(0,220,255,0.9)) drop-shadow(0 0 35px rgba(0,220,255,0.4))'
            : 'drop-shadow(0 0 15px rgba(0,220,255,0.7)) drop-shadow(0 0 25px rgba(0,220,255,0.3))',
          transition: 'filter 0.3s',
        }}
        className={pulseBright ? 'orb-pulse-bright' : 'orb-pulse'}
      >
        {/* Shadow circle */}
        <circle cx={2} cy={4} r={r} fill="rgba(0,20,40,0.5)" filter="url(#orbBlurLight)" />

        {/* Task 7: show orb.png inside circle, with dark mode invert filter */}
        {!imgError ? (
          <>
            {/* Background fill for image */}
            <circle cx={0} cy={0} r={r} fill={isDark ? '#000000' : '#ffffff'} />
            {/* orb.png clipped to circle */}
            <image
              href="/images/orb.png"
              x={-r}
              y={-r}
              width={orbSize}
              height={orbSize}
              clipPath="url(#orbCircleClip)"
              preserveAspectRatio="xMidYMid meet"
              // Task 7: in dark mode, invert white→black while preserving blue lines
              filter={isDark ? 'url(#orbImgFilterDark)' : undefined}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          /* Fallback: original gradient orb */
          <>
            <circle cx={0} cy={0} r={r} fill="url(#orbGradient)" />
            <polygon points="0,-18 16,12 -16,12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeLinejoin="round" />
            <polygon points="0,-10 10,7 -10,7" fill="rgba(255,255,255,0.08)" />
            <ellipse cx={-12} cy={-18} rx={8} ry={5} fill="rgba(255,255,255,0.25)" />
          </>
        )}

        {/* Outer rim always shown */}
        <circle cx={0} cy={0} r={r} fill="none" stroke="rgba(0,220,255,0.6)" strokeWidth={1.5} />
        <circle cx={0} cy={0} r={r - 3} fill="none" stroke="rgba(0,220,255,0.2)" strokeWidth={0.5} />
      </g>

      {/* Orb label */}
      <text x={0} y={r + 20} textAnchor="middle" style={{ fill: 'rgba(0,220,255,0.9)', fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
        Gemma 4 Core Soul
      </text>

      {/* Tooltip on hover */}
      {hovered && (
        <g style={{ zIndex: 9999 }}>
          <rect x={-80} y={r + 28} width={160} height={56} rx={8} fill="rgba(13,17,32,0.97)" stroke="rgba(0,220,255,0.2)" strokeWidth={1} />
          <text x={0} y={r + 46} textAnchor="middle" style={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>
            Model: google/gemma-4-27b
          </text>
          <text x={0} y={r + 60} textAnchor="middle" style={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9, fontFamily: 'Inter, sans-serif' }}>
            Temp: {modelParams.temperature} • Mode: {growthMode}
          </text>
          <text x={0} y={r + 73} textAnchor="middle" style={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9, fontFamily: 'Inter, sans-serif' }}>
            Top-P: {modelParams.top_p} • Top-K: {modelParams.top_k}
          </text>
        </g>
      )}
    </g>
  );
}