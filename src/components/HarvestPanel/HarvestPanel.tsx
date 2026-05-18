import { useState, useRef } from 'react';
import { useStore, HarvestResult } from '../../store/useStore';
import { X, Share2, ChevronDown, ChevronUp, Leaf } from 'lucide-react';
import ShareModal from './ShareModal';

const TABS = ['Core Insights', 'Generated Artifacts', 'Future Scenarios', 'Flow Analysis'] as const;

const TAB_ICONS: Record<string, string> = {
  'Core Insights': '💡',
  'Generated Artifacts': '⚗️',
  'Future Scenarios': '🔮',
  'Flow Analysis': '📊',
};

const CARD_COLORS = ['cyan', 'green', 'pink', 'orange', 'blue', 'purple'];

function HarvestCard({
  result,
  onReplant,
  onShare,
  index,
}: {
  result: HarvestResult;
  onReplant: (r: HarvestResult) => void;
  onShare: (r: HarvestResult) => void;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = CARD_COLORS[index % CARD_COLORS.length];
  
  const colorMap: Record<string, { accent: string; bg: string; border: string }> = {
    cyan: { accent: '#00ffff', bg: 'rgba(0,255,255,0.05)', border: 'rgba(0,255,255,0.15)' },
    green: { accent: '#39ff14', bg: 'rgba(57,255,20,0.05)', border: 'rgba(57,255,20,0.15)' },
    pink: { accent: '#ff10f0', bg: 'rgba(255,16,240,0.05)', border: 'rgba(255,16,240,0.15)' },
    orange: { accent: '#ffa500', bg: 'rgba(255,165,0,0.05)', border: 'rgba(255,165,0,0.15)' },
    blue: { accent: '#1e90ff', bg: 'rgba(30,144,255,0.05)', border: 'rgba(30,144,255,0.15)' },
    purple: { accent: '#b400ff', bg: 'rgba(180,0,255,0.05)', border: 'rgba(180,0,255,0.15)' },
  };
  
  const c = colorMap[color];
  const content = result.content || {};

  return (
    <div
      className="harvest-card rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        minWidth: 240,
      }}
    >
      {/* Icon + Title */}
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
          style={{ background: `${c.accent}15`, border: `1px solid ${c.accent}25` }}
        >
          {TAB_ICONS[result.tab_type]}
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className="text-sm font-bold leading-tight"
            style={{ color: 'rgba(255,255,255,0.9)' }}
          >
            {result.title}
          </h4>
          <p
            className="text-xs italic mt-1 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            {result.summary}
          </p>
        </div>
      </div>

      {/* Content (expandable) */}
      {expanded && (
        <div className="space-y-2 fade-in">
          {content.paragraphs?.map((p: string, i: number) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {p}
            </p>
          ))}
          {content.key_points?.length > 0 && (
            <ul className="space-y-1">
              {content.key_points.map((pt: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <span style={{ color: c.accent, flexShrink: 0, marginTop: 1 }}>◆</span>
                  {pt}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Toggle expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs transition-colors self-start"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Show less' : 'Read more'}
      </button>

      {/* Actions */}
      <div className="flex gap-2 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => onReplant(result)}
          className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
          style={{
            background: `${c.accent}15`,
            border: `1px solid ${c.accent}30`,
            color: c.accent,
          }}
        >
          <Leaf size={11} />
          Replant Insight
        </button>
        <button
          onClick={() => onShare(result)}
          className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          <Share2 size={11} />
          Share Result
        </button>
      </div>
    </div>
  );
}

export default function HarvestPanel({
  onReplant,
}: {
  onReplant: (result: HarvestResult) => void;
}) {
  const {
    harvestResults, harvestVisible, setHarvestVisible,
    activeHarvestTab, setActiveHarvestTab,
    harvestHeight, setHarvestHeight,
    shareModal, setShareModal,
  } = useStore();

  const [minimized, setMinimized] = useState(false);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  if (!harvestVisible) return null;

  const filteredResults = harvestResults.filter(r => r.tab_type === activeHarvestTab);

  const handleDragStart = (e: React.MouseEvent) => {
    dragRef.current = { startY: e.clientY, startH: harvestHeight };
    const handleMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dy = dragRef.current.startY - e.clientY;
      const newH = Math.max(20, Math.min(80, dragRef.current.startH + (dy / window.innerHeight) * 100));
      setHarvestHeight(newH);
    };
    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <>
      <div
        className="absolute bottom-0 left-0 right-0 harvest-slide flex flex-col"
        style={{
          height: minimized ? '42px' : `${harvestHeight}%`,
          background: 'rgba(9,13,24,0.98)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
          zIndex: 20,
          transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex items-center justify-center py-1 flex-shrink-0 cursor-ns-resize"
          onMouseDown={handleDragStart}
          style={{ borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Tabs bar */}
        <div
          className="flex items-center justify-between px-5 flex-shrink-0"
          style={{
            borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.06)',
            height: minimized ? '100%' : undefined,
          }}
        >
          <div className="flex">
            {TABS.map((tab) => {
              const count = harvestResults.filter(r => r.tab_type === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveHarvestTab(tab); setMinimized(false); }}
                  className={`harvest-tab ${activeHarvestTab === tab && !minimized ? 'active' : ''}`}
                  style={{
                    color: activeHarvestTab === tab && !minimized
                      ? 'rgba(255,255,255,0.9)'
                      : 'rgba(255,255,255,0.38)',
                  }}
                >
                  <span className="mr-1">{TAB_ICONS[tab]}</span>
                  {tab}
                  {count > 0 && (
                    <span
                      className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(0,220,255,0.1)',
                        color: 'rgba(0,220,255,0.7)',
                        fontSize: 9,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMinimized(!minimized)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {minimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={() => setHarvestVisible(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Cards grid */}
        {!minimized && (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {filteredResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                <span className="text-3xl">{TAB_ICONS[activeHarvestTab]}</span>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>No results for this tab yet</p>
              </div>
            ) : (
              <div className="grid gap-4"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {filteredResults.map((result, i) => (
                  <HarvestCard
                    key={result.id}
                    result={result}
                    index={i}
                    onReplant={onReplant}
                    onShare={(r) => setShareModal({ open: true, content: r })}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share modal */}
      {shareModal.open && shareModal.content && (
        <ShareModal
          result={shareModal.content}
          onClose={() => setShareModal({ open: false, content: null })}
        />
      )}
    </>
  );
}
