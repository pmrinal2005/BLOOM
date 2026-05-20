import { create } from 'zustand';

export type GrowthMode = 'Focused' | 'Divergent';
export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';
export type Theme = 'dark' | 'light';

export interface Upload {
  id: string;
  project_id: string;
  file_url: string;
  file_type: 'image' | 'video';
  thumbnail_url: string;
  description: string;
  created_at: string;
  slot?: 'problem' | number;
}

export interface Petal {
  id: string;
  flower_id: string;
  petal_label: string;
  sub_entity_name: string;
  description: string;
  created_at: string;
  angle?: number;
}

export interface Flower {
  id: string;
  project_id: string;
  flower_label: string;
  entity_name: string;
  position_x: number;
  position_y: number;
  color_theme: string;
  created_at: string;
  petals: Petal[];
  ring?: number;
}

export interface Connection {
  id: string;
  project_id: string;
  source_type: 'orb' | 'flower';
  source_id: string;
  target_type: 'flower';
  target_id: string;
  relationship_description: string;
  created_at: string;
}

export interface ReasoningLog {
  id: string;
  project_id: string;
  step_number: number;
  text_content: string;
  highlighted_phrases: string[];
  created_at: string;
}

export interface HarvestResult {
  id: string;
  project_id: string;
  tab_type: 'Core Insights' | 'Generated Artifacts' | 'Future Scenarios' | 'Flow Analysis';
  title: string;
  summary: string;
  content: any;
  created_at: string;
}

export interface ModelParams {
  temperature: number;
  top_p: number;
  top_k: number;
  presence_penalty: number;
  frequency_penalty: number;
}

export interface RecentProject {
  id: string;
  name: string;
  created_at: string;
  thumbnail?: string;
}

export interface DraggingConnection {
  sourceType: 'orb' | 'flower';
  sourceId: string;
  sourceX: number;
  sourceY: number;
  cursorX: number;
  cursorY: number;
  snapTargetId: string | null;
}

export interface LastGeneratedInput {
  description: string;
  problemUploadId: string;
  inspirationUploadIds: string;
}

const defaultModelParams: ModelParams = {
  temperature: 0.8,
  top_p: 0.9,
  top_k: 50,
  presence_penalty: 0.6,
  frequency_penalty: 0.3,
};

interface AppState {
  projectId: string;
  projectName: string;
  growthMode: GrowthMode;
  creativityLevel: number;
  showReasoning: boolean;
  theme: Theme;
  modelParams: ModelParams;
  stagedModelParams: ModelParams;
  pendingParamChange: boolean;
  changedParams: Set<keyof ModelParams>;
  uploads: Upload[];
  problemUpload: Upload | null;
  inspirationUploads: (Upload | null)[];
  problemDescription: string;
  flowers: Flower[];
  connections: Connection[];
  reasoningLogs: ReasoningLog[];
  reasoningExpanded: boolean;
  harvestResults: HarvestResult[];
  harvestVisible: boolean;
  activeHarvestTab: HarvestResult['tab_type'] | 'All';
  generationStatus: GenerationStatus;
  errorMessage: string;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  harvestHeight: number;
  canvasZoom: number;
  canvasOffset: { x: number; y: number };
  selectedFlowerId: string | null;
  hoveredFlowerId: string | null;
  hoveredConnectionId: string | null;
  deletingPetalId: string | null;
  deletingFlowerId: string | null;
  mergingFlowers: [string, string] | null;
  rebalancing: boolean;
  recentProjects: RecentProject[];
  shareModal: { open: boolean; content: HarvestResult | null };
  reasoningModalOpen: boolean;
  generationQueue: number;
  compactView: boolean;
  draggingConnection: DraggingConnection | null;
  hasGrown: boolean;
  lastGeneratedInput: LastGeneratedInput | null;

  setTheme: (theme: Theme) => void;
  setGrowthMode: (mode: GrowthMode) => void;
  setCreativityLevel: (level: number) => void;
  setShowReasoning: (show: boolean) => void;
  setModelParam: (key: keyof ModelParams, value: number) => void;
  setStagedModelParam: (key: keyof ModelParams, value: number) => void;
  applyModelParams: () => void;
  setPendingParamChange: (v: boolean) => void;
  setProblemUpload: (upload: Upload | null) => void;
  setInspirationUpload: (slot: number, upload: Upload | null) => void;
  setProblemDescription: (text: string) => void;
  addFlower: (flower: Flower) => void;
  updateFlower: (id: string, updates: Partial<Flower>) => void;
  removeFlower: (id: string) => void;
  addPetal: (flowerId: string, petal: Petal) => void;
  removePetal: (flowerId: string, petalId: string) => void;
  addConnection: (connection: Connection) => void;
  setConnections: (connections: Connection[]) => void;
  addReasoningLog: (log: ReasoningLog) => void;
  clearReasoningLogs: () => void;
  setHarvestResults: (results: HarvestResult[]) => void;
  setHarvestVisible: (visible: boolean) => void;
  setActiveHarvestTab: (tab: HarvestResult['tab_type'] | 'All') => void;
  setGenerationStatus: (status: GenerationStatus) => void;
  setErrorMessage: (msg: string) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setHarvestHeight: (h: number) => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  setSelectedFlowerId: (id: string | null) => void;
  setHoveredFlowerId: (id: string | null) => void;
  setHoveredConnectionId: (id: string | null) => void;
  setDeletingPetalId: (id: string | null) => void;
  setDeletingFlowerId: (id: string | null) => void;
  setMergingFlowers: (pair: [string, string] | null) => void;
  setRebalancing: (v: boolean) => void;
  setFlowers: (flowers: Flower[]) => void;
  resetCanvas: () => void;
  setShareModal: (modal: { open: boolean; content: HarvestResult | null }) => void;
  setReasoningModalOpen: (open: boolean) => void;
  setReasoningExpanded: (v: boolean) => void;
  incrementQueue: () => void;
  decrementQueue: () => void;
  setCompactView: (v: boolean) => void;
  setProjectName: (name: string) => void;
  setDraggingConnection: (dc: DraggingConnection | null) => void;
  setHasGrown: (v: boolean) => void;
  setLastGeneratedInput: (input: LastGeneratedInput | null) => void;
}

export const useStore = create<AppState>((set) => ({
  projectId: `proj-${Date.now()}`,
  projectName: 'Untitled Garden',
  growthMode: 'Focused',
  creativityLevel: 0.7,
  showReasoning: true,
  theme: 'dark',
  modelParams: { ...defaultModelParams },
  stagedModelParams: { ...defaultModelParams },
  pendingParamChange: false,
  changedParams: new Set(),
  uploads: [],
  problemUpload: null,
  inspirationUploads: [null, null, null, null],
  problemDescription: '',
  flowers: [],
  connections: [],
  reasoningLogs: [],
  reasoningExpanded: false,
  harvestResults: [],
  harvestVisible: false,
  activeHarvestTab: 'All',
  generationStatus: 'idle',
  errorMessage: '',
  leftPanelOpen: true,
  rightPanelOpen: true,
  harvestHeight: 280,
  canvasZoom: 1,
  canvasOffset: { x: 0, y: 0 },
  selectedFlowerId: null,
  hoveredFlowerId: null,
  hoveredConnectionId: null,
  deletingPetalId: null,
  deletingFlowerId: null,
  mergingFlowers: null,
  rebalancing: false,
  recentProjects: [],
  shareModal: { open: false, content: null },
  reasoningModalOpen: false,
  generationQueue: 0,
  compactView: false,
  draggingConnection: null,
  hasGrown: false,
  lastGeneratedInput: null,

  setTheme: (theme) => {
    set({ theme });
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark-theme');
    }
  },

  setGrowthMode: (mode) => set({ growthMode: mode }),
  setCreativityLevel: (level) => set({ creativityLevel: level }),
  setShowReasoning: (show) => set({ showReasoning: show }),

  setModelParam: (key, value) => set(s => ({ modelParams: { ...s.modelParams, [key]: value }, pendingParamChange: true })),

  setStagedModelParam: (key, value) => set(s => {
    const newChangedParams = new Set(s.changedParams);
    if (s.modelParams[key] !== value) {
      newChangedParams.add(key);
    } else {
      newChangedParams.delete(key);
    }
    return {
      stagedModelParams: { ...s.stagedModelParams, [key]: value },
      pendingParamChange: newChangedParams.size > 0,
      changedParams: newChangedParams,
    };
  }),

  applyModelParams: () => set(s => ({
    modelParams: { ...s.stagedModelParams },
    pendingParamChange: false,
    changedParams: new Set(),
  })),

  setPendingParamChange: (v) => set({ pendingParamChange: v }),
  setProblemUpload: (upload) => set({ problemUpload: upload }),
  setInspirationUpload: (slot, upload) => set(s => { const arr = [...s.inspirationUploads]; arr[slot] = upload; return { inspirationUploads: arr }; }),
  setProblemDescription: (text) => set({ problemDescription: text }),
  addFlower: (flower) => set(s => ({ flowers: [...s.flowers, flower] })),
  updateFlower: (id, updates) => set(s => ({ flowers: s.flowers.map(f => f.id === id ? { ...f, ...updates } : f) })),
  removeFlower: (id) => set(s => ({ flowers: s.flowers.filter(f => f.id !== id), connections: s.connections.filter(c => c.source_id !== id && c.target_id !== id) })),
  addPetal: (flowerId, petal) => set(s => ({ flowers: s.flowers.map(f => f.id === flowerId ? { ...f, petals: [...f.petals, petal] } : f) })),
  removePetal: (flowerId, petalId) => set(s => ({ flowers: s.flowers.map(f => f.id === flowerId ? { ...f, petals: f.petals.filter(p => p.id !== petalId).map((p, i) => ({ ...p, petal_label: `${f.flower_label.replace('Flower ', '')}.${i + 1}` })) } : f) })),
  addConnection: (connection) => set(s => ({ connections: [...s.connections, connection] })),
  setConnections: (connections) => set({ connections }),
  addReasoningLog: (log) => set(s => ({ reasoningLogs: [...s.reasoningLogs, log] })),
  clearReasoningLogs: () => set({ reasoningLogs: [] }),
  setHarvestResults: (results) => set({ harvestResults: results }),
  setHarvestVisible: (visible) => set({ harvestVisible: visible }),
  setActiveHarvestTab: (tab) => set({ activeHarvestTab: tab }),
  setGenerationStatus: (status) => set({ generationStatus: status }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),
  setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  setHarvestHeight: (h) => set({ harvestHeight: h }),
  setCanvasZoom: (zoom) => set({ canvasZoom: Math.max(0.3, Math.min(3, zoom)) }),
  setCanvasOffset: (offset) => set({ canvasOffset: offset }),
  setSelectedFlowerId: (id) => set({ selectedFlowerId: id }),
  setHoveredFlowerId: (id) => set({ hoveredFlowerId: id }),
  setHoveredConnectionId: (id) => set({ hoveredConnectionId: id }),
  setDeletingPetalId: (id) => set({ deletingPetalId: id }),
  setDeletingFlowerId: (id) => set({ deletingFlowerId: id }),
  setMergingFlowers: (pair) => set({ mergingFlowers: pair }),
  setRebalancing: (v) => set({ rebalancing: v }),
  setFlowers: (flowers) => set({ flowers }),
  resetCanvas: () => set({ flowers: [], connections: [], reasoningLogs: [], harvestResults: [], harvestVisible: false, generationStatus: 'idle', errorMessage: '', hasGrown: false, lastGeneratedInput: null, activeHarvestTab: 'All' }),
  setShareModal: (modal) => set({ shareModal: modal }),
  setReasoningModalOpen: (open) => set({ reasoningModalOpen: open }),
  setReasoningExpanded: (v) => set({ reasoningExpanded: v }),
  incrementQueue: () => set(s => ({ generationQueue: s.generationQueue + 1 })),
  decrementQueue: () => set(s => ({ generationQueue: Math.max(0, s.generationQueue - 1) })),
  setCompactView: (v) => set({ compactView: v }),
  setProjectName: (name) => set({ projectName: name }),
  setDraggingConnection: (dc) => set({ draggingConnection: dc }),
  setHasGrown: (v) => set({ hasGrown: v }),
  setLastGeneratedInput: (input) => set({ lastGeneratedInput: input }),
}));