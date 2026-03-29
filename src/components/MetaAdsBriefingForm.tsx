'use client';

import { useState } from 'react';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
export interface MetaAdsBriefing {
  nomeMarca: string;
  segmento: string;
  publicoAlvo: string;
  diferenciais: string;
  produto: string;
  objetivo: string;
  orcamento: string;
  angulos: string[];
  tomVoz: string;
  temOferta: boolean;
  oferta: string;
  evitar: string;
  concorrentes: string;
}

interface Props {
  onSubmit: (data: MetaAdsBriefing) => void;
  loading?: boolean;
  prefill?: Partial<MetaAdsBriefing>;
  onStepChange?: (step: number) => void;
}

// ─────────────────────────────────────────────
// OPÇÕES
// ─────────────────────────────────────────────
const OBJETIVOS = [
  'Gerar leads (capturar contatos)',
  'Vender diretamente (conversão)',
  'Gerar tráfego para site ou landing page',
  'Aumentar reconhecimento de marca',
  'Promover evento ou lançamento',
];

const ORCAMENTOS = [
  'Até R$ 30/dia (começo)',
  'R$ 30 a R$ 100/dia (crescimento)',
  'R$ 100 a R$ 500/dia (escala)',
  'Acima de R$ 500/dia (performance)',
];

const ANGULOS = [
  'Dor (focar no problema do cliente)',
  'Benefício (resultado que vai alcançar)',
  'Prova social (depoimento, resultado, número)',
  'Autoridade (quem você é, por que confiar)',
  'Curiosidade (gancho que desperta interesse)',
  'Urgência / escassez (oferta limitada)',
  'Comparação (antes vs. depois / você vs. concorrente)',
];

const TONS = [
  'Direto e persuasivo',
  'Próximo e empático',
  'Urgente',
  'Inspirador',
  'Sofisticado',
  'Educativo',
];

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function MetaAdsBriefingForm({ onSubmit, loading = false, prefill, onStepChange }: Props) {
  const [step, setStep] = useState(1);
  const [briefing, setBriefing] = useState<MetaAdsBriefing>({
    nomeMarca:    prefill?.nomeMarca ?? '',
    segmento:     prefill?.segmento ?? '',
    publicoAlvo:  prefill?.publicoAlvo ?? '',
    diferenciais: prefill?.diferenciais ?? '',
    produto:      prefill?.produto ?? '',
    objetivo:     prefill?.objetivo ?? '',
    orcamento:    prefill?.orcamento ?? '',
    angulos:      prefill?.angulos ?? [],
    tomVoz:       prefill?.tomVoz ?? '',
    temOferta:    prefill?.temOferta ?? false,
    oferta:       prefill?.oferta ?? '',
    evitar:       prefill?.evitar ?? '',
    concorrentes: prefill?.concorrentes ?? '',
  });

  const TOTAL_STEPS = 3;

  function set<K extends keyof MetaAdsBriefing>(key: K, value: MetaAdsBriefing[K]) {
    setBriefing(b => ({ ...b, [key]: value }));
  }

  function toggleArray(key: 'angulos', value: string) {
    setBriefing(b => ({
      ...b,
      [key]: (b[key] as string[]).includes(value)
        ? (b[key] as string[]).filter(v => v !== value)
        : [...(b[key] as string[]), value],
    }));
  }

  function goToStep(n: number) {
    setStep(n);
    onStepChange?.(n);
  }

  function canProceed() {
    if (step === 1) return !!(briefing.nomeMarca && briefing.segmento && briefing.publicoAlvo && briefing.diferenciais);
    if (step === 2) return !!(briefing.produto && briefing.objetivo && briefing.angulos.length > 0);
    return true;
  }

  function handleSubmit() {
    if (!canProceed()) return;
    onSubmit(briefing);
  }

  // ── Estilos base ──
  const s = {
    wrap:     { fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' } as React.CSSProperties,
    header:   { padding: '24px 28px 0', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' } as React.CSSProperties,
    body:     { padding: '28px' } as React.CSSProperties,
    label:    { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 } as React.CSSProperties,
    input:    { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s', background: '#fff' } as React.CSSProperties,
    textarea: { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', fontFamily: 'inherit', outline: 'none', resize: 'vertical' as const, minHeight: 88, background: '#fff' },
    row2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 } as React.CSSProperties,
    row1:     { marginBottom: 16 } as React.CSSProperties,
    footer:   { padding: '20px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0 0 16px 16px' } as React.CSSProperties,
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
              {step === 1 ? '⚡ O negócio' : step === 2 ? '📣 O anúncio' : '🎯 Tom e oferta'}
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

      {/* ── STEP 1: O NEGÓCIO ──────────────────────────── */}
      {step === 1 && (
        <div style={s.body}>
          <div style={s.row2}>
            <div>
              <label style={s.label}>Nome da marca *</label>
              <input style={s.input} placeholder="Ex: Nike, Voku, Minha Empresa" value={briefing.nomeMarca} onChange={e => set('nomeMarca', e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Segmento *</label>
              <input style={s.input} placeholder="Ex: Alimentação, Saúde, Tecnologia" value={briefing.segmento} onChange={e => set('segmento', e.target.value)} />
            </div>
          </div>

          <div style={s.row1}>
            <label style={s.label}>Público-alvo *</label>
            <textarea style={s.textarea} placeholder="Descreva seu público ideal: idade, interesses, dores, desejos..." value={briefing.publicoAlvo} onChange={e => set('publicoAlvo', e.target.value)} />
          </div>

          <div style={s.row1}>
            <label style={s.label}>Diferenciais do negócio *</label>
            <textarea style={s.textarea} placeholder="O que torna sua empresa/produto diferente? Resultados, método, garantia, preço..." value={briefing.diferenciais} onChange={e => set('diferenciais', e.target.value)} />
          </div>
        </div>
      )}

      {/* ── STEP 2: O ANÚNCIO ─────────────────────────── */}
      {step === 2 && (
        <div style={s.body}>
          <div style={s.row2}>
            <div>
              <label style={s.label}>Produto / serviço *</label>
              <input style={s.input} placeholder="Ex: Curso de marketing, Consultoria, Software..." value={briefing.produto} onChange={e => set('produto', e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Objetivo do anúncio *</label>
              <select style={{ ...s.input, appearance: 'auto', cursor: 'pointer' }} value={briefing.objetivo} onChange={e => set('objetivo', e.target.value)}>
                <option value="">Selecione...</option>
                {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div style={s.row1}>
            <label style={s.label}>Orçamento diário</label>
            <select style={{ ...s.input, appearance: 'auto', cursor: 'pointer' }} value={briefing.orcamento} onChange={e => set('orcamento', e.target.value)}>
              <option value="">Selecione...</option>
              {ORCAMENTOS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div style={s.row1}>
            <label style={s.label}>Ângulos de copy * <span style={{ fontWeight: 400, color: '#94a3b8' }}>(escolha pelo menos 1)</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {ANGULOS.map(opt => {
                const selected = briefing.angulos.includes(opt);
                return (
                  <div key={opt} onClick={() => toggleArray('angulos', opt)}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid', borderColor: selected ? '#CCEE33' : '#e2e8f0', background: selected ? '#fafde7' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: selected ? '#78350f' : '#374151', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid', borderColor: selected ? '#CCEE33' : '#cbd5e1', background: selected ? '#CCEE33' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selected && <span style={{ fontSize: 10, color: '#1a1a1a', fontWeight: 900 }}>✓</span>}
                    </div>
                    {opt}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: TOM E OFERTA ───────────────────────── */}
      {step === 3 && (
        <div style={s.body}>
          <div style={s.row1}>
            <label style={s.label}>Tom de voz</label>
            <select style={{ ...s.input, appearance: 'auto', cursor: 'pointer' }} value={briefing.tomVoz} onChange={e => set('tomVoz', e.target.value)}>
              <option value="">Selecione...</option>
              {TONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={s.row1}>
            <label style={s.label}>Tem oferta especial?</label>
            <div onClick={() => set('temOferta', !briefing.temOferta)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: '1.5px solid', borderColor: briefing.temOferta ? '#CCEE33' : '#e2e8f0', background: briefing.temOferta ? '#fafde7' : '#fff', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: briefing.temOferta ? '#CCEE33' : '#cbd5e1', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: briefing.temOferta ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{briefing.temOferta ? 'Sim' : 'Não'}</span>
            </div>
          </div>

          {briefing.temOferta && (
            <div style={s.row1}>
              <label style={s.label}>Detalhes da oferta</label>
              <input style={s.input} placeholder="Ex: 50% de desconto, frete grátis, bônus exclusivo..." value={briefing.oferta} onChange={e => set('oferta', e.target.value)} />
            </div>
          )}

          <div style={s.row1}>
            <label style={s.label}>O que evitar</label>
            <textarea style={s.textarea} placeholder="Palavras, temas ou abordagens que devem ser evitados..." value={briefing.evitar} onChange={e => set('evitar', e.target.value)} />
          </div>

          <div style={s.row1}>
            <label style={s.label}>Concorrentes <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opcional)</span></label>
            <input style={s.input} placeholder="Quem são seus principais concorrentes?" value={briefing.concorrentes} onChange={e => set('concorrentes', e.target.value)} />
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={s.footer}>
        <div style={{ display: 'flex', gap: 8 }}>
          {step > 1 && (
            <button onClick={() => goToStep(step - 1)} style={s.btnSecondary}>
              ← Voltar
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            {!canProceed() ? 'Preencha os campos obrigatórios *' : ''}
          </span>
          {step < TOTAL_STEPS ? (
            <button
              onClick={() => canProceed() && goToStep(step + 1)}
              style={{ ...s.btnPrimary, opacity: canProceed() ? 1 : 0.45, cursor: canProceed() ? 'pointer' : 'not-allowed' }}
            >
              Continuar →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ ...s.btnPrimary, padding: '12px 36px', fontSize: 15, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#1a1a1a', borderRadius: '50%', display: 'inline-block', animation: 'mabfspin 0.8s linear infinite' }} />
                  Gerando...
                </>
              ) : '🚀 Gerar copy de anúncios com IA'}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes mabfspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
