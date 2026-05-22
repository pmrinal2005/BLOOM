import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore, HarvestResult } from '../../store/useStore';
import { ChevronUp, ChevronDown, X, ExternalLink } from 'lucide-react';

interface Props { onReplant: (result: HarvestResult) => void; }

function getTabColor(tabType: string) {
  const map: Record<string, { main: string; bg: string; border: string }> = {
    'Core Insights':       { main: '#00ffff', bg: 'rgba(0,255,255,0.09)',   border: 'rgba(0,255,255,0.28)' },
    'Generated Artifacts': { main: '#39ff14', bg: 'rgba(57,255,20,0.09)',   border: 'rgba(57,255,20,0.28)' },
    'Future Scenarios':    { main: '#ff10f0', bg: 'rgba(255,16,240,0.09)',  border: 'rgba(255,16,240,0.28)' },
    'Flow Analysis':       { main: '#ffa500', bg: 'rgba(255,165,0,0.09)',   border: 'rgba(255,165,0,0.28)' },
  };
  return map[tabType] ?? { main: '#00ffff', bg: 'rgba(0,255,255,0.09)', border: 'rgba(0,255,255,0.28)' };
}

function ReadMoreModal({ result, onClose }: { result: HarvestResult; onClose: () => void }) {
  const color = getTabColor(result.tab_type);
  const { theme } = useStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = prev; };
  }, [onClose]);

  const modalContent = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', padding: '20px 16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 680, maxHeight: '85vh', borderRadius: 18,
          background: isDark ? 'rgba(9,13,24,0.99)' : 'rgba(255,255,255,0.99)',
          border: `1px solid ${color.border}`,
          boxShadow: `0 0 80px ${color.main}20, 0 20px 60px rgba(0,0,0,0.5)`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`, flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
            <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: color.main, background: color.bg, border: `1px solid ${color.border}`, borderRadius: 6, padding: '2px 8px', marginBottom: 10 }}>
              {result.tab_type.toUpperCase()}
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)', margin: '0 0 8px', lineHeight: 1.3 }}>
              {result.title}
            </h3>
            <p style={{ fontSize: 12.5, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)', margin: 0, lineHeight: 1.6 }}>
              {result.summary}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, cursor: 'pointer', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', flexShrink: 0 }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '20px 24px 24px', flex: 1, minHeight: 0 }}>
          {(result.content?.paragraphs ?? []).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              {(result.content.paragraphs as string[]).map((p, i) => (
                <p key={i} style={{ fontSize: 13, lineHeight: 1.75, color: isDark ? 'rgba(255,255,255,0.76)' : 'rgba(0,0,0,0.72)', margin: '0 0 14px' }}>{p}</p>
              ))}
            </div>
          )}
          {(result.content?.key_points ?? []).length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)', textTransform: 'uppercase', margin: '0 0 14px' }}>KEY POINTS</p>
              {(result.content.key_points as string[]).map((pt, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: color.main, boxShadow: `0 0 6px ${color.main}` }} />
                    {i < (result.content.key_points as string[]).length - 1 && (
                      <div style={{ width: 1, flex: 1, minHeight: 10, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }} />
                    )}
                  </div>
                  <p style={{ fontSize: 12.5, lineHeight: 1.65, color: isDark ? 'rgba(255,255,255,0.74)' : 'rgba(0,0,0,0.7)', margin: 0 }}>{pt}</p>
                </div>
              ))}
            </div>
          )}
          {(result.content?.paragraphs ?? []).length === 0 && (result.content?.key_points ?? []).length === 0 && (
            <p style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', textAlign: 'center', margin: '24px 0' }}>No detailed content available.</p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Task 3: Fixed card — strict height control, buttons always visible
function HarvestCard({ result, onReplant }: { result: HarvestResult; onReplant: (r: HarvestResult) => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const { theme } = useStore();
  const isDark = theme === 'dark';
  const color = getTabColor(result.tab_type);

  // Task 1: Theme-aware card colors
  const cardBg = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.92)';
  const titleColor = isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)';
  const summaryColor = isDark ? 'rgba(255,255,255,0.48)' : 'rgba(0,0,0,0.58)';
  const pointColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.62)';

  return (
    <>
      {/* Task 3: Strict no-overflow card using flex column with fixed widths */}
      <div style={{
        width: 230,
        minWidth: 230,
        maxWidth: 230,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: cardBg,
        border: `1px solid ${color.border}`,
        borderRadius: 11,
        padding: '10px 11px 10px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        alignSelf: 'stretch',
      }}>
        {/* Badge */}
        <div style={{ flexShrink: 0, marginBottom: 6 }}>
          <span style={{
            display: 'inline-block', fontSize: 7.5, fontWeight: 700,
            letterSpacing: '0.08em', color: color.main,
            background: color.bg, border: `1px solid ${color.border}`,
            borderRadius: 4, padding: '1.5px 6px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}>
            {result.tab_type.toUpperCase()}
          </span>
        </div>

        {/* Title — max 2 lines */}
        <div style={{ flexShrink: 0, marginBottom: 5, overflow: 'hidden' }}>
          <h4 style={{
            color: titleColor, fontSize: 10.5, fontWeight: 700, margin: 0,
            lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {result.title}
          </h4>
        </div>

        {/* Summary — max 2 lines */}
        <div style={{ flexShrink: 0, marginBottom: 7, overflow: 'hidden' }}>
          <p style={{
            color: summaryColor, fontSize: 9, lineHeight: 1.45, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {result.summary}
          </p>
        </div>

        {/* Key points — max 2, each 1 line */}
        <div style={{ flexShrink: 0, marginBottom: 7, overflow: 'hidden' }}>
          {(result.content?.key_points ?? []).slice(0, 2).map((pt: string, i: number) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 5,
              marginBottom: i < 1 ? 4 : 0, overflow: 'hidden',
            }}>
              <div style={{
                width: 4, height: 4, borderRadius: '50%', marginTop: 4,
                flexShrink: 0, background: color.main,
                boxShadow: `0 0 3px ${color.main}`,
              }} />
              <span style={{
                color: pointColor, fontSize: 8.5, lineHeight: 1.35,
                display: '-webkit-box', WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                flex: 1, minWidth: 0,
              }}>{pt}</span>
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 2 }} />

        {/* Buttons — always at bottom, never overflow */}
        <div style={{
          display: 'flex', gap: 5, flexShrink: 0,
          paddingTop: 6,
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        }}>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              flex: 1, minWidth: 0,
              padding: '6px 2px', borderRadius: 7, fontSize: 8.5, fontWeight: 600,
              background: color.bg, border: `1px solid ${color.border}`,
              color: color.main, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
              transition: 'background 0.15s',
              whiteSpace: 'nowrap', overflow: 'hidden',
              boxSizing: 'border-box',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color.main}22`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = color.bg; }}
          >
            <ExternalLink size={8} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Read More</span>
          </button>
          <button
            onClick={() => onReplant(result)}
            style={{
              flex: 1, minWidth: 0,
              padding: '6px 2px', borderRadius: 7, fontSize: 8.5, fontWeight: 600,
              background: 'rgba(57,255,20,0.07)', border: '1px solid rgba(57,255,20,0.26)',
              color: isDark ? '#39ff14' : '#1a7700',
              cursor: 'pointer', transition: 'background 0.15s',
              whiteSpace: 'nowrap', overflow: 'hidden',
              boxSizing: 'border-box',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(57,255,20,0.18)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(57,255,20,0.07)'; }}
          >
            🌱 Replant
          </button>
        </div>
      </div>

      {modalOpen && <ReadMoreModal result={result} onClose={() => setModalOpen(false)} />}
    </>
  );
}

const MIN_HARVEST_HEIGHT = 240;
const MAX_HARVEST_HEIGHT_VH = 65;

export default function HarvestPanel({ onReplant }: Props) {
  const {
    harvestResults, harvestVisible, setHarvestVisible,
    harvestHeight, setHarvestHeight,
    activeHarvestTab, setActiveHarvestTab,
    generationStatus, theme,
  } = useStore();

  const isDark = theme === 'dark';
  const [minimized, setMinimized] = useState(false);
  const dragRef = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = true;
    dragStartY.current = e.clientY;
    dragStartH.current = harvestHeight;
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = dragStartY.current - ev.clientY;
      const maxH = (window.innerHeight * MAX_HARVEST_HEIGHT_VH) / 100;
      setHarvestHeight(Math.max(MIN_HARVEST_HEIGHT, Math.min(maxH, dragStartH.current + delta)));
    };
    const onUp = () => {
      dragRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [harvestHeight, setHarvestHeight]);

  if (!harvestVisible && generationStatus !== 'loading') return null;

  const allTabTypes = Array.from(new Set(harvestResults.map(h => h.tab_type)));
  const filteredResults = activeHarvestTab === 'All'
    ? harvestResults
    : harvestResults.filter(h => h.tab_type === activeHarvestTab);

  const displayHeight = minimized ? 48 : Math.max(MIN_HARVEST_HEIGHT, harvestHeight);

  // Task 1: Theme-aware panel
  const panelBg = isDark ? 'rgba(8,12,24,0.97)' : 'rgba(250,252,255,0.98)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const headerColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.82)';
  const countBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const countColor = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.42)';
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const btnBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.1)';
  const btnColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.52)';
  const dragHandleColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)';
  const emptyColor = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.3)';

  return (
    <div
      data-harvest-panel
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: displayHeight,
        background: panelBg,
        borderTop: `1px solid ${panelBorder}`,
        backdropFilter: 'blur(20px)',
        zIndex: 20,
        display: 'flex', flexDirection: 'column',
        transition: 'height 0.22s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: isDark ? '0 -4px 30px rgba(0,0,0,0.35)' : '0 -4px 20px rgba(0,0,0,0.1)',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={minimized ? undefined : onDragStart}
        style={{ height: 6, flexShrink: 0, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`, cursor: minimized ? 'default' : 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {!minimized && (
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 24, height: 2, borderRadius: 2, background: dragHandleColor }} />
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 14px', flexShrink: 0, borderBottom: minimized ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.07)'}`, height: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: headerColor }}>🌾 Harvest Panel</span>
          {harvestResults.length > 0 && (
            <span style={{ fontSize: 9, fontWeight: 700, color: countColor, background: countBg, borderRadius: 5, padding: '1px 7px' }}>
              {harvestResults.length} insight{harvestResults.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={() => setMinimized(!minimized)} style={{ width: 26, height: 26, borderRadius: 7, background: btnBg, border: `1px solid ${btnBorder}`, color: btnColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {minimized ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button onClick={() => setHarvestVisible(false)} style={{ width: 26, height: 26, borderRadius: 7, background: btnBg, border: `1px solid ${btnBorder}`, color: btnColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={13} />
          </button>
        </div>
      </div>

      {!minimized && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {/* Tab filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px 5px', flexShrink: 0, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.06)'}`, overflowX: 'auto' }}>
            <button
              onClick={() => setActiveHarvestTab('All')}
              style={{ padding: '3px 11px', borderRadius: 7, fontSize: 10, fontWeight: 600, background: activeHarvestTab === 'All' ? (isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.1)') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'), border: `1px solid ${activeHarvestTab === 'All' ? (isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.2)') : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)')}`, color: activeHarvestTab === 'All' ? (isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.8)') : (isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.45)'), cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}
            >
              All ({harvestResults.length})
            </button>
            {allTabTypes.map(tabType => {
              const color = getTabColor(tabType);
              const isActive = activeHarvestTab === tabType;
              return (
                <button key={tabType} onClick={() => setActiveHarvestTab(tabType as any)}
                  style={{ padding: '3px 11px', borderRadius: 7, fontSize: 10, fontWeight: 600, background: isActive ? color.bg : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'), border: `1px solid ${isActive ? color.border : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)')}`, color: isActive ? color.main : (isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.45)'), cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}
                >
                  {tabType}
                </button>
              );
            })}
          </div>

          {/* Task 3: Cards container — fixed row height, no vertical overflow */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'stretch',
            gap: 10,
            padding: '10px 14px',
            overflowX: 'auto',
            overflowY: 'hidden',
            minHeight: 0,
            boxSizing: 'border-box',
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? 'rgba(255,255,255,0.12) transparent' : 'rgba(0,0,0,0.12) transparent',
          }}>
            {filteredResults.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', color: emptyColor, fontSize: 11 }}>
                {generationStatus === 'loading' ? 'Generating insights...' : activeHarvestTab !== 'All' ? `No ${activeHarvestTab} results.` : 'No harvest results yet.'}
              </div>
            ) : (
              filteredResults.map(result => (
                <HarvestCard key={result.id} result={result} onReplant={onReplant} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}