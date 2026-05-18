import { useState, useRef } from 'react';
import { useStore, Upload } from '../store/useStore';
import {
  Upload as UploadIcon, X, Play, Plus,
  Clock, Leaf, AlertCircle, MessageSquare,
} from 'lucide-react';

const DOMAIN_TAGS = [
  'Biological Patterns',
  'Visual Systems',
  'Urban Dynamics',
  'Neural Networks',
  'Fluid Mechanics',
  'Emergence Theory',
];

function UploadSlot({
  upload,
  onUpload,
  onRemove,
  accent,
  large = false,
}: {
  upload: Upload | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  accent: string;
  large?: boolean;
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

  if (upload) {
    return (
      <div
        className="relative rounded-xl overflow-hidden group"
        style={{
          border: `1px solid ${accent}40`,
          background: `${accent}08`,
          height: large ? 120 : 90,
        }}
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
            {upload.description || 'Processing...'}
          </p>
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
        border: `1.5px dashed ${dragging ? accent : 'rgba(255,255,255,0.12)'}`,
        background: dragging ? `${accent}10` : 'rgba(255,255,255,0.02)',
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
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Drop video or images of the core challenge
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
              PNG, JPG, MP4 supported
            </p>
          </div>
        </>
      ) : (
        <>
          <Plus size={16} style={{ color: accent }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Add Inspiration</span>
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
  } = useStore();

  const [uploadingSlots, setUploadingSlots] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    return {
      id: `upload-${Date.now()}`,
      project_id: `proj-demo`,
      file_url: url,
      file_type: isVideo ? 'video' : 'image',
      thumbnail_url: url,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      created_at: new Date().toISOString(),
      slot,
    };
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        flexShrink: 0,
        width: leftPanelOpen ? 280 : 24,
        minWidth: leftPanelOpen ? 280 : 24,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* ── Collapsed toggle: big bold chevron ── */}
      {!leftPanelOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(11,15,28,0.98)',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setLeftPanelOpen(true)}
            title="Open Input Matrices"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 56,
              background: 'rgba(0,220,255,0.08)',
              border: '1px solid rgba(0,220,255,0.22)',
              borderLeft: 'none',
              borderRadius: '0 8px 8px 0',
              cursor: 'pointer',
            }}
          >
            {/* Bold right chevron */}
            <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
              <polyline
                points="4,3 11,10 4,17"
                stroke="#00dcff"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* ── Panel body ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: 280,
          background: 'rgba(11,15,28,0.98)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          opacity: leftPanelOpen ? 1 : 0,
          pointerEvents: leftPanelOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s',
          overflow: 'hidden',
        }}
      >
        {/* Panel header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Leaf size={14} style={{ color: '#39ff14' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              Input Matrices
            </span>
          </div>
          {/* Collapse button — bold left chevron */}
          <button
            onClick={() => setLeftPanelOpen(false)}
            title="Collapse"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polyline
                points="10,2 4,7 10,12"
                stroke="rgba(255,255,255,0.75)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">

          {/* ── Problem Description ── */}
          <div
            className="rounded-xl p-3"
            style={{
              background: 'rgba(0,220,255,0.04)',
              border: `1px solid ${problemDescription.trim().length === 0 ? 'rgba(0,220,255,0.35)' : 'rgba(0,220,255,0.18)'}`,
              boxShadow: problemDescription.trim().length === 0 ? '0 0 0 1px rgba(0,220,255,0.12)' : 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(180deg, #00dcff, #0099bb)' }} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Problem Description
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(0,220,255,0.15)', color: '#00dcff', fontSize: 9, letterSpacing: '0.04em' }}>
                    REQUIRED
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Describe your core challenge</div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-2.5 left-3 pointer-events-none" style={{ color: 'rgba(0,220,255,0.4)' }}>
                <MessageSquare size={13} />
              </div>
              <textarea
                ref={textareaRef}
                value={problemDescription}
                onChange={(e) => { if (e.target.value.length <= charLimit) setProblemDescription(e.target.value); }}
                placeholder="e.g. How can we reduce urban traffic congestion using biomimetic flow patterns?"
                rows={4}
                className="w-full resize-none rounded-lg text-xs leading-relaxed outline-none transition-all duration-200"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${problemDescription.trim().length === 0 ? 'rgba(0,220,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: 'rgba(255,255,255,0.85)',
                  padding: '10px 10px 10px 28px',
                  fontFamily: 'inherit',
                  caretColor: '#00dcff',
                  scrollbarWidth: 'thin',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(0,220,255,0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,220,255,0.08)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = problemDescription.trim().length === 0
                    ? '1px solid rgba(0,220,255,0.3)'
                    : '1px solid rgba(255,255,255,0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <div className="flex items-center justify-between mt-1.5 px-0.5">
                {problemDescription.trim().length === 0 ? (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'rgba(0,220,255,0.6)', fontSize: 10 }}>
                    <AlertCircle size={10} /> Required to start growth
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: 'rgba(57,255,20,0.6)', fontSize: 10 }}>✓ Ready</span>
                )}
                <span className="text-xs" style={{ color: remaining < 50 ? 'rgba(255,160,50,0.7)' : 'rgba(255,255,255,0.2)', fontSize: 10 }}>
                  {remaining}/{charLimit}
                </span>
              </div>
            </div>
          </div>

          {/* ── Problem Matrix ── */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,100,50,0.04)', border: '1px solid rgba(255,100,50,0.15)' }}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-1.5 h-8 rounded-full" style={{ background: 'linear-gradient(180deg, #ff6b35, #ff3d00)' }} />
              <div>
                <div className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Problem Matrix</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Core challenge visual</div>
              </div>
            </div>
            {uploadingSlots.has('problem') ? (
              <div className="h-28 rounded-xl loading-shimmer" />
            ) : (
              <UploadSlot upload={problemUpload} onUpload={handleProblemUpload} onRemove={() => setProblemUpload(null)} accent="#ff6b35" large />
            )}
            {problemUpload && (
              <div className="mt-2 flex items-start gap-1.5">
                <AlertCircle size={11} style={{ color: '#ff6b35', marginTop: 1, flexShrink: 0 }} />
                <p className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.55)' }}>{problemUpload.description}</p>
              </div>
            )}
          </div>

          {/* ── Inspiration Matrices ── */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(0,255,255,0.03)', border: '1px solid rgba(0,255,255,0.12)' }}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-1.5 h-8 rounded-full" style={{ background: 'linear-gradient(180deg, #00ffff, #00bcd4)' }} />
              <div>
                <div className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Inspiration Matrices</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Cross-domain sources</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((slot) => (
                <div key={slot}>
                  {uploadingSlots.has(`insp-${slot}`) ? (
                    <div className="h-[90px] rounded-xl loading-shimmer" />
                  ) : (
                    <div className="space-y-1">
                      <UploadSlot
                        upload={inspirationUploads[slot]}
                        onUpload={(file) => handleInspirationUpload(slot, file)}
                        onRemove={() => setInspirationUpload(slot, null)}
                        accent="#00ffff"
                      />
                      {inspirationUploads[slot] && (
                        <div className="text-center px-1 py-0.5 rounded text-xs truncate"
                          style={{ background: 'rgba(0,255,255,0.08)', color: 'rgba(0,255,255,0.7)', fontSize: 10 }}>
                          {DOMAIN_TAGS[slot % DOMAIN_TAGS.length]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Recent Gardens ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={12} style={{ color: 'rgba(255,255,255,0.35)' }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Recent Gardens</span>
            </div>
            {['Traffic Flow Analysis', 'Biomimetic Architecture', 'Neural Commerce'].map((name, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg mb-1 cursor-pointer transition-colors hover:bg-white/3"
                style={{ border: '1px solid transparent' }}>
                <div className="w-8 h-8 rounded-lg flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${['rgba(0,255,255,0.2)', 'rgba(57,255,20,0.2)', 'rgba(255,16,240,0.2)'][i]}, rgba(0,0,0,0.3))`,
                    border: `1px solid ${['rgba(0,255,255,0.3)', 'rgba(57,255,20,0.3)', 'rgba(255,16,240,0.3)'][i]}`,
                  }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{name}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                    {['2h ago', 'Yesterday', '3 days ago'][i]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}