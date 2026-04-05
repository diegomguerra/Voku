"use client";
import { useState, useRef, useEffect, useCallback } from "react";

/* ─── Types ─── */
interface Msg {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;       // blob URL for preview
  imageBase64?: string;    // base64 for API
  imageMediaType?: string; // MIME type
  fileName?: string;       // file attachment name
  fileSize?: number;       // file attachment size
}

interface RordensPanelProps {
  produto: string;
  produtoLabel: string;
  passo: number;
  formContext?: string;
  chips?: string[];
  status?: "briefing" | "producao" | "aguardando_aprovacao" | "concluido";
  orderId?: string;
  onExecute?: (action: any) => void;
  onHandleDetected?: (handle: string) => void;
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
    1: ["O que é segmento?", "Posso ter mais de um público?", "Não tenho segmento definido"],
    2: ["O que é estrutura narrativa?", "Quantos slides é o ideal?", "Qual objetivo converte mais?"],
    3: ["O que é CTA?", "Pode escrever no meu estilo", "Quero algo mais direto"],
  },
  email_sequence: {
    1: ["O que é sequência de e-mails?", "Meu lead veio de anúncio", "Ainda não tenho lista"],
    2: ["Qual sequência converte mais?", "O que é onboarding?", "Posso vender logo no primeiro e-mail?"],
    3: ["O que é tom persuasivo?", "Como evitar spam?", "Pode escrever em meu nome"],
  },
  reels_script: {
    1: ["Reels para produto ou pessoa?", "Qual rede social?", "Nunca gravei antes"],
    2: ["Qual duração performa melhor?", "Posso não aparecer?", "Não tenho tema definido"],
    3: ["O que são cortes?", "Preciso de legenda?", "Pode ser mais dinâmico"],
    4: ["Qual estilo fica melhor?", "Quanto tempo leva?", "O vídeo é meu para usar comercialmente?"],
  },
  ad_copy: {
    1: ["O que são diferenciais?", "Vendo produto físico", "Sou prestador de serviço"],
    2: ["Qual ângulo converte mais?", "Posso usar mais de um ângulo?", "Não tenho oferta ainda"],
    3: ["O que o Meta bloqueia?", "Como funciona prova social?", "Pode ser mais agressivo"],
  },
  content_pack: {
    1: ["O que são pilares de conteúdo?", "Quantos posts por semana?", "Meu público é..."],
    2: ["Qual formato engaja mais?", "Posso misturar formatos?", "Quero mais carrosséis"],
    3: ["O que é tom de voz?", "Não tenho logo ainda", "Quero algo mais sério"],
  },
};

/* ─── Helpers ─── */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/* ─── CSS keyframes ─── */
const RORDENS_CSS = `
@keyframes rordens-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.15)}}
@keyframes rordens-dot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
`;

export default function RordensPanel({ produto, produtoLabel, passo, formContext, chips, status, orderId, onExecute, onHandleDetected }: RordensPanelProps) {
  const [modo, setModo] = useState<"chat" | "form" | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ base64: string; mediaType: string; url: string } | null>(null);
  const [imagensReferencia, setImagensReferencia] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

  /* Ctrl+V paste image */
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find(item => item.type.startsWith("image/"));
      if (!imageItem) return;
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      // If not in chat mode yet, auto-activate
      if (!modo) selectMode("chat");

      const base64 = await fileToBase64(file);
      const url = URL.createObjectURL(file);
      setPendingImage({ base64, mediaType: file.type, url });
      textareaRef.current?.focus();
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo]);

  const activeChips = chips || PRODUCT_CHIPS[produto]?.[passo] || PRODUCT_CHIPS[produto]?.[1] || [];

  const selectMode = (m: "chat" | "form") => {
    setModo(m);
    setMessages([{ role: "assistant", content: `Cole o @ da marca ou me conte sobre o projeto. Você também pode enviar logo, prints e referências visuais.` }]);
  };

  // Auto-start in chat mode
  useEffect(() => {
    if (!modo && status !== "concluido") selectMode("chat");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(async (text: string, image?: { base64: string; mediaType: string; url: string }) => {
    if ((!text.trim() && !image) || streaming) return;

    const userMsg: Msg = {
      role: "user",
      content: text.trim() || (image ? "O que você vê nessa imagem?" : ""),
      ...(image && { imageUrl: image.url, imageBase64: image.base64, imageMediaType: image.mediaType }),
    };
    // Accumulate image references for briefing
    if (image?.base64) {
      setImagensReferencia(prev => [...prev, image.base64]);
    }
    // Detect @handle in user text
    const handleMatch = text.match(/@([a-zA-Z0-9_.]{2,30})/);
    if (handleMatch && onHandleDetected) {
      onHandleDetected(handleMatch[1]);
    }

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setPendingImage(null);
    setStreaming(true);

    try {
      // Detect URL in user text — scrape site for brand context
      const urlMatch = text.match(/https?:\/\/[^\s]+/i);
      let siteContext = "";
      if (urlMatch) {
        try {
          const scrapeRes = await fetch("/api/extract-colors-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: urlMatch[0] }),
          });
          const scrapeData = await scrapeRes.json();
          if (scrapeData.cores?.length > 0) {
            const colorList = scrapeData.cores.map((c: any) => `${c.hex} (${c.nome})`).join(", ");
            siteContext = `\n\n[CONTEXTO EXTRAÍDO DO SITE ${urlMatch[0]}]\nCores encontradas: ${colorList}\nUse essas cores como referência da identidade visual da marca.`;
          }
        } catch {}
      }

      // Also detect @handle — try to use as Instagram context
      const atMatch = text.match(/@([a-zA-Z0-9_.]{2,30})/);
      if (atMatch) {
        siteContext += `\n\n[HANDLE DETECTADO: @${atMatch[1]}]\nO usuário informou o perfil @${atMatch[1]}. Pergunte sobre o negócio e crie o briefing baseado nesse perfil.`;
      }

      // Build API payload
      const apiMessages = newMsgs.map((m, idx) => ({
        role: m.role,
        content: idx === newMsgs.length - 1 && siteContext ? m.content + siteContext : m.content,
      }));

      const res = await fetch("/api/rordens-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          formContext,
          produto,
          passo,
          modo,
          ...(image && {
            imagem: { base64: image.base64, mediaType: image.mediaType },
          }),
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
      // Check if assistant response contains an execute action
      if (onExecute && assistantText) {
        const actionIdx = assistantText.indexOf('"action"');
        if (actionIdx !== -1) {
          let start = assistantText.lastIndexOf("{", actionIdx);
          if (start !== -1) {
            let depth = 0, end = -1;
            for (let i = start; i < assistantText.length; i++) {
              if (assistantText[i] === "{") depth++;
              else if (assistantText[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
            }
            if (end !== -1) {
              try {
                const parsed = JSON.parse(assistantText.slice(start, end + 1));
                if (parsed.action === "execute") {
                  if (imagensReferencia.length > 0 && parsed.structured_data) {
                    parsed.structured_data.imagens_referencia = imagensReferencia;
                  }
                  onExecute(parsed);
                }
              } catch { /* not valid JSON */ }
            }
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Desculpe, tive um problema. Pode repetir?" }]);
    } finally {
      setStreaming(false);
    }
  }, [messages, formContext, produto, passo, modo, streaming, imagensReferencia, onExecute, onHandleDetected]);

  /* ─── File upload handler ─── */
  const handleFiles = async (files: FileList) => {
    if (!modo) selectMode("chat");

    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024) {
        const base64 = await fileToBase64(file);
        const url = URL.createObjectURL(file);
        // Send image message directly
        await sendMessage(
          `Recebi essa imagem (${file.name}). O que você identifica que pode ser útil para o briefing?`,
          { base64, mediaType: file.type, url }
        );
      } else if (file.size <= 20 * 1024 * 1024) {
        // Non-image file — show as attachment chip
        const fileMsg: Msg = {
          role: "user",
          content: `Arquivo enviado: ${file.name}`,
          fileName: file.name,
          fileSize: file.size,
        };
        setMessages(prev => [...prev, fileMsg]);
        // Notify Rordens
        await sendMessage(`O cliente subiu o arquivo "${file.name}" (${formatFileSize(file.size)}). Confirme o recebimento.`);
      }
    }
  };

  /* ─── Microphone ─── */
  const toggleGravacao = async () => {
    if (gravando) {
      mediaRecorderRef.current?.stop();
      setGravando(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        recorder.ondataavailable = e => chunksRef.current.push(e.data);
        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          stream.getTracks().forEach(t => t.stop());
          // Transcribe
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = (reader.result as string).split(",")[1];
            try {
              const res = await fetch("/api/transcribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audio: base64, mediaType: "audio/webm" }),
              });
              const data = await res.json();
              if (data.texto) {
                setInput(prev => prev + (prev ? " " : "") + data.texto);
                textareaRef.current?.focus();
              }
            } catch {
              setMessages(prev => [
                ...prev,
                { role: "assistant", content: "Não consegui transcrever o áudio. Tente digitar sua mensagem." },
              ]);
            }
          };
          reader.readAsDataURL(blob);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setGravando(true);
      } catch {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: "Não consegui acessar o microfone. Verifique as permissões do navegador." },
        ]);
      }
    }
  };

  /* ─── Send with pending image ─── */
  const handleSend = () => {
    sendMessage(input, pendingImage || undefined);
  };

  const canSend = input.trim() || pendingImage;

  return (
    <>
      <style>{RORDENS_CSS}</style>
      <div style={{
        minWidth: 380, background: "#111", borderRight: "1px solid #222",
        display: "flex", flexDirection: "column", height: "100%",
      }}>
        {/* ─── Header ─── */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #222",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 12, color: "#111",
          }}>R</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 13, color: "#fff" }}>Rordens</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 6 }}>
              Coordenador de Prompts · Voku
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: "#4ade80",
                animation: "rordens-pulse 2s ease-in-out infinite",
              }} />
            </div>
          </div>
        </div>

        {/* ─── Messages ─── */}
        <div style={{
          flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10,
        }} className="rordens-scroll">
          {status === "concluido" && !modo ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{
                padding: "10px 14px", borderRadius: "4px 12px 12px 12px",
                background: "#1a1a1a", border: "1px solid #2a2a2a", maxWidth: 300,
                fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#e8e8e8", lineHeight: 1.6,
              }}>
                Projeto concluído. O conteúdo aprovado está disponível para download.
              </div>
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
                  {/* Image preview */}
                  {m.imageUrl && (
                    <div style={{ marginBottom: 4 }}>
                      <img src={m.imageUrl} alt="" style={{
                        width: "100%", maxWidth: 240, borderRadius: 10, display: "block",
                      }} />
                    </div>
                  )}

                  {/* File attachment chip */}
                  {m.fileName && !m.imageUrl && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: "#1a1a1a", border: "1px solid #333",
                      borderRadius: 8, padding: "8px 12px", marginBottom: 4,
                    }}>
                      <span style={{ fontSize: 11, color: "#555", fontWeight: 700 }}>FILE</span>
                      <div>
                        <div style={{ fontSize: 12, color: "#e8e8e8", fontWeight: 500 }}>{m.fileName}</div>
                        {m.fileSize && (
                          <div style={{ fontSize: 10, color: "#666" }}>{formatFileSize(m.fileSize)}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Text bubble */}
                  {m.content && (
                    <div style={{
                      background: m.role === "user" ? "#fff" : "#1a1a1a",
                      border: m.role === "user" ? "1px solid #333" : "1px solid #2a2a2a",
                      color: m.role === "user" ? "#111" : "#e8e8e8",
                      padding: "10px 14px",
                      borderRadius: m.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13.5, lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                    }}>
                      {m.content}
                    </div>
                  )}
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
        {(() => {
          const concludedChips = ["Iniciar novo projeto", "Baixar novamente", "Solicitar ajuste"];
          const showConcludedChips = status === "concluido" && !modo;
          const chipsToShow = showConcludedChips ? concludedChips : activeChips;
          const shouldShow = showConcludedChips || (modo && chipsToShow.length > 0);
          if (!shouldShow) return null;
          return (
            <div style={{
              padding: "8px 16px", display: "flex", gap: 6, flexWrap: "wrap",
              borderTop: "1px solid #1a1a1a",
            }}>
              {chipsToShow.map(chip => (
                <button
                  key={chip}
                  onClick={() => {
                    if (showConcludedChips) {
                      selectMode("chat");
                      setTimeout(() => sendMessage(chip), 100);
                    } else {
                      setInput(chip); textareaRef.current?.focus();
                    }
                  }}
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#888",
                    background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 20,
                    padding: "5px 12px", cursor: "pointer", whiteSpace: "nowrap",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#888"; }}
                >
                  {chip}
                </button>
              ))}
            </div>
          );
        })()}

        {/* ─── Pending image preview ─── */}
        {pendingImage && (
          <div style={{ padding: "6px 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <img src={pendingImage.url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid #333" }} />
            <span style={{ fontSize: 11, color: "#888", flex: 1 }}>Imagem pronta para enviar</span>
            <button onClick={() => setPendingImage(null)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
        )}

        {/* ─── Input area: [+] [mic] [textarea] [→] ─── */}
        <div style={{
            padding: "10px 14px", borderTop: "1px solid #222",
            display: "flex", alignItems: "flex-end", gap: 8, flexShrink: 0,
          }}>
            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Enviar arquivo ou imagem"
              style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "#1a1a1a", border: "1px solid #333",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, transition: "border-color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#333")}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="#888" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.ai,.svg,.fig,.sketch"
              onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
              style={{ display: "none" }}
            />

            {/* Microphone button */}
            <button
              onClick={toggleGravacao}
              title={gravando ? "Parar gravação" : "Gravar áudio"}
              style={{
                width: 34, height: 34, borderRadius: "50%",
                background: gravando ? "#fff" : "#1a1a1a",
                border: `1px solid ${gravando ? "#fff" : "#333"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z"
                  stroke={gravando ? "#111" : "#888"} strokeWidth="2" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8"
                  stroke={gravando ? "#111" : "#888"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={pendingImage ? "Adicione uma pergunta sobre a imagem..." : "Escreva para o Rordens... (Ctrl+V para colar imagem)"}
              rows={1}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 10,
                background: "#1a1a1a", border: "1px solid #2a2a2a",
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13.5, color: "#e8e8e8",
                outline: "none", resize: "none", maxHeight: 100, lineHeight: 1.5,
              }}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={streaming || !canSend}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: canSend ? "#fff" : "#1a1a1a",
                border: "none", cursor: canSend && !streaming ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.15s",
                opacity: streaming ? 0.4 : 1,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6"
                  stroke={canSend ? "#111" : "#555"}
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
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
