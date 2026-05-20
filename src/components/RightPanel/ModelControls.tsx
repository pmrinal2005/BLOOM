import { useStore, ModelParams } from '../../store/useStore';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SliderRowProps {
  label: string;
  paramKey: keyof ModelParams;
  min: number;
  max: number;
  step: number;
  hint: string;
  isOnline: boolean;
}

function SliderRow({ label, paramKey, min, max, step, hint, isOnline }: SliderRowProps) {
  const { stagedModelParams, setStagedModelParam, modelParams } = useStore();
  const value = Number(stagedModelParams[paramKey]);
  const liveValue = Number(modelParams[paramKey]);
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const displayVal = step < 1 ? value.toFixed(2) : String(value);
  const hasChanged = value !== liveValue;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.68)' }}>{label}</span>
          {/* Task 4.2: per-slider changed indicator dot */}
          {hasChanged && (
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ffa500', boxShadow: '0 0 4px #ffa500', flexShrink: 0 }} />
          )}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
          minWidth: 36, textAlign: 'right',
          color: hasChanged ? '#ffa500' : '#00dcff',
          transition: 'color 0.2s',
        }}>
          {displayVal}
        </span>
      </div>
      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.07)' }} />
        <div style={{
          position: 'absolute', left: 0, height: 5, borderRadius: 4,
          width: `${pct}%`,
          background: hasChanged
            ? 'linear-gradient(90deg, rgba(255,140,0,0.8), rgba(255,165,0,0.95))'
            : 'linear-gradient(90deg, rgba(0,160,210,0.8), rgba(0,220,255,0.95))',
          boxShadow: hasChanged ? '0 0 7px rgba(255,165,0,0.5)' : '0 0 7px rgba(0,220,255,0.5)',
          transition: 'width 0.1s, background 0.2s, box-shadow 0.2s',
        }} />
        <div style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)',
          left: `calc(${pct}% - 8px)`, width: 16, height: 16, borderRadius: '50%',
          background: hasChanged ? '#ffa500' : '#00dcff',
          border: '2.5px solid rgba(9,13,24,0.95)',
          boxShadow: hasChanged ? '0 0 9px rgba(255,165,0,0.75)' : '0 0 9px rgba(0,220,255,0.75)',
          pointerEvents: 'none', transition: 'left 0.1s, background 0.2s', zIndex: 2,
        }} />
        <input type="range" min={min} max={max} step={step} value={value} disabled={!isOnline}
          onChange={e => setStagedModelParam(paramKey, parseFloat(e.target.value))}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: isOnline ? 'pointer' : 'not-allowed', margin: 0, zIndex: 3 }}
        />
      </div>
      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.26)', margin: '5px 0 0' }}>{hint}</p>
    </div>
  );
}

export default function ModelControls({ onRegenerate }: { onRegenerate: () => void }) {
  const { pendingParamChange, applyModelParams, stagedModelParams, modelParams, changedParams } = useStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  const handleApply = async () => {
    if (!isOnline || isApplying || !pendingParamChange) return;
    setIsApplying(true);
    applyModelParams();
    await new Promise(r => setTimeout(r, 60));
    onRegenerate();
    setIsApplying(false);
  };

  // ── Task 4.1: Button only enabled when temperature or top_p actually changed ──
  const keyParamsChanged = changedParams.has('temperature') || changedParams.has('top_p');
  const isButtonEnabled = isOnline && !isApplying && keyParamsChanged;

  // ── Task 4.2: Show "unsaved" label when any param changed ──
  const hasAnyChange = pendingParamChange && changedParams.size > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px 10px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(0,220,255,0.1)', border: '1px solid rgba(0,220,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11 }}>⚙</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.82)' }}>Model Control Centre</span>
        {/* ── Task 4.2: Unsaved indicator next to title ── */}
        {hasAnyChange && (
          <span style={{
            fontSize: 9, fontWeight: 600, color: 'rgba(255,165,0,0.75)',
            background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.25)',
            borderRadius: 5, padding: '1px 6px', marginLeft: 2,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            Unsaved changes
          </span>
        )}
      </div>

      {/* Sliders */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 0', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
        <SliderRow label="Temperature" paramKey="temperature" min={0.1} max={1.5} step={0.05}
          hint="Higher = more creative & unpredictable output" isOnline={isOnline} />
        <SliderRow label="Top P" paramKey="top_p" min={0.1} max={1.0} step={0.05}
          hint="Nucleus sampling — higher = wider token selection" isOnline={isOnline} />
        <SliderRow label="Top K" paramKey="top_k" min={1} max={100} step={1}
          hint="Token diversity — higher = more variety" isOnline={isOnline} />
        <SliderRow label="Presence Penalty" paramKey="presence_penalty" min={0} max={1} step={0.05}
          hint="Penalises repeated topics" isOnline={isOnline} />
        <SliderRow label="Frequency Penalty" paramKey="frequency_penalty" min={0} max={1} step={0.05}
          hint="Penalises repeated tokens" isOnline={isOnline} />
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px 14px', flexShrink: 0 }}>
        <button
          onClick={handleApply}
          disabled={!isButtonEnabled}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '10px 0', borderRadius: 11,
            background: isButtonEnabled
              ? 'linear-gradient(135deg, rgba(0,220,255,0.2), rgba(0,150,200,0.16))'
              : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${isButtonEnabled ? 'rgba(0,220,255,0.45)' : 'rgba(255,255,255,0.07)'}`,
            color: isButtonEnabled ? '#00dcff' : 'rgba(255,255,255,0.22)',
            fontSize: 12, fontWeight: 700,
            cursor: isButtonEnabled ? 'pointer' : 'not-allowed',
            boxShadow: isButtonEnabled ? '0 0 16px rgba(0,220,255,0.1)' : 'none',
            opacity: isButtonEnabled ? 1 : 0.5,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (isButtonEnabled) (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(0,220,255,0.3), rgba(0,150,200,0.24))'; }}
          onMouseLeave={e => { if (isButtonEnabled) (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(0,220,255,0.2), rgba(0,150,200,0.16))'; }}
        >
          <RefreshCw size={13} strokeWidth={2.5} className={isApplying ? 'animate-spin' : ''} />
          {isApplying ? 'Applying...' : 'Apply & Regenerate'}
        </button>

        {/* Helper text below button */}
        {!isButtonEnabled && !isApplying && (
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: '6px 0 0', lineHeight: 1.4 }}>
            {!isOnline ? 'Offline — reconnect to apply' : 'Adjust Temperature or Top P to enable'}
          </p>
        )}
      </div>
    </div>
  );
}