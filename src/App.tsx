import { useCallback, useRef, useState } from 'react';
import { useStore } from './store/useStore';
import Header from './components/Header';
import LeftPanel from './components/LeftPanel';
import Canvas from './components/Canvas/Canvas';
import RightPanel from './components/RightPanel/RightPanel';
import HarvestPanel from './components/HarvestPanel/HarvestPanel';
import StartGrowthButton from './components/StartGrowthButton';
import { generateGarden } from './services/openrouter';
import { assignPositions } from './utils/layout';
import { ReasoningLog, HarvestResult } from './store/useStore';

export default function App() {
  const {
    projectId, growthMode, creativityLevel, modelParams,
    problemUpload, inspirationUploads,
    problemDescription,
    flowers, setFlowers, addFlower, setConnections, addConnection,
    addReasoningLog, clearReasoningLogs,
    setHarvestResults, setHarvestVisible,
    setGenerationStatus, generationStatus, setErrorMessage,
    removePetal, removeFlower,
    setDeletingFlowerId, setDeletingPetalId,
    setRebalancing,
    compactView,
  } = useStore();

  const [pulseBright, setPulseBright] = useState(false);
  const generationRef = useRef(false);
  const [newFlowerIds, setNewFlowerIds] = useState<Set<string>>(new Set());

  const triggerOrbPulse = useCallback(() => {
    setPulseBright(true);
    setTimeout(() => setPulseBright(false), 900);
  }, []);

  const runGeneration = useCallback(
    async (incorporateExisting = false) => {
      if (generationRef.current) return;
      const currentDescription = useStore.getState().problemDescription;
      if (!currentDescription.trim()) return;

      generationRef.current = true;
      setGenerationStatus('loading');
      clearReasoningLogs();

      try {
        const inspirationUrls = inspirationUploads
          .filter(Boolean)
          .map((u) => u!.file_url);

        const result = await generateGarden(
          {
            problemUploadUrl: problemUpload?.file_url,
            inspirationUrls,
            problemDescription: currentDescription,
            existingFlowers: incorporateExisting ? flowers : [],
            growthMode,
            modelParams,
            creativityLevel,
            projectId,
          },
          (log: ReasoningLog) => {
            addReasoningLog(log);
          }
        );

        if (!result.flowers.length) {
          setGenerationStatus('empty');
          generationRef.current = false;
          return;
        }

        triggerOrbPulse();

        const positioned = assignPositions(
          incorporateExisting ? [...flowers, ...result.flowers] : result.flowers,
          compactView
        );

        const newIds = new Set(result.flowers.map((f) => f.id));
        setNewFlowerIds(newIds);

        if (!incorporateExisting) {
          setFlowers([]);
          setConnections([]);
          for (let i = 0; i < positioned.length; i++) {
            await new Promise((r) => setTimeout(r, 180));
            addFlower(positioned[i]);
          }
        } else {
          setFlowers(positioned);
        }

        for (const conn of result.connections) {
          await new Promise((r) => setTimeout(r, 100));
          addConnection(conn);
        }

        setHarvestResults(result.harvestResults);
        await new Promise((r) => setTimeout(r, 600));
        setHarvestVisible(true);
        setGenerationStatus('success');
      } catch (err: any) {
        setGenerationStatus('error');
        setErrorMessage(err?.message || 'Connection issue. Please try again.');
      } finally {
        generationRef.current = false;
      }
    },
    [
      problemUpload, inspirationUploads, problemDescription, flowers,
      growthMode, modelParams, creativityLevel, projectId, compactView,
      addFlower, addConnection, setFlowers, setConnections,
      addReasoningLog, clearReasoningLogs, setHarvestResults, setHarvestVisible,
      setGenerationStatus, setErrorMessage, triggerOrbPulse,
    ]
  );

  const handleStartGrowth = useCallback(() => runGeneration(false), [runGeneration]);
  const handleRegenerate = useCallback(() => runGeneration(true), [runGeneration]);

  const handleDeletePetal = useCallback(
    async (flowerId: string, petalId: string) => {
      const flower = flowers.find((f) => f.id === flowerId);
      if (!flower) return;
      setDeletingPetalId(petalId);
      await new Promise((r) => setTimeout(r, 350));
      removePetal(flowerId, petalId);
      setDeletingPetalId(null);
      const remainingPetals = flower.petals.filter((p) => p.id !== petalId);
      if (remainingPetals.length === 0) {
        handleDeleteFlower(flowerId);
        return;
      }
      const { addReasoningLog } = useStore.getState();
      addReasoningLog({
        id: `reason-regen-${Date.now()}`,
        project_id: projectId,
        step_number: useStore.getState().reasoningLogs.length + 1,
        text_content: `Regenerating after removal of sub-entity from ${flower.entity_name}…`,
        highlighted_phrases: [flower.entity_name],
        created_at: new Date().toISOString(),
      });
      setTimeout(() => runGeneration(true), 500);
    },
    [flowers, projectId, removePetal, setDeletingPetalId, runGeneration]
  );

  const handleDeleteFlower = useCallback(
    async (flowerId: string) => {
      const flower = flowers.find((f) => f.id === flowerId);
      if (!flower) return;
      setDeletingFlowerId(flowerId);
      await new Promise((r) => setTimeout(r, 600));
      removeFlower(flowerId);
      setDeletingFlowerId(null);
      const { flowers: currentFlowers } = useStore.getState();
      if (currentFlowers.length === 0) {
        setHarvestVisible(false);
        setGenerationStatus('idle');
        clearReasoningLogs();
        return;
      }
      const { addReasoningLog } = useStore.getState();
      addReasoningLog({
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
      setTimeout(() => runGeneration(true), 200);
    },
    [flowers, projectId, removeFlower, setDeletingFlowerId, setRebalancing, runGeneration, setHarvestVisible, setGenerationStatus, clearReasoningLogs]
  );

  const handleReplantInsight = useCallback(
    async (result: HarvestResult) => {
      const { addReasoningLog } = useStore.getState();
      addReasoningLog({
        id: `reason-replant-${Date.now()}`,
        project_id: projectId,
        step_number: useStore.getState().reasoningLogs.length + 1,
        text_content: `Replanting insight: "${result.title}"…`,
        highlighted_phrases: [result.title],
        created_at: new Date().toISOString(),
      });
      await runGeneration(true);
    },
    [projectId, runGeneration]
  );

  // Point 11.4: Manual connection triggers AI regeneration
  const handleManualConnect = useCallback(
    async (
      sourceType: 'orb' | 'flower',
      sourceId: string,
      targetType: 'orb' | 'flower',
      targetId: string,
    ) => {
      // Don't create duplicate connections
      const { connections: currentConns, addConnection, addReasoningLog, flowers: currentFlowers } = useStore.getState();
      const alreadyExists = currentConns.some(
        c => (c.source_id === sourceId && c.target_id === targetId) ||
             (c.source_id === targetId && c.target_id === sourceId)
      );
      if (alreadyExists) return;

      // Determine the actual target — must be a flower
      // If user connected orb→flower or flower→flower
      const actualTargetId = targetType === 'orb' ? sourceId : targetId;
      const actualSourceId = targetType === 'orb' ? targetId : sourceId;
      const actualSourceType = targetType === 'orb' ? 'flower' : sourceType;

      const newConn = {
        id: `conn-manual-${Date.now()}`,
        project_id: projectId,
        source_type: actualSourceType as 'orb' | 'flower',
        source_id: actualSourceType === 'orb' ? 'orb' : actualSourceId,
        target_type: 'flower' as const,
        target_id: actualTargetId,
        relationship_description: 'Manual connection',
        created_at: new Date().toISOString(),
      };
      addConnection(newConn);

      // Log and trigger regeneration
      addReasoningLog({
        id: `reason-manual-conn-${Date.now()}`,
        project_id: projectId,
        step_number: useStore.getState().reasoningLogs.length + 1,
        text_content: `New manual connection created. Regenerating garden with updated relationships…`,
        highlighted_phrases: ['manual connection'],
        created_at: new Date().toISOString(),
      });

      setTimeout(() => runGeneration(true), 400);
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
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {generationStatus === 'loading' && <span style={{ color: 'rgba(0,220,255,0.6)' }}>⟳ Processing...</span>}
              {generationStatus === 'success' && flowers.length > 0 && <span style={{ color: 'rgba(57,255,20,0.6)' }}>✓ Growth complete</span>}
              {generationStatus === 'error' && <span style={{ color: 'rgba(255,100,100,0.7)' }}>✕ Error</span>}
            </div>
          </div>

          {/* Canvas + Harvest */}
          <div className="flex-1 relative overflow-hidden">
            <Canvas
              onDeletePetal={handleDeletePetal}
              onDeleteFlower={handleDeleteFlower}
              onManualConnect={handleManualConnect}
              pulseBright={pulseBright}
            />
            <HarvestPanel onReplant={handleReplantInsight} />
          </div>
        </div>
        <RightPanel onRegenerate={handleRegenerate} />
      </div>
    </div>
  );
}