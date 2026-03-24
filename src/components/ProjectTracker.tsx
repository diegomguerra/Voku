"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const T = {
  sand: "#FAF8F3", white: "#FFFFFF", ink: "#111111", inkSub: "#3D3D3D", inkMid: "#6B6B6B", inkFaint: "#A0A0A0",
  lime: "#C8F135", border: "#E8E5DE", borderMd: "#D1CCBF",
  green: "#166534", greenBg: "#DCFCE7", teal: "#0D7A6E", tealBg: "#E6F5F3", amber: "#B45309", amberBg: "#FEF3C7",
};

type StepStatus = "done" | "active" | "pending";

interface Step {
  id: string;
  label: string;
  status: StepStatus;
  completed_at: string | null;
}

interface Phase {
  id: string;
  title: string;
  status: StepStatus;
  phase_number: number;
  steps: Step[];
}

const STATUS_STYLES: Record<StepStatus, { color: string; bg: string; dot: string; icon: string }> = {
  done: { color: T.green, bg: T.greenBg, dot: "#16A34A", icon: "✓" },
  active: { color: T.teal, bg: T.tealBg, dot: "#0D9488", icon: "●" },
  pending: { color: T.inkFaint, bg: T.sand, dot: T.borderMd, icon: "○" },
};

export default function ProjectTracker({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);

  // Load phases + steps from DB, poll every 5s
  useEffect(() => {
    const load = async () => {
      const sb = supabase();
      const [phRes, stRes] = await Promise.all([
        sb.from("project_phases").select("*").eq("order_id", order.id).order("phase_number"),
        sb.from("project_steps").select("*").eq("order_id", order.id).order("step_number"),
      ]);
      const ph = phRes.data || [];
      const st = stRes.data || [];
      const enriched: Phase[] = ph.map((p: any) => ({
        id: p.id,
        title: p.title,
        status: p.status as StepStatus,
        phase_number: p.phase_number,
        steps: st.filter((s: any) => s.phase_id === p.id).map((s: any) => ({
          id: s.id,
          label: s.label,
          status: s.status as StepStatus,
          completed_at: s.completed_at,
        })),
      }));
      setPhases(enriched);
      // Auto-expand active phase
      const active = enriched.find(p => p.status === "active");
      if (active && !expandedPhase) setExpandedPhase(active.id);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [order.id]);

  const allSteps = phases.flatMap(p => p.steps);
  const doneSteps = allSteps.filter(s => s.status === "done").length;
  const totalSteps = allSteps.length;
  const progress = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;

  if (phases.length === 0) return null;

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
            {doneSteps} de {totalSteps} etapas concluídas
          </div>
        </div>

        <span style={{ fontSize: 14, color: T.inkFaint, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </button>

      {/* Expanded phases + steps */}
      {expanded && (
        <div style={{ padding: "0 20px 18px" }}>
          {/* Progress bar */}
          <div style={{ height: 4, background: T.sand, borderRadius: 2, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ height: "100%", background: progress === 100 ? T.green : T.lime, borderRadius: 2, transition: "width 0.5s", width: `${progress}%` }} />
          </div>

          {/* Phase list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {phases.map((phase) => {
              const ps = STATUS_STYLES[phase.status];
              const isExp = expandedPhase === phase.id;
              return (
                <div key={phase.id} style={{ background: T.sand, border: `1px solid ${phase.status === "active" ? T.lime : T.border}`, borderRadius: 10, overflow: "hidden" }}>
                  <button
                    onClick={() => setExpandedPhase(isExp ? null : phase.id)}
                    style={{
                      width: "100%", background: "transparent", border: "none", cursor: "pointer",
                      padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, fontFamily: "'Plus Jakarta Sans',sans-serif",
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      background: ps.bg, border: `2px solid ${ps.dot}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: phase.status === "done" ? 11 : 7, color: ps.color, fontWeight: 700,
                    }}>
                      {ps.icon}
                    </div>
                    <div style={{ flex: 1, textAlign: "left", fontSize: 12, fontWeight: 700, color: phase.status === "pending" ? T.inkFaint : T.ink }}>
                      {phase.title}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: ps.color, background: ps.bg, padding: "2px 6px", borderRadius: 8 }}>
                      {phase.status === "done" ? "CONCLUÍDO" : phase.status === "active" ? "EM PRODUÇÃO" : "AGUARDANDO"}
                    </span>
                    <span style={{ fontSize: 10, color: T.inkFaint, transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                  </button>

                  {isExp && phase.steps.length > 0 && (
                    <div style={{ padding: "0 14px 10px", borderTop: `1px solid ${T.border}` }}>
                      <div style={{ paddingTop: 8, display: "flex", flexDirection: "column" }}>
                        {phase.steps.map((step, i) => {
                          const ss = STATUS_STYLES[step.status];
                          const isLast = i === phase.steps.length - 1;
                          return (
                            <div key={step.id} style={{ display: "flex", gap: 8, position: "relative" }}>
                              {!isLast && (
                                <div style={{ position: "absolute", left: 7, top: 18, bottom: -2, width: 2, background: step.status === "done" ? T.green + "40" : T.border }} />
                              )}
                              <div style={{
                                width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                                background: ss.bg, border: `2px solid ${ss.dot}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: step.status === "done" ? 9 : 6, color: ss.color, fontWeight: 700,
                              }}>
                                {ss.icon}
                              </div>
                              <div style={{ paddingBottom: isLast ? 0 : 10, flex: 1 }}>
                                <div style={{
                                  fontSize: 12, fontWeight: step.status === "active" ? 700 : 400,
                                  color: step.status === "pending" ? T.inkFaint : T.ink,
                                  textDecoration: step.status === "done" ? "line-through" : "none",
                                }}>
                                  {step.label}
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
        </div>
      )}
    </div>
  );
}
