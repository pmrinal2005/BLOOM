import { useState, useRef } from 'react';
import { useStore, HarvestResult } from '../../store/useStore';
import { X, Share2, ChevronDown, ChevronUp, Leaf, Maximize2 } from 'lucide-react';
import ShareModal from './ShareModal';

const TABS = ['Core Insights', 'Generated Artifacts', 'Future Scenarios', 'Flow Analysis'] as const;

const TAB_ICONS: Record<string, string> = {
  'Core Insights': '💡',
  'Generated Artifacts': '⚗️',
  'Future Scenarios': '🔮',
  'Flow Analysis': '📊',
};

const CARD_COLORS = ['cyan', 'green', 'pink', 'orange', 'blue', 'purple'];

// ── Point 3: Full-screen card modal ──
function CardModal({
  result,
  onClose,
  onReplant,
  onShare,
  index,
}: {
  result: HarvestResult;
  onClose: () => void;
  onReplant: (r: HarvestResult) => void;
  onShare: (r: HarvestResult) => void;
  index: number;
}) {
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const colorMap: Record<string, { accent: string; bg: string; border: string }> = {
    cyan:   { accent: '#00ffff', bg: 'rgba(0,255,255,0.06)',   border: 'rgba(0,255,255,0.25)'   },
    green:  { accent: '#39ff14', bg: 'rgba(57,255,20,0.06)',   border: 'rgba(57,255,20,0.25)'   },
    pink:   { accent: '#ff10f0', bg: 'rgba(255,16,240,0.06)',  border: 'rgba(255,16,240,0.25)'  },
    orange: { accent: '#ffa500', bg: 'rgba(255,165,0,0.06)',   border: 'rgba(255,165,0,0.25)'   },
    blue:   { accent: '#1e90ff', bg: 'rgba(30,144,255,0.06)',  border: 'rgba(30,144,255,0.25)'  },
    purple: { accent: '#b400ff', bg: 'rgba(180,0,255,0.06)',   border: 'rgba(180,0,255,0.25)'   },
  };
  const c = colorMap[color];
  const content = result.content || {};

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '90%', maxWidth: 680, maxHeight: '80vh',
          borderRadius: 18, overflow: 'hidden',
          background: 'rgba(9,13,24,0.99)',
          border: `1px solid ${c.border}`,
          boxShadow: `0 0 60px ${c.accent}22, 0 24px 80px rgba(0,0,0,0.7)`,
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${c.border}`,
          background: c.bg,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, fontSize: 18,
              background: `${c.accent}18`, border: `1px solid ${c.accent}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {TAB_ICONS[result.tab_type]}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3 }}>
                {result.title}
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', lineHeight: 1.5 }}>
                {result.summary}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)', flexShrink: 0, marginLeft: 12,
            }}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {content.paragraphs?.map((p: string, i: number) => (
            <p key={i} style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.72)', marginBottom: 14 }}>
              {p}
            </p>
          ))}
          {content.key_points?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: 10 }}>
                KEY POINTS
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {content.key_points.map((pt: string, i: number) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: c.accent, flexShrink: 0, marginTop: 2, fontSize: 10 }}>◆</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div style={{
          display: 'flex', gap: 10, padding: '16px 24px',
          borderTop: `1px solid ${c.border}`, flexShrink: 0,
        }}>
          <button
            onClick={() => { onReplant(result); onClose(); }}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: `${c.accent}18`, border: `1px solid ${c.accent}35`, color: c.accent,
              cursor: 'pointer',
            }}
          >
            <Leaf size={13} /> Replant Insight
          </button>
          <button
            onClick={() => { onShare(result); onClose(); }}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            }}
          >
            <Share2 size={13} /> Share Result
          </button>
        </div>
      </div>
    </div>
  );
}

function HarvestCard({
  result, onReplant, onShare, index,
}: {
  result: HarvestResult;
  onReplant: (r: HarvestResult) => void;
  onShare: (r: HarvestResult) => void;
  index: number;
}) {
  const [modalOpen, setModalOpen] = useState(false);
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

  return (
    <>
      <div
        className="harvest-card rounded-xl flex flex-col flex-shrink-0"
        style={{ background: c.bg, border: `1px solid ${c.border}`, width: 260, height: '100%', padding: '10px 12px', overflow: 'hidden' }}
      >
        {/* Icon + Title */}
        <div className="flex items-start gap-2" style={{ flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, fontSize: 14, background: `${c.accent}20`, border: `1px solid ${c.accent}30`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {TAB_ICONS[result.tab_type]}
          </div>
          <h4 style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 700, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0, flex: 1 }}>
            {result.title}
          </h4>
        </div>

        {/* Summary */}
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontStyle: 'italic', lineHeight: 1.4, marginTop: 6, marginBottom: 0, flexShrink: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {result.summary}
        </p>

        <div style={{ flex: 1 }} />

        {/* ── Point 3: "Read more" opens modal ── */}
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 3, fontSize: 10,
            color: c.accent, background: 'none', border: 'none', cursor: 'pointer',
            padding: '3px 0', flexShrink: 0, marginBottom: 5, opacity: 0.8,
          }}
        >
          <Maximize2 size={9} />
          Read more
        </button>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button
            onClick={() => onReplant(result)}
            style={{ flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: `${c.accent}18`, border: `1px solid ${c.accent}35`, color: c.accent, cursor: 'pointer' }}
          >
            <Leaf size={10} /> Replant
          </button>
          <button
            onClick={() => onShare(result)}
            style={{ flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}
          >
            <Share2 size={10} /> Share
          </button>
        </div>
      </div>

      {modalOpen && (
        <CardModal
          result={result} index={index}
          onClose={() => setModalOpen(false)}
          onReplant={onReplant}
          onShare={onShare}
        />
      )}
    </>
  );
}

// ── Point 2: Min height = 28% of viewport, no X button ──
const MIN_HEIGHT_PCT = 28;

export default function HarvestPanel({ onReplant }: { onReplant: (result: HarvestResult) => void }) {
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
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startH: harvestHeight };
    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dy = dragRef.current.startY - ev.clientY;
      // ── Point 2: enforce minimum height ──
      const newH = Math.max(MIN_HEIGHT_PCT, Math.min(75, dragRef.current.startH + (dy / window.innerHeight) * 100));
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
        data-harvest-panel
        className="absolute bottom-0 harvest-slide flex flex-col"
        style={{
          // ── Point 2: sideways spacing from left & right panels ──
          left: 12,
          right: 12,
          height: minimized ? '44px' : `${harvestHeight}%`,
          background: 'rgba(9,13,24,0.98)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          zIndex: 20,
          transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.55)',
          borderRadius: '12px 12px 0 0',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex items-center justify-center flex-shrink-0 cursor-ns-resize"
          onMouseDown={handleDragStart}
          style={{ height: 18, borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.06)' }}
        >
          <div style={{ width: 44, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
        </div>

        {/* Tabs bar — NO X button */}
        <div className="flex items-center justify-between flex-shrink-0"
          style={{ padding: '0 16px', borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.06)', minHeight: minimized ? 'calc(100% - 18px)' : 40 }}>
          <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {TABS.map(tab => {
              const count = harvestResults.filter(r => r.tab_type === tab).length;
              return (
                <button key={tab}
                  onClick={() => { setActiveHarvestTab(tab); setMinimized(false); }}
                  className={`harvest-tab ${activeHarvestTab === tab && !minimized ? 'active' : ''}`}
                  style={{ color: activeHarvestTab === tab && !minimized ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.38)' }}
                >
                  <span style={{ marginRight: 4 }}>{TAB_ICONS[tab]}</span>
                  {tab}
                  {count > 0 && (
                    <span style={{ marginLeft: 6, fontSize: 9, padding: '1px 5px', borderRadius: 10, background: 'rgba(0,220,255,0.12)', color: 'rgba(0,220,255,0.75)' }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* ── Point 2: Only collapse "v" button, no X ── */}
          <button
            onClick={() => setMinimized(!minimized)}
            style={{
              width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.55)',
            }}
            title={minimized ? 'Expand panel' : 'Collapse panel'}
          >
            {minimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Cards */}
        {!minimized && (
          <div style={{
            flex: 1, minHeight: 0, padding: '10px 16px',
            overflowX: filteredResults.length > 0 ? 'auto' : 'hidden',
            overflowY: 'hidden', display: 'flex', alignItems: 'stretch',
          }}>
            {filteredResults.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0.5 }}>
                <span style={{ fontSize: 28 }}>{TAB_ICONS[activeHarvestTab]}</span>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>No results for this tab yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'stretch', flexWrap: 'nowrap', width: 'max-content', height: '100%' }}>
                {filteredResults.map((result, i) => (
                  <HarvestCard key={result.id} result={result} index={i}
                    onReplant={onReplant}
                    onShare={r => setShareModal({ open: true, content: r })}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {shareModal.open && shareModal.content && (
        <ShareModal result={shareModal.content} onClose={() => setShareModal({ open: false, content: null })} />
      )}
    </>
  );
}