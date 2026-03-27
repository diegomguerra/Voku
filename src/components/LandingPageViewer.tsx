'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface LandingViewerProps {
  orderId: string;
  choiceId?: string;
  structuredData: any;
  userId: string;
  initialHtml?: string;
}

type Tab = 'preview' | 'code';
type State = 'idle' | 'loading' | 'ready' | 'error';

export default function LandingPageViewer({
  orderId,
  choiceId,
  structuredData,
  userId,
  initialHtml,
}: LandingViewerProps) {
  const [tab, setTab]     = useState<Tab>('preview');
  const [state, setState] = useState<State>(initialHtml ? 'ready' : 'idle');
  const [html, setHtml]   = useState(initialHtml || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Gerando copy e estrutura...');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const msgs = [
    'Gerando copy e estrutura...',
    'Montando seções da landing page...',
    'Aplicando estilo e cores da marca...',
    'Finalizando o HTML...',
  ];

  useEffect(() => {
    if (state !== 'loading') return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % msgs.length;
      setLoadingMsg(msgs[i]);
    }, 3500);
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (state === 'ready' && html && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) { doc.open(); doc.write(html); doc.close(); }
    }
  }, [state, html]);

  async function gerar() {
    setState('loading');
    setLoadingMsg(msgs[0]);
    setError('');

    try {
      const res = await fetch('/api/generate-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          choice_id: choiceId,
          user_id: userId,
          structured_data: structuredData,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.html) throw new Error(data.error || 'Falha ao gerar');

      setHtml(data.html);
      setState('ready');
    } catch (e: any) {
      setError(e.message);
      setState('error');
    }
  }

  function copyHTML() {
    if (!html) return;
    navigator.clipboard.writeText(html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadHTML() {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'landing-page.html';
    a.click();
  }

  function openNewTab() {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  }

  const nome = structuredData?.brand_context?.nome_marca
    || structuredData?.nome_marca
    || 'Landing Page';

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff' }}>

      {/* TOOLBAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 8 }}>

        {/* dots + url */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 16px', fontSize: 12, color: '#64748b', minWidth: 200, textAlign: 'center' }}>
            {state === 'ready' ? `${nome.toLowerCase().replace(/\s+/g, '')} · voku.one/preview` : 'voku.one · landing page builder'}
          </div>
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['preview', 'code'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid', fontSize: 13, cursor: 'pointer', fontWeight: tab === t ? 600 : 400, background: tab === t ? '#fff' : 'transparent', borderColor: tab === t ? '#cbd5e1' : '#e2e8f0', color: tab === t ? '#0f172a' : '#64748b', transition: 'all 0.15s' }}
            >
              {t === 'preview' ? 'Preview' : 'Código'}
            </button>
          ))}
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <ActionBtn onClick={openNewTab} disabled={!html} icon="↗">Abrir</ActionBtn>
          <ActionBtn onClick={copyHTML} disabled={!html} icon="⧉">{copied ? 'Copiado!' : 'Copiar HTML'}</ActionBtn>
          <ActionBtn onClick={downloadHTML} disabled={!html} icon="↓">Baixar</ActionBtn>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ minHeight: 520 }}>

        {/* IDLE */}
        {state === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 520, gap: 16, padding: 32 }}>
            <div style={{ fontSize: 48 }}>🚀</div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: 18, color: '#0f172a', marginBottom: 8 }}>
                Gerar landing page com IA
              </p>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
                Claude Sonnet vai criar o copy + HTML completo baseado no seu briefing
              </p>
            </div>
            <button
              onClick={gerar}
              style={{ background: '#CCEE33', color: '#1a1a1a', border: 'none', padding: '14px 36px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(204,238,51,0.3)', transition: 'transform 0.15s' }}
            >
              Gerar landing page →
            </button>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Claude Sonnet · ~20 segundos</p>
          </div>
        )}

        {/* LOADING */}
        {state === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 520, gap: 20 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#CCEE33', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 14, color: '#64748b' }}>{loadingMsg}</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* ERROR */}
        {state === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 520, gap: 16 }}>
            <div style={{ fontSize: 40 }}>⚠️</div>
            <p style={{ color: '#ef4444', fontSize: 14, textAlign: 'center', maxWidth: 360 }}>{error}</p>
            <button onClick={gerar} style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 14, cursor: 'pointer', color: '#0f172a' }}>
              Tentar novamente
            </button>
          </div>
        )}

        {/* READY — PREVIEW */}
        {state === 'ready' && tab === 'preview' && (
          <iframe
            ref={iframeRef}
            title="Preview da Landing Page"
            sandbox="allow-scripts allow-same-origin allow-forms"
            style={{ width: '100%', height: 560, border: 'none', display: 'block' }}
          />
        )}

        {/* READY — CODE */}
        {state === 'ready' && tab === 'code' && (
          <div style={{ height: 560, overflow: 'auto', background: '#0f172a', borderRadius: '0 0 12px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>landing-page.html</span>
              <button onClick={copyHTML} style={{ fontSize: 12, color: '#CCEE33', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                {copied ? 'Copiado ✓' : 'Copiar'}
              </button>
            </div>
            <pre style={{ padding: '20px', fontFamily: "'Fira Code', 'Courier New', monospace", fontSize: 12, lineHeight: 1.65, color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
              {html}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, disabled, icon, children }: { onClick: () => void; disabled?: boolean; icon: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'transparent', fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? '#cbd5e1' : '#64748b', transition: 'all 0.15s' }}
    >
      <span>{icon}</span>
      {children}
    </button>
  );
}
