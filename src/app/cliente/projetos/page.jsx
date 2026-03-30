"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/hooks/useUserContext";

/* ─── Design tokens ─── */
const T = {
  sand: "#FAF8F3", white: "#FFFFFF", ink: "#111111", inkSub: "#3D3D3D",
  inkMid: "#6B6B6B", inkFaint: "#A0A0A0", lime: "#C8F135",
  border: "#E8E5DE", borderMd: "#D1CCBF",
  green: "#166534", greenBg: "#DCFCE7",
  teal: "#0D7A6E", tealBg: "#E6F5F3",
  amber: "#B45309", amberBg: "#FEF3C7",
  red: "#991B1B", redBg: "#FEE2E2",
  blue: "#1D4ED8", blueBg: "#DBEAFE",
};

const FF = "'Plus Jakarta Sans', sans-serif";

const PRODUCT_NAME = {
  landing_page_copy: "Landing Page",
  content_pack: "Pacote de Conteúdo",
  email_sequence: "E-mail Sequence",
  post_instagram: "Post Instagram",
  carrossel: "Carrossel",
  reels_script: "Roteiro Reels",
  ad_copy: "Copy Ads",
  app: "App Web",
};

const PRODUCT_BADGE = {
  landing_page_copy: { label: "LANDING PAGE", color: T.teal },
  content_pack: { label: "POSTS", color: T.green },
  email_sequence: { label: "E-MAIL", color: "#E07A5F" },
  post_instagram: { label: "POSTS", color: T.green },
  carrossel: { label: "CARROSSEL", color: T.green },
  reels_script: { label: "REELS", color: "#7C3AED" },
  ad_copy: { label: "COPY", color: "#7C3AED" },
  app: { label: "APP", color: T.blue },
};

const PRODUCT_ICON_COLOR = {
  landing_page_copy: T.teal,
  content_pack: T.green,
  email_sequence: "#E07A5F",
  post_instagram: T.green,
  carrossel: T.green,
  reels_script: "#7C3AED",
  ad_copy: "#7C3AED",
  app: T.blue,
};

const PRODUCT_ICON = {
  landing_page_copy: '🌐',
  post_instagram: '📸',
  carrossel: '🎠',
  reels_script: '🎬',
  email_sequence: '📧',
  ad_copy: '📢',
  content_pack: '📦',
  app: '💻',
};

const ORDER_STATUS = {
  briefing: { label: "Briefing", color: T.amber, bg: T.amberBg },
  in_production: { label: "Em Produção", color: T.blue, bg: T.blueBg },
  delivered: { label: "Entregue", color: T.green, bg: T.greenBg },
  approved: { label: "Aprovado", color: T.green, bg: T.greenBg },
};

const DEL_STATUS = {
  pending: { label: "PENDENTE", color: T.amber, bg: T.amberBg },
  approved: { label: "APROVADO", color: T.green, bg: T.greenBg },
  rejected: { label: "REJEITADO", color: T.red, bg: T.redBg },
};

const DEL_TYPE_ICON = {
  copy: "C", post: "P", landing_page: "LP", email: "E",
  carrossel: "CR", benefit: "B", reels: "R", app: "A",
};

const PHASE_STATUS = {
  done: { label: "CONCLUÍDO", color: T.green, bg: T.greenBg },
  active: { label: "EM PRODUÇÃO", color: T.blue, bg: T.blueBg },
  pending: { label: "AGUARDANDO", color: T.inkFaint, bg: T.sand },
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTimestamp(d) {
  if (!d) return null;
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ProjetosPage() {
  const { ctx, loading: ctxLoading } = useUserContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("etapas");
  const [phases, setPhases] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [expandedDel, setExpandedDel] = useState(null);
  const [feedbacks, setFeedbacks] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [orderChoices, setOrderChoices] = useState([]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const [userId, setUserId] = useState(null);
  const [looseDeliverables, setLooseDeliverables] = useState([]);

  /* ─── Load orders + loose deliverables ─── */
  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = "/cliente"; return; }
      setUserId(data.user.id);

      // Load orders
      const { data: o } = await sb.from("orders")
        .select("*")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });
      setOrders(o || []);

      // Load deliverables without order (loose/chat deliverables)
      const res = await fetch(`/api/deliverables?user_id=${data.user.id}`);
      const json = await res.json();
      const allDels = json.deliverables || [];
      const orderIds = (o || []).map(order => order.id);
      const loose = allDels.filter(d => !d.order_id || !orderIds.includes(d.order_id));
      setLooseDeliverables(loose);

      setLoading(false);
    });
  }, []);

  const selected = orders.find(o => o.id === selectedId);

  /* ─── Load phases + steps for selected order ─── */
  const loadPhases = useCallback(async (orderId) => {
    const sb = supabase();
    const { data: ph } = await sb
      .from("project_phases")
      .select("*")
      .eq("order_id", orderId)
      .order("phase_number", { ascending: true });

    if (!ph || ph.length === 0) { setPhases([]); return; }

    const { data: steps } = await sb
      .from("project_steps")
      .select("*")
      .eq("order_id", orderId)
      .order("step_number", { ascending: true });

    const enriched = ph.map(p => ({
      ...p,
      steps: (steps || []).filter(s => s.phase_id === p.id),
    }));
    setPhases(enriched);

    // Auto-expand active phase
    const activePhase = enriched.find(p => p.status === "active");
    if (activePhase) setExpandedPhase(activePhase.id);
  }, []);

  /* ─── Load deliverables for selected order ─── */
  const loadDeliverables = useCallback(async (orderId) => {
    try {
      const res = await fetch(`/api/deliverables?order_id=${orderId}`);
      const json = await res.json();
      setDeliverables(json.deliverables || []);
    } catch {
      // Fallback to direct query
      const sb = supabase();
      const { data } = await sb
        .from("deliverables")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      setDeliverables(data || []);
    }
  }, []);

  /* ─── Load choices for selected order ─── */
  const loadChoices = useCallback(async (orderId) => {
    const sb = supabase();
    const { data } = await sb.from("choices").select("*").eq("order_id", orderId).order("position");
    setOrderChoices(data || []);
  }, []);

  /* ─── When order selected ─── */
  useEffect(() => {
    if (!selectedId) return;
    loadPhases(selectedId);
    loadDeliverables(selectedId);
    loadChoices(selectedId);
    setActiveTab("etapas");
    setExpandedDel(null);
    setFeedbacks({});
  }, [selectedId, loadPhases, loadDeliverables, loadChoices]);

  /* ─── Progress calc ─── */
  const calcProgress = useCallback(() => {
    const allSteps = phases.flatMap(p => p.steps || []);
    if (allSteps.length === 0) return 0;
    const done = allSteps.filter(s => s.status === "done").length;
    return Math.round((done / allSteps.length) * 100);
  }, [phases]);

  const pendingCount = deliverables.filter(d => d.status === "pending").length;

  /* ─── Actions ─── */
  const handleApprove = async (delId) => {
    setActionLoading(delId);
    await fetch(`/api/deliverables/${delId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    await loadDeliverables(selectedId);
    setActionLoading(null);
  };

  const handleReject = async (delId) => {
    setActionLoading(delId);
    await fetch(`/api/deliverables/${delId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", feedback: feedbacks[delId] || "" }),
    });
    await loadDeliverables(selectedId);
    setActionLoading(null);
  };

  const handleApproveAll = async () => {
    const pending = deliverables.filter(d => d.status === "pending");
    setActionLoading("all");
    for (const d of pending) {
      await fetch(`/api/deliverables/${d.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
    }
    await loadDeliverables(selectedId);
    setActionLoading(null);
  };

  const handleDownload = async (del) => {
    const res = await fetch(`/api/deliverables/${del.id}/download`);
    const ct = res.headers.get("content-type");
    if (ct?.includes("application/json")) {
      const data = await res.json();
      if (data.url) { window.open(data.url, "_blank"); return; }
    }
    // Text blob download
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = del.file_name || del.title || "deliverable.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Loading ─── */
  if (ctxLoading || loading) {
    return (
      <div style={{ background: T.sand, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF, color: T.inkMid, fontSize: 15 }}>
        Carregando...
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase().auth.signOut();
    window.location.href = "/cliente";
  };

  /* ═══════════════════════════ SIDEBAR ═══════════════════════════ */
  const sidebar = (
    <div style={{
      width: isMobile ? "100%" : 280,
      minWidth: isMobile ? undefined : 280,
      borderRight: isMobile ? "none" : `1px solid ${T.border}`,
      background: T.white,
      overflowY: "auto",
      height: isMobile ? "auto" : "calc(100vh - 64px)",
      position: isMobile ? "relative" : "sticky",
      top: isMobile ? undefined : 64,
    }}>
      <div style={{ padding: "20px 16px 12px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Meus Projetos</div>
        <div style={{ fontSize: 12, color: T.inkMid, marginTop: 2 }}>{orders.length} projeto{orders.length !== 1 ? "s" : ""}</div>
      </div>

      {/* Loose deliverables entry */}
      {looseDeliverables.length > 0 && (
        <div
          onClick={() => { setSelectedId("__loose__"); setDeliverables(looseDeliverables); setPhases([]); setActiveTab("aprovacao"); }}
          style={{
            padding: "14px 16px", cursor: "pointer",
            borderBottom: `1px solid ${T.border}`,
            background: selectedId === "__loose__" ? T.sand : "transparent",
            borderLeft: selectedId === "__loose__" ? `3px solid ${T.lime}` : "3px solid transparent",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: T.lime + "30",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800, color: T.ink, flexShrink: 0,
            }}>✦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>Entregas do Chat</div>
              <div style={{ fontSize: 11, color: T.inkFaint }}>{looseDeliverables.length} entrega{looseDeliverables.length !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.amber, background: T.amberBg, padding: "3px 8px", borderRadius: 10 }}>
              {looseDeliverables.filter(d => d.status === "pending").length} pendente{looseDeliverables.filter(d => d.status === "pending").length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      )}

      {orders.map(order => {
        const iconColor = PRODUCT_ICON_COLOR[order.product] || T.inkMid;
        const st = ORDER_STATUS[order.status] || ORDER_STATUS.briefing;
        const isActive = selectedId === order.id;
        return (
          <div
            key={order.id}
            onClick={() => setSelectedId(order.id)}
            style={{
              padding: "14px 16px",
              cursor: "pointer",
              borderBottom: `1px solid ${T.border}`,
              background: isActive ? T.sand : "transparent",
              borderLeft: isActive ? `3px solid ${T.lime}` : "3px solid transparent",
              transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: iconColor + "18",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: iconColor, flexShrink: 0,
              }}>
                {PRODUCT_ICON[order.product] || (PRODUCT_NAME[order.product] || "?")[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: T.ink,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {order.preview_text || PRODUCT_NAME[order.product] || order.product}
                </div>
                <div style={{ fontSize: 11, color: T.inkFaint, display: "flex", gap: 6, alignItems: "center" }}>
                  {order.order_number && (
                    <span style={{ fontWeight: 700, color: T.inkMid }}>\#{order.order_number}</span>
                  )}
                  <span>{fmtDate(order.created_at)}</span>
                </div>
              </div>
              <div style={{
                fontSize: 10, fontWeight: 700, color: st.color, background: st.bg,
                padding: "3px 8px", borderRadius: 10, whiteSpace: "nowrap",
              }}>
                {st.label}
              </div>
            </div>
            {order.status === "delivered" && (
              <a
                href={`/cliente/projetos/${order.id}`}
                onClick={e => e.stopPropagation()}
                style={{
                  display: "block", marginTop: 8, fontSize: 11, fontWeight: 700,
                  color: T.ink, background: T.lime, borderRadius: 6,
                  padding: "6px 12px", textDecoration: "none", textAlign: "center",
                }}
              >
                Ver entrega →
              </a>
            )}
          </div>
        );
      })}
    </div>
  );

  /* ═══════════════════════════ EMPTY STATE ═══════════════════════════ */
  if (orders.length === 0 && looseDeliverables.length === 0) {
    return (
      <div style={{ background: T.sand, minHeight: "100vh", fontFamily: FF }}>
        {renderHeader(ctx, isMobile, handleLogout)}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)" }}>
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 48, color: T.lime, marginBottom: 16 }}>✦</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Nenhum projeto ainda.</div>
            <div style={{ fontSize: 14, color: T.inkMid, marginBottom: 24 }}>Use o chat para criar seu primeiro projeto.</div>
            <a href="/cliente/pedidos" style={{
              background: T.lime, color: T.ink, border: "none", borderRadius: 10,
              padding: "12px 28px", fontSize: 14, fontWeight: 700, textDecoration: "none",
              display: "inline-block",
            }}>
              Criar projeto →
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════ MAIN PANEL ═══════════════════════════ */
  const isLoose = selectedId === "__loose__";
  const mainPanel = (!selected && !isLoose) ? (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: T.sand }}>
      <div style={{ textAlign: "center", color: T.inkMid }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>←</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Selecione um projeto</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Clique em um projeto na lista para ver os detalhes</div>
      </div>
    </div>
  ) : isLoose ? (
    <div style={{ flex: 1, overflowY: "auto", height: isMobile ? "auto" : "calc(100vh - 64px)", background: T.sand }}>
      <div style={{ padding: isMobile ? "20px 16px" : "28px 36px", background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Entregas do Chat</div>
        <div style={{ fontSize: 13, color: T.inkMid }}>Conteúdos gerados via chat sem pedido vinculado</div>
      </div>
      <div style={{ padding: isMobile ? "20px 16px" : "28px 36px" }}>
        {renderAprovacao()}
      </div>
    </div>
  ) : (
    <div style={{ flex: 1, overflowY: "auto", height: isMobile ? "auto" : "calc(100vh - 64px)", background: T.sand }}>
      {/* ── Project Header ── */}
      <div style={{ padding: isMobile ? "20px 16px" : "28px 36px", background: T.white, borderBottom: `1px solid ${T.border}` }}>
        {(() => {
          const badge = PRODUCT_BADGE[selected.product] || { label: selected.product?.toUpperCase(), color: T.inkMid };
          const progress = calcProgress();
          return (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: badge.color, background: badge.color + "18", padding: "3px 10px", borderRadius: 6, letterSpacing: "0.08em" }}>
                  {badge.label}
                </span>
              </div>
              <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: T.ink, marginBottom: 4 }}>
                {PRODUCT_NAME[selected.product] || selected.product} · {fmtDate(selected.created_at)}
              </div>
              <div style={{ fontSize: 13, color: T.inkMid, marginBottom: 16 }}>
                Iniciado em {fmtDate(selected.created_at)} · Previsão: {fmtDate(selected.delivery_deadline)}
              </div>
              {/* Progress bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: progress === 100 ? T.green : T.lime, borderRadius: 3, width: `${progress}%`, transition: "width 0.4s" }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, minWidth: 36 }}>{progress}%</span>
              </div>
            </>
          );
        })()}
      </div>

      {/* ── Choices Banner (when choices exist and none selected) ── */}
      {orderChoices.length > 0 && !orderChoices.some(c => c.is_selected) && selected.status !== "delivered" && (
        <div style={{ padding: isMobile ? "16px" : "20px 36px", background: T.lime + "15", borderBottom: `1px solid ${T.lime}40` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
            Suas {orderChoices.length} opções estão prontas!
          </div>
          <div style={{ fontSize: 13, color: T.inkMid, marginBottom: 16 }}>
            Escolha sua variação favorita para finalizar o projeto.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${Math.min(orderChoices.length, 3)}, 1fr)`, gap: 12, marginBottom: 16 }}>
            {orderChoices.map((choice, i) => {
              const label = ["A", "B", "C"][i] || String(i + 1);
              return (
                <div key={choice.id} style={{
                  background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden",
                }}>
                  {choice.image_url && (
                    <div style={{ aspectRatio: "1/1", overflow: "hidden" }}>
                      <img src={choice.image_url} alt={`Opção ${label}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  )}
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.lime, marginBottom: 4 }}>OPÇÃO {label}</div>
                    <div style={{ fontSize: 12, color: T.inkSub, lineHeight: 1.5, maxHeight: 60, overflow: "hidden" }}>
                      {(choice.content?.text || "").split("\n").filter(l => l.trim()).slice(0, 2).join("\n")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href={`/cliente/pedidos/${selected.id}`} style={{
              display: "inline-block", background: T.lime, color: T.ink, border: "none", borderRadius: 10,
              padding: "12px 28px", fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}>
              Escolher variação favorita →
            </a>
            {selected.product === "landing_page_copy" && (
              <a href={`/cliente/projetos/${selected.id}/landing`} style={{
                display: "inline-block", background: T.teal, color: "#fff", border: "none", borderRadius: 10,
                padding: "12px 28px", fontSize: 14, fontWeight: 700, textDecoration: "none",
              }}>
                Ver Landing Page →
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: "flex", background: T.white, borderBottom: `1px solid ${T.border}` }}>
        {[
          { key: "etapas", label: "Etapas do Projeto" },
          { key: "aprovacao", label: "Aprovação", badge: pendingCount },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "14px 24px", fontSize: 13, fontWeight: 700, fontFamily: FF,
              background: "transparent", border: "none", cursor: "pointer",
              borderBottom: activeTab === tab.key ? `2.5px solid ${T.ink}` : "2.5px solid transparent",
              color: activeTab === tab.key ? T.ink : T.inkFaint,
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span style={{
                background: T.amberBg, color: T.amber, fontSize: 10, fontWeight: 800,
                padding: "2px 7px", borderRadius: 10, minWidth: 18, textAlign: "center",
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ padding: isMobile ? "20px 16px" : "28px 36px" }}>
        {activeTab === "etapas" ? renderEtapas() : renderAprovacao()}
      </div>
    </div>
  );

  /* ═══════════════ ETAPAS TAB ═══════════════ */
  function renderEtapas() {
    if (phases.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "40px 0", color: T.inkMid }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Etapas ainda não definidas para este projeto.</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>As fases serão criadas conforme o projeto avança.</div>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {phases.map(phase => {
          const ps = PHASE_STATUS[phase.status] || PHASE_STATUS.pending;
          const isExp = expandedPhase === phase.id;
          const isActive = phase.status === "active";
          return (
            <div key={phase.id} style={{
              background: T.white, border: `1px solid ${isActive ? T.lime : T.border}`,
              borderRadius: 10, overflow: "hidden",
            }}>
              <button
                onClick={() => setExpandedPhase(isExp ? null : phase.id)}
                style={{
                  width: "100%", background: "transparent", border: "none", cursor: "pointer",
                  padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, fontFamily: FF,
                }}
              >
                {/* Phase icon */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: phase.status === "done" ? T.greenBg : phase.status === "active" ? T.ink : T.sand,
                  color: phase.status === "done" ? T.green : phase.status === "active" ? T.lime : T.inkFaint,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700,
                }}>
                  {phase.status === "done" ? "✓" : phase.status === "active" ? "→" : phase.phase_number}
                </div>

                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{phase.title}</div>
                </div>

                <span style={{
                  fontSize: 10, fontWeight: 700, color: ps.color, background: ps.bg,
                  padding: "3px 10px", borderRadius: 10, whiteSpace: "nowrap",
                }}>
                  {ps.label}
                </span>

                <span style={{
                  fontSize: 12, color: T.inkFaint,
                  transform: isExp ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}>▼</span>
              </button>

              {isExp && (phase.steps || []).length > 0 && (
                <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${T.border}` }}>
                  <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 0 }}>
                    {phase.steps.map((step, i) => {
                      const isStepActive = step.status === "active";
                      const isStepDone = step.status === "done";
                      const isLast = i === phase.steps.length - 1;
                      return (
                        <div key={step.id} style={{ display: "flex", gap: 12, position: "relative" }}>
                          {/* Vertical connector */}
                          {!isLast && (
                            <div style={{
                              position: "absolute", left: 9, top: 22, bottom: -2, width: 2,
                              background: isStepDone ? T.green + "40" : T.border,
                            }} />
                          )}
                          {/* Step indicator */}
                          <div style={{
                            width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                            background: isStepDone ? T.greenBg : isStepActive ? T.ink : T.sand,
                            border: `2px solid ${isStepDone ? T.green : isStepActive ? T.lime : T.borderMd}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, color: isStepDone ? T.green : isStepActive ? T.lime : T.inkFaint,
                            fontWeight: 700,
                            animation: isStepActive ? "stepPulse 2s infinite" : "none",
                          }}>
                            {isStepDone ? "✓" : isStepActive ? "→" : "·"}
                          </div>
                          {/* Step content */}
                          <div style={{ paddingBottom: isLast ? 0 : 14, flex: 1 }}>
                            <div style={{
                              fontSize: 13, fontWeight: isStepActive ? 700 : 500,
                              color: step.status === "pending" ? T.inkFaint : T.ink,
                            }}>
                              {step.label}
                            </div>
                            <div style={{ fontSize: 11, color: T.inkMid, marginTop: 2 }}>
                              {step.completed_at
                                ? fmtTimestamp(step.completed_at)
                                : isStepActive ? "em andamento" : "—"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /* ═══════════════ APROVAÇÃO TAB ═══════════════ */
  function renderAprovacao() {
    if (deliverables.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "40px 0", color: T.inkMid }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Nenhuma entrega ainda.</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>As entregas aparecerão aqui conforme forem geradas.</div>
        </div>
      );
    }

    return (
      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>Entregas para aprovação</div>
            <div style={{ fontSize: 13, color: T.inkMid, marginTop: 2 }}>
              {pendingCount} {pendingCount === 1 ? "item pendente" : "itens pendentes"} neste projeto
            </div>
          </div>
          {pendingCount > 0 && (
            <button
              onClick={handleApproveAll}
              disabled={actionLoading === "all"}
              style={{
                background: T.lime, color: T.ink, border: "none", borderRadius: 10,
                padding: "10px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: FF, opacity: actionLoading === "all" ? 0.6 : 1,
              }}
            >
              {actionLoading === "all" ? "Aprovando..." : "APROVAR TODOS"}
            </button>
          )}
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {deliverables.map(del => {
            const ds = DEL_STATUS[del.status] || DEL_STATUS.pending;
            const icon = DEL_TYPE_ICON[del.type] || "?";
            const isExp = expandedDel === del.id;

            return (
              <div key={del.id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                {/* Closed card */}
                <button
                  onClick={() => setExpandedDel(isExp ? null : del.id)}
                  style={{
                    width: "100%", background: "transparent", border: "none", cursor: "pointer",
                    padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, fontFamily: FF,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: (PRODUCT_ICON_COLOR[del.type] || T.inkMid) + "18",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 800, color: PRODUCT_ICON_COLOR[del.type] || T.inkMid,
                    flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {del.title || "Entrega sem título"}
                    </div>
                    <div style={{ fontSize: 11, color: T.inkFaint }}>
                      {del.type} · {fmtDate(del.created_at)}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: ds.color, background: ds.bg,
                    padding: "3px 10px", borderRadius: 10, whiteSpace: "nowrap",
                  }}>
                    {ds.label}
                  </span>
                  <span style={{
                    fontSize: 12, color: T.inkFaint,
                    transform: isExp ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}>▼</span>
                </button>

                {/* Expanded card */}
                {isExp && (
                  <div style={{
                    borderTop: `1px solid ${T.border}`, padding: "20px",
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                    gap: 20,
                  }}>
                    {/* Col 1 — CONTEÚDO */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Conteúdo</div>
                      <div style={{
                        fontSize: 13, color: T.inkSub, lineHeight: 1.65, whiteSpace: "pre-wrap",
                        maxHeight: 200, overflowY: "auto",
                        background: T.sand, borderRadius: 8, padding: 12,
                      }}>
                        {del.content || "Sem conteúdo de texto disponível."}
                      </div>
                    </div>

                    {/* Col 2 — AÇÃO */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Ação</div>
                      {del.status === "pending" ? (
                        <>
                          <textarea
                            placeholder="Solicitar revisão? Descreva aqui..."
                            value={feedbacks[del.id] || ""}
                            onChange={e => setFeedbacks(f => ({ ...f, [del.id]: e.target.value }))}
                            rows={3}
                            style={{
                              width: "100%", boxSizing: "border-box", fontFamily: FF,
                              background: T.sand, border: `1px solid ${T.borderMd}`, borderRadius: 8,
                              padding: "10px 12px", fontSize: 12, color: T.ink, resize: "vertical",
                              outline: "none", marginBottom: 12,
                            }}
                          />
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              onClick={() => handleApprove(del.id)}
                              disabled={actionLoading === del.id}
                              style={{
                                background: T.greenBg, color: T.green, border: "none", borderRadius: 8,
                                padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                                fontFamily: FF, opacity: actionLoading === del.id ? 0.6 : 1,
                              }}
                            >
                              ✓ Aprovar
                            </button>
                            <button
                              onClick={() => handleReject(del.id)}
                              disabled={actionLoading === del.id}
                              style={{
                                background: T.redBg, color: T.red, border: "none", borderRadius: 8,
                                padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                                fontFamily: FF, opacity: actionLoading === del.id ? 0.6 : 1,
                              }}
                            >
                              ✕ Rejeitar
                            </button>
                            <button
                              onClick={() => handleDownload(del)}
                              style={{
                                background: T.sand, color: T.ink, border: `1px solid ${T.borderMd}`, borderRadius: 8,
                                padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                                fontFamily: FF,
                              }}
                            >
                              ↓ Baixar
                            </button>
                          </div>
                        </>
                      ) : (
                        <div>
                          <div style={{ fontSize: 13, color: T.inkSub, marginBottom: 8 }}>
                            Status: <strong>{ds.label}</strong>
                            {del.approved_at && <span> em {fmtTimestamp(del.approved_at)}</span>}
                            {del.rejected_at && <span> em {fmtTimestamp(del.rejected_at)}</span>}
                          </div>
                          {del.feedback && (
                            <div style={{ background: T.amberBg, borderRadius: 8, padding: 10, fontSize: 12, color: T.amber }}>
                              Feedback: {del.feedback}
                            </div>
                          )}
                          <button
                            onClick={() => handleDownload(del)}
                            style={{
                              background: T.sand, color: T.ink, border: `1px solid ${T.borderMd}`, borderRadius: 8,
                              padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                              fontFamily: FF, marginTop: 10,
                            }}
                          >
                            ↓ Baixar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Col 3 — PREVIEW */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Preview</div>
                      {renderPreview(del)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ═══════════════ PREVIEW RENDERER ═══════════════ */
  function renderPreview(del) {
    if (del.type === "post" || del.type === "carrossel") {
      return (
        <div style={{
          background: "#111", borderRadius: 10, padding: 20, color: T.white,
          minHeight: 140, display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {(del.content || "").slice(0, 200)}
            {(del.content || "").length > 200 && "..."}
          </div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: T.lime, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em" }}>VOKU</span>
          </div>
        </div>
      );
    }

    if (del.type === "landing_page" && del.preview_url) {
      return (
        <div>
          <iframe src={del.preview_url} style={{ width: "100%", height: 200, border: `1px solid ${T.border}`, borderRadius: 8 }} title="Preview LP" />
          <a href={del.preview_url} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 700,
            color: T.teal, textDecoration: "none",
          }}>
            Ver LP →
          </a>
        </div>
      );
    }

    if (del.type === "email") {
      return (
        <div style={{
          background: T.white, border: `1px solid ${T.border}`, borderRadius: 8,
          padding: 12, fontSize: 11, lineHeight: 1.6, maxHeight: 200, overflowY: "auto",
          color: T.inkSub, fontFamily: "'IBM Plex Mono', monospace",
        }}>
          {(del.content || "").slice(0, 400)}
        </div>
      );
    }

    // copy / default — editorial text
    return (
      <div style={{
        background: T.sand, borderRadius: 8, padding: 16,
        fontSize: 13, lineHeight: 1.7, color: T.inkSub,
        fontFamily: "'DM Serif Display', serif",
        maxHeight: 200, overflowY: "auto", whiteSpace: "pre-wrap",
      }}>
        {(del.content || "").slice(0, 400)}
        {(del.content || "").length > 400 && "..."}
      </div>
    );
  }

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div style={{ background: T.sand, minHeight: "calc(100vh - 64px)", fontFamily: FF }}>

      {isMobile ? (
        /* Mobile: stack sidebar then panel */
        <div>
          {!selectedId ? sidebar : (
            <div>
              <button
                onClick={() => setSelectedId(null)}
                style={{
                  width: "100%", padding: "12px 16px", background: T.white,
                  border: "none", borderBottom: `1px solid ${T.border}`,
                  fontSize: 13, fontWeight: 700, color: T.teal, cursor: "pointer",
                  fontFamily: FF, textAlign: "left",
                }}
              >
                ← Voltar para projetos
              </button>
              {mainPanel}
            </div>
          )}
        </div>
      ) : (
        /* Desktop: sidebar + main */
        <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
          {sidebar}
          {mainPanel}
        </div>
      )}

      <style>{`
        @keyframes stepPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}

/* ═══════════════ HEADER (reused) ═══════════════ */
function renderHeader(ctx, isMobile, handleLogout) {
  return (
    <div style={{
      background: "#FFFFFF", borderBottom: "1px solid #E8E5DE",
      padding: isMobile ? "0 16px" : "0 40px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 64, position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16 }}>
        <a href="/cliente/pedidos" style={{ textDecoration: "none" }}>
          <div style={{ background: "#111111", color: "#fff", fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: isMobile ? 16 : 20, letterSpacing: "-0.5px", padding: "4px 14px", borderRadius: 6, textTransform: "uppercase" }}>VOKU</div>
        </a>
        {!isMobile && (
          <>
            <span style={{ color: "#D1CCBF", fontSize: 20 }}>|</span>
            <a href="/cliente/pedidos" style={{ fontSize: 13, fontWeight: 600, color: "#6B6B6B", textDecoration: "none" }}>Home</a>
            <a href="/cliente/projetos" style={{ fontSize: 15, fontWeight: 700, color: "#111111", textDecoration: "none" }}>Meus Projetos</a>
            <a href="/cliente/calendario" style={{ fontSize: 13, fontWeight: 600, color: "#6B6B6B", textDecoration: "none" }}>Calendário</a>
            <a href="/cliente/plano" style={{ fontSize: 13, fontWeight: 600, color: "#6B6B6B", textDecoration: "none" }}>Plano</a>
            <a href="/vitrine/apps" style={{ fontSize: 13, fontWeight: 600, color: "#6B6B6B", textDecoration: "none" }}>Apps</a>
            <a href="/cliente/marca" style={{ fontSize: 13, fontWeight: 600, color: "#6B6B6B", textDecoration: "none" }}>Marca</a>
            <a href="/vitrine" style={{ fontSize: 13, fontWeight: 600, color: "#6B6B6B", textDecoration: "none" }}>Vitrine</a>
            <a href="/cliente/afiliados" style={{ fontSize: 13, fontWeight: 600, color: "#6B6B6B", textDecoration: "none" }}>Afiliados</a>
          </>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FAF8F3", border: "1px solid #E8E5DE", borderRadius: 10, padding: "6px 14px" }}>
          <span style={{ fontSize: 12, color: "#6B6B6B", fontWeight: 600 }}>Créditos</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#111111" }}>{ctx?.credits ?? 0}</span>
        </div>
        {!isMobile && (
          <div style={{ background: "#C8F135", color: "#111111", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
            {ctx?.plan || "free"}
          </div>
        )}
        {!isMobile && <span style={{ color: "#6B6B6B", fontSize: 13 }}>{ctx?.name}</span>}
        <button onClick={handleLogout} style={{ background: "transparent", border: "1.5px solid #D1CCBF", color: "#3D3D3D", borderRadius: 8, padding: "6px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Sair</button>
      </div>
    </div>
  );
}
