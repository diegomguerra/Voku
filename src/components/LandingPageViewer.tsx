'use client';

import { useState, useRef, useEffect } from 'react';
import LandingBriefingForm, { LandingBriefing } from './LandingBriefingForm';

interface LandingViewerProps {
  orderId:        string;
  choiceId?:      string;
  userId:         string;
  initialHtml?:   string;
  // structured_data pré-preenchido (vindo do briefing do chat)
  prefill?: Partial<LandingBriefing>;
}

type Tab   = 'preview' | 'code';
type State = 'form' | 'loading' | 'ready' | 'error';

const LOADING_MSGS = [
  'Gerando copy e estrutura...',
  'Montando hero, benefícios e depoimentos...',
  'Aplicando identidade visual e cores...',
  'Finalizando HTML responsivo...',
];

export default function LandingPageViewer({
  orderId,
  choiceId,
  userId,
  initialHtml,
  prefill,
}: LandingViewerProps) {
  const [tab, setTab]     = useState<Tab>('preview');
  const [state, setState] = useState<State>(initialHtml ? 'ready' : 'form');
  const [html, setHtml]   = useState(initialHtml || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [marcaNome, setMarcaNome] = useState(prefill?.nome_marca || '');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const htmlRef   = useRef(initialHtml || '');

  // Spinner de loading
  useEffect(() => {
    if (state !== 'loading') return;
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % LOADING_MSGS.length; setLoadingMsg(LOADING_MSGS[i]); }, 3200);
    return () => clearInterval(id);
  }, [state]);

  // Escreve no iframe quando fica ready
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

    // Monta structured_data enriquecido para a Edge Function
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
        body: JSON.stringify({ order_id: orderId, choice_id: choiceId, user_id: userId, structured_data }),
      });

      const data = await res.json();
      if (!res.ok || !data.html) throw new Error(data.error || 'Falha ao gerar');

      htmlRef.current = data.html;
      setHtml(data.html);
      setState('ready');
      setTab('preview');
    } catch (e: any) {
      setError(e.message);
      setState('error');
    }
  }

  function copyHTML() {
    const h = htmlRef.current || html;
    if (!h) return;
    navigator.clipboard.writeText(h).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function downloadHTML() {
    const h = htmlRef.current || html;
    if (!h) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([h], { type: 'text/html' }));
    a.download = `landing-page-${(marcaNome || 'voku').toLowerCase().replace(/\s+/g,'-')}.html`;
    a.click();
  }

  function openNewTab() {
    const h = htmlRef.current || html;
    if (!h) return;
    window.open(URL.createObjectURL(new Blob([h], { type: 'text/html' })), '_blank');
  }

  const isReady = state === 'ready';

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff' }}>

      {/* ── TOOLBAR (sempre visível) ───────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 8 }}>

        {/* dots + url */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 16px', fontSize: 12, color: '#64748b', minWidth: 200, textAlign: 'center' }}>
            {isReady ? `${(marcaNome||'voku').toLowerCase().replace(/\s+/g,'')} · voku.one/preview` : 'voku.one · landing page builder'}
          </div>
        </div>

        {/* tabs — só quando ready */}
        {isReady && (
          <div style={{ display: 'flex', gap: 4 }}>
            {(['preview','code'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid', fontSize: 13, cursor: 'pointer', fontWeight: tab===t ? 600 : 400, background: tab===t ? '#fff' : 'transparent', borderColor: tab===t ? '#cbd5e1' : '#e2e8f0', color: tab===t ? '#0f172a' : '#64748b' }}>
                {t === 'preview' ? 'Preview' : 'Código'}
              </button>
            ))}
          </div>
        )}

        {/* actions */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {isReady && (
            <>
              <Btn onClick={() => setState('form')}>Editar</Btn>
              <Btn onClick={openNewTab}>Abrir</Btn>
              <Btn onClick={copyHTML}>{copied ? 'Copiado!' : 'Copiar HTML'}</Btn>
              <Btn onClick={downloadHTML}>Baixar</Btn>
            </>
          )}
        </div>
      </div>

      {/* ── FORM ─────────────────────────────────────── */}
      {(state === 'form' || state === 'error') && (
        <div style={{ padding: 24 }}>
          {state === 'error' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>!</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#991b1b', marginBottom: 2 }}>Erro ao gerar</p>
                <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
              </div>
            </div>
          )}
          <LandingBriefingForm
            onSubmit={gerar}
            loading={false}
            prefill={prefill}
          />
        </div>
      )}

      {/* ── LOADING ─────────────────────────────────── */}
      {state === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 520, gap: 20 }}>
          <div style={{ position: 'relative', width: 64, height: 64 }}>
            <div style={{ position: 'absolute', inset: 0, border: '3px solid #e2e8f0', borderTopColor: '#CCEE33', borderRadius: '50%', animation: 'lpspin 0.8s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 8, border: '2px solid #e2e8f0', borderBottomColor: '#22c55e', borderRadius: '50%', animation: 'lpspin 1.2s linear infinite reverse' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Gerando sua landing page</p>
            <p style={{ fontSize: 13, color: '#64748b' }}>{loadingMsg}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {LOADING_MSGS.map((m, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: loadingMsg === m ? '#CCEE33' : '#e2e8f0', transition: 'background 0.3s' }} />
            ))}
          </div>
          <style>{`@keyframes lpspin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* ── READY: iframe + code ── */}
      {isReady && (
        <>
          <div style={{ display: tab === 'preview' ? 'block' : 'none' }}>
            <iframe
              ref={iframeRef}
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
              style={{ width: '100%', height: 620, border: 'none', display: 'block' }}
            />
          </div>
          <div style={{ display: tab === 'code' ? 'block' : 'none', height: 620, overflow: 'auto', background: '#0f172a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, background: '#0f172a', zIndex: 1 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
                landing-page.html · {(html.length / 1024).toFixed(1)}kb
              </span>
              <button onClick={copyHTML} style={{ fontSize: 12, color: '#CCEE33', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                {copied ? 'Copiado!' : 'Copiar código'}
              </button>
            </div>
            <pre style={{ padding: 20, fontFamily: "'Fira Code','Courier New',monospace", fontSize: 12, lineHeight: 1.65, color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
              {html}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}

function Btn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'transparent', fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? '#cbd5e1' : '#64748b', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
      {children}
    </button>
  );
}
