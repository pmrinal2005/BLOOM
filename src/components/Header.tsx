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
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  const getCreativityInfo = (level: number) => {
    if (level <= 0.4) return { label: 'Literal', color: '#4fc3f7' };
    if (level <= 0.6) return { label: 'Balanced', color: '#00dcff' };
    if (level <= 0.8) return { label: 'Creative', color: '#7c4dff' };
    return { label: 'Wild', color: '#ff10f0' };
  };
  const { label: cLabel, color: cColor } = getCreativityInfo(creativityLevel);
  const sliderPct = ((creativityLevel - 0.3) / 0.7) * 100;

  // Theme-aware colors
  const headerBg = isDark ? 'rgba(8,13,24,0.97)' : 'rgba(248,250,255,0.97)';
  const headerBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)';
  const labelColor = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.5)';
  const logoTextColor = isDark ? '#f0f4ff' : '#0a0e1a';
  const modeActiveBg = isDark
    ? 'linear-gradient(135deg, rgba(0,255,255,0.2), rgba(0,180,220,0.15))'
    : 'linear-gradient(135deg, rgba(0,180,220,0.25), rgba(0,140,180,0.2))';
  const modeInactiveColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)';
  const modeBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const modeBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const toggleBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const toggleBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const toggleColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

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
          <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(0,255,255,0.3), rgba(180,0,255,0.3))', border: '1px solid rgba(0,255,255,0.4)', boxShadow: '0 0 12px rgba(0,255,255,0.2)', flexShrink: 0 }}>
            <Sparkles size={15} style={{ color: '#00ffff' }} />
          </div>
          <div style={{ lineHeight: 1 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: logoTextColor, letterSpacing: '-0.02em', transition: 'color 0.3s' }}>Expert</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#00ffff', textShadow: '0 0 12px rgba(0,255,255,0.5)' }}>Bloom</span>
          </div>
          {/* Online badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: isOnline ? 'rgba(57,255,20,0.1)' : 'rgba(255,60,60,0.15)', border: `1px solid ${isOnline ? 'rgba(57,255,20,0.3)' : 'rgba(255,60,60,0.4)'}`, color: isOnline ? '#39ff14' : '#ff5050', flexShrink: 0 }}>
            {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* ── Center: Growth Mode toggle — NO label, absolutely centered ── */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}>
          {/* Task 2: NO "GROWTH MODE" label — just the toggle buttons */}
          <div style={{ display: 'flex', borderRadius: 10, padding: 3, background: modeBg, border: `1px solid ${modeBorder}` }}>
            {(['Focused', 'Divergent'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => { if (isOnline) setGrowthMode(mode); }}
                disabled={!isOnline}
                style={{
                  padding: '5px 16px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  background: growthMode === mode ? modeActiveBg : 'transparent',
                  color: growthMode === mode ? '#00ffff' : modeInactiveColor,
                  border: growthMode === mode ? '1px solid rgba(0,255,255,0.35)' : '1px solid transparent',
                  boxShadow: growthMode === mode ? '0 0 8px rgba(0,255,255,0.12)' : 'none',
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
            <span style={{ fontSize: 10, fontWeight: 600, color: labelColor, letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0, transition: 'color 0.3s' }}>
              Creativity
            </span>
            <div style={{ position: 'relative', width: 88, height: 20, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 3, background: 'linear-gradient(90deg, #4fc3f7 0%, #00dcff 35%, #7c4dff 70%, #ff10f0 100%)', opacity: isOnline ? 0.3 : 0.12 }} />
              <div style={{ position: 'absolute', left: 0, height: 4, borderRadius: 3, width: `${sliderPct}%`, background: `linear-gradient(90deg, #4fc3f7, ${cColor})`, boxShadow: `0 0 6px ${cColor}90`, transition: 'width 0.1s' }} />
              <div style={{ position: 'absolute', left: `calc(${sliderPct}% - 7px)`, width: 14, height: 14, borderRadius: '50%', background: cColor, border: '2px solid rgba(8,13,24,0.95)', boxShadow: `0 0 8px ${cColor}`, pointerEvents: 'none', zIndex: 2, transition: 'left 0.1s' }} />
              <input type="range" min={0.3} max={1.0} step={0.05} value={creativityLevel} disabled={!isOnline}
                onChange={e => setCreativityLevel(parseFloat(e.target.value))}
                style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: isOnline ? 'pointer' : 'not-allowed', margin: 0, zIndex: 3 }}
              />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: cColor, minWidth: 22, textAlign: 'right', transition: 'color 0.3s' }}>{creativityLevel.toFixed(1)}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: cColor, background: `${cColor}18`, border: `1px solid ${cColor}40`, borderRadius: 5, padding: '1px 6px', whiteSpace: 'nowrap' }}>{cLabel}</span>
          </div>

          {/* Reasoning toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: labelColor, letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'color 0.3s' }}>Reasoning</span>
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              style={{ width: 40, height: 20, borderRadius: 10, position: 'relative', background: showReasoning ? 'rgba(0,255,255,0.22)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'), border: `1px solid ${showReasoning ? 'rgba(0,255,255,0.45)' : (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.2)')}`, cursor: 'pointer', transition: 'all 0.25s', flexShrink: 0 }}
            >
              <div style={{ position: 'absolute', top: 2, left: showReasoning ? 20 : 2, width: 14, height: 14, borderRadius: '50%', background: showReasoning ? '#00ffff' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'), boxShadow: showReasoning ? '0 0 7px rgba(0,255,255,0.8)' : 'none', transition: 'left 0.25s, background 0.25s' }} />
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: toggleBg, border: `1px solid ${toggleBorder}`, cursor: 'pointer', flexShrink: 0, color: toggleColor, transition: 'all 0.3s ease' }}
          >
            <div style={{ transition: 'transform 0.4s ease, opacity 0.25s ease', display: 'flex' }}>
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </div>
          </button>

          {/* User */}
          <button style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: toggleBg, border: `1px solid ${toggleBorder}`, color: toggleColor, cursor: 'pointer', flexShrink: 0 }}>
            <User size={14} />
          </button>
        </div>
      </header>

      {/* Offline popup */}
      {showOfflinePopup && (
        <div style={{ position: 'fixed', top: 66, left: '50%', transform: 'translateX(-50%)', zIndex: 400, maxWidth: 420, width: 'calc(100% - 32px)', background: isDark ? 'rgba(9,13,24,0.99)' : 'rgba(255,255,255,0.99)', border: '1px solid rgba(255,60,60,0.5)', borderRadius: 14, padding: '14px 20px', boxShadow: '0 8px 40px rgba(255,60,60,0.2)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <WifiOff size={18} style={{ color: '#ff5050', flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)', fontSize: 12, fontWeight: 700, margin: '0 0 3px' }}>You're offline</p>
            <p style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: 10, margin: 0, lineHeight: 1.5 }}>AI generation paused. Your canvas is preserved.</p>
          </div>
          <button onClick={() => setShowOfflinePopup(false)} style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
        </div>
      )}
    </>
  );
}