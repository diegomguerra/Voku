"use client";
import { useState } from "react";

const C = {
  bg: "#0F0F0F",
  s1: "#161616",
  s2: "#1C1C1C",
  s3: "#232323",
  border: "#2E2E2E",
  border2: "#3A3A3A",
  accent: "#E9F59E",
  accentDim: "#C8D97A",
  text: "#F5F5F0",
  muted: "#888888",
  muted2: "#AAAAAA",
  green: "#4ADE80",
  red: "#F87171",
  blue: "#60A5FA",
  purple: "#A78BFA",
  orange: "#FB923C",
  yellow: "#FCD34D",
};

// ── AI INSIGHT ENGINE ────────────────────────────────────────────
function generateInsight(job) {
  const text = (job.titulo + " " + job.descricao + " " + job.stack + " " + job.rawText).toLowerCase();
  const budget = parseFloat((job.budget || "0").replace(/[$,R]/g, "")) || 0;

  let complexidade = "baixa";
  let score = 50;
  const dicas = [];
  const alertas = [];

  const complexoKw = ["saas","mvp","plataforma","full-stack","fullstack","backend","api","database","auth","oauth","django","rails","postgres","microservice","docker","aws","stripe","integration","calendar sync","scheduling","role-based","rbac","multi-tenant","real-time","websocket","payment gateway","e-commerce","woocommerce","shopify app"];
  const medioKw = ["wordpress","shopify","squarespace","redesign","webflow","figma","ui/ux","landing page","next.js","tailwind","react","vue","cms","headless","responsive","seo","framer","payload","sanity","strapi"];
  const simpleKw = ["copy","copywriting","email sequence","social media","content","posts","translation","bilingual","blog","seo text","product description"];

  const cC = complexoKw.filter(k => text.includes(k)).length;
  const cM = medioKw.filter(k => text.includes(k)).length;
  const cS = simpleKw.filter(k => text.includes(k)).length;

  if (cC >= 3) complexidade = "alta";
  else if (cC >= 1 || cM >= 2) complexidade = "média";
  else complexidade = "baixa";

  // Score base: budget vs complexidade
  const budgetScore = {
    alta: budget >= 1500 ? 85 : budget >= 800 ? 62 : budget >= 400 ? 35 : 12,
    média: budget >= 800 ? 90 : budget >= 400 ? 74 : budget >= 200 ? 55 : 28,
    baixa: budget >= 300 ? 92 : budget >= 150 ? 78 : 60,
  };
  score = budgetScore[complexidade];

  // Red flags → alertas
  if (text.includes("only europe") || text.includes("europe only") || text.includes("europe please")) {
    alertas.push("🚫 Restrito à Europa — você pode ser eliminado automaticamente. Avalie antes de aplicar.");
    score -= 40;
  }
  if ((text.includes("all included") || (text.includes("hosting") && text.includes("domain"))) && budget < 500) {
    alertas.push("🔴 'Tudo incluído' com budget baixo — escopo inflado. Reposicione a proposta ou recuse.");
    score -= 20;
  }
  if (text.includes("ongoing") && budget < 300) {
    alertas.push("⚠️ Ongoing + budget baixo = armadilha de tempo. Negocie valor por milestone antes de aceitar.");
    score -= 10;
  }
  if (cC >= 3 && budget < 600) {
    alertas.push("🔴 Complexidade alta, budget insuficiente. Se aplicar, negocie escopo reduzido ou valor maior.");
    score -= 15;
  }

  // Green flags → dicas
  if (text.includes("asap") || text.includes("urgently") || text.includes("urgente")) {
    dicas.push("⚡ Cliente com urgência — quem responde primeiro tem vantagem real. Aplique nas próximas 2h.");
    score += 5;
  }
  if (text.includes("payment verified") || job.payment_verified) {
    dicas.push("✅ Payment Verified confirmado — risco de calote mínimo. Priorize.");
    score += 5;
  }
  if (text.includes("featured")) {
    dicas.push("⭐ Featured Job — cliente pagou para destacar o anúncio. Mais sério e comprometido que a média.");
    score += 5;
  }
  if (text.includes("mockup") || text.includes("figma") || text.includes("design ready") || text.includes("ready to go") || text.includes("assets ready") || text.includes("copy are all ready")) {
    dicas.push("📐 Assets e copy prontos — menos revisões, entrega mais rápida. Escopo controlado.");
    score += 10;
  }
  if (text.includes("bilingual") || text.includes("english and spanish") || text.includes("en/es")) {
    dicas.push("🌐 Bilíngue EN/ES — diferencial se você escreve bem nas duas línguas. Menos concorrentes.");
  }
  if (budget >= 700) {
    dicas.push("💰 Budget acima da média — vale investir tempo numa proposta personalizada e detalhada.");
  }
  if (complexidade === "baixa" && budget >= 150) {
    dicas.push("💡 Job simples e rápido. Ideal para acumular reviews no início. Alta chance de aprovação.");
  }
  if (complexidade === "média") {
    dicas.push("💡 Escopo definido. Na cover letter, mostre 2–3 projetos similares com link ao vivo.");
  }
  if (complexidade === "alta" && score >= 50) {
    dicas.push("💡 Job complexo mas bem pago. Proponha milestones para reduzir risco para os dois lados.");
  }
  if (text.includes("open to discussing") || text.includes("open to discuss")) {
    dicas.push("🤝 Cliente aberto a negociar preço — você tem margem para propor um valor mais justo.");
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));
  return { complexidade, score, dicas, alertas };
}

// ── PARSE JOB TEXT ───────────────────────────────────────────────
function parseJob(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const titulo = lines[0] || "Job sem título";

  const budgetMatch = text.match(/\$[\d,]+\.?\d*/);
  const budget = budgetMatch ? budgetMatch[0] : "—";

  const prazoMatch = text.match(/(?:Delivery by|Deadline|Deliver by)[:\s]+([^\n*•]+)/i);
  const prazo = prazoMatch ? prazoMatch[1].trim() : "—";

  const stackMap = ["Next.js","React","Vue","Angular","WordPress","Shopify","Squarespace","Figma","Tailwind","TypeScript","Python","Django","PHP","Laravel","Node","AWS","Vercel","CSS","HTML","SEO","WooCommerce","Webflow","Sanity","Strapi","Payload","Supabase","Firebase","MongoDB","PostgreSQL","Material UI","Framer","shadcn","Stripe"];
  const stack = stackMap.filter(k => text.includes(k)).join(", ") || "—";

  const tipo = text.toLowerCase().includes("fixed") ? "Fixed-price" : "Hourly";
  const isOngoing = text.toLowerCase().includes("ongoing");
  const descricao = lines.slice(1, 5).join(" ").slice(0, 280);

  return {
    id: "UW" + String(Date.now()).slice(-5),
    titulo,
    plataforma: "Upwork",
    tipo: isOngoing ? tipo + " / Ongoing" : tipo,
    budget,
    prazo,
    stack,
    descricao,
    payment_verified: text.toLowerCase().includes("payment verified"),
    proposta_enviada: false,
    proposta_texto: "",
    valor_proposto: "",
    status: "para aplicar",
    data_aplicacao: "",
    notas: "",
    rawText: text,
  };
}

const jobStatusColor = {
  "para aplicar": C.blue,
  "aguardando": C.yellow,
  "aprovado": C.green,
  "recusado": C.red,
  "cancelado": C.muted2,
};

const complexColor = { "baixa": C.green, "média": C.yellow, "alta": C.red };
const scoreColor = s => s >= 70 ? C.green : s >= 40 ? C.yellow : C.red;

const LIGHT = {
  bg: "#F5F4F0", s1: "#FFFFFF", s2: "#EFEFEB", s3: "#E6E4DF",
  border: "#D8D5CE", border2: "#C8C5BE",
  accent: "#5A7A00", accentDim: "#4A6800",
  text: "#1A1A18", muted: "#888880", muted2: "#555550",
  green: "#16A34A", red: "#DC2626", blue: "#2563EB",
  purple: "#7C3AED", orange: "#EA580C", yellow: "#CA8A04",
};

// ── MAIN ─────────────────────────────────────────────────────────
export default function VokuProspeccao() {
  const [dark, setDark] = useState(true);
  const T = dark ? C : LIGHT;

  const [jobs, setJobs] = useState([]);
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [filterStatus, setFilterStatus] = useState("todos");

  const selectedJob = jobs.find(j => j.id === selectedId);
  const total = jobs.length;
  const enviadas = jobs.filter(j => j.proposta_enviada).length;
  const aprovados = jobs.filter(j => j.status === "aprovado").length;
  const potencial = jobs
    .filter(j => !["recusado","cancelado"].includes(j.status))
    .reduce((acc, j) => acc + (parseFloat((j.valor_proposto || j.budget || "0").replace(/[$,R]/g,"")) || 0), 0);

  function handlePaste() {
    if (!pasteText.trim()) return;
    const job = parseJob(pasteText);
    setJobs(prev => [job, ...prev]);
    setPasteText("");
    setShowPaste(false);
    setSelectedId(job.id);
  }

  function updateStatus(id, status) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
  }

  function handleSave() {
    setJobs(prev => prev.map(j => j.id === editData.id ? { ...editData } : j));
    setEditMode(false);
    setEditData(null);
  }

  function handleDelete(id) {
    setJobs(prev => prev.filter(j => j.id !== id));
    setSelectedId(null);
  }

  const filtered = filterStatus === "todos" ? jobs : jobs.filter(j => j.status === filterStatus);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, fontFamily: "'IBM Plex Mono', monospace" }}>

      {/* TOPBAR */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: T.accent, fontWeight: 700, fontSize: 17, letterSpacing: "0.04em" }}>✦ VOKU</span>
          <div style={{ width: 1, height: 14, background: T.border2 }} />
          <span style={{ fontSize: 12, color: T.muted2, letterSpacing: "0.18em" }}>PROSPECÇÃO</span>
          <div style={{ width: 1, height: 14, background: T.border2 }} />
          <span style={{ fontSize: 12, color: T.text }}>{total} jobs · {enviadas} propostas · {aprovados} fechados</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setDark(d => !d)} style={{
            background: dark ? T.s3 : T.s2,
            border: `1px solid ${T.border}`,
            borderRadius: 20, padding: "4px 12px",
            display: "flex", alignItems: "center", gap: 6,
            cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11, color: T.muted2, fontWeight: 600,
            transition: "all 0.2s"
          }}>
            <span>{dark ? "☀" : "◑"}</span>
            <span>{dark ? "LIGHT" : "DARK"}</span>
          </button>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, boxShadow: `0 0 7px ${T.green}` }} />
          <span style={{ fontSize: 11, color: T.muted2 }}>ativo</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "16px 28px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          ["JOBS", total || "—", T.blue],
          ["PROPOSTAS", enviadas || "—", T.accent],
          ["FECHADOS", aprovados || "—", T.green],
          ["POTENCIAL", potencial > 0 ? `$${potencial.toLocaleString()}` : "—", T.purple],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: T.muted2, marginBottom: 6, fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "20px 28px" }}>

        {/* TOOLBAR */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["todos","para aplicar","aguardando","aprovado","recusado"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                background: filterStatus === s ? (jobStatusColor[s] || T.accent) + "20" : "transparent",
                border: `1px solid ${filterStatus === s ? (jobStatusColor[s] || T.accent) + "66" : T.border}`,
                color: filterStatus === s ? (jobStatusColor[s] || T.accent) : T.muted2,
                borderRadius: 5, padding: "6px 14px", fontSize: 11,
                letterSpacing: "0.08em", cursor: "pointer", textTransform: "uppercase",
                fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600
              }}>{s}</button>
            ))}
          </div>
          <button onClick={() => setShowPaste(!showPaste)} style={{
            background: showPaste ? "transparent" : T.accent,
            color: showPaste ? T.accent : T.bg,
            border: `1px solid ${T.accent}`,
            borderRadius: 6, padding: "8px 20px", fontSize: 11,
            fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace"
          }}>+ COLAR JOB</button>
        </div>

        {/* PASTE */}
        {showPaste && (
          <div style={{ background: T.s2, border: `1px solid ${T.accent}30`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 8, letterSpacing: "0.15em", color: T.accent, marginBottom: 8 }}>COLE O TEXTO DA DEMANDA (Upwork)</div>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="Cole aqui o texto completo do job. O sistema extrai dados e gera análise automática."
              style={{
                width: "100%", minHeight: 100, background: T.s3,
                border: `1px solid ${T.border2}`, borderRadius: 6,
                padding: "9px 11px", color: T.text, fontSize: 11,
                fontFamily: "'IBM Plex Mono', monospace", resize: "vertical",
                outline: "none", boxSizing: "border-box", lineHeight: 1.6
              }}
            />
            <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
              <button onClick={handlePaste} style={{
                background: T.accent, color: T.bg, border: "none", borderRadius: 5,
                padding: "6px 18px", fontSize: 9, fontWeight: 700, cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em"
              }}>PROCESSAR</button>
              <button onClick={() => { setShowPaste(false); setPasteText(""); }} style={{
                background: "transparent", color: T.muted, border: `1px solid ${T.border}`,
                borderRadius: 5, padding: "6px 14px", fontSize: 9, cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace"
              }}>CANCELAR</button>
            </div>
          </div>
        )}

        {/* EMPTY */}
        {filtered.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "90px 0", gap: 12 }}>
            <div style={{ fontSize: 32, opacity: 0.1 }}>◈</div>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: "0.12em" }}>NENHUM JOB</div>
            <div style={{ fontSize: 9, color: T.muted, opacity: 0.5 }}>Cole uma demanda do Upwork para começar.</div>
          </div>
        )}

        {/* TABLE + DETAIL */}
        {filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: selectedId ? "1fr 390px" : "1fr", gap: 12, alignItems: "start" }}>

            {/* TABLE */}
            <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {["ID","TÍTULO","BUDGET","TIPO","COMPLEXIDADE","VIABILIDADE","INSIGHTS RÁPIDOS","PROPOSTA","STATUS",""].map(h => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, letterSpacing: "0.12em", color: T.muted2, fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((j, i) => {
                    const ins = generateInsight(j);
                    const preview = ins.alertas[0] || ins.dicas[0] || "—";
                    return (
                      <tr key={j.id}
                        onClick={() => setSelectedId(selectedId === j.id ? null : j.id)}
                        style={{
                          borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none",
                          background: selectedId === j.id ? T.accent + "08" : "transparent",
                          cursor: "pointer"
                        }}
                      >
                        <td style={{ padding: "12px 14px", fontSize: 11, color: T.muted2 }}>{j.id}</td>
                        <td style={{ padding: "12px 14px", maxWidth: 200 }}>
                          <div style={{ fontSize: 12, color: T.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>{j.titulo}</div>
                          <div style={{ fontSize: 10, color: T.muted2, marginTop: 2 }}>{j.plataforma}</div>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: T.accent, fontWeight: 700, whiteSpace: "nowrap" }}>{j.budget}</td>
                        <td style={{ padding: "12px 14px", fontSize: 11, color: T.muted2, whiteSpace: "nowrap" }}>{j.tipo}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                            color: complexColor[ins.complexidade],
                            background: complexColor[ins.complexidade] + "20",
                            border: `1px solid ${complexColor[ins.complexidade]}40`,
                            borderRadius: 4, padding: "4px 9px"
                          }}>{ins.complexidade.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <div style={{ width: 42, height: 5, background: T.s3, borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ width: `${ins.score}%`, height: "100%", background: scoreColor(ins.score), borderRadius: 99 }} />
                            </div>
                            <span style={{ fontSize: 11, color: scoreColor(ins.score), fontWeight: 700 }}>{ins.score}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", maxWidth: 220 }}>
                          <div style={{ fontSize: 11, color: ins.alertas.length > 0 ? T.red : T.muted2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220, lineHeight: 1.5 }}>
                            {preview}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            color: j.proposta_enviada ? T.green : T.muted2,
                            background: j.proposta_enviada ? T.green + "20" : T.s3,
                            border: `1px solid ${j.proposta_enviada ? T.green + "40" : T.border}`,
                            borderRadius: 4, padding: "3px 8px"
                          }}>{j.proposta_enviada ? "✓ SIM" : "NÃO"}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                            color: jobStatusColor[j.status] || T.muted2,
                            background: (jobStatusColor[j.status] || T.muted2) + "20",
                            border: `1px solid ${(jobStatusColor[j.status] || T.muted2)}40`,
                            borderRadius: 4, padding: "4px 9px", whiteSpace: "nowrap"
                          }}>{j.status.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <button onClick={e => { e.stopPropagation(); setEditData({ ...j }); setEditMode(true); }} style={{
                            background: "transparent", border: `1px solid ${T.border2}`, color: T.muted2,
                            borderRadius: 4, padding: "4px 10px", fontSize: 10, cursor: "pointer",
                            fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.06em", fontWeight: 600
                          }}>EDITAR</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* DETAIL */}
            {selectedId && selectedJob && (() => {
              const ins = generateInsight(selectedJob);
              return (
                <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, paddingRight: 10 }}>
                      <div style={{ fontSize: 10, color: T.muted2, letterSpacing: "0.12em", marginBottom: 5 }}>{selectedJob.id} · {selectedJob.plataforma}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.5 }}>{selectedJob.titulo}</div>
                    </div>
                    <button onClick={() => setSelectedId(null)} style={{ background: "transparent", border: "none", color: T.muted2, cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>

                  {/* Score + Complexidade */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ background: T.s3, borderRadius: 7, padding: "12px 14px" }}>
                      <div style={{ fontSize: 10, color: T.muted2, letterSpacing: "0.12em", marginBottom: 6 }}>COMPLEXIDADE</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: complexColor[ins.complexidade] }}>{ins.complexidade.toUpperCase()}</div>
                    </div>
                    <div style={{ background: T.s3, borderRadius: 7, padding: "12px 14px" }}>
                      <div style={{ fontSize: 10, color: T.muted2, letterSpacing: "0.12em", marginBottom: 8 }}>VIABILIDADE</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: T.bg, borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ width: `${ins.score}%`, height: "100%", background: scoreColor(ins.score), borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 700, color: scoreColor(ins.score) }}>{ins.score}</span>
                      </div>
                    </div>
                  </div>

                  {/* Meta */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {[
                      ["Budget", selectedJob.budget],
                      ["Tipo", selectedJob.tipo],
                      ["Prazo", selectedJob.prazo],
                      ["Aplicado em", selectedJob.data_aplicacao || "—"],
                      ["Valor proposto", selectedJob.valor_proposto || "—"],
                      ["Payment Verified", selectedJob.payment_verified ? "✓ Confirmado" : "Não informado"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: T.s3, borderRadius: 5, padding: "8px 11px" }}>
                        <div style={{ fontSize: 9, color: T.muted2, marginBottom: 3, letterSpacing: "0.1em" }}>{k.toUpperCase()}</div>
                        <div style={{ fontSize: 12, color: k === "Payment Verified" && selectedJob.payment_verified ? T.green : T.text, fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Stack */}
                  {selectedJob.stack && selectedJob.stack !== "—" && (
                    <div>
                      <div style={{ fontSize: 10, color: T.muted2, letterSpacing: "0.12em", marginBottom: 6 }}>STACK DETECTADA</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {selectedJob.stack.split(",").map(s => (
                          <span key={s} style={{ fontSize: 10, background: T.blue + "20", color: T.blue, border: `1px solid ${T.blue}33`, borderRadius: 4, padding: "3px 8px" }}>{s.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alertas */}
                  {ins.alertas.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: T.red, letterSpacing: "0.12em", marginBottom: 6, fontWeight: 700 }}>⚠ ALERTAS</div>
                      {ins.alertas.map((a, i) => (
                        <div key={i} style={{ background: T.red + "12", border: `1px solid ${T.red}30`, borderRadius: 6, padding: "9px 12px", fontSize: 11, color: T.red, lineHeight: 1.6, marginBottom: 5 }}>{a}</div>
                      ))}
                    </div>
                  )}

                  {/* Insights */}
                  {ins.dicas.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: T.accent, letterSpacing: "0.12em", marginBottom: 6, fontWeight: 700 }}>✦ INSIGHTS RORDENS</div>
                      {ins.dicas.map((d, i) => (
                        <div key={i} style={{ background: T.accent + "0A", border: `1px solid ${T.accent}22`, borderRadius: 6, padding: "9px 12px", fontSize: 11, color: T.accentDim, lineHeight: 1.7, marginBottom: 5 }}>{d}</div>
                      ))}
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <div style={{ fontSize: 10, color: T.muted2, letterSpacing: "0.12em", marginBottom: 6, fontWeight: 700 }}>STATUS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {["para aplicar","aguardando","aprovado","recusado","cancelado"].map(s => (
                        <button key={s} onClick={() => updateStatus(selectedJob.id, s)} style={{
                          background: selectedJob.status === s ? (jobStatusColor[s] + "22") : "transparent",
                          border: `1px solid ${selectedJob.status === s ? jobStatusColor[s] : T.border2}`,
                          color: selectedJob.status === s ? jobStatusColor[s] : T.muted2,
                          borderRadius: 4, padding: "5px 11px", fontSize: 10,
                          cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace",
                          letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600
                        }}>{s}</button>
                      ))}
                    </div>
                  </div>

                  {/* Proposta */}
                  {selectedJob.proposta_texto && (
                    <div>
                      <div style={{ fontSize: 10, color: T.muted2, letterSpacing: "0.12em", marginBottom: 6, fontWeight: 700 }}>PROPOSTA ENVIADA</div>
                      <div style={{ background: T.s3, borderRadius: 6, padding: "10px 12px", fontSize: 11, color: T.text, lineHeight: 1.7, maxHeight: 130, overflowY: "auto", border: `1px solid ${T.border}` }}>
                        {selectedJob.proposta_texto}
                      </div>
                    </div>
                  )}

                  {selectedJob.notas && (
                    <div>
                      <div style={{ fontSize: 10, color: T.muted2, letterSpacing: "0.12em", marginBottom: 6, fontWeight: 700 }}>NOTAS</div>
                      <div style={{ background: T.s3, borderRadius: 6, padding: "10px 12px", fontSize: 11, color: T.text, lineHeight: 1.6, border: `1px solid ${T.border}` }}>{selectedJob.notas}</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 7 }}>
                    <button onClick={() => { setEditData({ ...selectedJob }); setEditMode(true); }} style={{
                      flex: 1, background: T.accent + "16", color: T.accent,
                      border: `1px solid ${T.accent}35`, borderRadius: 6, padding: 10,
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                      fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em"
                    }}>EDITAR</button>
                    <button onClick={() => handleDelete(selectedJob.id)} style={{
                      flex: 1, background: T.red + "16", color: T.red,
                      border: `1px solid ${T.red}35`, borderRadius: 6, padding: 10,
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                      fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em"
                    }}>REMOVER</button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editMode && editData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: T.s1, border: `1px solid ${T.border2}`, borderRadius: 12, padding: 26, width: 520, maxHeight: "88vh", overflowY: "auto" }}>
            <div style={{ fontSize: 8, letterSpacing: "0.16em", color: T.accent, marginBottom: 18 }}>EDITAR JOB — {editData.id}</div>

            {[["TÍTULO","titulo"],["BUDGET","budget"],["TIPO","tipo"],["PRAZO","prazo"],["STACK / SKILLS","stack"],["VALOR PROPOSTO","valor_proposto"],["DATA DE APLICAÇÃO","data_aplicacao"]].map(([label, field]) => (
              <div key={field} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 7, color: T.muted, letterSpacing: "0.13em", marginBottom: 4 }}>{label}</div>
                <input value={editData[field] || ""} onChange={e => setEditData(p => ({ ...p, [field]: e.target.value }))}
                  style={{ width: "100%", background: T.s3, border: `1px solid ${T.border2}`, borderRadius: 5, padding: "6px 9px", color: T.text, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 7, color: T.muted, letterSpacing: "0.13em", marginBottom: 5 }}>PROPOSTA ENVIADA?</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[true, false].map(v => (
                  <button key={String(v)} onClick={() => setEditData(p => ({ ...p, proposta_enviada: v }))} style={{
                    background: editData.proposta_enviada === v ? T.accent + "20" : "transparent",
                    border: `1px solid ${editData.proposta_enviada === v ? T.accent : T.border}`,
                    color: editData.proposta_enviada === v ? T.accent : T.muted,
                    borderRadius: 4, padding: "5px 14px", fontSize: 9, cursor: "pointer",
                    fontFamily: "'IBM Plex Mono', monospace"
                  }}>{v ? "SIM" : "NÃO"}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 7, color: T.muted, letterSpacing: "0.13em", marginBottom: 4 }}>TEXTO DA PROPOSTA / COVER LETTER</div>
              <textarea value={editData.proposta_texto || ""} onChange={e => setEditData(p => ({ ...p, proposta_texto: e.target.value }))} rows={5}
                placeholder="Cole aqui a cover letter enviada..."
                style={{ width: "100%", background: T.s3, border: `1px solid ${T.border2}`, borderRadius: 5, padding: "7px 9px", color: T.text, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 7, color: T.muted, letterSpacing: "0.13em", marginBottom: 4 }}>NOTAS INTERNAS</div>
              <textarea value={editData.notas || ""} onChange={e => setEditData(p => ({ ...p, notas: e.target.value }))} rows={3}
                placeholder="Contexto do cliente, negociações, observações..."
                style={{ width: "100%", background: T.s3, border: `1px solid ${T.border2}`, borderRadius: 5, padding: "7px 9px", color: T.text, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
              />
            </div>

            <div style={{ display: "flex", gap: 7 }}>
              <button onClick={handleSave} style={{ flex: 1, background: T.accent, color: T.bg, border: "none", borderRadius: 6, padding: 10, fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em" }}>SALVAR</button>
              <button onClick={() => { setEditMode(false); setEditData(null); }} style={{ flex: 1, background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, fontSize: 9, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
