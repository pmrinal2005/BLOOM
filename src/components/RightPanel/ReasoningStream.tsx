import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { X, Download } from 'lucide-react';

// ────────────────────────────────────────────────────────────────────────────
// Task 3: Multi-strategy sanitizer — prevents ALL repeated-text loops
// ────────────────────────────────────────────────────────────────────────────
function sanitizeReasoningText(text: string): string {
  if (!text || text.length < 10) return text;

  // Hard cap at 600 chars first to prevent runaway renders
  let t = text.length > 600 ? text.substring(0, 600).trim() + '…' : text;

  // Strategy 1: Detect repeated word n-grams (n=2..8)
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 4) {
    for (let n = 2; n <= 8; n++) {
      const seen = new Map<string, number>();
      for (let i = 0; i <= words.length - n; i++) {
        const gram = words.slice(i, i + n).join(' ').toLowerCase();
        const prev = seen.get(gram);
        if (prev !== undefined && i > prev + n) {
          // Repetition found — truncate at first repeat start
          const truncated = words.slice(0, i).join(' ').trimEnd();
          if (truncated.length >= 8) {
            t = truncated;
            break;
          }
        } else if (prev === undefined) {
          seen.set(gram, i);
        }
      }
      // Re-split after truncation
      const newWords = t.split(/\s+/).filter(Boolean);
      if (newWords.length < words.length) break;
    }
  }

  // Strategy 2: Character-level substring repetition
  // If any substring of length 6-80 repeats 3+ times, truncate
  const half = Math.min(Math.floor(t.length / 2), 120);
  for (let len = 6; len <= half; len++) {
    const pattern = t.substring(0, len);
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      const re = new RegExp(escaped, 'g');
      const matches = t.match(re);
      if (matches && matches.length >= 3) {
        const secondIdx = t.indexOf(pattern, len);
        if (secondIdx > 0) {
          t = t.substring(0, secondIdx).trimEnd();
          break;
        }
      }
    } catch { /* skip */ }
  }

  // Strategy 3: Detect rapid word/token repetition at end of string
  // e.g. "Cross-pollinate Cross-pollinate Cross-pollinate ..."
  const wordArr = t.split(/\s+/).filter(Boolean);
  if (wordArr.length >= 6) {
    // Check last N words for duplicates
    for (let winSize = 1; winSize <= 4; winSize++) {
      const tail = wordArr.slice(-winSize * 4);
      // If last 4 windows are all the same token sequence
      if (tail.length >= winSize * 4) {
        const win0 = tail.slice(0, winSize).join(' ').toLowerCase();
        const win1 = tail.slice(winSize, winSize * 2).join(' ').toLowerCase();
        const win2 = tail.slice(winSize * 2, winSize * 3).join(' ').toLowerCase();
        const win3 = tail.slice(winSize * 3, winSize * 4).join(' ').toLowerCase();
        if (win0 === win1 && win1 === win2 && win2 === win3) {
          // Repeated suffix — truncate to first occurrence
          const firstRepeatIdx = wordArr.length - winSize * 4 + winSize;
          t = wordArr.slice(0, firstRepeatIdx).join(' ').trimEnd();
          break;
        }
      }
    }
  }

  // Final hard cap
  if (t.length > 500) t = t.substring(0, 500).trimEnd() + '…';

  return t;
}

function highlightText(rawText: string, phrases: string[]) {
  const text = sanitizeReasoningText(rawText);
  if (!phrases || !phrases.length) return <span>{text}</span>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: (string | any)[] = [text];
  phrases.forEach((phrase) => {
    if (!phrase) return;
    result = result.flatMap((part) => {
      if (typeof part !== 'string') return [part];
      try {
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = part.split(new RegExp(`(${escaped})`, 'gi'));
        return parts.map((p, i) =>
          p.toLowerCase() === phrase.toLowerCase()
            ? <span key={i} className="highlight-text">{p}</span>
            : p
        );
      } catch { return [part]; }
    });
  });
  return <>{result}</>;
}

function ProcessingPlaceholder({ isDark }: { isDark: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      flex: 1, gap: 18, padding: '20px 16px', minHeight: 140,
    }}>
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(0,255,255,0.15)', animation: 'orbRing 3s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '2px dashed rgba(0,255,255,0.3)', animation: 'orbRingReverse 2s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,220,255,0.6), rgba(0,150,200,0.3))', boxShadow: '0 0 16px rgba(0,220,255,0.5)', animation: 'expandPulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: isDark ? 'rgba(0,220,255,0.85)' : '#006688', margin: '0 0 4px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
          Processing...
        </p>
        <p style={{ fontSize: 9.5, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.45)', margin: 0, lineHeight: 1.5 }}>
          Model is reasoning through your problem
        </p>
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            width: 3, height: 18, borderRadius: 2,
            background: isDark ? `rgba(0,220,255,${0.2 + i * 0.14})` : `rgba(0,136,170,${0.2 + i * 0.14})`,
            animation: `processingBar 0.9s ease-in-out ${i * 0.1}s infinite alternate`,
          }} />
        ))}
      </div>
    </div>
  );
}

export default function ReasoningStream() {
  const { reasoningLogs, reasoningModalOpen, setReasoningModalOpen, generationStatus, theme } = useStore();
  const isDark = theme === 'dark';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [manualScroll, setManualScroll] = useState(false);

  // Theme-aware colors
  const headerBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const titleColor = isDark ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.78)';
  const stepCountColor = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.38)';
  const dotActive = isDark ? '#00ffff' : '#0088aa';
  const dotInactive = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const btnBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const btnColor = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';
  const emptyIconBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
  const emptyIconBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const emptyTextColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.38)';
  const stepBadgeBg = isDark ? 'rgba(0,220,255,0.1)' : 'rgba(0,136,170,0.1)';
  const stepBadgeColor = isDark ? 'rgba(0,220,255,0.75)' : '#006688';
  const stepBadgeBorder = isDark ? 'rgba(0,220,255,0.22)' : 'rgba(0,136,170,0.3)';
  const stepTextActive = isDark ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.82)';
  const stepTextInactive = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)';
  const progressBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const progressFill = isDark
    ? 'linear-gradient(90deg, #00ffff, #00bcd4)'
    : 'linear-gradient(90deg, #0088aa, #006688)';
  const processingDotColor = isDark ? '#00ffff' : '#0088aa';
  const processingTextColor = isDark ? 'rgba(0,220,255,0.55)' : '#006688';
  const modalBg = isDark ? 'rgba(9,13,24,0.99)' : 'rgba(255,255,255,0.99)';
  const modalBorder = isDark ? 'rgba(0,220,255,0.2)' : 'rgba(0,136,170,0.25)';
  const modalTitleColor = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
  const modalSubColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.42)';
  const modalDlBtnColor = isDark ? 'rgba(0,220,255,0.75)' : '#006688';
  const modalDlBtnBorder = isDark ? 'rgba(0,220,255,0.22)' : 'rgba(0,136,170,0.3)';
  const modalCloseBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const modalCloseBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const modalCloseColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
  const modalLineColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const modalStepLine = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const modalTimestampColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.32)';
  const modalTextColor = isDark ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.78)';

  useEffect(() => {
    if (!manualScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (reasoningLogs.length > 0) {
      setProgress(Math.min(100, (reasoningLogs.length / 8) * 100));
    }
  }, [reasoningLogs, manualScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setManualScroll(scrollTop + clientHeight < scrollHeight - 10);
  };

  const exportLog = () => {
    const text = reasoningLogs
      .map(l => `Step ${l.step_number}: ${sanitizeReasoningText(l.text_content)}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'reasoning-log.txt'; a.click();
  };

  const isLoading = generationStatus === 'loading';
  const hasLogs = reasoningLogs.length > 0;
  const showProcessing = isLoading && !hasLogs;

  return (
    <>
      <style>{`
        @keyframes processingBar {
          from { transform: scaleY(0.4); opacity: 0.4; }
          to { transform: scaleY(1.2); opacity: 1; }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px',
          borderBottom: `1px solid ${headerBorder}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isLoading ? dotActive : dotInactive,
              boxShadow: isLoading ? `0 0 6px ${dotActive}` : 'none',
              animation: isLoading ? 'expandPulse 1s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: titleColor }}>Reasoning Stream</span>
            {hasLogs && (
              <span style={{ fontSize: 9, color: stepCountColor, marginLeft: 2 }}>
                {reasoningLogs.length} steps
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {hasLogs && (
              <button onClick={exportLog} title="Download log" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, background: btnBg, border: `1px solid ${btnBorder}`, cursor: 'pointer', color: btnColor }}>
                <Download size={13} strokeWidth={2.5} />
              </button>
            )}
            <button onClick={() => setReasoningModalOpen(true)} title="Expand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, background: btnBg, border: `1px solid ${btnBorder}`, cursor: 'pointer', color: btnColor }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <polyline points="1,5 1,1 5,1" stroke={btnColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="8,1 12,1 12,5" stroke={btnColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="1,8 1,12 5,12" stroke={btnColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="8,12 12,12 12,8" stroke={btnColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {isLoading && hasLogs && (
          <div style={{ height: 2, margin: '6px 14px 0', borderRadius: 2, background: progressBg, flexShrink: 0, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${progress}%`, background: progressFill, transition: 'width 0.5s' }} />
          </div>
        )}

        {/* Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            flex: 1, overflowY: 'auto',
            padding: showProcessing ? 0 : '8px 14px',
            minHeight: 0, display: 'flex', flexDirection: 'column',
          }}
        >
          {showProcessing ? (
            <ProcessingPlaceholder isDark={isDark} />
          ) : !hasLogs ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: emptyIconBg, border: `1px solid ${emptyIconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌱</div>
              <p style={{ fontSize: 11, color: emptyTextColor, textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
                Start a growth process to see<br />the model's reasoning stream
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reasoningLogs.map((log, i) => (
                <div key={log.id} className="reasoning-line" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{
                      flexShrink: 0, width: 20, height: 20, borderRadius: 6,
                      background: stepBadgeBg, color: stepBadgeColor,
                      border: `1px solid ${stepBadgeBorder}`,
                      fontSize: 9, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 1,
                    }}>
                      {log.step_number}
                    </span>
                    {/* Task 3: overflow + wordBreak ensure no horizontal runaway */}
                    <p style={{
                      fontSize: 10.5, lineHeight: 1.55,
                      color: log.step_number === reasoningLogs.length ? stepTextActive : stepTextInactive,
                      fontFamily: 'JetBrains Mono, monospace',
                      flex: 1, margin: 0,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      maxWidth: '100%',
                      overflow: 'hidden',
                    }}>
                      {highlightText(log.text_content, log.highlighted_phrases)}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: processingDotColor, animation: `expandPulse 1s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 10, color: processingTextColor, fontFamily: 'JetBrains Mono, monospace' }}>Processing...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-screen modal */}
      {reasoningModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
          onClick={() => setReasoningModalOpen(false)}
        >
          <div
            style={{ width: '100%', maxWidth: 720, margin: '0 16px', borderRadius: 18, overflow: 'hidden', background: modalBg, border: `1px solid ${modalBorder}`, maxHeight: '80vh', boxShadow: isDark ? '0 0 60px rgba(0,220,255,0.1)' : '0 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${modalLineColor}`, flexShrink: 0 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: modalTitleColor, margin: 0 }}>
                Full Reasoning Trace
                <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 400, color: modalSubColor }}>{reasoningLogs.length} steps</span>
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={exportLog} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: modalDlBtnColor, background: 'transparent', border: `1px solid ${modalDlBtnBorder}`, cursor: 'pointer' }}>
                  <Download size={12} strokeWidth={2.5} /> Download
                </button>
                <button onClick={() => setReasoningModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: modalCloseBg, border: `1px solid ${modalCloseBorder}`, cursor: 'pointer', color: modalCloseColor }}>
                  <X size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1, minHeight: 0 }}>
              {reasoningLogs.map(log => (
                <div key={log.id} style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: stepBadgeBg, color: stepBadgeColor, border: `1px solid ${stepBadgeBorder}`, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {log.step_number}
                    </span>
                    <div style={{ width: 1, flex: 1, minHeight: 12, background: modalStepLine }} />
                  </div>
                  <div style={{ paddingBottom: 8, flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12, lineHeight: 1.6, color: modalTextColor,
                      fontFamily: 'JetBrains Mono, monospace', margin: 0,
                      wordBreak: 'break-word', overflowWrap: 'break-word',
                      overflow: 'hidden',
                    }}>
                      {highlightText(log.text_content, log.highlighted_phrases)}
                    </p>
                    <p style={{ fontSize: 9, color: modalTimestampColor, marginTop: 4 }}>
                      {new Date(log.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}