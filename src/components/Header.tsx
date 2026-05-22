import { useStore } from '../store/useStore';
import { Sparkles, User, WifiOff, Wifi, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header() {
  const {
    growthMode, setGrowthMode,
    creativityLevel, setCreativityLevel,
    showReasoning, setShowReasoning,
    theme, setTheme,
  } = useStore();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflinePopup, setShowOfflinePopup] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    const up = () => { setIsOnline(true); setShowOfflinePopup(false); };
    const down = () => { setIsOnline(false); setShowOfflinePopup(true); };
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  const getCreativityInfo = (level: number) => {
    if (level <= 0.4) return { label: 'Literal', color: isDark ? '#4fc3f7' : '#0077aa' };
    if (level <= 0.6) return { label: 'Balanced', color: isDark ? '#00dcff' : '#0066aa' };
    if (level <= 0.8) return { label: 'Creative', color: isDark ? '#7c4dff' : '#5500cc' };
    return { label: 'Wild', color: isDark ? '#ff10f0' : '#aa00aa' };
  };
  const { label: cLabel, color: cColor } = getCreativityInfo(creativityLevel);
  const sliderPct = ((creativityLevel - 0.3) / 0.7) * 100;

  // ── Theme-aware colors ──
  const headerBg = isDark ? 'rgba(8,13,24,0.97)' : 'rgba(248,250,255,0.98)';
  const headerBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)';

  // Logo
  const logoTextColor = isDark ? '#f0f4ff' : '#0a0e1a';

  // Online badge
  const onlineBg = isOnline ? (isDark ? 'rgba(57,255,20,0.1)' : 'rgba(20,140,0,0.1)') : (isDark ? 'rgba(255,60,60,0.15)' : 'rgba(200,0,0,0.1)');
  const onlineBorder = isOnline ? (isDark ? 'rgba(57,255,20,0.3)' : 'rgba(20,140,0,0.35)') : (isDark ? 'rgba(255,60,60,0.4)' : 'rgba(200,0,0,0.35)');
  const onlineColor = isOnline ? (isDark ? '#39ff14' : '#147a00') : (isDark ? '#ff5050' : '#cc0000');

  // Growth mode toggle
  const modeBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const modeBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
  const modeActiveColor = isDark ? '#00ffff' : '#004d77';
  const modeActiveBg = isDark
    ? 'linear-gradient(135deg, rgba(0,255,255,0.2), rgba(0,180,220,0.15))'
    : 'linear-gradient(135deg, rgba(0,136,200,0.22), rgba(0,100,160,0.16))';
  const modeActiveBorder = isDark ? 'rgba(0,255,255,0.35)' : 'rgba(0,100,160,0.4)';
  const modeActiveBoxShadow = isDark ? '0 0 8px rgba(0,255,255,0.12)' : '0 0 8px rgba(0,100,160,0.1)';
  const modeInactiveColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.55)';

  // Labels (CREATIVITY, REASONING)
  const labelColor = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.6)';

  // Creativity value text
  const creativityValueColor = isDark ? cColor : cColor;

  // Creativity badge
  const creativityBadgeBg = isDark ? `${cColor}18` : `${cColor}14`;
  const creativityBadgeBorder = isDark ? `${cColor}40` : `${cColor}50`;

  // Reasoning toggle
  const reasoningTrackBg = showReasoning
    ? isDark ? 'rgba(0,255,255,0.22)' : 'rgba(0,136,170,0.22)'
    : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
  const reasoningTrackBorder = showReasoning
    ? isDark ? 'rgba(0,255,255,0.45)' : 'rgba(0,136,170,0.5)'
    : isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.18)';
  const reasoningKnobBg = showReasoning
    ? isDark ? '#00ffff' : '#0088aa'
    : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)';
  const reasoningKnobShadow = showReasoning
    ? isDark ? '0 0 7px rgba(0,255,255,0.8)' : '0 0 7px rgba(0,136,170,0.6)'
    : 'none';

  // Theme & user buttons
  const iconBtnBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const iconBtnBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';
  const iconBtnColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

  // Slider thumb border
  const sliderThumbBorder = isDark ? 'rgba(8,13,24,0.95)' : 'rgba(240,244,255,0.95)';

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 56,
        display: 'flex', alignItems: 'center',
        padding: '0 20px',
        background: headerBg,
        borderBottom: `1px solid ${headerBorder}`,
        backdropFilter: 'blur(20px)',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}>
        {/* ── Left: Logo ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, minWidth: 200 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isDark
              ? 'linear-gradient(135deg, rgba(0,255,255,0.3), rgba(180,0,255,0.3))'
              : 'linear-gradient(135deg, rgba(0,136,200,0.35), rgba(120,0,200,0.3))',
            border: isDark ? '1px solid rgba(0,255,255,0.4)' : '1px solid rgba(0,136,200,0.45)',
            boxShadow: isDark ? '0 0 12px rgba(0,255,255,0.2)' : '0 0 10px rgba(0,136,200,0.15)',
            flexShrink: 0,
          }}>
            <Sparkles size={15} style={{ color: isDark ? '#00ffff' : '#0077aa' }} />
          </div>
          <div style={{ lineHeight: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: logoTextColor, letterSpacing: '-0.02em', transition: 'color 0.3s' }}>Expert</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: isDark ? '#00ffff' : '#0077aa', textShadow: isDark ? '0 0 12px rgba(0,255,255,0.5)' : 'none' }}>Bloom</span>
          </div>
          {/* Online badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 20,
            fontSize: 10, fontWeight: 700,
            background: onlineBg,
            border: `1px solid ${onlineBorder}`,
            color: onlineColor,
            flexShrink: 0,
          }}>
            {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* ── Center: Growth Mode toggle ── */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {/* Optional label above */}
          <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.1em', color: labelColor, textTransform: 'uppercase', lineHeight: 1 }}>
            Growth Mode
          </span>
          <div style={{ display: 'flex', borderRadius: 10, padding: 3, background: modeBg, border: `1px solid ${modeBorder}` }}>
            {(['Focused', 'Divergent'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => { if (isOnline) setGrowthMode(mode); }}
                disabled={!isOnline}
                style={{
                  padding: '5px 16px', borderRadius: 8,
                  fontSize: 11, fontWeight: 700,
                  background: growthMode === mode ? modeActiveBg : 'transparent',
                  color: growthMode === mode ? modeActiveColor : modeInactiveColor,
                  border: growthMode === mode
                    ? `1px solid ${modeActiveBorder}`
                    : '1px solid transparent',
                  boxShadow: growthMode === mode ? modeActiveBoxShadow : 'none',
                  cursor: isOnline ? 'pointer' : 'not-allowed',
                  opacity: isOnline ? 1 : 0.5,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: Creativity + Reasoning + Theme + User ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, marginLeft: 'auto' }}>

          {/* Creativity slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: labelColor,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              flexShrink: 0, transition: 'color 0.3s',
            }}>
              Creativity
            </span>
            <div style={{ position: 'relative', width: 88, height: 20, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {/* Track */}
              <div style={{
                position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 3,
                background: isDark
                  ? 'linear-gradient(90deg, #4fc3f7 0%, #00dcff 35%, #7c4dff 70%, #ff10f0 100%)'
                  : 'linear-gradient(90deg, #0077aa 0%, #0066bb 35%, #5500cc 70%, #aa00aa 100%)',
                opacity: isOnline ? 0.3 : 0.12,
              }} />
              {/* Fill */}
              <div style={{
                position: 'absolute', left: 0, height: 4, borderRadius: 3,
                width: `${sliderPct}%`,
                background: `linear-gradient(90deg, ${isDark ? '#4fc3f7' : '#0077aa'}, ${cColor})`,
                boxShadow: `0 0 6px ${cColor}90`,
                transition: 'width 0.1s',
              }} />
              {/* Thumb */}
              <div style={{
                position: 'absolute', left: `calc(${sliderPct}% - 7px)`,
                width: 14, height: 14, borderRadius: '50%',
                background: cColor,
                border: `2px solid ${sliderThumbBorder}`,
                boxShadow: `0 0 8px ${cColor}`,
                pointerEvents: 'none', zIndex: 2,
                transition: 'left 0.1s',
              }} />
              <input
                type="range" min={0.3} max={1.0} step={0.05}
                value={creativityLevel} disabled={!isOnline}
                onChange={e => setCreativityLevel(parseFloat(e.target.value))}
                style={{
                  position: 'absolute', inset: 0, width: '100%',
                  opacity: 0, cursor: isOnline ? 'pointer' : 'not-allowed',
                  margin: 0, zIndex: 3,
                }}
              />
            </div>
            {/* Value */}
            <span style={{
              fontSize: 11, fontWeight: 800, color: cColor,
              minWidth: 24, textAlign: 'right',
              transition: 'color 0.3s',
            }}>
              {creativityLevel.toFixed(1)}
            </span>
            {/* Badge */}
            <span style={{
              fontSize: 9, fontWeight: 700, color: cColor,
              background: creativityBadgeBg,
              border: `1px solid ${creativityBadgeBorder}`,
              borderRadius: 5, padding: '2px 7px',
              whiteSpace: 'nowrap',
            }}>
              {cLabel}
            </span>
          </div>

          {/* Reasoning toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: labelColor,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              transition: 'color 0.3s',
            }}>
              Reasoning
            </span>
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              style={{
                width: 40, height: 20, borderRadius: 10,
                position: 'relative',
                background: reasoningTrackBg,
                border: `1px solid ${reasoningTrackBorder}`,
                cursor: 'pointer',
                transition: 'all 0.25s',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 2,
                left: showReasoning ? 20 : 2,
                width: 14, height: 14, borderRadius: '50%',
                background: reasoningKnobBg,
                boxShadow: reasoningKnobShadow,
                transition: 'left 0.25s, background 0.25s',
              }} />
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: iconBtnBg,
              border: `1px solid ${iconBtnBorder}`,
              cursor: 'pointer', flexShrink: 0,
              color: iconBtnColor,
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ transition: 'transform 0.4s ease, opacity 0.25s ease', display: 'flex' }}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </div>
          </button>

          {/* User */}
          <button style={{
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: iconBtnBg,
            border: `1px solid ${iconBtnBorder}`,
            color: iconBtnColor,
            cursor: 'pointer', flexShrink: 0,
          }}>
            <User size={14} />
          </button>
        </div>
      </header>

      {/* Offline popup */}
      {showOfflinePopup && (
        <div style={{
          position: 'fixed', top: 66, left: '50%', transform: 'translateX(-50%)',
          zIndex: 400, maxWidth: 420, width: 'calc(100% - 32px)',
          background: isDark ? 'rgba(9,13,24,0.99)' : 'rgba(255,255,255,0.99)',
          border: '1px solid rgba(255,60,60,0.5)', borderRadius: 14,
          padding: '14px 20px',
          boxShadow: '0 8px 40px rgba(255,60,60,0.2)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <WifiOff size={18} style={{ color: '#ff5050', flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)', fontSize: 12, fontWeight: 700, margin: '0 0 3px' }}>
              You're offline
            </p>
            <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)', fontSize: 10, margin: 0, lineHeight: 1.5 }}>
              AI generation paused. Your canvas is preserved.
            </p>
          </div>
          <button
            onClick={() => setShowOfflinePopup(false)}
            style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}
          >×</button>
        </div>
      )}
    </>
  );
}