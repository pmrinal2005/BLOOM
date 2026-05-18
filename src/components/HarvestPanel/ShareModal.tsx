import { HarvestResult } from '../../store/useStore';
import { X, Copy, Download, Link } from 'lucide-react';
import { useState } from 'react';

export default function ShareModal({ result, onClose }: { result: HarvestResult; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    const text = `${result.title}\n\n${result.summary}\n\n${(result.content?.paragraphs || []).join('\n\n')}\n\nKey Points:\n${(result.content?.key_points || []).map((p: string) => `• ${p}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = () => {
    const text = `ExpertBloom Insight\n${'─'.repeat(40)}\n\n${result.title}\n\n${result.summary}\n\n${(result.content?.paragraphs || []).join('\n\n')}\n\nKey Points:\n${(result.content?.key_points || []).map((p: string) => `• ${p}`).join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title.replace(/\s+/g, '-')}.txt`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(9,13,24,0.99)',
          border: '1px solid rgba(0,220,255,0.2)',
          boxShadow: '0 0 60px rgba(0,220,255,0.08)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>Share Result</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>Sharing: {result.title}</p>

          {[
            {
              icon: <Copy size={16} />,
              label: copied ? '✓ Copied!' : 'Copy as text',
              action: copyText,
              accent: copied ? '#39ff14' : '#00ffff',
            },
            {
              icon: <Download size={16} />,
              label: 'Download as TXT',
              action: downloadPDF,
              accent: '#ff10f0',
            },
            {
              icon: <Link size={16} />,
              label: 'Copy share link',
              action: () => navigator.clipboard.writeText(window.location.href),
              accent: '#ffa500',
            },
          ].map((opt, i) => (
            <button
              key={i}
              onClick={opt.action}
              className="w-full flex items-center gap-4 p-3.5 rounded-xl transition-all hover:scale-[1.01]"
              style={{
                background: `${opt.accent}08`,
                border: `1px solid ${opt.accent}20`,
                color: opt.accent,
              }}
            >
              {opt.icon}
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
