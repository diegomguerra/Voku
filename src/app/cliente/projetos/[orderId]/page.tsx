"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/hooks/useUserContext";

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
  role: "user" | "assistant";
  content: string;
  preview?: any;
}
interface Post {
  type?: string;
  hook?: string;
  headline?: string;
  caption?: string;
  body?: string;
  hashtags?: string[] | string;
  cover_title?: string;
  cover_subtitle?: string;
  hero_headline?: string;
  hero_subheadline?: string;
  value_prop?: string;
  subject?: string;
  first_paragraph?: string;
  first_15s?: string;
  name?: string;
  features?: string[];
  imageUrl?: string;
}

/* ── Preview extraction ── */
function parsePreviewFromContent(text: string): { cleanText: string; preview: any | null } {
  const match = text.match(/___PREVIEW___([\s\S]*?)___END___/);
  if (!match) return { cleanText: text, preview: null };
  try {
    const preview = JSON.parse(match[1].trim());
    const cleanText = text.replace(/___PREVIEW___[\s\S]*?___END___/g, "").trim();
    return { cleanText, preview };
  } catch {
    return { cleanText: text, preview: null };
  }
}

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

/* ── CSS keyframes ── */
const KEYFRAMES = `
@keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
@keyframes spin   { to{transform:rotate(360deg)} }
@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
`;

/* ── Product label for preview ── */
function previewLabel(type?: string): string {
  const map: Record<string, string> = {
    post_instagram: "POST INSTAGRAM",
    carrossel: "CARROSSEL",
    landing_page_copy: "LANDING PAGE",
    email_sequence: "E-MAIL",
    ad_copy: "ANÚNCIO",
    reels_script: "REELS",
    content_pack: "PACK DE CONTEÚDO",
    app: "APP",
  };
  return map[type || ""] || "CONTEÚDO";
}

/* ══════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function ProjetoPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { ctx } = useUserContext();

  /* ── State ── */
  const [phase, setPhase] = useState<Phase>("briefing");
  const [stepStates, setStepStates] = useState<StepState[]>(["done", "active", "pending", "pending"]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [micActive, setMicActive] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("Área de Prévia");
  const [previewSub, setPreviewSub] = useState("O post gerado aparece aqui ao confirmar o briefing");
  const [progress, setProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userIdRef = useRef<string | null>(null);

  /* ── Nav steps config ── */
  const NAV_STEPS = [
    { number: 1, label: "Cadastro" },
    { number: 2, label: "Briefing" },
    { number: 3, label: "Geração" },
    { number: 4, label: "Aprovação" },
  ];

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  /* ── Load user + chat history on mount ── */
  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(async ({ data: authData }) => {
      if (!authData.user) return;
      userIdRef.current = authData.user.id;

      // Load existing chat messages
      const { data: msgs } = await sb
        .from("chat_messages")
        .select("*")
        .eq("user_id", authData.user.id)
        .eq("channel", "project_" + orderId)
        .order("created_at", { ascending: true });

      if (msgs && msgs.length > 0) {
        const loaded: Message[] = msgs.map((m: any) => {
          const { cleanText, preview } = parsePreviewFromContent(m.content || "");
          return { role: m.role, content: cleanText, preview: preview || undefined };
        });
        setMessages(loaded);
        // Check if there's already a preview in history
        const lastPreview = [...loaded].reverse().find(m => m.preview);
        if (lastPreview?.preview) {
          setPost(lastPreview.preview);
          setPhase("preview");
          setStepStates(["done", "done", "done", "active"]);
          setPreviewTitle("Amostra — " + previewLabel(lastPreview.preview.type));
          setPreviewSub("Legenda e hashtags completas abaixo");
          setProgress(100);
        }
      }
    });
  }, [orderId]);

  /* ── Persist message to DB ── */
  const persistMessage = useCallback(async (role: string, content: string) => {
    if (!userIdRef.current) return;
    const sb = supabase();
    await sb.from("chat_messages").insert({
      user_id: userIdRef.current,
      role,
      content,
      channel: "project_" + orderId,
    });
  }, [orderId]);

  /* ── Handle execute action (create order) ── */
  const handleExecuteAction = useCallback(async (action: any) => {
    setPhase("approved");
    setStepStates(["done", "done", "done", "done"]);
    setPreviewTitle("Pedido aprovado!");
    setPreviewSub("Seus posts estão sendo finalizados com imagens reais");

    try {
      const sb = supabase();
      const { data: sessionData } = await sb.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;

      await fetch("/api/execute-product", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          product: action.product,
          structured_data: action.structured_data,
          order_id: orderId,
        }),
      });
    } catch (err) {
      console.error("Execute error:", err);
    }
  }, [orderId]);

  /* ── Send message via voku-chat with SSE streaming ── */
  const sendMessage = useCallback(async (text?: string) => {
    const userText = text || inputValue.trim();
    if (!userText || chatLoading) return;
    setInputValue("");

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setChatLoading(true);
    await persistMessage("user", userText);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const res = await fetch(`${supabaseUrl}/functions/v1/voku-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          user_context: {
            name: ctx?.name || "você",
            plan: ctx?.plan || "free",
            credits: ctx?.credits ?? 0,
            channel: "project",
            user_id: userIdRef.current,
          },
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream") && res.body) {
        // ─── SSE Streaming ───
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        const streamIdx = newMessages.length;
        setMessages([...newMessages, { role: "assistant", content: "" }]);

        let finalAction: any = null;
        let finalPreview: any = null;
        let finalCleanText = "";
        let fullTextRaw = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              try {
                const evt = JSON.parse(payload);
                if (evt.type === "delta" && evt.text) {
                  accumulated += evt.text;
                  // Detect preview starting
                  if (accumulated.includes("___PREVIEW___") && phase !== "generating") {
                    setPhase("generating");
                    setStepStates(["done", "done", "active", "pending"]);
                    setPreviewTitle("Gerando copy e imagem...");
                    setPreviewSub("IA escrevendo + foto realista sendo criada");
                    setProgress(0);
                    // Animate progress
                    const timer = setInterval(() => {
                      setProgress(p => { if (p >= 90) { clearInterval(timer); return 90; } return p + Math.random() * 12; });
                    }, 400);
                  }
                  // Hide partial ___PREVIEW___ and action JSON from display
                  let displayText = accumulated.replace(/___PREVIEW___[\s\S]*$/g, "");
                  // Strip action JSON block (find last {"action" and remove from there)
                  const actionIdx = displayText.lastIndexOf('{"action"');
                  if (actionIdx !== -1) displayText = displayText.slice(0, actionIdx).trim();
                  setMessages(prev => {
                    const copy = [...prev];
                    copy[streamIdx] = { role: "assistant", content: displayText };
                    return copy;
                  });
                }
                if (evt.type === "done") {
                  finalCleanText = evt.text || accumulated;
                  finalAction = evt.action || null;
                  finalPreview = evt.preview || null;
                  fullTextRaw = evt.fullText || accumulated;
                }
              } catch { /* skip */ }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Fallback if "done" never arrived
        if (!finalCleanText && accumulated) {
          const { cleanText: fbClean, preview: fbPreview } = parsePreviewFromContent(accumulated);
          finalCleanText = fbClean.replace(/\{[\s\S]*"action"[\s\S]*\}/g, "").trim();
          finalPreview = finalPreview || fbPreview;
          fullTextRaw = fullTextRaw || accumulated;
        }

        // Finalize
        const withReply: Message[] = [
          ...newMessages,
          { role: "assistant", content: finalCleanText || "Ops, a conexão caiu. Tenta de novo!", preview: finalPreview || undefined },
        ];
        setMessages(withReply);
        await persistMessage("assistant", fullTextRaw || finalCleanText);

        // Show preview
        if (finalPreview) {
          setPost(finalPreview);
          setPhase("preview");
          setStepStates(["done", "done", "done", "active"]);
          setPreviewTitle("Amostra — " + previewLabel(finalPreview.type));
          setPreviewSub("Legenda e hashtags completas abaixo");
          setProgress(100);
        }

        // Execute action
        if (finalAction?.action === "execute") {
          await handleExecuteAction(finalAction);
        }
      } else {
        // ─── Non-streaming fallback ───
        const data = await res.json();
        const reply = data?.content?.[0]?.text || "Ops, tive um problema. Pode repetir?";
        const fullTextRaw = data?.fullText || reply;
        const { cleanText: noPreview, preview: parsedPreview } = parsePreviewFromContent(reply);
        const cleanReply = noPreview.replace(/\{[\s\S]*"action"[\s\S]*\}/g, "").trim();
        const preview = parsedPreview || data?.preview || null;

        const withReply: Message[] = [
          ...newMessages,
          { role: "assistant", content: cleanReply, preview: preview || undefined },
        ];
        setMessages(withReply);
        await persistMessage("assistant", fullTextRaw);

        if (preview) {
          setPost(preview);
          setPhase("preview");
          setStepStates(["done", "done", "done", "active"]);
          setPreviewTitle("Amostra — " + previewLabel(preview.type));
          setPreviewSub("Legenda e hashtags completas abaixo");
          setProgress(100);
        }

        if (data?.action?.action === "execute") {
          await handleExecuteAction(data.action);
        }
      }
    } catch {
      const errMsg = "Ops, algo deu errado. Tenta de novo!";
      setMessages([...newMessages, { role: "assistant", content: errMsg }]);
      await persistMessage("assistant", errMsg);
    }

    setChatLoading(false);
  }, [inputValue, chatLoading, messages, ctx, persistMessage, phase, handleExecuteAction]);

  /* ── Approve from preview bar ── */
  const approveAll = useCallback(() => {
    // Send approval message back to chat — the AI will respond with execute action
    sendMessage("Sim, aprovado! Pode gerar tudo.");
  }, [sendMessage]);

  /* ── Request revision from preview bar ── */
  const requestRevision = useCallback(() => {
    sendMessage("Quero ajustar o tom. Pode refazer?");
  }, [sendMessage]);

  /* ── Get display values from preview ── */
  const postHook = post?.hook || post?.headline || post?.cover_title || post?.hero_headline || post?.subject || post?.name || "";
  const postCaption = post?.caption || post?.body || post?.value_prop || post?.first_paragraph || post?.first_15s || post?.cover_subtitle || post?.hero_subheadline || "";
  const postHashtags = Array.isArray(post?.hashtags) ? post.hashtags.join(" ") : (post?.hashtags || "");
  const postType = previewLabel(post?.type);
  const postFeatures = post?.features || [];

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
          <span style={{ fontWeight: 900, color: C.lime, fontSize: 13, letterSpacing: "0.05em", marginRight: 24 }}>
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
                      width: 19, height: 19, borderRadius: "50%",
                      background: state === "done" ? "#252525" : state === "active" ? C.lime : "transparent",
                      border: `1.5px solid ${state === "done" ? "#303030" : state === "active" ? C.lime : "#333"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 800,
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
              width: 380, flexShrink: 0,
              borderRight: `1px solid ${C.border}`,
              display: "flex", flexDirection: "column", background: C.bg,
            }}
          >
            {/* Chat header */}
            <div
              style={{
                padding: "13px 16px", borderBottom: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 11, flexShrink: 0,
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: C.lime }}>V</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>RORDENS</div>
                <div style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.lime, animation: "pulse 2s ease-in-out infinite" }} />
                  online agora
                </div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", background: "#F0F0EA", color: C.ink2, borderRadius: 20 }}>
                #{orderId?.toString().slice(0, 6) || "---"}
              </div>
            </div>

            {/* Messages area */}
            <div
              style={{
                flex: 1, overflowY: "auto", padding: "16px 14px",
                display: "flex", flexDirection: "column", gap: 12,
              }}
            >
              {messages.map((msg, i) =>
                msg.role === "assistant" ? (
                  <div key={i} style={{ animation: "fadeUp 0.3s ease" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.ink, color: C.lime, fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>V</div>
                      <div style={{ maxWidth: "82%", padding: "10px 14px", fontSize: 12.5, lineHeight: 1.65, background: C.surface, color: C.ink, borderRadius: "4px 16px 16px 16px", whiteSpace: "pre-wrap" }}>
                        {renderBold(msg.content)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: "row-reverse", animation: "fadeUp 0.2s ease" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.lime, color: C.ink, fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {(ctx?.name || "V")[0].toUpperCase()}
                    </div>
                    <div style={{ maxWidth: "82%", padding: "10px 14px", fontSize: 12.5, lineHeight: 1.65, background: C.ink, color: "#F8F8F4", borderRadius: "16px 16px 4px 16px" }}>
                      {msg.content}
                    </div>
                  </div>
                )
              )}

              {/* Typing indicator */}
              {chatLoading && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.ink, color: C.lime, fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>V</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "11px 14px", background: C.surface, borderRadius: "4px 16px 16px 16px", width: "fit-content" }}>
                    {[0, 0.18, 0.36].map((delay, di) => (
                      <div key={di} style={{ width: 5, height: 5, borderRadius: "50%", background: "#bbb", animation: `bounce 1.2s ease-in-out ${delay}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input row */}
            <div style={{ padding: "11px 13px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ width: 32, height: 32, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted, flexShrink: 0 }}
              >
                <PlusIcon />
              </button>
              <button
                onClick={() => setMicActive(v => !v)}
                style={{ width: 32, height: 32, borderRadius: "50%", background: micActive ? C.lime : C.surface, border: `1px solid ${micActive ? C.lime : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: micActive ? C.ink : C.muted, flexShrink: 0 }}
              >
                <MicIcon />
              </button>
              <input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Digite aqui..."
                disabled={chatLoading}
                style={{ flex: 1, height: 38, border: `1.5px solid ${C.mid}`, borderRadius: 20, padding: "0 14px", fontSize: 12.5, fontFamily: "inherit", color: C.ink, background: C.bg, outline: "none" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={chatLoading || !inputValue.trim()}
                style={{ width: 34, height: 34, borderRadius: "50%", background: C.lime, border: "none", cursor: chatLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: chatLoading ? 0.5 : 1 }}
              >
                <ArrowRightIcon />
              </button>
            </div>
            <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*,.pdf,.doc,.docx" onChange={() => {}} />
          </div>

          {/* ── PREVIEW COLUMN ── */}
          <div style={{ flex: 1, background: C.surface, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Preview header */}
            <div style={{ padding: "13px 20px", background: C.bg, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{previewTitle}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{previewSub}</div>
              {(phase === "generating" || phase === "preview" || phase === "approved") && (
                <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: C.lime, borderRadius: 2, width: `${Math.min(progress, 100)}%`, transition: "width 0.6s ease" }} />
                </div>
              )}
            </div>

            {/* Preview body — State 1: Empty */}
            {phase === "briefing" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 40, textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 13, background: C.border, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <GridIcon />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink2 }}>Nenhuma prévia ainda</div>
                <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.65, maxWidth: 240 }}>
                  Converse com o RORDENS no chat. O preview aparece aqui automaticamente.
                </div>
              </div>
            )}

            {/* Preview body — State 2: Generating */}
            {phase === "generating" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.lime, animation: "spin 0.75s linear infinite" }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Gerando copy e imagem...</div>
                <div style={{ fontSize: 12, color: C.muted }}>IA escrevendo + foto realista sendo criada</div>
              </div>
            )}

            {/* Preview body — State 3: Post card */}
            {(phase === "preview" || phase === "approved") && post && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: C.muted, marginBottom: 12 }}>
                    AMOSTRA — {postType}
                  </div>

                  {/* Post card */}
                  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", maxWidth: 440, animation: "fadeUp 0.4s ease" }}>
                    {/* Visual area */}
                    <div style={{ height: 190, background: C.ink, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: post.imageUrl ? 0 : 22 }}>
                      {post.imageUrl ? (
                        <img src={post.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{ fontFamily: FFH, fontStyle: "italic", fontSize: 20, color: "#F8F8F4", lineHeight: 1.3, textAlign: "center" }}>
                          {postHook}
                        </div>
                      )}
                      <div style={{ position: "absolute", top: 11, right: 11, fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", background: C.lime, color: C.ink, padding: "2px 7px", borderRadius: 4 }}>
                        {postType}
                      </div>
                      {post.imageUrl && (
                        <div style={{ position: "absolute", top: 11, left: 11, fontSize: 9, fontWeight: 600, color: "#fff", background: "rgba(0,0,0,0.45)", borderRadius: 3, padding: "2px 6px" }}>
                          IA gerada
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div style={{ padding: "16px 18px" }}>
                      {postHook && (
                        <div style={{ fontFamily: FFH, fontStyle: "italic", fontSize: 17, fontWeight: 400, color: C.ink, marginBottom: 10 }}>
                          {postHook}
                        </div>
                      )}
                      {postCaption && (
                        <div style={{ fontSize: 12.5, color: C.ink2, lineHeight: 1.75, whiteSpace: "pre-wrap", borderLeft: `2px solid ${C.lime}`, paddingLeft: 11, marginBottom: 12 }}>
                          {postCaption}
                        </div>
                      )}
                      {postHashtags && (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Hashtags</div>
                          <div style={{ fontSize: 11, color: "#3a8a3a", lineHeight: 1.9, marginBottom: 12 }}>{postHashtags}</div>
                        </>
                      )}
                      {postFeatures.length > 0 && (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Features</div>
                          <ul style={{ fontSize: 12, color: C.ink2, lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
                            {postFeatures.map((f, fi) => <li key={fi}>{f}</li>)}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Approve bar */}
                {phase === "preview" && (
                  <div style={{ background: C.bg, borderTop: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: C.muted, flex: 1, lineHeight: 1.5 }}>
                      Gostou da direção? Aprovando, você recebe o{" "}
                      <strong style={{ color: C.ink }}>produto completo com imagens reais</strong>.
                    </div>
                    <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                      <button
                        onClick={requestRevision}
                        disabled={chatLoading}
                        style={{ fontSize: 11.5, fontWeight: 700, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", border: `1.5px solid ${C.mid}`, background: C.bg, color: C.ink }}
                      >
                        Ajustar tom
                      </button>
                      <button
                        onClick={approveAll}
                        disabled={chatLoading}
                        style={{ fontSize: 11.5, fontWeight: 700, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", border: `1.5px solid ${C.lime}`, background: C.lime, color: C.ink }}
                      >
                        Aprovar e gerar →
                      </button>
                    </div>
                  </div>
                )}

                {phase === "approved" && (
                  <div style={{ background: C.ink, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.lime, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: C.ink }}>✓</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.lime }}>
                      Pedido aprovado — gerando com imagens reais
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
