import {
  Flower, Petal, Connection, ReasoningLog, HarvestResult, ModelParams, GrowthMode,
} from '../store/useStore';
import { persistGenerationToSupabase, logInteractionEvent } from '../lib/supabase';

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
  triggerType?: string; // 'auto' | 'manual_connect' | 'delete_petal' | etc.
}

export interface GenerationResult {
  flowers: Flower[];
  connections: Connection[];
  reasoningLogs: ReasoningLog[];
  harvestResults: HarvestResult[];
  snapshotId: string;
}

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
// Updated model to match the Python script
const MODEL = 'google/gemma-4-26b-a4b-it:free';

// ── System prompt matching Python script's <|think|> injection ──
function buildSystemPrompt(growthMode: GrowthMode, modelParams: ModelParams): string {
  return `<|think|>You are the core design orchestration engine for an interactive network platform. Analyze problems, establish semantic nodes as flowers, sub-concepts as petals, and link them accurately. Always return data matching the rigid layout JSON structures.

Growth Mode: ${growthMode}
${growthMode === 'Focused'
  ? 'Focus on the most directly relevant and tightly connected concepts only.'
  : 'Explore divergent, cross-domain connections and creative lateral associations.'}

Applied parameters: temperature=${modelParams.temperature}, top_p=${modelParams.top_p}, top_k=${modelParams.top_k}

CRITICAL: You MUST respond with ONLY valid JSON matching this EXACT schema. No markdown fences, no explanation text outside the JSON object.

The response must contain exactly these top-level keys:
- project_metadata
- applied_model_parameters
- reasoning_stream
- canvas_layout (with flowers and connections)
- harvest_panel

Rules:
- Generate 4-6 flowers with 3-6 petals each
- connections can be orb→flower OR flower→flower (not all must connect to orb)
- color_theme must be one of: cyan, green, pink, orange, blue, purple, yellow
- All IDs must be unique strings
- is_manual must be false for AI-generated connections
- harvest_panel must contain exactly 4 items, one per tab_type: "Core Insights", "Generated Artifacts", "Future Scenarios", "Flow Analysis"
- Make all analytical content deeply insightful and specific to the problem domain`;
}

// ── Build the strict JSON schema for response_format ──
const CANVAS_RESPONSE_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'canvas_generation_schema',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        project_metadata: {
          type: 'object',
          properties: {
            project_id: { type: 'string' },
            updated_counts: {
              type: 'object',
              properties: {
                total_flowers: { type: 'integer' },
                total_petals: { type: 'integer' },
                total_reasoning_steps: { type: 'integer' },
                total_harvest_cards: { type: 'integer' },
              },
              required: ['total_flowers', 'total_petals', 'total_reasoning_steps', 'total_harvest_cards'],
              additionalProperties: false,
            },
          },
          required: ['project_id', 'updated_counts'],
          additionalProperties: false,
        },
        applied_model_parameters: {
          type: 'object',
          properties: {
            temperature: { type: 'number' },
            top_p: { type: 'number' },
            top_k: { type: 'integer' },
            presence_penalty: { type: 'number' },
            frequency_penalty: { type: 'number' },
          },
          required: ['temperature', 'top_p', 'top_k', 'presence_penalty', 'frequency_penalty'],
          additionalProperties: false,
        },
        reasoning_stream: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step_number: { type: 'integer' },
              text_content: { type: 'string' },
              highlighted_phrases: { type: 'array', items: { type: 'string' } },
            },
            required: ['step_number', 'text_content', 'highlighted_phrases'],
            additionalProperties: false,
          },
        },
        canvas_layout: {
          type: 'object',
          properties: {
            flowers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  flower_label: { type: 'string' },
                  entity_name: { type: 'string' },
                  color_theme: { type: 'string' },
                  position_x: { type: 'number' },
                  position_y: { type: 'number' },
                  ring: { type: 'integer' },
                  petals: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        petal_label: { type: 'string' },
                        sub_entity_name: { type: 'string' },
                        description: { type: 'string' },
                        angle: { type: 'number' },
                      },
                      required: ['id', 'petal_label', 'sub_entity_name', 'description', 'angle'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['id', 'flower_label', 'entity_name', 'color_theme', 'position_x', 'position_y', 'ring', 'petals'],
                additionalProperties: false,
              },
            },
            connections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  source_type: { type: 'string' },
                  source_id: { type: 'string' },
                  target_type: { type: 'string' },
                  target_id: { type: 'string' },
                  relationship_description: { type: 'string' },
                  is_manual: { type: 'boolean' },
                },
                required: ['id', 'source_type', 'source_id', 'target_type', 'target_id', 'relationship_description', 'is_manual'],
                additionalProperties: false,
              },
            },
          },
          required: ['flowers', 'connections'],
          additionalProperties: false,
        },
        harvest_panel: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              tab_type: { type: 'string' },
              title: { type: 'string' },
              summary: { type: 'string' },
              content: {
                type: 'object',
                properties: {
                  paragraphs: { type: 'array', items: { type: 'string' } },
                  key_points: { type: 'array', items: { type: 'string' } },
                },
                required: ['paragraphs', 'key_points'],
                additionalProperties: false,
              },
            },
            required: ['id', 'tab_type', 'title', 'summary', 'content'],
            additionalProperties: false,
          },
        },
      },
      required: ['project_metadata', 'applied_model_parameters', 'reasoning_stream', 'canvas_layout', 'harvest_panel'],
      additionalProperties: false,
    },
  },
};

// ── Conversation history for multi-turn context retention (matches Python script) ──
// Keyed by projectId so different projects maintain separate histories
const conversationHistories: Record<string, Array<{ role: string; content: string }>> = {};

function getOrCreateHistory(projectId: string, growthMode: GrowthMode, modelParams: ModelParams) {
  if (!conversationHistories[projectId]) {
    conversationHistories[projectId] = [
      {
        role: 'system',
        content: buildSystemPrompt(growthMode, modelParams),
      },
    ];
  }
  return conversationHistories[projectId];
}

function buildUserPrompt(payload: GenerationPayload): string {
  const parts: string[] = [];

  if (payload.problemDescription) {
    parts.push(`Problem Domain: "${payload.problemDescription}"`);
  }
  if (payload.problemUploadUrl) {
    parts.push(`Problem image provided: ${payload.problemUploadUrl}`);
  }
  if (payload.inspirationUrls.length > 0) {
    parts.push(`Inspiration sources (${payload.inspirationUrls.length}): ${payload.inspirationUrls.join(', ')}`);
  }
  if (payload.existingFlowers && payload.existingFlowers.length > 0) {
    const names = payload.existingFlowers.map((f) => f.entity_name).join(', ');
    parts.push(`IMPORTANT: Build upon these existing entities already on the canvas: [${names}]. Preserve them and extend the garden.`);
  }
  if (payload.deletedEntities && payload.deletedEntities.length > 0) {
    parts.push(`Recently removed entities (do not recreate): [${payload.deletedEntities.join(', ')}]`);
  }

  parts.push(`Project ID: "${payload.projectId}"`);
  parts.push(`Growth mode: ${payload.growthMode}`);
  parts.push(
    payload.existingFlowers?.length
      ? `This is an UPDATE pass. Keep existing flowers, add/refine based on context.`
      : `This is an INITIAL generation pass. Build a complete garden from scratch.`
  );

  return parts.join('\n');
}

// ── Demo fallback data ──
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
        description: template.descriptions[j] ?? `Analysis of ${name} in context of ${template.name}`,
        created_at: now,
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
    });

    connections.push({
      id: `conn-orb-${i + 1}`,
      project_id: projectId,
      source_type: 'orb',
      source_id: 'central-orb',
      target_type: 'flower',
      target_id: `flower-${i + 1}`,
      relationship_description: `Core analytical pathway connecting to ${template.name}`,
      created_at: now,
    });
  }

  // Add some flower→flower connections
  if (flowers.length >= 2) {
    connections.push({
      id: `conn-flower-1-2-${Date.now()}`,
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
      id: `conn-flower-2-4-${Date.now()}`,
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
    { text: problemContext ? `Analyzing: "${problemContext.slice(0, 55)}…"` : 'Analyzing problem context...', highlights: ['problem context'] },
    { text: 'Detecting cross-domain pattern similarities...', highlights: ['cross-domain patterns'] },
    { text: 'Mapping structural analogies: biological networks → system architecture...', highlights: ['biological networks', 'system architecture'] },
    { text: 'Identifying primary entity clusters based on semantic proximity...', highlights: ['entity clusters'] },
    { text: 'Calculating optimal connection pathways...', highlights: ['connection pathways'] },
    { text: 'Synthesizing harvest insights from cross-domain analysis...', highlights: ['harvest insights'] },
    { text: `Growth complete. Garden established with ${flowers.length} primary entities.`, highlights: ['Growth complete'] },
  ];

  reasoningSteps.forEach((step, i) => {
    reasoningLogs.push({
      id: `reason-${i + 1}-${Date.now()}`,
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
          'The system continuously adapts to changing conditions without central coordination, improving resilience.',
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
          'These emergent behaviors, guided by biological principles, enable systems to handle novel challenges autonomously.',
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

// ── Main generation function ──
export async function generateGarden(
  payload: GenerationPayload,
  onReasoningChunk: (log: ReasoningLog) => void
): Promise<GenerationResult> {
  const snapshotId = `snap-${payload.projectId}-${Date.now()}`;
  const triggerType = payload.triggerType ?? 'auto';

  // ── No API key → use demo data ──
  if (!OPENROUTER_API_KEY) {
    const demoResult = buildDemoResponse(payload.projectId, payload, snapshotId);
    for (let i = 0; i < demoResult.reasoningLogs.length; i++) {
      await new Promise((r) => setTimeout(r, 350 + Math.random() * 250));
      onReasoningChunk(demoResult.reasoningLogs[i]);
    }
    await new Promise((r) => setTimeout(r, 400));

    // Persist demo result to Supabase
    await persistGenerationToSupabase({
      projectId: payload.projectId,
      snapshotId,
      triggerType,
      flowers: demoResult.flowers,
      connections: demoResult.connections,
      reasoningLogs: demoResult.reasoningLogs,
      harvestResults: demoResult.harvestResults,
      modelParams: payload.modelParams,
    });

    return demoResult;
  }

  // ── Real API call matching Python script pattern ──
  try {
    const history = getOrCreateHistory(payload.projectId, payload.growthMode, payload.modelParams);
    const userPrompt = buildUserPrompt(payload);

    // Add user message to history (multi-turn context)
    history.push({ role: 'user', content: userPrompt });

    // Build messages array with image content if provided
    const messages: any[] = [];

    // Add all history except last user message
    for (let i = 0; i < history.length - 1; i++) {
      messages.push(history[i]);
    }

    // Build the final user message with optional image attachments
    const userContent: any[] = [{ type: 'text', text: userPrompt }];

    if (payload.problemUploadUrl) {
      userContent.push({ type: 'image_url', image_url: { url: payload.problemUploadUrl } });
    }
    payload.inspirationUrls.forEach((url) => {
      userContent.push({ type: 'image_url', image_url: { url } });
    });

    messages.push({ role: 'user', content: userContent });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'ExpertBloom Canvas',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        response_format: CANVAS_RESPONSE_SCHEMA,
        temperature: payload.modelParams.temperature,
        top_p: payload.modelParams.top_p,
        top_k: payload.modelParams.top_k,
        presence_penalty: payload.modelParams.presence_penalty,
        frequency_penalty: payload.modelParams.frequency_penalty,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rawText: string = data.choices?.[0]?.message?.content || '';

    // Add assistant response to history for next turn
    history.push({ role: 'assistant', content: rawText });

    // Extract JSON — handle both raw JSON and markdown-wrapped
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in response');

    const parsed = JSON.parse(jsonMatch[0]);

    const result = await processApiResponse(
      parsed, payload.projectId, snapshotId, onReasoningChunk
    );

    // Persist to Supabase
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

    return result;

  } catch (error) {
    console.error('[OpenRouter] API call failed, falling back to demo data:', error);

    const demoResult = buildDemoResponse(payload.projectId, payload, snapshotId);
    for (const log of demoResult.reasoningLogs) {
      await new Promise((r) => setTimeout(r, 280));
      onReasoningChunk(log);
    }

    await persistGenerationToSupabase({
      projectId: payload.projectId,
      snapshotId,
      triggerType,
      flowers: demoResult.flowers,
      connections: demoResult.connections,
      reasoningLogs: demoResult.reasoningLogs,
      harvestResults: demoResult.harvestResults,
      modelParams: payload.modelParams,
    });

    return demoResult;
  }
}

// ── Process the new schema response format ──
async function processApiResponse(
  parsed: any,
  projectId: string,
  snapshotId: string,
  onReasoningChunk: (log: ReasoningLog) => void
): Promise<GenerationResult> {
  const now = new Date().toISOString();
  const validColors = ['cyan', 'green', 'pink', 'orange', 'blue', 'purple', 'yellow'];
  const fallbackColors = ['cyan', 'green', 'pink', 'orange', 'blue', 'purple'];

  // ── Extract flowers from canvas_layout ──
  const rawFlowers: any[] = parsed.canvas_layout?.flowers ?? parsed.entities ?? [];
  const flowers: Flower[] = rawFlowers.map((entity: any, i: number) => {
    const petalCount = (entity.petals ?? entity.sub_entities ?? []).length || 1;
    const angle = (i / Math.max(rawFlowers.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const radius = 260;

    const petals: Petal[] = (entity.petals ?? entity.sub_entities ?? []).map(
      (se: any, j: number) => ({
        id: `${se.id ?? `petal-${i + 1}-${j + 1}`}-${Date.now() + j}`,
        flower_id: entity.id,
        petal_label: se.petal_label ?? `${i + 1}.${j + 1}`,
        sub_entity_name: se.sub_entity_name ?? se.name ?? '',
        description: se.description ?? '',
        created_at: now,
        angle: se.angle ?? 0,
      })
    );

    const colorTheme = validColors.includes(entity.color_theme)
      ? entity.color_theme
      : fallbackColors[i % fallbackColors.length];

    return {
      id: entity.id,
      project_id: projectId,
      flower_label: entity.flower_label ?? `Flower ${i + 1}`,
      entity_name: entity.entity_name ?? entity.name ?? `Entity ${i + 1}`,
      position_x: entity.position_x ?? Math.cos(angle) * radius,
      position_y: entity.position_y ?? Math.sin(angle) * radius,
      color_theme: colorTheme,
      created_at: now,
      petals,
      ring: entity.ring ?? 0,
    };
  });

  // ── Extract connections from canvas_layout ──
  const rawConns: any[] = parsed.canvas_layout?.connections ?? parsed.connections ?? [];
  const connections: Connection[] = rawConns.map((conn: any, i: number) => ({
    id: conn.id ?? `conn-${i + 1}-${Date.now()}`,
    project_id: projectId,
    source_type: conn.source_type as 'orb' | 'flower',
    source_id: conn.source_id,
    target_type: 'flower',
    target_id: conn.target_id,
    relationship_description:
      conn.relationship_description ?? conn.relationship ?? '',
    created_at: now,
  }));

  // ── Stream reasoning steps ──
  const rawReasoning: any[] = parsed.reasoning_stream ?? parsed.reasoning ?? [];
  const reasoningLogs: ReasoningLog[] = [];

  for (const step of rawReasoning) {
    const log: ReasoningLog = {
      id: `reason-${step.step_number ?? step.step ?? reasoningLogs.length + 1}-${Date.now()}`,
      project_id: projectId,
      step_number: step.step_number ?? step.step ?? reasoningLogs.length + 1,
      text_content: step.text_content ?? step.text ?? '',
      highlighted_phrases: step.highlighted_phrases ?? step.highlights ?? [],
      created_at: now,
    };
    reasoningLogs.push(log);
    onReasoningChunk(log);
    await new Promise((r) => setTimeout(r, 180));
  }

  // ── Extract harvest panel results ──
  const rawHarvest: any[] = parsed.harvest_panel ?? parsed.harvest_insights ?? [];
  const harvestResults: HarvestResult[] = rawHarvest.map((h: any, i: number) => ({
    id: h.id ?? `harvest-${i + 1}-${Date.now()}`,
    project_id: projectId,
    tab_type: (h.tab_type ?? h.tab) as HarvestResult['tab_type'],
    title: h.title ?? '',
    summary: h.summary ?? '',
    content: h.content ?? { paragraphs: [], key_points: [] },
    created_at: now,
  }));

  return { flowers, connections, reasoningLogs, harvestResults, snapshotId };
}