'use client';

import { useState } from 'react';
import ColorExtractor, { type CoreExtraida, type DesignacoesCores } from './ColorExtractor';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
export interface CarrosselBriefing {
  nomeMarca: string;
  segmento: string;
  publicoAlvo: string;
  tema: string;
  objetivo: string;
  numeroSlides: number;
  estrutura: string;
  tomVoz: string;
  incluirCTA: boolean;
  ctaTexto: string;
  evitar: string;
  cor_primaria: string;
  cor_secundaria: string;
}

interface Props {
  onSubmit: (data: CarrosselBriefing) => void;
  loading?: boolean;
  prefill?: Partial<CarrosselBriefing>;
  onStepChange?: (step: number) => void;
}

// ─────────────────────────────────────────────
// OPÇÕES
// ─────────────────────────────────────────────
const OBJETIVOS = [
  'Educar e posicionar como autoridade',
  'Apresentar um produto ou serviço',
  'Contar uma história ou caso de sucesso',
  'Listar dicas práticas (listicle)',
  'Quebrar uma objeção comum',
  'Gerar engajamento e salvar',
];

const ESTRUTURAS = [
  'Problema → causa → solução → CTA',
  'Lista numerada (1, 2, 3...)',
  'Antes vs. depois',
  'Pergunta → desenvolvimento → resposta',
  'Tese → argumentos → conclusão',
];

const TONS = [
  'Profissional e direto',
  'Descontraído e próximo',
  'Inspirador',
  'Educativo e detalhista',
  'Provocativo',
  'Elegante',
];

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function CarrosselBriefingForm({ onSubmit, loading = false, prefill, onStepChange }: Props) {
  const [step, setStep] = useState(1);
  const [paletaCores, setPaletaCores] = useState<CoreExtraida[]>([]);
  const [designacoes, setDesignacoes] = useState<DesignacoesCores>({});
  const [briefing, setBriefing] = useState<CarrosselBriefing>({
    nomeMarca:      prefill?.nomeMarca ?? '',
    segmento:       prefill?.segmento ?? '',
    publicoAlvo:    prefill?.publicoAlvo ?? '',
    tema:           prefill?.tema ?? '',
    objetivo:       prefill?.objetivo ?? '',
    numeroSlides:   prefill?.numeroSlides ?? 7,
    estrutura:      prefill?.estrutura ?? '',
    tomVoz:         prefill?.tomVoz ?? '',
    incluirCTA:     prefill?.incluirCTA ?? true,
    ctaTexto:       prefill?.ctaTexto ?? '',
    evitar:         prefill?.evitar ?? '',
    cor_primaria:   prefill?.cor_primaria ?? '#CCEE33',
    cor_secundaria: prefill?.cor_secundaria ?? '#0a0a0a',
  });

  const TOTAL_STEPS = 3;

  function set<K extends keyof CarrosselBriefing>(key: K, value: CarrosselBriefing[K]) {
    setBriefing(b => ({ ...b, [key]: value }));
  }

  function goToStep(n: number) {
    setStep(n);
    onStepChange?.(n);
  }

  function canProceed() {
    if (step === 1) return !!(briefing.nomeMarca && briefing.segmento && briefing.publicoAlvo);
    if (step === 2) return !!(briefing.tema && briefing.objetivo && briefing.estrutura);
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
              {step === 1 ? '📑 Sobre a marca' : step === 2 ? '🎠 O carrossel' : '🎨 Estilo e CTA'}
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

      {/* ── STEP 1: SOBRE A MARCA ──────────────────────── */}
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
        </div>
      )}

      {/* ── STEP 2: O CARROSSEL ────────────────────────── */}
      {step === 2 && (
        <div style={s.body}>
          <div style={s.row1}>
            <label style={s.label}>Tema do carrossel *</label>
            <textarea style={s.textarea} placeholder="Sobre o que será o carrossel? Descreva o assunto principal, a ideia central..." value={briefing.tema} onChange={e => set('tema', e.target.value)} />
          </div>

          <div style={s.row2}>
            <div>
              <label style={s.label}>Objetivo *</label>
              <select style={{ ...s.input, appearance: 'auto', cursor: 'pointer' }} value={briefing.objetivo} onChange={e => set('objetivo', e.target.value)}>
                <option value="">Selecione...</option>
                {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Número de slides</label>
              <select style={{ ...s.input, appearance: 'auto', cursor: 'pointer' }} value={briefing.numeroSlides} onChange={e => set('numeroSlides', Number(e.target.value))}>
                <option value={5}>5 slides</option>
                <option value={7}>7 slides</option>
                <option value={9}>9 slides</option>
                <option value={11}>11 slides</option>
              </select>
            </div>
          </div>

          <div style={s.row1}>
            <label style={s.label}>Estrutura *</label>
            <select style={{ ...s.input, appearance: 'auto', cursor: 'pointer' }} value={briefing.estrutura} onChange={e => set('estrutura', e.target.value)}>
              <option value="">Selecione...</option>
              {ESTRUTURAS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* ── STEP 3: ESTILO E CTA ──────────────────────── */}
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
            <label style={s.label}>Incluir CTA (chamada para ação)?</label>
            <div onClick={() => set('incluirCTA', !briefing.incluirCTA)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: '1.5px solid', borderColor: briefing.incluirCTA ? '#CCEE33' : '#e2e8f0', background: briefing.incluirCTA ? '#fafde7' : '#fff', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: briefing.incluirCTA ? '#CCEE33' : '#cbd5e1', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: briefing.incluirCTA ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{briefing.incluirCTA ? 'Sim' : 'Não'}</span>
            </div>
          </div>

          {briefing.incluirCTA && (
            <div style={s.row1}>
              <label style={s.label}>Texto do CTA</label>
              <input style={s.input} placeholder="Ex: Salve este post, Comente sua dúvida, Link na bio..." value={briefing.ctaTexto} onChange={e => set('ctaTexto', e.target.value)} />
            </div>
          )}

          {/* Paleta de cores via ColorExtractor */}
          <div style={s.row1}>
            <label style={s.label}>Paleta de cores da marca</label>
            <ColorExtractor
              cores={paletaCores}
              designacoes={designacoes}
              onChange={cores => setPaletaCores(cores)}
              onDesignacoes={d => {
                setDesignacoes(d);
                setBriefing(b => ({
                  ...b,
                  cor_primaria:   d.primaria   ?? b.cor_primaria,
                  cor_secundaria: d.secundaria ?? b.cor_secundaria,
                }));
              }}
            />
          </div>

          <div style={s.row1}>
            <label style={s.label}>O que evitar</label>
            <textarea style={s.textarea} placeholder="Palavras, temas ou abordagens que devem ser evitados..." value={briefing.evitar} onChange={e => set('evitar', e.target.value)} />
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
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#1a1a1a', borderRadius: '50%', display: 'inline-block', animation: 'cbfspin 0.8s linear infinite' }} />
                  Gerando...
                </>
              ) : '🚀 Gerar carrossel com IA'}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes cbfspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
