// C:\Users\mrutu\OneDrive\Desktop\bloom\src\components\Canvas\Canvas.tsx
import { useRef, useState, useCallback, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import CentralOrb from './CentralOrb';
import FlowerNode from './FlowerNode';
import VineConnection from './VineConnection';
import { ZoomIn, ZoomOut, RotateCcw, Minimize2 } from 'lucide-react';
import { cubicBezierPath, getColorConfig } from '../../utils/layout';

interface Props {
  onDeletePetal: (flowerId: string, petalId: string) => void;
  onDeleteFlower: (flowerId: string) => void;
  onManualConnect: (
    sourceType: 'orb' | 'flower',
    sourceId: string,
    targetType: 'orb' | 'flower',
    targetId: string
  ) => void;
  pulseBright: boolean;
  harvestPanelHeightPx: number;
}

const SNAP_RADIUS = 65;

export default function Canvas({
  onDeletePetal, onDeleteFlower, pulseBright, onManualConnect, harvestPanelHeightPx,
}: Props) {
  const {
    flowers, connections, generationStatus, errorMessage,
    canvasZoom, setCanvasZoom, canvasOffset, setCanvasOffset,
    hoveredFlowerId, setHoveredFlowerId,
    hoveredConnectionId, setHoveredConnectionId,
    selectedFlowerId, setSelectedFlowerId,
    deletingFlowerId, rebalancing,
    compactView, setCompactView, updateFlower,
    draggingConnection, setDraggingConnection,
  } = useStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });
  const [svgSize, setSvgSize] = useState({ w: 800, h: 600 });

  const [zoomInputValue, setZoomInputValue] = useState('100');
  const [zoomInputFocused, setZoomInputFocused] = useState(false);
  const [orbPulsePhase, setOrbPulsePhase] = useState(0);
  const orbAnimRef = useRef<number>(0);
  const orbStartRef = useRef<number>(0);
  const [offScreenCount, setOffScreenCount] = useState(0);

  useEffect(() => {
    const animate = (ts: number) => {
      if (!orbStartRef.current) orbStartRef.current = ts;
      setOrbPulsePhase(((ts - orbStartRef.current) / 1000 % 3) / 3);
      orbAnimRef.current = requestAnimationFrame(animate);
    };
    orbAnimRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(orbAnimRef.current);
  }, []);

  useEffect(() => {
    if (!zoomInputFocused) setZoomInputValue(String(Math.round(canvasZoom * 100)));
  }, [canvasZoom, zoomInputFocused]);

  useEffect(() => {
    const update = () => {
      if (svgRef.current) {
        const r = svgRef.current.getBoundingClientRect();
        setSvgSize({ w: r.width, h: r.height });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!flowers.length) { setOffScreenCount(0); return; }
    const halfW = svgSize.w / 2 / canvasZoom;
    const halfH = svgSize.h / 2 / canvasZoom;
    const ox = canvasOffset.x / canvasZoom;
    const oy = canvasOffset.y / canvasZoom;
    const margin = 55;
    let count = 0;
    for (const f of flowers) {
      if (f.position_x < -halfW - ox + margin || f.position_x > halfW - ox - margin ||
          f.position_y < -halfH - oy + margin || f.position_y > halfH - oy - margin) count++;
    }
    setOffScreenCount(count);
  }, [flowers, canvasZoom, canvasOffset, svgSize]);

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const cx = svgSize.w / 2 + canvasOffset.x;
    const cy = svgSize.h / 2 + canvasOffset.y;
    return { x: (clientX - rect.left - cx) / canvasZoom, y: (clientY - rect.top - cy) / canvasZoom };
  }, [svgSize, canvasOffset, canvasZoom]);

  const findSnapTarget = useCallback((canvasX: number, canvasY: number, excludeId: string) => {
    if (Math.sqrt(canvasX ** 2 + canvasY ** 2) < SNAP_RADIUS) return { type: 'orb' as const, id: 'orb' };
    for (const f of flowers) {
      if (f.id === excludeId) continue;
      const dx = canvasX - f.position_x, dy = canvasY - f.position_y;
      if (Math.sqrt(dx * dx + dy * dy) < SNAP_RADIUS) return { type: 'flower' as const, id: f.id };
    }
    return null;
  }, [flowers]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setCanvasZoom(canvasZoom * (e.deltaY > 0 ? 0.9 : 1.1));
  }, [canvasZoom, setCanvasZoom]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleFlowerDragStart = useCallback((e: React.MouseEvent, flowerId: string) => {
    const flower = flowers.find(f => f.id === flowerId);
    if (!flower) return;
    isPanning.current = false;
    const cp = screenToCanvas(e.clientX, e.clientY);
    setDraggingConnection({
      sourceType: 'flower', sourceId: flowerId,
      sourceX: flower.position_x, sourceY: flower.position_y,
      cursorX: cp.x, cursorY: cp.y, snapTargetId: null,
    });
  }, [flowers, screenToCanvas, setDraggingConnection]);

  const handleOrbDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    isPanning.current = false;
    const cp = screenToCanvas(e.clientX, e.clientY);
    setDraggingConnection({
      sourceType: 'orb', sourceId: 'orb',
      sourceX: 0, sourceY: 0,
      cursorX: cp.x, cursorY: cp.y, snapTargetId: null,
    });
  }, [screenToCanvas, setDraggingConnection]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || draggingConnection) return;
    isPanning.current = true;
    lastPan.current = { x: e.clientX, y: e.clientY };
  }, [draggingConnection]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingConnection) {
      const cp = screenToCanvas(e.clientX, e.clientY);
      const snap = findSnapTarget(cp.x, cp.y, draggingConnection.sourceId);
      setDraggingConnection({ ...draggingConnection, cursorX: cp.x, cursorY: cp.y, snapTargetId: snap?.id ?? null });
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
    const cp = screenToCanvas(e.clientX, e.clientY);
    const snap = findSnapTarget(cp.x, cp.y, draggingConnection.sourceId);
    if (snap) onManualConnect(draggingConnection.sourceType, draggingConnection.sourceId, snap.type, snap.id);
    setDraggingConnection(null);
  }, [draggingConnection, screenToCanvas, findSnapTarget, onManualConnect, setDraggingConnection]);

  const handleResetView = useCallback(() => { setCanvasOffset({ x: 0, y: 0 }); setCanvasZoom(1); }, [setCanvasOffset, setCanvasZoom]);

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

  const toolbarBottom = `${harvestPanelHeightPx + 16}px`;
  const cx = svgSize.w / 2 + canvasOffset.x;
  const cy = svgSize.h / 2 + canvasOffset.y;
  const hasContent = flowers.length > 0;
  const isLoading = generationStatus === 'loading';
  const isEmpty = generationStatus === 'empty';
  const isError = generationStatus === 'error';

  const rubberEnd = draggingConnection?.snapTargetId
    ? draggingConnection.snapTargetId === 'orb'
      ? { x: 0, y: 0 }
      : (() => { const f = flowers.find(fl => fl.id === draggingConnection.snapTargetId); return f ? { x: f.position_x, y: f.position_y } : { x: draggingConnection.cursorX, y: draggingConnection.cursorY }; })()
    : { x: draggingConnection?.cursorX ?? 0, y: draggingConnection?.cursorY ?? 0 };

  const btnBase: React.CSSProperties = {
    width: 38, height: 38, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s',
    border: '1.5px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.82)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
  };
  const btnActive: React.CSSProperties = {
    ...btnBase, background: 'rgba(0,220,255,0.2)',
    border: '1.5px solid rgba(0,220,255,0.5)', color: '#00dcff',
    boxShadow: '0 2px 14px rgba(0,220,255,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
  };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#080d18' }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1.8px, transparent 1.8px)',
        backgroundSize: '32px 32px',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `radial-gradient(ellipse at 50% 50%, rgba(0,80,120,0.09) 0%, transparent 70%)`,
      }} />

      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ position: 'relative', zIndex: 1, cursor: draggingConnection ? 'crosshair' : isPanning.current ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { isPanning.current = false; if (draggingConnection) setDraggingConnection(null); }}
      >
        <g transform={`translate(${cx}, ${cy}) scale(${canvasZoom})`}>

          {/* Connections */}
          {connections.map(conn => (
            <VineConnection key={conn.id} connection={conn} flowers={flowers}
              isHovered={hoveredConnectionId === conn.id}
              isDeleting={deletingFlowerId === conn.target_id || deletingFlowerId === conn.source_id}
              onHover={setHoveredConnectionId} orbPulsePhase={orbPulsePhase}
            />
          ))}

          {/* Flower nodes — tooltips are now INSIDE FlowerNode, not duplicated here */}
          {flowers.map(flower => (
            <FlowerNode
              key={flower.id} flower={flower}
              isDeleting={deletingFlowerId === flower.id}
              isHovered={hoveredFlowerId === flower.id}
              isSelected={selectedFlowerId === flower.id}
              isSnapTarget={draggingConnection?.snapTargetId === flower.id}
              compactView={compactView} canvasZoom={canvasZoom}
              onHover={setHoveredFlowerId}
              onSelect={setSelectedFlowerId}
              onDeletePetal={onDeletePetal}
              onDeleteFlower={onDeleteFlower}
              onEditFlower={(id, name) => updateFlower(id, { entity_name: name })}
              onDragStart={handleFlowerDragStart}
              appearing
            />
          ))}

          {/* Central orb — rendered AFTER flowers so it appears on top visually */}
          <g onMouseDown={handleOrbDragStart} style={{ cursor: 'crosshair' }}>
            <CentralOrb pulseBright={pulseBright} />
          </g>

          {/* Orb snap flash */}
          {draggingConnection?.snapTargetId === 'orb' && (
            <circle cx={0} cy={0} r={54} fill="none" stroke="#00dcff" strokeWidth={3} opacity={0.85}
              style={{ animation: 'snapFlash 0.45s ease-in-out infinite alternate' }}
            />
          )}

          {/* Rubber-band line */}
          {draggingConnection && (
            <g style={{ pointerEvents: 'none' }}>
              <path
                d={cubicBezierPath(draggingConnection.sourceX, draggingConnection.sourceY, rubberEnd.x, rubberEnd.y)}
                fill="none"
                stroke={draggingConnection.snapTargetId ? '#00ffff' : 'rgba(0,220,255,0.6)'}
                strokeWidth={draggingConnection.snapTargetId ? 2.8 : 2}
                strokeDasharray={draggingConnection.snapTargetId ? undefined : '7 5'}
                strokeLinecap="round"
                style={{ filter: draggingConnection.snapTargetId ? 'drop-shadow(0 0 7px #00ffff)' : 'drop-shadow(0 0 4px rgba(0,220,255,0.55))', opacity: 0.9 }}
              />
              <circle cx={rubberEnd.x} cy={rubberEnd.y}
                r={draggingConnection.snapTargetId ? 6 : 4}
                fill={draggingConnection.snapTargetId ? '#00ffff' : 'rgba(0,220,255,0.8)'}
                style={{ filter: draggingConnection.snapTargetId ? 'drop-shadow(0 0 10px #00ffff)' : undefined }}
              />
            </g>
          )}
        </g>

        {/* State overlays */}
        {!hasContent && !isLoading && !isError && generationStatus === 'idle' && (
          <g>
            <text x="50%" y="35%" textAnchor="middle" style={{ fill: 'rgba(255,255,255,0.22)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
              Add a Problem Description on the left,
            </text>
            <text x="50%" y="35%" dy="22" textAnchor="middle" style={{ fill: 'rgba(255,255,255,0.22)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
              then click Start Growth to begin.
            </text>
          </g>
        )}
        {isLoading && <text x="50%" y="20%" textAnchor="middle" style={{ fill: 'rgba(0,220,255,0.6)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Growing garden...</text>}
        {isEmpty && (
          <g>
            <text x="50%" y="38%" textAnchor="middle" style={{ fill: 'rgba(255,200,50,0.7)', fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>No strong connections found.</text>
            <text x="50%" y="38%" dy="20" textAnchor="middle" style={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>Try different inspirations or adjust sliders.</text>
          </g>
        )}
        {isError && <text x="50%" y="38%" textAnchor="middle" style={{ fill: 'rgba(255,100,100,0.8)', fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{errorMessage || 'Connection issue. Please try again.'}</text>}
      </svg>

      {rebalancing && (
        <div className="absolute inset-0 flex items-center justify-center rebalancing-overlay"
          style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(4px)', zIndex: 10 }}>
          <div className="px-8 py-5 rounded-2xl text-center"
            style={{ background: 'rgba(9,13,24,0.96)', border: '1px solid rgba(0,220,255,0.25)', boxShadow: '0 0 40px rgba(0,220,255,0.1)' }}>
            <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-t-transparent border-cyan-400" style={{ animation: 'rotate 0.8s linear infinite' }} />
            <p className="text-sm font-semibold" style={{ color: 'rgba(0,220,255,0.9)' }}>Rebalancing garden structure...</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Redistributing conceptual relationships</p>
          </div>
        </div>
      )}

      {offScreenCount > 0 && (
        <div style={{
          position: 'absolute', right: 64, top: '50%', transform: 'translateY(-50%)',
          zIndex: 15, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
          background: 'rgba(180,0,255,0.18)', border: '1px solid rgba(180,0,255,0.38)',
          color: 'rgba(200,100,255,0.95)', backdropFilter: 'blur(6px)', pointerEvents: 'none',
          transition: 'opacity 0.4s ease',
        }}>
          +{offScreenCount} off-screen
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        position: 'absolute', right: 16, bottom: toolbarBottom, zIndex: 30,
        display: 'flex', flexDirection: 'column', gap: 8,
        transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <button onClick={() => setCompactView(!compactView)} title="Compact View" style={compactView ? btnActive : btnBase}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
          <Minimize2 size={17} strokeWidth={2.6} />
        </button>
        <button onClick={handleResetView} title="Reset View — 100%" style={btnBase}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
          <RotateCcw size={17} strokeWidth={2.6} />
        </button>
        <button onClick={() => setCanvasZoom(Math.min(3, canvasZoom * 1.25))} title="Zoom In" style={btnBase}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
          <ZoomIn size={17} strokeWidth={2.6} />
        </button>
        <button onClick={() => setCanvasZoom(Math.max(0.3, canvasZoom * 0.8))} title="Zoom Out" style={btnBase}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
          <ZoomOut size={17} strokeWidth={2.6} />
        </button>
        <div style={{
          width: 38, height: 30, borderRadius: 10,
          background: zoomInputFocused ? 'rgba(0,220,255,0.15)' : 'rgba(255,255,255,0.08)',
          border: `1.5px solid ${zoomInputFocused ? 'rgba(0,220,255,0.5)' : 'rgba(255,255,255,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.35)', transition: 'background 0.2s, border-color 0.2s',
        }} title="Type zoom % and Enter">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input type="text" inputMode="numeric" value={zoomInputValue}
              onChange={e => setZoomInputValue(e.target.value.replace(/[^0-9]/g, ''))}
              onFocus={() => { setZoomInputFocused(true); setZoomInputValue(String(Math.round(canvasZoom * 100))); }}
              onBlur={commitZoomInput}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); else if (e.key === 'Escape') { setZoomInputValue(String(Math.round(canvasZoom * 100))); (e.target as HTMLInputElement).blur(); } }}
              style={{ width: zoomInputValue.length > 2 ? 22 : 18, background: 'transparent', border: 'none', outline: 'none', textAlign: 'right', fontSize: 9, fontWeight: 700, color: zoomInputFocused ? 'rgba(0,220,255,0.95)' : 'rgba(255,255,255,0.65)', cursor: 'text', padding: 0, fontFamily: 'Inter, sans-serif' } as React.CSSProperties}
              maxLength={3}
            />
            <span style={{ fontSize: 9, fontWeight: 700, color: zoomInputFocused ? 'rgba(0,220,255,0.75)' : 'rgba(255,255,255,0.45)', userSelect: 'none' }}>%</span>
          </div>
        </div>
      </div>
    </div>
  );
}