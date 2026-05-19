import { useRef, useState, useCallback, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import CentralOrb from './CentralOrb';
import FlowerNode, { FlowerTooltipLayer } from './FlowerNode';
import VineConnection from './VineConnection';
import { ZoomIn, ZoomOut, RotateCcw, Minimize2 } from 'lucide-react';
import { cubicBezierPath, getColorConfig } from '../../utils/layout';

interface Props {
  onDeletePetal: (flowerId: string, petalId: string) => void;
  onDeleteFlower: (flowerId: string) => void;
  onManualConnect: (sourceType: 'orb' | 'flower', sourceId: string, targetType: 'orb' | 'flower', targetId: string) => void;
  pulseBright: boolean;
}

const SNAP_RADIUS = 60; // canvas-space pixels

export default function Canvas({ onDeletePetal, onDeleteFlower, pulseBright, onManualConnect }: Props) {
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
    draggingConnection, setDraggingConnection,
  } = useStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });
  const [svgSize, setSvgSize] = useState({ w: 800, h: 600 });

  // Tooltip state per flower (lifted here so FlowerTooltipLayer can be rendered on top)
  const [tooltipStates, setTooltipStates] = useState<
    Record<string, { show: boolean; deleteConfirm: boolean }>
  >({});

  // Zoom input
  const [zoomInputValue, setZoomInputValue] = useState<string>('100');
  const [zoomInputFocused, setZoomInputFocused] = useState(false);

  // Orb pulse phase (0..1) for energy wave animation
  const [orbPulsePhase, setOrbPulsePhase] = useState(0);
  const orbAnimRef = useRef<number>(0);
  const orbStartRef = useRef<number>(0);
  useEffect(() => {
    const animate = (ts: number) => {
      if (!orbStartRef.current) orbStartRef.current = ts;
      const elapsed = (ts - orbStartRef.current) / 1000;
      setOrbPulsePhase((elapsed % 3) / 3); // 3s period
      orbAnimRef.current = requestAnimationFrame(animate);
    };
    orbAnimRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(orbAnimRef.current);
  }, []);

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

  // Convert screen coords to canvas (SVG group) coords
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const svgX = clientX - rect.left;
    const svgY = clientY - rect.top;
    const cx = svgSize.w / 2 + canvasOffset.x;
    const cy = svgSize.h / 2 + canvasOffset.y;
    return {
      x: (svgX - cx) / canvasZoom,
      y: (svgY - cy) / canvasZoom,
    };
  }, [svgSize, canvasOffset, canvasZoom]);

  // Find nearest snap target
  const findSnapTarget = useCallback((canvasX: number, canvasY: number, excludeId: string) => {
    // Check orb (at 0,0)
    const orbDist = Math.sqrt(canvasX * canvasX + canvasY * canvasY);
    if (orbDist < SNAP_RADIUS) return { type: 'orb' as const, id: 'orb' };
    // Check flowers
    for (const f of flowers) {
      if (f.id === excludeId) continue;
      const dx = canvasX - f.position_x;
      const dy = canvasY - f.position_y;
      if (Math.sqrt(dx * dx + dy * dy) < SNAP_RADIUS) {
        return { type: 'flower' as const, id: f.id };
      }
    }
    return null;
  }, [flowers]);

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

  // ── Drag-to-connect from flower ──
  const handleFlowerDragStart = useCallback((e: React.MouseEvent, flowerId: string) => {
    e.stopPropagation();
    const flower = flowers.find(f => f.id === flowerId);
    if (!flower) return;
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setDraggingConnection({
      sourceType: 'flower',
      sourceId: flowerId,
      sourceX: flower.position_x,
      sourceY: flower.position_y,
      cursorX: canvasPos.x,
      cursorY: canvasPos.y,
      snapTargetId: null,
    });
  }, [flowers, screenToCanvas, setDraggingConnection]);

  // ── Drag-to-connect from orb ──
  const handleOrbDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setDraggingConnection({
      sourceType: 'orb',
      sourceId: 'orb',
      sourceX: 0,
      sourceY: 0,
      cursorX: canvasPos.x,
      cursorY: canvasPos.y,
      snapTargetId: null,
    });
  }, [screenToCanvas, setDraggingConnection]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (draggingConnection) return;
    isPanning.current = true;
    lastPan.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingConnection) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const snap = findSnapTarget(canvasPos.x, canvasPos.y, draggingConnection.sourceId);
      setDraggingConnection({
        ...draggingConnection,
        cursorX: canvasPos.x,
        cursorY: canvasPos.y,
        snapTargetId: snap?.id ?? null,
      });
      return;
    }
    if (!isPanning.current) return;
    const dx = e.clientX - lastPan.current.x;
    const dy = e.clientY - lastPan.current.y;
    lastPan.current = { x: e.clientX, y: e.clientY };
    setCanvasOffset({ x: canvasOffset.x + dx, y: canvasOffset.y + dy });
  }, [draggingConnection, screenToCanvas, findSnapTarget, setDraggingConnection, canvasOffset, setCanvasOffset]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    isPanning.current = false;
    if (!draggingConnection) return;
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    const snap = findSnapTarget(canvasPos.x, canvasPos.y, draggingConnection.sourceId);
    if (snap) {
      // Valid connection
      onManualConnect(draggingConnection.sourceType, draggingConnection.sourceId, snap.type, snap.id);
    }
    setDraggingConnection(null);
  }, [draggingConnection, screenToCanvas, findSnapTarget, onManualConnect, setDraggingConnection]);

  const handleResetView = useCallback(() => {
    setCanvasOffset({ x: 0, y: 0 });
    setCanvasZoom(1);
  }, [setCanvasOffset, setCanvasZoom]);

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setZoomInputValue(raw);
  };

  const commitZoomInput = () => {
    const parsed = parseInt(zoomInputValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.max(30, Math.min(300, parsed));
      setCanvasZoom(clamped / 100);
      setZoomInputValue(String(clamped));
    } else {
      setZoomInputValue(String(Math.round(canvasZoom * 100)));
    }
    setZoomInputFocused(false);
  };

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
    else if (e.key === 'Escape') {
      setZoomInputValue(String(Math.round(canvasZoom * 100)));
      setZoomInputFocused(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  // Point 1: dynamic toolbar bottom
  const toolbarBottom = harvestVisible
    ? `calc(${harvestHeight}% + 16px)`
    : '20px';

  const cx = svgSize.w / 2 + canvasOffset.x;
  const cy = svgSize.h / 2 + canvasOffset.y;

  const hasContent = flowers.length > 0;
  const isLoading = generationStatus === 'loading';
  const isEmpty = generationStatus === 'empty';
  const isError = generationStatus === 'error';

  // Rubber-band line endpoint
  const rubberEnd = draggingConnection?.snapTargetId
    ? (draggingConnection.snapTargetId === 'orb'
        ? { x: 0, y: 0 }
        : (() => {
            const f = flowers.find(fl => fl.id === draggingConnection.snapTargetId);
            return f ? { x: f.position_x, y: f.position_y } : { x: draggingConnection.cursorX, y: draggingConnection.cursorY };
          })())
    : { x: draggingConnection?.cursorX ?? 0, y: draggingConnection?.cursorY ?? 0 };

  // Tooltip state helpers
  const getTooltipState = (flowerId: string) =>
    tooltipStates[flowerId] ?? { show: false, deleteConfirm: false };

  const setTooltipShow = (flowerId: string, show: boolean) =>
    setTooltipStates(prev => ({ ...prev, [flowerId]: { ...getTooltipState(flowerId), show } }));

  const setDeleteConfirm = (flowerId: string, v: boolean) =>
    setTooltipStates(prev => ({ ...prev, [flowerId]: { ...getTooltipState(flowerId), deleteConfirm: v } }));

  // Sync tooltip visibility with hover
  useEffect(() => {
    if (!hoveredFlowerId) {
      // Clear all tooltips when nothing hovered
      setTooltipStates(prev => {
        const next: typeof prev = {};
        for (const k of Object.keys(prev)) {
          next[k] = { show: false, deleteConfirm: false };
        }
        return next;
      });
    }
  }, [hoveredFlowerId]);

  // Button style helpers
  const btnBase: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1.5px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.09)',
    color: 'rgba(255,255,255,0.75)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  };

  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: 'rgba(0,220,255,0.18)',
    border: '1.5px solid rgba(0,220,255,0.45)',
    color: '#00dcff',
    boxShadow: '0 2px 12px rgba(0,220,255,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden canvas-bg"
      style={{ background: '#080d18' }}
    >
      {/* Point 12: Fixed dot grid layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0',
          zIndex: 0,
        }}
      />

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ position: 'relative', zIndex: 1, cursor: draggingConnection ? 'crosshair' : isPanning.current ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          isPanning.current = false;
          if (draggingConnection) setDraggingConnection(null);
        }}
      >
        <defs>
          <radialGradient id="canvasBg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(0,60,100,0.07)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#canvasBg)" />

        <g transform={`translate(${cx}, ${cy}) scale(${canvasZoom})`}>
          {/* Vine connections — rendered BELOW flowers */}
          {connections.map((conn) => (
            <VineConnection
              key={conn.id}
              connection={conn}
              flowers={flowers}
              isHovered={hoveredConnectionId === conn.id}
              isDeleting={deletingFlowerId === conn.target_id || deletingFlowerId === conn.source_id}
              onHover={setHoveredConnectionId}
              orbPulsePhase={orbPulsePhase}
            />
          ))}

          {/* Flower nodes — base shapes only (no tooltips here) */}
          {flowers.map((flower) => (
            <FlowerNode
              key={flower.id}
              flower={flower}
              isDeleting={deletingFlowerId === flower.id}
              isHovered={hoveredFlowerId === flower.id}
              isSelected={selectedFlowerId === flower.id}
              isSnapTarget={draggingConnection?.snapTargetId === flower.id}
              compactView={compactView}
              onHover={(id) => {
                setHoveredFlowerId(id);
                if (id) {
                  setTimeout(() => setTooltipShow(id, true), 260);
                }
              }}
              onSelect={setSelectedFlowerId}
              onDeletePetal={onDeletePetal}
              onDeleteFlower={onDeleteFlower}
              onEditFlower={(id, name) => updateFlower(id, { entity_name: name })}
              onDragStart={handleFlowerDragStart}
              appearing
            />
          ))}

          {/* Central orb — with drag-start support */}
          <g onMouseDown={handleOrbDragStart}>
            <CentralOrb pulseBright={pulseBright} />
          </g>

          {/* Point 4 & 5: Tooltip layer rendered LAST = always on top */}
          {flowers.map((flower) => {
            const ts = getTooltipState(flower.id);
            return (
              <FlowerTooltipLayer
                key={`tooltip-${flower.id}`}
                flower={flower}
                isHovered={hoveredFlowerId === flower.id}
                showTooltip={ts.show && hoveredFlowerId === flower.id}
                showDeleteConfirm={ts.deleteConfirm}
                setShowDeleteConfirm={(v) => setDeleteConfirm(flower.id, v)}
                onDeletePetal={onDeletePetal}
                onDeleteFlower={onDeleteFlower}
                compactView={compactView}
              />
            );
          })}

          {/* Point 11: Rubber-band dragging line */}
          {draggingConnection && (
            <g style={{ pointerEvents: 'none' }}>
              <path
                d={cubicBezierPath(
                  draggingConnection.sourceX,
                  draggingConnection.sourceY,
                  rubberEnd.x,
                  rubberEnd.y,
                )}
                fill="none"
                stroke={draggingConnection.snapTargetId ? '#00ffff' : 'rgba(0,220,255,0.55)'}
                strokeWidth={draggingConnection.snapTargetId ? 2.5 : 1.8}
                strokeDasharray={draggingConnection.snapTargetId ? undefined : '6 5'}
                strokeLinecap="round"
                style={{
                  filter: draggingConnection.snapTargetId
                    ? 'drop-shadow(0 0 6px #00ffff) drop-shadow(0 0 12px #00ffff)'
                    : 'drop-shadow(0 0 3px rgba(0,220,255,0.5))',
                  opacity: 0.85,
                }}
              />
              {/* Tip dot */}
              <circle
                cx={rubberEnd.x}
                cy={rubberEnd.y}
                r={draggingConnection.snapTargetId ? 5 : 3}
                fill={draggingConnection.snapTargetId ? '#00ffff' : 'rgba(0,220,255,0.7)'}
                style={{
                  filter: draggingConnection.snapTargetId ? 'drop-shadow(0 0 8px #00ffff)' : undefined,
                }}
              />
            </g>
          )}

          {/* Orb snap-target flash */}
          {draggingConnection?.snapTargetId === 'orb' && (
            <circle cx={0} cy={0} r={52}
              fill="none"
              stroke="#00dcff"
              strokeWidth={2.5}
              opacity={0.8}
              style={{ animation: 'snapFlash 0.5s ease-in-out infinite alternate' }}
            />
          )}
        </g>

        {/* Canvas state overlays */}
        {!hasContent && !isLoading && !isError && generationStatus === 'idle' && (
          <g>
            <text x="50%" y="35%" textAnchor="middle"
              style={{ fill: 'rgba(255,255,255,0.22)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
              Add Problem and Inspiration matrices on the left,
            </text>
            <text x="50%" y="35%" dy="22" textAnchor="middle"
              style={{ fill: 'rgba(255,255,255,0.22)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
              then click Start Growth to begin.
            </text>
          </g>
        )}
        {isLoading && (
          <text x="50%" y="20%" textAnchor="middle"
            style={{ fill: 'rgba(0,220,255,0.6)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
            Growing garden...
          </text>
        )}
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
        {isError && (
          <text x="50%" y="38%" textAnchor="middle"
            style={{ fill: 'rgba(255,100,100,0.8)', fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
            {errorMessage || 'Connection issue. Please try again.'}
          </text>
        )}
        {hasContent && flowers.length <= 2 && !isLoading && (
          <foreignObject x="50%" y="25%" width="200" height="50" style={{ transform: 'translateX(-100px)' }}>
            <div className="expand-pulse flex items-center justify-center gap-2 text-xs font-medium px-4 py-2 rounded-xl"
              style={{ background: 'rgba(0,220,255,0.1)', border: '1px solid rgba(0,220,255,0.3)', color: 'rgba(0,220,255,0.85)', cursor: 'pointer' }}>
              ✦ Expand this idea
            </div>
          </foreignObject>
        )}
      </svg>

      {/* Rebalancing overlay */}
      {rebalancing && (
        <div className="absolute inset-0 flex items-center justify-center rebalancing-overlay"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 10 }}>
          <div className="px-8 py-5 rounded-2xl text-center"
            style={{ background: 'rgba(9,13,24,0.95)', border: '1px solid rgba(0,220,255,0.25)', boxShadow: '0 0 40px rgba(0,220,255,0.1)' }}>
            <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-t-transparent border-cyan-400"
              style={{ animation: 'rotate 0.8s linear infinite' }} />
            <p className="text-sm font-semibold" style={{ color: 'rgba(0,220,255,0.9)' }}>Rebalancing garden structure...</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Redistributing conceptual relationships</p>
          </div>
        </div>
      )}

      {flowers.length > 8 && (
        <div className="absolute right-20 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(180,0,255,0.15)', border: '1px solid rgba(180,0,255,0.35)', color: 'rgba(180,0,255,0.9)', zIndex: 5 }}>
          +{flowers.length - 8} more
        </div>
      )}

      {/* ── Points 1,2,3: Floating toolbar ── */}
      <div
        style={{
          position: 'absolute',
          right: 16,
          bottom: toolbarBottom,
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          transition: 'bottom 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Button 1: Compact View */}
        <button
          onClick={() => setCompactView(!compactView)}
          title="Compact View — tighten flower ring spacing"
          style={compactView ? btnActive : btnBase}
          onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { transform: 'scale(1.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' })}
          onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { transform: 'scale(1)', boxShadow: btnBase.boxShadow })}
        >
          <Minimize2 size={16} strokeWidth={2.5} />
        </button>

        {/* Button 2: Reset View (centres orb + 100%) */}
        <button
          onClick={handleResetView}
          title="Reset View — re-centre on Core Soul orb at 100% zoom"
          style={btnBase}
          onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { transform: 'scale(1.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' })}
          onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { transform: 'scale(1)', boxShadow: btnBase.boxShadow })}
        >
          <RotateCcw size={16} strokeWidth={2.5} />
        </button>

        {/* Button 3: Zoom In */}
        <button
          onClick={() => setCanvasZoom(Math.min(3, canvasZoom * 1.25))}
          title="Zoom In"
          style={btnBase}
          onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { transform: 'scale(1.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' })}
          onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { transform: 'scale(1)', boxShadow: btnBase.boxShadow })}
        >
          <ZoomIn size={16} strokeWidth={2.5} />
        </button>

        {/* Button 4: Zoom Out */}
        <button
          onClick={() => setCanvasZoom(Math.max(0.3, canvasZoom * 0.8))}
          title="Zoom Out"
          style={btnBase}
          onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { transform: 'scale(1.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' })}
          onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { transform: 'scale(1)', boxShadow: btnBase.boxShadow })}
        >
          <ZoomOut size={16} strokeWidth={2.5} />
        </button>

        {/* Button 5: Zoom % input — Point 3: smaller height, always shows % */}
        <div
          style={{
            width: 38,
            height: 30, // slightly shorter than other buttons
            borderRadius: 10,
            background: zoomInputFocused ? 'rgba(0,220,255,0.14)' : 'rgba(255,255,255,0.07)',
            border: `1.5px solid ${zoomInputFocused ? 'rgba(0,220,255,0.5)' : 'rgba(255,255,255,0.16)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
            transition: 'background 0.2s, border-color 0.2s',
            overflow: 'hidden',
            position: 'relative',
          }}
          title="Type zoom % and press Enter"
        >
          {/* Always-visible % display using a flex row of value + symbol */}
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center', gap: 0 }}>
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
                width: zoomInputValue.length > 2 ? 22 : 18,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                textAlign: 'right',
                fontSize: 9,
                fontWeight: 700,
                color: zoomInputFocused ? 'rgba(0,220,255,0.95)' : 'rgba(255,255,255,0.6)',
                cursor: 'text',
                padding: 0,
                fontFamily: 'Inter, sans-serif',
                fontVariantNumeric: 'tabular-nums',
              } as React.CSSProperties}
              maxLength={3}
            />
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: zoomInputFocused ? 'rgba(0,220,255,0.75)' : 'rgba(255,255,255,0.4)',
              lineHeight: 1,
              paddingBottom: 0,
              userSelect: 'none',
            }}>%</span>
          </div>
        </div>
      </div>

      {/* Rebalance button when overcrowded */}
      {flowers.length > 12 && (
        <button
          className="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
          style={{
            bottom: toolbarBottom,
            zIndex: 30,
            transition: 'bottom 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            background: 'rgba(0,220,255,0.1)',
            border: '1px solid rgba(0,220,255,0.25)',
            color: 'rgba(0,220,255,0.8)',
          }}
        >
          ⊞ Rebalance View
        </button>
      )}
    </div>
  );
}