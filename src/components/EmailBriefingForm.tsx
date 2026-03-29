'use client';

import { useState } from 'react';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
export interface EmailBriefing {
  nomeMarca: string;
  segmento: string;
  publicoAlvo: string;
  contexto: string;
  numeroEmails: number;
  objetivo: string;
  produto: string;
  duracao: string;
  tomVoz: string;
  primeiroNome: boolean;
  evitar: string;
  exemploEmail: string;
}

interface Props {
  onSubmit: (data: EmailBriefing) => void;
  loading?: boolean;
  prefill?: Partial<EmailBriefing>;
  onStepChange?: (step: number) => void;
}

// ─────────────────────────────────────────────
// OPÇÕES
// ─────────────────────────────────────────────
const OBJETIVOS = [
  'Nutrir e educar (preparar para venda futura)',
  'Vender diretamente (sequência de vendas)',
  'Onboarding (boas-vindas e primeiros passos)',
  'Reengajamento (reativar contato inativo)',
  'Lançamento de produto',
  'Pós-compra (fidelizar e upsell)',
];

const DURACOES = [
  'Compactada (0 ao 4: urgência)',
  'Normal (0 ao 8: padrão de mercado)',
  'Estendida (0 ao 14: relação de longo prazo)',
];

const TONS = [
  'Profissional e direto',
  'Próximo e informal',
  'Inspirador',
  'Didático',
  'Urgente e persuasivo',
  'Sofisticado',
];

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function EmailBriefingForm({ onSubmit, loading = false, prefill, onStepChange }: Props) {
  const [step, setStep] = useState(1);
  const [briefing, setBriefing] = useState<EmailBriefing>({
    nomeMarca:     prefill?.nomeMarca ?? '',
    segmento:      prefill?.segmento ?? '',
    publicoAlvo:   prefill?.publicoAlvo ?? '',
    contexto:      prefill?.contexto ?? '',
    numeroEmails:  prefill?.numeroEmails ?? 5,
    objetivo:      prefill?.objetivo ?? '',
    produto:       prefill?.produto ?? '',
    duracao:       prefill?.duracao ?? '',
    tomVoz:        prefill?.tomVoz ?? '',
    primeiroNome:  prefill?.primeiroNome ?? true,
    evitar:        prefill?.evitar ?? '',
    exemploEmail:  prefill?.exemploEmail ?? '',
  });

  const TOTAL_STEPS = 3;

  function set<K extends keyof EmailBriefing>(key: K, value: EmailBriefing[K]) {
    setBriefing(b => ({ ...b, [key]: value }));
  }

  function goToStep(n: number) {
    setStep(n);
    onStepChange?.(n);
  }

  function canProceed() {
    if (step === 1) return !!(briefing.nomeMarca && briefing.segmento && briefing.publicoAlvo && briefing.contexto);
    if (step === 2) return !!(briefing.objetivo && briefing.produto);
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
              {step === 1 ? '✉️ Contexto' : step === 2 ? '📧 A sequência' : '🎨 Tom e personalização'}
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

      {/* ── STEP 1: CONTEXTO ───────────────────────────── */}
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
            <label style={s.label}>O que aconteceu antes? *</label>
            <textarea style={s.textarea} placeholder="Contexto: como o lead chegou até aqui? Baixou um e-book? Comprou algo? Se cadastrou numa lista de espera?" value={briefing.contexto} onChange={e => set('contexto', e.target.value)} />
          </div>
        </div>
      )}

      {/* ── STEP 2: A SEQUÊNCIA ────────────────────────── */}
      {step === 2 && (
        <div style={s.body}>
          <div style={s.row2}>
            <div>
              <label style={s.label}>Número de e-mails</label>
              <select style={{ ...s.input, appearance: 'auto', cursor: 'pointer' }} value={briefing.numeroEmails} onChange={e => set('numeroEmails', Number(e.target.value))}>
                <option value={3}>3 e-mails</option>
                <option value={5}>5 e-mails</option>
                <option value={7}>7 e-mails</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Objetivo *</label>
              <select style={{ ...s.input, appearance: 'auto', cursor: 'pointer' }} value={briefing.objetivo} onChange={e => set('objetivo', e.target.value)}>
                <option value="">Selecione...</option>
                {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div style={s.row2}>
            <div>
              <label style={s.label}>Produto / serviço principal *</label>
              <input style={s.input} placeholder="Ex: Curso de marketing, Consultoria, Software..." value={briefing.produto} onChange={e => set('produto', e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Duração da sequência</label>
              <select style={{ ...s.input, appearance: 'auto', cursor: 'pointer' }} value={briefing.duracao} onChange={e => set('duracao', e.target.value)}>
                <option value="">Selecione...</option>
                {DURACOES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: TOM E PERSONALIZAÇÃO ───────────────── */}
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
            <label style={s.label}>Usar primeiro nome do lead?</label>
            <div onClick={() => set('primeiroNome', !briefing.primeiroNome)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: '1.5px solid', borderColor: briefing.primeiroNome ? '#CCEE33' : '#e2e8f0', background: briefing.primeiroNome ? '#fafde7' : '#fff', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: briefing.primeiroNome ? '#CCEE33' : '#cbd5e1', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: briefing.primeiroNome ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{briefing.primeiroNome ? 'Sim' : 'Não'}</span>
            </div>
          </div>

          <div style={s.row1}>
            <label style={s.label}>O que evitar</label>
            <textarea style={s.textarea} placeholder="Palavras, temas ou abordagens que devem ser evitados..." value={briefing.evitar} onChange={e => set('evitar', e.target.value)} />
          </div>

          <div style={s.row1}>
            <label style={s.label}>Exemplo de e-mail que você gosta <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opcional)</span></label>
            <textarea style={s.textarea} placeholder="Cole aqui um e-mail de referência que você gostou do tom, estrutura ou estilo..." value={briefing.exemploEmail} onChange={e => set('exemploEmail', e.target.value)} />
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
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#1a1a1a', borderRadius: '50%', display: 'inline-block', animation: 'ebfspin 0.8s linear infinite' }} />
                  Gerando...
                </>
              ) : '🚀 Gerar sequência de e-mails com IA'}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes ebfspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
