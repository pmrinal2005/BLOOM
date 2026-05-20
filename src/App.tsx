// C:\Users\mrutu\OneDrive\Desktop\bloom\src\App.tsx
import { useCallback, useRef, useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import Header from './components/Header';
import LeftPanel from './components/LeftPanel';
import Canvas from './components/Canvas/Canvas';
import RightPanel from './components/RightPanel/RightPanel';
import HarvestPanel from './components/HarvestPanel/HarvestPanel';
import StartGrowthButton from './components/StartGrowthButton';
import { generateGarden } from './services/ai';
import { assignPositions } from './utils/layout';
import { ReasoningLog, HarvestResult } from './store/useStore';
import { logInteractionEvent } from './lib/supabase';

export default function App() {
  const {
    projectId, growthMode, creativityLevel, modelParams,
    problemUpload, inspirationUploads,
    flowers, setFlowers, addFlower, setConnections, addConnection,
    addReasoningLog, clearReasoningLogs,
    setHarvestResults, setHarvestVisible,
    setGenerationStatus, generationStatus, setErrorMessage,
    removePetal, removeFlower,
    setDeletingFlowerId, setDeletingPetalId,
    setRebalancing,
    compactView,
    harvestVisible,
    harvestHeight,
  } = useStore();

  const [pulseBright, setPulseBright] = useState(false);
  const generationRef = useRef(false);

  // ── Measure actual harvest panel height for toolbar offset ──
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [harvestPanelHeightPx, setHarvestPanelHeightPx] = useState(0);

  useEffect(() => {
    const computeHeight = () => {
      if (!canvasWrapperRef.current) return;
      const panel = canvasWrapperRef.current.querySelector<HTMLElement>('[data-harvest-panel]');
      if (panel) {
        setHarvestPanelHeightPx(panel.getBoundingClientRect().height);
      } else {
        setHarvestPanelHeightPx(0);
      }
    };

    computeHeight();

    const ro = new ResizeObserver(computeHeight);
    if (canvasWrapperRef.current) ro.observe(canvasWrapperRef.current);

    const interval = setInterval(computeHeight, 150);

    return () => {
      ro.disconnect();
      clearInterval(interval);
    };
  }, [harvestVisible, harvestHeight]);

  const triggerOrbPulse = useCallback(() => {
    setPulseBright(true);
    setTimeout(() => setPulseBright(false), 900);
  }, []);

  const runGeneration = useCallback(
    async (incorporateExisting = false, triggerType = 'auto') => {
      if (generationRef.current) return;

      // ── Read latest values directly from store to avoid stale closures ──
      const state = useStore.getState();
      const currentDescription = state.problemDescription;
      const currentProblemUpload = state.problemUpload;
      const currentInspirationUploads = state.inspirationUploads;
      const currentFlowers = state.flowers;
      const currentCompactView = state.compactView;
      const currentGrowthMode = state.growthMode;
      const currentModelParams = state.modelParams;
      const currentCreativityLevel = state.creativityLevel;

      if (!currentDescription.trim()) {
        console.warn('[App] No problem description — aborting generation');
        return;
      }

      generationRef.current = true;
      setGenerationStatus('loading');
      clearReasoningLogs();

      try {
        const inspirationUrls = currentInspirationUploads
          .filter(Boolean)
          .map((u) => u!.file_url);

        const result = await generateGarden(
          {
            problemUploadUrl: currentProblemUpload?.file_url,
            inspirationUrls,
            problemDescription: currentDescription,
            existingFlowers: incorporateExisting ? currentFlowers : [],
            deletedEntities: [],
            growthMode: currentGrowthMode,
            modelParams: currentModelParams,
            creativityLevel: currentCreativityLevel,
            projectId,
            triggerType,
          },
          (log: ReasoningLog) => addReasoningLog(log)
        );

        if (!result.flowers.length) {
          setGenerationStatus('empty');
          generationRef.current = false;
          return;
        }

        triggerOrbPulse();

        // ── Assign positions based on ring layout ──
        const allFlowers = incorporateExisting
          ? [...currentFlowers, ...result.flowers]
          : result.flowers;

        const positioned = assignPositions(allFlowers, currentCompactView);

        if (!incorporateExisting) {
          // Clear canvas then animate flowers appearing one by one
          setFlowers([]);
          setConnections([]);
          await new Promise((r) => setTimeout(r, 80)); // small pause for clear to register

          for (let i = 0; i < positioned.length; i++) {
            await new Promise((r) => setTimeout(r, 180));
            addFlower(positioned[i]);
          }
        } else {
          // Replace all flowers with repositioned set
          setFlowers(positioned);
        }

        // Animate connections appearing
        for (const conn of result.connections) {
          await new Promise((r) => setTimeout(r, 100));
          addConnection(conn);
        }

        setHarvestResults(result.harvestResults);
        await new Promise((r) => setTimeout(r, 600));
        setHarvestVisible(true);
        setGenerationStatus('success');
      } catch (err: any) {
        console.error('[App] Generation failed:', err);
        setGenerationStatus('error');
        setErrorMessage(err?.message || 'Connection issue. Please try again.');
      } finally {
        generationRef.current = false;
      }
    },
    // Minimal stable dependencies — reads state directly inside to avoid staleness
    [
      projectId,
      addFlower, addConnection, setFlowers, setConnections,
      addReasoningLog, clearReasoningLogs,
      setHarvestResults, setHarvestVisible,
      setGenerationStatus, setErrorMessage,
      triggerOrbPulse,
    ]
  );

  const handleStartGrowth = useCallback(() => runGeneration(false, 'auto'), [runGeneration]);
  const handleRegenerate = useCallback(() => runGeneration(true, 'param_change'), [runGeneration]);

  const handleDeletePetal = useCallback(
    async (flowerId: string, petalId: string) => {
      const { flowers: currentFlowers } = useStore.getState();
      const flower = currentFlowers.find((f) => f.id === flowerId);
      if (!flower) return;

      setDeletingPetalId(petalId);
      await new Promise((r) => setTimeout(r, 350));
      removePetal(flowerId, petalId);
      setDeletingPetalId(null);

      await logInteractionEvent({
        projectId,
        eventType: 'delete_petal',
        payload: { flowerId, petalId, flowerName: flower.entity_name },
      });

      const remainingPetals = flower.petals.filter((p) => p.id !== petalId);
      if (remainingPetals.length === 0) {
        handleDeleteFlower(flowerId);
        return;
      }

      useStore.getState().addReasoningLog({
        id: `reason-regen-${Date.now()}`,
        project_id: projectId,
        step_number: useStore.getState().reasoningLogs.length + 1,
        text_content: `Regenerating after removal of sub-entity from ${flower.entity_name}…`,
        highlighted_phrases: [flower.entity_name],
        created_at: new Date().toISOString(),
      });
      setTimeout(() => runGeneration(true, 'delete_petal'), 500);
    },
    [projectId, removePetal, setDeletingPetalId, runGeneration]
  );

  const handleDeleteFlower = useCallback(
    async (flowerId: string) => {
      const { flowers: currentFlowers } = useStore.getState();
      const flower = currentFlowers.find((f) => f.id === flowerId);
      if (!flower) return;

      setDeletingFlowerId(flowerId);
      await new Promise((r) => setTimeout(r, 600));
      removeFlower(flowerId);
      setDeletingFlowerId(null);

      await logInteractionEvent({
        projectId,
        eventType: 'delete_flower',
        payload: { flowerId, flowerName: flower.entity_name },
      });

      const { flowers: afterDelete } = useStore.getState();
      if (afterDelete.length === 0) {
        setHarvestVisible(false);
        setGenerationStatus('idle');
        clearReasoningLogs();
        return;
      }

      useStore.getState().addReasoningLog({
        id: `reason-del-${Date.now()}`,
        project_id: projectId,
        step_number: useStore.getState().reasoningLogs.length + 1,
        text_content: `Rebalancing garden after removal of ${flower.entity_name}…`,
        highlighted_phrases: [flower.entity_name],
        created_at: new Date().toISOString(),
      });

      setRebalancing(true);
      await new Promise((r) => setTimeout(r, 1500));
      setRebalancing(false);
      setTimeout(() => runGeneration(true, 'delete_flower'), 200);
    },
    [
      projectId, removeFlower, setDeletingFlowerId,
      setRebalancing, runGeneration, setHarvestVisible,
      setGenerationStatus, clearReasoningLogs,
    ]
  );

  const handleReplantInsight = useCallback(
    async (result: HarvestResult) => {
      useStore.getState().addReasoningLog({
        id: `reason-replant-${Date.now()}`,
        project_id: projectId,
        step_number: useStore.getState().reasoningLogs.length + 1,
        text_content: `Replanting insight: "${result.title}"…`,
        highlighted_phrases: [result.title],
        created_at: new Date().toISOString(),
      });

      await logInteractionEvent({
        projectId,
        eventType: 'replant_insight',
        payload: { harvestId: result.id, title: result.title, tabType: result.tab_type },
      });

      await runGeneration(true, 'replant');
    },
    [projectId, runGeneration]
  );

  const handleManualConnect = useCallback(
    async (
      sourceType: 'orb' | 'flower',
      sourceId: string,
      targetType: 'orb' | 'flower',
      targetId: string
    ) => {
      const { connections: currentConns, addConnection: ac } = useStore.getState();

      // Normalise: connection target must always be a flower
      const actualTargetId = targetType === 'orb' ? sourceId : targetId;
      const actualSourceId = targetType === 'orb' ? targetId : sourceId;
      const actualSourceType: 'orb' | 'flower' =
        targetType === 'orb' ? (sourceType === 'orb' ? 'orb' : 'flower') : sourceType;

      if (actualTargetId === actualSourceId) return;

      const alreadyExists = currentConns.some(
        (c) =>
          (c.source_id === actualSourceId && c.target_id === actualTargetId) ||
          (c.source_id === actualTargetId && c.target_id === actualSourceId)
      );
      if (alreadyExists) return;

      const newConn = {
        id: `conn-manual-${Date.now()}`,
        project_id: projectId,
        source_type: actualSourceType,
        source_id: actualSourceType === 'orb' ? 'orb' : actualSourceId,
        target_type: 'flower' as const,
        target_id: actualTargetId,
        relationship_description: 'Manual connection',
        created_at: new Date().toISOString(),
      };
      ac(newConn);

      await logInteractionEvent({
        projectId,
        eventType: 'manual_connect',
        payload: { sourceType: actualSourceType, sourceId: actualSourceId, targetId: actualTargetId },
      });

      useStore.getState().addReasoningLog({
        id: `reason-manual-conn-${Date.now()}`,
        project_id: projectId,
        step_number: useStore.getState().reasoningLogs.length + 1,
        text_content: `New manual connection created. Regenerating garden with updated relationships…`,
        highlighted_phrases: ['manual connection'],
        created_at: new Date().toISOString(),
      });
      setTimeout(() => runGeneration(true, 'manual_connect'), 400);
    },
    [projectId, runGeneration]
  );

  return (
    <div className="flex flex-col w-full h-full" style={{ background: '#080d18' }}>
      <Header />

      <div className="flex flex-1 overflow-hidden" style={{ marginTop: 56 }}>
        <LeftPanel />

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Top action bar */}
          <div
            className="flex items-center justify-between px-5 py-2 flex-shrink-0"
            style={{
              background: 'rgba(8,13,24,0.95)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              backdropFilter: 'blur(12px)',
              zIndex: 10,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 text-xs"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: flowers.length > 0 ? '#39ff14' : 'rgba(255,255,255,0.15)',
                    boxShadow: flowers.length > 0 ? '0 0 6px #39ff14' : 'none',
                  }}
                />
                {flowers.length > 0
                  ? `${flowers.length} flowers · ${flowers.reduce((acc, f) => acc + f.petals.length, 0)} petals`
                  : 'Garden empty'}
              </div>
            </div>
            <StartGrowthButton onStart={handleStartGrowth} />
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              {generationStatus === 'loading' && (
                <span style={{ color: 'rgba(0,220,255,0.6)' }}>⟳ Processing...</span>
              )}
              {generationStatus === 'success' && flowers.length > 0 && (
                <span style={{ color: 'rgba(57,255,20,0.6)' }}>✓ Growth complete</span>
              )}
              {generationStatus === 'error' && (
                <span style={{ color: 'rgba(255,100,100,0.7)' }}>✕ Error</span>
              )}
            </div>
          </div>

          {/* Canvas + Harvest wrapper */}
          <div ref={canvasWrapperRef} className="flex-1 relative overflow-hidden">
            <Canvas
              onDeletePetal={handleDeletePetal}
              onDeleteFlower={handleDeleteFlower}
              onManualConnect={handleManualConnect}
              pulseBright={pulseBright}
              harvestPanelHeightPx={harvestPanelHeightPx}
            />
            {/* HarvestPanel: absolute bottom-0 inside canvasWrapperRef */}
            <HarvestPanel onReplant={handleReplantInsight} />
          </div>
        </div>

        <RightPanel onRegenerate={handleRegenerate} />
      </div>
    </div>
  );
}