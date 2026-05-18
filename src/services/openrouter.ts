import { Flower, Petal, Connection, ReasoningLog, HarvestResult, ModelParams, GrowthMode } from '../store/useStore';

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
}

export interface GenerationResult {
  flowers: Flower[];
  connections: Connection[];
  reasoningLogs: ReasoningLog[];
  harvestResults: HarvestResult[];
}

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const MODEL = 'google/gemma-3-27b-it';

function buildSystemPrompt(growthMode: GrowthMode): string {
  return `You are ExpertBloom's analytical engine. Your task is to analyze the provided problem and inspiration images, then generate a structured knowledge garden.

Growth Mode: ${growthMode}
${growthMode === 'Focused' ? 'Focus on the most relevant and directly connected concepts.' : 'Explore divergent, cross-domain connections and creative associations.'}

You MUST respond with ONLY valid JSON in this exact format (no markdown, no explanation outside JSON):

{
  "entities": [
    {
      "id": "flower-1",
      "name": "Entity Name",
      "color_theme": "cyan|green|pink|orange|blue|purple|yellow",
      "sub_entities": [
        {
          "id": "petal-1-1",
          "name": "Sub-entity Name",
          "description": "Detailed description of this sub-entity and its relationship to the parent concept"
        }
      ]
    }
  ],
  "connections": [
    {
      "source_type": "orb",
      "source_id": "central-orb",
      "target_type": "flower",
      "target_id": "flower-1",
      "relationship": "Core analytical pathway connecting problem to this entity"
    },
    {
      "source_type": "flower",
      "source_id": "flower-1",
      "target_type": "flower",
      "target_id": "flower-2",
      "relationship": "Shared pattern of distributed optimization"
    }
  ],
  "reasoning": [
    {
      "step": 1,
      "text": "Reasoning step text here with natural language explanation",
      "highlights": ["key phrase one", "key phrase two"]
    }
  ],
  "harvest_insights": [
    {
      "tab": "Core Insights",
      "title": "Insight Title",
      "summary": "2-3 sentence summary of this insight",
      "content": {
        "paragraphs": ["paragraph 1", "paragraph 2"],
        "key_points": ["point 1", "point 2", "point 3"]
      }
    },
    {
      "tab": "Generated Artifacts",
      "title": "Artifact Title",
      "summary": "Brief artifact description",
      "content": {
        "paragraphs": ["description"],
        "key_points": ["feature 1", "feature 2"]
      }
    },
    {
      "tab": "Future Scenarios",
      "title": "Scenario Title",
      "summary": "Future scenario description",
      "content": {
        "paragraphs": ["scenario details"],
        "key_points": ["implication 1", "implication 2"]
      }
    },
    {
      "tab": "Flow Analysis",
      "title": "Flow Pattern",
      "summary": "How ideas connected in this analysis",
      "content": {
        "paragraphs": ["flow description"],
        "key_points": ["connection 1", "connection 2"]
      }
    }
  ]
}

Generate between 4-6 entities with 3-6 sub-entities each. Make all content deeply analytical and insightful.`;
}

function buildDemoResponse(projectId: string, payload: GenerationPayload): GenerationResult {
  const colors = ['cyan', 'green', 'pink', 'orange', 'blue', 'purple'];
  const entityCount = payload.growthMode === 'Divergent' ? 6 : 4;

  // Use problemDescription to personalize demo if available
  const problemContext = payload.problemDescription
    ? payload.problemDescription.trim()
    : '';

  const entityTemplates = [
    {
      name: problemContext ? `Core Analysis: ${problemContext.slice(0, 30)}${problemContext.length > 30 ? '…' : ''}` : 'Flow Optimization',
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
        id: `petal-${i + 1}-${j + 1}-${Date.now()}`,
        flower_id: `flower-${i + 1}`,
        petal_label: `${i + 1}.${j + 1}`,
        sub_entity_name: name,
        description:
          template.descriptions[j] ||
          `Detailed analysis of ${name} in context of ${template.name}`,
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

  if (flowers.length >= 2) {
    connections.push({
      id: `conn-flower-1-2`,
      project_id: projectId,
      source_type: 'flower',
      source_id: 'flower-1',
      target_type: 'flower',
      target_id: 'flower-2',
      relationship_description:
        'Shared optimization principles across flow and biological domains',
      created_at: now,
    });
  }
  if (flowers.length >= 4) {
    connections.push({
      id: `conn-flower-2-4`,
      project_id: projectId,
      source_type: 'flower',
      source_id: 'flower-2',
      target_type: 'flower',
      target_id: 'flower-4',
      relationship_description:
        'Temporal patterns emerging from biological rhythm synchronization',
      created_at: now,
    });
  }

  const reasoningSteps = [
    {
      text: problemContext
        ? `Analyzing problem: "${problemContext.slice(0, 60)}${problemContext.length > 60 ? '…' : ''}"…`
        : 'Analyzing problem context and identifying core challenge dimensions...',
      highlights: problemContext ? [problemContext.slice(0, 30)] : ['problem context', 'core challenge'],
    },
    {
      text: 'Detecting cross-domain pattern similarities between uploaded inspiration sources...',
      highlights: ['cross-domain patterns', 'inspiration sources'],
    },
    {
      text: 'Mapping structural analogies: biological networks → system architecture...',
      highlights: ['biological networks', 'system architecture'],
    },
    {
      text: 'Identifying primary entity clusters based on semantic proximity and conceptual overlap...',
      highlights: ['entity clusters', 'semantic proximity'],
    },
    {
      text: 'Calculating optimal connection pathways between discovered entities...',
      highlights: ['connection pathways', 'discovered entities'],
    },
    {
      text: 'Synthesizing harvest insights from cross-domain analysis...',
      highlights: ['harvest insights', 'cross-domain analysis'],
    },
    {
      text: `Growth complete. Garden structure established with ${flowers.length} primary entities.`,
      highlights: ['Growth complete'],
    },
  ];

  reasoningSteps.forEach((step, i) => {
    reasoningLogs.push({
      id: `reason-${i + 1}`,
      project_id: projectId,
      step_number: i + 1,
      text_content: step.text,
      highlighted_phrases: step.highlights,
      created_at: now,
    });
  });

  const harvestResults: HarvestResult[] = [
    {
      id: `harvest-1`,
      project_id: projectId,
      tab_type: 'Core Insights',
      title: 'Multi-Modal Flow Synchronization',
      summary:
        'Coordinating multiple system components using biologically-inspired optimization principles reduces inefficiency by 23-35%.',
      content: {
        paragraphs: [
          'By applying biological neural network patterns to system flow optimization, we identify key synchronization opportunities that traditional approaches miss.',
          'The cross-domain analysis reveals that decentralized decision-making, inspired by ant colony behavior, produces more resilient and adaptive solutions.',
        ],
        key_points: [
          'Decentralized decision making',
          'Pheromone-like digital signals',
          'Adaptive route adjustment',
          'Emergent efficiency patterns',
        ],
      },
      created_at: now,
    },
    {
      id: `harvest-2`,
      project_id: projectId,
      tab_type: 'Core Insights',
      title: 'Temporal Pattern Recognition',
      summary:
        'System behavior follows identifiable cycles that can be predicted and optimized using temporal dynamics analysis.',
      content: {
        paragraphs: [
          'Analysis of temporal patterns reveals recurring cycles in system behavior that align with both natural and artificial rhythms.',
          'Predictive modeling based on these patterns enables proactive optimization rather than reactive management.',
        ],
        key_points: [
          'Cycle prediction accuracy',
          'Phase transition management',
          'Rhythm-based optimization',
          'Adaptive scheduling',
        ],
      },
      created_at: now,
    },
    {
      id: `harvest-3`,
      project_id: projectId,
      tab_type: 'Generated Artifacts',
      title: 'Adaptive Flow Control System',
      summary:
        'A self-organizing control system that applies biological swarm intelligence to dynamic resource distribution.',
      content: {
        paragraphs: [
          'This artifact describes a control system architecture that combines distributed sensor networks with swarm intelligence algorithms.',
          'The system continuously adapts to changing conditions without central coordination, dramatically improving resilience.',
        ],
        key_points: [
          'Distributed sensor network',
          'Swarm intelligence core',
          'Self-healing topology',
          'Real-time adaptation',
        ],
      },
      created_at: now,
    },
    {
      id: `harvest-4`,
      project_id: projectId,
      tab_type: 'Future Scenarios',
      title: 'Emergent Intelligence Network',
      summary:
        'Future systems will exhibit emergent collective intelligence that surpasses any individual component capability.',
      content: {
        paragraphs: [
          'As systems grow more interconnected, emergent properties will create capabilities that were not explicitly programmed.',
          'These emergent behaviors, guided by biological principles, will enable systems to handle novel challenges autonomously.',
        ],
        key_points: [
          'Emergent problem solving',
          'Autonomous adaptation',
          'Collective intelligence',
          'Novel challenge handling',
        ],
      },
      created_at: now,
    },
    {
      id: `harvest-5`,
      project_id: projectId,
      tab_type: 'Flow Analysis',
      title: 'Cross-Domain Connection Matrix',
      summary:
        'Analysis of how ideas flowed between biological, temporal, and cognitive domains to produce unified insights.',
      content: {
        paragraphs: [
          'The connection garden reveals strong bidirectional flows between biological pattern synthesis and flow optimization domains.',
          'Temporal dynamics serves as a meta-connector, linking all other domains through shared rhythmic principles.',
        ],
        key_points: [
          'Bidirectional knowledge flow',
          'Meta-connector identification',
          'Domain bridge strength',
          'Insight convergence points',
        ],
      },
      created_at: now,
    },
  ];

  return { flowers, connections, reasoningLogs, harvestResults };
}

export async function generateGarden(
  payload: GenerationPayload,
  onReasoningChunk: (log: ReasoningLog) => void
): Promise<GenerationResult> {
  // If no API key, use demo data
  if (!OPENROUTER_API_KEY) {
    const demoResult = buildDemoResponse(payload.projectId, payload);

    for (let i = 0; i < demoResult.reasoningLogs.length; i++) {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
      onReasoningChunk(demoResult.reasoningLogs[i]);
    }

    await new Promise((r) => setTimeout(r, 500));
    return demoResult;
  }

  try {
    const content: any[] = [
      {
        type: 'text',
        text:
          buildSystemPrompt(payload.growthMode) +
          '\n\nAnalyze the following problem and inspiration content.\n' +
          (payload.problemDescription
            ? `User Problem Description: "${payload.problemDescription}"\n`
            : '') +
          (payload.existingFlowers?.length
            ? `Existing entities: ${payload.existingFlowers.map((f) => f.entity_name).join(', ')}. Build upon these.`
            : 'This is a fresh analysis.') +
          (payload.deletedEntities?.length
            ? ` Recently deleted: ${payload.deletedEntities.join(', ')}. Consider replacing or redistributing these concepts.`
            : ''),
      },
    ];

    if (payload.problemUploadUrl) {
      content.push({ type: 'image_url', image_url: { url: payload.problemUploadUrl } });
    }

    payload.inspirationUrls.forEach((url) => {
      content.push({ type: 'image_url', image_url: { url } });
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'ExpertBloom',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content }],
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
    const rawText = data.choices?.[0]?.message?.content || '';

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');

    const parsed = JSON.parse(jsonMatch[0]);
    return processApiResponse(parsed, payload.projectId, onReasoningChunk);
  } catch (error) {
    console.error('API call failed, using demo data:', error);
    const demoResult = buildDemoResponse(payload.projectId, payload);
    for (const log of demoResult.reasoningLogs) {
      await new Promise((r) => setTimeout(r, 300));
      onReasoningChunk(log);
    }
    return demoResult;
  }
}

async function processApiResponse(
  parsed: any,
  projectId: string,
  onReasoningChunk: (log: ReasoningLog) => void
): Promise<GenerationResult> {
  const now = new Date().toISOString();
  const colors = ['cyan', 'green', 'pink', 'orange', 'blue', 'purple', 'yellow'];

  const flowers: Flower[] = (parsed.entities || []).map((entity: any, i: number) => {
    const angle = (i / parsed.entities.length) * Math.PI * 2 - Math.PI / 2;
    const radius = 260;

    const petals: Petal[] = (entity.sub_entities || []).map((se: any, j: number) => ({
      id: `${se.id || `petal-${i + 1}-${j + 1}`}-${Date.now()}`,
      flower_id: entity.id,
      petal_label: `${i + 1}.${j + 1}`,
      sub_entity_name: se.name,
      description: se.description || '',
      created_at: now,
    }));

    return {
      id: entity.id,
      project_id: projectId,
      flower_label: `Flower ${i + 1}`,
      entity_name: entity.name,
      position_x: Math.cos(angle) * radius,
      position_y: Math.sin(angle) * radius,
      color_theme: entity.color_theme || colors[i % colors.length],
      created_at: now,
      petals,
    };
  });

  const connections: Connection[] = (parsed.connections || []).map(
    (conn: any, i: number) => ({
      id: `conn-${i + 1}-${Date.now()}`,
      project_id: projectId,
      source_type: conn.source_type,
      source_id: conn.source_id,
      target_type: conn.target_type,
      target_id: conn.target_id,
      relationship_description: conn.relationship,
      created_at: now,
    })
  );

  const reasoningLogs: ReasoningLog[] = [];
  for (const step of parsed.reasoning || []) {
    const log: ReasoningLog = {
      id: `reason-${step.step}-${Date.now()}`,
      project_id: projectId,
      step_number: step.step,
      text_content: step.text,
      highlighted_phrases: step.highlights || [],
      created_at: now,
    };
    reasoningLogs.push(log);
    onReasoningChunk(log);
    await new Promise((r) => setTimeout(r, 200));
  }

  const harvestResults: HarvestResult[] = (parsed.harvest_insights || []).map(
    (h: any, i: number) => ({
      id: `harvest-${i + 1}-${Date.now()}`,
      project_id: projectId,
      tab_type: h.tab,
      title: h.title,
      summary: h.summary,
      content: h.content,
      created_at: now,
    })
  );

  return { flowers, connections, reasoningLogs, harvestResults };
}