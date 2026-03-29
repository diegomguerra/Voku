"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/hooks/useUserContext";
import LandingPageViewer from "@/components/LandingPageViewer";
import RordensPanel from "@/components/RordensPanel";
import PostsBriefingForm, { PostsBriefing } from "@/components/PostsBriefingForm";

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

/* ── Types ── */
interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[]; // base64 data URLs
  preview?: Record<string, any> | null;
}
interface Choice {
  id: string;
  label: string;
  content: { text: string };
  image_url: string | null;
  html_content?: string | null;
  position: number;
  is_selected: boolean;
}

/* ── Preview extraction ── */
function parsePreview(text: string): { clean: string; preview: Record<string, any> | null } {
  const m = text.match(/___PREVIEW___([\s\S]*?)___END___/);
  if (!m) return { clean: text, preview: null };
  try {
    const preview = JSON.parse(m[1].trim());
    return { clean: text.replace(/___PREVIEW___[\s\S]*?___END___/g, "").trim(), preview };
  } catch {
    return { clean: text, preview: null };
  }
}

/* ── Product labels ── */
const PRODUCT_LABELS: Record<string, string> = {
  post_instagram: "Post Instagram",
  carrossel: "Carrossel",
  landing_page_copy: "Landing Page",
  email_sequence: "E-mail",
  ad_copy: "Anúncio",
  reels_script: "Reels",
  content_pack: "Pack de Conteúdo",
  app: "App",
};

/* ── Simple markdown bold ── */
function renderBold(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} style={{ fontWeight: 800 }}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}

/* ── Image / file helpers ── */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Compress image via canvas to max 1200px and JPEG 0.8 quality */
function compressImage(dataUrl: string, maxSize = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl); // fallback to original
    img.src = dataUrl;
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function base64ToAnthropicBlock(dataUrl: string) {
  const [header, data] = dataUrl.split(",");
  const mediaType = header.match(/data:(.*?);/)?.[1] || "image/jpeg";
  return { type: "image" as const, source: { type: "base64" as const, media_type: mediaType, data } };
}

/* ── CSS keyframes ── */
const KEYFRAMES = `
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
`;

/* ── Inline preview card (rendered inside chat) ── */
function PreviewCard({ data, onGenerate, onAdjust, loading }: {
  data: Record<string, any>;
  onGenerate: () => void;
  onAdjust: () => void;
  loading: boolean;
}) {
  const type = PRODUCT_LABELS[data.type] || "Conteúdo";
  const hook = data.hook || data.headline || data.cover_title || data.hero_headline || data.subject || data.name || "";
  const caption = data.caption || data.body || data.value_prop || data.first_paragraph || data.first_15s || data.cover_subtitle || data.hero_subheadline || "";
  const hashtags = Array.isArray(data.hashtags) ? data.hashtags.join(" ") : (data.hashtags || "");
  const features = data.features || [];

  return (
    <div style={{ maxWidth: 320, animation: "fadeUp 0.3s ease", marginTop: 6 }}>
      <div style={{ background: C.bg, border: `1.5px solid ${C.lime}50`, borderRadius: 12, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: `${C.lime}15`, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.lime}25` }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", background: C.lime, color: C.ink, padding: "2px 7px", borderRadius: 4 }}>{type}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.muted }}>Amostra gratuita</span>
        </div>
        {/* Body */}
        <div style={{ padding: "14px 14px" }}>
          {hook && <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8, lineHeight: 1.35 }}>{hook}</div>}
          {caption && <div style={{ fontSize: 12, color: C.ink2, lineHeight: 1.7, borderLeft: `3px solid ${C.lime}`, paddingLeft: 10, marginBottom: 10, whiteSpace: "pre-wrap" }}>{caption}</div>}
          {hashtags && <div style={{ fontSize: 10.5, color: "#3a8a3a", lineHeight: 1.8, marginBottom: 8 }}>{hashtags}</div>}
          {features.length > 0 && (
            <ul style={{ fontSize: 11, color: C.ink2, lineHeight: 1.7, paddingLeft: 16, margin: "0 0 8px 0" }}>
              {features.map((f: string, fi: number) => <li key={fi}>{f}</li>)}
            </ul>
          )}
        </div>
        {/* Footer */}
        <div style={{ padding: "10px 14px", background: C.surface, borderTop: `1px solid ${C.border}`, fontSize: 10.5, color: C.muted, lineHeight: 1.5 }}>
          Ao gerar, criamos <strong style={{ color: C.ink }}>3 variações</strong> com <strong style={{ color: C.ink }}>fotos reais por IA</strong>.
        </div>
      </div>
      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button
          onClick={onAdjust}
          disabled={loading}
          style={{ fontSize: 11, fontWeight: 700, padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", border: `1.5px solid ${C.mid}`, background: C.bg, color: C.ink }}
        >
          Ajustar
        </button>
        <button
          onClick={onGenerate}
          disabled={loading}
          style={{ fontSize: 11.5, fontWeight: 800, padding: "7px 18px", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", border: `2px solid ${C.lime}`, background: C.lime, color: C.ink, boxShadow: "0 2px 8px rgba(170,255,0,0.25)", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Gerando..." : "Gerar produto completo →"}
        </button>
      </div>
    </div>
  );
}

/* ── Choice card for results panel ── */
function ChoiceCard({ choice, onSelect }: { choice: Choice; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      style={{
        background: C.bg,
        border: choice.is_selected ? `2px solid ${C.lime}` : `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border 0.2s, box-shadow 0.2s",
        boxShadow: choice.is_selected ? `0 0 12px ${C.lime}30` : "none",
      }}
    >
      {/* Image */}
      <div style={{ height: 160, background: "#e8e8e4", position: "relative" }}>
        {choice.image_url ? (
          <img src={choice.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.lime, animation: "spin 0.75s linear infinite" }} />
          </div>
        )}
        {choice.is_selected && (
          <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", background: C.lime, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: C.ink }}>✓</div>
        )}
      </div>
      {/* Label */}
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{choice.label}</div>
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, maxHeight: 48, overflow: "hidden" }}>
          {choice.content?.text?.slice(0, 120)}...
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function ProjetoPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { ctx } = useUserContext();
  const router = useRouter();

  /* ── State ── */
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [lastPreview, setLastPreview] = useState<Record<string, any> | null>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [micActive, setMicActive] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userIdRef = useRef<string | null>(null);
  const choicesPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  /* ── Load user + chat history + choices on mount ── */
  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(async ({ data: authData }) => {
      if (!authData.user) return;
      userIdRef.current = authData.user.id;

      // Load order
      const { data: orderData } = await sb
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (orderData) setOrder(orderData);

      // Load chat messages
      const { data: msgs } = await sb
        .from("chat_messages")
        .select("*")
        .eq("user_id", authData.user.id)
        .eq("channel", "project_" + orderId)
        .order("created_at", { ascending: true });

      if (msgs && msgs.length > 0) {
        const loaded: Message[] = msgs.map((m: any) => {
          const { clean, preview } = parsePreview(m.content || "");
          return { role: m.role, content: clean, preview: preview || undefined };
        });
        setMessages(loaded);
        const lp = [...loaded].reverse().find(m => m.preview);
        if (lp?.preview) setLastPreview(lp.preview);
      }

      // Load choices
      loadChoices();
    });

    return () => {
      if (choicesPollRef.current) clearInterval(choicesPollRef.current);
    };
  }, [orderId]);

  /* ── Load choices from DB ── */
  const loadChoices = useCallback(async () => {
    const sb = supabase();
    const { data } = await sb
      .from("choices")
      .select("id, label, content, image_url, position, is_selected, html_content")
      .eq("order_id", orderId)
      .order("position");
    if (data) setChoices(data as Choice[]);
  }, [orderId]);

  /* ── Start polling choices when executing ── */
  useEffect(() => {
    if (executing && !choicesPollRef.current) {
      choicesPollRef.current = setInterval(loadChoices, 4000);
    }
    // Stop polling when all choices have images
    if (choices.length >= 3 && choices.every(c => c.image_url)) {
      if (choicesPollRef.current) {
        clearInterval(choicesPollRef.current);
        choicesPollRef.current = null;
      }
      setExecuting(false);
    }
  }, [executing, choices, loadChoices]);

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

  /* ── Handle execute (create order + call execute-product) ── */
  const handleGenerate = useCallback(async (previewData: Record<string, any>) => {
    setExecuting(true);

    // Add messages
    const userMsg = "Aprovado! Pode gerar o produto completo.";
    const botMsg = "Gerando 3 variações com imagens reais. Aguarde alguns segundos...";
    setMessages(prev => [
      ...prev,
      { role: "user", content: userMsg },
      { role: "assistant", content: botMsg },
    ]);
    await persistMessage("user", userMsg);
    await persistMessage("assistant", botMsg);

    try {
      const sb = supabase();
      const { data: sessionData } = await sb.auth.getSession();
      const token = sessionData?.session?.access_token;
      const userId = userIdRef.current;
      if (!token || !userId) return;

      const product = previewData.type || "post_instagram";

      // Ensure order exists
      const { data: existing } = await sb.from("orders").select("id").eq("id", orderId).single();
      if (!existing) {
        await sb.from("orders").insert({ id: orderId, user_id: userId, product, status: "in_production" });
      } else {
        await sb.from("orders").update({ product, status: "in_production" }).eq("id", orderId);
      }

      // Build structured_data from chat context
      const chatContext = messages.filter(m => m.role === "user").map(m => m.content).join("\n");

      // Use uploaded screenshot as reference image if available
      const refUrl = uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : undefined;

      const res = await fetch("/api/execute-product", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          product,
          structured_data: { ...previewData, resumo: chatContext, image_slug: previewData.image_slug || "product-scene" },
          reference_image_url: refUrl,
          order_id: orderId,
          user_id: userId,
          name: ctx?.name || "",
          email: ctx?.email || "",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Execute-product error:", res.status, err);
        setMessages(prev => [...prev, { role: "assistant", content: "Erro ao gerar. Tente novamente." }]);
        setExecuting(false);
      } else {
        // Start polling for choices
        loadChoices();
      }
    } catch (err) {
      console.error("Execute error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Erro ao gerar. Tente novamente." }]);
      setExecuting(false);
    }
  }, [orderId, ctx, messages, persistMessage, loadChoices, uploadedImageUrls]);

  /* ── Handle file/image upload ── */
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const sb = supabase();
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { alert("Arquivo muito grande (máx 10MB)"); continue; }

      if (file.type.startsWith("image/")) {
        // Image: compress, show preview, upload to storage
        const rawB64 = await fileToBase64(file);
        const compressed = await compressImage(rawB64);
        setPendingImages(prev => [...prev, compressed]);

        // Upload original to Supabase Storage for generation pipeline
        const ext = file.name.split(".").pop() || "png";
        const path = `screenshots/${orderId}/${Date.now()}.${ext}`;
        const { error } = await sb.storage.from("generated-images").upload(path, file, { contentType: file.type, upsert: true });
        if (!error) {
          const { data: urlData } = sb.storage.from("generated-images").getPublicUrl(path);
          setUploadedImageUrls(prev => [...prev, urlData.publicUrl]);
        }
      } else {
        // Non-image file: read as text and attach to input
        const TEXT_TYPES = ["text/", "application/json", "application/xml", "text/csv", "application/csv"];
        const isText = TEXT_TYPES.some(t => file.type.startsWith(t)) || /\.(txt|csv|json|xml|md|html|css|js|ts|jsx|tsx|log)$/i.test(file.name);

        if (isText) {
          try {
            const text = await readFileAsText(file);
            const truncated = text.length > 4000 ? text.slice(0, 4000) + "\n...[arquivo truncado]" : text;
            const fileContext = `📎 Arquivo: ${file.name}\n\`\`\`\n${truncated}\n\`\`\``;
            setInputValue(prev => prev ? `${prev}\n\n${fileContext}` : fileContext);
          } catch {
            setInputValue(prev => prev ? `${prev}\n📎 ${file.name} (não foi possível ler)` : `📎 ${file.name} (não foi possível ler)`);
          }
        } else {
          // Binary files (PDF, DOC, etc.) — upload to storage and mention in chat
          const ext = file.name.split(".").pop() || "bin";
          const path = `uploads/${orderId}/${Date.now()}.${ext}`;
          const { error } = await sb.storage.from("generated-images").upload(path, file, { contentType: file.type, upsert: true });
          if (!error) {
            const { data: urlData } = sb.storage.from("generated-images").getPublicUrl(path);
            setUploadedImageUrls(prev => [...prev, urlData.publicUrl]);
          }
          setInputValue(prev => prev ? `${prev}\n📎 Arquivo enviado: ${file.name}` : `📎 Arquivo enviado: ${file.name}`);
        }
      }
    }
  }, [orderId]);

  /* ── Paste handler for screenshots ── */
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      handleFiles(imageFiles);
    }
  }, [handleFiles]);

  /* ── Send message via voku-chat ── */
  const sendMessage = useCallback(async (text?: string) => {
    const userText = text || inputValue.trim();
    const images = [...pendingImages];
    if ((!userText && images.length === 0) || chatLoading) return;
    setInputValue("");
    setPendingImages([]);

    // If user confirms and we have a preview, execute directly
    if (lastPreview && !images.length && /^(sim|ok|pode|gera|aprova|manda|vai|bora|confirma|quero|yes|go|gerar)/i.test(userText.trim())) {
      await handleGenerate(lastPreview);
      return;
    }

    const userMsg: Message = { role: "user", content: userText || (images.length ? "[Screenshot enviado]" : ""), images: images.length ? images : undefined };
    const newMessages: Message[] = [...messages, userMsg];
    setMessages(newMessages);
    setChatLoading(true);
    await persistMessage("user", userText || "[Screenshot enviado]");

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
          messages: newMessages.map(m => {
            if (m.images?.length) {
              // Anthropic multi-modal format
              const content: any[] = m.images.map(img => base64ToAnthropicBlock(img));
              if (m.content) content.push({ type: "text", text: m.content });
              return { role: m.role, content };
            }
            return { role: m.role, content: m.content };
          }),
          user_context: {
            name: ctx?.name || "você",
            plan: ctx?.plan || "free",
            credits: ctx?.credits ?? 0,
            channel: "project",
            user_id: userIdRef.current,
          },
        }),
      });

      const ct = res.headers.get("content-type") || "";

      if (ct.includes("text/event-stream") && res.body) {
        /* ── SSE Stream ── */
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        const streamIdx = newMessages.length;
        setMessages([...newMessages, { role: "assistant", content: "" }]);

        let finalCleanText = "";
        let finalPreview: Record<string, any> | null = null;
        let finalAction: any = null;
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
              try {
                const evt = JSON.parse(line.slice(6).trim());
                if (evt.type === "delta" && evt.text) {
                  accumulated += evt.text;
                  // Display text without preview/action markers
                  let display = accumulated.replace(/___PREVIEW___[\s\S]*$/g, "");
                  const aidx = display.lastIndexOf('{"action"');
                  if (aidx !== -1) display = display.slice(0, aidx).trim();
                  setMessages(prev => {
                    const copy = [...prev];
                    copy[streamIdx] = { role: "assistant", content: display };
                    return copy;
                  });
                }
                if (evt.type === "done") {
                  finalCleanText = evt.text || "";
                  finalPreview = evt.preview || null;
                  finalAction = evt.action || null;
                  fullTextRaw = evt.fullText || accumulated;
                }
              } catch { /* skip malformed */ }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Fallback: parse from accumulated if done event didn't arrive
        if (!finalCleanText && accumulated) {
          const { clean, preview } = parsePreview(accumulated);
          finalCleanText = clean.replace(/\{[\s\S]*"action"[\s\S]*\}/g, "").trim();
          finalPreview = finalPreview || preview;
          fullTextRaw = fullTextRaw || accumulated;
        }

        // Also try to parse preview from accumulated even if done event had no preview
        if (!finalPreview && accumulated.includes("___PREVIEW___")) {
          const { preview } = parsePreview(accumulated);
          finalPreview = preview;
        }

        // Update messages
        const finalMsg: Message = {
          role: "assistant",
          content: finalCleanText || "Ops, a conexão caiu. Tenta de novo!",
          preview: finalPreview || undefined,
        };
        setMessages([...newMessages, finalMsg]);
        await persistMessage("assistant", fullTextRaw || finalCleanText);

        if (finalPreview) setLastPreview(finalPreview);
        if (finalAction?.action === "execute") await handleGenerate(finalAction.structured_data || finalPreview || {});
      } else {
        /* ── Non-streaming fallback ── */
        const data = await res.json();
        const rawReply = data?.content?.[0]?.text || "";
        const fullTextRaw = data?.fullText || rawReply;
        const { clean, preview: parsedPreview } = parsePreview(rawReply);
        const cleanReply = clean.replace(/\{[\s\S]*"action"[\s\S]*\}/g, "").trim();
        const preview = parsedPreview || data?.preview || null;

        const finalMsg: Message = {
          role: "assistant",
          content: cleanReply || "Ops, tive um problema. Pode repetir?",
          preview: preview || undefined,
        };
        setMessages([...newMessages, finalMsg]);
        await persistMessage("assistant", fullTextRaw);

        if (preview) setLastPreview(preview);
        if (data?.action?.action === "execute") await handleGenerate(data.action.structured_data || preview || {});
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Ops, algo deu errado. Tenta de novo!" }]);
    }

    setChatLoading(false);
  }, [inputValue, chatLoading, messages, ctx, persistMessage, lastPreview, pendingImages, handleGenerate]);

  /* ── Select a choice ── */
  const selectChoice = useCallback(async (choiceId: string) => {
    const sb = supabase();
    // Deselect all, then select this one
    await sb.from("choices").update({ is_selected: false }).eq("order_id", orderId);
    await sb.from("choices").update({ is_selected: true }).eq("id", choiceId);
    loadChoices();
  }, [orderId, loadChoices]);

  /* ── Derived state ── */
  const hasChoices = choices.length > 0;
  const allImagesReady = hasChoices && choices.every(c => c.image_url);
  const selectedChoice = choices.find(c => c.is_selected);

  /* ── Form step tracking for Rordens ── */
  const [formStep, setFormStep] = useState(1);

  /* ══════════════════════════════════════════════════════════════
     LANDING PAGE — dedicated flow with Rordens split-screen
     ══════════════════════════════════════════════════════════════ */
  if (order?.product === 'landing_page_copy') {
    const choiceComHTML = choices?.find((c: any) => c.html_content);
    const prefill = {
      nome_marca: '',
      produto: '',
      resumo: order.preview_text && order.preview_text.length < 500
        ? order.preview_text
        : '',
    };

    return (
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", height: "calc(100vh - 64px)", fontFamily: FF, overflow: "hidden" }}>
        <RordensPanel
          produto="landing_page_copy"
          produtoLabel="Landing Page"
          passo={formStep}
        />
        <div style={{ background: "#FAF8F3", overflowY: "auto" }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
            <div style={{ marginBottom: 24 }}>
              <span style={{
                background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 600,
                padding: '3px 10px', borderRadius: 100, border: '1px solid #bbf7d0',
                display: 'inline-block'
              }}>
                🌐 LANDING PAGE
              </span>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: '#0f172a' }}>
                {order.preview_text?.slice(0, 80) || 'Landing Page'}
              </h1>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                {choiceComHTML
                  ? '✓ HTML gerado · visualize o preview ou baixe abaixo'
                  : 'Preencha o formulário para gerar sua landing page com IA'}
              </p>
            </div>

            <LandingPageViewer
              orderId={order.id}
              choiceId={choiceComHTML?.id}
              userId={userIdRef.current || ''}
              initialHtml={choiceComHTML?.html_content || ''}
              prefill={prefill}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     CONTENT PACK — dedicated flow with Rordens split-screen
     ══════════════════════════════════════════════════════════════ */
  if (order?.product === 'content_pack') {
    const handlePostsBriefingSubmit = async (data: PostsBriefing) => {
      setExecuting(true);
      try {
        const sb = supabase();
        const { data: sessionData } = await sb.auth.getSession();
        const token = sessionData?.session?.access_token;
        const userId = userIdRef.current;
        if (!token || !userId) return;

        await sb.from("orders").update({ product: "content_pack", status: "in_production" }).eq("id", orderId);

        const res = await fetch("/api/execute-product", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            product: "content_pack",
            structured_data: {
              ...data,
              type: "content_pack",
              resumo: data.descricao,
            },
            order_id: orderId,
            user_id: userId,
            name: ctx?.name || "",
            email: ctx?.email || "",
          }),
        });

        if (!res.ok) {
          console.error("Execute error:", res.status);
          setExecuting(false);
        } else {
          loadChoices();
        }
      } catch (err) {
        console.error("Execute error:", err);
        setExecuting(false);
      }
    };

    // If choices already exist, show them in the standard flow
    if (hasChoices) {
      // Fall through to standard render below
    } else {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", height: "calc(100vh - 64px)", fontFamily: FF, overflow: "hidden" }}>
          <RordensPanel
            produto="content_pack"
            produtoLabel="Pack de Posts"
            passo={formStep}
          />
          <div style={{ background: "#FAF8F3", overflowY: "auto" }}>
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
              <div style={{ marginBottom: 24 }}>
                <span style={{
                  background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 600,
                  padding: '3px 10px', borderRadius: 100, border: '1px solid #bfdbfe',
                  display: 'inline-block'
                }}>
                  📱 PACK DE POSTS
                </span>
                <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: '#0f172a' }}>
                  {order.preview_text?.slice(0, 80) || 'Pack de Posts'}
                </h1>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  Preencha o briefing para gerar seu pack de conteúdo com IA
                </p>
              </div>

              {executing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', gap: 20 }}>
                  <div style={{ position: 'relative', width: 64, height: 64 }}>
                    <div style={{ position: 'absolute', inset: 0, border: '3px solid #e2e8f0', borderTopColor: '#CCEE33', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Gerando seu pack de posts</p>
                    <p style={{ fontSize: 13, color: '#64748b' }}>3 variações com textos e imagens por IA...</p>
                  </div>
                </div>
              ) : (
                <PostsBriefingForm
                  onSubmit={handlePostsBriefingSubmit}
                  loading={executing}
                  onStepChange={setFormStep}
                />
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER — standard products with Rordens split-screen
     ══════════════════════════════════════════════════════════════ */
  const productLabel = PRODUCT_LABELS[order?.product] || "Conteúdo";

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: FF, background: C.bg }}>
        {/* ── NAV ── */}
        <nav style={{ height: 50, background: C.ink, display: "flex", alignItems: "center", padding: "0 18px", flexShrink: 0 }}>
          <span style={{ fontWeight: 900, color: C.lime, fontSize: 13, letterSpacing: "0.05em", marginRight: 20, cursor: "pointer" }} onClick={() => router.push("/cliente/projetos")}>
            VOKU
          </span>
          <div style={{ height: 1, flex: 1, background: "#222" }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: "#444", marginLeft: 12 }}>
            Projeto #{orderId?.toString().slice(0, 8)}
          </span>
        </nav>

        {/* ── BODY ── */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: hasChoices ? "380px 1fr 1fr" : "380px 1fr", overflow: "hidden" }}>

          {/* ── RORDENS PANEL ── */}
          <RordensPanel
            produto={order?.product || "post_instagram"}
            produtoLabel={productLabel}
            passo={1}
          />

          {/* ── CHAT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", background: C.bg }}>

            {/* Chat header */}
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: C.lime }}>V</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>Voku AI</div>
                <div style={{ fontSize: 10.5, color: C.muted, display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.lime, animation: "pulse 2s ease-in-out infinite" }} />
                  online
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Welcome message if no messages */}
              {messages.length === 0 && !chatLoading && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.ink, color: C.lime, fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>V</div>
                  <div style={{ maxWidth: "85%", padding: "10px 14px", fontSize: 12.5, lineHeight: 1.65, background: C.surface, color: C.ink, borderRadius: "4px 16px 16px 16px" }}>
                    Oi{ctx?.name ? `, ${ctx.name.split(" ")[0]}` : ""}! Sou a Voku AI. Me conta o que você quer criar — post, carrossel, landing page, reels ou outro conteúdo — e eu monto uma amostra em segundos.
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === "assistant" ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", animation: "fadeUp 0.3s ease" }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.ink, color: C.lime, fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>V</div>
                      <div style={{ maxWidth: "85%" }}>
                        {msg.content && (
                          <div style={{ padding: "10px 14px", fontSize: 12.5, lineHeight: 1.65, background: C.surface, color: C.ink, borderRadius: "4px 16px 16px 16px", whiteSpace: "pre-wrap" }}>
                            {renderBold(msg.content)}
                          </div>
                        )}
                        {/* Inline preview card */}
                        {msg.preview && (
                          <PreviewCard
                            data={msg.preview}
                            onGenerate={() => handleGenerate(msg.preview!)}
                            onAdjust={() => sendMessage("Quero ajustar. Pode refazer?")}
                            loading={executing}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexDirection: "row-reverse", animation: "fadeUp 0.2s ease" }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.lime, color: C.ink, fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {(ctx?.name || "V")[0].toUpperCase()}
                      </div>
                      <div style={{ maxWidth: "85%" }}>
                        {/* User images */}
                        {msg.images && msg.images.length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end", marginBottom: msg.content ? 4 : 0 }}>
                            {msg.images.map((img, imgIdx) => (
                              <img key={imgIdx} src={img} alt="" style={{ maxWidth: 180, maxHeight: 140, borderRadius: 10, border: `1px solid ${C.border}`, objectFit: "cover" }} />
                            ))}
                          </div>
                        )}
                        {msg.content && (
                          <div style={{ padding: "10px 14px", fontSize: 12.5, lineHeight: 1.65, background: C.ink, color: "#F8F8F4", borderRadius: "16px 16px 4px 16px" }}>
                            {msg.content}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {chatLoading && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.ink, color: C.lime, fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>V</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "11px 14px", background: C.surface, borderRadius: "4px 16px 16px 16px" }}>
                    {[0, 0.18, 0.36].map((d, di) => (
                      <div key={di} style={{ width: 5, height: 5, borderRadius: "50%", background: "#bbb", animation: `bounce 1.2s ease-in-out ${d}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Pending images preview */}
            {pendingImages.length > 0 && (
              <div style={{ padding: "8px 12px 0", borderTop: `1px solid ${C.border}`, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {pendingImages.map((img, idx) => (
                  <div key={idx} style={{ position: "relative", width: 52, height: 52, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      onClick={() => setPendingImages(prev => prev.filter((_, i) => i !== idx))}
                      style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Input row */}
            <div style={{ padding: "10px 12px", borderTop: pendingImages.length ? "none" : `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ width: 32, height: 32, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted, flexShrink: 0 }}
                title="Enviar imagem ou arquivo"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
              {/* Mic button */}
              <button
                onClick={() => setMicActive(v => !v)}
                style={{ width: 32, height: 32, borderRadius: "50%", background: micActive ? C.lime : C.surface, border: `1px solid ${micActive ? C.lime : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: micActive ? C.ink : C.muted, flexShrink: 0 }}
                title="Gravar áudio"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" stroke="currentColor" strokeWidth="2" /><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {/* Text input */}
              <input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                onPaste={handlePaste}
                placeholder={pendingImages.length ? "Adicione uma descrição..." : "Digite ou cole um screenshot..."}
                disabled={chatLoading || executing}
                style={{ flex: 1, height: 38, border: `1.5px solid ${C.mid}`, borderRadius: 20, padding: "0 14px", fontSize: 12.5, fontFamily: "inherit", color: C.ink, background: C.bg, outline: "none" }}
              />
              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={chatLoading || executing || (!inputValue.trim() && !pendingImages.length)}
                style={{ width: 34, height: 34, borderRadius: "50%", background: C.lime, border: "none", cursor: chatLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: chatLoading || executing ? 0.5 : 1 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.md,.html"
              multiple
              onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
            />
          </div>

          {/* ── RESULTS COLUMN ── */}
          {hasChoices && (
            <div style={{ flex: 1, background: C.surface, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Results header */}
              <div style={{ padding: "12px 20px", background: C.bg, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
                  {allImagesReady ? "Escolha sua variação favorita" : "Gerando variações..."}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {allImagesReady
                    ? `${choices.length} variações prontas — clique para selecionar`
                    : `${choices.filter(c => c.image_url).length}/${choices.length} imagens prontas`
                  }
                </div>
                {!allImagesReady && (
                  <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: C.lime, borderRadius: 2, width: `${Math.round((choices.filter(c => c.image_url).length / Math.max(choices.length, 1)) * 100)}%`, transition: "width 0.6s ease" }} />
                  </div>
                )}
              </div>

              {/* Choices grid */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                  {choices.map(c => (
                    <ChoiceCard key={c.id} choice={c} onSelect={() => selectChoice(c.id)} />
                  ))}
                </div>

                {/* Confirm selection */}
                {selectedChoice && allImagesReady && (
                  <div style={{ marginTop: 20, padding: "14px 18px", background: C.bg, border: `2px solid ${C.lime}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Selecionado: {selectedChoice.label}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Clique para confirmar e finalizar o projeto</div>
                    </div>
                    <button
                      style={{ fontSize: 12, fontWeight: 800, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", border: "none", background: C.lime, color: C.ink }}
                      onClick={async () => {
                        const sb = supabase();
                        await sb.from("orders").update({ status: "delivered" }).eq("id", orderId);
                        router.push("/cliente/projetos");
                      }}
                    >
                      Aprovar →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── EMPTY RESULTS PLACEHOLDER (when executing but no choices yet) ── */}
          {executing && !hasChoices && (
            <div style={{ flex: 1, background: C.surface, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.lime, animation: "spin 0.75s linear infinite" }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Gerando produto completo...</div>
              <div style={{ fontSize: 12, color: C.muted }}>3 variações de texto + fotos reais por IA</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
