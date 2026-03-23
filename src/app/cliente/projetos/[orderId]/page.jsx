"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/hooks/useUserContext";
import { useSearchParams } from "next/navigation";
import { useVoiceInput } from "@/hooks/useVoiceInput";

const T = {
  sand: "#FAF8F3", white: "#FFFFFF", ink: "#111", inkMid: "#6B6B6B",
  inkFaint: "#A0A0A0", lime: "#C8F135", border: "#E8E5DE", borderMd: "#D1CCBF",
  green: "#166534", greenBg: "#DCFCE7", blue: "#1D4ED8", blueBg: "#DBEAFE",
  amber: "#B45309", amberBg: "#FEF3C7", red: "#991B1B", redBg: "#FEE2E2",
};
const FF = "'Plus Jakarta Sans', sans-serif";
const FI = "'Inter', sans-serif";

const PRODUCT_LABEL = {
  landing_page_copy: "LANDING PAGE", content_pack: "POSTS", email_sequence: "E-MAIL",
  post_instagram: "POSTS", carrossel: "CARROSSEL", reels_script: "REELS", ad_copy: "COPY", app: "APP",
};

const INITIAL_MESSAGES = {
  landing_page_copy: "Olá! Vamos criar a sua landing page. Me conta: qual é o produto ou serviço, quem é o público e qual o principal benefício que você quer destacar?",
  content_pack: "Olá! Vamos criar o seu pack de posts. Me conta: qual é a marca, o nicho e o tom de voz — mais técnico, acessível ou inspiracional?",
  post_instagram: "Olá! Vamos criar o seu pack de posts. Me conta: qual é a marca, o nicho e o tom de voz — mais técnico, acessível ou inspiracional?",
  email_sequence: "Olá! Vamos criar a sua sequência de e-mails. Me conta: qual é o produto, qual o objetivo da sequência e em quanto tempo acontece o lançamento?",
  carrossel: "Olá! Vamos criar o seu carrossel. Qual é o tema, o público e qual ação você quer que o leitor tome no último slide?",
  reels_script: "Olá! Vamos criar o roteiro do seu Reels. Qual é o tema, a duração (30s, 60s ou 90s) e o tom — educativo, provocativo ou bastidor?",
  ad_copy: "Olá! Vamos criar os seus anúncios. Me conta: qual é o produto, qual a maior dor do seu público e qual prova social você tem disponível?",
  app: "Olá! Vamos criar o seu app. Me conta: qual é a ideia, quem vai usar e qual o principal problema que ele resolve?",
};

const PHASE_STATUS = {
  done: { label: "CONCLUÍDO", color: T.green, bg: T.greenBg },
  active: { label: "EM PRODUÇÃO", color: T.blue, bg: T.blueBg },
  pending: { label: "AGUARDANDO", color: T.inkFaint, bg: T.sand },
};
const DEL_STATUS = {
  pending: { label: "PENDENTE", color: T.amber, bg: T.amberBg },
  approved: { label: "APROVADO", color: T.green, bg: T.greenBg },
  rejected: { label: "REJEITADO", color: T.red, bg: T.redBg },
};

function fmtDate(d) { return d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function fmtTime(d) { return d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : null; }

export default function ProjetoPage({ params }) {
  const { ctx } = useUserContext();
  const searchParams = useSearchParams();
  const orderId = params.orderId;

  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [phases, setPhases] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [tab, setTab] = useState(searchParams.get("tab") || "etapas");
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [expandedDel, setExpandedDel] = useState(null);
  const [feedbacks, setFeedbacks] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const bottomRef = useRef(null);
  const userIdRef = useRef(null);
  const photoInputRef = useRef(null);

  const voice = useVoiceInput({
    lang: "pt-BR",
    silenceTimeout: 2500,
    onTranscript: (text) => setInput(prev => prev ? prev + " " + text : text),
  });

  // ── Load everything ──
  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(async ({ data: authData }) => {
      if (!authData.user) { window.location.href = "/cliente"; return; }
      userIdRef.current = authData.user.id;

      const { data: o } = await sb.from("orders").select("*").eq("id", orderId).single();
      if (!o) { window.location.href = "/cliente/home"; return; }
      setOrder(o);

      // Load messages
      const { data: msgs } = await sb.from("project_messages").select("*")
        .eq("order_id", orderId).order("created_at", { ascending: true });

      if (!msgs || msgs.length === 0) {
        // Send initial message
        const initial = INITIAL_MESSAGES[o.product] || INITIAL_MESSAGES.ad_copy;
        await sb.from("project_messages").insert({
          order_id: orderId, user_id: authData.user.id,
          role: "assistant", content: initial,
        });
        setMessages([{ role: "assistant", content: initial }]);
      } else {
        setMessages(msgs.map(m => ({ role: m.role, content: m.content })));
      }

      await loadPhases();
      await loadDeliverables();
      setLoading(false);
    });
  }, [orderId]);

  const loadPhases = useCallback(async () => {
    const sb = supabase();
    const { data: ph } = await sb.from("project_phases").select("*")
      .eq("order_id", orderId).order("phase_number");
    const { data: steps } = await sb.from("project_steps").select("*")
      .eq("order_id", orderId).order("step_number");
    const enriched = (ph || []).map(p => ({ ...p, steps: (steps || []).filter(s => s.phase_id === p.id) }));
    setPhases(enriched);
    const active = enriched.find(p => p.status === "active");
    if (active) setExpandedPhase(active.id);
  }, [orderId]);

  const loadDeliverables = useCallback(async () => {
    const res = await fetch(`/api/deliverables?order_id=${orderId}`);
    const json = await res.json();
    setDeliverables(json.deliverables || []);
  }, [orderId]);

  // Scroll chat
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatLoading]);

  // ── Send message ──
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || chatLoading) return;
    setInput("");
    setChatLoading(true);

    const newMsgs = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);

    const sb = supabase();
    await sb.from("project_messages").insert({ order_id: orderId, user_id: userIdRef.current, role: "user", content: text });

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const systemPrompt = `Você é o agente da Voku, especialista em marketing digital e copywriting.
Este é o projeto: ${order?.product} criado em ${fmtDate(order?.created_at)}.

REGRAS ABSOLUTAS:
- Tom direto e profissional. Máximo 1 emoji por mensagem.
- Máximo 2 perguntas por mensagem. Quando tiver briefing suficiente, execute.
- NUNCA entregue conteúdo apenas no chat. Sempre use o bloco de entrega.
- Nunca diga que o sistema não permite algo.
- Mantenha contexto de toda a conversa anterior.

FLUXO:
1. Se não tiver briefing suficiente: pergunte (máximo 2 rodadas)
2. Execute e gere o conteúdo completo
3. Resuma brevemente no chat o que foi criado
4. OBRIGATÓRIO: termine com o bloco abaixo

FORMATO DE ENTREGA OBRIGATÓRIO:
___DELIVERABLE___
{
  "title": "título curto descritivo",
  "type": "post|carrossel|email|landing_page|reels|copy",
  "content": "conteúdo completo e formatado aqui"
}
___END___`;

      const res = await fetch(`${supabaseUrl}/functions/v1/voku-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
          user_context: {
            name: ctx?.name || "você", plan: ctx?.plan || "free",
            credits: ctx?.credits ?? 0, channel: "project", user_id: userIdRef.current,
          },
          system_override: systemPrompt,
        }),
      });

      const data = await res.json();
      const rawReply = data?.content?.[0]?.text || "Ops, tive um problema. Pode repetir?";

      // Parse deliverable
      const delMatch = rawReply.match(/___DELIVERABLE___([\s\S]*?)___END___/);
      let parsedDel = data?.deliverable || null;
      if (delMatch) {
        try { parsedDel = JSON.parse(delMatch[1].trim()); } catch {}
      }
      const cleanReply = rawReply.replace(/___DELIVERABLE___[\s\S]*?___END___/g, "")
        .replace(/\{[\s\S]*"action"[\s\S]*\}/g, "").trim();

      const withReply = [...newMsgs, { role: "assistant", content: cleanReply }];
      setMessages(withReply);
      await sb.from("project_messages").insert({ order_id: orderId, user_id: userIdRef.current, role: "assistant", content: cleanReply });

      // Save deliverable
      if (parsedDel?.title && parsedDel?.content) {
        await fetch("/api/deliverables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userIdRef.current, order_id: orderId,
            title: parsedDel.title, content: parsedDel.content,
            type: parsedDel.type || "copy", status: "pending",
          }),
        });
        await fetch(`/api/projects/${orderId}/steps/advance`, { method: "POST" });
        await loadPhases();
        await loadDeliverables();

        const delMsg = "✦ Entrega criada. Veja na aba Aprovação ao lado.";
        setMessages([...withReply, { role: "assistant", content: delMsg }]);
        await sb.from("project_messages").insert({ order_id: orderId, user_id: userIdRef.current, role: "assistant", content: delMsg });
      }
    } catch (e) {
      console.error("Chat error:", e);
      const errMsg = "Ops, algo deu errado. Tenta de novo!";
      setMessages([...newMsgs, { role: "assistant", content: errMsg }]);
    }
    setChatLoading(false);
  }, [input, messages, chatLoading, order, ctx, orderId, loadPhases, loadDeliverables]);

  // ── Approve / Reject ──
  const handleApprove = async (id) => {
    setActionLoading(id);
    await fetch(`/api/deliverables/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve" }) });
    await fetch(`/api/projects/${orderId}/steps/advance`, { method: "POST" });
    await loadDeliverables(); await loadPhases();
    setActionLoading(null);
  };
  const handleReject = async (id) => {
    setActionLoading(id);
    await fetch(`/api/deliverables/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject", feedback: feedbacks[id] || "" }) });
    await loadDeliverables();
    setActionLoading(null);
  };
  const handleDownload = (del) => {
    const blob = new Blob([del.content || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${del.title || "entrega"}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || !userIdRef.current) return;
    setPhotoUploading(true);

    const sb = supabase();
    const { data: sessionData } = await sb.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) { setPhotoUploading(false); return; }

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
      ? `${uploadedCount} foto(s) enviada(s) com sucesso! Acesse seu banco de fotos em Fotos no menu.`
      : "Erro ao enviar fotos. Tente novamente.";
    const sb2 = supabase();
    await sb2.from("project_messages").insert({ order_id: orderId, user_id: userIdRef.current, role: "assistant", content: msg });
    setMessages(prev => [...prev, { role: "assistant", content: msg }]);
  };

  if (loading) return <div style={{ background: T.sand, minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkMid, fontFamily: FF }}>Carregando...</div>;

  const totalSteps = phases.flatMap(p => p.steps || []).length;
  const doneSteps = phases.flatMap(p => p.steps || []).filter(s => s.status === "done").length;
  const pct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;
  const pendingCount = deliverables.filter(d => d.status === "pending").length;

  // ══════════════════════════════════════════════
  return (
    <div style={{ background: T.sand, minHeight: "calc(100vh - 64px)", display: "flex", fontFamily: FF }}>

      {/* ── LEFT: CHAT ── */}
      <div style={{ width: 520, maxWidth: "50%", display: "flex", flexDirection: "column", background: T.white, borderRight: `1px solid ${T.border}`, height: "calc(100vh - 64px)", position: "sticky", top: 64 }}>
        {/* Chat header */}
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.lime, color: T.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FI, fontWeight: 900, fontSize: 12 }}>V</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FI, fontWeight: 700, fontSize: 14, color: T.ink }}>Voku</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.lime }} />
              <span style={{ fontSize: 11, color: T.inkMid }}>online</span>
            </div>
          </div>
          <span style={{ fontFamily: FI, fontWeight: 400, fontSize: 11, color: T.inkFaint }}>
            {PRODUCT_LABEL[order?.product] || ""} · #{order?.order_number || ""}
          </span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              {msg.role === "assistant" && (
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.lime, color: T.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FI, fontWeight: 900, fontSize: 9, flexShrink: 0, marginRight: 8, marginTop: 2 }}>V</div>
              )}
              <div style={{
                maxWidth: "78%", padding: "10px 14px", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap",
                background: msg.role === "user" ? T.ink : T.white,
                color: msg.role === "user" ? "#fff" : T.ink,
                border: msg.role === "assistant" ? `1px solid ${T.border}` : "none",
                borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.lime, color: T.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FI, fontWeight: 900, fontSize: 9 }}>V</div>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.inkFaint, animation: "pulse 1.2s infinite", animationDelay: `${i * 0.2}s` }} />)}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Voice error */}
        {voice.error && (
          <div style={{ padding: "6px 16px", fontSize: 12, color: T.red, background: T.redBg }}>{voice.error}</div>
        )}
        {/* Input */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, position: "relative" }}>
          {/* Photo upload popup */}
          {showPhotoUpload && (
            <div style={{
              position: "absolute", bottom: "100%", left: 16, right: 16,
              background: T.white, border: `1px solid ${T.border}`, borderRadius: 14,
              padding: "16px", marginBottom: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: FF }}>Enviar fotos</span>
                <button onClick={() => setShowPhotoUpload(false)} style={{ background: "transparent", border: "none", color: T.inkFaint, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>x</button>
              </div>
              <div
                onClick={() => photoInputRef.current?.click()}
                style={{ border: `2px dashed ${T.borderMd}`, borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer" }}
              >
                <div style={{ fontSize: 13, color: T.inkMid, fontWeight: 600, fontFamily: FF }}>
                  {photoUploading ? "Enviando..." : "Clique para selecionar imagens"}
                </div>
                <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 4 }}>JPG, PNG, WEBP, GIF — máx 10MB</div>
              </div>
              <a href="/cliente/fotos" style={{ display: "block", textAlign: "center", fontSize: 12, color: T.blue, fontWeight: 600, marginTop: 10, textDecoration: "none" }}>
                Ver banco de fotos completo →
              </a>
            </div>
          )}
          <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handlePhotoUpload} style={{ display: "none" }} />

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
            {/* Mic button */}
            {voice.isSupported && (
              <button onClick={voice.toggleListening} title={voice.isListening ? "Parar gravação" : "Falar"} style={{
                width: 32, height: 32, borderRadius: "50%",
                border: voice.isListening ? "2px solid #EF4444" : `1.5px solid ${T.borderMd}`,
                background: voice.isListening ? "#FEE2E2" : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "all 0.2s",
                animation: voice.isListening ? "voicePulse 1.5s infinite" : "none",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={voice.isListening ? "#EF4444" : T.inkMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="1" width="6" height="12" rx="3" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
            )}
            <input
              value={voice.isListening && voice.interimText ? input + (input ? " " : "") + voice.interimText : input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); voice.isListening && voice.stopListening(); sendMessage(); } }}
              placeholder={voice.isListening ? "Ouvindo..." : "Descreva o que precisa..."}
              readOnly={voice.isListening}
              style={{ flex: 1, background: voice.isListening ? "#fef9e7" : "#f5f5f0", border: voice.isListening ? `1px solid ${T.lime}` : "none", borderRadius: 20, padding: "10px 16px", fontSize: 13, color: T.ink, fontFamily: FF, outline: "none", transition: "background 0.2s, border 0.2s" }}
            />
            <button onClick={() => { voice.isListening && voice.stopListening(); sendMessage(); }} disabled={!input.trim() || chatLoading} style={{
              width: 32, height: 32, borderRadius: "50%", border: "none", cursor: input.trim() && !chatLoading ? "pointer" : "not-allowed",
              background: input.trim() && !chatLoading ? T.lime : T.borderMd,
              color: T.ink, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
            }}>↑</button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: MANAGEMENT PANEL ── */}
      <div style={{ flex: 1, overflowY: "auto", height: "calc(100vh - 64px)" }}>
        {/* Panel header */}
        <div style={{ padding: "20px 28px", background: T.white, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ background: T.ink, color: T.lime, fontFamily: FI, fontWeight: 800, fontSize: 10, letterSpacing: 2, padding: "3px 8px", borderRadius: 4 }}>
              {PRODUCT_LABEL[order?.product] || ""}
            </span>
            <span style={{ fontSize: 11, color: T.inkFaint }}>#{order?.order_number || ""}</span>
          </div>
          <div style={{ fontFamily: FI, fontWeight: 700, fontSize: 18, color: T.ink }}>{order?.product?.replace(/_/g, " ")}</div>
          <div style={{ fontSize: 12, color: T.inkMid, marginTop: 4 }}>{pct}% · {doneSteps} de {totalSteps} etapas concluídas</div>
          <div style={{ height: 5, background: T.border, borderRadius: 3, marginTop: 10, overflow: "hidden" }}>
            <div style={{ height: "100%", background: pct === 100 ? T.green : T.lime, borderRadius: 3, width: `${pct}%`, transition: "width 0.3s" }} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: T.white, borderBottom: `1px solid ${T.border}` }}>
          {[{ key: "etapas", label: "Etapas" }, { key: "aprovacao", label: "Aprovação", badge: pendingCount }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "12px 24px", fontSize: 13, fontWeight: 700, fontFamily: FF, background: "transparent", border: "none", cursor: "pointer",
              borderBottom: tab === t.key ? "2px solid #C8F135" : "2px solid transparent",
              color: tab === t.key ? T.ink : T.inkFaint, display: "flex", alignItems: "center", gap: 6,
            }}>
              {t.label}
              {t.badge > 0 && <span style={{ background: T.amberBg, color: T.amber, fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 10 }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: "24px 28px" }}>
          {tab === "etapas" ? (
            /* ── ETAPAS ── */
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {phases.map(phase => {
                const ps = PHASE_STATUS[phase.status] || PHASE_STATUS.pending;
                const isExp = expandedPhase === phase.id;
                return (
                  <div key={phase.id} style={{ background: T.white, border: `1px solid ${phase.status === "active" ? T.lime : T.border}`, borderRadius: 10, overflow: "hidden" }}>
                    <button onClick={() => setExpandedPhase(isExp ? null : phase.id)} style={{
                      width: "100%", background: "transparent", border: "none", cursor: "pointer",
                      padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, fontFamily: FF,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700,
                        background: phase.status === "done" ? T.lime : phase.status === "active" ? T.ink : T.sand,
                        color: phase.status === "done" ? T.ink : phase.status === "active" ? T.lime : T.inkFaint,
                      }}>
                        {phase.status === "done" ? "✓" : phase.status === "active" ? "→" : phase.phase_number}
                      </div>
                      <div style={{ flex: 1, textAlign: "left", fontWeight: 700, fontSize: 14, color: T.ink }}>{phase.title}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: ps.color, background: ps.bg, padding: "3px 8px", borderRadius: 10 }}>{ps.label}</span>
                      <span style={{ fontSize: 12, color: T.inkFaint, transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                    </button>
                    {isExp && (phase.steps || []).length > 0 && (
                      <div style={{ padding: "0 18px 14px", borderTop: `1px solid ${T.border}` }}>
                        <div style={{ paddingTop: 10, display: "flex", flexDirection: "column" }}>
                          {phase.steps.map((step, i) => (
                            <div key={step.id} style={{ display: "flex", gap: 10, position: "relative" }}>
                              {i < phase.steps.length - 1 && <div style={{ position: "absolute", left: 8, top: 20, bottom: -2, width: 2, background: step.status === "done" ? T.lime + "40" : T.border }} />}
                              <div style={{
                                width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 9, fontWeight: 700,
                                background: step.status === "done" ? T.lime : step.status === "active" ? T.ink : T.sand,
                                color: step.status === "done" ? T.ink : step.status === "active" ? T.lime : T.inkFaint,
                                border: `2px solid ${step.status === "done" ? T.lime : step.status === "active" ? T.lime : T.borderMd}`,
                                animation: step.status === "active" ? "pulse 2s infinite" : "none",
                              }}>
                                {step.status === "done" ? "✓" : step.status === "active" ? "→" : "·"}
                              </div>
                              <div style={{ paddingBottom: i < phase.steps.length - 1 ? 12 : 0, flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: step.status === "active" ? 700 : 400, color: step.status === "pending" ? T.inkFaint : T.ink, textDecoration: step.status === "done" ? "line-through" : "none" }}>
                                  {step.label}
                                </div>
                                <div style={{ fontSize: 11, color: T.inkMid, marginTop: 1 }}>
                                  {step.completed_at ? fmtTime(step.completed_at) : step.status === "active" ? "em andamento" : "—"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── APROVAÇÃO ── */
            <div>
              {deliverables.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: T.inkMid }}>
                  <div style={{ fontSize: 28, color: T.lime, marginBottom: 12 }}>✦</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Nenhuma entrega ainda.</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Continue o chat para gerar seu conteúdo.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {deliverables.map(del => {
                    const ds = DEL_STATUS[del.status] || DEL_STATUS.pending;
                    const isExp = expandedDel === del.id;
                    return (
                      <div key={del.id} style={{ background: T.white, border: `1px solid ${del.status === "pending" ? T.lime : T.border}`, borderRadius: 10, overflow: "hidden" }}>
                        <button onClick={() => setExpandedDel(isExp ? null : del.id)} style={{
                          width: "100%", background: "transparent", border: "none", cursor: "pointer",
                          padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, fontFamily: FF,
                        }}>
                          <div style={{ width: 32, height: 32, borderRadius: 6, background: T.ink, color: T.lime, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FI, fontWeight: 800, fontSize: 10, flexShrink: 0 }}>
                            {(del.type || "C")[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{del.title || "Entrega"}</div>
                            <div style={{ fontSize: 11, color: T.inkFaint }}>{del.type} · {fmtDate(del.created_at)}</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: ds.color, background: ds.bg, padding: "3px 8px", borderRadius: 10 }}>{ds.label}</span>
                          <span style={{ fontSize: 12, color: T.inkFaint, transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                        </button>

                        {isExp && (
                          <div style={{ borderTop: `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr" }}>
                            {/* Col 1 — Content */}
                            <div style={{ padding: 16 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.inkMid, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Conteúdo</div>
                              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#555", lineHeight: 1.6, maxHeight: 220, overflowY: "auto", margin: 0, fontFamily: FF }}>{del.content || "—"}</pre>
                            </div>
                            <div style={{ background: T.border }} />
                            {/* Col 2 — Action */}
                            <div style={{ padding: 16 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.inkMid, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Ação</div>
                              {del.status === "pending" ? (
                                <>
                                  <textarea placeholder="Solicitar revisão? Descreva aqui..." value={feedbacks[del.id] || ""} onChange={e => setFeedbacks(f => ({ ...f, [del.id]: e.target.value }))} rows={3}
                                    style={{ width: "100%", boxSizing: "border-box", fontFamily: FF, background: T.sand, border: `1px solid ${T.borderMd}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, color: T.ink, resize: "vertical", outline: "none", marginBottom: 10 }} />
                                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    <button onClick={() => handleApprove(del.id)} disabled={actionLoading === del.id} style={{ background: T.greenBg, color: T.green, border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>✓ Aprovar</button>
                                    <button onClick={() => handleReject(del.id)} disabled={actionLoading === del.id} style={{ background: T.redBg, color: T.red, border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>✕ Rejeitar</button>
                                    <button onClick={() => handleDownload(del)} style={{ background: T.sand, color: T.ink, border: `1px solid ${T.borderMd}`, borderRadius: 6, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>↓ Baixar</button>
                                  </div>
                                </>
                              ) : (
                                <div>
                                  <div style={{ fontSize: 13, color: T.inkMid }}>{ds.label} {del.approved_at && `em ${fmtTime(del.approved_at)}`}{del.rejected_at && `em ${fmtTime(del.rejected_at)}`}</div>
                                  {del.feedback && <div style={{ marginTop: 8, background: T.amberBg, borderRadius: 6, padding: 8, fontSize: 12, color: T.amber }}>Feedback: {del.feedback}</div>}
                                  <button onClick={() => handleDownload(del)} style={{ marginTop: 8, background: T.sand, color: T.ink, border: `1px solid ${T.borderMd}`, borderRadius: 6, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>↓ Baixar</button>
                                </div>
                              )}
                            </div>
                            <div style={{ background: T.border }} />
                            {/* Col 3 — Preview */}
                            <div style={{ padding: 16 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.inkMid, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Preview</div>
                              {(del.type === "post" || del.type === "carrossel") ? (
                                <div style={{ background: "#111", borderRadius: 8, padding: 16, minHeight: 120 }}>
                                  <div style={{ fontFamily: FI, fontWeight: 800, fontSize: 9, color: T.lime, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>{del.type}</div>
                                  <div style={{ fontFamily: FI, fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 6 }}>{(del.content || "").split("\n")[0]?.slice(0, 60)}</div>
                                  <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>{(del.content || "").split("\n").slice(1, 3).join("\n")}</div>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                                    <span style={{ fontSize: 10, color: "#555" }}>voku.one</span>
                                    <span style={{ fontFamily: FI, fontWeight: 900, fontSize: 10, color: T.lime, letterSpacing: 2 }}>VOKU</span>
                                  </div>
                                </div>
                              ) : del.type === "landing_page" && del.preview_url ? (
                                <iframe src={del.preview_url} style={{ width: "100%", height: 180, border: `1px solid ${T.border}`, borderRadius: 6 }} title="Preview" />
                              ) : (
                                <div style={{ background: T.sand, borderRadius: 8, padding: 14, fontSize: 12, color: "#555", lineHeight: 1.6, maxHeight: 180, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                                  {(del.content || "").slice(0, 400)}{(del.content || "").length > 400 ? "..." : ""}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} } @keyframes voicePulse { 0%,100%{box-shadow:0 0 0 0 rgba(153,27,27,0.4)} 50%{box-shadow:0 0 0 8px rgba(153,27,27,0)} }`}</style>
    </div>
  );
}
