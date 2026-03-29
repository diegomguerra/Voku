"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/hooks/useUserContext";
import LandingPageViewer from "@/components/LandingPageViewer";
import RordensPanel from "@/components/RordensPanel";
import PostsBriefingForm, { PostsBriefing } from "@/components/PostsBriefingForm";
import LandingBriefingForm, { LandingBriefing } from "@/components/LandingBriefingForm";
import CarrosselBriefingForm, { CarrosselBriefing } from "@/components/CarrosselBriefingForm";
import EmailBriefingForm, { EmailBriefing } from "@/components/EmailBriefingForm";
import ReelsBriefingForm, { ReelsBriefing } from "@/components/ReelsBriefingForm";
import MetaAdsBriefingForm, { MetaAdsBriefing } from "@/components/MetaAdsBriefingForm";

/* ── Design tokens ── */
const T = {
  lime: "#C8F135", ink: "#111111", bg: "#FFFFFF", sand: "#FAF8F3",
  border: "#E8E5DE", muted: "#888888", surface: "#F4F4F1",
};
const FF = "'Plus Jakarta Sans', sans-serif";
const FI = "'Inter', sans-serif";

const KEYFRAMES = `
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
`;

/* ── Product labels ── */
const PRODUCT_LABELS: Record<string, string> = {
  post_instagram: "Post Instagram", carrossel: "Carrossel", landing_page_copy: "Landing Page",
  email_sequence: "E-mail", ad_copy: "Anúncio", reels_script: "Reels",
  content_pack: "Pack de Conteúdo", app: "App",
};

/* ── Interfaces ── */
interface Choice {
  id: string; label: string; content: { text: string };
  image_url: string | null; html_content?: string | null;
  position: number; is_selected: boolean;
}

/* ── Status mapping ── */
function deriveStatus(order: any, choices: Choice[], executing: boolean): "briefing" | "producao" | "aguardando_aprovacao" | "concluido" {
  if (!order) return "briefing";
  if (order.status === "delivered") return "concluido";
  if (choices.length > 0 && !executing) return "aguardando_aprovacao";
  if (order.status === "in_production" || executing) return "producao";
  return "briefing";
}

function statusProgress(s: string): number {
  if (s === "briefing") return 0;
  if (s === "producao") return 50;
  if (s === "aguardando_aprovacao") return 75;
  if (s === "concluido") return 100;
  return 0;
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  briefing: { label: "BRIEFING", bg: "#FEF3C7", color: "#B45309" },
  producao: { label: "EM PRODUÇÃO", bg: "#E0F2FE", color: "#0369A1" },
  aguardando_aprovacao: { label: "AGUARDANDO APROVAÇÃO", bg: "#DCFCE7", color: "#166534" },
  concluido: { label: "CONCLUÍDO", bg: "#111", color: "#C8F135" },
};

const SUBTITLE: Record<string, string> = {
  briefing: "Preencha o briefing para iniciar a produção",
  producao: "A Voku AI está criando o conteúdo com base no seu briefing",
  aguardando_aprovacao: "Revise as opções e aprove a que mais gostar",
  concluido: "Projeto finalizado e disponível para download",
};

const STEPS = ["Briefing", "Produção", "Revisão", "Concluído"];

/* ══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function ProjetoPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { ctx } = useUserContext();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [executing, setExecuting] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [revisionOpen, setRevisionOpen] = useState<string | null>(null);
  const [revisionText, setRevisionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Load order + choices ── */
  const loadChoices = useCallback(async () => {
    const sb = supabase();
    const { data } = await sb.from("choices")
      .select("id, label, content, image_url, position, is_selected, html_content")
      .eq("order_id", orderId).order("position");
    if (data) setChoices(data as Choice[]);
  }, [orderId]);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(async ({ data: auth }) => {
      if (!auth.user) { window.location.href = "/cliente"; return; }
      userIdRef.current = auth.user.id;
      const { data: o } = await sb.from("orders").select("*").eq("id", orderId).single();
      if (o) setOrder(o);
      loadChoices();
    });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [orderId, loadChoices]);

  /* ── Poll choices when executing ── */
  useEffect(() => {
    if (executing && !pollRef.current) {
      pollRef.current = setInterval(loadChoices, 4000);
    }
    if (choices.length >= 3 && choices.every(c => c.image_url)) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      setExecuting(false);
      // Reload order to get updated status
      supabase().from("orders").select("*").eq("id", orderId).single().then(({ data }) => { if (data) setOrder(data); });
    }
  }, [executing, choices, loadChoices, orderId]);

  /* ── Derived state ── */
  const status = deriveStatus(order, choices, executing);
  const productLabel = PRODUCT_LABELS[order?.product] || "Conteúdo";
  const progress = statusProgress(status);
  const sl = STATUS_LABELS[status];
  const approvedChoice = choices.find(c => c.is_selected);

  /* ── Briefing submit handlers ── */
  const handleBriefingSubmit = useCallback(async (structuredData: any, product?: string) => {
    setExecuting(true);
    try {
      const sb = supabase();
      const { data: session } = await sb.auth.getSession();
      const token = session?.session?.access_token;
      if (!token || !userIdRef.current) return;

      await sb.from("orders").update({ status: "in_production" }).eq("id", orderId);
      setOrder((prev: any) => ({ ...prev, status: "in_production" }));

      const res = await fetch("/api/execute-product", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          product: product || order?.product || "post_instagram",
          structured_data: structuredData,
          order_id: orderId,
          user_id: userIdRef.current,
          name: ctx?.name || "",
          email: ctx?.email || "",
        }),
      });
      if (!res.ok) { setExecuting(false); }
      else { loadChoices(); }
    } catch { setExecuting(false); }
  }, [orderId, order, ctx, loadChoices]);

  /* ── Approve choice ── */
  const aprovar = useCallback(async (choiceId: string) => {
    setSubmitting(true);
    await fetch(`/api/projects/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "delivered", choice_aprovada: choiceId }),
    });
    const sb = supabase();
    const { data: o } = await sb.from("orders").select("*").eq("id", orderId).single();
    if (o) setOrder(o);
    loadChoices();
    setSubmitting(false);
  }, [orderId, loadChoices]);

  /* ── Request revision ── */
  const pedirAjuste = useCallback(async (choiceId: string, descricao: string) => {
    if (!descricao.trim()) return;
    setSubmitting(true);
    await fetch(`/api/projects/${orderId}/revision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, choice_id: choiceId }),
    });
    setRevisionOpen(null);
    setRevisionText("");
    setChoices([]);
    setExecuting(true);
    const sb = supabase();
    const { data: o } = await sb.from("orders").select("*").eq("id", orderId).single();
    if (o) setOrder(o);
    setSubmitting(false);
  }, [orderId]);

  /* ── Copy to clipboard ── */
  const copiar = async (texto: string, btnId: string) => {
    await navigator.clipboard.writeText(texto);
    const btn = document.getElementById(btnId);
    if (btn) { btn.textContent = "Copiado ✓"; setTimeout(() => { btn.textContent = "Copiar"; }, 2000); }
  };

  /* ── Download PDF ── */
  const downloadPDF = async (choice: Choice) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("VOKU", 20, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Projeto: ${order?.preview_text || productLabel}`, 20, 32);
    doc.text(`Tipo: ${productLabel}`, 20, 40);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 48);
    doc.line(20, 54, 190, 54);
    doc.setFontSize(10);
    const text = choice.content?.text || "";
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, 64);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Gerado por Voku · voku.one", 20, 285);
    const nome = (order?.preview_text || "projeto").replace(/\s+/g, "-").toLowerCase().slice(0, 40);
    doc.save(`voku-${nome}.pdf`);
  };

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", fontFamily: FF, background: T.sand, overflow: "hidden" }}>

        {/* ═══ ZONA B: Barra de progresso ═══ */}
        <div style={{
          background: T.bg, borderBottom: `1px solid ${T.border}`, padding: "10px 16px",
          flexShrink: 0,
        }}>
          {/* Progress bar */}
          <div style={{ height: 4, background: "#E8E5DE", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", background: T.lime, borderRadius: 2, width: `${progress}%`, transition: "width 0.5s ease" }} />
          </div>
          {/* Step labels */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {STEPS.map((label, i) => {
              const stepPct = [0, 50, 75, 100][i];
              const isDone = progress >= stepPct;
              const isActive = progress === stepPct;
              return (
                <span key={label} style={{
                  fontSize: 10, fontWeight: isActive ? 800 : 500,
                  color: isDone ? T.ink : T.muted,
                  fontFamily: FI,
                }}>{label}</span>
              );
            })}
          </div>
        </div>

        {/* ═══ ZONA C: Split — Rordens + Conteúdo ═══ */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "380px 1fr", overflow: "hidden" }}>

          {/* ── Rordens ── */}
          <RordensPanel
            produto={order?.product || "post_instagram"}
            produtoLabel={productLabel}
            passo={formStep}
          />

          {/* ── Coluna direita — muda por status ── */}
          <div style={{ background: T.sand, overflowY: "auto" }}>

            {/* ── ESTADO 1: BRIEFING ── */}
            {status === "briefing" && (
              <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
                {order?.product === "landing_page_copy" ? (
                  <LandingPageViewer
                    orderId={orderId}
                    userId={userIdRef.current || ""}
                    initialHtml=""
                    prefill={{ resumo: order?.preview_text || "" }}
                  />
                ) : order?.product === "content_pack" ? (
                  <PostsBriefingForm
                    onSubmit={(data) => handleBriefingSubmit({ ...data, type: "content_pack", resumo: data.descricao }, "content_pack")}
                    loading={executing}
                    onStepChange={setFormStep}
                  />
                ) : order?.product === "carrossel" ? (
                  <CarrosselBriefingForm
                    onSubmit={(data) => handleBriefingSubmit({ ...data, type: "carrossel", resumo: data.tema }, "carrossel")}
                    loading={executing}
                    onStepChange={setFormStep}
                  />
                ) : order?.product === "email_sequence" ? (
                  <EmailBriefingForm
                    onSubmit={(data) => handleBriefingSubmit({ ...data, type: "email_sequence", resumo: `${data.contexto}\n${data.produto}` }, "email_sequence")}
                    loading={executing}
                    onStepChange={setFormStep}
                  />
                ) : order?.product === "reels_script" ? (
                  <ReelsBriefingForm
                    onSubmit={(data) => handleBriefingSubmit({ ...data, type: "reels_script", resumo: data.tema }, "reels_script")}
                    loading={executing}
                    onStepChange={setFormStep}
                  />
                ) : order?.product === "ad_copy" ? (
                  <MetaAdsBriefingForm
                    onSubmit={(data) => handleBriefingSubmit({ ...data, type: "ad_copy", resumo: `${data.diferenciais}\n${data.produto}` }, "ad_copy")}
                    loading={executing}
                    onStepChange={setFormStep}
                  />
                ) : (
                  <GenericBriefingForm
                    productLabel={productLabel}
                    onSubmit={(text) => handleBriefingSubmit({ type: order?.product, resumo: text }, order?.product)}
                    loading={executing}
                  />
                )}
              </div>
            )}

            {/* ── ESTADO 2: PRODUÇÃO ── */}
            {status === "producao" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 48, gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${T.border}`, borderTopColor: T.lime, animation: "spin 1s linear infinite" }} />
                <h2 style={{ fontFamily: FI, fontSize: 15, fontWeight: 500, color: T.ink, margin: 0 }}>Produzindo seu conteúdo</h2>
                <p style={{ fontSize: 13, color: T.muted, margin: 0, textAlign: "center" }}>A Voku AI está criando o conteúdo com base no seu briefing...</p>
                <span style={{ fontSize: 11, color: T.muted, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, padding: "5px 14px" }}>
                  Estimativa: menos de 2 minutos
                </span>
              </div>
            )}

            {/* ── ESTADO 3: AGUARDANDO APROVAÇÃO ── */}
            {status === "aguardando_aprovacao" && (
              <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>
                {/* Banner */}
                <div style={{
                  background: "#EAF3DE", border: "1px solid #C0DD97", borderRadius: 12,
                  padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 16 }}>✓</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#2D5016" }}>
                    Seu conteúdo está pronto! Revise e aprove ou solicite ajustes.
                  </span>
                </div>

                {/* Choices */}
                {choices.map((choice, idx) => (
                  <div key={choice.id} style={{
                    background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12,
                    padding: 12, marginBottom: 10, opacity: idx > 0 && !choices[0].is_selected ? 1 : 1,
                    animation: "fadeUp 0.3s ease",
                  }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontFamily: FI, fontWeight: 700, fontSize: 13, color: T.ink }}>
                        Opção {idx + 1} de {choices.length}
                      </span>
                      <span style={{ fontSize: 11, color: T.muted }}>{choice.label}</span>
                    </div>

                    {/* Video player for Reels */}
                    {order?.product === "reels_script" && (choice.content as any)?.video_clips?.length > 0 && (
                      <div style={{ borderRadius: 8, overflow: "hidden", marginBottom: 10, background: "#000" }}>
                        <video
                          src={(choice.content as any).video_clips[0]}
                          controls
                          playsInline
                          style={{ width: "100%", maxHeight: 400, borderRadius: 8, display: "block" }}
                        />
                        <div style={{ padding: "8px 12px", background: "#111", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 11, color: "#888" }}>Gerado por IA · Livre para uso comercial</span>
                          <a href={(choice.content as any).video_clips[0]} download style={{ fontSize: 11, fontWeight: 600, color: T.lime, textDecoration: "none" }}>↓ Baixar .mp4</a>
                        </div>
                      </div>
                    )}
                    {/* Video generating indicator */}
                    {order?.product === "reels_script" && (choice.content as any)?.video_status === "generating" && (
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #bbf7d0", borderTopColor: "#16a34a", animation: "spin 1s linear infinite", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#166534" }}>Gerando seu vídeo...</div>
                          <div style={{ fontSize: 11, color: "#4ade80" }}>Pode levar alguns minutos. Avisaremos quando estiver pronto.</div>
                        </div>
                      </div>
                    )}
                    {/* Scene images for Reels */}
                    {order?.product === "reels_script" && (choice.content as any)?.scene_images?.length > 0 && (
                      <div style={{ display: "flex", gap: 4, overflowX: "auto", marginBottom: 10, padding: "4px 0" }}>
                        {((choice.content as any).scene_images as string[]).map((img: string, si: number) => (
                          <img key={si} src={img} alt={`Cena ${si + 1}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: `1px solid ${T.border}`, flexShrink: 0 }} />
                        ))}
                      </div>
                    )}
                    {/* Image if exists (non-reels) */}
                    {order?.product !== "reels_script" && choice.image_url && (
                      <div style={{ borderRadius: 8, overflow: "hidden", marginBottom: 10, border: `1px solid ${T.border}` }}>
                        <img src={choice.image_url} alt="" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
                      </div>
                    )}

                    {/* Text content */}
                    <div style={{
                      background: T.sand, border: `1px solid ${T.border}`, borderRadius: 8,
                      padding: "10px 12px", marginBottom: 10, position: "relative",
                    }}>
                      <button
                        id={`copy-${choice.id}`}
                        onClick={() => copiar(choice.content?.text || "", `copy-${choice.id}`)}
                        style={{
                          position: "absolute", top: 8, right: 8, fontSize: 11, fontWeight: 600,
                          color: T.muted, background: T.bg, border: `1px solid ${T.border}`,
                          borderRadius: 6, padding: "3px 10px", cursor: "pointer",
                        }}
                      >Copiar</button>
                      <p style={{ fontSize: 13, color: T.ink, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", paddingRight: 70 }}>
                        {choice.content?.text}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <button
                        onClick={() => downloadPDF(choice)}
                        style={{
                          width: "100%", padding: "10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: "transparent", border: `1px solid ${T.border}`, color: T.ink,
                          cursor: "pointer", fontFamily: FF,
                        }}
                      >↓ Baixar PDF</button>

                      <button
                        onClick={() => aprovar(choice.id)}
                        disabled={submitting}
                        style={{
                          width: "100%", padding: "12px", borderRadius: 8, fontSize: 13, fontWeight: 800,
                          background: T.lime, border: "none", color: T.ink, cursor: "pointer",
                          fontFamily: FI, opacity: submitting ? 0.6 : 1,
                        }}
                      >Aprovar esta opção</button>

                      <button
                        onClick={() => setRevisionOpen(revisionOpen === choice.id ? null : choice.id)}
                        style={{
                          width: "100%", padding: "10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: "transparent", border: `1px solid ${T.border}`, color: T.ink,
                          cursor: "pointer", fontFamily: FF,
                        }}
                      >↺ Pedir ajustes</button>

                      {/* Revision box */}
                      {revisionOpen === choice.id && (
                        <div style={{ background: T.sand, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, marginTop: 4 }}>
                          <textarea
                            value={revisionText}
                            onChange={e => setRevisionText(e.target.value)}
                            placeholder="Descreva o que mudar..."
                            rows={3}
                            style={{
                              width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
                              fontSize: 13, fontFamily: FF, resize: "vertical", outline: "none", background: T.bg,
                              boxSizing: "border-box",
                            }}
                          />
                          <button
                            onClick={() => pedirAjuste(choice.id, revisionText)}
                            disabled={submitting || !revisionText.trim()}
                            style={{
                              marginTop: 6, width: "100%", padding: "10px", borderRadius: 8,
                              fontSize: 12, fontWeight: 700, background: T.ink, color: T.lime,
                              border: "none", cursor: "pointer", fontFamily: FI,
                              opacity: submitting || !revisionText.trim() ? 0.5 : 1,
                            }}
                          >Enviar pedido de ajuste</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ESTADO 4: CONCLUÍDO ── */}
            {status === "concluido" && (
              <div style={{ padding: "24px 20px" }}>
                {/* Banner */}
                <div style={{
                  maxWidth: 700, margin: "0 auto 20px",
                  background: T.ink, borderRadius: 12, padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 16, color: T.lime }}>✓</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                      Projeto concluído{approvedChoice ? ` · ${approvedChoice.label} aprovada` : ""}
                    </div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                      {order?.delivered_at ? `em ${new Date(order.delivered_at).toLocaleDateString("pt-BR")}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {approvedChoice && (
                      <button onClick={() => downloadPDF(approvedChoice)} style={{
                        fontSize: 11, fontWeight: 700, background: T.lime, color: T.ink,
                        border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontFamily: FI,
                      }}>↓ PDF</button>
                    )}
                    <a href="/cliente/projetos/novo" style={{
                      fontSize: 11, fontWeight: 600, background: "transparent", color: "#888",
                      border: "1px solid #333", borderRadius: 6, padding: "6px 14px", textDecoration: "none",
                    }}>+ Novo projeto</a>
                  </div>
                </div>

                {approvedChoice && (
                  <>
                    {/* ── Landing Page: iframe preview ── */}
                    {order?.product === "landing_page_copy" && approvedChoice.html_content && (
                      <div style={{ maxWidth: 900, margin: "0 auto" }}>
                        {/* Browser chrome */}
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderBottom: "none", borderRadius: "12px 12px 0 0", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ display: "flex", gap: 6 }}>{["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}</div>
                          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 16px", fontSize: 11, color: "#64748b", flex: 1, textAlign: "center" }}>
                            inseminas-agro.voku.one
                          </div>
                          <button onClick={() => { const w = window.open("", "_blank"); if (w) { w.document.write(approvedChoice.html_content || ""); w.document.close(); } }} style={{ fontSize: 11, color: "#64748b", background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>↗ Abrir</button>
                        </div>
                        <iframe
                          srcDoc={approvedChoice.html_content}
                          title="Landing Page Preview"
                          sandbox="allow-scripts"
                          style={{ width: "100%", height: 600, border: "1px solid #e2e8f0", borderRadius: "0 0 12px 12px", display: "block" }}
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                          <button onClick={() => { navigator.clipboard.writeText(approvedChoice.html_content || ""); }} style={{ flex: 1, padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 600, background: T.bg, border: `1px solid ${T.border}`, color: T.ink, cursor: "pointer" }}>Copiar HTML</button>
                          <button onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([approvedChoice.html_content || ""], { type: "text/html" })); a.download = "landing-page.html"; a.click(); }} style={{ flex: 1, padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 700, background: T.lime, border: "none", color: T.ink, cursor: "pointer", fontFamily: FI }}>↓ Baixar HTML</button>
                        </div>
                      </div>
                    )}

                    {/* ── Posts / Carrossel: Instagram-style cards ── */}
                    {(order?.product === "content_pack" || order?.product === "carrossel" || order?.product === "post_instagram") && (
                      <div style={{ maxWidth: 480, margin: "0 auto" }}>
                        {/* Instagram post simulation */}
                        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
                          {/* IG Header */}
                          <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.ink, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: T.lime }}>
                              {(order?.preview_text || "V")[0]}
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{order?.preview_text?.split("—")[1]?.trim() || "voku.brand"}</div>
                              <div style={{ fontSize: 10, color: T.muted }}>Patrocinado</div>
                            </div>
                          </div>
                          {/* Image */}
                          {approvedChoice.image_url && (
                            <img src={approvedChoice.image_url} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                          )}
                          {/* IG Actions */}
                          <div style={{ padding: "10px 14px", display: "flex", gap: 14 }}>
                            {["♡", "💬", "↗"].map(i => <span key={i} style={{ fontSize: 20, cursor: "pointer" }}>{i}</span>)}
                          </div>
                          {/* Caption */}
                          <div style={{ padding: "0 14px 14px", position: "relative" }}>
                            <button id="copy-post" onClick={() => copiar(approvedChoice.content?.text || "", "copy-post")} style={{
                              position: "absolute", top: 0, right: 14, fontSize: 10, fontWeight: 600,
                              color: T.muted, background: T.sand, border: `1px solid ${T.border}`,
                              borderRadius: 4, padding: "2px 8px", cursor: "pointer",
                            }}>Copiar</button>
                            <p style={{ fontSize: 13, color: T.ink, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto" }}>
                              {approvedChoice.content?.text}
                            </p>
                          </div>
                        </div>
                        {/* Other variations thumbnails */}
                        {choices.filter(c => !c.is_selected).length > 0 && (
                          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            {choices.filter(c => !c.is_selected).map(c => (
                              <div key={c.id} style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden", opacity: 0.6 }}>
                                {c.image_url && <img src={c.image_url} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />}
                                <div style={{ padding: "6px 8px", fontSize: 10, fontWeight: 600, color: T.muted }}>{c.label}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Reels: Storyboard visual ── */}
                    {order?.product === "reels_script" && (() => {
                      const videoClips = (approvedChoice.content as any)?.video_clips || [];
                      const sceneImages = (approvedChoice.content as any)?.scene_images || [];
                      const videoStatus = (approvedChoice.content as any)?.video_status;
                      const hasVideo = videoClips.length > 0;
                      return (
                        <div style={{ maxWidth: 500, margin: "0 auto" }}>
                          {/* Video player (if available) */}
                          {hasVideo && (
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ background: T.ink, borderRadius: 24, padding: 12, maxWidth: 320, margin: "0 auto" }}>
                                <video
                                  src={videoClips[0]}
                                  controls
                                  playsInline
                                  poster={approvedChoice.image_url || sceneImages[0] || undefined}
                                  style={{ width: "100%", borderRadius: 16, display: "block", aspectRatio: "9/16", objectFit: "cover", background: "#000" }}
                                />
                              </div>
                              <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
                                <a href={videoClips[0]} download style={{
                                  fontSize: 12, fontWeight: 700, background: T.lime, color: T.ink,
                                  border: "none", borderRadius: 8, padding: "10px 20px", textDecoration: "none", fontFamily: FI,
                                }}>↓ Baixar vídeo (.mp4)</a>
                              </div>
                              <p style={{ textAlign: "center", fontSize: 11, color: T.muted, marginTop: 8 }}>
                                Gerado por IA · Livre para uso comercial
                              </p>
                            </div>
                          )}

                          {/* Video generating indicator */}
                          {videoStatus === "generating" && !hasVideo && (
                            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "20px", marginBottom: 16, textAlign: "center" }}>
                              <div style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid #bbf7d0", borderTopColor: "#16a34a", animation: "spin 1s linear infinite", margin: "0 auto 10px" }} />
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>Gerando seu vídeo...</div>
                              <div style={{ fontSize: 12, color: "#4ade80", marginTop: 4 }}>Pode levar alguns minutos. Feche e volte depois.</div>
                            </div>
                          )}

                          {/* Phone frame with image (if no video) */}
                          {!hasVideo && videoStatus !== "generating" && (
                            <div style={{ background: T.ink, borderRadius: 24, padding: 12, maxWidth: 320, margin: "0 auto" }}>
                              <div style={{ background: "#000", borderRadius: 16, overflow: "hidden", aspectRatio: "9/16", position: "relative" }}>
                                {(approvedChoice.image_url || sceneImages[0]) && (
                                  <img src={approvedChoice.image_url || sceneImages[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} />
                                )}
                                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 16, background: "linear-gradient(transparent 40%, rgba(0,0,0,0.8))" }}>
                                  <div style={{ fontSize: 11, fontWeight: 800, color: T.lime, marginBottom: 6 }}>ROTEIRO</div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.5, maxHeight: 120, overflow: "hidden" }}>
                                    {approvedChoice.content?.text?.split("\n").slice(0, 4).join("\n")}
                                  </div>
                                </div>
                                <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <div style={{ width: 0, height: 0, borderLeft: "16px solid #fff", borderTop: "10px solid transparent", borderBottom: "10px solid transparent", marginLeft: 4 }} />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Scene images strip */}
                          {sceneImages.length > 0 && (
                            <div style={{ display: "flex", gap: 4, overflowX: "auto", marginTop: 12, padding: "4px 0" }}>
                              {sceneImages.map((img: string, si: number) => (
                                <img key={si} src={img} alt={`Cena ${si + 1}`} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6, border: `1px solid ${T.border}`, flexShrink: 0 }} />
                              ))}
                            </div>
                          )}

                          {/* Script */}
                          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginTop: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>Roteiro completo</div>
                              <button id="copy-reels" onClick={() => copiar(approvedChoice.content?.text || "", "copy-reels")} style={{
                                fontSize: 10, fontWeight: 600, color: T.muted, background: T.sand,
                                border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 8px", cursor: "pointer",
                              }}>Copiar</button>
                            </div>
                            {(approvedChoice.content?.text || "").split("\n").filter((l: string) => l.trim()).map((line: string, i: number) => {
                              const isTimestamp = /^\[/.test(line.trim());
                              return (
                                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                                  {isTimestamp && <div style={{ width: 3, background: T.lime, borderRadius: 2, alignSelf: "stretch", flexShrink: 0 }} />}
                                  <p style={{ fontSize: 12, color: isTimestamp ? T.ink : T.muted, fontWeight: isTimestamp ? 600 : 400, lineHeight: 1.5, margin: 0 }}>{line}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── E-mails / Ads: Structured text view ── */}
                    {(order?.product === "email_sequence" || order?.product === "ad_copy") && (
                      <div style={{ maxWidth: 700, margin: "0 auto" }}>
                        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
                          {/* Email/Ad header bar */}
                          <div style={{ background: order?.product === "email_sequence" ? "#1a1a2e" : "#1e3a5f", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 18 }}>{order?.product === "email_sequence" ? "✉️" : "⚡"}</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                                {order?.product === "email_sequence" ? "Sequência de E-mails" : "Copy Meta Ads"}
                              </div>
                              <div style={{ fontSize: 11, color: "#888" }}>{approvedChoice.label}</div>
                            </div>
                            <button id="copy-email" onClick={() => copiar(approvedChoice.content?.text || "", "copy-email")} style={{
                              marginLeft: "auto", fontSize: 10, fontWeight: 600, color: "#888",
                              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                              borderRadius: 6, padding: "4px 12px", cursor: "pointer",
                            }}>Copiar tudo</button>
                          </div>
                          {/* Content with separators */}
                          <div style={{ padding: 18 }}>
                            {(approvedChoice.content?.text || "").split(/\n(?=E-MAIL |ÂNGULO )/).map((block: string, i: number) => (
                              <div key={i} style={{
                                padding: "14px 0",
                                borderBottom: i < (approvedChoice.content?.text || "").split(/\n(?=E-MAIL |ÂNGULO )/).length - 1 ? `1px solid ${T.border}` : "none",
                              }}>
                                <p style={{ fontSize: 13, color: T.ink, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{block.trim()}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Generic fallback for unknown products */}
                    {!["landing_page_copy","content_pack","carrossel","post_instagram","reels_script","email_sequence","ad_copy"].includes(order?.product) && (
                      <div style={{ maxWidth: 700, margin: "0 auto", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                        <p style={{ fontSize: 13, color: T.ink, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{approvedChoice.content?.text}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Generic briefing form for other product types ── */
function GenericBriefingForm({ productLabel, onSubmit, loading }: {
  productLabel: string; onSubmit: (text: string) => void; loading: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ padding: "24px 28px 0", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>
          📋 Briefing — {productLabel}
        </h2>
      </div>
      <div style={{ padding: 28 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
          Descreva o que você precisa *
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`Conte em detalhes o que você quer para seu ${productLabel.toLowerCase()}. Inclua público-alvo, tom de voz, referências e qualquer detalhe relevante.`}
          rows={8}
          style={{
            width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8,
            fontSize: 14, color: "#0f172a", fontFamily: "inherit", outline: "none", resize: "vertical",
            minHeight: 120, background: "#fff", boxSizing: "border-box",
          }}
        />
      </div>
      <div style={{
        padding: "20px 28px", background: "#f8fafc", borderTop: "1px solid #e2e8f0",
        display: "flex", justifyContent: "flex-end", borderRadius: "0 0 16px 16px",
      }}>
        <button
          onClick={() => onSubmit(text)}
          disabled={loading || !text.trim()}
          style={{
            background: "#CCEE33", color: "#1a1a1a", border: "none", padding: "12px 36px",
            borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading || !text.trim() ? 0.5 : 1,
          }}
        >
          {loading ? "Gerando..." : `🚀 Gerar ${productLabel} com IA`}
        </button>
      </div>
    </div>
  );
}
