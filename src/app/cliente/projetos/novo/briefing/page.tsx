"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/* ─── Types ─── */
interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface FormData {
  /* Seção 1 — Identificação */
  nomeProjeto: string;
  responsavel: string;
  email: string;
  whatsapp: string;
  cidade: string;
  segmento: string;
  tamanhoEquipe: string;
  /* Seção 2 — Contexto */
  tipoEntrega: string;
  situacaoAtual: string;
  problemaP: string;
  resultadoEsperado: string;
  /* Seção 3 — Funcionalidades */
  descricaoLivre: string;
  features: string[];
  integracoes: string;
  /* Seção 4 — Prazo e Investimento */
  prazoMvp: string;
  faixaInvestimento: string;
  modalidade: string;
  dataLimite: string;
  /* Seção 5 — Observações */
  requisitosCriticos: string;
  referencias: string;
  preocupacoes: string;
}

const INITIAL_FORM: FormData = {
  nomeProjeto: "", responsavel: "", email: "", whatsapp: "", cidade: "", segmento: "", tamanhoEquipe: "",
  tipoEntrega: "", situacaoAtual: "", problemaP: "", resultadoEsperado: "",
  descricaoLivre: "", features: [], integracoes: "",
  prazoMvp: "", faixaInvestimento: "", modalidade: "", dataLimite: "",
  requisitosCriticos: "", referencias: "", preocupacoes: "",
};

const FEATURE_OPTIONS = [
  "Funcionar offline", "Notificações push", "Relatórios/Analytics", "Dashboard",
  "Inteligência Artificial", "GPS / Localização", "Integração ERP", "WhatsApp",
  "Multi-usuário", "Exportação de dados",
];

const ENTREGA_OPTIONS = [
  "App mobile", "Sistema web", "Landing page", "E-commerce", "Dashboard / Painel",
  "Automação de processos", "API / Back-end", "Outro",
];

const INVESTIMENTO_OPTIONS = [
  "Até R$ 5.000", "R$ 5.000 – R$ 15.000", "R$ 15.000 – R$ 30.000",
  "R$ 30.000 – R$ 60.000", "Acima de R$ 60.000", "A definir",
];

const MODALIDADE_OPTIONS = ["Pagamento único", "Mensalidade", "Por sprint", "Híbrido", "A definir"];

const SECTION_CHIPS: Record<number, string[]> = {
  1: ["Meu projeto é sobre...", "Sou do segmento de...", "Somos uma equipe de..."],
  2: ["Preciso de um app que...", "Hoje usamos...", "O maior problema é..."],
  3: ["Precisa funcionar offline", "Quero integrar com WhatsApp", "Preciso de relatórios"],
  4: ["Preciso em 3 meses", "Meu orçamento é de...", "Prefiro pagar por sprint"],
  5: ["É crítico que...", "Tenho referências como...", "Minha preocupação é..."],
};

/* ─── Styles ─── */
const font = (weight: number, size: number, color = "#111") =>
  ({ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: weight, fontSize: size, color }) as const;
const fontInter = (weight: number, size: number, color = "#111") =>
  ({ fontFamily: "'Inter', sans-serif", fontWeight: weight, fontSize: size, color }) as const;

export default function BriefingPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [secao, setSecao] = useState(1);
  const [modo, setModo] = useState<"guided" | "assisted" | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase().auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/cliente"; return; }
      setUserId(data.user.id);
      setForm(f => ({ ...f, email: data.user!.email || "" }));
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ─── Rordens Chat ─── */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/rordens-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs,
          formContext: form,
          secaoAtiva: secao,
          modo,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const payload = line.replace("data: ", "");
          if (payload === "[DONE]") break;
          try {
            const { text: t } = JSON.parse(payload);
            assistantText += t;
            setMessages(prev => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: assistantText };
              return copy;
            });
          } catch {}
        }
      }

      // Parse FIELD tags from response
      const fieldRegex = /\[FIELD:(\w+)\](.*?)\[\/FIELD\]/g;
      let match;
      while ((match = fieldRegex.exec(assistantText)) !== null) {
        const [, field, value] = match;
        setForm(prev => ({ ...prev, [field]: value }));
      }
    } catch (err) {
      console.error("Rordens chat error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Desculpe, tive um problema. Pode repetir?" }]);
    } finally {
      setStreaming(false);
    }
  }, [messages, form, secao, modo, streaming]);

  /* ─── Mode selection ─── */
  const selectMode = (m: "guided" | "assisted") => {
    setModo(m);
    const greeting = m === "guided"
      ? "Ótimo! Vou te guiar pelo briefing. Vamos começar: qual é o nome do seu projeto?"
      : "Perfeito! Preencha o formulário à direita. Se tiver qualquer dúvida, é só me chamar aqui.";
    setMessages([{ role: "assistant", content: greeting }]);
  };

  /* ─── Section validation ─── */
  const isSectionComplete = (s: number): boolean => {
    switch (s) {
      case 1: return !!(form.nomeProjeto && form.responsavel && form.email && form.segmento);
      case 2: return !!(form.tipoEntrega && form.problemaP && form.resultadoEsperado);
      case 3: return !!(form.descricaoLivre || form.features.length > 0);
      case 4: return !!(form.prazoMvp && form.faixaInvestimento);
      case 5: return true; // optional
      default: return false;
    }
  };

  const canAdvance = isSectionComplete(secao);

  const advanceSection = () => {
    if (secao < 5 && canAdvance) {
      setSecao(secao + 1);
      // Scroll form to top
      formRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      if (modo === "guided") {
        const sectionNames = ["", "Identificação", "Contexto", "Funcionalidades", "Prazo e Investimento", "Observações"];
        sendMessage(`Concluí a seção de ${sectionNames[secao]}. Próxima!`);
      }
    }
  };

  /* ─── Export ─── */
  const handleExport = () => {
    const payload = {
      briefing: form,
      arquivos: files.map(f => ({ nome: f.name, tamanho: f.size, tipo: f.type })),
      chat: messages,
      meta: { userId, criadoEm: new Date().toISOString(), modo },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const nome = form.nomeProjeto ? form.nomeProjeto.replace(/\s+/g, "_").toLowerCase() : "projeto";
    const data = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `briefing_voku_${nome}_${data}.json`;
    a.click();
    URL.revokeObjectURL(url);
    // toast
    const toast = document.createElement("div");
    toast.textContent = "Briefing exportado com sucesso!";
    Object.assign(toast.style, {
      position: "fixed", bottom: "24px", right: "24px", background: "#111", color: "#C8F135",
      padding: "14px 24px", borderRadius: "10px", fontWeight: "700", fontSize: "14px",
      fontFamily: "'Inter', sans-serif", zIndex: "9999", animation: "fadeIn 0.3s",
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  /* ─── File handling ─── */
  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter(f => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      return ["png", "jpg", "jpeg", "svg", "pdf", "ai", "fig"].includes(ext || "") && f.size <= 20 * 1024 * 1024;
    });
    setFiles(prev => [...prev, ...valid]);
  };

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleFeature = (f: string) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(f) ? prev.features.filter(x => x !== f) : [...prev.features, f],
    }));
  };

  /* ─── Section labels ─── */
  const SECTIONS = [
    { n: 1, label: "Identificação" },
    { n: 2, label: "Contexto" },
    { n: 3, label: "Funcionalidades" },
    { n: 4, label: "Prazo e Investimento" },
    { n: 5, label: "Observações + Upload" },
  ];

  /* ─── Render helpers ─── */
  const inputStyle = (focused = false): React.CSSProperties => ({
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: `1.5px solid ${focused ? "#111" : "#E8E5DE"}`, background: "#FAF8F3",
    ...font(500, 14), outline: "none", boxSizing: "border-box",
  });

  const labelStyle: React.CSSProperties = { ...font(700, 12, "#6B6B6B"), marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 0.5 };

  const renderInput = (label: string, field: keyof FormData, placeholder: string, type = "text") => (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={form[field] as string}
        onChange={e => updateField(field, e.target.value)}
        placeholder={placeholder}
        style={inputStyle()}
        onFocus={e => (e.target.style.borderColor = "#111")}
        onBlur={e => (e.target.style.borderColor = "#E8E5DE")}
      />
    </div>
  );

  const renderTextarea = (label: string, field: keyof FormData, placeholder: string, rows = 3) => (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={form[field] as string}
        onChange={e => updateField(field, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ ...inputStyle(), resize: "vertical" }}
        onFocus={e => (e.target.style.borderColor = "#111")}
        onBlur={e => (e.target.style.borderColor = "#E8E5DE")}
      />
    </div>
  );

  const renderSelect = (label: string, field: keyof FormData, options: string[], placeholder: string) => (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <select
        value={form[field] as string}
        onChange={e => updateField(field, e.target.value)}
        style={{ ...inputStyle(), appearance: "auto", cursor: "pointer" }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  /* ─── RENDER ─── */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", background: "#FAF8F3" }}>
      {/* ─── TOPBAR ─── */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #E8E5DE",
        padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/cliente/projetos/novo" style={{ ...font(600, 13, "#6B6B6B"), textDecoration: "none" }}>← Voltar</a>
          <span style={{ color: "#D1CCBF" }}>|</span>
          <span style={fontInter(800, 14)}>Novo Briefing</span>
        </div>
        <button
          onClick={handleExport}
          style={{
            ...fontInter(800, 13, "#111"),
            background: "#C8F135", border: "none", borderRadius: 8,
            padding: "8px 20px", cursor: "pointer",
          }}
        >
          Enviar Briefing
        </button>
      </div>

      {/* ─── SPLIT SCREEN ─── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ═══════════ LEFT: CHAT ═══════════ */}
        <div style={{
          width: 400, minWidth: 400, borderRight: "1px solid #E8E5DE",
          display: "flex", flexDirection: "column", background: "#fff",
        }}>
          {/* Chat header */}
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid #E8E5DE",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", flexShrink: 0,
            }} />
            <div>
              <div style={fontInter(800, 14)}>Rordens</div>
              <div style={font(500, 11, "#6B6B6B")}>Coordenador de Prompts</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {!modo ? (
              /* ─── Mode selection cards ─── */
              <div>
                <div style={{ ...font(500, 14, "#111"), marginBottom: 16, lineHeight: 1.6 }}>
                  Olá! Sou o <strong>Rordens</strong>, Coordenador de Prompts da VOKU. Vou te ajudar a montar o briefing do seu projeto. Como prefere começar?
                </div>
                {[
                  { mode: "guided" as const, title: "Responder para o Rordens", desc: "Eu faço as perguntas e preencho o formulário pra você" },
                  { mode: "assisted" as const, title: "Preencher o formulário", desc: "Você preenche direto, eu tiro dúvidas aqui no chat" },
                ].map(opt => (
                  <div
                    key={opt.mode}
                    onClick={() => selectMode(opt.mode)}
                    style={{
                      background: "#FAF8F3", border: "1.5px solid #E8E5DE", borderRadius: 10,
                      padding: "14px 16px", marginBottom: 10, cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#C8F135")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "#E8E5DE")}
                  >
                    <div style={fontInter(700, 13)}>{opt.title}</div>
                    <div style={font(400, 12, "#6B6B6B")}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                      background: m.role === "user" ? "#111" : "#FAF8F3",
                      padding: "10px 14px", borderRadius: 12, maxWidth: "85%",
                      ...font(500, 13, m.role === "user" ? "#fff" : "#111"),
                      lineHeight: 1.6, whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.content.replace(/\[FIELD:\w+\].*?\[\/FIELD\]/g, "").trim() || m.content}
                  </div>
                ))}
                {streaming && messages.length > 0 && messages[messages.length - 1].role !== "assistant" && (
                  <div style={{ alignSelf: "flex-start", background: "#FAF8F3", padding: "10px 14px", borderRadius: 12, ...font(500, 13, "#6B6B6B") }}>
                    ...
                  </div>
                )}
              </>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestion chips */}
          {modo && (
            <div style={{ padding: "8px 20px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid #F0EDE6" }}>
              {(SECTION_CHIPS[secao] || []).map(chip => (
                <button
                  key={chip}
                  onClick={() => setInput(chip)}
                  style={{
                    ...font(500, 11, "#6B6B6B"), background: "#FAF8F3", border: "1px solid #E8E5DE",
                    borderRadius: 20, padding: "5px 12px", cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {modo && (
            <div style={{
              padding: "12px 20px", borderTop: "1px solid #E8E5DE",
              display: "flex", gap: 8,
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="Escreva para o Rordens..."
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 8,
                  border: "1.5px solid #E8E5DE", ...font(500, 13), outline: "none",
                  background: "#FAF8F3",
                }}
                onFocus={e => (e.target.style.borderColor = "#111")}
                onBlur={e => (e.target.style.borderColor = "#E8E5DE")}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={streaming || !input.trim()}
                style={{
                  ...fontInter(800, 13, "#111"), background: "#C8F135",
                  border: "none", borderRadius: 8, padding: "0 18px",
                  cursor: streaming ? "wait" : "pointer", opacity: streaming || !input.trim() ? 0.5 : 1,
                }}
              >
                Enviar
              </button>
            </div>
          )}
        </div>

        {/* ═══════════ RIGHT: FORM ═══════════ */}
        <div ref={formRef} style={{ flex: 1, overflowY: "auto", padding: "24px 40px 80px" }}>
          {/* Section nav */}
          <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
            {SECTIONS.map(s => {
              const complete = isSectionComplete(s.n);
              const active = secao === s.n;
              const locked = s.n > secao && !complete;
              return (
                <button
                  key={s.n}
                  onClick={() => { if (!locked) setSecao(s.n); }}
                  disabled={locked}
                  style={{
                    ...fontInter(active ? 800 : 600, 12, active ? "#111" : complete ? "#111" : "#6B6B6B"),
                    background: complete ? "#C8F135" : active ? "#fff" : "transparent",
                    border: active ? "1.5px solid #111" : "1.5px solid #E8E5DE",
                    borderRadius: 8, padding: "6px 14px", cursor: locked ? "not-allowed" : "pointer",
                    opacity: locked ? 0.4 : 1, display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {complete && <span style={{ fontSize: 11 }}>✓</span>}
                  {s.n}. {s.label}
                </button>
              );
            })}
          </div>

          {/* ─── Section 1: Identificação ─── */}
          <SectionWrapper n={1} active={secao} label="Identificação" complete={isSectionComplete(1)}>
            {renderInput("Nome do Projeto", "nomeProjeto", "Ex: App de delivery para restaurantes")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {renderInput("Responsável", "responsavel", "Seu nome completo")}
              {renderInput("E-mail", "email", "contato@empresa.com", "email")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {renderInput("WhatsApp", "whatsapp", "(11) 99999-9999", "tel")}
              {renderInput("Cidade", "cidade", "São Paulo - SP")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {renderInput("Segmento", "segmento", "Ex: Alimentação, Saúde, Educação...")}
              {renderSelect("Tamanho da equipe", "tamanhoEquipe", ["Só eu", "2-5 pessoas", "6-15 pessoas", "16-50 pessoas", "50+ pessoas"], "Selecione...")}
            </div>
          </SectionWrapper>

          {/* ─── Section 2: Contexto ─── */}
          <SectionWrapper n={2} active={secao} label="Contexto" complete={isSectionComplete(2)}>
            {renderSelect("Tipo de Entrega", "tipoEntrega", ENTREGA_OPTIONS, "O que você precisa?")}
            {renderTextarea("Situação Atual", "situacaoAtual", "Como funciona hoje? Usa alguma ferramenta?")}
            {renderTextarea("Problema Principal", "problemaP", "Qual dor você quer resolver?")}
            {renderTextarea("Resultado Esperado", "resultadoEsperado", "O que o sucesso desse projeto significa pra você?")}
          </SectionWrapper>

          {/* ─── Section 3: Funcionalidades ─── */}
          <SectionWrapper n={3} active={secao} label="Funcionalidades" complete={isSectionComplete(3)}>
            {renderTextarea("Descreva livremente", "descricaoLivre", "O que o sistema/app precisa fazer? Conte como se estivesse explicando a um amigo.", 4)}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Funcionalidades desejadas</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {FEATURE_OPTIONS.map(f => {
                  const checked = form.features.includes(f);
                  return (
                    <button
                      key={f}
                      onClick={() => toggleFeature(f)}
                      style={{
                        ...font(checked ? 700 : 500, 12, checked ? "#111" : "#6B6B6B"),
                        background: checked ? "#FAF8F3" : "#fff",
                        border: `1.5px solid ${checked ? "#111" : "#E8E5DE"}`,
                        borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {checked && <span style={{ marginRight: 4 }}>✓</span>}{f}
                    </button>
                  );
                })}
              </div>
            </div>
            {renderInput("Integrações", "integracoes", "Ex: Stripe, Google Maps, API interna...")}
          </SectionWrapper>

          {/* ─── Section 4: Prazo e Investimento ─── */}
          <SectionWrapper n={4} active={secao} label="Prazo e Investimento" complete={isSectionComplete(4)}>
            {renderSelect("Prazo para MVP", "prazoMvp", ["1 mês", "2-3 meses", "3-6 meses", "6-12 meses", "Sem pressa"], "Em quanto tempo precisa?")}
            {renderSelect("Faixa de Investimento", "faixaInvestimento", INVESTIMENTO_OPTIONS, "Quanto pretende investir?")}
            {renderSelect("Modalidade", "modalidade", MODALIDADE_OPTIONS, "Como prefere pagar?")}
            {renderInput("Data Limite", "dataLimite", "Se houver um deadline rígido", "date")}
          </SectionWrapper>

          {/* ─── Section 5: Observações + Upload ─── */}
          <SectionWrapper n={5} active={secao} label="Observações + Upload" complete={isSectionComplete(5)}>
            {renderTextarea("Requisitos Críticos", "requisitosCriticos", "Algo que não pode faltar de jeito nenhum?")}
            {renderTextarea("Referências", "referencias", "Links, apps ou sites que te inspiram")}
            {renderTextarea("Preocupações", "preocupacoes", "Algo que te preocupa nesse projeto?")}

            {/* Drag & drop zone */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Arquivos</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "#C8F135" : "#E8E5DE"}`,
                  borderRadius: 12, padding: "32px 20px", textAlign: "center",
                  cursor: "pointer", background: dragOver ? "#fafff0" : "#FAF8F3",
                  transition: "all 0.2s",
                }}
              >
                <div style={font(600, 13, "#6B6B6B")}>Arraste arquivos aqui ou clique para selecionar</div>
                <div style={font(400, 11, "#aaa")}>PNG, JPG, SVG, PDF, AI, Figma — até 20MB</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.svg,.pdf,.ai,.fig"
                  style={{ display: "none" }}
                  onChange={e => handleFiles(e.target.files)}
                />
              </div>
              {files.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "#fff", border: "1px solid #E8E5DE", borderRadius: 8, padding: "8px 12px",
                    }}>
                      <span style={font(500, 12)}>{f.name} ({(f.size / 1024).toFixed(0)} KB)</span>
                      <button
                        onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 16 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              onClick={handleExport}
              style={{
                ...fontInter(900, 16, "#111"), background: "#C8F135", border: "none",
                borderRadius: 10, padding: 16, width: "100%", cursor: "pointer", marginTop: 8,
              }}
            >
              Enviar Briefing →
            </button>
          </SectionWrapper>

          {/* Advance button (non-last sections) */}
          {secao < 5 && (
            <button
              onClick={advanceSection}
              disabled={!canAdvance}
              style={{
                ...fontInter(800, 14, "#111"), background: canAdvance ? "#C8F135" : "#E8E5DE",
                border: "none", borderRadius: 10, padding: "14px 28px", cursor: canAdvance ? "pointer" : "not-allowed",
                marginTop: 8, opacity: canAdvance ? 1 : 0.5,
              }}
            >
              Avançar para {SECTIONS[secao]?.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Section wrapper component ─── */
function SectionWrapper({ n, active, label, complete, children }: {
  n: number; active: number; label: string; complete: boolean; children: React.ReactNode;
}) {
  const isActive = active === n;
  const isLocked = n > active && !complete;
  const isDone = complete && n < active;

  return (
    <div style={{
      background: isActive ? "#fff" : "transparent",
      borderLeft: isActive ? "3px solid #C8F135" : isDone ? "3px solid #E8E5DE" : "3px solid transparent",
      borderRadius: 12,
      padding: isActive ? "20px 24px" : "12px 24px",
      marginBottom: 16,
      opacity: isLocked ? 0.4 : isDone ? 0.7 : 1,
      pointerEvents: isLocked ? "none" : "auto",
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isActive ? 16 : 0 }}>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 13,
          color: isDone ? "#111" : isActive ? "#111" : "#6B6B6B",
        }}>
          {n}. {label}
        </span>
        {isDone && (
          <span style={{
            background: "#C8F135", color: "#111", fontFamily: "'Inter', sans-serif",
            fontWeight: 800, fontSize: 10, padding: "2px 10px", borderRadius: 20,
          }}>
            ✓ Concluído
          </span>
        )}
      </div>
      {isActive && children}
    </div>
  );
}
