// @ts-nocheck
import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const C = {
  bg: "#06060A",
  s1: "#0C0C12",
  s2: "#101018",
  s3: "#16161E",
  border: "#1C1C26",
  border2: "#242430",
  text: "#F0F0F8",
  muted: "#484858",
  muted2: "#686878",
  accent: "#E9F59E",
  yt: "#FF0000",
  ytDim: "#FF000066",
  ig: "#E1306C",
  igDim: "#E1306C66",
  tt: "#69C9D0",
  ttDim: "#69C9D066",
  green: "#4ADE80",
  purple: "#A78BFA",
  orange: "#FB923C",
};

const growthData = [
  { week: "S1", yt: 120, ig: 340, tt: 890 },
  { week: "S2", yt: 145, ig: 420, tt: 1240 },
  { week: "S3", yt: 198, ig: 510, tt: 1680 },
  { week: "S4", yt: 267, ig: 640, tt: 2100 },
  { week: "S5", yt: 312, ig: 780, tt: 2890 },
  { week: "S6", yt: 398, ig: 920, tt: 3540 },
  { week: "S7", yt: 445, ig: 1080, tt: 4120 },
  { week: "S8", yt: 520, ig: 1240, tt: 5200 },
];

const engagementData = [
  { week: "S1", taxa: 3.2 },
  { week: "S2", taxa: 3.8 },
  { week: "S3", taxa: 4.1 },
  { week: "S4", taxa: 3.9 },
  { week: "S5", taxa: 5.2 },
  { week: "S6", taxa: 6.1 },
  { week: "S7", taxa: 5.8 },
  { week: "S8", taxa: 7.4 },
];

const investData = [
  { mes: "Jan", gasto: 0, leads: 0 },
  { mes: "Fev", gasto: 150, leads: 12 },
  { mes: "Mar", gasto: 300, leads: 31 },
];

const recentPosts = [
  { plat: "ig", title: "3 erros que matam sua copy", likes: 847, comments: 62, shares: 134, reach: "12.4k", date: "Hoje" },
  { plat: "tt", title: "Automatizei meu negócio com IA", likes: 3241, comments: 218, shares: 891, reach: "48k", date: "Ontem" },
  { plat: "yt", title: "Como a Voku entrega em 24h", likes: 124, comments: 18, shares: 34, reach: "2.1k", date: "3 dias" },
  { plat: "ig", title: "Antes e depois: landing page", likes: 612, comments: 41, shares: 98, reach: "9.8k", date: "4 dias" },
  { plat: "tt", title: "Vendi $97 enquanto dormia", likes: 5812, comments: 441, shares: 1240, reach: "92k", date: "5 dias" },
];

const platIcon = { ig: "◉", tt: "♦", yt: "▶" };
const platColor = { ig: C.ig, tt: C.tt, yt: C.yt };
const platName = { ig: "Instagram", tt: "TikTok", yt: "YouTube" };

const platforms = [
  {
    id: "ig", name: "Instagram", icon: "◉", color: C.ig,
    followers: "1.240", growth: "+18%", posts: 28, reach: "84k",
    engagement: "6.2%", best: "Carrossel educativo",
  },
  {
    id: "tt", name: "TikTok", icon: "♦", color: C.tt,
    followers: "5.200", growth: "+42%", posts: 21, reach: "247k",
    engagement: "7.4%", best: "Bastidores do processo",
  },
  {
    id: "yt", name: "YouTube", icon: "▶", color: C.yt,
    followers: "520", growth: "+12%", posts: 8, reach: "18k",
    engagement: "4.1%", best: "Tutorial passo a passo",
  },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.s3, border: `1px solid ${C.border2}`, borderRadius: 6, padding: "10px 14px", fontSize: 11, color: C.text }}>
      <div style={{ color: C.muted, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>{p.name}: {p.value.toLocaleString()}</div>
      ))}
    </div>
  );
};

const Stat = ({ label, value, sub, color, delta }: { label: string; value: string; sub?: string; color?: string; delta?: number }) => (
  <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 22px" }}>
    <div style={{ fontSize: 9, letterSpacing: "0.14em", color: C.muted, marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || C.text, fontFamily: "monospace", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: C.muted2, marginTop: 5 }}>{sub}</div>}
    {delta !== undefined && (
      <div style={{ fontSize: 10, color: delta >= 0 ? C.green : C.yt, marginTop: 5 }}>
        {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% esta semana
      </div>
    )}
  </div>
);

export default function VokuMedia() {
  const [activePlat, setActivePlat] = useState("all");

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'IBM Plex Mono', monospace" }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ color: C.accent, fontWeight: 700, fontSize: 16 }}>✦ VOKU</span>
          <span style={{ color: C.muted, fontSize: 10, letterSpacing: "0.15em" }}>MEDIA INTELLIGENCE</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ id: "all", label: "TODAS" }, { id: "ig", label: "◉ IG" }, { id: "tt", label: "♦ TT" }, { id: "yt", label: "▶ YT" }].map(p => (
            <button key={p.id} onClick={() => setActivePlat(p.id)} style={{
              background: activePlat === p.id ? C.accent + "18" : "transparent",
              border: `1px solid ${activePlat === p.id ? C.accent + "55" : C.border}`,
              color: activePlat === p.id ? C.accent : C.muted,
              borderRadius: 5, padding: "5px 14px", fontSize: 10,
              letterSpacing: "0.1em", cursor: "pointer"
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Platform cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          {platforms.map(p => (
            <div key={p.id} style={{
              background: C.s2, border: `1px solid ${activePlat === p.id ? p.color + "55" : C.border}`,
              borderRadius: 10, padding: "20px 24px", cursor: "pointer",
              transition: "all 0.2s"
            }} onClick={() => setActivePlat(activePlat === p.id ? "all" : p.id)}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: p.color, fontSize: 18 }}>{p.icon}</span>
                  <span style={{ color: p.color, fontWeight: 700, fontSize: 13 }}>{p.name}</span>
                </div>
                <span style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>{p.growth}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { l: "SEGUIDORES", v: p.followers },
                  { l: "POSTS/MÊS", v: p.posts },
                  { l: "ALCANCE", v: p.reach },
                  { l: "ENGAJAMENTO", v: p.engagement },
                ].map(item => (
                  <div key={item.l}>
                    <div style={{ fontSize: 8, letterSpacing: "0.1em", color: C.muted, marginBottom: 2 }}>{item.l}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.v}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 8, letterSpacing: "0.1em", color: C.muted, marginBottom: 3 }}>MELHOR FORMATO</div>
                <div style={{ fontSize: 10, color: p.color }}>{p.best}</div>
              </div>
            </div>
          ))}
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          <Stat label="TOTAL SEGUIDORES" value="6.960" sub="todas as plataformas" color={C.accent} delta={24} />
          <Stat label="ALCANCE TOTAL/MÊS" value="349k" sub="pessoas únicas" delta={31} />
          <Stat label="INVESTIMENTO PAGO" value="R$300" sub="março 2026" color={C.orange} />
          <Stat label="LEADS GERADOS" value="31" sub="via mídia social" delta={158} />
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 12, marginBottom: 24 }}>
          <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.14em", color: C.muted, marginBottom: 16 }}>CRESCIMENTO DE SEGUIDORES — 8 SEMANAS</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={growthData}>
                <XAxis dataKey="week" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {(activePlat === "all" || activePlat === "ig") && <Line type="monotone" dataKey="ig" stroke={C.ig} strokeWidth={2} dot={false} name="Instagram" />}
                {(activePlat === "all" || activePlat === "tt") && <Line type="monotone" dataKey="tt" stroke={C.tt} strokeWidth={2} dot={false} name="TikTok" />}
                {(activePlat === "all" || activePlat === "yt") && <Line type="monotone" dataKey="yt" stroke={C.yt} strokeWidth={2} dot={false} name="YouTube" />}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.14em", color: C.muted, marginBottom: 16 }}>TAXA DE ENGAJAMENTO %</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={engagementData}>
                <XAxis dataKey="week" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="taxa" stroke={C.accent} fill={C.accent + "18"} strokeWidth={2} name="Engajamento %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Investimento */}
        <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.14em", color: C.muted }}>INVESTIMENTO PAGO vs LEADS GERADOS</div>
            <div style={{ display: "flex", gap: 16, fontSize: 10 }}>
              <span style={{ color: C.orange }}>■ Gasto R$</span>
              <span style={{ color: C.green }}>■ Leads</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={investData}>
              <XAxis dataKey="mes" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="gasto" fill={C.orange + "88"} radius={[3, 3, 0, 0]} name="Gasto R$" />
              <Bar dataKey="leads" fill={C.green + "88"} radius={[3, 3, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, fontSize: 10, color: C.muted2 }}>
            CPL médio: <span style={{ color: C.accent, fontWeight: 700 }}>R$9,67</span> &nbsp;·&nbsp; ROI estimado: <span style={{ color: C.green, fontWeight: 700 }}>+8x</span>
          </div>
        </div>

        {/* Recent Posts */}
        <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 9, letterSpacing: "0.14em", color: C.muted }}>
            POSTS RECENTES — DESEMPENHO
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["PLAT.", "CONTEÚDO", "ALCANCE", "LIKES", "COMENT.", "SHARES", "DATA"].map(h => (
                  <th key={h} style={{ padding: "9px 18px", textAlign: "left", fontSize: 8, letterSpacing: "0.12em", color: C.muted, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPosts.filter(p => activePlat === "all" || p.plat === activePlat).map((p, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 18px" }}>
                    <span style={{ color: platColor[p.plat], fontSize: 14 }}>{platIcon[p.plat]}</span>
                  </td>
                  <td style={{ padding: "12px 18px", fontSize: 11, color: C.text, maxWidth: 220 }}>{p.title}</td>
                  <td style={{ padding: "12px 18px", fontSize: 11, color: C.accent, fontWeight: 700 }}>{p.reach}</td>
                  <td style={{ padding: "12px 18px", fontSize: 11, color: C.muted2 }}>{p.likes.toLocaleString()}</td>
                  <td style={{ padding: "12px 18px", fontSize: 11, color: C.muted2 }}>{p.comments}</td>
                  <td style={{ padding: "12px 18px", fontSize: 11, color: C.muted2 }}>{p.shares.toLocaleString()}</td>
                  <td style={{ padding: "12px 18px", fontSize: 10, color: C.muted }}>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
