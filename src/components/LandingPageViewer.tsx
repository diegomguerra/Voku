'use client';

import { useState, useRef, useEffect } from 'react';
import LandingBriefingForm, { LandingBriefing } from './LandingBriefingForm';

interface LandingViewerProps {
  orderId:     string;
  choiceId?:   string;
  userId:      string;
  initialHtml?: string;
  prefill?:    Partial<LandingBriefing>;
  onApprove?:  (choiceId: string) => void;
}

type Tab   = 'preview' | 'code';
type State = 'form' | 'loading' | 'ready' | 'error';

const T = {
  lime: '#AAFF00', ink: '#111111', bg: '#FFFFFF',
  sand: '#FAF8F3', border: '#E8E5DE', muted: '#888888',
};

const LOADING_MSGS = [
  'Gerando copy e estrutura...',
  'Montando hero, benefícios e depoimentos...',
  'Aplicando identidade visual e cores...',
  'Finalizando HTML responsivo...',
];

export default function LandingPageViewer({
  orderId, choiceId, userId, initialHtml, prefill, onApprove,
}: LandingViewerProps) {
  const [tab, setTab]         = useState<Tab>('preview');
  const [state, setState]     = useState<State>(initialHtml ? 'ready' : 'form');
  const [html, setHtml]       = useState(initialHtml || '');
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [marcaNome, setMarcaNome]   = useState(prefill?.nome_marca || '');
  const [currentChoiceId, setCurrentChoiceId] = useState(choiceId || '');
  const [approving, setApproving] = useState(false);
  const [approved, setApproved]   = useState(false);
  const [lastBriefing, setLastBriefing] = useState<LandingBriefing | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const htmlRef   = useRef(initialHtml || '');

  // Spinner de loading
  useEffect(() => {
    if (state !== 'loading') return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setLoadingMsg(LOADING_MSGS[i]);
    }, 3200);
    return () => clearInterval(id);
  }, [state]);

  // Escreve no iframe quando fica ready (monta o doc)
  useEffect(() => {
    if (state === 'ready' && iframeRef.current && htmlRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) { doc.open(); doc.write(htmlRef.current); doc.close(); }
    }
  }, [state]);

  async function gerar(briefing: LandingBriefing) {
    setState('loading');
    setLoadingMsg(LOADING_MSGS[0]);
    setError('');
    setMarcaNome(briefing.nome_marca);
    setLastBriefing(briefing);

    const structured_data = {
      produto:        briefing.produto,
      publico:        briefing.publico,
      objetivos:      briefing.objetivos,
      resumo:         briefing.resumo,
      tom:            briefing.tom,
      palavras_chave: briefing.palavras_chave,
      site_url:       briefing.site_url,
      estilo:         briefing.estilo,
      brand_context: {
        nome_marca:     briefing.nome_marca,
        cor_primaria:   briefing.cor_primaria,
        cor_secundaria: briefing.cor_secundaria,
        cor_texto:      briefing.cor_texto,
        logo_base64:    briefing.logo_base64,
        logo_url:       briefing.logo_url,
      },
      cta_texto: briefing.cta_texto,
    };

    try {
      const res = await fetch('/api/generate-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          choice_id: currentChoiceId,
          user_id: userId,
          structured_data,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.html) throw new Error(data.error || 'Falha ao gerar');

      htmlRef.current = data.html;
      setHtml(data.html);
      if (data.choice_id) setCurrentChoiceId(data.choice_id);
      setState('ready');
      setTab('preview');
    } catch (e: any) {
      setError(e.message);
      setState('error');
    }
  }

  async function aprovar() {
    if (!currentChoiceId) return;
    setApproving(true);
    try {
      await fetch(`/api/projects/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered', choice_aprovada: currentChoiceId }),
      });
      setApproved(true);
      onApprove?.(currentChoiceId);
    } catch { /* silently fail */ }
    finally { setApproving(false); }
  }

  function copyHTML() {
    const h = htmlRef.current || html;
    if (!h) return;
    navigator.clipboard.writeText(h).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadHTML() {
    const h = htmlRef.current || html;
    if (!h) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([h], { type: 'text/html' }));
    a.download = `landing-${(marcaNome || 'voku').toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
  }

  function openNewTab() {
    const h = htmlRef.current || html;
    if (!h) return;
    const w = window.open('', '_blank');
    if (w) { w.document.write(h); w.document.close(); }
  }

  const isReady = state === 'ready';

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', borderRadius: 16, border: `1px solid ${T.border}`, background: T.bg, overflow: 'hidden' }}>

      {/* ── TOOLBAR ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: T.sand, borderBottom: `1px solid ${T.border}`,
        flexWrap: 'wrap', gap: 8,
      }}>
        {/* dots + url */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#ef4444','#f59e0b','#22c55e'].map(c => (
              <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{
            background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6,
            padding: '4px 16px', fontSize: 12, color: T.muted, minWidth: 180, textAlign: 'center',
          }}>
            {isReady
              ? `${(marcaNome||'voku').toLowerCase().replace(/\s+/g,'')} · voku.one/preview`
              : 'voku.one · landing page builder'}
          </div>
        </div>

        {/* tabs */}
        {isReady && (
          <div style={{ display: 'flex', gap: 4 }}>
            {(['preview', 'code'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '5px 14px', borderRadius: 6, border: '1px solid',
                fontSize: 12, cursor: 'pointer', fontWeight: tab === t ? 700 : 400,
                background: tab === t ? T.bg : 'transparent',
                borderColor: tab === t ? T.ink : T.border,
                color: tab === t ? T.ink : T.muted,
              }}>
                {t === 'preview' ? '👁 Preview' : '< > Código'}
              </button>
            ))}
          </div>
        )}

        {/* actions */}
        {isReady && (
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn onClick={openNewTab}>↗ Abrir</Btn>
            <Btn onClick={copyHTML}>{copied ? '✓ Copiado' : '⧉ Copiar HTML'}</Btn>
            <Btn onClick={downloadHTML}>↓ Baixar</Btn>
          </div>
        )}
      </div>

      {/* ── FORM ──────────────────────────────────────────── */}
      {(state === 'form' || state === 'error') && (
        <div style={{ padding: 24 }}>
          {state === 'error' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
              <span>⚠️</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#991b1b', marginBottom: 2 }}>Erro ao gerar</p>
                <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
              </div>
            </div>
          )}
          <LandingBriefingForm
            onSubmit={gerar}
            loading={false}
            prefill={lastBriefing ?? prefill}
          />
        </div>
      )}

      {/* ── LOADING ───────────────────────────────────────── */}
      {state === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', gap: 20 }}>
          <div style={{ position: 'relative', width: 64, height: 64 }}>
            <div style={{ position: 'absolute', inset: 0, border: '3px solid #e2e8f0', borderTopColor: T.lime, borderRadius: '50%', animation: 'lpspin 0.8s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 8, border: '2px solid #e2e8f0', borderBottomColor: '#22c55e', borderRadius: '50%', animation: 'lpspin 1.2s linear infinite reverse' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.ink, marginBottom: 6 }}>Gerando sua landing page</p>
            <p style={{ fontSize: 13, color: T.muted }}>{loadingMsg}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {LOADING_MSGS.map((m, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: loadingMsg === m ? T.lime : '#e2e8f0', transition: 'background 0.3s' }} />
            ))}
          </div>
          <style>{`@keyframes lpspin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* ── READY: iframe + code ──────────────────────────── */}
      {isReady && (
        <>
          <div style={{ display: tab === 'preview' ? 'block' : 'none' }}>
            <iframe
              ref={iframeRef}
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
              onLoad={() => {
                try {
                  const doc = iframeRef.current?.contentDocument;
                  if (doc?.body) {
                    const h = doc.body.scrollHeight;
                    if (iframeRef.current) iframeRef.current.style.height = Math.max(h, 400) + 'px';
                  }
                } catch {}
              }}
              style={{ width: '100%', height: 600, border: 'none', display: 'block', transition: 'height 0.3s' }}
            />
          </div>

          <div style={{ display: tab === 'code' ? 'block' : 'none', maxHeight: '80vh', overflow: 'auto', background: '#0f172a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, background: '#0f172a', zIndex: 1 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
                landing-page.html · {(html.length / 1024).toFixed(1)}kb
              </span>
              <button onClick={copyHTML} style={{ fontSize: 12, color: T.lime, background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                {copied ? 'Copiado ✓' : 'Copiar código'}
              </button>
            </div>
            <pre style={{ padding: 20, fontFamily: "'Fira Code','Courier New',monospace", fontSize: 12, lineHeight: 1.65, color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
              {html}
            </pre>
          </div>

          {/* ── BARRA DE AÇÃO FINAL ───────────────────────── */}
          {!approved ? (
            <div style={{
              borderTop: `1px solid ${T.border}`, background: T.bg,
              padding: '16px 20px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
            }}>
              {/* Voltar */}
              <button
                onClick={() => setState('form')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 18px', borderRadius: 8, border: `1px solid ${T.border}`,
                  background: 'transparent', fontSize: 13, fontWeight: 600,
                  color: T.ink, cursor: 'pointer',
                }}
              >
                ← Voltar e reajustar briefing
              </button>

              {/* Direita: regenerar + aprovar */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => lastBriefing && gerar(lastBriefing)}
                  disabled={!lastBriefing}
                  style={{
                    padding: '10px 18px', borderRadius: 8, border: `1px solid ${T.border}`,
                    background: 'transparent', fontSize: 13, fontWeight: 600,
                    color: T.muted, cursor: lastBriefing ? 'pointer' : 'not-allowed',
                    opacity: lastBriefing ? 1 : 0.4,
                  }}
                >
                  ↺ Regenerar
                </button>

                <button
                  onClick={aprovar}
                  disabled={approving || !currentChoiceId}
                  style={{
                    padding: '10px 28px', borderRadius: 8, border: 'none',
                    background: T.lime, fontSize: 14, fontWeight: 800,
                    color: T.ink, cursor: approving ? 'wait' : 'pointer',
                    opacity: approving ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {approving ? (
                    <><div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: T.ink, borderRadius: '50%', animation: 'lpspin 0.8s linear infinite' }} />Aprovando...</>
                  ) : '✓ Finalizar e aprovar'}
                </button>
              </div>
            </div>
          ) : (
            /* ── APROVADO ────────────────────────────────── */
            <div style={{
              borderTop: `2px solid ${T.lime}`, background: '#f7fde8',
              padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: T.lime,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 900, color: T.ink, flexShrink: 0,
              }}>✓</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>Landing page aprovada!</div>
                <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>
                  Disponível para download a qualquer momento.
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button onClick={downloadHTML} style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', fontSize: 13, fontWeight: 600, color: T.ink, cursor: 'pointer' }}>
                  ↓ Baixar HTML
                </button>
                <button onClick={openNewTab} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: T.ink, color: T.lime, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  ↗ Abrir
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Btn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '5px 12px', borderRadius: 6, border: `1px solid ${T.border}`,
      background: 'transparent', fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer',
      color: disabled ? '#cbd5e1' : T.muted, whiteSpace: 'nowrap',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {children}
    </button>
  );
}
