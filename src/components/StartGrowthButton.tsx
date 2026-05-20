import { useStore } from '../store/useStore';
import { Play, Loader, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function StartGrowthButton({
  onStart,
  isRegenerate = false,
  canRegenerate = true,
}: {
  onStart: () => void;
  isRegenerate?: boolean;
  canRegenerate?: boolean;
}) {
  const { generationStatus, problemDescription } = useStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  const hasDescription = problemDescription.trim().length > 0;
  const isLoading = generationStatus === 'loading';
  const isDisabled = isLoading || !isOnline || (isRegenerate ? !canRegenerate : !hasDescription);
  const isActive = !isDisabled;
  const label = isLoading ? (isRegenerate ? 'Regenerating...' : 'Growing...') : isRegenerate ? 'Regenerate' : 'Start Growth Process';
  const Icon = isLoading ? Loader : isRegenerate ? RefreshCw : Play;

  return (
    // ── Task 1.1 & 1.2: Remove subtitle entirely, consistent height ──
    <button
      onClick={onStart}
      disabled={isDisabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        height: 38, // fixed height for alignment with Reset button
        padding: '0 20px',
        borderRadius: 10, fontSize: 13, fontWeight: 700,
        background: isActive
          ? isRegenerate
            ? 'linear-gradient(135deg, rgba(57,255,20,0.22), rgba(0,200,100,0.18))'
            : 'linear-gradient(135deg, rgba(0,220,255,0.25), rgba(0,180,200,0.2))'
          : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${isActive
          ? isRegenerate ? 'rgba(57,255,20,0.5)' : 'rgba(0,220,255,0.45)'
          : 'rgba(255,255,255,0.08)'}`,
        color: isActive
          ? isRegenerate ? '#39ff14' : '#00dcff'
          : 'rgba(255,255,255,0.25)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        boxShadow: isActive
          ? isRegenerate
            ? '0 0 20px rgba(57,255,20,0.12), inset 0 1px 0 rgba(255,255,255,0.05)'
            : '0 0 20px rgba(0,220,255,0.12), inset 0 1px 0 rgba(255,255,255,0.05)'
          : 'none',
        opacity: isDisabled ? 0.5 : 1,
        letterSpacing: '0.02em',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <Icon size={14} className={isLoading ? 'animate-spin' : ''} fill={!isLoading && !isRegenerate ? 'currentColor' : 'none'} />
      {label}
    </button>
  );
}