import { useCallback, useRef, useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import Header from './components/Header';
import LeftPanel from './components/LeftPanel';
import Canvas from './components/Canvas/Canvas';
import RightPanel from './components/RightPanel/RightPanel';
import HarvestPanel from './components/HarvestPanel/HarvestPanel';
import StartGrowthButton from './components/StartGrowthButton';
import LandingPage from './components/Landing/LandingPage';
import { generateGarden, clearHistory, NetworkError, APIKeyError } from './services/ai';
import { assignPositions } from './utils/layout';
import { ReasoningLog, HarvestResult } from './store/useStore';
import { logInteractionEvent } from './lib/supabase';

function RetryPopup({ error, onRetry, onDismiss }: {
  error: { title: string; message: string; isNetwork: boolean };
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }} onClick={onDismiss}>
      <div style={{ background: 'rgba(9,13,24,0.99)', border: `1px solid ${error.isNetwork ? 'rgba(255,60,60,0.45)' : 'rgba(255,165,0,0.45)'}`, borderRadius: 18, padding: '28px 32px', maxWidth: 420, width: '90%', boxShadow: `0 0 60px ${error.isNetwork ? 'rgba(255,60,60,0.15)' : 'rgba(255,165,0,0.12)'}` }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: error.isNetwork ? 'rgba(255,60,60,0.12)' : 'rgba(255,165,0,0.12)', border: `1px solid ${error.isNetwork ? 'rgba(255,60,60,0.35)' : 'rgba(255,165,0,0.35)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {error.isNetwork ? '📡' : '⚠️'}
          </div>
          <div>
            <h3 style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: 700, margin: 0 }}>{error.title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0' }}>Your canvas has been restored to its previous state.</p>
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.65, margin: '0 0 22px' }}>{error.message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onRetry} style={{ flex: 1, padding: '11px 0', borderRadius: 11, background: 'linear-gradient(135deg, rgba(0,220,255,0.22), rgba(0,160,200,0.18))', border: '1.5px solid rgba(0,220,255,0.45)', color: '#00dcff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🔄 Try Again</button>
          <button onClick={onDismiss} style={{ flex: 1, padding: '11px 0', borderRadius: 11, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const {
    projectId, flowers, setFlowers, addFlower, setConnections, addConnection,
    addReasoningLog, clearReasoningLogs,
    setHarvestResults, harvestResults, setHarvestVisible,
    setGenerationStatus, generationStatus, setErrorMessage,
    removePetal, removeFlower,
    setDeletingFlowerId, setDeletingPetalId,
    setRebalancing,
    compactView, harvestVisible, harvestHeight,
    showReasoning, hasGrown, setHasGrown,
    lastGeneratedInput, setLastGeneratedInput,
    theme,
  } = useStore();

  // Task 4: Landing page state
  const [showLanding, setShowLanding] = useState(true);

  const [pulseBright, setPulseBright] = useState(false);
  const generationRef = useRef(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [retryPopup, setRetryPopup] = useState<{
    title: string; message: string; isNetwork: boolean; retryFn: () => void;
  } | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [harvestPanelHeightPx, setHarvestPanelHeightPx] = useState(0);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark-theme');
    }
  }, [theme]);

  useEffect(() => {
    const computeHeight = () => {
      if (!canvasWrapperRef.current) return;
      const panel = canvasWrapperRef.current.querySelector<HTMLElement>('[data-harvest-panel]');
      setHarvestPanelHeightPx(panel ? panel.getBoundingClientRect().height : 0);
    };
    computeHeight();
    const ro = new ResizeObserver(computeHeight);
    if (canvasWrapperRef.current) ro.observe(canvasWrapperRef.current);
    const interval = setInterval(computeHeight, 150);
    return () => { ro.disconnect(); clearInterval(interval); };
  }, [harvestVisible, harvestHeight]);

  const triggerOrbPulse = useCallback(() => {
    setPulseBright(true);
    setTimeout(() => setPulseBright(false), 900);
  }, []);

  const getCurrentInputFingerprint = useCallback(() => {
    const state = useStore.getState();
    return {
      description: state.problemDescription.trim(),
      problemUploadId: state.problemUpload?.id ?? '',
      inspirationUploadIds: state.inspirationUploads.filter(Boolean).map(u => u!.id).join(','),
    };
  }, []);

  const hasNewInput = useCallback((): boolean => {
    const current = getCurrentInputFingerprint();
    const last = useStore.getState().lastGeneratedInput;
    if (!last) return current.description.length > 0;
    return current.description !== last.description
      || current.problemUploadId !== last.problemUploadId
      || current.inspirationUploadIds !== last.inspirationUploadIds;
  }, [getCurrentInputFingerprint]);

  const runGeneration = useCallback(async (incorporateExisting = false, triggerType = 'auto') => {
    if (generationRef.current) return;
    const state = useStore.getState();
    if (!state.problemDescription.trim()) return;

    const previousState = {
      flowers: [...state.flowers],
      connections: [...state.connections],
      harvestResults: [...state.harvestResults],
      harvestVisible: state.harvestVisible,
    };

    generationRef.current = true;
    setGenerationStatus('loading');
    clearReasoningLogs();
    setRetryPopup(null);

    try {
      const inspirationUrls = state.inspirationUploads.filter(Boolean).map(u => u!.file_url);
      const result = await generateGarden(
        {
          problemUploadUrl: state.problemUpload?.file_url,
          inspirationUrls,
          problemDescription: state.problemDescription,
          existingFlowers: incorporateExisting ? state.flowers : [],
          deletedEntities: [],
          growthMode: state.growthMode,
          modelParams: state.modelParams,
          creativityLevel: state.creativityLevel,
          projectId,
          triggerType,
          showReasoning: state.showReasoning,
        },
        (log: ReasoningLog) => addReasoningLog(log)
      );

      if (!result.flowers.length) {
        setFlowers(previousState.flowers);
        setConnections(previousState.connections);
        setHarvestResults(previousState.harvestResults);
        setHarvestVisible(previousState.harvestVisible);
        setGenerationStatus(previousState.flowers.length > 0 ? 'success' : 'idle');
        generationRef.current = false;
        setRetryPopup({
          title: 'No Results Generated',
          message: 'The model returned no concepts. Try adding more detail to your problem description.',
          isNetwork: false,
          retryFn: () => runGeneration(incorporateExisting, triggerType),
        });
        return;
      }

      triggerOrbPulse();
      const allFlowers = incorporateExisting ? [...state.flowers, ...result.flowers] : result.flowers;
      const positioned = assignPositions(allFlowers, state.compactView);

      if (!incorporateExisting) {
        setFlowers([]); setConnections([]);
        await new Promise(r => setTimeout(r, 80));
        for (let i = 0; i < positioned.length; i++) {
          await new Promise(r => setTimeout(r, 180));
          addFlower(positioned[i]);
        }
      } else {
        setFlowers(positioned);
      }

      for (const conn of result.connections) {
        await new Promise(r => setTimeout(r, 100));
        addConnection(conn);
      }

      setHarvestResults(result.harvestResults);
      await new Promise(r => setTimeout(r, 600));
      setHarvestVisible(true);
      setGenerationStatus('success');
      setHasGrown(true);
      setLastGeneratedInput({
        description: state.problemDescription.trim(),
        problemUploadId: state.problemUpload?.id ?? '',
        inspirationUploadIds: state.inspirationUploads.filter(Boolean).map(u => u!.id).join(','),
      });
    } catch (err: any) {
      console.error('[App] Generation failed:', err);
      setFlowers(previousState.flowers);
      setConnections(previousState.connections);
      setHarvestResults(previousState.harvestResults);
      setHarvestVisible(previousState.harvestVisible);
      clearReasoningLogs();
      setGenerationStatus(previousState.flowers.length > 0 ? 'success' : 'idle');
      setErrorMessage('');
      const isNetwork = err instanceof NetworkError || !navigator.onLine;
      const isAPIKey = err instanceof APIKeyError;
      setRetryPopup({
        title: isNetwork ? 'Connection Error' : isAPIKey ? 'API Key Required' : 'Generation Failed',
        message: isAPIKey
          ? 'No API key configured. Please add VITE_GOOGLE_AI_API_KEY to your .env file.'
          : isNetwork
          ? 'Could not reach the AI service. Check your internet connection.'
          : err?.message || 'An unexpected error occurred. Your canvas has been restored.',
        isNetwork: isNetwork || isAPIKey,
        retryFn: isAPIKey
          ? () => setRetryPopup(null)
          : () => { setRetryPopup(null); runGeneration(incorporateExisting, triggerType); },
      });
    } finally {
      generationRef.current = false;
    }
  }, [projectId, addFlower, addConnection, setFlowers, setConnections, addReasoningLog,
    clearReasoningLogs, setHarvestResults, setHarvestVisible, setGenerationStatus,
    setErrorMessage, triggerOrbPulse, setHasGrown, setLastGeneratedInput]);

  const handleStartGrowth = useCallback(() => runGeneration(false, 'auto'), [runGeneration]);
  const handleRegenerate = useCallback(() => runGeneration(true, 'param_change'), [runGeneration]);

  const handleFullReset = useCallback(() => {
    clearHistory(projectId);
    setFlowers([]); setConnections([]); clearReasoningLogs();
    setHarvestResults([]); setHarvestVisible(false);
    setGenerationStatus('idle'); setErrorMessage('');
    setHasGrown(false); setLastGeneratedInput(null);
    setRetryPopup(null);
    useStore.getState().setProblemDescription('');
    setShowResetConfirm(false);
  }, [projectId, setFlowers, setConnections, clearReasoningLogs, setHarvestResults,
    setHarvestVisible, setGenerationStatus, setErrorMessage, setHasGrown, setLastGeneratedInput]);

  const handleDeletePetal = useCallback(async (flowerId: string, petalId: string) => {
    const { flowers: cf } = useStore.getState();
    const flower = cf.find(f => f.id === flowerId);
    if (!flower) return;
    setDeletingPetalId(petalId);
    await new Promise(r => setTimeout(r, 350));
    removePetal(flowerId, petalId);
    setDeletingPetalId(null);
    await logInteractionEvent({ projectId, eventType: 'delete_petal', payload: { flowerId, petalId } });
    const remaining = flower.petals.filter(p => p.id !== petalId);
    if (remaining.length === 0) { handleDeleteFlower(flowerId); return; }
    useStore.getState().addReasoningLog({
      id: `reason-regen-${Date.now()}`, project_id: projectId,
      step_number: useStore.getState().reasoningLogs.length + 1,
      text_content: `Regenerating after removal from ${flower.entity_name}…`,
      highlighted_phrases: [flower.entity_name], created_at: new Date().toISOString(),
    });
    setTimeout(() => runGeneration(true, 'delete_petal'), 500);
  }, [projectId, removePetal, setDeletingPetalId, runGeneration]);

  const handleDeleteFlower = useCallback(async (flowerId: string) => {
    const { flowers: cf } = useStore.getState();
    const flower = cf.find(f => f.id === flowerId);
    if (!flower) return;
    setDeletingFlowerId(flowerId);
    await new Promise(r => setTimeout(r, 600));
    removeFlower(flowerId);
    setDeletingFlowerId(null);
    await logInteractionEvent({ projectId, eventType: 'delete_flower', payload: { flowerId } });
    const { flowers: afterDelete } = useStore.getState();
    if (afterDelete.length === 0) {
      setHarvestVisible(false); setGenerationStatus('idle'); clearReasoningLogs(); return;
    }
    useStore.getState().addReasoningLog({
      id: `reason-del-${Date.now()}`, project_id: projectId,
      step_number: useStore.getState().reasoningLogs.length + 1,
      text_content: `Rebalancing after removal of ${flower.entity_name}…`,
      highlighted_phrases: [flower.entity_name], created_at: new Date().toISOString(),
    });
    setRebalancing(true);
    await new Promise(r => setTimeout(r, 1500));
    setRebalancing(false);
    setTimeout(() => runGeneration(true, 'delete_flower'), 200);
  }, [projectId, removeFlower, setDeletingFlowerId, setRebalancing, runGeneration,
    setHarvestVisible, setGenerationStatus, clearReasoningLogs]);

  const handleReplantInsight = useCallback(async (result: HarvestResult) => {
    useStore.getState().addReasoningLog({
      id: `reason-replant-${Date.now()}`, project_id: projectId,
      step_number: useStore.getState().reasoningLogs.length + 1,
      text_content: `Replanting insight: "${result.title}"…`,
      highlighted_phrases: [result.title], created_at: new Date().toISOString(),
    });
    await logInteractionEvent({ projectId, eventType: 'replant_insight', payload: { harvestId: result.id, title: result.title } });
    await runGeneration(true, 'replant');
  }, [projectId, runGeneration]);

  const handleManualConnect = useCallback(async (
    sourceType: 'orb' | 'flower', sourceId: string,
    targetType: 'orb' | 'flower', targetId: string
  ) => {
    const { connections: cc, addConnection: ac } = useStore.getState();
    const actualTargetId = targetType === 'orb' ? sourceId : targetId;
    const actualSourceId = targetType === 'orb' ? targetId : sourceId;
    const actualSourceType: 'orb' | 'flower' = targetType === 'orb'
      ? (sourceType === 'orb' ? 'orb' : 'flower') : sourceType;
    if (actualTargetId === actualSourceId) return;
    if (cc.some(c =>
      (c.source_id === actualSourceId && c.target_id === actualTargetId) ||
      (c.source_id === actualTargetId && c.target_id === actualSourceId)
    )) return;
    ac({
      id: `conn-manual-${Date.now()}`, project_id: projectId,
      source_type: actualSourceType,
      source_id: actualSourceType === 'orb' ? 'orb' : actualSourceId,
      target_type: 'flower', target_id: actualTargetId,
      relationship_description: 'Manual connection', created_at: new Date().toISOString(),
    });
    await logInteractionEvent({ projectId, eventType: 'manual_connect', payload: { sourceType: actualSourceType, sourceId: actualSourceId, targetId: actualTargetId } });
    useStore.getState().addReasoningLog({
      id: `reason-manual-${Date.now()}`, project_id: projectId,
      step_number: useStore.getState().reasoningLogs.length + 1,
      text_content: `Manual connection created. Regenerating…`,
      highlighted_phrases: ['manual connection'], created_at: new Date().toISOString(),
    });
    setTimeout(() => runGeneration(true, 'manual_connect'), 400);
  }, [projectId, runGeneration]);

  const isLoading = generationStatus === 'loading';
  const inputChanged = hasNewInput();

  // Theme-aware action bar
  const actionBarBg = isDark ? 'rgba(8,13,24,0.95)' : 'rgba(248,250,255,0.97)';
  const actionBarBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
  const statusDotColor = flowers.length > 0 ? '#39ff14' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)');
  const statusTextColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.5)';

  return (
    <>
      {/* Task 4: Landing page — shown first */}
      {showLanding && <LandingPage onEnter={() => setShowLanding(false)} />}

      <div
        className="flex flex-col w-full h-full"
        style={{
          background: isDark ? '#080d18' : '#eef2ff',
          transition: 'background 0.3s ease',
          opacity: showLanding ? 0 : 1,
          pointerEvents: showLanding ? 'none' : 'auto',
          transitionProperty: 'opacity, background',
          transitionDuration: '0.7s',
        }}
      >
        <Header />

        {retryPopup && (
          <RetryPopup
            error={retryPopup}
            onRetry={retryPopup.retryFn}
            onDismiss={() => setRetryPopup(null)}
          />
        )}

        {showResetConfirm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} onClick={() => setShowResetConfirm(false)}>
            <div style={{ background: isDark ? 'rgba(9,13,24,0.99)' : 'rgba(255,255,255,0.99)', border: '1px solid rgba(255,60,60,0.4)', borderRadius: 16, padding: '28px 32px', maxWidth: 380, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)', fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Reset Everything?</h3>
              <p style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)', fontSize: 12, lineHeight: 1.6, margin: '0 0 24px' }}>Permanently deletes all flowers, connections, reasoning, harvest results, and AI context.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleFullReset} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid rgba(255,60,60,0.5)', background: 'rgba(255,60,60,0.18)', color: '#ff5050', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Yes, Reset All</button>
                <button onClick={() => setShowResetConfirm(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden" style={{ marginTop: 56 }}>
          <LeftPanel />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Action bar */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 52, flexShrink: 0, background: actionBarBg, borderBottom: `1px solid ${actionBarBorder}`, backdropFilter: 'blur(12px)', zIndex: 10, gap: 10, transition: 'background 0.3s ease' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusDotColor, boxShadow: flowers.length > 0 ? '0 0 6px #39ff14' : 'none', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: statusTextColor, whiteSpace: 'nowrap' }}>
                    {flowers.length > 0 ? `${flowers.length} flowers · ${flowers.reduce((a, f) => a + f.petals.length, 0)} petals` : 'Garden empty'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <StartGrowthButton
                  onStart={hasGrown ? handleRegenerate : handleStartGrowth}
                  isRegenerate={hasGrown}
                  canRegenerate={!hasGrown || inputChanged}
                />
                {hasGrown && (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    disabled={isLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, height: 38, padding: '0 14px', borderRadius: 10, border: '1.5px solid rgba(255,60,60,0.45)', background: isLoading ? 'rgba(255,60,60,0.06)' : 'rgba(255,60,60,0.12)', color: isLoading ? 'rgba(255,80,80,0.4)' : '#ff5050', fontSize: 12, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1, transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 }}
                    onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = 'rgba(255,60,60,0.22)'; }}
                    onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = 'rgba(255,60,60,0.12)'; }}
                  >
                    🗑 Reset
                  </button>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                  {isLoading && <span style={{ color: 'rgba(0,220,255,0.6)' }}>⟳ Processing...</span>}
                  {generationStatus === 'success' && flowers.length > 0 && <span style={{ color: 'rgba(57,255,20,0.6)' }}>✓ Growth complete</span>}
                </span>
              </div>
            </div>

            <div ref={canvasWrapperRef} className="flex-1 relative overflow-hidden">
              <Canvas
                onDeletePetal={handleDeletePetal}
                onDeleteFlower={handleDeleteFlower}
                onManualConnect={handleManualConnect}
                pulseBright={pulseBright}
                harvestPanelHeightPx={harvestPanelHeightPx}
              />
              <HarvestPanel onReplant={handleReplantInsight} />
            </div>
          </div>
          <RightPanel onRegenerate={handleRegenerate} />
        </div>
      </div>
    </>
  );
}