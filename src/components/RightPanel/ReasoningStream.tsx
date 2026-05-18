import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { X, Download } from 'lucide-react';

function highlightText(text: string, phrases: string[]) {
  if (!phrases.length) return <span>{text}</span>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: (string | any)[] = [text];
  phrases.forEach((phrase) => {
    result = result.flatMap((part) => {
      if (typeof part !== 'string') return [part];
      const parts = part.split(new RegExp(`(${phrase})`, 'gi'));
      return parts.map((p, i) =>
        p.toLowerCase() === phrase.toLowerCase() ? (
          <span key={i} className="highlight-text">
            {p}
          </span>
        ) : (
          p
        )
      );
    });
  });
  return <>{result}</>;
}

export default function ReasoningStream() {
  const {
    reasoningLogs,
    reasoningModalOpen,
    setReasoningModalOpen,
    generationStatus,
  } = useStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [manualScroll, setManualScroll] = useState(false);

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
      .map((l) => `Step ${l.step_number}: ${l.text_content}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reasoning-log.txt';
    a.click();
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background:
                  generationStatus === 'loading'
                    ? '#00ffff'
                    : 'rgba(255,255,255,0.2)',
                boxShadow:
                  generationStatus === 'loading'
                    ? '0 0 6px #00ffff'
                    : 'none',
                animation:
                  generationStatus === 'loading'
                    ? 'expandPulse 1s ease-in-out infinite'
                    : 'none',
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.78)',
              }}
            >
              Reasoning Stream
            </span>
            {reasoningLogs.length > 0 && (
              <span
                style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.28)',
                  marginLeft: 2,
                }}
              >
                {reasoningLogs.length} steps
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Download */}
            {reasoningLogs.length > 0 && (
              <button
                onClick={exportLog}
                title="Download log"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.65)',
                }}
              >
                <Download size={13} strokeWidth={2.5} />
              </button>
            )}
            {/* Expand / fullscreen */}
            <button
              onClick={() => setReasoningModalOpen(true)}
              title="Expand full screen"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 26,
                height: 26,
                borderRadius: 7,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.65)',
              }}
            >
              {/* Bold expand arrows icon */}
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <polyline
                  points="1,5 1,1 5,1"
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="8,1 12,1 12,5"
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="1,8 1,12 5,12"
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="8,12 12,12 12,8"
                  stroke="rgba(255,255,255,0.75)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {generationStatus === 'loading' && (
          <div
            style={{
              height: 2,
              margin: '6px 14px 0',
              borderRadius: 2,
              background: 'rgba(255,255,255,0.05)',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 2,
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #00ffff, #00bcd4)',
                transition: 'width 0.5s',
              }}
            />
          </div>
        )}

        {/* ── Stream content ── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 14px',
            minHeight: 0,
          }}
        >
          {reasoningLogs.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                🌱
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.25)',
                  textAlign: 'center',
                  lineHeight: 1.5,
                }}
              >
                Start a growth process to see
                <br />
                the model's reasoning stream
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reasoningLogs.map((log, i) => (
                <div
                  key={log.id}
                  className="reasoning-line"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span
                      style={{
                        flexShrink: 0,
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: 'rgba(0,220,255,0.1)',
                        color: 'rgba(0,220,255,0.75)',
                        fontSize: 9,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 1,
                      }}
                    >
                      {log.step_number}
                    </span>
                    <p
                      style={{
                        fontSize: 10.5,
                        lineHeight: 1.55,
                        color:
                          log.step_number === reasoningLogs.length
                            ? 'rgba(255,255,255,0.78)'
                            : 'rgba(255,255,255,0.5)',
                        fontFamily: 'JetBrains Mono, monospace',
                        flex: 1,
                        margin: 0,
                      }}
                    >
                      {highlightText(log.text_content, log.highlighted_phrases)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {generationStatus === 'loading' && (
            <div
              className="reasoning-line"
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}
            >
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#00ffff',
                      animation: `expandPulse 1s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: 'rgba(0,220,255,0.55)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                Processing...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Full-screen modal ── */}
      {reasoningModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setReasoningModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              margin: '0 16px',
              borderRadius: 18,
              overflow: 'hidden',
              background: 'rgba(9,13,24,0.99)',
              border: '1px solid rgba(0,220,255,0.2)',
              maxHeight: '80vh',
              boxShadow: '0 0 60px rgba(0,220,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.9)',
                  margin: 0,
                }}
              >
                Full Reasoning Trace
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 11,
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  {reasoningLogs.length} steps
                </span>
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={exportLog}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'rgba(0,220,255,0.75)',
                    background: 'transparent',
                    border: '1px solid rgba(0,220,255,0.22)',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={12} strokeWidth={2.5} />
                  Download
                </button>
                <button
                  onClick={() => setReasoningModalOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div
              style={{
                overflowY: 'auto',
                padding: '20px 24px',
                flex: 1,
                minHeight: 0,
              }}
            >
              {reasoningLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: 'rgba(0,220,255,0.1)',
                        color: '#00dcff',
                        border: '1px solid rgba(0,220,255,0.22)',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {log.step_number}
                    </span>
                    <div
                      style={{
                        width: 1,
                        flex: 1,
                        minHeight: 12,
                        background: 'rgba(255,255,255,0.05)',
                      }}
                    />
                  </div>
                  <div style={{ paddingBottom: 8 }}>
                    <p
                      style={{
                        fontSize: 12,
                        lineHeight: 1.6,
                        color: 'rgba(255,255,255,0.78)',
                        fontFamily: 'JetBrains Mono, monospace',
                        margin: 0,
                      }}
                    >
                      {highlightText(log.text_content, log.highlighted_phrases)}
                    </p>
                    <p
                      style={{
                        fontSize: 9,
                        color: 'rgba(255,255,255,0.25)',
                        marginTop: 4,
                      }}
                    >
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