"use client";
import { useState, useRef, useEffect, useCallback } from "react";

/* ─── Types ─── */
interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface RordensPanelProps {
  produto: string;
  produtoLabel: string;
  passo: number;
  formContext?: string;
  chips?: string[];
}

/* ─── Product chip sets ─── */
const PRODUCT_CHIPS: Record<string, Record<number, string[]>> = {
  landing_page_copy: {
    1: ["O que é público-alvo?", "Posso ter mais de um objetivo?", "Não tenho site ainda"],
    2: ["O que é tom de voz?", "Não tenho logo ainda", "Posso subir depois?"],
    3: ["O que são palavras-chave?", "Pode escrever pela minha empresa", "Quero resultado mais direto"],
  },
  post_instagram: {
    1: ["O que é um bom hook?", "Quantas hashtags devo usar?", "Meu público é..."],
  },
  carrossel: {
    1: ["Quantos slides é ideal?", "O que vai no primeiro slide?", "Meu objetivo é..."],
  },
  email_sequence: {
    1: ["Qual frequência de envio?", "Posso usar tom informal?", "Quero vender no último e-mail"],
  },
  reels_script: {
    1: ["Qual duração ideal?", "Preciso de cortes?", "Quero algo mais direto"],
  },
  ad_copy: {
    1: ["Quais ângulos funcionam?", "Meu produto é...", "Quero focar em dor"],
  },
  content_pack: {
    1: ["O que são pilares de conteúdo?", "Quantos posts por semana?", "Meu público é..."],
  },
};

/* ─── CSS keyframes ─── */
const RORDENS_CSS = `
@keyframes rordens-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.15)}}
@keyframes rordens-dot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
`;

export default function RordensPanel({ produto, produtoLabel, passo, formContext, chips }: RordensPanelProps) {
  const [modo, setModo] = useState<"chat" | "form" | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  /* auto-resize textarea */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + "px";
    }
  }, [input]);

  const activeChips = chips || PRODUCT_CHIPS[produto]?.[passo] || PRODUCT_CHIPS[produto]?.[1] || [];

  const selectMode = (m: "chat" | "form") => {
    setModo(m);
    const greeting = m === "chat"
      ? `Ótimo! Vou te guiar pelo briefing. Vamos começar — me conta sobre o seu negócio e o que você precisa.`
      : `Perfeito! Preencha o formulário ao lado. Qualquer dúvida, é só me chamar aqui.`;
    setMessages([{ role: "assistant", content: greeting }]);
  };

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
        body: JSON.stringify({ messages: newMsgs, formContext, produto, passo, modo }),
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
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Desculpe, tive um problema. Pode repetir?" }]);
    } finally {
      setStreaming(false);
    }
  }, [messages, formContext, produto, passo, modo, streaming]);

  return (
    <>
      <style>{RORDENS_CSS}</style>
      <div style={{
        width: 380, minWidth: 380, background: "#111", borderRight: "1px solid #222",
        display: "flex", flexDirection: "column", height: "100%",
      }}>
        {/* ─── Header ─── */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #222",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", background: "#C8F135",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 12, color: "#111",
          }}>R</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 13, color: "#fff" }}>Rordens</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 6 }}>
              Coordenador de Prompts · Voku
              <div style={{
                width: 7, height: 7, borderRadius: "50%", background: "#C8F135",
                animation: "rordens-pulse 2s ease-in-out infinite",
              }} />
            </div>
          </div>
        </div>

        {/* ─── Messages ─── */}
        <div style={{
          flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10,
        }} className="rordens-scroll">
          {!modo ? (
            /* ─── Mode selection ─── */
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{
                padding: "10px 14px", borderRadius: "4px 12px 12px 12px",
                background: "#1a1a1a", border: "1px solid #2a2a2a", maxWidth: 300,
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13.5, color: "#e8e8e8", lineHeight: 1.6,
              }}>
                Olá! Sou o <strong style={{ color: "#C8F135" }}>Rordens</strong>, coordenador de prompts da Voku. Vou te ajudar a montar o briefing de <strong style={{ color: "#C8F135" }}>{produtoLabel}</strong>. Como você prefere trabalhar?
              </div>

              {[
                { mode: "chat" as const, icon: "💬", title: "Responder para o Rordens", desc: "Eu faço as perguntas e preencho o formulário" },
                { mode: "form" as const, icon: "📋", title: "Preencher o formulário", desc: "Você preenche direto, eu tiro dúvidas" },
              ].map(opt => (
                <div
                  key={opt.mode}
                  onClick={() => selectMode(opt.mode)}
                  style={{
                    background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10,
                    padding: "12px 14px", cursor: "pointer", transition: "border-color 0.15s",
                    maxWidth: 300,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#C8F135")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{opt.icon}</span>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13, color: "#fff" }}>{opt.title}</span>
                  </div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#666", marginTop: 4, marginLeft: 24 }}>
                    {opt.desc}
                  </div>
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
                    maxWidth: 300,
                  }}
                >
                  <div style={{
                    background: m.role === "user" ? "#C8F135" : "#1a1a1a",
                    border: m.role === "user" ? "none" : "1px solid #2a2a2a",
                    color: m.role === "user" ? "#111" : "#e8e8e8",
                    padding: "10px 14px",
                    borderRadius: m.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13.5, lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {/* Typing indicator */}
              {streaming && messages.length > 0 && messages[messages.length - 1].role !== "assistant" && (
                <div style={{
                  alignSelf: "flex-start", background: "#1a1a1a", border: "1px solid #2a2a2a",
                  borderRadius: "4px 12px 12px 12px", padding: "12px 16px",
                  display: "flex", gap: 5,
                }}>
                  {[0, 0.15, 0.3].map((d, i) => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: "50%", background: "#444",
                      animation: `rordens-dot 1.2s ease-in-out ${d}s infinite`,
                    }} />
                  ))}
                </div>
              )}
            </>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ─── Chips ─── */}
        {modo && activeChips.length > 0 && (
          <div style={{
            padding: "8px 16px", display: "flex", gap: 6, flexWrap: "wrap",
            borderTop: "1px solid #1a1a1a",
          }}>
            {activeChips.map(chip => (
              <button
                key={chip}
                onClick={() => { setInput(chip); textareaRef.current?.focus(); }}
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#888",
                  background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 20,
                  padding: "5px 12px", cursor: "pointer", whiteSpace: "nowrap",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#C8F135"; e.currentTarget.style.color = "#C8F135"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#888"; }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* ─── Input ─── */}
        {modo && (
          <div style={{
            padding: "12px 16px", borderTop: "1px solid #222",
            display: "flex", alignItems: "flex-end", gap: 8, flexShrink: 0,
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Escreva para o Rordens..."
              rows={1}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10,
                background: "#1a1a1a", border: "1px solid #2a2a2a",
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13.5, color: "#e8e8e8",
                outline: "none", resize: "none", maxHeight: 100, lineHeight: 1.5,
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={streaming || !input.trim()}
              style={{
                width: 36, height: 36, borderRadius: 8, background: "#C8F135",
                border: "none", cursor: streaming ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: streaming || !input.trim() ? 0.4 : 1, flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Custom scrollbar CSS */}
      <style>{`
        .rordens-scroll::-webkit-scrollbar { width: 3px; }
        .rordens-scroll::-webkit-scrollbar-track { background: transparent; }
        .rordens-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>
    </>
  );
}
