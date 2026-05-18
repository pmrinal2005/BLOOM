import { useStore } from '../../store/useStore';
import { RefreshCw, SlidersHorizontal } from 'lucide-react';

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  description: string;
  trackColor: string;
  onChange: (v: number) => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  description,
  trackColor,
  onChange,
}: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ marginBottom: 18 }}>
      {/* Label + value badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.82)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6,
            padding: '2px 8px',
            minWidth: 44,
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {displayValue}
        </span>
      </div>

      {/* Track + thumb */}
      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        {/* Grey background track */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 5,
            borderRadius: 3,
            background: 'rgba(255,255,255,0.09)',
          }}
        />
        {/* Colored fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${pct}%`,
            height: 5,
            borderRadius: 3,
            background: trackColor,
            transition: 'width 0.04s',
          }}
        />
        {/* White thumb circle */}
        <div
          style={{
            position: 'absolute',
            left: `calc(${pct}% - 9px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.55)',
            pointerEvents: 'none',
            transition: 'left 0.04s',
            zIndex: 1,
          }}
        />
        {/* Invisible native input on top */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute',
            width: '100%',
            height: 20,
            opacity: 0,
            cursor: 'pointer',
            zIndex: 2,
            margin: 0,
            padding: 0,
          }}
        />
      </div>

      {/* Description */}
      {description && (
        <p
          style={{
            marginTop: 5,
            fontSize: 10,
            color: 'rgba(255,255,255,0.32)',
            lineHeight: 1.4,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export default function ModelControls({ onRegenerate }: { onRegenerate: () => void }) {
  const {
    modelParams,
    setModelParam,
    pendingParamChange,
    setPendingParamChange,
    generationStatus,
  } = useStore();

  const isLoading = generationStatus === 'loading';

  const handleRegenerate = () => {
    setPendingParamChange(false);
    onRegenerate();
  };

  const sliders: SliderRowProps[] = [
    {
      label: 'Temperature',
      value: modelParams.temperature,
      min: 0,
      max: 2,
      step: 0.01,
      displayValue: modelParams.temperature.toFixed(2),
      description:
        modelParams.temperature > 1.2
          ? 'Highly creative, exploratory outputs'
          : modelParams.temperature > 0.7
          ? 'Balanced creativity and coherence'
          : 'Focused, deterministic outputs',
      trackColor: '#e05a2b',
      onChange: (v) => setModelParam('temperature', v),
    },
    {
      label: 'Top P',
      value: modelParams.top_p,
      min: 0,
      max: 1,
      step: 0.01,
      displayValue: modelParams.top_p.toFixed(2),
      description:
        modelParams.top_p > 0.85
          ? 'Full probability spectrum'
          : modelParams.top_p > 0.5
          ? 'Moderate nucleus sampling'
          : 'Narrow token selection',
      trackColor: '#00c8d4',
      onChange: (v) => setModelParam('top_p', v),
    },
    {
      label: 'Top K',
      value: modelParams.top_k,
      min: 1,
      max: 100,
      step: 1,
      displayValue: String(modelParams.top_k),
      description:
        modelParams.top_k > 70
          ? 'Wide vocabulary sampling'
          : modelParams.top_k > 30
          ? 'Moderate token diversity'
          : 'Narrow focused sampling',
      trackColor: '#39c45a',
      onChange: (v) => setModelParam('top_k', v),
    },
    {
      label: 'Presence Penalty',
      value: modelParams.presence_penalty,
      min: 0,
      max: 2,
      step: 0.01,
      displayValue: modelParams.presence_penalty.toFixed(2),
      description:
        modelParams.presence_penalty > 1.0
          ? 'Strong topic diversification'
          : modelParams.presence_penalty > 0.4
          ? 'Moderate novelty encouragement'
          : 'Minimal repetition penalty',
      trackColor: '#a855f7',
      onChange: (v) => setModelParam('presence_penalty', v),
    },
    {
      label: 'Frequency Penalty',
      value: modelParams.frequency_penalty,
      min: 0,
      max: 2,
      step: 0.01,
      displayValue: modelParams.frequency_penalty.toFixed(2),
      description:
        modelParams.frequency_penalty > 1.0
          ? 'Aggressive repetition reduction'
          : modelParams.frequency_penalty > 0.3
          ? 'Balanced word frequency control'
          : 'Natural frequency distribution',
      trackColor: '#f59e0b',
      onChange: (v) => setModelParam('frequency_penalty', v),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <SlidersHorizontal size={13} style={{ color: 'rgba(0,220,255,0.75)' }} />
        <span
          style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}
        >
          Model Control Centre
        </span>
        {pendingParamChange && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 9,
              fontWeight: 700,
              color: 'rgba(255,160,50,0.85)',
              background: 'rgba(255,160,50,0.12)',
              borderRadius: 4,
              padding: '2px 6px',
              letterSpacing: '0.04em',
            }}
          >
            UNSAVED
          </span>
        )}
      </div>

      {/* Sliders scroll area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 16px 8px',
          minHeight: 0,
        }}
      >
        {sliders.map((s) => (
          <SliderRow key={s.label} {...s} />
        ))}
      </div>

      {/* Apply & Regenerate */}
      <div
        style={{
          padding: '10px 16px 12px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleRegenerate}
          disabled={isLoading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 0',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.02em',
            background: isLoading
              ? 'rgba(0,220,255,0.05)'
              : 'linear-gradient(135deg, rgba(0,220,255,0.18), rgba(0,180,200,0.12))',
            border: `1.5px solid ${
              isLoading ? 'rgba(0,220,255,0.15)' : 'rgba(0,220,255,0.38)'
            }`,
            color: isLoading ? 'rgba(0,220,255,0.4)' : 'rgba(0,220,255,0.92)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={14} style={{ animation: isLoading ? 'rotate 1s linear infinite' : 'none' }} />
          Apply &amp; Regenerate
        </button>
      </div>
    </div>
  );
}