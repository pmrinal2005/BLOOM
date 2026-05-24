import { useStore } from '../../store/useStore';
import ReasoningStream from './ReasoningStream';
import ModelControls from './ModelControls';
import { Activity } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

const PANEL_WIDTH = 280;
const MIN_SECTION_HEIGHT = 80;

export default function RightPanel({ onRegenerate }: { onRegenerate: () => void }) {
  const { rightPanelOpen, setRightPanelOpen, showReasoning, theme } = useStore();
  const isDark = theme === 'dark';

  const [reasoningHeight, setReasoningHeight] = useState(260);
  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Task 10: stronger light mode colors
  const panelBg = isDark ? 'rgba(11,15,28,0.98)' : 'rgba(250,252,255,0.99)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)';
  const headerTitleColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.88)';
  const collapseTabBg = isDark ? 'rgba(0,220,255,0.08)' : 'rgba(0,160,200,0.1)';
  const collapseTabBorder = isDark ? 'rgba(0,220,255,0.22)' : 'rgba(0,160,200,0.35)';
  const collapseChevronColor = isDark ? '#00dcff' : '#0088aa';
  const headerBorderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const collapseBtnBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
  const collapseBtnBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.14)';
  const collapseBtnColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)';
  const dividerBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const dividerBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)';
  const dividerDotColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)';

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    dragStartY.current = e.clientY;
    dragStartH.current = reasoningHeight;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = ev.clientY - dragStartY.current;
      const containerH = containerRef.current?.clientHeight ?? 600;
      const maxH = containerH - MIN_SECTION_HEIGHT - 8;
      const newH = Math.max(MIN_SECTION_HEIGHT, Math.min(maxH, dragStartH.current + delta));
      setReasoningHeight(newH);
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [reasoningHeight]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      position: 'relative', flexShrink: 0,
      width: rightPanelOpen ? PANEL_WIDTH : 24,
      minWidth: rightPanelOpen ? PANEL_WIDTH : 24,
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
    }}>
      {!rightPanelOpen && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: panelBg, borderLeft: `1px solid ${panelBorder}`, zIndex: 10, transition: 'background 0.3s ease' }}>
          <button
            onClick={() => setRightPanelOpen(true)}
            title="Open Live Analysis"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 56, background: collapseTabBg, border: `1px solid ${collapseTabBorder}`, borderRight: 'none', borderRadius: '8px 0 0 8px', cursor: 'pointer' }}
          >
            <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
              <polyline points="10,3 3,10 10,17" stroke={collapseChevronColor} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          display: 'flex', flexDirection: 'column', height: '100%',
          width: PANEL_WIDTH,
          background: panelBg,
          borderLeft: `1px solid ${panelBorder}`,
          opacity: rightPanelOpen ? 1 : 0,
          pointerEvents: rightPanelOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s, background 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${headerBorderColor}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} style={{ color: isDark ? '#00ffff' : '#0088aa' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: headerTitleColor }}>Live Analysis</span>
          </div>
          <button
            onClick={() => setRightPanelOpen(false)}
            title="Collapse"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: collapseBtnBg, border: `1px solid ${collapseBtnBorder}`, cursor: 'pointer', color: collapseBtnColor }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polyline points="4,2 10,7 4,12" stroke={collapseBtnColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {showReasoning ? (
          <>
            <div style={{ height: reasoningHeight, minHeight: MIN_SECTION_HEIGHT, overflow: 'hidden', flexShrink: 0 }}>
              <ReasoningStream />
            </div>
            <div
              onMouseDown={onMouseDown}
              style={{ height: 8, flexShrink: 0, background: dividerBg, borderTop: `1px solid ${dividerBorder}`, borderBottom: `1px solid ${dividerBorder}`, cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', gap: 3 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: dividerDotColor }} />
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', minHeight: MIN_SECTION_HEIGHT }}>
              <ModelControls onRegenerate={onRegenerate} />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <ModelControls onRegenerate={onRegenerate} />
          </div>
        )}
      </div>
    </div>
  );
}