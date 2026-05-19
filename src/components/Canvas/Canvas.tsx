import { useRef, useState, useCallback, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import CentralOrb from './CentralOrb';
import FlowerNode from './FlowerNode';
import VineConnection from './VineConnection';
import { ZoomIn, ZoomOut, RotateCcw, Minimize2 } from 'lucide-react';

interface Props {
  onDeletePetal: (flowerId: string, petalId: string) => void;
  onDeleteFlower: (flowerId: string) => void;
  pulseBright: boolean;
}

export default function Canvas({ onDeletePetal, onDeleteFlower, pulseBright }: Props) {
  const {
    flowers, connections, generationStatus, errorMessage,
    canvasZoom, setCanvasZoom,
    canvasOffset, setCanvasOffset,
    hoveredFlowerId, setHoveredFlowerId,
    hoveredConnectionId, setHoveredConnectionId,
    selectedFlowerId, setSelectedFlowerId,
    deletingFlowerId, rebalancing,
    compactView, setCompactView,
    updateFlower,
    harvestVisible, harvestHeight,
  } = useStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });
  const [svgSize, setSvgSize] = useState({ w: 800, h: 600 });

  // Zoom input state
  const [zoomInputValue, setZoomInputValue] = useState<string>(String(Math.round(canvasZoom * 100)));
  const [zoomInputFocused, setZoomInputFocused] = useState(false);

  // Keep input display in sync when zoom changes externally (wheel, buttons)
  // but not while user is actively typing
  useEffect(() => {
    if (!zoomInputFocused) {
      setZoomInputValue(String(Math.round(canvasZoom * 100)));
    }
  }, [canvasZoom, zoomInputFocused]);

  useEffect(() => {
    const update = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setSvgSize({ w: rect.width, h: rect.height });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setCanvasZoom(canvasZoom * delta);
  }, [canvasZoom, setCanvasZoom]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    lastPan.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPan.current.x;
    const dy = e.clientY - lastPan.current.y;
    lastPan.current = { x: e.clientX, y: e.clientY };
    setCanvasOffset({ x: canvasOffset.x + dx, y: canvasOffset.y + dy });
  };

  const handleMouseUp = () => { isPanning.current = false; };

  // ── Point 2: Reset view → centre on orb + 100% zoom ──
  const handleResetView = useCallback(() => {
    setCanvasOffset({ x: 0, y: 0 });
    setCanvasZoom(1);
  }, [setCanvasOffset, setCanvasZoom]);

  // ── Point 3: Zoom input handlers ──
  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits while typing
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setZoomInputValue(raw);
  };

  const commitZoomInput = () => {
    const parsed = parseInt(zoomInputValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      // Clamp to store limits (30–300)
      const clamped = Math.max(30, Math.min(300, parsed));
      setCanvasZoom(clamped / 100);
      setZoomInputValue(String(clamped));
    } else {
      // Revert to current zoom if invalid
      setZoomInputValue(String(Math.round(canvasZoom * 100)));
    }
    setZoomInputFocused(false);
  };

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setZoomInputValue(String(Math.round(canvasZoom * 100)));
      setZoomInputFocused(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  // ── Point 1: Dynamic bottom offset for toolbar ──
  // harvestHeight is % of the canvas container height.
  // When harvest panel is visible & not minimised we push toolbar up.
  // We use CSS calc to make it dynamic — pass as inline style bottom value.
  const toolbarBottom = harvestVisible
    ? `calc(${harvestHeight}% + 14px)`
    : '20px';

  const cx = svgSize.w / 2 + canvasOffset.x;
  const cy = svgSize.h / 2 + canvasOffset.y;

  const hasContent = flowers.length > 0;
  const isLoading = generationStatus === 'loading';
  const isEmpty = generationStatus === 'empty';
  const isError = generationStatus === 'error';

  return (
    <div className="relative w-full h-full overflow-hidden canvas-bg canvas-grid">
      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
      >
        {/* Root system background texture */}
        <defs>
          <radialGradient id="canvasBg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(0,60,100,0.06)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <pattern id="rootGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="0.6" fill="rgba(255,255,255,0.025)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#rootGrid)" />
        <rect width="100%" height="100%" fill="url(#canvasBg)" />

        <g transform={`translate(${cx}, ${cy}) scale(${canvasZoom})`}>
          {/* Vine connections (draw behind flowers) */}
          {connections.map((conn) => (
            <VineConnection
              key={conn.id}
              connection={conn}
              flowers={flowers}
              isHovered={hoveredConnectionId === conn.id}
              isDeleting={deletingFlowerId === conn.target_id || deletingFlowerId === conn.source_id}
              onHover={setHoveredConnectionId}
            />
          ))}

          {/* Flower nodes */}
          {flowers.map((flower) => (
            <FlowerNode
              key={flower.id}
              flower={flower}
              isDeleting={deletingFlowerId === flower.id}
              isHovered={hoveredFlowerId === flower.id}
              isSelected={selectedFlowerId === flower.id}
              compactView={compactView}
              onHover={setHoveredFlowerId}
              onSelect={setSelectedFlowerId}
              onDeletePetal={onDeletePetal}
              onDeleteFlower={onDeleteFlower}
              onEditFlower={(id, name) => updateFlower(id, { entity_name: name })}
              appearing
            />
          ))}

          {/* Central orb */}
          <CentralOrb pulseBright={pulseBright} />
        </g>

        {/* Initial empty state overlay */}
        {!hasContent && !isLoading && !isError && generationStatus === 'idle' && (
          <g>
            <text x="50%" y="35%" textAnchor="middle"
              style={{
                fill: 'rgba(255,255,255,0.25)',
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
              }}>
              Add Problem and Inspiration matrices on the left,
            </text>
            <text x="50%" y="35%" dy="22" textAnchor="middle"
              style={{
                fill: 'rgba(255,255,255,0.25)',
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
              }}>
              then click Start Growth to begin.
            </text>
          </g>
        )}

        {/* Loading state */}
        {isLoading && (
          <g>
            <text x="50%" y="20%" textAnchor="middle"
              style={{ fill: 'rgba(0,220,255,0.6)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
              Growing garden...
            </text>
          </g>
        )}

        {/* Empty response */}
        {isEmpty && (
          <g>
            <text x="50%" y="38%" textAnchor="middle"
              style={{ fill: 'rgba(255,200,50,0.7)', fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              No strong connections found.
            </text>
            <text x="50%" y="38%" dy="20" textAnchor="middle"
              style={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
              Try different inspirations or adjust Model Control sliders.
            </text>
          </g>
        )}

        {/* Error state */}
        {isError && (
          <g>
            <text x="50%" y="38%" textAnchor="middle"
              style={{ fill: 'rgba(255,100,100,0.8)', fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              {errorMessage || 'Connection issue. Please try again.'}
            </text>
          </g>
        )}

        {/* Low entity count - expand button */}
        {hasContent && flowers.length <= 2 && !isLoading && (
          <foreignObject x="50%" y="25%" width="200" height="50" style={{ transform: 'translateX(-100px)' }}>
            <div
              className="expand-pulse flex items-center justify-center gap-2 text-xs font-medium px-4 py-2 rounded-xl"
              style={{
                background: 'rgba(0,220,255,0.1)',
                border: '1px solid rgba(0,220,255,0.3)',
                color: 'rgba(0,220,255,0.85)',
                cursor: 'pointer',
              }}
            >
              ✦ Expand this idea
            </div>
          </foreignObject>
        )}
      </svg>

      {/* Rebalancing overlay */}
      {rebalancing && (
        <div
          className="absolute inset-0 flex items-center justify-center rebalancing-overlay"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="px-8 py-5 rounded-2xl text-center"
            style={{
              background: 'rgba(9,13,24,0.95)',
              border: '1px solid rgba(0,220,255,0.25)',
              boxShadow: '0 0 40px rgba(0,220,255,0.1)',
            }}
          >
            <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-t-transparent border-cyan-400"
              style={{ animation: 'rotate 0.8s linear infinite' }} />
            <p className="text-sm font-semibold" style={{ color: 'rgba(0,220,255,0.9)' }}>Rebalancing garden structure...</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Redistributing conceptual relationships</p>
          </div>
        </div>
      )}

      {/* More blooms indicator */}
      {flowers.length > 8 && (
        <div
          className="absolute right-20 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: 'rgba(180,0,255,0.15)',
            border: '1px solid rgba(180,0,255,0.35)',
            color: 'rgba(180,0,255,0.9)',
          }}
        >
          +{flowers.length - 8} more
        </div>
      )}

      {/*
       * ── Point 1: Floating toolbar ──
       * bottom is dynamically calculated so the toolbar always sits above
       * the harvest panel regardless of its height.
       * Transition ensures smooth movement when panel appears/resizes.
       */}
      <div
        className="absolute right-5 flex flex-col gap-2"
        style={{
          bottom: toolbarBottom,
          zIndex: 25,
          transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/*
         * ── Button 1: Compact View toggle ──
         * Toggles compactView in store → assignPositions uses tighter radii
         * so flowers cluster closer to the central orb (compact rings).
         */}
        <button
          onClick={() => setCompactView(!compactView)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          title="Compact View — tighten flower ring spacing"
          style={{
            background: compactView ? 'rgba(0,220,255,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${compactView ? 'rgba(0,220,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
            color: compactView ? '#00dcff' : 'rgba(255,255,255,0.5)',
          }}
        >
          <Minimize2 size={14} />
        </button>

        {/*
         * ── Button 2: Reset View ──
         * Point 2: resets canvas offset to 0,0 (centres on orb) AND zoom to 1 (100%)
         */}
        <button
          onClick={handleResetView}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          title="Reset View — re-centre on Core Soul orb at 100% zoom"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          <RotateCcw size={14} />
        </button>

        {/* ── Button 3: Zoom In ── */}
        <button
          onClick={() => setCanvasZoom(Math.min(3, canvasZoom * 1.25))}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          title="Zoom In"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          <ZoomIn size={14} />
        </button>

        {/* ── Button 4: Zoom Out ── */}
        <button
          onClick={() => setCanvasZoom(Math.max(0.3, canvasZoom * 0.8))}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          title="Zoom Out"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          <ZoomOut size={14} />
        </button>

        {/*
         * ── Point 3: Zoom % input box ──
         * Replaces the static display div.
         * User can click, type an integer percentage, press Enter or blur to apply.
         * Clamped to 30–300 to match store limits.
         * Smooth zoom: setCanvasZoom already transitions via CSS transform on the SVG <g>.
         */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: zoomInputFocused
              ? 'rgba(0,220,255,0.12)'
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${zoomInputFocused ? 'rgba(0,220,255,0.45)' : 'rgba(255,255,255,0.07)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          title="Type zoom % and press Enter"
        >
          <input
            type="text"
            inputMode="numeric"
            value={zoomInputValue}
            onChange={handleZoomInputChange}
            onFocus={() => {
              setZoomInputFocused(true);
              setZoomInputValue(String(Math.round(canvasZoom * 100)));
            }}
            onBlur={commitZoomInput}
            onKeyDown={handleZoomInputKeyDown}
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              textAlign: 'center',
              fontSize: zoomInputValue.length > 3 ? 8 : 9,
              fontWeight: 600,
              color: zoomInputFocused ? 'rgba(0,220,255,0.9)' : 'rgba(255,255,255,0.35)',
              cursor: 'text',
              padding: '0 2px',
              fontFamily: 'Inter, sans-serif',
              fontVariantNumeric: 'tabular-nums',
              // Hide browser spin buttons / number arrows
              MozAppearance: 'textfield',
            } as React.CSSProperties}
            maxLength={3}
          />
        </div>
      </div>

      {/* Rebalance button when overcrowded — also shifts up with harvest panel */}
      {flowers.length > 12 && (
        <button
          className="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
          style={{
            bottom: toolbarBottom,
            zIndex: 25,
            transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: 'rgba(0,220,255,0.1)',
            border: '1px solid rgba(0,220,255,0.25)',
            color: 'rgba(0,220,255,0.8)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ⊞ Rebalance View
          </span>
        </button>
      )}
    </div>
  );
}