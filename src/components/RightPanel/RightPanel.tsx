import { useStore } from '../../store/useStore';
import ReasoningStream from './ReasoningStream';
import ModelControls from './ModelControls';
import { ChevronRight, ChevronLeft, Activity } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

const PANEL_WIDTH = 280;
const MIN_SECTION_HEIGHT = 80; // px minimum for each section

export default function RightPanel({ onRegenerate }: { onRegenerate: () => void }) {
  const { rightPanelOpen, setRightPanelOpen, showReasoning } = useStore();

  // Height of the reasoning stream section in px (draggable)
  const [reasoningHeight, setReasoningHeight] = useState(260);
  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    dragStartY.current = e.clientY;
    dragStartH.current = reasoningHeight;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = ev.clientY - dragStartY.current;
      const containerH = containerRef.current?.clientHeight ?? 600;
      const maxH = containerH - MIN_SECTION_HEIGHT - 8; // 8 = divider height
      const newH = Math.max(
        MIN_SECTION_HEIGHT,
        Math.min(maxH, dragStartH.current + delta)
      );
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        flexShrink: 0,
        width: rightPanelOpen ? PANEL_WIDTH : 24,
        minWidth: rightPanelOpen ? PANEL_WIDTH : 24,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* ── Collapsed state: full-height tab with big chevron ── */}
      {!rightPanelOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(11,15,28,0.98)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setRightPanelOpen(true)}
            title="Open Live Analysis"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 56,
              background: 'rgba(0,220,255,0.08)',
              border: '1px solid rgba(0,220,255,0.22)',
              borderRight: 'none',
              borderRadius: '8px 0 0 8px',
              cursor: 'pointer',
              color: '#00dcff',
            }}
          >
            {/* Bold chevron via SVG stroke-width */}
            <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
              <polyline
                points="10,3 3,10 10,17"
                stroke="#00dcff"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* ── Panel body ── */}
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: PANEL_WIDTH,
          background: 'rgba(11,15,28,0.98)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          opacity: rightPanelOpen ? 1 : 0,
          pointerEvents: rightPanelOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s',
          overflow: 'hidden',
        }}
      >
        {/* Panel header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} style={{ color: '#00ffff' }} />
            <span
              style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}
            >
              Live Analysis
            </span>
          </div>
          <button
            onClick={() => setRightPanelOpen(false)}
            title="Collapse"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polyline
                points="4,2 10,7 4,12"
                stroke="rgba(255,255,255,0.75)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {showReasoning ? (
          <>
            {/* Reasoning Stream — resizable height */}
            <div
              style={{
                height: reasoningHeight,
                minHeight: MIN_SECTION_HEIGHT,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <ReasoningStream />
            </div>

            {/* Drag divider */}
            <div
              onMouseDown={onMouseDown}
              style={{
                height: 8,
                flexShrink: 0,
                background: 'rgba(255,255,255,0.04)',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                cursor: 'row-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
              }}
            >
              {/* Drag handle dots */}
              <div style={{ display: 'flex', gap: 3 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.25)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Model Controls — takes remaining space */}
            <div style={{ flex: 1, overflow: 'hidden', minHeight: MIN_SECTION_HEIGHT }}>
              <ModelControls onRegenerate={onRegenerate} />
            </div>
          </>
        ) : (
          /* No reasoning stream → model controls take all space */
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <ModelControls onRegenerate={onRegenerate} />
          </div>
        )}
      </div>
    </div>
  );
}