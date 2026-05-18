import { create } from 'zustand';

export type GrowthMode = 'Focused' | 'Divergent';
export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

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

interface AppState {
  // Project
  projectId: string;
  projectName: string;

  // Growth mode
  growthMode: GrowthMode;
  creativityLevel: number;
  showReasoning: boolean;

  // Model params
  modelParams: ModelParams;
  pendingParamChange: boolean;

  // Uploads
  uploads: Upload[];
  problemUpload: Upload | null;
  inspirationUploads: (Upload | null)[];

  // Problem description text
  problemDescription: string;

  // Canvas data
  flowers: Flower[];
  connections: Connection[];

  // Reasoning
  reasoningLogs: ReasoningLog[];
  reasoningExpanded: boolean;

  // Harvest
  harvestResults: HarvestResult[];
  harvestVisible: boolean;
  activeHarvestTab: HarvestResult['tab_type'];

  // UI State
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

  // Actions
  setGrowthMode: (mode: GrowthMode) => void;
  setCreativityLevel: (level: number) => void;
  setShowReasoning: (show: boolean) => void;
  setModelParam: (key: keyof ModelParams, value: number) => void;
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
  setActiveHarvestTab: (tab: HarvestResult['tab_type']) => void;
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
  setPendingParamChange: (v: boolean) => void;
  setProjectName: (name: string) => void;
}

export const useStore = create<AppState>((set) => ({
  projectId: `proj-${Date.now()}`,
  projectName: 'Untitled Garden',

  growthMode: 'Focused',
  creativityLevel: 0.7,
  showReasoning: true,

  modelParams: {
    temperature: 0.8,
    top_p: 0.9,
    top_k: 50,
    presence_penalty: 0.6,
    frequency_penalty: 0.3,
  },
  pendingParamChange: false,

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
  activeHarvestTab: 'Core Insights',

  generationStatus: 'idle',
  errorMessage: '',
  leftPanelOpen: true,
  rightPanelOpen: true,
  harvestHeight: 40,
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

  setGrowthMode: (mode) => set({ growthMode: mode }),
  setCreativityLevel: (level) => set({ creativityLevel: level }),
  setShowReasoning: (show) => set({ showReasoning: show }),
  setModelParam: (key, value) =>
    set((state) => ({
      modelParams: { ...state.modelParams, [key]: value },
      pendingParamChange: true,
    })),
  setPendingParamChange: (v) => set({ pendingParamChange: v }),
  setProblemUpload: (upload) => set({ problemUpload: upload }),
  setInspirationUpload: (slot, upload) =>
    set((state) => {
      const arr = [...state.inspirationUploads];
      arr[slot] = upload;
      return { inspirationUploads: arr };
    }),
  setProblemDescription: (text) => set({ problemDescription: text }),
  addFlower: (flower) =>
    set((state) => ({ flowers: [...state.flowers, flower] })),
  updateFlower: (id, updates) =>
    set((state) => ({
      flowers: state.flowers.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),
  removeFlower: (id) =>
    set((state) => ({
      flowers: state.flowers.filter((f) => f.id !== id),
      connections: state.connections.filter(
        (c) => c.source_id !== id && c.target_id !== id
      ),
    })),
  addPetal: (flowerId, petal) =>
    set((state) => ({
      flowers: state.flowers.map((f) =>
        f.id === flowerId ? { ...f, petals: [...f.petals, petal] } : f
      ),
    })),
  removePetal: (flowerId, petalId) =>
    set((state) => ({
      flowers: state.flowers.map((f) =>
        f.id === flowerId
          ? {
              ...f,
              petals: f.petals
                .filter((p) => p.id !== petalId)
                .map((p, i) => ({
                  ...p,
                  petal_label: `${f.flower_label.replace('Flower ', '')}.${i + 1}`,
                })),
            }
          : f
      ),
    })),
  addConnection: (connection) =>
    set((state) => ({ connections: [...state.connections, connection] })),
  setConnections: (connections) => set({ connections }),
  addReasoningLog: (log) =>
    set((state) => ({ reasoningLogs: [...state.reasoningLogs, log] })),
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
  resetCanvas: () =>
    set({
      flowers: [],
      connections: [],
      reasoningLogs: [],
      harvestResults: [],
      harvestVisible: false,
      generationStatus: 'idle',
      errorMessage: '',
    }),
  setShareModal: (modal) => set({ shareModal: modal }),
  setReasoningModalOpen: (open) => set({ reasoningModalOpen: open }),
  setReasoningExpanded: (v) => set({ reasoningExpanded: v }),
  incrementQueue: () => set((state) => ({ generationQueue: state.generationQueue + 1 })),
  decrementQueue: () => set((state) => ({ generationQueue: Math.max(0, state.generationQueue - 1) })),
  setCompactView: (v) => set({ compactView: v }),
  setProjectName: (name) => set({ projectName: name }),
}));