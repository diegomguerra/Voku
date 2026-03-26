"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/hooks/useUserContext";
import OrderChoices from "@/components/OrderChoices";
import ProjectTracker from "@/components/ProjectTracker";
import { useVoiceInput } from "@/hooks/useVoiceInput";

const T = {
  sand:"#FAF8F3",white:"#FFFFFF",ink:"#111111",inkSub:"#3D3D3D",inkMid:"#6B6B6B",inkFaint:"#A0A0A0",
  lime:"#C8F135",border:"#E8E5DE",borderMd:"#D1CCBF",
  green:"#166534",greenBg:"#DCFCE7",teal:"#0D7A6E",tealBg:"#E6F5F3",amber:"#B45309",amberBg:"#FEF3C7",
};

const PRODUCT_NAME: Record<string,string> = {
  landing_page_copy:"Landing Page Copy",
  content_pack:"Pacote de Conteúdo para Redes",
  email_sequence:"Sequência de E-mails de Nutrição",
  post_instagram:"Post para Instagram",
  carrossel:"Carrossel para Instagram",
  reels_script:"Roteiro de Reels",
  ad_copy:"Copy para Meta Ads",
  app:"App Web",
};

const UPGRADE_THRESHOLD = 0.2; // 20%
const PLAN_MAX_CREDITS: Record<string, number> = { free: 20, starter: 100, pro: 300, business: 800, enterprise: 2000 };

const STATUS: Record<string,{label:string;color:string;bg:string;dot:string}> = {
  briefing:{label:"Briefing",color:T.amber,bg:T.amberBg,dot:"#F59E0B"},
  in_production:{label:"Em Produção",color:T.teal,bg:T.tealBg,dot:"#0D9488"},
  delivered:{label:"Entregue",color:T.green,bg:T.greenBg,dot:"#16A34A"},
  failed:{label:"Erro",color:"#DC2626",bg:"#FEE2E2",dot:"#EF4444"},
};

const QUICK_STARTS = [
  "Preciso de copy para anúncio",
  "Quero posts para Instagram",
  "Me ajuda com uma landing page",
  "Quero ver meus créditos",
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  preview?: any;
}

// ─── Preview extraction helpers ───
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

// ─── Preview Card Component ───
const PREVIEW_LABELS: Record<string, string> = {
  post_instagram: "Post Instagram",
  carrossel: "Carrossel",
  landing_page_copy: "Landing Page",
  email_sequence: "E-mail",
  ad_copy: "Anúncio",
  reels_script: "Roteiro Reels",
  content_pack: "Pacote de Conteúdo",
  app: "App",
};

function PreviewCard({ preview }: { preview: any }) {
  if (!preview || typeof preview !== "object") return null;
  const type = preview.type || "unknown";
  const label = PREVIEW_LABELS[type] || type;

  const renderFields = () => {
    switch (type) {
      case "post_instagram":
        return (
          <>
            {preview.headline && <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 6 }}>{preview.headline}</div>}
            {preview.hook && <div style={{ fontSize: 13, color: T.inkSub, lineHeight: 1.6, marginBottom: 8 }}>{preview.hook}</div>}
            {preview.hashtags?.length > 0 && <div style={{ fontSize: 11, color: T.inkMid, wordBreak: "break-word" }}>{preview.hashtags.map((h: string) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}</div>}
          </>
        );
      case "carrossel":
        return (
          <>
            {preview.cover_title && <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 2 }}>{preview.cover_title}</div>}
            {preview.cover_subtitle && <div style={{ fontSize: 12, color: T.inkMid, marginBottom: 10 }}>{preview.cover_subtitle}</div>}
            {preview.slide1_headline && (
              <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", marginTop: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{preview.slide1_headline}</div>
                {preview.slide1_text && <div style={{ fontSize: 11, color: T.inkSub, marginTop: 2 }}>{preview.slide1_text}</div>}
              </div>
            )}
          </>
        );
      case "landing_page_copy":
        return (
          <>
            {preview.hero_headline && <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, marginBottom: 4 }}>{preview.hero_headline}</div>}
            {preview.hero_subheadline && <div style={{ fontSize: 13, color: T.inkSub, marginBottom: 8 }}>{preview.hero_subheadline}</div>}
            {preview.value_prop && <div style={{ fontSize: 12, color: T.inkMid, fontStyle: "italic" }}>{preview.value_prop}</div>}
          </>
        );
      case "email_sequence":
        return (
          <>
            {preview.subject && <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Assunto: {preview.subject}</div>}
            {preview.first_paragraph && <div style={{ fontSize: 12, color: T.inkSub, lineHeight: 1.6 }}>{preview.first_paragraph}</div>}
          </>
        );
      case "ad_copy":
        return (
          <>
            {preview.headline && <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{preview.headline}</div>}
            {preview.body && <div style={{ fontSize: 12, color: T.inkSub, lineHeight: 1.6 }}>{preview.body}</div>}
          </>
        );
      case "reels_script":
        return (
          <>
            {preview.hook && <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Hook: {preview.hook}</div>}
            {preview.first_15s && <div style={{ fontSize: 12, color: T.inkSub, lineHeight: 1.6 }}>{preview.first_15s}</div>}
          </>
        );
      case "content_pack":
        return (
          <>
            {preview.posts?.map((p: any, i: number) => (
              <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < (preview.posts.length - 1) ? `1px solid ${T.border}` : "none" }}>
                {p.headline && <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{p.headline}</div>}
                {p.hook && <div style={{ fontSize: 12, color: T.inkSub }}>{p.hook}</div>}
              </div>
            ))}
          </>
        );
      case "app":
        return (
          <>
            {preview.name && <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 6 }}>{preview.name}</div>}
            {preview.features?.map((f: string, i: number) => (
              <div key={i} style={{ fontSize: 12, color: T.inkSub, marginBottom: 2 }}>• {f}</div>
            ))}
          </>
        );
      default:
        return <pre style={{ fontSize: 11, color: T.inkSub, whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(preview, null, 2)}</pre>;
    }
  };

  return (
    <div style={{
      background: T.sand, border: `1.5px solid ${T.lime}`, borderRadius: 14,
      padding: "16px 20px", marginTop: 8, marginBottom: 4,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 800, color: T.lime, textTransform: "uppercase" as const,
        letterSpacing: "0.08em", marginBottom: 10, background: T.ink, display: "inline-block",
        padding: "3px 10px", borderRadius: 6,
      }}>
        Preview gratuito — {label}
      </div>
      {renderFields()}
    </div>
  );
}

function detectDeliverableType(content: string, product?: string): string {
  const productMap: Record<string, string> = {
    landing_page_copy: "landing_page", content_pack: "post", email_sequence: "email",
    post_instagram: "post", carrossel: "carrossel", reels_script: "copy",
    ad_copy: "copy", app: "copy",
  };
  if (product && productMap[product]) return productMap[product];
  const lower = content.toLowerCase();
  if (lower.includes("landing page") || lower.includes("<html")) return "landing_page";
  if (lower.includes("assunto:") || lower.includes("subject:")) return "email";
  if (lower.includes("slide") || lower.includes("carrossel")) return "carrossel";
  if (lower.includes("legenda") || lower.includes("hashtag")) return "post";
  return "copy";
}

export default function PedidosPage() {
  const { ctx, loading: ctxLoading } = useUserContext();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<"pedidos" | "chat" | "preview">("chat");
  const [isMobile, setIsMobile] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<"idle" | "generating" | "preview">("idle");
  const [activePreview, setActivePreview] = useState<any>(null);
  const [activePreviewProduct, setActivePreviewProduct] = useState<string>("");
  const [pendingOrder, setPendingOrder] = useState<{ orderId: string; choices: any[]; iterationId: string | null; orderData: any } | null>(null);
  const [choicesApproved, setChoicesApproved] = useState(false);
  const [landingPageSlugs, setLandingPageSlugs] = useState<Record<string, string>>({});
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userIdRef = useRef<string | null>(null);

  // Voice input
  const voice = useVoiceInput({
    lang: "pt-BR",
    silenceTimeout: 2500,
    onTranscript: (text) => setInput(prev => prev ? prev + " " + text : text),
  });

  // Detecta mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Carrega pedidos + histórico de chat
  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/cliente"; return; }
      userIdRef.current = data.user.id;

      // Pedidos
      sb.from("orders")
        .select("*,deliverables(*)")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false })
        .then(async ({ data: orders }) => {
          setOrders(orders || []);
          setOrdersLoading(false);

          // Busca slugs de landing pages para pedidos entregues
          const lpOrders = (orders || []).filter((o: any) => o.product === "landing_page_copy" && o.status === "delivered");
          if (lpOrders.length > 0) {
            const slugMap: Record<string, string> = {};
            for (const o of lpOrders) {
              const { data: lp } = await sb.from("landing_pages").select("slug").eq("order_id", o.id).single();
              if (lp?.slug) slugMap[o.id] = lp.slug;
            }
            setLandingPageSlugs(slugMap);
          }
        });

      // Histórico de chat
      sb.from("chat_messages")
        .select("role, content")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: true })
        .limit(20)
        .then(({ data: msgs }) => {
          if (msgs && msgs.length > 0) {
            setMessages(msgs.map((m: any) => ({ role: m.role, content: m.content })));
            setChatStarted(true);
          }
        });
    });
  }, []);

  // Scroll automático do chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  // Persiste mensagem no banco
  const persistMessage = useCallback(async (role: "user" | "assistant", content: string) => {
    if (!userIdRef.current) return;
    const sb = supabase();
    await sb.from("chat_messages").insert({ user_id: userIdRef.current, role, content });
  }, []);

  // Realtime subscription ref for cleanup
  const realtimeSubRef = useRef<any>(null);

  // Subscribe to choices via Supabase Realtime (replaces polling)
  const subscribeToChoices = useCallback((orderId: string) => {
    const sb = supabase();

    // Cleanup previous subscription
    if (realtimeSubRef.current) {
      sb.removeChannel(realtimeSubRef.current);
    }

    const channel = sb.channel(`choices-${orderId}`)
      // Listen for new choices
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "choices", filter: `order_id=eq.${orderId}` },
        async () => {
          const { data: choices } = await sb.from("choices").select("*").eq("order_id", orderId);
          if (choices && choices.length > 0) {
            const { data: iterations } = await sb.from("iterations").select("id").eq("order_id", orderId).order("created_at", { ascending: false }).limit(1);
            const { data: orderData } = await sb.from("orders").select("*").eq("id", orderId).single();
            setPendingOrder({
              orderId,
              choices,
              iterationId: iterations?.[0]?.id || null,
              orderData: orderData || { id: orderId, order_number: 0, product: "", status: "in_production", delivered_at: null },
            });
            // Cleanup after receiving choices
            sb.removeChannel(channel);
            realtimeSubRef.current = null;
          }
        }
      )
      // Listen for order status changes (failed)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        async (payload: any) => {
          const newStatus = payload.new?.status;
          if (newStatus === "failed") {
            sb.removeChannel(channel);
            realtimeSubRef.current = null;
            const errMsg = "Ops, houve um erro na geração do seu material. Tente novamente pelo chat.";
            setMessages(prev => [...prev, { role: "assistant", content: errMsg }]);
            await persistMessage("assistant", errMsg);
            const { data: updatedOrders } = await sb.from("orders").select("*,deliverables(*)").eq("user_id", userIdRef.current!).order("created_at", { ascending: false });
            if (updatedOrders) setOrders(updatedOrders);
          }
        }
      )
      .subscribe();

    realtimeSubRef.current = channel;
  }, [persistMessage]);

  // Cleanup Realtime subscription on unmount
  useEffect(() => {
    return () => {
      if (realtimeSubRef.current) {
        const sb = supabase();
        sb.removeChannel(realtimeSubRef.current);
      }
    };
  }, []);

  // Watch for order approval via Realtime (OrderChoices sets status to "delivered")
  useEffect(() => {
    if (!pendingOrder || choicesApproved) return;
    const sb = supabase();
    const channel = sb.channel(`order-approval-${pendingOrder.orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${pendingOrder.orderId}` },
        async (payload: any) => {
          if (payload.new?.status === "delivered") {
            setChoicesApproved(true);
            await persistMessage("assistant", "Material aprovado e pronto para download ✓");
            const { data: updatedOrders } = await sb.from("orders")
              .select("*,deliverables(*)")
              .eq("user_id", userIdRef.current!)
              .order("created_at", { ascending: false });
            if (updatedOrders) setOrders(updatedOrders);
            sb.removeChannel(channel);
          }
        }
      )
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [pendingOrder, choicesApproved, persistMessage]);

  // Execute action handler (must be before sendMessage)
  const handleExecuteAction = useCallback(async (action: any, withReply: ChatMessage[], newMessages: ChatMessage[]) => {
    const statusMsg: ChatMessage = { role: "assistant", content: "✦ Criando seu pedido..." };
    setMessages([...withReply, statusMsg]);

    try {
      const briefingRes = await fetch("/api/submit-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.structured_data),
      });
      const briefingData = await briefingRes.json();

      if (briefingData?.order_id) {
        setCreatedOrderId(briefingData.order_id);
        const successMsg = `Pedido criado! Suas opções estão sendo preparadas ✓`;
        const finalMessages: ChatMessage[] = [...withReply, { role: "assistant", content: successMsg }];
        setMessages(finalMessages);
        await persistMessage("assistant", successMsg);

        const sb = supabase();
        const { data: updatedOrders } = await sb.from("orders")
          .select("*,deliverables(*)")
          .eq("user_id", userIdRef.current!)
          .order("created_at", { ascending: false });
        if (updatedOrders) setOrders(updatedOrders);

        subscribeToChoices(briefingData.order_id);
      } else {
        const errMsg = "Ops, houve um problema ao criar o pedido. Tente novamente.";
        setMessages([...withReply, { role: "assistant", content: errMsg }]);
        await persistMessage("assistant", errMsg);
      }
    } catch {
      const errMsg = "Erro ao criar pedido. Tenta de novo!";
      setMessages([...withReply, { role: "assistant", content: errMsg }]);
      await persistMessage("assistant", errMsg);
    }
  }, [persistMessage, subscribeToChoices]);

  const sendMessage = useCallback(async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || chatLoading) return;
    setInput("");
    setChatStarted(true);

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setChatLoading(true);

    // Persiste mensagem do usuário
    await persistMessage("user", userText);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const res = await fetch(`${supabaseUrl}/functions/v1/voku-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
          "Accept": "text/event-stream",
        },
        body: JSON.stringify({
          messages: newMessages,
          user_context: {
            name: ctx?.name || "você",
            plan: ctx?.plan || "free",
            credits: ctx?.credits ?? 0,
            channel: "dashboard",
            user_id: userIdRef.current,
          },
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream") && res.body) {
        // ─── SSE Streaming path ───
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        // Add placeholder assistant message
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
                  // Detect preview block starting — show generating state
                  if (accumulated.includes("___PREVIEW___") && previewState !== "generating") {
                    setPreviewState("generating");
                    if (isMobile) setActiveTab("preview");
                  }
                  // Hide partial ___PREVIEW___ blocks from display
                  const displayText = accumulated.replace(/___PREVIEW___[\s\S]*$/g, "");
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
              } catch { /* skip malformed */ }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Fallback if "done" event never arrived (connection drop)
        if (!finalCleanText && accumulated) {
          const { cleanText: fallbackClean, preview: fallbackPreview } = parsePreviewFromContent(accumulated);
          finalCleanText = fallbackClean.replace(/\{[\s\S]*"action"[\s\S]*\}/g, "").trim();
          finalPreview = finalPreview || fallbackPreview;
          fullTextRaw = fullTextRaw || accumulated;
        }

        // Finalize message with preview
        const withReply: ChatMessage[] = [
          ...newMessages,
          { role: "assistant", content: finalCleanText || "Ops, a conexão caiu. Tenta de novo!", preview: finalPreview || undefined },
        ];
        setMessages(withReply);
        // Persist full text (with preview markers) so it can be re-parsed from history
        await persistMessage("assistant", fullTextRaw || finalCleanText);

        // Ativa preview area se preview foi gerado
        if (finalPreview) {
          setActivePreview(finalPreview);
          setActivePreviewProduct(finalPreview.type || "");
          setPreviewState("preview");
          if (isMobile) setActiveTab("preview");

        // Handle action
        if (finalAction?.action === "execute") {
          setPreviewState("idle");
          setActivePreview(null);
          await handleExecuteAction(finalAction, withReply, newMessages);
        }
      } else {
        // ─── Non-streaming fallback path ───
        const data = await res.json();
        const reply = data?.content?.[0]?.text || "Ops, tive um problema. Pode repetir?";
        const fullTextRaw = data?.fullText || reply;

        // Parse preview
        const { cleanText: noPreview, preview: parsedPreview } = parsePreviewFromContent(reply);
        const cleanReply = noPreview.replace(/\{[\s\S]*"action"[\s\S]*\}/g, "").trim();
        const preview = parsedPreview || data?.preview || null;

        const withReply: ChatMessage[] = [
          ...newMessages,
          { role: "assistant", content: cleanReply, preview: preview || undefined },
        ];
        setMessages(withReply);
        await persistMessage("assistant", fullTextRaw);

        // Ativa preview area se preview foi gerado
        if (preview) {
          setActivePreview(preview);
          setActivePreviewProduct(preview.type || "");
          setPreviewState("preview");
          if (isMobile) setActiveTab("preview");

        // ACTION=EXECUTE
        if (data?.action?.action === "execute") {
          setPreviewState("idle");
          setActivePreview(null);
          await handleExecuteAction(data.action, withReply, newMessages);
        }
      }
    } catch {
      const errMsg = "Ops, algo deu errado. Tenta de novo!";
      setMessages([...messages, { role: "user", content: userText }, { role: "assistant", content: errMsg }]);
      await persistMessage("assistant", errMsg);
    }

    setChatLoading(false);
  }, [input, messages, chatLoading, ctx, persistMessage, isMobile, subscribeToChoices, orders, createdOrderId, handleExecuteAction, previewState]);


  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !userIdRef.current) return;
    setPhotoUploading(true);

    const sb = supabase();
    const { data: sessionData } = await sb.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setPhotoUploading(false);
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach(f => formData.append("files", f));

    let uploadedCount = 0;
    try {
      const res = await fetch("/api/upload-photo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      uploadedCount = data.uploaded?.length || 0;
    } catch (err) {
      console.error("Photo upload error:", err);
    }

    setPhotoUploading(false);
    setShowPhotoUpload(false);
    if (photoInputRef.current) photoInputRef.current.value = "";
    const msg = uploadedCount > 0
      ? `${uploadedCount} foto(s) enviada(s) com sucesso! Acesse seu banco de fotos completo em Fotos no menu.`
      : "Erro ao enviar fotos. Tente novamente.";
    setMessages(prev => [...prev, { role: "assistant", content: msg }]);
    await persistMessage("assistant", msg);
  };

  const handleDownload = async (order: any) => {
    const d = order.deliverables?.[0];
    if (!d) return;
    const sb = supabase();
    const { data } = await sb.storage.from("deliverables").createSignedUrl(d.file_path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (ctxLoading || ordersLoading) return (
    <div style={{ background: T.sand, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkMid, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15 }}>
      Carregando...
    </div>
  );

  /* ─── Preview Area (right column when preview is active) ─── */
  const previewAreaContent = (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "calc(100vh - 64px - 48px)" : "calc(100vh - 64px)", background: T.sand }}>

      {/* Preview header */}
      <div style={{ padding: "14px 22px", background: T.white, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>
              {previewState === "generating" ? "Gerando preview..." : previewState === "preview" ? "Amostra gratuita" : "Área de Preview"}
            </div>
            <div style={{ fontSize: 11, color: T.inkMid, marginTop: 2 }}>
              {previewState === "generating" ? "IA criando seu conteúdo" : previewState === "preview" ? (PRODUCT_NAME[activePreviewProduct] || "Preview") : "O preview aparece aqui"}
            </div>
          </div>
          {previewState !== "idle" && (
            <button onClick={() => { setPreviewState("idle"); setActivePreview(null); }} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600, color: T.inkMid, cursor: "pointer", fontFamily: "inherit" }}>
              Ver pedidos
            </button>
          )}
        </div>
        {previewState === "generating" && (
          <div style={{ height: 3, background: T.border, borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", background: T.lime, borderRadius: 2, width: "60%", animation: "progressPulse 2s ease-in-out infinite" }} />
          </div>
        )}
      </div>

      {/* State: Empty/Idle */}
      {previewState === "idle" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 48, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: T.border, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <rect x="3" y="3" width="20" height="20" rx="4" stroke={T.inkFaint} strokeWidth="1.4"/>
              <path d="M8 13h10M13 8v10" stroke={T.inkFaint} strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.inkSub }}>Nenhuma prévia ainda</div>
          <div style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.65, maxWidth: 260 }}>
            Responda o briefing no chat. O preview aparece aqui assim que a IA gerar.
          </div>
        </div>
      )}

      {/* State: Generating */}
      {previewState === "generating" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${T.border}`, borderTopColor: T.lime, animation: "spin 0.75s linear infinite" }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Gerando preview...</div>
          <div style={{ fontSize: 12, color: T.inkMid }}>IA escrevendo copy ao vivo</div>
        </div>
      )}

      {/* State: Preview Card */}
      {previewState === "preview" && activePreview && (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: T.inkMid, marginBottom: 14, textTransform: "uppercase" as const }}>
              AMOSTRA — {PRODUCT_NAME[activePreviewProduct] || "PREVIEW"}
            </div>

            {/* Post Card Visual */}
            <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", maxWidth: 480, transition: "border-color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = T.lime)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
            >
              {/* Visual area — hook display */}
              <div style={{ height: 200, background: T.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 22, color: "#F8F8F4", lineHeight: 1.3, textAlign: "center" }}>
                  {activePreview.hook || activePreview.headline || activePreview.hero_headline || activePreview.cover_title || activePreview.subject || activePreview.name || "Preview"}
                </div>
                <div style={{ position: "absolute", top: 12, right: 12, fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", background: T.lime, color: T.ink, padding: "3px 8px", borderRadius: 4 }}>
                  {(activePreviewProduct || "preview").toUpperCase().replace(/_/g, " ")}
                </div>
                <div style={{ position: "absolute", top: 12, left: 12, fontSize: 9, fontWeight: 600, color: "#888", letterSpacing: "0.04em" }}>
                  PREVIEW GRATUITO
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "18px 20px" }}>
                {/* Title */}
                <div style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 18, fontWeight: 400, color: T.ink, marginBottom: 12 }}>
                  {activePreview.hook || activePreview.headline || activePreview.hero_headline || activePreview.cover_title || activePreview.subject || activePreview.name || ""}
                </div>

                {/* Caption / main content */}
                {(activePreview.caption || activePreview.hook || activePreview.first_paragraph || activePreview.hero_subheadline || activePreview.body || activePreview.first_15s || activePreview.cover_subtitle || activePreview.slide1_text || activePreview.value_prop) && (
                  <div style={{ fontSize: 13, color: T.inkSub, lineHeight: 1.75, whiteSpace: "pre-wrap", marginBottom: 14, borderLeft: `2px solid ${T.lime}`, paddingLeft: 12 }}>
                    {activePreview.caption || activePreview.first_paragraph || activePreview.hero_subheadline || activePreview.body || activePreview.first_15s || activePreview.cover_subtitle || activePreview.slide1_text || activePreview.value_prop || activePreview.hook || ""}
                  </div>
                )}

                {/* Hashtags */}
                {activePreview.hashtags && activePreview.hashtags.length > 0 && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 6 }}>Hashtags</div>
                    <div style={{ fontSize: 11.5, color: T.green, lineHeight: 1.9 }}>
                      {Array.isArray(activePreview.hashtags) ? activePreview.hashtags.map((h: string) => h.startsWith("#") ? h : `#${h}`).join(" ") : activePreview.hashtags}
                    </div>
                  </>
                )}

                {/* Features (for app) */}
                {activePreview.features && activePreview.features.length > 0 && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 6, marginTop: 10 }}>Funcionalidades</div>
                    {activePreview.features.map((f: string, i: number) => (
                      <div key={i} style={{ fontSize: 12, color: T.inkSub, marginBottom: 3 }}>• {f}</div>
                    ))}
                  </>
                )}

                {/* Slides (for carrossel) */}
                {activePreview.slide1_headline && (
                  <div style={{ background: T.sand, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", marginTop: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{activePreview.slide1_headline}</div>
                    {activePreview.slide1_text && <div style={{ fontSize: 11, color: T.inkSub, marginTop: 2 }}>{activePreview.slide1_text}</div>}
                  </div>
                )}

                {/* Content pack posts */}
                {activePreview.posts && activePreview.posts.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {activePreview.posts.map((p: any, i: number) => (
                      <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < activePreview.posts.length - 1 ? `1px solid ${T.border}` : "none" }}>
                        {p.headline && <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Post {i + 1}: {p.headline}</div>}
                        {p.hook && <div style={{ fontSize: 12, color: T.inkSub, marginTop: 2 }}>{p.hook}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Meta tags */}
                <div style={{ display: "flex", gap: 7, marginTop: 14, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: T.sand, color: T.inkSub, letterSpacing: "0.03em" }}>
                    {PRODUCT_NAME[activePreviewProduct] || activePreviewProduct}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: T.sand, color: T.inkSub, letterSpacing: "0.03em" }}>
                    AMOSTRA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Approve bar */}
          <div style={{ background: T.white, borderTop: `1px solid ${T.border}`, padding: "14px 22px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <div style={{ fontSize: 12.5, color: T.inkMid, flex: 1, lineHeight: 1.5 }}>
              Gostou? Aprovando, você recebe <strong style={{ color: T.ink }}>3 variações completas + imagens</strong>.
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => sendMessage("Quero ajustar o tom")}
                style={{ fontSize: 12, fontWeight: 700, padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", background: T.white, border: `1.5px solid ${T.borderMd}`, color: T.ink, transition: "all 0.15s" }}
              >
                Ajustar
              </button>
              <button
                onClick={() => sendMessage("Sim, pode gerar!")}
                style={{ fontSize: 12, fontWeight: 700, padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", background: T.lime, border: `1.5px solid ${T.lime}`, color: T.ink, transition: "all 0.15s" }}
              >
                Aprovar e gerar →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  /* ─── Pedidos column content ─── */
  const pedidosContent = (
    <div style={{ padding: isMobile ? "20px 16px" : "32px 40px", overflowY: "auto" }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: isMobile ? 8 : 16, marginBottom: isMobile ? 20 : 28 }}>
        {[
          { label: "Total de pedidos", value: orders.length.toString(), color: T.ink },
          { label: "Em andamento", value: orders.filter(o => o.status === "in_production").length.toString(), color: T.teal },
          { label: "Entregues", value: orders.filter(o => o.status === "delivered").length.toString(), color: T.green },
        ].map(s => (
          <div key={s.label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: isMobile ? "14px 12px" : "22px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: isMobile ? 10 : 12, color: T.inkMid, fontWeight: 600, marginBottom: isMobile ? 4 : 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            <div style={{ fontSize: isMobile ? 24 : 36, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Banner de upgrade */}
      {(PLAN_MAX_CREDITS[ctx?.plan || "free"] || 20) > 0 && (ctx?.credits ?? 0) <= (PLAN_MAX_CREDITS[ctx?.plan || "free"] || 20) * UPGRADE_THRESHOLD && (ctx?.credits ?? 0) > 0 && (
        <div style={{ background: `linear-gradient(135deg, ${T.ink}, #1a1a2e)`, borderRadius: 14, padding: "18px 24px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.lime, marginBottom: 2 }}>Créditos acabando!</div>
            <div style={{ fontSize: 12, color: "#A0A0A0" }}>Você tem {ctx?.credits ?? 0} créditos restantes. Faça upgrade para continuar criando.</div>
          </div>
          <a href="/precos" style={{ background: T.lime, color: T.ink, border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>Fazer upgrade →</a>
        </div>
      )}

      {/* Filtros */}
      {orders.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.inkSub, fontFamily: "inherit", cursor: "pointer" }}>
            <option value="all">Todos os tipos</option>
            {Object.entries(PRODUCT_NAME).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.inkSub, fontFamily: "inherit", cursor: "pointer" }}>
            <option value="all">Todos os status</option>
            <option value="briefing">Briefing</option>
            <option value="in_production">Em Produção</option>
            <option value="delivered">Entregue</option>
            <option value="failed">Erro</option>
          </select>
          {(filterType !== "all" || filterStatus !== "all") && (
            <button onClick={() => { setFilterType("all"); setFilterStatus("all"); }} style={{ background: "transparent", border: "none", color: T.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Limpar filtros</button>
          )}
        </div>
      )}

      {/* Lista de pedidos */}
      {orders.length === 0 ? (
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: isMobile ? "40px 20px" : "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>✦</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Nenhum pedido ainda.</div>
          <div style={{ fontSize: 14, color: T.inkMid, marginBottom: 24 }}>Use o chat {isMobile ? "na aba ao lado" : "ao lado"} para criar seu primeiro projeto.</div>
          {isMobile && (
            <button onClick={() => setActiveTab("chat")} style={{ background: T.lime, color: T.ink, border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Ir para o chat →
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orders.filter(o => (filterType === "all" || o.product === filterType) && (filterStatus === "all" || o.status === filterStatus)).map((order) => {
            const st = STATUS[order.status] || STATUS.briefing;
            const deadline = order.delivery_deadline ? new Date(order.delivery_deadline) : null;
            return (
              <div key={order.id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ padding: isMobile ? "16px 16px" : "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{PRODUCT_NAME[order.product] || order.product}</div>
                    <div style={{ fontSize: 12, color: T.inkFaint }}>Pedido #{order.order_number}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, background: st.bg, color: st.color, borderRadius: 20, padding: "6px 14px 6px 10px", fontSize: 12, fontWeight: 700 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: st.dot, display: "inline-block" }} />
                    {st.label}
                  </div>
                </div>
                {!isMobile && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
                    {[
                      { label: "Valor", value: `${order.currency} ${order.amount}` },
                      { label: "Pedido em", value: new Date(order.created_at).toLocaleDateString("pt-BR") },
                      { label: "Entrega até", value: deadline ? deadline.toLocaleDateString("pt-BR") : "—" },
                    ].map((item, i) => (
                      <div key={item.label} style={{ padding: "14px 28px", borderRight: i < 2 ? `1px solid ${T.border}` : "none" }}>
                        <div style={{ fontSize: 11, color: T.inkFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ padding: isMobile ? "12px 16px" : "16px 28px" }}>
                  {order.status === "delivered" && (
                    <>
                      {/* Preview do conteúdo */}
                      {order.preview_text && (
                        <div style={{
                          background: T.sand, border: `1.5px solid ${T.lime}`, borderRadius: 12,
                          padding: "14px 18px", marginBottom: 14,
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                            Preview do conteúdo
                          </div>
                          <p style={{ fontSize: 13, color: T.inkSub, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", overflow: "hidden", maxHeight: 72 }}>
                            {order.preview_text}
                          </p>
                        </div>
                      )}
                      {order.delivered_at && (
                        <div style={{ fontSize: 11, color: T.inkFaint, marginBottom: 10 }}>
                          Entregue em {new Date(order.delivered_at).toLocaleDateString("pt-BR")} às {new Date(order.delivered_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <a href={`/cliente/pedidos/${order.id}`} style={{ background: T.lime, color: T.ink, border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "inline-block" }}>⬇ Download</a>
                        <a href={`/cliente/pedidos/${order.id}`} style={{ background: T.white, color: T.ink, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "inline-block" }}>Ver detalhes →</a>
                      </div>
                      {landingPageSlugs[order.id] && (
                        <iframe
                          src={`/lp/${landingPageSlugs[order.id]}`}
                          style={{ width: "100%", height: 400, border: `1px solid ${T.border}`, borderRadius: 12, marginTop: 12 }}
                          title="Preview da Landing Page"
                        />
                      )}
                    </>
                  )}
                  {order.status === "in_production" && (
                    <a href={`/cliente/pedidos/${order.id}`} style={{ color: T.teal, fontSize: 13, fontWeight: 600, textDecoration: "none", display: "inline-block" }}>✦ Ver opções / Acompanhar →</a>
                  )}
                  {order.status === "briefing" && (
                    <div style={{ color: T.amber, fontSize: 13, fontWeight: 600 }}>📋 Aguardando confirmação do briefing</div>
                  )}
                  {order.status === "failed" && (
                    <div style={{ color: "#DC2626", fontSize: 13, fontWeight: 600 }}>⚠ Erro na geração. Tente novamente pelo chat.</div>
                  )}
                </div>
                {/* Project Tracker */}
                <div style={{ padding: isMobile ? "0 12px 12px" : "0 24px 16px" }}>
                  <ProjectTracker order={order} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ─── Chat column content ─── */
  const chatContent = (
    <div style={{ background: T.white, borderRight: isMobile ? "none" : `1px solid ${T.border}`, display: "flex", flexDirection: "column", height: isMobile ? "calc(100vh - 64px - 48px)" : "calc(100vh - 64px)", position: isMobile ? "relative" : "sticky", top: isMobile ? undefined : 64 }}>

      {/* Chat header */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.ink, color: T.lime, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>V</div>
          <div>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 14, letterSpacing: "-0.5px", color: T.ink, textTransform: "uppercase" as const }}>VOKU</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
              <span style={{ fontSize: 11, color: T.inkMid }}>online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {!chatStarted && (
          <div>
            <div style={{ background: T.sand, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: T.inkSub, lineHeight: 1.6, margin: 0 }}>
                Oi{ctx?.name ? `, ${ctx.name.split(" ")[0]}` : ""}! 👋 O que você precisa criar hoje?
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {QUICK_STARTS.map(q => (
                <button key={q} onClick={() => sendMessage(q)} style={{ background: T.sand, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", color: T.inkSub, fontSize: 12, fontWeight: 500, cursor: "pointer", textAlign: "left", fontFamily: "inherit", lineHeight: 1.4 }}>
                  {q} →
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          // Re-parse preview from history content (persisted with markers)
          const { cleanText: displayText, preview: historyPreview } = msg.role === "assistant"
            ? parsePreviewFromContent(msg.content)
            : { cleanText: msg.content, preview: null };
          const preview = msg.preview || historyPreview;
          // Also clean any leftover action JSON from display
          const finalDisplay = msg.role === "assistant"
            ? displayText.replace(/\{[\s\S]*"action"[\s\S]*\}/g, "").trim()
            : displayText;

          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", width: "100%" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.ink, color: T.lime, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, marginRight: 8, marginTop: 2 }}>V</div>
                )}
                <div style={{ maxWidth: "78%" }}>
                  {finalDisplay && (
                    <div style={{
                      background: msg.role === "user" ? T.ink : T.sand,
                      color: msg.role === "user" ? T.white : T.inkSub,
                      padding: "10px 14px",
                      borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                      fontSize: 13,
                      lineHeight: 1.65,
                      whiteSpace: "pre-wrap",
                    }}>
                      {finalDisplay}
                    </div>
                  )}
                  {preview && <PreviewCard preview={preview} />}
                </div>
              </div>
            </div>
          );
        })}

        {/* OrderChoices inline */}
        {pendingOrder && !choicesApproved && (
          <div style={{ marginTop: 16, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", background: "#0a0a0a" }}>
            <OrderChoices
              order={pendingOrder.orderData}
              choices={pendingOrder.choices}
              deliverables={[]}
              iterationId={pendingOrder.iterationId}
            />
          </div>
        )}

        {choicesApproved && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12, marginTop: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.ink, color: T.lime, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, marginRight: 8, marginTop: 2 }}>V</div>
            <div style={{ maxWidth: "78%", background: T.greenBg, color: T.green, padding: "10px 14px", borderRadius: "4px 16px 16px 16px", fontSize: 13, lineHeight: 1.65, fontWeight: 600 }}>
              Material aprovado e pronto para download ✓
            </div>
          </div>
        )}

        {chatLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.ink, color: T.lime, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>V</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.inkFaint, animation: "pulse 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "16px 24px", borderTop: `1px solid ${T.border}`, position: "relative" }}>
        {/* Photo upload popup */}
        {showPhotoUpload && (
          <div style={{
            position: "absolute", bottom: "100%", left: 24, right: 24,
            background: T.white, border: `1px solid ${T.border}`, borderRadius: 14,
            padding: "16px", marginBottom: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Enviar fotos</span>
              <button onClick={() => setShowPhotoUpload(false)} style={{ background: "transparent", border: "none", color: T.inkFaint, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>x</button>
            </div>
            <div
              onClick={() => photoInputRef.current?.click()}
              style={{
                border: `2px dashed ${T.borderMd}`, borderRadius: 10, padding: "20px",
                textAlign: "center", cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 13, color: T.inkMid, fontWeight: 600 }}>
                {photoUploading ? "Enviando..." : "Clique para selecionar imagens"}
              </div>
              <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 4 }}>JPG, PNG, WEBP, GIF — máx 10MB</div>
            </div>
            <a href="/cliente/fotos" style={{ display: "block", textAlign: "center", fontSize: 12, color: T.teal, fontWeight: 600, marginTop: 10, textDecoration: "none" }}>
              Ver banco de fotos completo →
            </a>
          </div>
        )}
        <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handlePhotoUpload} style={{ display: "none" }} />

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: T.sand, border: `1px solid ${T.borderMd}`, borderRadius: 12, padding: "10px 14px" }}>
          {/* Botão + para fotos */}
          <button
            onClick={() => setShowPhotoUpload(!showPhotoUpload)}
            disabled={photoUploading}
            style={{
              width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${T.borderMd}`,
              background: showPhotoUpload ? T.ink : "transparent",
              color: showPhotoUpload ? T.lime : T.inkMid,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 300, flexShrink: 0, transition: "all 0.2s",
            }}
          >+</button>
          {/* Botão microfone */}
          {voice.isSupported && (
            <button
              onClick={voice.toggleListening}
              title={voice.isListening ? "Parar gravação" : "Falar"}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                border: voice.isListening ? `2px solid #EF4444` : `1.5px solid ${T.borderMd}`,
                background: voice.isListening ? "#FEE2E2" : "transparent",
                color: voice.isListening ? "#EF4444" : T.inkMid,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, flexShrink: 0, transition: "all 0.2s",
                animation: voice.isListening ? "voicePulse 1.5s ease-in-out infinite" : "none",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          )}
          <textarea
            value={input + (voice.interimText ? (input ? " " : "") + voice.interimText : "")}
            onChange={e => { if (!voice.isListening) setInput(e.target.value); }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); voice.stopListening(); sendMessage(); } }}
            placeholder={voice.isListening ? "Ouvindo..." : "O que você precisa criar hoje?"}
            rows={1}
            readOnly={voice.isListening}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 13, color: voice.isListening ? T.inkMid : T.ink, fontFamily: "inherit", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", fontStyle: voice.isListening ? "italic" : "normal" }}
            onInput={(e: any) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
          />
          <button
            onClick={() => { voice.stopListening(); sendMessage(); }}
            disabled={!input.trim() || chatLoading}
            style={{ width: 32, height: 32, borderRadius: "50%", background: input.trim() && !chatLoading ? T.ink : T.borderMd, border: "none", color: input.trim() && !chatLoading ? T.lime : T.white, cursor: input.trim() && !chatLoading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}
          >↑</button>
        </div>
        {voice.error && (
          <p style={{ textAlign: "center", fontSize: 11, color: "#EF4444", marginTop: 6 }}>{voice.error}</p>
        )}
        <p style={{ textAlign: "center", fontSize: 10, color: T.inkFaint, marginTop: 8 }}>
          Enter para enviar · Shift+Enter para nova linha{voice.isSupported ? " · 🎤 para ditar" : ""}
        </p>
        <style>{`
          @keyframes voicePulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
            50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
          }
        `}</style>
      </div>
    </div>
  );

  return (
    <div style={{ background: T.sand, minHeight: "calc(100vh - 64px)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

      {/* Mobile tabs */}
      {isMobile && (
        <div style={{ display: "flex", background: T.white, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 64, zIndex: 9 }}>
          {(["chat", "preview", "pedidos"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "12px 0",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab ? `2.5px solid ${T.ink}` : "2.5px solid transparent",
                color: activeTab === tab ? T.ink : T.inkFaint,
                cursor: "pointer",
                position: "relative",
              }}
            >
              {tab === "pedidos" ? "Pedidos" : tab === "chat" ? "Chat" : "Preview"}
              {tab === "preview" && previewState === "preview" && (
                <span style={{ position: "absolute", top: 8, right: "calc(50% - 30px)", width: 6, height: 6, borderRadius: "50%", background: T.lime }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Layout */}
      {isMobile ? (
        // Mobile: mostra tab ativa
        activeTab === "pedidos" ? pedidosContent : activeTab === "preview" ? previewAreaContent : chatContent
      ) : (
        // Desktop: split — preview area quando ativo, senão pedidos
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 0, minHeight: "calc(100vh - 64px)" }}>
          {chatContent}
          {previewState !== "idle" ? previewAreaContent : pedidosContent}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progressPulse { 0%{width:20%;opacity:0.7} 50%{width:80%;opacity:1} 100%{width:20%;opacity:0.7} }
      `}</style>
    </div>
  );
}
