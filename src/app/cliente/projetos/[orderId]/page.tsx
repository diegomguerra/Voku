"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

/* ── Design tokens ── */
const C = {
  lime: "#AAFF00",
  ink: "#111111",
  ink2: "#333333",
  bg: "#FFFFFF",
  surface: "#F4F4F1",
  border: "#E8E8E4",
  mid: "#D0D0CA",
  muted: "#888884",
};
const FF = "'Plus Jakarta Sans', sans-serif";
const FFH = "'DM Serif Display', serif";

/* ── Types ── */
type Phase = "briefing" | "generating" | "preview" | "approved";
type StepState = "done" | "active" | "pending";
interface Message {
  role: "bot" | "user";
  text: string;
  quickReplies?: { label: string; primary?: boolean; action?: string }[];
}
interface Post {
  hook: string;
  caption: string;
  hashtags: string;
  pilar: string;
  tipo: string;
  dia: string;
  imageUrl?: string;
}

/* ── Briefing flow ── */
const FLOW: {
  bot: string;
  collect?: string;
  final?: boolean;
  quickReplies?: { label: string; primary?: boolean; action?: string }[];
}[] = [
  {
    bot: "Ola! Sou o **RORDENS**, assistente da Voku. Vou criar seu **Social Media Pack** de 12 posts.\n\nPrimeira pergunta: sobre o que e o seu negocio ou projeto?",
  },
  {
    collect: "negocio",
    bot: "Entendido. Quem e o seu **publico**? Quem voce quer atingir com esses posts?",
  },
  {
    collect: "publico",
    bot: "Perfeito. Qual e o **objetivo principal** — crescer seguidores, vender ou educar?",
  },
  {
    collect: "objetivo",
    bot: "Otimo. Qual e o **tom de voz** que voce quer? Ex: direto e ousado, inspirador, tecnico...",
  },
  {
    collect: "tom",
    bot: "Ultima pergunta: voce tem alguma **referencia de post ou conta** que admira?",
  },
  {
    collect: "referencia",
    final: true,
    bot: "Briefing completo! Vou gerar o **post de amostra** agora — aparece ao vivo no painel ao lado.",
    quickReplies: [{ label: "Gerar meu post →", primary: true, action: "generate" }],
  },
];

const FALLBACK_POST: Post = {
  hook: "O segredo que ninguem te conta sobre engajamento",
  caption:
    "A maioria dos perfis morre no silencio porque publica sem estrategia.\n\nNao e sobre postar todo dia — e sobre postar certo.\n\nCada legenda precisa ter:\n1. Um gancho que para o scroll\n2. Valor real em 3 linhas\n3. CTA que converte\n\nSalva esse post e aplica hoje.",
  hashtags: "#marketing #socialmedia #engajamento #estrategia #voku #conteudo",
  pilar: "Educativo",
  tipo: "Carrossel",
  dia: "Segunda",
};

/* ── Inline SVG icons ── */
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#ccc" strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#ccc" strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#ccc" strokeWidth="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#ccc" strokeWidth="1.5" />
    </svg>
  );
}

/* ── Simple markdown bold ── */
function renderBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} style={{ fontWeight: 800 }}>{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

/* ── CSS keyframes (injected once) ── */
const KEYFRAMES = `
@keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
@keyframes spin   { to{transform:rotate(360deg)} }
@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
`;

/* ══════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function ProjetoPage() {
  const { orderId } = useParams<{ orderId: string }>();

  /* ── State ── */
  const [phase, setPhase] = useState<Phase>("briefing");
  const [stepStates, setStepStates] = useState<StepState[]>(["done", "active", "pending", "pending"]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [briefingAnswers, setBriefingAnswers] = useState<Record<string, string>>({});
  const [post, setPost] = useState<Post | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [micActive, setMicActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [flowIdx, setFlowIdx] = useState(0);
  const [previewTitle, setPreviewTitle] = useState("Area de Previa");
  const [previewSub, setPreviewSub] = useState("O post gerado aparece aqui ao confirmar o briefing");
  const [progress, setProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Nav steps config ── */
  const NAV_STEPS = [
    { number: 1, label: "Cadastro" },
    { number: 2, label: "Briefing" },
    { number: 3, label: "Geracao" },
    { number: 4, label: "Aprovacao" },
  ];

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* ── Start flow on mount ── */
  useEffect(() => {
    addBotMessage(FLOW[0].bot, FLOW[0].quickReplies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Bot message with typing delay ── */
  const addBotMessage = useCallback((text: string, quickReplies?: Message["quickReplies"]) => {
    setIsTyping(true);
    const delay = Math.min(300 + text.length * 4, 900);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "bot", text, quickReplies }]);
    }, delay);
  }, []);

  /* ── Handle user send ── */
  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isTyping || phase !== "briefing") return;
    setInputValue("");

    setMessages((prev) => [...prev, { role: "user", text }]);

    const nextIdx = flowIdx + 1;
    if (nextIdx < FLOW.length) {
      const step = FLOW[nextIdx];
      if (step.collect) {
        setBriefingAnswers((prev) => ({ ...prev, [step.collect!]: text }));
      }
      addBotMessage(step.bot, step.quickReplies);
      setFlowIdx(nextIdx);
    }
  }, [inputValue, isTyping, phase, flowIdx, addBotMessage]);

  /* ── Handle quick reply ── */
  const handleReply = useCallback(
    (r: { label: string; action?: string }) => {
      if (r.action === "generate") {
        generate();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [briefingAnswers]
  );

  /* ── Generate preview ── */
  const generate = useCallback(async () => {
    setPhase("generating");
    setStepStates(["done", "done", "active", "pending"]);
    setPreviewTitle("Gerando copy e imagem...");
    setPreviewSub("IA escrevendo + foto realista sendo criada");
    setProgress(0);

    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) { clearInterval(progressTimer); return 90; }
        return p + Math.random() * 15;
      });
    }, 400);

    let result: Post | null = null;
    try {
      const res = await fetch("/api/gerar-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...briefingAnswers, order_id: orderId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          result = {
            hook: data.post?.hook || FALLBACK_POST.hook,
            caption: data.post?.caption || FALLBACK_POST.caption,
            hashtags: data.post?.hashtags || FALLBACK_POST.hashtags,
            pilar: data.post?.pilar || FALLBACK_POST.pilar,
            tipo: data.post?.tipo || FALLBACK_POST.tipo,
            dia: data.post?.dia || FALLBACK_POST.dia,
            imageUrl: data.image?.url,
          };
        }
      }
    } catch (_) {
      /* fallback */
    }

    clearInterval(progressTimer);
    setProgress(100);

    if (!result) result = FALLBACK_POST;

    setTimeout(() => {
      setPost(result);
      setPhase("preview");
      setStepStates(["done", "done", "done", "active"]);
      setPreviewTitle("Amostra — Post 1 de 12");
      setPreviewSub("Legenda e hashtags completas abaixo");
    }, 300);
  }, [briefingAnswers, orderId]);

  /* ── Approve ── */
  const approveAll = useCallback(() => {
    setPhase("approved");
    setStepStates(["done", "done", "done", "done"]);
    setPreviewTitle("Pedido aprovado!");
    setPreviewSub("Seus 12 posts estao sendo finalizados");
    addBotMessage("Pedido aprovado! Seus **12 posts completos** estao sendo finalizados. Voce recebe tudo em breve.");
  }, [addBotMessage]);

  /* ── Request revision ── */
  const requestRevision = useCallback(() => {
    addBotMessage("Sem problema! Me diz o que ajustar — tom, estilo, assunto?");
    setPhase("briefing");
    setStepStates(["done", "done", "active", "pending"]);
  }, [addBotMessage]);

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        style={{
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: FF,
          background: C.bg,
        }}
      >
        {/* ── NAV DARK ── */}
        <nav
          style={{
            height: 52,
            background: C.ink,
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontWeight: 900,
              color: C.lime,
              fontSize: 13,
              letterSpacing: "0.05em",
              marginRight: 24,
            }}
          >
            VOKU
          </span>
          {NAV_STEPS.map((s, i) => {
            const state = stepStates[i];
            return (
              <div key={s.number} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && <div style={{ width: 24, height: 1, background: "#222" }} />}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0 12px",
                    height: 52,
                    fontSize: 11,
                    fontWeight: 500,
                    color: state === "active" ? C.lime : "#3a3a3a",
                    borderBottom: state === "active" ? `2px solid ${C.lime}` : "2px solid transparent",
                  }}
                >
                  <div
                    style={{
                      width: 19,
                      height: 19,
                      borderRadius: "50%",
                      background:
                        state === "done" ? "#252525" : state === "active" ? C.lime : "transparent",
                      border: `1.5px solid ${
                        state === "done" ? "#303030" : state === "active" ? C.lime : "#333"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 800,
                      color: state === "done" ? "#555" : state === "active" ? C.ink : "#333",
                    }}
                  >
                    {state === "done" ? "✓" : s.number}
                  </div>
                  {s.label}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── BODY: CHAT + PREVIEW ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* ── CHAT COLUMN ── */}
          <div
            style={{
              width: 380,
              flexShrink: 0,
              borderRight: `1px solid ${C.border}`,
              display: "flex",
              flexDirection: "column",
              background: C.bg,
            }}
          >
            {/* Chat header */}
            <div
              style={{
                padding: "13px 16px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: 11,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: C.ink,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 900,
                  color: C.lime,
                }}
              >
                V
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>RORDENS</div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 1,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: C.lime,
                      animation: "pulse 2s ease-in-out infinite",
                    }}
                  />
                  online agora
                </div>
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 9px",
                  background: "#F0F0EA",
                  color: C.ink2,
                  borderRadius: 20,
                }}
              >
                POSTS #{orderId?.toString().slice(0, 6) || "---"}
              </div>
            </div>

            {/* Messages area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {messages.map((msg, i) =>
                msg.role === "bot" ? (
                  <div key={i} style={{ animation: "fadeUp 0.3s ease" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: C.ink,
                          color: C.lime,
                          fontSize: 9,
                          fontWeight: 900,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        V
                      </div>
                      <div
                        style={{
                          maxWidth: "82%",
                          padding: "10px 14px",
                          fontSize: 12.5,
                          lineHeight: 1.65,
                          background: C.surface,
                          color: C.ink,
                          borderRadius: "4px 16px 16px 16px",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {renderBold(msg.text)}
                      </div>
                    </div>
                    {msg.quickReplies && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 5, paddingLeft: 34 }}>
                        {msg.quickReplies.map((r, ri) => (
                          <button
                            key={ri}
                            onClick={() => handleReply(r)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 20,
                              fontSize: 11.5,
                              fontWeight: 700,
                              border: `1.5px solid ${r.primary ? C.lime : C.mid}`,
                              background: r.primary ? C.lime : C.bg,
                              color: C.ink,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: "row-reverse", animation: "fadeUp 0.2s ease" }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: C.lime,
                        color: C.ink,
                        fontSize: 9,
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      D
                    </div>
                    <div
                      style={{
                        maxWidth: "82%",
                        padding: "10px 14px",
                        fontSize: 12.5,
                        lineHeight: 1.65,
                        background: C.ink,
                        color: "#F8F8F4",
                        borderRadius: "16px 16px 4px 16px",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                )
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: C.ink,
                      color: C.lime,
                      fontSize: 9,
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    V
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "11px 14px",
                      background: C.surface,
                      borderRadius: "4px 16px 16px 16px",
                      width: "fit-content",
                    }}
                  >
                    {[0, 0.18, 0.36].map((delay, i) => (
                      <div
                        key={i}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "#bbb",
                          animation: `bounce 1.2s ease-in-out ${delay}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input row */}
            <div
              style={{
                padding: "11px 13px",
                borderTop: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: 7,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: C.muted,
                  flexShrink: 0,
                }}
              >
                <PlusIcon />
              </button>
              <button
                onClick={() => setMicActive((v) => !v)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: micActive ? C.lime : C.surface,
                  border: `1px solid ${micActive ? C.lime : C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: micActive ? C.ink : C.muted,
                  flexShrink: 0,
                }}
              >
                <MicIcon />
              </button>
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Digite aqui..."
                style={{
                  flex: 1,
                  height: 38,
                  border: `1.5px solid ${C.mid}`,
                  borderRadius: 20,
                  padding: "0 14px",
                  fontSize: 12.5,
                  fontFamily: "inherit",
                  color: C.ink,
                  background: C.bg,
                  outline: "none",
                }}
              />
              <button
                onClick={handleSend}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: C.lime,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ArrowRightIcon />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*,.pdf,.doc,.docx"
              onChange={() => {}}
            />
          </div>

          {/* ── PREVIEW COLUMN ── */}
          <div
            style={{
              flex: 1,
              background: C.surface,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Preview header */}
            <div
              style={{
                padding: "13px 20px",
                background: C.bg,
                borderBottom: `1px solid ${C.border}`,
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{previewTitle}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{previewSub}</div>
              {(phase === "generating" || phase === "preview") && (
                <div
                  style={{
                    height: 3,
                    background: C.border,
                    borderRadius: 2,
                    marginTop: 5,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: C.lime,
                      borderRadius: 2,
                      width: `${Math.min(progress, 100)}%`,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Preview body */}
            {phase === "briefing" && (
              /* ── Estado 1: Empty ── */
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  padding: 40,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 13,
                    background: C.border,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <GridIcon />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink2 }}>Nenhuma previa ainda</div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: C.muted,
                    lineHeight: 1.65,
                    maxWidth: 240,
                  }}
                >
                  Responda o briefing no chat. O primeiro post aparece aqui assim que confirmar.
                </div>
              </div>
            )}

            {phase === "generating" && (
              /* ── Estado 2: Gerando ── */
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    border: `3px solid ${C.border}`,
                    borderTopColor: C.lime,
                    animation: "spin 0.75s linear infinite",
                  }}
                />
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Gerando copy e imagem...</div>
                <div style={{ fontSize: 12, color: C.muted }}>IA escrevendo + foto realista sendo criada</div>
              </div>
            )}

            {(phase === "preview" || phase === "approved") && post && (
              /* ── Estado 3: Post gerado ── */
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Scrollable content */}
                <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      color: C.muted,
                      marginBottom: 12,
                    }}
                  >
                    AMOSTRA — POST 1 DE 12
                  </div>

                  {/* Post card */}
                  <div
                    style={{
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 12,
                      overflow: "hidden",
                      maxWidth: 440,
                      animation: "fadeUp 0.4s ease",
                    }}
                  >
                    {/* Visual area */}
                    <div
                      style={{
                        height: 190,
                        background: C.ink,
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: post.imageUrl ? 0 : 22,
                      }}
                    >
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            fontFamily: FFH,
                            fontStyle: "italic",
                            fontSize: 20,
                            color: "#F8F8F4",
                            lineHeight: 1.3,
                            textAlign: "center",
                          }}
                        >
                          {post.hook}
                        </div>
                      )}
                      <div
                        style={{
                          position: "absolute",
                          top: 11,
                          right: 11,
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          background: C.lime,
                          color: C.ink,
                          padding: "2px 7px",
                          borderRadius: 4,
                        }}
                      >
                        {post.tipo}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          top: 11,
                          left: 11,
                          fontSize: 9,
                          fontWeight: 600,
                          color: post.imageUrl ? "#fff" : "#555",
                          background: post.imageUrl ? "rgba(0,0,0,0.45)" : "transparent",
                          borderRadius: 3,
                          padding: post.imageUrl ? "2px 6px" : 0,
                        }}
                      >
                        {post.imageUrl ? "IA gerada" : post.dia}
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: "16px 18px" }}>
                      <div
                        style={{
                          fontFamily: FFH,
                          fontStyle: "italic",
                          fontSize: 17,
                          fontWeight: 400,
                          color: C.ink,
                          marginBottom: 10,
                        }}
                      >
                        {post.hook}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: C.ink2,
                          lineHeight: 1.75,
                          whiteSpace: "pre-wrap",
                          borderLeft: `2px solid ${C.lime}`,
                          paddingLeft: 11,
                          marginBottom: 12,
                        }}
                      >
                        {post.caption}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
                        Hashtags
                      </div>
                      <div style={{ fontSize: 11, color: "#3a8a3a", lineHeight: 1.9, marginBottom: 12 }}>
                        {post.hashtags}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {[post.pilar, post.tipo, post.dia].filter(Boolean).map((tag, ti) => (
                          <span
                            key={ti}
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: "#F0F0EA",
                              color: C.ink2,
                              letterSpacing: "0.03em",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approve bar — sticky bottom */}
                {phase === "preview" && (
                  <div
                    style={{
                      background: C.bg,
                      borderTop: `1px solid ${C.border}`,
                      padding: "12px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ fontSize: 12, color: C.muted, flex: 1, lineHeight: 1.5 }}>
                      Gostou da direcao? Aprovando, voce recebe os{" "}
                      <strong style={{ color: C.ink }}>12 posts completos</strong> — legendas, hashtags e
                      calendario.
                    </div>
                    <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                      <button
                        onClick={requestRevision}
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: "8px 16px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          border: `1.5px solid ${C.mid}`,
                          background: C.bg,
                          color: C.ink,
                        }}
                      >
                        Ajustar tom
                      </button>
                      <button
                        onClick={approveAll}
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: "8px 16px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          border: `1.5px solid ${C.lime}`,
                          background: C.lime,
                          color: C.ink,
                        }}
                      >
                        Aprovar e receber todos →
                      </button>
                    </div>
                  </div>
                )}

                {phase === "approved" && (
                  <div
                    style={{
                      background: C.ink,
                      padding: "14px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: C.lime,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 900,
                        color: C.ink,
                      }}
                    >
                      ✓
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.lime }}>
                      Pedido aprovado — seus 12 posts estao sendo finalizados
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
