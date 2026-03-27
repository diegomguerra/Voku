'use client';

import { useState, useRef } from 'react';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
export interface LandingBriefing {
  // Negócio
  nome_marca:    string;
  produto:       string;
  publico:       string;
  objetivos:     string[];
  resumo:        string;
  // Visual
  cor_primaria:  string;
  cor_secundaria:string;
  cor_texto:     string;
  estilo:        string;
  logo_url:      string;
  logo_base64:   string;
  // Copy
  tom:           string;
  cta_texto:     string;
  // Extras
  site_url:      string;
  palavras_chave:string;
}

interface LandingBriefingFormProps {
  onSubmit: (data: LandingBriefing) => void;
  loading?: boolean;
  prefill?: Partial<LandingBriefing>;
}

// ─────────────────────────────────────────────
// PALETAS PRONTAS
// ─────────────────────────────────────────────
const PALETTES = [
  { name: 'Voku',      primary: '#CCEE33', secondary: '#0a0a0a', text: '#ffffff' },
  { name: 'Oceano',    primary: '#0EA5E9', secondary: '#0f172a', text: '#ffffff' },
  { name: 'Esmeralda', primary: '#10B981', secondary: '#064e3b', text: '#ffffff' },
  { name: 'Roxo',      primary: '#8B5CF6', secondary: '#1e1b4b', text: '#ffffff' },
  { name: 'Coral',     primary: '#F97316', secondary: '#1c1917', text: '#ffffff' },
  { name: 'Rosa',      primary: '#EC4899', secondary: '#1a0a14', text: '#ffffff' },
  { name: 'Dourado',   primary: '#F59E0B', secondary: '#1c1107', text: '#ffffff' },
  { name: 'Neutro',    primary: '#334155', secondary: '#f8fafc', text: '#0f172a' },
];

// ─────────────────────────────────────────────
// ESTILOS VISUAIS
// ─────────────────────────────────────────────
const ESTILOS = [
  { id: 'moderno',    emoji: '⚡', label: 'Moderno & Bold',    desc: 'Dark mode, tipografia grande, impacto visual' },
  { id: 'clean',      emoji: '✦', label: 'Clean & Minimalista', desc: 'Muito espaço branco, elegante, sofisticado' },
  { id: 'corporativo', emoji: '🏢', label: 'Corporativo',       desc: 'Profissional, confiável, cores neutras' },
  { id: 'startup',    emoji: '🚀', label: 'Startup & Tech',     desc: 'Gradientes, ilustrações, energia jovem' },
  { id: 'editorial',  emoji: '📰', label: 'Editorial',          desc: 'Inspirado em revistas, tipografia forte' },
  { id: 'luxury',     emoji: '💎', label: 'Premium & Luxury',   desc: 'Dourado, preto, exclusividade máxima' },
];

// ─────────────────────────────────────────────
// TONS DE VOZ
// ─────────────────────────────────────────────
const TONS = [
  { id: 'direto',       label: 'Direto & Assertivo',   emoji: '🎯' },
  { id: 'inspiracional', label: 'Inspiracional',        emoji: '✨' },
  { id: 'educativo',    label: 'Educativo & Científico', emoji: '🧪' },
  { id: 'premium',      label: 'Premium & Exclusivo',   emoji: '💎' },
  { id: 'descontraido', label: 'Descontraído',          emoji: '😎' },
  { id: 'urgente',      label: 'Urgência & Conversão',  emoji: '🔥' },
];

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function LandingBriefingForm({ onSubmit, loading = false, prefill }: LandingBriefingFormProps) {
  const [step, setStep]       = useState(1);
  const [briefing, setBriefing] = useState<LandingBriefing>({
    nome_marca:     prefill?.nome_marca ?? '',
    produto:        prefill?.produto ?? '',
    publico:        prefill?.publico ?? '',
    objetivos:      prefill?.objetivos ?? [],
    resumo:         prefill?.resumo ?? '',
    cor_primaria:   prefill?.cor_primaria ?? '#CCEE33',
    cor_secundaria: prefill?.cor_secundaria ?? '#0a0a0a',
    cor_texto:      prefill?.cor_texto ?? '#ffffff',
    estilo:         prefill?.estilo ?? 'moderno',
    logo_url:       prefill?.logo_url ?? '',
    logo_base64:    prefill?.logo_base64 ?? '',
    tom:            prefill?.tom ?? 'direto',
    cta_texto:      prefill?.cta_texto ?? '',
    site_url:       prefill?.site_url ?? '',
    palavras_chave: prefill?.palavras_chave ?? '',
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const TOTAL_STEPS = 3;

  function set(key: keyof LandingBriefing, value: string) {
    setBriefing(b => ({ ...b, [key]: value }));
  }

  function applyPalette(p: typeof PALETTES[0]) {
    setBriefing(b => ({ ...b, cor_primaria: p.primary, cor_secundaria: p.secondary, cor_texto: p.text }));
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setBriefing(b => ({ ...b, logo_base64: base64, logo_url: '' }));
    };
    reader.readAsDataURL(file);
  }

  function canProceed() {
    if (step === 1) return briefing.nome_marca && briefing.produto && briefing.publico && briefing.objetivos.length > 0;
    if (step === 2) return briefing.estilo && briefing.tom;
    return true;
  }

  function handleSubmit() {
    if (!canProceed()) return;
    onSubmit(briefing);
  }

  // ── Estilos base ──
  const s = {
    wrap:     { fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' } as React.CSSProperties,
    header:   { padding: '24px 28px 0', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' } as React.CSSProperties,
    body:     { padding: '28px' } as React.CSSProperties,
    label:    { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 } as React.CSSProperties,
    input:    { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s', background: '#fff' } as React.CSSProperties,
    textarea: { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', fontFamily: 'inherit', outline: 'none', resize: 'vertical' as const, minHeight: 88, background: '#fff' },
    row2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 } as React.CSSProperties,
    row1:     { marginBottom: 16 } as React.CSSProperties,
    footer:   { padding: '20px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, bottom: 0, zIndex: 10 } as React.CSSProperties,
    btnPrimary: { background: '#CCEE33', color: '#1a1a1a', border: 'none', padding: '12px 32px', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' } as React.CSSProperties,
    btnSecondary: { background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', padding: '12px 24px', borderRadius: 9, fontSize: 14, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
  };

  return (
    <div style={s.wrap}>

      {/* HEADER + STEPS */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {step === 1 ? 'Sobre o negócio' : step === 2 ? 'Visual e identidade' : 'Copy e finalização'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              Passo {step} de {TOTAL_STEPS}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ width: n === step ? 32 : 10, height: 10, borderRadius: 100, background: n === step ? '#CCEE33' : n < step ? '#22c55e' : '#e2e8f0', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── STEP 1: NEGÓCIO ──────────────────────────── */}
      {step === 1 && (
        <div style={s.body}>
          <div style={s.row2}>
            <div>
              <label style={s.label}>Nome da marca *</label>
              <input style={s.input} placeholder="Ex: VYR System" value={briefing.nome_marca} onChange={e => set('nome_marca', e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Site ou redes sociais</label>
              <input style={s.input} placeholder="https://vyrsystem.com.br" value={briefing.site_url} onChange={e => set('site_url', e.target.value)} />
            </div>
          </div>

          <div style={s.row1}>
            <label style={s.label}>Produto ou serviço *</label>
            <input style={s.input} placeholder="Ex: VYR Boot — suplemento cognitivo em sachê para executivos" value={briefing.produto} onChange={e => set('produto', e.target.value)} />
          </div>

          <div style={s.row1}>
            <label style={s.label}>Público-alvo *</label>
            <input style={s.input} placeholder="Ex: Executivos e profissionais de alto desempenho, 28-50 anos" value={briefing.publico} onChange={e => set('publico', e.target.value)} />
          </div>

          <div style={s.row1}>
            <label style={s.label}>Objetivos da landing page *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {['Capturar leads', 'Vender diretamente', 'Agendar reunião', 'Divulgar produto', 'Lançamento', 'Outro'].map(obj => {
                const selected = briefing.objetivos.includes(obj);
                return (
                  <div
                    key={obj}
                    onClick={() => setBriefing(b => ({ ...b, objetivos: selected ? b.objetivos.filter(o => o !== obj) : [...b.objetivos, obj] }))}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid', borderColor: selected ? '#CCEE33' : '#e2e8f0', background: selected ? '#fafde7' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: selected ? '#78350f' : '#374151', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid', borderColor: selected ? '#CCEE33' : '#cbd5e1', background: selected ? '#CCEE33' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selected && <span style={{ color: '#1a1a1a', fontSize: 11, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                    </div>
                    {obj}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={s.row1}>
            <label style={s.label}>Resumo do negócio</label>
            <textarea style={s.textarea} placeholder="Descreva seu produto/serviço, diferenciais, contexto. Quanto mais detalhes, melhor o resultado." value={briefing.resumo} onChange={e => set('resumo', e.target.value)} />
          </div>

          <div style={s.row1}>
            <label style={s.label}>Palavras-chave (separadas por vírgula)</label>
            <input style={s.input} placeholder="Ex: performance cognitiva, foco, executivos, sachê, colágeno" value={briefing.palavras_chave} onChange={e => set('palavras_chave', e.target.value)} />
          </div>
        </div>
      )}

      {/* ── STEP 2: VISUAL ───────────────────────────── */}
      {step === 2 && (
        <div style={s.body}>

          {/* LOGO */}
          <div style={s.row1}>
            <label style={s.label}>Logo da marca</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ width: 80, height: 80, borderRadius: 12, border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: '#f8fafc', flexShrink: 0 }}
              >
                {briefing.logo_base64
                  ? <img src={briefing.logo_base64} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                  : <span style={{ fontSize: 28, opacity: 0.4 }}>+</span>
                }
              </div>
              <div>
                <button onClick={() => fileRef.current?.click()} style={{ ...s.btnSecondary, padding: '8px 20px', fontSize: 13 }}>
                  {briefing.logo_base64 ? 'Trocar logo' : 'Fazer upload do logo'}
                </button>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>PNG, SVG ou JPG</p>
                {briefing.logo_base64 && (
                  <button onClick={() => setBriefing(b => ({ ...b, logo_base64: '', logo_url: '' }))} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
                    Remover
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
            </div>
          </div>

          {/* PALETAS PRONTAS */}
          <div style={s.row1}>
            <label style={s.label}>Paleta de cores</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {PALETTES.map(p => (
                <div
                  key={p.name}
                  onClick={() => applyPalette(p)}
                  style={{ borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: '2px solid', borderColor: briefing.cor_primaria === p.primary ? '#CCEE33' : 'transparent', transition: 'border-color 0.15s' }}
                >
                  <div style={{ height: 36, background: p.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: p.primary }} />
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: p.text, opacity: 0.6 }} />
                  </div>
                  <div style={{ padding: '6px 8px', background: '#f8fafc', fontSize: 11, fontWeight: 600, color: '#374151', textAlign: 'center' }}>{p.name}</div>
                </div>
              ))}
            </div>

            {/* Cores customizadas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { key: 'cor_primaria', label: 'Cor primária' },
                { key: 'cor_secundaria', label: 'Fundo / Secundária' },
                { key: 'cor_texto', label: 'Cor do texto' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={{ ...s.label, fontSize: 12 }}>{label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', background: '#fff' }}>
                    <input
                      type="color"
                      value={briefing[key as keyof LandingBriefing] as string}
                      onChange={e => set(key as keyof LandingBriefing, e.target.value)}
                      style={{ width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0, background: 'none' }}
                    />
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151', fontWeight: 600 }}>
                      {briefing[key as keyof LandingBriefing] as string}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ESTILO VISUAL */}
          <div style={s.row1}>
            <label style={s.label}>Estilo visual</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {ESTILOS.map(e => (
                <div
                  key={e.id}
                  onClick={() => set('estilo', e.id)}
                  style={{ padding: '14px 16px', borderRadius: 10, border: '1.5px solid', borderColor: briefing.estilo === e.id ? '#CCEE33' : '#e2e8f0', background: briefing.estilo === e.id ? '#fafde7' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>{e.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: briefing.estilo === e.id ? '#78350f' : '#0f172a' }}>{e.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{e.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PREVIEW DE CORES */}
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{ background: briefing.cor_secundaria, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                {briefing.logo_base64
                  ? <img src={briefing.logo_base64} alt="logo" style={{ height: 32, objectFit: 'contain' }} />
                  : <span style={{ color: briefing.cor_primaria, fontWeight: 800, fontSize: 20 }}>{briefing.nome_marca || 'Sua Marca'}</span>
                }
              </div>
              <div style={{ background: briefing.cor_primaria, color: briefing.cor_secundaria, padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                {briefing.cta_texto || 'Começar agora'}
              </div>
            </div>
            <div style={{ background: briefing.cor_secundaria, padding: '24px', borderTop: `1px solid ${briefing.cor_primaria}22` }}>
              <p style={{ color: briefing.cor_primaria, fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>Preview</p>
              <h3 style={{ color: briefing.cor_texto, fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
                {briefing.produto || 'Headline da sua landing page vai aparecer aqui'}
              </h3>
              <p style={{ color: briefing.cor_texto, opacity: 0.6, fontSize: 14 }}>
                {briefing.publico || 'Subheadline descrevendo o público e benefícios'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: COPY ─────────────────────────────── */}
      {step === 3 && (
        <div style={s.body}>

          {/* TOM */}
          <div style={s.row1}>
            <label style={s.label}>Tom da comunicação</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {TONS.map(t => (
                <div
                  key={t.id}
                  onClick={() => set('tom', t.id)}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px solid', borderColor: briefing.tom === t.id ? '#CCEE33' : '#e2e8f0', background: briefing.tom === t.id ? '#fafde7' : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{t.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: briefing.tom === t.id ? '#78350f' : '#0f172a' }}>{t.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={s.row1}>
            <label style={s.label}>Texto do botão principal (CTA)</label>
            <input style={s.input} placeholder="Ex: Quero experimentar, Agendar demonstração, Comprar agora" value={briefing.cta_texto} onChange={e => set('cta_texto', e.target.value)} />
          </div>

          {/* RESUMO FINAL */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Resumo do briefing</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Marca', value: briefing.nome_marca },
                { label: 'Objetivos', value: briefing.objetivos.join(', ') },
                { label: 'Público', value: briefing.publico },
                { label: 'Tom', value: TONS.find(t => t.id === briefing.tom)?.label || '' },
                { label: 'Estilo', value: ESTILOS.find(e => e.id === briefing.estilo)?.label || '' },
                { label: 'Cor primária', value: briefing.cor_primaria },
              ].map(({ label, value }) => value ? (
                <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0, minWidth: 72 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{value}</span>
                </div>
              ) : null)}
            </div>
          </div>

          <div style={{ background: '#fafde7', border: '1px solid #d9f99d', borderRadius: 10, padding: '14px 18px', marginTop: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>AI</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#3f6212', marginBottom: 4 }}>O que será gerado</p>
              <p style={{ fontSize: 13, color: '#4d7c0f', margin: 0, lineHeight: 1.6 }}>
                Claude Sonnet vai criar: copy completo (headline, benefícios, depoimentos, FAQ) + HTML funcional responsivo com suas cores e estilo. Pronto para publicar em qualquer servidor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={s.footer}>
        <div style={{ display: 'flex', gap: 8 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} style={s.btnSecondary}>
              Voltar
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {step < TOTAL_STEPS ? (
            <button
              onClick={() => canProceed() && setStep(s => s + 1)}
              disabled={!canProceed()}
              style={{ ...s.btnPrimary, opacity: canProceed() ? 1 : 0.4, cursor: canProceed() ? 'pointer' : 'not-allowed' }}
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ ...s.btnPrimary, padding: '12px 36px', fontSize: 15, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#1a1a1a', borderRadius: '50%', display: 'inline-block', animation: 'lpspin 0.8s linear infinite' }} />
                  Gerando...
                </>
              ) : 'Gerar landing page com IA'}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes lpspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
