// C:\Users\mrutu\OneDrive\Desktop\bloom\src\lib\supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Helper: upsert a full generation result into Supabase ──
export async function persistGenerationToSupabase(params: {
  projectId: string;
  snapshotId: string;
  triggerType: string;
  flowers: any[];
  connections: any[];
  reasoningLogs: any[];
  harvestResults: any[];
  modelParams: any;
}) {
  if (!supabaseUrl || !supabaseAnonKey) return; // skip if not configured

  const {
    projectId, snapshotId, triggerType,
    flowers, connections, reasoningLogs, harvestResults, modelParams,
  } = params;

  try {
    // 1. Ensure project row exists
    await supabase.from('projects').upsert({
      id: projectId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id', ignoreDuplicates: false });

    // 2. Create snapshot (trigger sets is_current on others to false)
    await supabase.from('garden_snapshots').insert({
      id: snapshotId,
      project_id: projectId,
      trigger_type: triggerType,
      is_current: true,
      created_at: new Date().toISOString(),
    });

    // 3. Insert flowers + petals
    for (const flower of flowers) {
      await supabase.from('flowers').insert({
        id: flower.id,
        snapshot_id: snapshotId,
        project_id: projectId,
        flower_label: flower.flower_label,
        entity_name: flower.entity_name,
        position_x: flower.position_x,
        position_y: flower.position_y,
        color_theme: flower.color_theme,
        ring: flower.ring ?? 0,
        created_at: flower.created_at,
      });

      for (const petal of flower.petals ?? []) {
        await supabase.from('petals').insert({
          id: petal.id,
          flower_id: flower.id,
          project_id: projectId,
          petal_label: petal.petal_label,
          sub_entity_name: petal.sub_entity_name,
          description: petal.description ?? '',
          angle: petal.angle ?? 0,
          created_at: petal.created_at,
        });
      }
    }

    // 4. Insert connections
    for (const conn of connections) {
      await supabase.from('connections').insert({
        id: conn.id,
        snapshot_id: snapshotId,
        project_id: projectId,
        source_type: conn.source_type,
        source_id: conn.source_id,
        target_type: conn.target_type,
        target_id: conn.target_id,
        relationship_description: conn.relationship_description,
        is_manual: conn.is_manual ?? false,
        created_at: conn.created_at,
      });
    }

    // 5. Insert reasoning logs
    for (const log of reasoningLogs) {
      await supabase.from('reasoning_logs').insert({
        id: log.id,
        snapshot_id: snapshotId,
        project_id: projectId,
        step_number: log.step_number,
        text_content: log.text_content,
        highlighted_phrases: log.highlighted_phrases,
        created_at: log.created_at,
      });
    }

    // 6. Insert harvest results
    for (const h of harvestResults) {
      await supabase.from('harvest_results').insert({
        id: h.id,
        snapshot_id: snapshotId,
        project_id: projectId,
        tab_type: h.tab_type,
        title: h.title,
        summary: h.summary,
        content: h.content,
        created_at: h.created_at,
      });
    }

    // 7. Insert model params snapshot
    await supabase.from('model_param_snapshots').insert({
      snapshot_id: snapshotId,
      project_id: projectId,
      temperature: modelParams.temperature,
      top_p: modelParams.top_p,
      top_k: modelParams.top_k,
      presence_penalty: modelParams.presence_penalty,
      frequency_penalty: modelParams.frequency_penalty,
      created_at: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[Supabase] persistGenerationToSupabase error:', err);
  }
}

// ── Log an interaction event ──
export async function logInteractionEvent(params: {
  projectId: string;
  snapshotId?: string;
  eventType: string;
  payload: Record<string, any>;
}) {
  if (!supabaseUrl || !supabaseAnonKey) return;
  try {
    await supabase.from('interaction_events').insert({
      project_id: params.projectId,
      snapshot_id: params.snapshotId ?? null,
      event_type: params.eventType,
      payload: params.payload,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Supabase] logInteractionEvent error:', err);
  }
}