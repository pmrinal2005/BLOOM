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
  isDark: boolean;
}

function SliderRow({ label, paramKey, min, max, step, hint, isOnline, isDark }: SliderRowProps) {
  const { stagedModelParams, setStagedModelParam, modelParams } = useStore();
  const value = Number(stagedModelParams[paramKey]);
  const liveValue = Number(modelParams[paramKey]);
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const displayVal = step < 1 ? value.toFixed(2) : String(value);
  const hasChanged = value !== liveValue;

  const labelColor = isDark ? 'rgba(255,255,255,0.68)' : 'rgba(0,0,0,0.7)';
  const valueColor = hasChanged ? '#ffa500' : isDark ? '#00dcff' : '#0077aa';
  const trackBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)';
  const fillBg = hasChanged
    ? 'linear-gradient(90deg, rgba(255,140,0,0.8), rgba(255,165,0,0.95))'
    : isDark
    ? 'linear-gradient(90deg, rgba(0,160,210,0.8), rgba(0,220,255,0.95))'
    : 'linear-gradient(90deg, rgba(0,100,160,0.8), rgba(0,150,200,0.95))';
  const fillShadow = hasChanged ? '0 0 7px rgba(255,165,0,0.5)' : isDark ? '0 0 7px rgba(0,220,255,0.5)' : '0 0 7px rgba(0,150,200,0.4)';
  const thumbColor = hasChanged ? '#ffa500' : isDark ? '#00dcff' : '#0099cc';
  const thumbShadow = hasChanged ? '0 0 9px rgba(255,165,0,0.75)' : isDark ? '0 0 9px rgba(0,220,255,0.75)' : '0 0 9px rgba(0,150,200,0.6)';
  const hintColor = isDark ? 'rgba(255,255,255,0.26)' : 'rgba(0,0,0,0.38)';

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: labelColor }}>{label}</span>
          {hasChanged && (
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ffa500', boxShadow: '0 0 4px #ffa500', flexShrink: 0 }} />
          )}
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right', color: valueColor, transition: 'color 0.2s' }}>
          {displayVal}
        </span>
      </div>
      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 5, borderRadius: 4, background: trackBg }} />
        <div style={{ position: 'absolute', left: 0, height: 5, borderRadius: 4, width: `${pct}%`, background: fillBg, boxShadow: fillShadow, transition: 'width 0.1s, background 0.2s, box-shadow 0.2s' }} />
        <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: `calc(${pct}% - 8px)`, width: 16, height: 16, borderRadius: '50%', background: thumbColor, border: `2.5px solid ${isDark ? 'rgba(9,13,24,0.95)' : 'rgba(240,244,255,0.95)'}`, boxShadow: thumbShadow, pointerEvents: 'none', transition: 'left 0.1s, background 0.2s', zIndex: 2 }} />
        <input type="range" min={min} max={max} step={step} value={value} disabled={!isOnline}
          onChange={e => setStagedModelParam(paramKey, parseFloat(e.target.value))}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: isOnline ? 'pointer' : 'not-allowed', margin: 0, zIndex: 3 }}
        />
      </div>
      <p style={{ fontSize: 9, color: hintColor, margin: '5px 0 0' }}>{hint}</p>
    </div>
  );
}

export default function ModelControls({ onRegenerate }: { onRegenerate: () => void }) {
  const { pendingParamChange, applyModelParams, stagedModelParams, modelParams, changedParams, theme } = useStore();
  const isDark = theme === 'dark';
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

  const keyParamsChanged = changedParams.has('temperature') || changedParams.has('top_p');
  const isButtonEnabled = isOnline && !isApplying && keyParamsChanged;
  const hasAnyChange = pendingParamChange && changedParams.size > 0;

  // Theme-aware colors
  const headerBg = isDark ? 'transparent' : 'transparent';
  const headerBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const iconBg = isDark ? 'rgba(0,220,255,0.1)' : 'rgba(0,136,170,0.1)';
  const iconBorder = isDark ? 'rgba(0,220,255,0.2)' : 'rgba(0,136,170,0.22)';
  const titleColor = isDark ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.8)';
  const unsavedBg = isDark ? 'rgba(255,165,0,0.1)' : 'rgba(255,165,0,0.12)';
  const unsavedBorder = isDark ? 'rgba(255,165,0,0.25)' : 'rgba(255,165,0,0.35)';
  const unsavedColor = isDark ? 'rgba(255,165,0,0.75)' : 'rgba(180,100,0,0.85)';

  const btnEnabledBg = isDark
    ? 'linear-gradient(135deg, rgba(0,220,255,0.2), rgba(0,150,200,0.16))'
    : 'linear-gradient(135deg, rgba(0,136,170,0.18), rgba(0,100,140,0.14))';
  const btnEnabledBgHover = isDark
    ? 'linear-gradient(135deg, rgba(0,220,255,0.3), rgba(0,150,200,0.24))'
    : 'linear-gradient(135deg, rgba(0,136,170,0.28), rgba(0,100,140,0.22))';
  const btnEnabledBorder = isDark ? 'rgba(0,220,255,0.45)' : 'rgba(0,136,170,0.5)';
  const btnEnabledColor = isDark ? '#00dcff' : '#006688';
  const btnEnabledShadow = isDark ? '0 0 16px rgba(0,220,255,0.1)' : '0 0 12px rgba(0,136,170,0.12)';
  const btnDisabledBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const btnDisabledBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const btnDisabledColor = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.28)';
  const helperTextColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.35)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px 10px', flexShrink: 0, borderBottom: `1px solid ${headerBorder}` }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11 }}>⚙</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: titleColor }}>Model Control Centre</span>
        {hasAnyChange && (
          <span style={{ fontSize: 9, fontWeight: 600, color: unsavedColor, background: unsavedBg, border: `1px solid ${unsavedBorder}`, borderRadius: 5, padding: '1px 6px', marginLeft: 2, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Unsaved changes
          </span>
        )}
      </div>

      {/* Sliders */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 0', scrollbarWidth: 'thin', scrollbarColor: isDark ? 'rgba(255,255,255,0.1) transparent' : 'rgba(0,0,0,0.1) transparent' }}>
        <SliderRow label="Temperature" paramKey="temperature" min={0.1} max={1.5} step={0.05} hint="Higher = more creative & unpredictable output" isOnline={isOnline} isDark={isDark} />
        <SliderRow label="Top P" paramKey="top_p" min={0.1} max={1.0} step={0.05} hint="Nucleus sampling — higher = wider token selection" isOnline={isOnline} isDark={isDark} />
        <SliderRow label="Top K" paramKey="top_k" min={1} max={100} step={1} hint="Token diversity — higher = more variety" isOnline={isOnline} isDark={isDark} />
        <SliderRow label="Presence Penalty" paramKey="presence_penalty" min={0} max={1} step={0.05} hint="Penalises repeated topics" isOnline={isOnline} isDark={isDark} />
        <SliderRow label="Frequency Penalty" paramKey="frequency_penalty" min={0} max={1} step={0.05} hint="Penalises repeated tokens" isOnline={isOnline} isDark={isDark} />
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px 14px', flexShrink: 0 }}>
        <button
          onClick={handleApply}
          disabled={!isButtonEnabled}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '10px 0', borderRadius: 11,
            background: isButtonEnabled ? btnEnabledBg : btnDisabledBg,
            border: `1.5px solid ${isButtonEnabled ? btnEnabledBorder : btnDisabledBorder}`,
            color: isButtonEnabled ? btnEnabledColor : btnDisabledColor,
            fontSize: 12, fontWeight: 700,
            cursor: isButtonEnabled ? 'pointer' : 'not-allowed',
            boxShadow: isButtonEnabled ? btnEnabledShadow : 'none',
            opacity: isButtonEnabled ? 1 : 0.5,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (isButtonEnabled) (e.currentTarget as HTMLElement).style.background = btnEnabledBgHover; }}
          onMouseLeave={e => { if (isButtonEnabled) (e.currentTarget as HTMLElement).style.background = btnEnabledBg; }}
        >
          <RefreshCw size={13} strokeWidth={2.5} className={isApplying ? 'animate-spin' : ''} />
          {isApplying ? 'Applying...' : 'Apply & Regenerate'}
        </button>

        {!isButtonEnabled && !isApplying && (
          <p style={{ fontSize: 9, color: helperTextColor, textAlign: 'center', margin: '6px 0 0', lineHeight: 1.4 }}>
            {!isOnline ? 'Offline — reconnect to apply' : 'Adjust Temperature or Top P to enable'}
          </p>
        )}
      </div>
    </div>
  );
}