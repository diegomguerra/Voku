"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/hooks/useUserContext";

const PRODUCT_LABEL = {
  landing_page_copy: "LANDING PAGE", content_pack: "POSTS", email_sequence: "E-MAIL",
  post_instagram: "POSTS", carrossel: "CARROSSEL", reels_script: "REELS",
  ad_copy: "COPY", app: "APP",
};
const PRODUCT_NAME = {
  landing_page_copy: "Landing Page Copy", content_pack: "Pack de Posts",
  email_sequence: "Sequência de E-mails", post_instagram: "Post Instagram",
  carrossel: "Carrossel", reels_script: "Roteiro Reels",
  ad_copy: "Copy Meta Ads", app: "App Web",
};
const STATUS_BADGE = {
  briefing: { label: "BRIEFING", color: "#B45309", bg: "#FEF3C7" },
  in_production: { label: "EM PRODUÇÃO", color: "#1D4ED8", bg: "#DBEAFE" },
  delivered: { label: "ENTREGUE", color: "#166534", bg: "#DCFCE7" },
  approved: { label: "APROVADO", color: "#888", bg: "#f0f0e8" },
};

function fmtShort(d) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

export default function ClienteHomePage() {
  const { ctx, loading: ctxLoading } = useUserContext();
  const [orders, setOrders] = useState([]);
  const [stepsMap, setStepsMap] = useState({});
  const [pendingMap, setPendingMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = "/cliente"; return; }

      const { data: o } = await sb.from("orders").select("*")
        .eq("user_id", data.user.id).order("created_at", { ascending: false });
      setOrders(o || []);

      // Load steps progress for each order
      if (o && o.length > 0) {
        const ids = o.map(x => x.id);
        const { data: steps } = await sb.from("project_steps").select("order_id, status").in("order_id", ids);
        const map = {};
        (steps || []).forEach(s => {
          if (!map[s.order_id]) map[s.order_id] = { total: 0, done: 0 };
          map[s.order_id].total++;
          if (s.status === "done") map[s.order_id].done++;
        });
        setStepsMap(map);

        // Load pending deliverables count per order
        const { data: dels } = await sb.from("deliverables").select("order_id")
          .in("order_id", ids).eq("status", "pending");
        const pMap = {};
        (dels || []).forEach(d => { pMap[d.order_id] = (pMap[d.order_id] || 0) + 1; });
        setPendingMap(pMap);
      }

      setLoading(false);
    });
  }, []);

  if (ctxLoading || loading) {
    return (
      <div style={{ background: "#FAF8F3", minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontSize: 15, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Carregando...
      </div>
    );
  }

  const firstName = ctx?.name?.split(" ")[0] || "você";
  const activeCount = orders.filter(o => o.status !== "approved").length;

  // ── NO PROJECTS: Welcome card ──
  if (orders.length === 0) {
    return (
      <div style={{ background: "#FAF8F3", minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 680, width: "100%", background: "#fff", border: "1px solid #E8E5DE", borderRadius: 16, padding: 48 }}>
          <div style={{
            display: "inline-block", background: "#111", color: "#C8F135",
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 10,
            letterSpacing: 3, padding: "4px 12px", borderRadius: 4,
          }}>✦ COMO FUNCIONA</div>

          <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 32, color: "#111", letterSpacing: "-1px", marginTop: 20, marginBottom: 0 }}>
            Crie. Revise. Publique.
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 16, color: "#888", lineHeight: 1.7, marginTop: 12 }}>
            Tudo começa com um projeto. Você descreve o que precisa,<br />
            a Voku cria, você aprova. Simples assim.
          </p>

          <div style={{ height: 1, background: "#E8E5DE", margin: "32px 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { n: "01", t: "Crie um projeto", d: "Escolha o tipo de conteúdo e dê o briefing pelo chat." },
              { n: "02", t: "Acompanhe as etapas", d: "Veja em tempo real cada fase da produção do seu conteúdo." },
              { n: "03", t: "Aprove e publique", d: "Revise as entregas, aprove o que gostou e baixe pronto para usar." },
            ].map(step => (
              <div key={step.n}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 40, color: "#C8F135" }}>{step.n}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 15, color: "#111", marginTop: 8 }}>{step.t}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 13, color: "#888", lineHeight: 1.6, marginTop: 4 }}>{step.d}</div>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: "#E8E5DE", margin: "32px 0" }} />

          <a href="/cliente/projetos/novo" style={{
            display: "block", width: "100%", textAlign: "center", padding: 18,
            fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 16,
            background: "#C8F135", color: "#111", border: "none", borderRadius: 10,
            textDecoration: "none", boxSizing: "border-box",
          }}>
            Criar meu primeiro projeto →
          </a>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 12 }}>
            Sem cartão de crédito. 7 dias grátis com acesso completo.
          </p>
        </div>
      </div>
    );
  }

  // ── HAS PROJECTS: Dashboard ──
  return (
    <div style={{ background: "#FAF8F3", minHeight: "calc(100vh - 64px)", padding: "32px 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 28, color: "#111", margin: 0 }}>
            Bom dia, {firstName}.
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: "#888", margin: "4px 0 0" }}>
            Você tem {activeCount} projeto{activeCount !== 1 ? "s" : ""} ativo{activeCount !== 1 ? "s" : ""}.
          </p>
        </div>
        <a href="/cliente/projetos/novo" style={{
          background: "#C8F135", color: "#111", fontFamily: "'Inter', sans-serif",
          fontWeight: 800, fontSize: 13, padding: "10px 20px", borderRadius: 8,
          border: "none", textDecoration: "none",
        }}>
          + Novo Projeto
        </a>
      </div>

      {/* Projects Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {orders.map(order => {
          const st = STATUS_BADGE[order.status] || STATUS_BADGE.briefing;
          const s = stepsMap[order.id] || { total: 0, done: 0 };
          const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
          const pending = pendingMap[order.id] || 0;

          return (
            <div key={order.id} style={{
              background: "#fff", border: "1px solid #E8E5DE", borderRadius: 12,
              padding: 20, cursor: "pointer", transition: "border-color 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#C8F135"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#E8E5DE"}
              onClick={() => window.location.href = `/cliente/projetos/${order.id}`}
            >
              {/* Badges */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  background: "#111", color: "#C8F135", fontFamily: "'Inter', sans-serif",
                  fontWeight: 800, fontSize: 10, letterSpacing: 2,
                  padding: "3px 8px", borderRadius: 4,
                }}>
                  {PRODUCT_LABEL[order.product] || order.product?.toUpperCase()}
                </span>
                <span style={{
                  background: st.bg, color: st.color, fontFamily: "'Inter', sans-serif",
                  fontWeight: 700, fontSize: 10, padding: "3px 8px", borderRadius: 4,
                }}>
                  {st.label}
                </span>
              </div>

              {/* Title */}
              <div style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16,
                color: "#111", marginTop: 12, display: "flex", alignItems: "baseline", gap: 8,
              }}>
                {order.order_number && (
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#888" }}>#{order.order_number}</span>
                )}
                {PRODUCT_NAME[order.product] || order.product} — {fmtShort(order.created_at)}
              </div>

              {/* Progress */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 11, color: "#888", marginBottom: 4 }}>
                  {pct}% concluído
                </div>
                <div style={{ height: 4, background: "#E8E5DE", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "#C8F135", borderRadius: 2, width: `${pct}%`, transition: "width 0.3s" }} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <a href={`/cliente/projetos/${order.id}`} style={{
                  flex: 1, textAlign: "center", background: "#111", color: "#fff",
                  fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12,
                  padding: "7px 14px", borderRadius: 7, textDecoration: "none",
                }}
                  onClick={e => e.stopPropagation()}
                >
                  Ver projeto →
                </a>
                {pending > 0 && (
                  <a href={`/cliente/projetos/${order.id}?tab=aprovacao`} style={{
                    background: "#C8F135", color: "#111", fontFamily: "'Inter', sans-serif",
                    fontWeight: 800, fontSize: 12, padding: "7px 14px", borderRadius: 7,
                    textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                  }}
                    onClick={e => e.stopPropagation()}
                  >
                    ✦ Aprovar
                    <span style={{
                      background: "#111", color: "#C8F135", borderRadius: "50%",
                      width: 18, height: 18, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 10, fontWeight: 900,
                    }}>{pending}</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
