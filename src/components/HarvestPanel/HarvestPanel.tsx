// C:\Users\mrutu\OneDrive\Desktop\bloom\src\components\HarvestPanel\HarvestPanel.tsx
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
    cyan:   { accent: '#00ffff', bg: 'rgba(0,255,255,0.05)',   border: 'rgba(0,255,255,0.15)'   },
    green:  { accent: '#39ff14', bg: 'rgba(57,255,20,0.05)',   border: 'rgba(57,255,20,0.15)'   },
    pink:   { accent: '#ff10f0', bg: 'rgba(255,16,240,0.05)',  border: 'rgba(255,16,240,0.15)'  },
    orange: { accent: '#ffa500', bg: 'rgba(255,165,0,0.05)',   border: 'rgba(255,165,0,0.15)'   },
    blue:   { accent: '#1e90ff', bg: 'rgba(30,144,255,0.05)',  border: 'rgba(30,144,255,0.15)'  },
    purple: { accent: '#b400ff', bg: 'rgba(180,0,255,0.05)',   border: 'rgba(180,0,255,0.15)'   },
  };

  const c = colorMap[color];
  const content = result.content || {};

  return (
    <div
      className="harvest-card rounded-xl flex flex-col flex-shrink-0"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        width: 260,
        // Fixed height so cards never grow taller than the panel body
        height: '100%',
        padding: '10px 12px',
        gap: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── Icon + Title row ── */}
      <div className="flex items-start gap-2" style={{ flexShrink: 0 }}>
        <div
          className="flex items-center justify-center flex-shrink-0 text-sm rounded-lg"
          style={{
            width: 30,
            height: 30,
            background: `${c.accent}15`,
            border: `1px solid ${c.accent}25`,
          }}
        >
          {TAB_ICONS[result.tab_type]}
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className="font-bold leading-tight"
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 11,
              // Clamp title to 2 lines max
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {result.title}
          </h4>
        </div>
      </div>

      {/* ── Summary ── always visible, clamped to 2 lines ── */}
      <p
        style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: 10,
          fontStyle: 'italic',
          lineHeight: 1.4,
          marginTop: 6,
          flexShrink: 0,
          // Clamp so it never grows too tall
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {result.summary}
      </p>

      {/* ── Expanded content ── scrollable mini area ── */}
      {expanded && (
        <div
          className="fade-in"
          style={{
            flex: 1,
            overflowY: 'auto',
            marginTop: 6,
            marginBottom: 6,
            paddingRight: 2,
          }}
        >
          {content.paragraphs?.map((p: string, i: number) => (
            <p
              key={i}
              style={{
                fontSize: 10,
                lineHeight: 1.45,
                color: 'rgba(255,255,255,0.6)',
                marginBottom: 4,
              }}
            >
              {p}
            </p>
          ))}
          {content.key_points?.length > 0 && (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {content.key_points.map((pt: string, i: number) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 5,
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.55)',
                    marginBottom: 3,
                  }}
                >
                  <span style={{ color: c.accent, flexShrink: 0, marginTop: 1, fontSize: 8 }}>◆</span>
                  {pt}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Spacer when collapsed so buttons stay at bottom ── */}
      {!expanded && <div style={{ flex: 1 }} />}

      {/* ── Toggle read more ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          fontSize: 10,
          color: 'rgba(255,255,255,0.35)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 0',
          flexShrink: 0,
          marginBottom: 6,
        }}
      >
        {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        {expanded ? 'Show less' : 'Read more'}
      </button>

      {/* ── Action buttons ── always visible at bottom ── */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          paddingTop: 6,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => onReplant(result)}
          style={{
            flex: 1,
            padding: '5px 0',
            borderRadius: 8,
            fontSize: 10,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            background: `${c.accent}15`,
            border: `1px solid ${c.accent}30`,
            color: c.accent,
            cursor: 'pointer',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Leaf size={10} />
          Replant
        </button>
        <button
          onClick={() => onShare(result)}
          style={{
            flex: 1,
            padding: '5px 0',
            borderRadius: 8,
            fontSize: 10,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.55)',
            cursor: 'pointer',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Share2 size={10} />
          Share
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
        {/* ── Drag handle ── */}
        <div
          className="flex items-center justify-center py-1 flex-shrink-0 cursor-ns-resize"
          onMouseDown={handleDragStart}
          style={{ borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* ── Tabs bar ── */}
        <div
          className="flex items-center justify-between px-5 flex-shrink-0"
          style={{
            borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.06)',
            height: minimized ? 'calc(100% - 18px)' : undefined,
          }}
        >
          {/* Scrollable tab row (in case tabs overflow on very small widths) */}
          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
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
                      className="ml-1.5 rounded-full"
                      style={{
                        background: 'rgba(0,220,255,0.1)',
                        color: 'rgba(0,220,255,0.7)',
                        fontSize: 9,
                        padding: '1px 5px',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
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

        {/* ── Cards area — horizontal scroll ── */}
        {!minimized && (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: '10px 20px',
              overflowX: filteredResults.length > 0 ? 'auto' : 'hidden',
              overflowY: 'hidden',
              display: 'flex',
              alignItems: 'stretch',
            }}
          >
            {filteredResults.length === 0 ? (
              /* ── Empty state ── */
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  opacity: 0.5,
                }}
              >
                <span style={{ fontSize: 28 }}>{TAB_ICONS[activeHarvestTab]}</span>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  No results for this tab yet
                </p>
              </div>
            ) : (
              /* ── Horizontal card row ── */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                  // Height fills the available area so cards can use height:'100%'
                  alignItems: 'stretch',
                  // Prevent wrapping so cards go sideways
                  flexWrap: 'nowrap',
                  // Let row be wider than container → triggers horizontal scroll
                  width: 'max-content',
                  height: '100%',
                }}
              >
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

      {/* ── Share modal ── */}
      {shareModal.open && shareModal.content && (
        <ShareModal
          result={shareModal.content}
          onClose={() => setShareModal({ open: false, content: null })}
        />
      )}
    </>
  );
}