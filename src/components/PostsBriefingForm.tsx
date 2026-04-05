'use client';

import { useState, useRef } from 'react';
import ColorExtractor, { type CoreExtraida, type DesignacoesCores } from './ColorExtractor';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
export interface PostsBriefing {
  // Negócio
  nome_marca:     string;
  segmento:       string;
  publico:        string;
  objetivo:       string[];
  descricao:      string;
  // Conteúdo
  quantidade:     number;
  pilares:        string[];
  formatos:       string[];
  hashtags:       string;
  referencias:    string;
  // Tom & Visual
  tom:            string;
  estilo_visual:  string;
  cor_primaria:   string;
  cor_secundaria: string;
  logo_base64:    string;
  visao_imagem:   string;
  observacoes:    string;
}

interface PostsBriefingFormProps {
  onSubmit: (data: PostsBriefing) => void;
  loading?: boolean;
  prefill?: Partial<PostsBriefing>;
  onStepChange?: (step: number) => void;
}

// ─────────────────────────────────────────────
// PILARES DE CONTEÚDO
// ─────────────────────────────────────────────
const PILARES = [
  'Educativo',
  'Bastidores',
  'Depoimentos',
  'Produto / Serviço',
  'Entretenimento',
  'Inspiracional',
  'Dicas rápidas',
  'Tendências',
  'Perguntas & Respostas',
  'Promoções',
];

// ─────────────────────────────────────────────
// FORMATOS
// ─────────────────────────────────────────────
const FORMATOS = [
  { id: 'post_estatico', label: 'Post estático', desc: 'Imagem única com legenda' },
  { id: 'carrossel',     label: 'Carrossel',     desc: 'Múltiplos slides deslizáveis' },
  { id: 'reels',         label: 'Reels / Vídeo', desc: 'Roteiro para vídeo curto' },
  { id: 'stories',       label: 'Stories',       desc: 'Sequência de stories' },
];

// ─────────────────────────────────────────────
// OBJETIVOS
// ─────────────────────────────────────────────
const OBJETIVOS = [
  'Aumentar seguidores',
  'Gerar engajamento',
  'Vender produto/serviço',
  'Educar a audiência',
  'Fortalecer a marca',
  'Gerar leads',
];

// ─────────────────────────────────────────────
// TONS DE VOZ
// ─────────────────────────────────────────────
const TONS = [
  { id: 'direto',        label: 'Direto & Assertivo' },
  { id: 'inspiracional', label: 'Inspiracional' },
  { id: 'educativo',     label: 'Educativo & Científico' },
  { id: 'premium',       label: 'Premium & Exclusivo' },
  { id: 'descontraido',  label: 'Descontraído' },
  { id: 'urgente',       label: 'Urgência & Conversão' },
];

// ─────────────────────────────────────────────
// ESTILOS VISUAIS
// ─────────────────────────────────────────────
const ESTILOS = [
  { id: 'moderno',     label: 'Moderno & Bold',     desc: 'Cores vibrantes, tipografia grande' },
  { id: 'clean',       label: 'Clean & Minimalista',  desc: 'Muito espaço, elegante' },
  { id: 'colorido',    label: 'Colorido & Fun',     desc: 'Múltiplas cores, energia jovem' },
  { id: 'corporativo', label: 'Corporativo',        desc: 'Profissional, confiável' },
  { id: 'editorial',   label: 'Editorial',          desc: 'Inspirado em revistas' },
  { id: 'luxury',      label: 'Premium & Luxury',   desc: 'Dourado, preto, exclusivo' },
];

// ─────────────────────────────────────────────
// PALETAS
// ─────────────────────────────────────────────
const PALETTES = [
  { name: 'Voku',      primary: '#CCEE33', secondary: '#0a0a0a' },
  { name: 'Oceano',    primary: '#0EA5E9', secondary: '#0f172a' },
  { name: 'Esmeralda', primary: '#10B981', secondary: '#064e3b' },
  { name: 'Roxo',      primary: '#8B5CF6', secondary: '#1e1b4b' },
  { name: 'Coral',     primary: '#F97316', secondary: '#1c1917' },
  { name: 'Rosa',      primary: '#EC4899', secondary: '#1a0a14' },
  { name: 'Dourado',   primary: '#F59E0B', secondary: '#1c1107' },
  { name: 'Neutro',    primary: '#334155', secondary: '#f8fafc' },
];

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function PostsBriefingForm({ onSubmit, loading = false, prefill, onStepChange }: PostsBriefingFormProps) {
  const [step, setStep] = useState(1);
  const [paletaCores, setPaletaCores] = useState<CoreExtraida[]>([]);
  const [designacoes, setDesignacoes] = useState<DesignacoesCores>({});
  const [briefing, setBriefing] = useState<PostsBriefing>({
    nome_marca:     prefill?.nome_marca ?? '',
    segmento:       prefill?.segmento ?? '',
    publico:        prefill?.publico ?? '',
    objetivo:       prefill?.objetivo ?? [],
    descricao:      prefill?.descricao ?? '',
    quantidade:     4,
    pilares:        prefill?.pilares ?? [],
    formatos:       prefill?.formatos ?? [],
    hashtags:       prefill?.hashtags ?? '',
    referencias:    prefill?.referencias ?? '',
    tom:            prefill?.tom ?? 'direto',
    estilo_visual:  prefill?.estilo_visual ?? 'moderno',
    cor_primaria:   prefill?.cor_primaria ?? '#CCEE33',
    cor_secundaria: prefill?.cor_secundaria ?? '#0a0a0a',
    logo_base64:    prefill?.logo_base64 ?? '',
    visao_imagem:   prefill?.visao_imagem ?? '',
    observacoes:    prefill?.observacoes ?? '',
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const TOTAL_STEPS = 3;

  function set(key: keyof PostsBriefing, value: string | number) {
    setBriefing(b => ({ ...b, [key]: value }));
  }

  function toggleArray(key: 'objetivo' | 'pilares' | 'formatos', value: string) {
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

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBriefing(b => ({ ...b, logo_base64: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function canProceed() {
    if (step === 1) return !!(briefing.nome_marca && briefing.publico && briefing.objetivo.length > 0);
    if (step === 2) return briefing.pilares.length > 0 && briefing.formatos.length > 0;
    return true;
  }

  function handleSubmit() {
    if (!canProceed()) return;
    onSubmit(briefing);
  }

  // ── Estilos base (idênticos ao LandingBriefingForm) ──
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
    btnPrimary: { background: '#111', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' } as React.CSSProperties,
    btnSecondary: { background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', padding: '12px 24px', borderRadius: 9, fontSize: 14, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
  };

  return (
    <div style={s.wrap}>

      {/* HEADER + STEPS */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {step === 1 ? 'Sobre o negócio' : step === 2 ? 'Conteúdo & Formatos' : 'Tom & Visual'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              Passo {step} de {TOTAL_STEPS}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ width: n === step ? 24 : 8, height: 4, borderRadius: 2, background: n === step ? '#111' : n < step ? '#111' : '#ddd', transition: 'all 0.3s' }} />
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
              <input style={s.input} placeholder="Ex: Nike, Voku, Minha Empresa" value={briefing.nome_marca} onChange={e => set('nome_marca', e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Segmento</label>
              <input style={s.input} placeholder="Ex: Alimentação, Saúde, Tecnologia" value={briefing.segmento} onChange={e => set('segmento', e.target.value)} />
            </div>
          </div>

          <div style={s.row1}>
            <label style={s.label}>Público-alvo *</label>
            <input style={s.input} placeholder="Ex: Mulheres 25-40 anos, empreendedoras, interessadas em saúde" value={briefing.publico} onChange={e => set('publico', e.target.value)} />
          </div>

          <div style={s.row1}>
            <label style={s.label}>Objetivo dos posts * <span style={{ fontWeight: 400, color: '#94a3b8' }}>(pode escolher mais de um)</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {OBJETIVOS.map(obj => {
                const selected = briefing.objetivo.includes(obj);
                return (
                  <div
                    key={obj}
                    onClick={() => toggleArray('objetivo', obj)}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid', borderColor: selected ? '#111' : '#e2e8f0', background: selected ? '#f8f8f5' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: selected ? '#111' : '#374151', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid', borderColor: selected ? '#111' : '#cbd5e1', background: selected ? '#111' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {selected && <span style={{ fontSize: 10, color: '#fff', fontWeight: 900 }}>✓</span>}
                    </div>
                    {obj}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={s.row1}>
            <label style={s.label}>Descrição do negócio</label>
            <textarea style={s.textarea} placeholder="Conte sobre o que sua empresa faz, principais produtos/serviços e diferenciais. Quanto mais detalhes, melhor o resultado." value={briefing.descricao} onChange={e => set('descricao', e.target.value)} />
          </div>
        </div>
      )}

      {/* ── STEP 2: CONTEÚDO ─────────────────────────── */}
      {step === 2 && (
        <div style={s.body}>

          {/* Pilares */}
          <div style={s.row1}>
            <label style={s.label}>Pilares de conteúdo * <span style={{ fontWeight: 400, color: '#94a3b8' }}>(escolha pelo menos 1)</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {PILARES.map(p => {
                const selected = briefing.pilares.includes(p);
                return (
                  <div
                    key={p}
                    onClick={() => toggleArray('pilares', p)}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid', borderColor: selected ? '#111' : '#e2e8f0', background: selected ? '#f8f8f5' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: selected ? '#111' : '#374151', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid', borderColor: selected ? '#111' : '#cbd5e1', background: selected ? '#111' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {selected && <span style={{ fontSize: 10, color: '#fff', fontWeight: 900 }}>✓</span>}
                    </div>
                    {p}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formatos */}
          <div style={s.row1}>
            <label style={s.label}>Formatos desejados * <span style={{ fontWeight: 400, color: '#94a3b8' }}>(escolha pelo menos 1)</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {FORMATOS.map(f => {
                const selected = briefing.formatos.includes(f.id);
                return (
                  <div
                    key={f.id}
                    onClick={() => toggleArray('formatos', f.id)}
                    style={{ padding: '14px 16px', borderRadius: 10, border: '1.5px solid', borderColor: selected ? '#111' : '#e2e8f0', background: selected ? '#f8f8f5' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: selected ? '#111' : '#0f172a' }}>{f.label}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hashtags */}
          <div style={s.row1}>
            <label style={s.label}>Hashtags principais (separadas por vírgula)</label>
            <input style={s.input} placeholder="Ex: #marketing, #empreendedorismo, #dicasdesaude" value={briefing.hashtags} onChange={e => set('hashtags', e.target.value)} />
          </div>

          {/* Referências */}
          <div style={s.row1}>
            <label style={s.label}>Referências</label>
            <textarea style={s.textarea} placeholder="Perfis que você admira, posts que te inspiram, links de exemplo..." value={briefing.referencias} onChange={e => set('referencias', e.target.value)} />
          </div>
        </div>
      )}

      {/* ── STEP 3: TOM & VISUAL ─────────────────────── */}
      {step === 3 && (
        <div style={s.body}>

          {/* Tom */}
          <div style={s.row1}>
            <label style={s.label}>Tom da comunicação</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {TONS.map(t => (
                <div
                  key={t.id}
                  onClick={() => set('tom', t.id)}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px solid', borderColor: briefing.tom === t.id ? '#111' : '#e2e8f0', background: briefing.tom === t.id ? '#f8f8f5' : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: briefing.tom === t.id ? '#111' : '#0f172a' }}>{t.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Estilo visual */}
          <div style={s.row1}>
            <label style={s.label}>Estilo visual dos posts</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {ESTILOS.map(e => (
                <div
                  key={e.id}
                  onClick={() => set('estilo_visual', e.id)}
                  style={{ padding: '14px 16px', borderRadius: 10, border: '1.5px solid', borderColor: briefing.estilo_visual === e.id ? '#111' : '#e2e8f0', background: briefing.estilo_visual === e.id ? '#f8f8f5' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: briefing.estilo_visual === e.id ? '#111' : '#0f172a' }}>{e.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{e.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Logo */}
          <div style={s.row1}>
            <label style={s.label}>Logo da marca</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ width: 80, height: 80, borderRadius: 12, border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: '#f8fafc', flexShrink: 0 }}
              >
                {briefing.logo_base64
                  ? <img src={briefing.logo_base64} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                  : <span style={{ fontSize: 28, opacity: 0.4 }}>📁</span>
                }
              </div>
              <div>
                <button onClick={() => fileRef.current?.click()} style={{ ...s.btnSecondary, padding: '8px 20px', fontSize: 13 }}>
                  {briefing.logo_base64 ? 'Trocar logo' : 'Fazer upload do logo'}
                </button>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>PNG, SVG ou JPG</p>
                {briefing.logo_base64 && (
                  <button onClick={() => setBriefing(b => ({ ...b, logo_base64: '' }))} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
                    Remover
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
            </div>
          </div>

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

            {/* Quick palette presets */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 8 }}>Ou use uma paleta pronta:</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PALETTES.map(p => (
                  <button
                    key={p.name}
                    onClick={() => setBriefing(b => ({ ...b, cor_primaria: p.primary, cor_secundaria: p.secondary }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '5px 10px', borderRadius: 20, cursor: 'pointer',
                      background: briefing.cor_primaria === p.primary ? '#f0f0f0' : '#fff',
                      border: briefing.cor_primaria === p.primary ? '1.5px solid #111' : '1px solid #e2e8f0',
                      fontSize: 11, fontWeight: 600, color: '#374151', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.primary }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.secondary }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visão de imagem */}
          <div style={{ ...s.row1, background: '#fafde7', border: '1.5px solid #d9f99d', borderRadius: 12, padding: '16px 18px' }}>
            <label style={{ ...s.label, color: '#3f6212', marginBottom: 4 }}>Que cena você imagina nas imagens?</label>
            <p style={{ fontSize: 12, color: '#4d7c0f', margin: '0 0 10px', lineHeight: 1.5 }}>Descreva de forma simples — Ex: mulher usando o produto em casa pela manhã.</p>
            <textarea style={{ ...s.textarea, minHeight: 72, border: '1.5px solid #bbf451', background: '#fff' }} placeholder='Descreva a cena que você imagina para as imagens' value={briefing.visao_imagem} onChange={e => set('visao_imagem', e.target.value)} />
          </div>

          {/* Observações */}
          <div style={s.row1}>
            <label style={s.label}>Observações finais</label>
            <textarea style={s.textarea} placeholder="Algo mais que devemos saber? Restrições, palavras proibidas, datas importantes..." value={briefing.observacoes} onChange={e => set('observacoes', e.target.value)} />
          </div>

          {/* Resumo */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Resumo do briefing</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Marca', value: briefing.nome_marca },
                { label: 'Público', value: briefing.publico },
                { label: 'Objetivos', value: briefing.objetivo.join(', ') },
                { label: 'Quantidade', value: `${briefing.quantidade} posts` },
                { label: 'Pilares', value: briefing.pilares.join(', ') },
                { label: 'Tom', value: TONS.find(t => t.id === briefing.tom)?.label || '' },
                { label: 'Cena', value: briefing.visao_imagem },
              ].map(({ label, value }) => value ? (
                <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0, minWidth: 72 }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{value}</span>
                </div>
              ) : null)}
            </div>
          </div>

          <div style={{ background: '#fafde7', border: '1px solid #d9f99d', borderRadius: 10, padding: '14px 18px', marginTop: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#3f6212', marginBottom: 4 }}>O que será gerado</p>
              <p style={{ fontSize: 13, color: '#4d7c0f', margin: 0, lineHeight: 1.6 }}>
                A IA vai criar {briefing.quantidade} posts completos: hook, legenda, hashtags e prompt de imagem para cada um. Incluindo 3 variações para você escolher.
              </p>
            </div>
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
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#1a1a1a', borderRadius: '50%', display: 'inline-block', animation: 'pbfspin 0.8s linear infinite' }} />
                  Gerando...
                </>
              ) : 'Gerar posts'}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes pbfspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
