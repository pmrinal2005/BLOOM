import { useStore } from '../store/useStore';
import { Sparkles, User } from 'lucide-react';

export default function Header() {
  const {
    growthMode, setGrowthMode,
    creativityLevel, setCreativityLevel,
    showReasoning, setShowReasoning,
  } = useStore();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-14"
      style={{
        background: 'rgba(8, 13, 24, 0.97)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,255,0.3), rgba(180,0,255,0.3))',
            border: '1px solid rgba(0,255,255,0.4)',
            boxShadow: '0 0 12px rgba(0,255,255,0.2)',
          }}
        >
          <Sparkles size={16} style={{ color: '#00ffff' }} />
        </div>
        <div>
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: '#f0f4ff', letterSpacing: '-0.02em' }}
          >
            Expert
          </span>
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: '#00ffff', textShadow: '0 0 12px rgba(0,255,255,0.5)' }}
          >
            Bloom
          </span>
        </div>
        <div
          className="hidden sm:flex items-center gap-1 ml-2 px-2 py-0.5 rounded text-xs"
          style={{ background: 'rgba(0,255,255,0.08)', border: '1px solid rgba(0,255,255,0.15)', color: 'rgba(0,255,255,0.7)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" style={{ boxShadow: '0 0 4px #4ade80' }}></span>
          Gemma 4
        </div>
      </div>

      {/* Center – Growth Mode */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Growth Mode</span>
        <div
          className="flex rounded-lg p-0.5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {(['Focused', 'Divergent'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setGrowthMode(mode)}
              className="px-4 py-1 rounded-md text-xs font-semibold transition-all duration-200"
              style={{
                background: growthMode === mode
                  ? 'linear-gradient(135deg, rgba(0,255,255,0.2), rgba(0,180,220,0.15))'
                  : 'transparent',
                color: growthMode === mode ? '#00ffff' : 'rgba(255,255,255,0.45)',
                border: growthMode === mode ? '1px solid rgba(0,255,255,0.35)' : '1px solid transparent',
                boxShadow: growthMode === mode ? '0 0 8px rgba(0,255,255,0.15)' : 'none',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Creativity Level */}
        <div className="hidden md:flex items-center gap-2.5">
          <span className="text-xs font-medium whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Creativity
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>0.3</span>
            <div className="relative w-24">
              <input
                type="range"
                min={0.3}
                max={1.0}
                step={0.05}
                value={creativityLevel}
                onChange={(e) => setCreativityLevel(parseFloat(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #00ffff ${((creativityLevel - 0.3) / 0.7) * 100}%, rgba(255,255,255,0.1) 0%)`,
                }}
                className="w-full"
              />
              <style>{`
                .header-slider::-webkit-slider-thumb { background: #00ffff; box-shadow: 0 0 6px rgba(0,255,255,0.8); }
              `}</style>
            </div>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>1.0</span>
          </div>
          <span
            className="text-xs font-bold w-8 text-center"
            style={{ color: '#00ffff', textShadow: '0 0 8px rgba(0,255,255,0.5)' }}
          >
            {creativityLevel.toFixed(1)}
          </span>
        </div>

        {/* Show Reasoning toggle */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Reasoning</span>
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="toggle-switch"
            style={{ background: showReasoning ? 'rgba(0,255,255,0.3)' : 'rgba(255,255,255,0.1)', border: `1px solid ${showReasoning ? 'rgba(0,255,255,0.5)' : 'rgba(255,255,255,0.15)'}` }}
          >
            <div
              className="toggle-knob"
              style={{
                transform: showReasoning ? 'translateX(20px)' : 'translateX(0)',
                background: showReasoning ? '#00ffff' : 'rgba(255,255,255,0.6)',
                boxShadow: showReasoning ? '0 0 8px rgba(0,255,255,0.6)' : 'none',
              }}
            />
          </button>
        </div>

        {/* User icon */}
        <div className="relative group">
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            <User size={15} />
          </button>
          <div
            className="absolute right-0 top-full mt-2 w-40 rounded-xl py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
            style={{
              background: 'rgba(13,17,32,0.98)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div className="px-3 py-1.5 text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>Account</div>
            {['Profile', 'Settings', 'Sign Out'].map((item) => (
              <button
                key={item}
                className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
