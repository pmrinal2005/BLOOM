// C:\Users\mrutu\OneDrive\Desktop\bloom\src\services\ai.ts
import { GoogleGenAI } from '@google/genai';
import {
  Flower, Petal, Connection, ReasoningLog, HarvestResult, ModelParams, GrowthMode,
} from '../store/useStore';
import { persistGenerationToSupabase, logInteractionEvent } from '../lib/supabase';

const GOOGLE_AI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';

let ai: GoogleGenAI | null = null;
if (GOOGLE_AI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });
}

const MODEL_NAME = 'models/gemma-4-26b-a4b-it';

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
  showReasoning?: boolean;
}

export interface GenerationResult {
  flowers: Flower[];
  connections: Connection[];
  reasoningLogs: ReasoningLog[];
  harvestResults: HarvestResult[];
  snapshotId: string;
}

export class NetworkError extends Error {
  constructor(msg: string) { super(msg); this.name = 'NetworkError'; }
}
export class APIKeyError extends Error {
  constructor(msg: string) { super(msg); this.name = 'APIKeyError'; }
}
export class ParseError extends Error {
  constructor(msg: string) { super(msg); this.name = 'ParseError'; }
}

interface NormalizedModelParams {
  temperature: number;
  topP: number;
  topK: number;
}

function normalizeModelParams(modelParams: ModelParams, creativityLevel: number): NormalizedModelParams {
  const creativityTemperature = 0.4 + ((creativityLevel - 0.3) / 0.7) * 1.2;
  const blendedTemp = creativityTemperature * 0.6 + Number(modelParams.temperature) * 0.4;
  const temperature = Number.isFinite(blendedTemp) ? Math.min(Math.max(blendedTemp, 0.01), 1.99) : 0.8;
  const creativityTopP = 0.7 + ((creativityLevel - 0.3) / 0.7) * 0.25;
  const rawTopP = Number(modelParams.top_p);
  const blendedTopP = creativityTopP * 0.5 + rawTopP * 0.5;
  const topP = Number.isFinite(blendedTopP) ? Math.min(Math.max(blendedTopP, 0.01), 1.0) : 0.9;
  const topK = Number.isFinite(Number(modelParams.top_k)) ? Math.max(1, Math.floor(Number(modelParams.top_k))) : 40;
  return { temperature, topP, topK };
}

interface ConversationTurn {
  role: 'user' | 'model';
  parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }>;
}

const conversationHistories: Record<string, ConversationTurn[]> = {};

function getHistory(projectId: string): ConversationTurn[] {
  if (!conversationHistories[projectId]) conversationHistories[projectId] = [];
  return conversationHistories[projectId];
}

export function clearHistory(projectId: string): void {
  delete conversationHistories[projectId];
}

function generateColorFromName(name: string, usedColors: Set<string>): string {
  const allColors = ['cyan', 'green', 'pink', 'orange', 'blue', 'purple', 'yellow'];
  const available = allColors.filter(c => !usedColors.has(c));
  const pool = available.length > 0 ? available : allColors;
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// Image processing: fetch URL → base64 inline data part
// Handles blob: URLs (local object URLs from file uploads) and http/https URLs
// ─────────────────────────────────────────────────────────────────────────────
async function urlToInlineDataPart(
  url: string,
  label: string
): Promise<{ inlineData: { data: string; mimeType: string } } | null> {
  try {
    // Skip empty or obviously invalid URLs
    if (!url || url.trim() === '') return null;

    console.log(`[AI] Fetching image for inline data: ${label} — ${url.substring(0, 60)}…`);

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[AI] Could not fetch image [${label}]: ${response.status} ${response.statusText} — skipping`);
      return null;
    }

    // Detect mime type from response headers, fallback by URL extension, then default
    let mimeType = response.headers.get('content-type') ?? '';
    // Strip parameters like "; charset=utf-8"
    if (mimeType.includes(';')) mimeType = mimeType.split(';')[0].trim();

    // If content-type is not an image type, infer from URL
    if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
      const urlLower = url.toLowerCase().split('?')[0];
      if (urlLower.endsWith('.png')) mimeType = 'image/png';
      else if (urlLower.endsWith('.webp')) mimeType = 'image/webp';
      else if (urlLower.endsWith('.gif')) mimeType = 'image/gif';
      else if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (urlLower.endsWith('.mp4')) mimeType = 'video/mp4';
      else mimeType = 'image/jpeg'; // safe default
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      console.warn(`[AI] Empty response body for [${label}] — skipping`);
      return null;
    }

    // Convert ArrayBuffer → Base64 string
    // Works in both browser (Uint8Array → btoa) and Node (Buffer)
    const uint8Array = new Uint8Array(arrayBuffer);
    let base64Data: string;

    if (typeof Buffer !== 'undefined') {
      // Node.js environment
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    } else {
      // Browser environment
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...Array.from(chunk));
      }
      base64Data = btoa(binary);
    }

    console.log(`[AI] Successfully encoded [${label}]: ${mimeType}, ${Math.round(arrayBuffer.byteLength / 1024)}KB`);

    return {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    };
  } catch (err: any) {
    // Non-fatal: log and skip this image rather than failing the whole request
    console.warn(`[AI] Failed to process image [${label}]:`, err?.message ?? err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Build multimodal content parts array for Gemma 4
// Images FIRST, text context LAST — as recommended by DeepMind guidelines
// Handles all 4 cases: problem+inspiration, partial, inspiration-only, text-only
// ─────────────────────────────────────────────────────────────────────────────
async function buildMultimodalParts(
  payload: GenerationPayload,
  textPrompt: string
): Promise<Array<{ text: string } | { inlineData: { data: string; mimeType: string } }>> {
  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

  let hasAnyImage = false;

  // ── Case 1 & 2: Problem Matrix (0 or 1 image) ──
  if (payload.problemUploadUrl && payload.problemUploadUrl.trim() !== '') {
    const problemPart = await urlToInlineDataPart(payload.problemUploadUrl, 'Problem Matrix');
    if (problemPart) {
      parts.push({ text: '=== PROBLEM MATRIX VISUAL CONTEXT ===' });
      parts.push(problemPart);
      hasAnyImage = true;
      console.log('[AI] Problem Matrix image attached to payload');
    }
  }

  // ── Case 2 & 3: Inspiration Matrices (0–4 images) ──
  const cleanInspirationUrls = (payload.inspirationUrls ?? [])
    .filter(u => u && u.trim() !== '')
    .slice(0, 4); // enforce max 4

  if (cleanInspirationUrls.length > 0) {
    parts.push({ text: `=== INSPIRATION MATRIX REFERENCE VISUALS (${cleanInspirationUrls.length} provided) ===` });

    for (let i = 0; i < cleanInspirationUrls.length; i++) {
      const inspirationPart = await urlToInlineDataPart(
        cleanInspirationUrls[i],
        `Inspiration Matrix ${i + 1}`
      );
      if (inspirationPart) {
        parts.push({ text: `[Inspiration Reference Asset #${i + 1}]` });
        parts.push(inspirationPart);
        hasAnyImage = true;
      }
    }

    if (hasAnyImage) {
      console.log(`[AI] ${cleanInspirationUrls.length} inspiration image(s) processed`);
    }
  }

  // ── Case 4 / All cases: Text context always appended LAST ──
  // Per DeepMind guidelines: text context at end of multimodal sequence
  if (hasAnyImage) {
    // Append visual analysis instruction before the main prompt
    parts.push({
      text: `Based on the contextual visuals provided above, perform a deep architectural analysis. 
Analyze structural patterns, visual layouts, and cross-reference the Problem Matrix with any Inspiration Matrix images. 
Extract design principles, color systems, spatial arrangements, and emergent concepts that can inform the concept garden below.

${textPrompt}`,
    });
  } else {
    // Case 4: Text-only — no images found or provided
    parts.push({ text: textPrompt });
  }

  console.log(`[AI] Multimodal parts built: ${parts.length} total (images: ${hasAnyImage})`);
  return parts;
}

function buildSystemInstruction(
  growthMode: GrowthMode,
  modelParams: ModelParams,
  showReasoning: boolean,
  creativityLevel: number
): string {
  const normalized = normalizeModelParams(modelParams, creativityLevel);

  const creativityDesc = creativityLevel > 0.75
    ? 'VERY HIGH CREATIVITY: Generate highly unexpected, lateral, metaphorical connections across very distant domains. Be bold and surprising.'
    : creativityLevel > 0.5
    ? 'MEDIUM-HIGH CREATIVITY: Mix familiar and novel connections. Introduce cross-domain analogies.'
    : creativityLevel > 0.35
    ? 'MODERATE CREATIVITY: Balance direct relevance with some lateral thinking.'
    : 'LOW CREATIVITY: Stay close to the literal problem domain. Be direct and practical.';

  return `You are the core design orchestration engine for ExpertBloom, an interactive concept-mapping platform.

Growth Mode: ${growthMode}
${growthMode === 'Focused' ? 'Prioritize depth: tightly connected, directly relevant concepts.' : 'Prioritize breadth: divergent, cross-domain, unexpected linkages.'}
Creativity Level: ${creativityLevel.toFixed(2)} — ${creativityDesc}
Effective temperature: ${normalized.temperature.toFixed(3)}, topP: ${normalized.topP.toFixed(3)}, topK: ${normalized.topK}

VISUAL ANALYSIS CAPABILITY:
- You may receive visual inputs (Problem Matrix and/or Inspiration Matrix images)
- When images are provided: analyze their visual structure, patterns, color systems, spatial arrangements, and emergent concepts
- Extract meaningful design principles from the visuals to inform concept generation
- Cross-reference Problem Matrix visuals with Inspiration Matrix references to find analogies
- When no images are provided: rely entirely on the text description

STRICT OUTPUT CONTRACT:
- Return exactly one valid JSON object, nothing else
- No markdown fences, no code blocks, no prose
- Start with { end with }
- Directly parseable by JSON.parse()

UNIQUENESS RULES — CRITICAL:
- Every flower must have a completely unique entity_name — NO duplicates whatsoever
- Every flower must have a unique id: "flower-1", "flower-2", etc.
- Every petal must have a unique id: "petal-1-1", "petal-2-3", etc.
- color_theme: one of cyan, green, pink, orange, blue, purple, yellow
- Assign different color_theme to each flower when possible
- 1 to 8 flowers total
- sub_entity_name: max 4 words

PETAL COUNT DIVERSITY RULES — CRITICAL:
- Each flower MUST have a DIFFERENT number of petals from other flowers
- Use the full range: some flowers 1-2 petals (peripheral), others 5-8 petals (central/rich)
- NEVER give all or most flowers the same petal count
- Central/core concepts → more petals (5-8); Supporting/peripheral → fewer petals (1-3)

REASONING:
${showReasoning ? 'reasoning_stream: 3-15 steps based on complexity. Reference visual observations when images were analyzed.' : 'reasoning_stream: empty array []'}

HARVEST PANEL:
- 1-4 items, only include tab_types relevant to the domain
- tab_type values: "Core Insights", "Generated Artifacts", "Future Scenarios", "Flow Analysis"
- Each tab_type at most once

REQUIRED JSON SHAPE:
{
  "project_metadata": { "project_id": "string", "updated_counts": { "total_flowers": 4, "total_petals": 16, "total_reasoning_steps": 6, "total_harvest_cards": 4 } },
  "applied_model_parameters": { "temperature": ${normalized.temperature}, "top_p": ${normalized.topP}, "top_k": ${normalized.topK}, "presence_penalty": 0.0, "frequency_penalty": 0.0 },
  "reasoning_stream": [ { "step_number": 1, "text_content": "...", "highlighted_phrases": ["..."] } ],
  "canvas_layout": {
    "flowers": [
      { "id": "flower-1", "flower_label": "Flower 1", "entity_name": "Unique Concept Name", "color_theme": "cyan", "position_x": 0, "position_y": -260, "ring": 0,
        "petals": [
          { "id": "petal-1-1", "petal_label": "1.1", "sub_entity_name": "Short Name", "description": "Detailed description", "angle": 0 },
          { "id": "petal-1-2", "petal_label": "1.2", "sub_entity_name": "Another Name", "description": "Another description", "angle": 1.57 }
        ]
      }
    ],
    "connections": [ { "id": "conn-1", "source_type": "orb", "source_id": "orb", "target_type": "flower", "target_id": "flower-1", "relationship_description": "...", "is_manual": false } ]
  },
  "harvest_panel": [
    { "id": "harvest-1", "tab_type": "Core Insights", "title": "...", "summary": "...", "content": { "paragraphs": ["..."], "key_points": ["..."] } }
  ]
}`;
}

function buildTextPrompt(payload: GenerationPayload): string {
  const parts: string[] = [];

  if (payload.problemDescription?.trim())
    parts.push(`PROBLEM DOMAIN: "${payload.problemDescription.trim()}"`);

  // Note: image URLs are processed separately as inline data parts
  // We still mention their presence for context
  if (payload.problemUploadUrl)
    parts.push(`[Problem Matrix image has been provided and processed above for visual analysis]`);

  if ((payload.inspirationUrls ?? []).filter(u => u).length > 0)
    parts.push(`[${payload.inspirationUrls.filter(u => u).length} Inspiration Matrix image(s) have been provided and processed above for visual analysis]`);

  if (payload.existingFlowers && payload.existingFlowers.length > 0) {
    const names = payload.existingFlowers.map(f => `"${f.entity_name}"`).join(', ');
    const ids = payload.existingFlowers.map(f => f.id).join(', ');
    parts.push(`EXISTING ENTITIES — PRESERVE, do NOT duplicate names: [${names}]`);
    parts.push(`Existing IDs for connections: [${ids}]`);
  }

  if (payload.deletedEntities && payload.deletedEntities.length > 0)
    parts.push(`DELETED — do NOT recreate: [${payload.deletedEntities.join(', ')}]`);

  parts.push(`Project: "${payload.projectId}"`);
  parts.push(`Growth mode: ${payload.growthMode}`);
  parts.push(`Creativity: ${payload.creativityLevel}`);

  parts.push(
    payload.existingFlowers?.length
      ? `CONTEXT-AWARE UPDATE: Preserve existing flowers. Add NEW flowers with UNIQUE names. Ensure petal counts vary across flowers (1-8, no two same count). Return JSON only.`
      : `INITIAL GENERATION: All flower names must be unique. Each flower must have a DIFFERENT petal count (distribute across 1-8 based on concept complexity). Return JSON only, start with {.`
  );

  return parts.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Main API call — now multimodal
// ─────────────────────────────────────────────────────────────────────────────
async function callGeminiAPI(payload: GenerationPayload, textPrompt: string): Promise<string> {
  if (!GOOGLE_AI_API_KEY || !ai) {
    throw new APIKeyError('No Google AI API key configured. Please add VITE_GOOGLE_AI_API_KEY to your environment.');
  }

  const history = getHistory(payload.projectId);
  const normalized = normalizeModelParams(payload.modelParams, payload.creativityLevel);

  console.log('[AI] Calling model:', MODEL_NAME);
  console.log('[AI] Effective params — temp:', normalized.temperature.toFixed(3), 'topP:', normalized.topP.toFixed(3), 'topK:', normalized.topK);
  console.log('[AI] Creativity level:', payload.creativityLevel);
  console.log('[AI] Problem URL:', payload.problemUploadUrl ? 'present' : 'none');
  console.log('[AI] Inspiration URLs:', (payload.inspirationUrls ?? []).filter(u => u).length);

  // Build multimodal parts (fetch images → base64 inline data)
  const currentParts = await buildMultimodalParts(payload, textPrompt);

  // For conversation history: only text-based turns are stored
  // (base64 image data is NOT stored in history to avoid memory bloat)
  // The current turn uses full multimodal parts; history turns use text only
  const userTurnForHistory: ConversationTurn = {
    role: 'user',
    parts: [{ text: textPrompt }], // text-only version for history
  };

  // Current request: history (text-only) + current multimodal parts
  const contentsForRequest = [
    ...history,
    {
      role: 'user' as const,
      parts: currentParts,
    },
  ];

  let response: any;
  try {
    response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contentsForRequest as any,
      config: {
        systemInstruction: buildSystemInstruction(
          payload.growthMode,
          payload.modelParams,
          payload.showReasoning ?? true,
          payload.creativityLevel
        ),
        temperature: normalized.temperature,
        topP: normalized.topP,
        topK: normalized.topK,
        maxOutputTokens: 8192,
      },
    });
  } catch (err: any) {
    if (
      err?.message?.includes('fetch') ||
      err?.message?.includes('network') ||
      err?.name === 'TypeError'
    ) {
      throw new NetworkError('Network error: Could not reach the AI service. Check your internet connection.');
    }
    throw new Error(`API error: ${err?.message ?? 'Unknown error from model'}`);
  }

  const rawText = response.text ?? '';
  if (!rawText.trim()) {
    throw new ParseError('Model returned an empty response. Please try again.');
  }

  // Commit text-only turn to history (not the heavy base64 image data)
  history.push(userTurnForHistory);
  history.push({ role: 'model', parts: [{ text: rawText }] });
  if (history.length > 20) conversationHistories[payload.projectId] = history.slice(-20);

  console.log('[AI] Response length:', rawText.length);
  return rawText;
}

function extractJSON(rawText: string): any {
  let cleaned = rawText.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start)
    throw new ParseError('No valid JSON object found in model response. Please try again.');

  const jsonStr = cleaned.slice(start, end + 1);
  try { return JSON.parse(jsonStr); } catch (_) {}

  try {
    const repaired = jsonStr
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
    return JSON.parse(repaired);
  } catch (e) {
    throw new ParseError(`Could not parse model response as JSON: ${(e as Error).message}`);
  }
}

async function processAPIResponse(
  parsed: any,
  projectId: string,
  snapshotId: string,
  onReasoningChunk: (log: ReasoningLog) => void,
  showReasoning: boolean,
  existingFlowers: Flower[] = []
): Promise<GenerationResult> {
  const now = new Date().toISOString();
  const validColors = ['cyan', 'green', 'pink', 'orange', 'blue', 'purple', 'yellow'];

  if (!parsed.canvas_layout?.flowers?.length)
    throw new ParseError('Model response contained no flowers. Please try again.');

  const existingNames = new Set(existingFlowers.map(f => f.entity_name.toLowerCase().trim()));
  const usedColors = new Set(existingFlowers.map(f => f.color_theme));
  const seenNames = new Set<string>(existingNames);
  const seenIds = new Set<string>();
  const rawFlowers: any[] = [];

  for (const entity of parsed.canvas_layout.flowers) {
    const name = (entity.entity_name ?? entity.name ?? '').toLowerCase().trim();
    const id = entity.id ?? '';
    if (name && seenNames.has(name)) { console.warn('[AI] Skipping duplicate flower name:', name); continue; }
    if (id && seenIds.has(id)) { console.warn('[AI] Skipping duplicate flower id:', id); continue; }
    seenNames.add(name);
    if (id) seenIds.add(id);
    rawFlowers.push(entity);
  }

  if (rawFlowers.length === 0)
    throw new ParseError('All flowers in model response were duplicates. Please try again.');

  const flowers: Flower[] = rawFlowers.map((entity: any, i: number) => {
    const angle = (i / Math.max(rawFlowers.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const flowerId = entity.id ?? `flower-ai-${i + 1}-${Date.now()}`;

    let colorTheme = validColors.includes(entity.color_theme) ? entity.color_theme : '';
    if (!colorTheme || usedColors.has(colorTheme))
      colorTheme = generateColorFromName(entity.entity_name ?? `entity${i}`, usedColors);
    usedColors.add(colorTheme);

    const petalCount = Array.isArray(entity.petals) ? entity.petals.length : 0;
    const petals: Petal[] = (entity.petals ?? []).map((se: any, j: number) => ({
      id: `${se.id ?? `petal-${i + 1}-${j + 1}`}-${Date.now()}-${j}`,
      flower_id: flowerId,
      petal_label: se.petal_label ?? `${i + 1}.${j + 1}`,
      sub_entity_name: se.sub_entity_name ?? se.name ?? '',
      description: se.description ?? '',
      created_at: now,
      angle: typeof se.angle === 'number' ? se.angle : (j / Math.max(petalCount, 1)) * Math.PI * 2,
    }));

    return {
      id: flowerId,
      project_id: projectId,
      flower_label: entity.flower_label ?? `Flower ${i + 1}`,
      entity_name: entity.entity_name ?? entity.name ?? `Entity ${i + 1}`,
      position_x: typeof entity.position_x === 'number' ? entity.position_x : Math.cos(angle) * 260,
      position_y: typeof entity.position_y === 'number' ? entity.position_y : Math.sin(angle) * 260,
      color_theme: colorTheme,
      created_at: now,
      petals,
      ring: entity.ring ?? 0,
    };
  });

  const connections: Connection[] = (parsed.canvas_layout?.connections ?? [])
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
    .filter((c: Connection) => c.target_id !== '');

  const reasoningLogs: ReasoningLog[] = [];
  if (showReasoning) {
    for (const step of (parsed.reasoning_stream ?? [])) {
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
      await new Promise(r => setTimeout(r, 160));
    }
  }

  const validTabTypes = ['Core Insights', 'Generated Artifacts', 'Future Scenarios', 'Flow Analysis'];
  const harvestResults: HarvestResult[] = (parsed.harvest_panel ?? [])
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

  console.log('[AI] Result:', flowers.length, 'flowers,', connections.length, 'connections,', reasoningLogs.length, 'reasoning,', harvestResults.length, 'harvest');
  return { flowers, connections, reasoningLogs, harvestResults, snapshotId };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export async function generateGarden(
  payload: GenerationPayload,
  onReasoningChunk: (log: ReasoningLog) => void
): Promise<GenerationResult> {
  const snapshotId = `snap-${payload.projectId}-${Date.now()}`;
  const triggerType = payload.triggerType ?? 'auto';
  const showReasoning = payload.showReasoning ?? true;

  if (!GOOGLE_AI_API_KEY || !ai) {
    throw new APIKeyError('No Google AI API key configured. Please add VITE_GOOGLE_AI_API_KEY to your .env file.');
  }

  // Build text prompt (image fetching happens inside callGeminiAPI → buildMultimodalParts)
  const textPrompt = buildTextPrompt(payload);
  const rawText = await callGeminiAPI(payload, textPrompt);
  const parsed = extractJSON(rawText);
  const result = await processAPIResponse(
    parsed, payload.projectId, snapshotId, onReasoningChunk,
    showReasoning, payload.existingFlowers ?? []
  );

  try {
    await persistGenerationToSupabase({
      projectId: payload.projectId, snapshotId, triggerType,
      flowers: result.flowers, connections: result.connections,
      reasoningLogs: result.reasoningLogs, harvestResults: result.harvestResults,
      modelParams: payload.modelParams,
    });
    await logInteractionEvent({
      projectId: payload.projectId, snapshotId, eventType: 'param_change',
      payload: {
        trigger: triggerType,
        flower_count: result.flowers.length,
        model: MODEL_NAME,
        has_problem_image: !!payload.problemUploadUrl,
        inspiration_image_count: (payload.inspirationUrls ?? []).filter(u => u).length,
      },
    });
  } catch (dbErr) {
    console.warn('[AI] Supabase persist failed (non-fatal):', dbErr);
  }

  return result;
}