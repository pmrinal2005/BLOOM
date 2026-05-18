import { useStore } from '../store/useStore';
import { Play, Loader } from 'lucide-react';

export default function StartGrowthButton({ onStart }: { onStart: () => void }) {
  const { generationStatus, problemDescription } = useStore();

  // Growth can only start if problemDescription has text
  const hasDescription = problemDescription.trim().length > 0;
  const isLoading = generationStatus === 'loading';
  const isDisabled = isLoading || !hasDescription;

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onStart}
        disabled={isDisabled}
        className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
        style={{
          background: isLoading
            ? 'rgba(0,220,255,0.08)'
            : hasDescription
            ? 'linear-gradient(135deg, rgba(0,220,255,0.25), rgba(0,180,200,0.2))'
            : 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${
            isLoading
              ? 'rgba(0,220,255,0.25)'
              : hasDescription
              ? 'rgba(0,220,255,0.45)'
              : 'rgba(255,255,255,0.08)'
          }`,
          color: hasDescription ? '#00dcff' : 'rgba(255,255,255,0.25)',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          boxShadow:
            hasDescription && !isLoading
              ? '0 0 20px rgba(0,220,255,0.12), inset 0 1px 0 rgba(255,255,255,0.05)'
              : 'none',
          letterSpacing: '0.02em',
        }}
      >
        {isLoading ? (
          <>
            <Loader size={15} className="animate-spin" />
            Growing...
          </>
        ) : (
          <>
            <Play size={15} fill="currentColor" />
            Start Growth Process
          </>
        )}
      </button>

      {/* Hint shown when no description provided */}
      {!hasDescription && !isLoading && (
        <span
          className="text-xs text-center"
          style={{ color: 'rgba(0,220,255,0.45)', fontSize: 10 }}
        >
          Enter a problem description to begin
        </span>
      )}
    </div>
  );
}