"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const T = {
  sand: "#FAF8F3", white: "#FFFFFF", ink: "#111111", inkSub: "#3D3D3D", inkMid: "#6B6B6B", inkFaint: "#A0A0A0",
  lime: "#C8F135", border: "#E8E5DE", borderMd: "#D1CCBF",
  green: "#166534", greenBg: "#DCFCE7", teal: "#0D7A6E", tealBg: "#E6F5F3", amber: "#B45309", amberBg: "#FEF3C7",
};

type PhaseStatus = "done" | "active" | "pending";

interface Phase {
  id: string;
  label: string;
  status: PhaseStatus;
  detail?: string;
}

const PRODUCT_PHASES: Record<string, (order: any) => Phase[]> = {
  landing_page_copy: (o) => [
    { id: "briefing", label: "Briefing recebido", status: getPhaseStatus(o, "briefing"), detail: "A IA analisou seu pedido" },
    { id: "generation", label: "Gerando 3 variações", status: getPhaseStatus(o, "generation"), detail: "Claude está criando as opções" },
    { id: "choices", label: "Escolha da variação", status: getPhaseStatus(o, "choices"), detail: "Selecione sua favorita entre A, B e C" },
    { id: "lp_build", label: "Construindo landing page", status: getPhaseStatus(o, "lp_build"), detail: "HTML responsivo sendo montado" },
    { id: "publish", label: "Publicação com URL", status: getPhaseStatus(o, "publish"), detail: "Sua LP estará acessível em /lp/..." },
    { id: "delivered", label: "Entregue", status: getPhaseStatus(o, "delivered"), detail: "Pronto para download e edição" },
  ],
  content_pack: (o) => [
    { id: "briefing", label: "Briefing recebido", status: getPhaseStatus(o, "briefing"), detail: "Analisando seu negócio e público" },
    { id: "generation", label: "Gerando 12 posts", status: getPhaseStatus(o, "generation"), detail: "3 variações de estilo sendo criadas" },
    { id: "choices", label: "Escolha do estilo", status: getPhaseStatus(o, "choices"), detail: "Selecione o tom que mais combina" },
    { id: "delivered", label: "Entregue", status: getPhaseStatus(o, "delivered"), detail: "Posts prontos com legendas e hashtags" },
  ],
  post_instagram: (o) => [
    { id: "briefing", label: "Briefing recebido", status: getPhaseStatus(o, "briefing") },
    { id: "generation", label: "Gerando variações", status: getPhaseStatus(o, "generation"), detail: "3 tons diferentes" },
    { id: "choices", label: "Escolha", status: getPhaseStatus(o, "choices") },
    { id: "delivered", label: "Entregue", status: getPhaseStatus(o, "delivered") },
  ],
  carrossel: (o) => [
    { id: "briefing", label: "Briefing recebido", status: getPhaseStatus(o, "briefing") },
    { id: "generation", label: "Gerando 3 carrosséis", status: getPhaseStatus(o, "generation"), detail: "7 slides cada" },
    { id: "choices", label: "Escolha do ângulo", status: getPhaseStatus(o, "choices") },
    { id: "delivered", label: "Entregue", status: getPhaseStatus(o, "delivered") },
  ],
  reels_script: (o) => [
    { id: "briefing", label: "Briefing recebido", status: getPhaseStatus(o, "briefing") },
    { id: "generation", label: "Gerando roteiros", status: getPhaseStatus(o, "generation"), detail: "30s, 60s e 90s" },
    { id: "choices", label: "Escolha da duração", status: getPhaseStatus(o, "choices") },
    { id: "delivered", label: "Entregue", status: getPhaseStatus(o, "delivered") },
  ],
  ad_copy: (o) => [
    { id: "briefing", label: "Briefing recebido", status: getPhaseStatus(o, "briefing") },
    { id: "generation", label: "Gerando copies", status: getPhaseStatus(o, "generation"), detail: "Dor, benefício e prova social" },
    { id: "choices", label: "Escolha do ângulo", status: getPhaseStatus(o, "choices") },
    { id: "delivered", label: "Entregue", status: getPhaseStatus(o, "delivered") },
  ],
  email_sequence: (o) => [
    { id: "briefing", label: "Briefing recebido", status: getPhaseStatus(o, "briefing") },
    { id: "generation", label: "Gerando 5 e-mails", status: getPhaseStatus(o, "generation"), detail: "Sequência dia 0 a dia 8" },
    { id: "choices", label: "Escolha do tom", status: getPhaseStatus(o, "choices") },
    { id: "delivered", label: "Entregue", status: getPhaseStatus(o, "delivered") },
  ],
  app: (o) => [
    { id: "briefing", label: "Briefing recebido", status: getPhaseStatus(o, "briefing") },
    { id: "spec", label: "Especificação gerada", status: getPhaseStatus(o, "generation"), detail: "3 variações de app" },
    { id: "choices", label: "Escolha do tipo", status: getPhaseStatus(o, "choices") },
    { id: "build", label: "App sendo construído", status: getPhaseStatus(o, "build"), detail: "HTML + JS + CSS auto-contido" },
    { id: "publish", label: "Publicação com URL", status: getPhaseStatus(o, "publish"), detail: "Acessível em /app/..." },
    { id: "delivered", label: "Entregue", status: getPhaseStatus(o, "delivered") },
  ],
};

function getPhaseStatus(order: any, phase: string): PhaseStatus {
  const s = order.status;
  const hasBriefing = order.briefings_count > 0;
  const hasChoices = order.choices_count > 0;
  const hasSelected = order.choice_selected;
  const hasDeliverables = order.deliverables_count > 0;

  const flow: Record<string, () => PhaseStatus> = {
    briefing: () => {
      if (!hasBriefing) return s === "briefing" ? "active" : "pending";
      return "done";
    },
    generation: () => {
      if (!hasBriefing) return "pending";
      if (!hasChoices) return s === "in_production" ? "active" : "pending";
      return "done";
    },
    choices: () => {
      if (!hasChoices) return "pending";
      if (!hasSelected) return "active";
      return "done";
    },
    lp_build: () => {
      if (!hasSelected) return "pending";
      if (s === "in_production" && !hasDeliverables) return "active";
      return s === "delivered" ? "done" : "pending";
    },
    build: () => {
      if (!hasSelected) return "pending";
      if (s === "in_production" && !hasDeliverables) return "active";
      return s === "delivered" ? "done" : "pending";
    },
    publish: () => s === "delivered" ? "done" : "pending",
    spec: () => {
      if (!hasBriefing) return "pending";
      if (!hasChoices) return s === "in_production" ? "active" : "pending";
      return "done";
    },
    delivered: () => s === "delivered" ? "done" : "pending",
  };

  return (flow[phase] || (() => "pending"))();
}

function getProgress(phases: Phase[]): number {
  const done = phases.filter(p => p.status === "done").length;
  return Math.round((done / phases.length) * 100);
}

const STATUS_STYLES: Record<PhaseStatus, { color: string; bg: string; dot: string; icon: string }> = {
  done: { color: T.green, bg: T.greenBg, dot: "#16A34A", icon: "✓" },
  active: { color: T.teal, bg: T.tealBg, dot: "#0D9488", icon: "●" },
  pending: { color: T.inkFaint, bg: T.sand, dot: T.borderMd, icon: "○" },
};

export default function ProjectTracker({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  const [choicesCount, setChoicesCount] = useState(0);
  const [choiceSelected, setChoiceSelected] = useState(false);
  const [briefingsCount, setBriefingsCount] = useState(0);
  const [deliverablesCount, setDeliverablesCount] = useState(0);

  // Poll for real-time updates
  useEffect(() => {
    const sb = supabase();
    const check = async () => {
      const [choicesRes, briefingsRes, deliverablesRes] = await Promise.all([
        sb.from("choices").select("id, is_selected").eq("order_id", order.id),
        sb.from("briefings").select("id").eq("order_id", order.id),
        sb.from("deliverables").select("id").eq("order_id", order.id),
      ]);
      if (choicesRes.data) {
        setChoicesCount(choicesRes.data.length);
        setChoiceSelected(choicesRes.data.some((c: any) => c.is_selected));
      }
      setBriefingsCount(briefingsRes.data?.length || 0);
      setDeliverablesCount(deliverablesRes.data?.length || 0);
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [order.id]);

  const enrichedOrder = {
    ...order,
    choices_count: choicesCount,
    choice_selected: choiceSelected,
    briefings_count: briefingsCount,
    deliverables_count: deliverablesCount,
  };
  const phaseBuilder = PRODUCT_PHASES[order.product] || PRODUCT_PHASES.post_instagram;
  const phases = phaseBuilder(enrichedOrder);
  const progress = getProgress(phases);

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", marginTop: 8 }}>
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", background: "transparent", border: "none", cursor: "pointer",
          padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}
      >
        {/* Progress ring */}
        <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke={T.border} strokeWidth="3" />
            <circle
              cx="20" cy="20" r="16" fill="none"
              stroke={progress === 100 ? T.green : T.lime}
              strokeWidth="3"
              strokeDasharray={`${(progress / 100) * 100.5} 100.5`}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: T.ink }}>
            {progress}%
          </div>
        </div>

        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Acompanhar projeto</div>
          <div style={{ fontSize: 11, color: T.inkMid }}>
            {phases.filter(p => p.status === "done").length} de {phases.length} etapas concluídas
          </div>
        </div>

        <span style={{ fontSize: 14, color: T.inkFaint, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </button>

      {/* Expanded phases */}
      {expanded && (
        <div style={{ padding: "0 20px 18px" }}>
          {/* Progress bar */}
          <div style={{ height: 4, background: T.sand, borderRadius: 2, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ height: "100%", background: progress === 100 ? T.green : T.lime, borderRadius: 2, transition: "width 0.5s", width: `${progress}%` }} />
          </div>

          {/* Phase list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {phases.map((phase, i) => {
              const st = STATUS_STYLES[phase.status];
              const isLast = i === phases.length - 1;
              return (
                <div key={phase.id} style={{ display: "flex", gap: 12, position: "relative" }}>
                  {/* Vertical line */}
                  {!isLast && (
                    <div style={{
                      position: "absolute", left: 11, top: 24, bottom: -2, width: 2,
                      background: phase.status === "done" ? T.green + "40" : T.border,
                    }} />
                  )}

                  {/* Dot */}
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: st.bg, border: `2px solid ${st.dot}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: phase.status === "done" ? 12 : 8, color: st.color, fontWeight: 700,
                    transition: "all 0.3s",
                  }}>
                    {st.icon}
                  </div>

                  {/* Content */}
                  <div style={{ paddingBottom: isLast ? 0 : 16, flex: 1 }}>
                    <div style={{
                      fontSize: 13, fontWeight: phase.status === "active" ? 700 : 500,
                      color: phase.status === "pending" ? T.inkFaint : T.ink,
                      lineHeight: 1.4,
                    }}>
                      {phase.label}
                      {phase.status === "active" && (
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: T.teal, background: T.tealBg, padding: "2px 8px", borderRadius: 10 }}>
                          Em andamento
                        </span>
                      )}
                    </div>
                    {phase.detail && phase.status !== "pending" && (
                      <div style={{ fontSize: 11, color: T.inkMid, marginTop: 2 }}>{phase.detail}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
