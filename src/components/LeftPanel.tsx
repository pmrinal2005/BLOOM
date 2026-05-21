// C:\Users\mrutu\OneDrive\Desktop\bloom\src\components\LeftPanel.tsx
import { useState, useRef } from 'react';
import { useStore, Upload } from '../store/useStore';
import {
  Upload as UploadIcon, X, Play, Plus,
  Clock, Leaf, AlertCircle, MessageSquare, Image,
} from 'lucide-react';
import { persistUploadToSupabase } from '../lib/supabase';

const DOMAIN_TAGS = [
  'Biological Patterns',
  'Visual Systems',
  'Urban Dynamics',
  'Neural Networks',
  'Fluid Mechanics',
  'Emergence Theory',
];

// ── Image processing status indicator ──
function ImageProcessingBadge({ isDark }: { isDark: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 6,
      background: 'rgba(0,220,255,0.1)',
      border: '1px solid rgba(0,220,255,0.25)',
      fontSize: 9, fontWeight: 600,
      color: isDark ? 'rgba(0,220,255,0.85)' : '#005577',
    }}>
      <Image size={9} />
      Will be analyzed by AI
    </div>
  );
}

function UploadSlot({
  upload,
  onUpload,
  onRemove,
  accent,
  large = false,
  isDark = true,
}: {
  upload: Upload | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  accent: string;
  large?: boolean;
  isDark?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      onUpload(file);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  const emptyBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)';
  const emptyBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)';
  const emptyText = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const emptySubtext = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)';

  if (upload) {
    return (
      <div
        className="relative rounded-xl overflow-hidden group"
        style={{ border: `1px solid ${accent}40`, background: `${accent}08`, height: large ? 120 : 90 }}
      >
        {upload.file_type === 'video' ? (
          <div className="w-full h-full flex items-center justify-center bg-black/40">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Play size={18} style={{ color: accent }} />
            </div>
          </div>
        ) : (
          <img src={upload.thumbnail_url || upload.file_url} alt="Upload" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {upload.description || 'Ready for AI analysis'}
          </p>
        </div>
        {/* AI analysis badge — always visible on uploaded images */}
        <div style={{ position: 'absolute', top: 4, left: 4, display: 'flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 5, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(0,220,255,0.4)', fontSize: 8, fontWeight: 700, color: '#00dcff' }}>
          <Image size={8} /> AI Vision
        </div>
        <button
          onClick={onRemove}
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.7)', color: '#ff6b6b' }}
        >
          <X size={10} />
        </button>
        {!large && (
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.8)', fontSize: 10 }}
          >
            Replace
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200"
      style={{
        border: `1.5px dashed ${dragging ? accent : emptyBorder}`,
        background: dragging ? `${accent}10` : emptyBg,
        height: large ? 120 : 90,
      }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      {large ? (
        <>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
            <UploadIcon size={18} style={{ color: accent }} />
          </div>
          <div className="text-center px-3">
            <p className="text-xs font-medium" style={{ color: emptyText }}>
              Drop video or images of the core challenge
            </p>
            <p className="text-xs mt-0.5" style={{ color: emptySubtext }}>
              PNG, JPG, MP4 — analyzed by AI vision
            </p>
          </div>
        </>
      ) : (
        <>
          <Plus size={16} style={{ color: accent }} />
          <span className="text-xs" style={{ color: emptyText }}>Add Inspiration</span>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

export default function LeftPanel() {
  const {
    leftPanelOpen, setLeftPanelOpen,
    problemUpload, setProblemUpload,
    inspirationUploads, setInspirationUpload,
    problemDescription, setProblemDescription,
    projectId, theme,
  } = useStore();

  const isDark = theme === 'dark';
  const [uploadingSlots, setUploadingSlots] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Theme-aware colors
  const panelBg = isDark ? 'rgba(11,15,28,0.98)' : 'rgba(248,250,255,0.98)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const headerColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
  const sectionBg = (accent: string) => isDark ? `${accent}04` : `${accent}08`;
  const sectionBorder = (accent: string) => isDark ? `${accent}15` : `${accent}22`;
  const labelColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)';
  const sublabelColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)';
  const recentTextColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
  const recentSubColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)';

  // Create upload object from file
  const createUpload = async (file: File, slot: 'problem' | number): Promise<Upload> => {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    const descriptions = [
      'Urban traffic flow bottleneck at intersection',
      'Biological neural network connectivity patterns',
      'River delta branching distribution systems',
      'Ant colony foraging path optimization',
      'Mycelium network resource distribution',
    ];
    const upload: Upload = {
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      project_id: projectId,
      file_url: url,
      file_type: isVideo ? 'video' : 'image',
      thumbnail_url: url,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      created_at: new Date().toISOString(),
      slot,
    };

    // Persist URL metadata to Supabase (non-blocking, best-effort)
    // Note: blob: URLs are local only; only meaningful if using real hosted URLs
    persistUploadToSupabase({
      id: upload.id,
      projectId: upload.project_id,
      fileUrl: upload.file_url,
      fileType: upload.file_type,
      thumbnailUrl: upload.thumbnail_url,
      description: upload.description,
      slot: typeof slot === 'number' ? `inspiration_${slot}` : slot,
    }).catch(err => console.warn('[LeftPanel] Upload persist failed (non-fatal):', err));

    return upload;
  };

  const handleProblemUpload = async (file: File) => {
    setUploadingSlots(prev => new Set(prev).add('problem'));
    const upload = await createUpload(file, 'problem');
    setProblemUpload(upload);
    setUploadingSlots(prev => { const s = new Set(prev); s.delete('problem'); return s; });
  };

  const handleInspirationUpload = async (slot: number, file: File) => {
    const key = `insp-${slot}`;
    setUploadingSlots(prev => new Set(prev).add(key));
    const upload = await createUpload(file, slot);
    setInspirationUpload(slot, upload);
    setUploadingSlots(prev => { const s = new Set(prev); s.delete(key); return s; });
  };

  const charLimit = 500;
  const remaining = charLimit - problemDescription.length;

  // Count active uploads for info badge
  const activeUploadCount = (problemUpload ? 1 : 0) + inspirationUploads.filter(Boolean).length;

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        position: 'relative', flexShrink: 0,
        width: leftPanelOpen ? 280 : 24,
        minWidth: leftPanelOpen ? 280 : 24,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Collapsed toggle */}
      {!leftPanelOpen && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: panelBg, borderRight: `1px solid ${panelBorder}`, zIndex: 10 }}>
          <button
            onClick={() => setLeftPanelOpen(true)}
            title="Open Input Matrices"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 56, background: 'rgba(0,220,255,0.08)', border: '1px solid rgba(0,220,255,0.22)', borderLeft: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer' }}
          >
            <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
              <polyline points="4,3 11,10 4,17" stroke="#00dcff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Panel body */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: 280, background: panelBg, borderRight: `1px solid ${panelBorder}`, opacity: leftPanelOpen ? 1 : 0, pointerEvents: leftPanelOpen ? 'auto' : 'none', transition: 'opacity 0.2s', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${panelBorder}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Leaf size={14} style={{ color: '#39ff14' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: headerColor }}>Input Matrices</span>
            {/* Show count of images ready for AI analysis */}
            {activeUploadCount > 0 && (
              <span style={{ fontSize: 8.5, fontWeight: 700, color: '#00dcff', background: 'rgba(0,220,255,0.1)', border: '1px solid rgba(0,220,255,0.25)', borderRadius: 5, padding: '1px 6px' }}>
                {activeUploadCount} image{activeUploadCount !== 1 ? 's' : ''} for AI
              </span>
            )}
          </div>
          <button
            onClick={() => setLeftPanelOpen(false)}
            title="Collapse"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polyline points="10,2 4,7 10,12" stroke={isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── Problem Description ── */}
          <div
            style={{
              borderRadius: 12, padding: '12px',
              background: isDark ? 'rgba(0,220,255,0.04)' : 'rgba(0,180,220,0.06)',
              border: `1px solid ${problemDescription.trim().length === 0 ? 'rgba(0,220,255,0.35)' : (isDark ? 'rgba(0,220,255,0.18)' : 'rgba(0,180,220,0.25)')}`,
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 3, height: 32, borderRadius: 2, background: 'linear-gradient(180deg, #00dcff, #0099bb)', flexShrink: 0 }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: labelColor }}>Problem Description</span>
                  <span style={{ fontSize: 8.5, fontWeight: 700, color: '#00dcff', background: 'rgba(0,220,255,0.15)', borderRadius: 20, padding: '1px 7px', letterSpacing: '0.04em' }}>REQUIRED</span>
                </div>
                <div style={{ fontSize: 11, color: sublabelColor }}>Describe your core challenge</div>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 10, left: 10, pointerEvents: 'none', color: 'rgba(0,220,255,0.4)' }}>
                <MessageSquare size={13} />
              </div>
              <textarea
                ref={textareaRef}
                value={problemDescription}
                onChange={e => { if (e.target.value.length <= charLimit) setProblemDescription(e.target.value); }}
                placeholder="e.g. How can we reduce urban traffic congestion using biomimetic flow patterns?"
                rows={4}
                style={{
                  width: '100%', resize: 'none', borderRadius: 8, fontSize: 11.5,
                  lineHeight: 1.55, outline: 'none', boxSizing: 'border-box',
                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
                  border: `1px solid ${problemDescription.trim().length === 0 ? 'rgba(0,220,255,0.3)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)')}`,
                  color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
                  padding: '10px 10px 10px 28px',
                  fontFamily: 'inherit', caretColor: '#00dcff',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => {
                  e.currentTarget.style.border = '1px solid rgba(0,220,255,0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,220,255,0.08)';
                }}
                onBlur={e => {
                  e.currentTarget.style.border = problemDescription.trim().length === 0
                    ? '1px solid rgba(0,220,255,0.3)'
                    : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'}`;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5, paddingLeft: 2, paddingRight: 2 }}>
                {problemDescription.trim().length === 0 ? (
                  <span style={{ fontSize: 9.5, color: 'rgba(0,220,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={10} /> Required to start growth
                  </span>
                ) : (
                  <span style={{ fontSize: 9.5, color: 'rgba(57,255,20,0.6)' }}>✓ Ready</span>
                )}
                <span style={{ fontSize: 9.5, color: remaining < 50 ? 'rgba(255,160,50,0.7)' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)') }}>
                  {remaining}/{charLimit}
                </span>
              </div>
            </div>
          </div>

          {/* ── Problem Matrix ── */}
          <div style={{ borderRadius: 12, padding: '12px', background: isDark ? 'rgba(255,100,50,0.04)' : 'rgba(255,100,50,0.06)', border: isDark ? '1px solid rgba(255,100,50,0.15)' : '1px solid rgba(255,100,50,0.22)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 3, height: 32, borderRadius: 2, background: 'linear-gradient(180deg, #ff6b35, #ff3d00)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: labelColor }}>Problem Matrix</div>
                <div style={{ fontSize: 11, color: sublabelColor }}>Core challenge visual</div>
              </div>
            </div>
            {uploadingSlots.has('problem') ? (
              <div style={{ height: 120, borderRadius: 12 }} className="loading-shimmer" />
            ) : (
              <UploadSlot
                upload={problemUpload}
                onUpload={handleProblemUpload}
                onRemove={() => setProblemUpload(null)}
                accent="#ff6b35"
                large
                isDark={isDark}
              />
            )}
            {problemUpload && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <AlertCircle size={11} style={{ color: '#ff6b35', marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 10.5, lineHeight: 1.4, color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)', margin: 0 }}>{problemUpload.description}</p>
                </div>
                <div style={{ marginTop: 6 }}>
                  <ImageProcessingBadge isDark={isDark} />
                </div>
              </div>
            )}
          </div>

          {/* ── Inspiration Matrices ── */}
          <div style={{ borderRadius: 12, padding: '12px', background: isDark ? 'rgba(0,255,255,0.03)' : 'rgba(0,200,220,0.04)', border: isDark ? '1px solid rgba(0,255,255,0.12)' : '1px solid rgba(0,180,200,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 3, height: 32, borderRadius: 2, background: 'linear-gradient(180deg, #00ffff, #00bcd4)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: labelColor }}>Inspiration Matrices</div>
                <div style={{ fontSize: 11, color: sublabelColor }}>Cross-domain sources</div>
              </div>
              {/* Active inspiration count */}
              {inspirationUploads.filter(Boolean).length > 0 && (
                <span style={{ fontSize: 8.5, fontWeight: 700, color: '#00ffff', background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.25)', borderRadius: 5, padding: '1px 6px', flexShrink: 0 }}>
                  {inspirationUploads.filter(Boolean).length}/4
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[0, 1, 2, 3].map((slot) => (
                <div key={slot}>
                  {uploadingSlots.has(`insp-${slot}`) ? (
                    <div style={{ height: 90, borderRadius: 12 }} className="loading-shimmer" />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <UploadSlot
                        upload={inspirationUploads[slot]}
                        onUpload={(file) => handleInspirationUpload(slot, file)}
                        onRemove={() => setInspirationUpload(slot, null)}
                        accent="#00ffff"
                        isDark={isDark}
                      />
                      {inspirationUploads[slot] && (
                        <div style={{ textAlign: 'center', padding: '2px 4px', borderRadius: 5, background: isDark ? 'rgba(0,255,255,0.08)' : 'rgba(0,180,200,0.1)', color: isDark ? 'rgba(0,255,255,0.7)' : '#005577', fontSize: 9.5 }}>
                          {DOMAIN_TAGS[slot % DOMAIN_TAGS.length]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Info note about AI vision */}
            {inspirationUploads.filter(Boolean).length > 0 && (
              <div style={{ marginTop: 8 }}>
                <ImageProcessingBadge isDark={isDark} />
              </div>
            )}
          </div>

          {/* ── AI Vision Status ── */}
          {activeUploadCount > 0 && (
            <div style={{
              borderRadius: 10, padding: '10px 12px',
              background: isDark ? 'rgba(0,220,255,0.05)' : 'rgba(0,180,220,0.08)',
              border: isDark ? '1px solid rgba(0,220,255,0.18)' : '1px solid rgba(0,180,220,0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00dcff', boxShadow: '0 0 6px #00dcff', flexShrink: 0 }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: isDark ? 'rgba(0,220,255,0.9)' : '#005577' }}>AI Vision Active</span>
              </div>
              <p style={{ fontSize: 9.5, color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)', margin: 0, lineHeight: 1.5 }}>
                {activeUploadCount} image{activeUploadCount !== 1 ? 's' : ''} will be processed by Gemma 4's visual analysis during generation. Images are fetched and analyzed inline — not stored in the database.
              </p>
            </div>
          )}

          {/* ── Recent Gardens ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Clock size={12} style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)' }}>Recent Gardens</span>
            </div>
            {['Traffic Flow Analysis', 'Biomimetic Architecture', 'Neural Commerce'].map((name, i) => (
              <div key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px', borderRadius: 8,
                  marginBottom: 4, cursor: 'pointer', border: '1px solid transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: `linear-gradient(135deg, ${['rgba(0,255,255,0.2)', 'rgba(57,255,20,0.2)', 'rgba(255,16,240,0.2)'][i]}, rgba(0,0,0,0.3))`,
                  border: `1px solid ${['rgba(0,255,255,0.3)', 'rgba(57,255,20,0.3)', 'rgba(255,16,240,0.3)'][i]}`,
                }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11.5, fontWeight: 500, color: recentTextColor, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                  <p style={{ fontSize: 9.5, color: recentSubColor, margin: 0 }}>{['2h ago', 'Yesterday', '3 days ago'][i]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}