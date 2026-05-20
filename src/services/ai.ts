// C:\Users\mrutu\OneDrive\Desktop\bloom\src\services\ai.ts
/**
 * AI Service — Google AI Studio (Gemma 4 26B MoE)
 * Replaces the previous OpenRouter service.
 * All UI logic, store interactions, and Supabase persistence remain unchanged.
 */

import { GoogleGenAI } from '@google/genai';
import {
  Flower,
  Petal,
  Connection,
  ReasoningLog,
  HarvestResult,
  ModelParams,
  GrowthMode,
} from '../store/useStore';
import { persistGenerationToSupabase, logInteractionEvent } from '../lib/supabase';

// ── Environment ──
const GOOGLE_AI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';

// ── SDK client (lazy-initialised so missing key just falls to demo) ──
let ai: GoogleGenAI | null = null;
if (GOOGLE_AI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });
}

// Updated model path to avoid routing mismatch / 404
const MODEL_NAME = 'models/gemma-4-26b-a4b-it';

// ─────────────────────────────────────────────────────────────────────────────
// Public Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerationPayload {
  problemUploadUrl?: string;
  inspirationUrls: string[];
  problemDescription?: string;
  existingFlowers?: Flower[];
  deletedEntities?: string[];
  growthMode: GrowthMode;
  modelParams: ModelParams;
  creativityLevel: number;
  projectId: string;
  triggerType?: string;
}

export interface GenerationResult {
  flowers: Flower[];
  connections: Connection[];
  reasoningLogs: ReasoningLog[];
  harvestResults: HarvestResult[];
  snapshotId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Model params normalization
// Keeps the request within safe bounds for Google AI Studio.
// ─────────────────────────────────────────────────────────────────────────────

interface NormalizedModelParams {
  temperature: number;
  topP: number;
  topK: number;
}

function normalizeModelParams(modelParams: ModelParams): NormalizedModelParams {
  const rawTemperature = Number(modelParams.temperature);
  const rawTopP = Number(modelParams.top_p);
  const rawTopK = Number(modelParams.top_k);

  const temperature = Number.isFinite(rawTemperature)
    ? Math.min(Math.max(rawTemperature, 0.01), 1.99)
    : 0.8;

  const topP = Number.isFinite(rawTopP)
    ? Math.min(Math.max(rawTopP, 0.01), 1)
    : 0.95;

  const topK = Number.isFinite(rawTopK)
    ? Math.max(1, Math.floor(rawTopK))
    : 40;

  return { temperature, topP, topK };
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-turn conversation history
// Keyed by projectId — mirrors the Python script's message_history pattern.
// Google AI uses { role: 'user' | 'model', parts: [{text}] } format.
// ─────────────────────────────────────────────────────────────────────────────
interface ConversationTurn {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

const conversationHistories: Record<string, ConversationTurn[]> = {};

function getHistory(projectId: string): ConversationTurn[] {
  if (!conversationHistories[projectId]) {
    conversationHistories[projectId] = [];
  }
  return conversationHistories[projectId];
}

// ─────────────────────────────────────────────────────────────────────────────
// System Instruction — injected once per model call.
// Keeps output strictly JSON so the UI and parser stay stable.
// ─────────────────────────────────────────────────────────────────────────────
function buildSystemInstruction(growthMode: GrowthMode, modelParams: ModelParams): string {
  const normalized = normalizeModelParams(modelParams);

  return `You are the core design orchestration engine for an interactive concept-mapping network platform called ExpertBloom. Your role is to analyze problem domains and generate richly structured knowledge gardens.

Growth Mode: ${growthMode}
${growthMode === 'Focused'
    ? 'Focus on the most directly relevant and tightly connected concepts only. Prioritize depth over breadth.'
    : 'Explore divergent, cross-domain connections and creative lateral associations. Prioritize breadth and unexpected linkages.'}

Applied parameters: temperature=${normalized.temperature}, topP=${normalized.topP}, topK=${normalized.topK}

STRICT OUTPUT CONTRACT:
You must return exactly one valid JSON object and nothing else.
Do not use markdown fences, code blocks, or explanatory prose.
Do not prefix with \`\`\`json or any other text.
The response must start with { and end with }.
The response must be directly parseable by JSON.parse().

The JSON object must contain exactly these top-level keys:
1. project_metadata
2. applied_model_parameters
3. reasoning_stream
4. canvas_layout
5. harvest_panel

CONTENT RULES:
- Generate between 4 and 6 flowers with 3 to 6 petals each
- Connections may be orb to flower or flower to flower
- color_theme must be exactly one of: cyan, green, pink, orange, blue, purple, yellow
- All id strings must be unique across the entire response — use simple strings like "flower-1", "flower-2", "petal-1-1" etc.
- is_manual must always be false for AI-generated connections
- harvest_panel must contain exactly 4 items, one per tab_type: Core Insights, Generated Artifacts, Future Scenarios, Flow Analysis
- All analytical content must be deeply insightful, specific to the problem domain, and non-generic
- reasoning_stream should contain 5 to 8 concise rationale steps that summarize the decision path
- position_x and position_y are numbers representing canvas coordinates, use values between -400 and 400
- angle for petals is a number in radians, distribute evenly: for N petals, petal i gets angle = (i/N)*2*PI

REQUIRED JSON SHAPE (follow exactly):
{
  "project_metadata": {
    "project_id": "string",
    "updated_counts": {
      "total_flowers": 4,
      "total_petals": 16,
      "total_reasoning_steps": 6,
      "total_harvest_cards": 4
    }
  },
  "applied_model_parameters": {
    "temperature": 0.8,
    "top_p": 0.9,
    "top_k": 40,
    "presence_penalty": 0.0,
    "frequency_penalty": 0.0
  },
  "reasoning_stream": [
    {
      "step_number": 1,
      "text_content": "Analyzing the problem domain...",
      "highlighted_phrases": ["problem domain"]
    }
  ],
  "canvas_layout": {
    "flowers": [
      {
        "id": "flower-1",
        "flower_label": "Flower 1",
        "entity_name": "Concept Name Here",
        "color_theme": "cyan",
        "position_x": 0,
        "position_y": -260,
        "ring": 0,
        "petals": [
          {
            "id": "petal-1-1",
            "petal_label": "1.1",
            "sub_entity_name": "Sub Concept Name",
            "description": "Detailed description of this sub-concept and its relevance",
            "angle": 0
          }
        ]
      }
    ],
    "connections": [
      {
        "id": "conn-1",
        "source_type": "orb",
        "source_id": "orb",
        "target_type": "flower",
        "target_id": "flower-1",
        "relationship_description": "Description of how orb connects to this concept",
        "is_manual": false
      }
    ]
  },
  "harvest_panel": [
    {
      "id": "harvest-1",
      "tab_type": "Core Insights",
      "title": "Key Finding Title",
      "summary": "Brief summary of this insight",
      "content": {
        "paragraphs": ["Paragraph one.", "Paragraph two."],
        "key_points": ["Point one", "Point two", "Point three"]
      }
    },
    {
      "id": "harvest-2",
      "tab_type": "Generated Artifacts",
      "title": "Artifact Title",
      "summary": "Brief summary",
      "content": {
        "paragraphs": ["Paragraph one."],
        "key_points": ["Point one", "Point two"]
      }
    },
    {
      "id": "harvest-3",
      "tab_type": "Future Scenarios",
      "title": "Scenario Title",
      "summary": "Brief summary",
      "content": {
        "paragraphs": ["Paragraph one."],
        "key_points": ["Point one", "Point two"]
      }
    },
    {
      "id": "harvest-4",
      "tab_type": "Flow Analysis",
      "title": "Flow Title",
      "summary": "Brief summary",
      "content": {
        "paragraphs": ["Paragraph one."],
        "key_points": ["Point one", "Point two"]
      }
    }
  ]
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// User prompt builder — mirrors Python script's user turn
// ─────────────────────────────────────────────────────────────────────────────
function buildUserPrompt(payload: GenerationPayload): string {
  const parts: string[] = [];

  if (payload.problemDescription?.trim()) {
    parts.push(`PROBLEM DOMAIN: "${payload.problemDescription.trim()}"`);
  }
  if (payload.problemUploadUrl) {
    parts.push(`Problem image attached: ${payload.problemUploadUrl}`);
  }
  if (payload.inspirationUrls.length > 0) {
    parts.push(`Inspiration sources (${payload.inspirationUrls.length} images): ${payload.inspirationUrls.join(', ')}`);
  }
  if (payload.existingFlowers && payload.existingFlowers.length > 0) {
    const existingNames = payload.existingFlowers.map(f => `"${f.entity_name}"`).join(', ');
    const existingIds = payload.existingFlowers.map(f => f.id).join(', ');
    parts.push(`EXISTING CANVAS ENTITIES (preserve these, build upon them): [${existingNames}]`);
    parts.push(`Existing flower IDs to reference in connections: [${existingIds}]`);
  }
  if (payload.deletedEntities && payload.deletedEntities.length > 0) {
    parts.push(`REMOVED ENTITIES (do not recreate): [${payload.deletedEntities.join(', ')}]`);
  }

  parts.push(`Project ID: "${payload.projectId}"`);
  parts.push(`Growth mode: ${payload.growthMode}`);
  parts.push(
    payload.existingFlowers?.length
      ? `This is a CONTEXT-AWARE UPDATE PASS. Preserve existing flowers, reuse their exact IDs in connections where relevant, add new flowers, and regenerate the harvest analysis to reflect the full updated state. Return valid JSON only.`
      : `This is an INITIAL GENERATION PASS. Build a complete, rich knowledge garden from scratch based on the problem domain above. Return valid JSON only, starting with { and ending with }.`
  );

  return parts.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Core API call — Google AI Studio
// Clean config only, no thinkingConfig, to avoid 400 errors.
// ─────────────────────────────────────────────────────────────────────────────
async function callGeminiAPI(
  payload: GenerationPayload,
  userPromptText: string
): Promise<string> {
  if (!ai) throw new Error('Google AI client not initialized — check VITE_GOOGLE_AI_API_KEY');

  const history = getHistory(payload.projectId);
  const normalizedParams = normalizeModelParams(payload.modelParams);

  const userTurn: ConversationTurn = {
    role: 'user',
    parts: [{ text: userPromptText }],
  };

  const contents: ConversationTurn[] = [...history, userTurn];

  console.log('[AI] Calling model:', MODEL_NAME);
  console.log('[AI] User prompt:', userPromptText.slice(0, 200));

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: contents as any,
    config: {
      systemInstruction: buildSystemInstruction(payload.growthMode, payload.modelParams),
      temperature: normalizedParams.temperature,
      topP: normalizedParams.topP,
      topK: normalizedParams.topK,
      maxOutputTokens: 8192,
    },
  });

  const rawText = response.text ?? '';
  console.log('[AI] Raw response length:', rawText.length);
  console.log('[AI] Raw response preview:', rawText.slice(0, 300));

  if (!rawText.trim()) {
    throw new Error('Model returned empty response');
  }

  history.push(userTurn);
  history.push({
    role: 'model',
    parts: [{ text: rawText }],
  });

  if (history.length > 20) {
    conversationHistories[payload.projectId] = history.slice(history.length - 20);
  }

  return rawText;
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON extraction — robust handling of model wrapping output in markdown fences
// ─────────────────────────────────────────────────────────────────────────────
function extractJSON(rawText: string): any {
  let cleaned = rawText.trim();

  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  cleaned = cleaned.trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    console.error('[AI] No JSON object found. Raw text:', cleaned.slice(0, 500));
    throw new Error('No valid JSON object found in model response');
  }

  const jsonStr = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(jsonStr);
  } catch (firstError) {
    console.warn('[AI] Direct JSON parse failed, attempting repair:', (firstError as Error).message);
  }

  try {
    const repaired = jsonStr
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
    return JSON.parse(repaired);
  } catch (secondError) {
    console.error('[AI] JSON repair failed:', (secondError as Error).message);
    console.error('[AI] JSON string preview:', jsonStr.slice(0, 800));
    throw new Error(`Failed to parse model response as JSON: ${(secondError as Error).message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Process the validated JSON response into app data structures
// ─────────────────────────────────────────────────────────────────────────────
async function processAPIResponse(
  parsed: any,
  projectId: string,
  snapshotId: string,
  onReasoningChunk: (log: ReasoningLog) => void
): Promise<GenerationResult> {
  const now = new Date().toISOString();
  const validColors = ['cyan', 'green', 'pink', 'orange', 'blue', 'purple', 'yellow'];
  const fallbackColors = ['cyan', 'green', 'pink', 'orange', 'blue', 'purple'];

  if (!parsed.canvas_layout) {
    throw new Error('Model response missing canvas_layout');
  }
  if (!Array.isArray(parsed.canvas_layout.flowers) || parsed.canvas_layout.flowers.length === 0) {
    throw new Error('Model response has no flowers in canvas_layout');
  }

  // ── Flowers ──
  const rawFlowers: any[] = parsed.canvas_layout.flowers ?? [];
  const flowers: Flower[] = rawFlowers.map((entity: any, i: number) => {
    const angle = (i / Math.max(rawFlowers.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const radius = 260;

    const flowerId = entity.id ?? `flower-${i + 1}`;

    const petals: Petal[] = (entity.petals ?? []).map((se: any, j: number) => ({
      id: `${se.id ?? `petal-${i + 1}-${j + 1}`}-${Date.now()}-${j}`,
      flower_id: flowerId,
      petal_label: se.petal_label ?? `${i + 1}.${j + 1}`,
      sub_entity_name: se.sub_entity_name ?? se.name ?? '',
      description: se.description ?? '',
      created_at: now,
      angle: typeof se.angle === 'number'
        ? se.angle
        : (j / Math.max((entity.petals ?? []).length, 1)) * Math.PI * 2,
    }));

    const colorTheme = validColors.includes(entity.color_theme)
      ? entity.color_theme
      : fallbackColors[i % fallbackColors.length];

    return {
      id: flowerId,
      project_id: projectId,
      flower_label: entity.flower_label ?? `Flower ${i + 1}`,
      entity_name: entity.entity_name ?? entity.name ?? `Entity ${i + 1}`,
      position_x: typeof entity.position_x === 'number' ? entity.position_x : Math.cos(angle) * radius,
      position_y: typeof entity.position_y === 'number' ? entity.position_y : Math.sin(angle) * radius,
      color_theme: colorTheme,
      created_at: now,
      petals,
      ring: entity.ring ?? 0,
    };
  });

  // ── Connections ──
  const rawConns: any[] = parsed.canvas_layout?.connections ?? [];
  const connections: Connection[] = rawConns
    .map((conn: any, i: number) => ({
      id: conn.id ?? `conn-${i + 1}-${Date.now()}`,
      project_id: projectId,
      source_type: (conn.source_type === 'flower' ? 'flower' : 'orb') as 'orb' | 'flower',
      source_id: conn.source_type === 'flower' ? (conn.source_id ?? 'orb') : 'orb',
      target_type: 'flower' as const,
      target_id: conn.target_id ?? '',
      relationship_description: conn.relationship_description ?? '',
      created_at: now,
    }))
    .filter(conn => conn.target_id !== '');

  // ── Reasoning stream — emit each step with delay for live feel ──
  const rawReasoning: any[] = parsed.reasoning_stream ?? [];
  const reasoningLogs: ReasoningLog[] = [];

  for (const step of rawReasoning) {
    const log: ReasoningLog = {
      id: `reason-${step.step_number ?? reasoningLogs.length + 1}-${Date.now()}-${reasoningLogs.length}`,
      project_id: projectId,
      step_number: step.step_number ?? reasoningLogs.length + 1,
      text_content: step.text_content ?? '',
      highlighted_phrases: Array.isArray(step.highlighted_phrases) ? step.highlighted_phrases : [],
      created_at: now,
    };
    reasoningLogs.push(log);
    onReasoningChunk(log);
    await new Promise((r) => setTimeout(r, 160));
  }

  // ── Harvest panel ──
  const validTabTypes = ['Core Insights', 'Generated Artifacts', 'Future Scenarios', 'Flow Analysis'];
  const rawHarvest: any[] = parsed.harvest_panel ?? [];
  const harvestResults: HarvestResult[] = rawHarvest
    .filter((h: any) => validTabTypes.includes(h.tab_type))
    .map((h: any, i: number) => ({
      id: h.id ?? `harvest-${i + 1}-${Date.now()}`,
      project_id: projectId,
      tab_type: h.tab_type as HarvestResult['tab_type'],
      title: h.title ?? '',
      summary: h.summary ?? '',
      content: {
        paragraphs: Array.isArray(h.content?.paragraphs) ? h.content.paragraphs : [],
        key_points: Array.isArray(h.content?.key_points) ? h.content.key_points : [],
      },
      created_at: now,
    }));

  console.log(
    '[AI] Processed:',
    flowers.length,
    'flowers,',
    connections.length,
    'connections,',
    reasoningLogs.length,
    'reasoning steps'
  );

  return { flowers, connections, reasoningLogs, harvestResults, snapshotId };
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo fallback (used when API key is missing or API call fails)
// ─────────────────────────────────────────────────────────────────────────────
function buildDemoResponse(
  projectId: string,
  payload: GenerationPayload,
  snapshotId: string
): GenerationResult {
  const colors = ['cyan', 'green', 'pink', 'orange', 'blue', 'purple'];
  const entityCount = payload.growthMode === 'Divergent' ? 6 : 4;
  const problemContext = payload.problemDescription?.trim() ?? '';

  const entityTemplates = [
    {
      name: problemContext
        ? `Core Analysis: ${problemContext.slice(0, 28)}${problemContext.length > 28 ? '…' : ''}`
        : 'Flow Optimization',
      petals: ['Signal Synchronization', 'Capacity Distribution', 'Adaptive Routing', 'Throughput Analysis', 'Bottleneck Resolution'],
      descriptions: [
        'Real-time adaptive signal coordination using distributed sensor networks',
        'Dynamic allocation of resources across network nodes for maximum efficiency',
        'Predictive pathfinding using historical flow data and AI pattern recognition',
        'Continuous measurement of system throughput against theoretical maximums',
        'Automated identification and resolution of system constraints and chokepoints',
      ],
    },
    {
      name: 'Biological Pattern Synthesis',
      petals: ['Neural Mimicry', 'Swarm Intelligence', 'Emergent Behavior', 'Self-Organization'],
      descriptions: [
        'Applying neural network architectures inspired by biological brain connectivity',
        'Leveraging collective intelligence patterns from ant colonies and bee swarms',
        'Harnessing complex behaviors arising from simple local interaction rules',
        'Systems that spontaneously organize without central coordination',
      ],
    },
    {
      name: 'Resource Distribution Matrix',
      petals: ['Load Balancing', 'Redundancy Planning', 'Priority Queuing', 'Elastic Scaling', 'Failover Systems'],
      descriptions: [
        'Intelligent distribution of computational load across available resources',
        'Strategic redundancy to ensure system reliability and fault tolerance',
        'Dynamic prioritization of tasks based on urgency and importance',
        'Automatic scaling of resources based on real-time demand patterns',
        'Seamless transition to backup systems during primary system failures',
      ],
    },
    {
      name: 'Temporal Dynamics',
      petals: ['Cycle Recognition', 'Predictive Modeling', 'Phase Transitions', 'Rhythm Optimization'],
      descriptions: [
        'Identifying recurring patterns and cycles within complex data streams',
        'Machine learning models for forecasting future system states',
        'Understanding critical transition points in system behavior',
        'Aligning operational cycles with natural and artificial rhythms',
      ],
    },
    {
      name: 'Cognitive Architecture',
      petals: ['Memory Systems', 'Attention Mechanisms', 'Decision Trees', 'Pattern Recognition', 'Learning Loops'],
      descriptions: [
        'Multi-layered memory systems inspired by hippocampal organization',
        'Focus allocation algorithms that prioritize high-value information',
        'Hierarchical decision frameworks for complex multi-criteria choices',
        'Deep pattern recognition across multiple data modalities',
        'Continuous self-improvement through feedback loop integration',
      ],
    },
    {
      name: 'Systems Ecology',
      petals: ['Niche Specialization', 'Energy Cascades', 'Keystone Dynamics', 'Resilience Networks'],
      descriptions: [
        'Defining specialized roles within the broader system ecosystem',
        'Efficient transfer and transformation of energy through system layers',
        'Critical nodes whose removal would significantly alter system behavior',
        'Network structures that maintain function under perturbation and stress',
      ],
    },
  ];

  const now = new Date().toISOString();
  const flowers: Flower[] = [];
  const connections: Connection[] = [];
  const reasoningLogs: ReasoningLog[] = [];

  for (let i = 0; i < Math.min(entityCount, entityTemplates.length); i++) {
    const template = entityTemplates[i];
    const angle = (i / entityCount) * Math.PI * 2 - Math.PI / 2;
    const radius = 260;

    const petals: Petal[] = template.petals
      .slice(0, 4 + Math.floor(Math.random() * 2))
      .map((name, j) => ({
        id: `petal-${i + 1}-${j + 1}-${Date.now() + j}`,
        flower_id: `flower-${i + 1}`,
        petal_label: `${i + 1}.${j + 1}`,
        sub_entity_name: name,
        description: template.descriptions[j] ?? `Analysis of ${name}`,
        created_at: now,
        angle: (j / template.petals.length) * Math.PI * 2,
      }));

    flowers.push({
      id: `flower-${i + 1}`,
      project_id: projectId,
      flower_label: `Flower ${i + 1}`,
      entity_name: template.name,
      position_x: Math.cos(angle) * radius,
      position_y: Math.sin(angle) * radius,
      color_theme: colors[i % colors.length],
      created_at: now,
      petals,
      ring: 0,
    });

    connections.push({
      id: `conn-orb-${i + 1}-${Date.now()}`,
      project_id: projectId,
      source_type: 'orb',
      source_id: 'orb',
      target_type: 'flower',
      target_id: `flower-${i + 1}`,
      relationship_description: `Core analytical pathway connecting to ${template.name}`,
      created_at: now,
    });
  }

  if (flowers.length >= 2) {
    connections.push({
      id: `conn-f1-f2-${Date.now()}`,
      project_id: projectId,
      source_type: 'flower',
      source_id: 'flower-1',
      target_type: 'flower',
      target_id: 'flower-2',
      relationship_description: 'Shared optimization principles across flow and biological domains',
      created_at: now,
    });
  }

  if (flowers.length >= 4) {
    connections.push({
      id: `conn-f2-f4-${Date.now()}`,
      project_id: projectId,
      source_type: 'flower',
      source_id: 'flower-2',
      target_type: 'flower',
      target_id: 'flower-4',
      relationship_description: 'Temporal patterns emerging from biological rhythm synchronization',
      created_at: now,
    });
  }

  const reasoningSteps = [
    {
      text: problemContext
        ? `Analyzing domain: "${problemContext.slice(0, 55)}${problemContext.length > 55 ? '…' : ''}"`
        : 'Analyzing problem context and identifying core challenge dimensions...',
      highlights: ['problem context'],
    },
    { text: 'Detecting cross-domain pattern similarities between inspiration matrices...', highlights: ['cross-domain patterns', 'inspiration matrices'] },
    { text: 'Mapping structural analogies: biological networks to system architecture...', highlights: ['biological networks', 'system architecture'] },
    { text: 'Identifying primary entity clusters based on semantic proximity and conceptual overlap...', highlights: ['entity clusters', 'semantic proximity'] },
    { text: 'Calculating optimal connection pathways between discovered entities...', highlights: ['connection pathways'] },
    { text: 'Synthesizing harvest insights from cross-domain analysis...', highlights: ['harvest insights', 'cross-domain analysis'] },
    { text: `Garden complete. ${flowers.length} primary entities established with ${connections.length} connections.`, highlights: ['Garden complete'] },
  ];

  reasoningSteps.forEach((step, i) => {
    reasoningLogs.push({
      id: `reason-${i + 1}-${Date.now() + i}`,
      project_id: projectId,
      step_number: i + 1,
      text_content: step.text,
      highlighted_phrases: step.highlights,
      created_at: now,
    });
  });

  const harvestResults: HarvestResult[] = [
    {
      id: `harvest-1-${Date.now()}`,
      project_id: projectId,
      tab_type: 'Core Insights',
      title: 'Multi-Modal Flow Synchronization',
      summary: 'Coordinating multiple system components using biologically-inspired optimization principles reduces inefficiency by 23-35%.',
      content: {
        paragraphs: [
          'By applying biological neural network patterns to system flow optimization, we identify key synchronization opportunities that traditional approaches miss.',
          'The cross-domain analysis reveals that decentralized decision-making, inspired by ant colony behavior, produces more resilient and adaptive solutions.',
        ],
        key_points: ['Decentralized decision making', 'Pheromone-like digital signals', 'Adaptive route adjustment', 'Emergent efficiency patterns'],
      },
      created_at: now,
    },
    {
      id: `harvest-2-${Date.now()}`,
      project_id: projectId,
      tab_type: 'Generated Artifacts',
      title: 'Adaptive Flow Control System',
      summary: 'A self-organizing control system applying biological swarm intelligence to dynamic resource distribution.',
      content: {
        paragraphs: [
          'This artifact describes a control system architecture combining distributed sensor networks with swarm intelligence algorithms.',
          'The system continuously adapts without central coordination, dramatically improving resilience.',
        ],
        key_points: ['Distributed sensor network', 'Swarm intelligence core', 'Self-healing topology', 'Real-time adaptation'],
      },
      created_at: now,
    },
    {
      id: `harvest-3-${Date.now()}`,
      project_id: projectId,
      tab_type: 'Future Scenarios',
      title: 'Emergent Intelligence Network',
      summary: 'Future systems will exhibit emergent collective intelligence surpassing any individual component capability.',
      content: {
        paragraphs: [
          'As systems grow more interconnected, emergent properties create capabilities not explicitly programmed.',
          'These emergent behaviors, guided by biological principles, enable handling of novel challenges autonomously.',
        ],
        key_points: ['Emergent problem solving', 'Autonomous adaptation', 'Collective intelligence', 'Novel challenge handling'],
      },
      created_at: now,
    },
    {
      id: `harvest-4-${Date.now()}`,
      project_id: projectId,
      tab_type: 'Flow Analysis',
      title: 'Cross-Domain Connection Matrix',
      summary: 'Analysis of how ideas flowed between biological, temporal, and cognitive domains to produce unified insights.',
      content: {
        paragraphs: [
          'The connection garden reveals strong bidirectional flows between biological pattern synthesis and flow optimization domains.',
          'Temporal dynamics serves as a meta-connector, linking all other domains through shared rhythmic principles.',
        ],
        key_points: ['Bidirectional knowledge flow', 'Meta-connector identification', 'Domain bridge strength', 'Insight convergence points'],
      },
      created_at: now,
    },
  ];

  return { flowers, connections, reasoningLogs, harvestResults, snapshotId };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export — called by App.tsx
// ─────────────────────────────────────────────────────────────────────────────
export async function generateGarden(
  payload: GenerationPayload,
  onReasoningChunk: (log: ReasoningLog) => void
): Promise<GenerationResult> {
  const snapshotId = `snap-${payload.projectId}-${Date.now()}`;
  const triggerType = payload.triggerType ?? 'auto';

  // ── No API key → demo data ──
  if (!GOOGLE_AI_API_KEY || !ai) {
    console.warn('[AI] No VITE_GOOGLE_AI_API_KEY found — using demo data');
    const demo = buildDemoResponse(payload.projectId, payload, snapshotId);

    for (let i = 0; i < demo.reasoningLogs.length; i++) {
      await new Promise((r) => setTimeout(r, 350 + Math.random() * 250));
      onReasoningChunk(demo.reasoningLogs[i]);
    }
    await new Promise((r) => setTimeout(r, 400));

    await persistGenerationToSupabase({
      projectId: payload.projectId,
      snapshotId,
      triggerType,
      flowers: demo.flowers,
      connections: demo.connections,
      reasoningLogs: demo.reasoningLogs,
      harvestResults: demo.harvestResults,
      modelParams: payload.modelParams,
    });

    return demo;
  }

  // ── Real API call ──
  try {
    const userPrompt = buildUserPrompt(payload);
    const rawText = await callGeminiAPI(payload, userPrompt);

    console.log('[AI] Raw model response length:', rawText.length);

    const parsed = extractJSON(rawText);
    const result = await processAPIResponse(parsed, payload.projectId, snapshotId, onReasoningChunk);

    await persistGenerationToSupabase({
      projectId: payload.projectId,
      snapshotId,
      triggerType,
      flowers: result.flowers,
      connections: result.connections,
      reasoningLogs: result.reasoningLogs,
      harvestResults: result.harvestResults,
      modelParams: payload.modelParams,
    });

    await logInteractionEvent({
      projectId: payload.projectId,
      snapshotId,
      eventType: triggerType === 'auto' ? 'auto' : triggerType as any,
      payload: {
        trigger: triggerType,
        flower_count: result.flowers.length,
        connection_count: result.connections.length,
        model: MODEL_NAME,
      },
    });

    return result;
  } catch (error) {
    console.error('[AI] Gemini API call failed, falling back to demo data:', error);

    const demo = buildDemoResponse(payload.projectId, payload, snapshotId);
    for (const log of demo.reasoningLogs) {
      await new Promise((r) => setTimeout(r, 260));
      onReasoningChunk(log);
    }

    await persistGenerationToSupabase({
      projectId: payload.projectId,
      snapshotId,
      triggerType,
      flowers: demo.flowers,
      connections: demo.connections,
      reasoningLogs: demo.reasoningLogs,
      harvestResults: demo.harvestResults,
      modelParams: payload.modelParams,
    });

    return demo;
  }
}