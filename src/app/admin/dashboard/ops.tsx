// @ts-nocheck
import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const C = {
  bg: "#080808",
  s1: "#0E0E0E",
  s2: "#141414",
  s3: "#1A1A1A",
  border: "#1F1F1F",
  border2: "#2A2A2A",
  accent: "#E9F59E",
  accentDim: "#B8C478",
  text: "#EFEFEB",
  muted: "#555",
  muted2: "#777",
  green: "#4ADE80",
  red: "#F87171",
  blue: "#60A5FA",
  purple: "#A78BFA",
  orange: "#FB923C",
};

const revenueData = [
  { month: "Set", usd: 194, brl: 994 },
  { month: "Out", usd: 388, brl: 1988 },
  { month: "Nov", usd: 582, brl: 2982 },
  { month: "Dez", usd: 970, brl: 4970 },
  { month: "Jan", usd: 1358, brl: 6958 },
  { month: "Fev", usd: 1940, brl: 9940 },
  { month: "Mar", usd: 2522, brl: 12908 },
];

const funnelData = [
  { stage: "Visitantes", value: 1240, pct: 100 },
  { stage: "Cadastros", value: 186, pct: 15 },
  { stage: "Briefings", value: 93, pct: 7.5 },
  { stage: "Pagamentos", value: 42, pct: 3.4 },
  { stage: "Entregas", value: 41, pct: 3.3 },
];

const productMix = [
  { name: "Landing Page Copy", value: 18, color: C.accent },
  { name: "Pacote de Posts", value: 14, color: C.purple },
  { name: "Sequência E-mails", value: 10, color: C.blue },
];

const recentOrders = [
  { id: "#0041", client: "Eduardo M.", product: "Landing Page Copy", status: "entregue", value: "$97", time: "18h", flag: "🇧🇷" },
  { id: "#0040", client: "Carolina R.", product: "Pacote de Posts", status: "em produção", value: "$147", time: "6h", flag: "🇲🇽" },
  { id: "#0039", client: "James K.", product: "Seq. E-mails", status: "entregue", value: "$127", time: "31h", flag: "🇺🇸" },
  { id: "#0038", client: "Ana L.", product: "Landing Page Copy", status: "entregue", value: "R$497", time: "22h", flag: "🇧🇷" },
  { id: "#0037", client: "Miguel F.", product: "Pacote de Posts", status: "briefing", value: "$147", time: "—", flag: "🇦🇷" },
];

const statusColor = { "entregue": C.green, "em produção": C.accent, "briefing": C.orange };

const Stat = ({ label, value, sub, color, delta }: { label: string; value: string; sub?: string; color?: string; delta?: number }) => (
  <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px" }}>
    <div style={{ fontSize: 10, letterSpacing: "0.12em", color: C.muted, marginBottom: 10 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: color || C.text, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.muted2, marginTop: 6 }}>{sub}</div>}
    {delta && (
      <div style={{ fontSize: 11, color: delta > 0 ? C.green : C.red, marginTop: 6 }}>
        {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}% vs mês anterior
      </div>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.s3, border: `1px solid ${C.border2}`, borderRadius: 6, padding: "10px 14px", fontSize: 12, color: C.text }}>
      <div style={{ color: C.muted, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.name === "usd" ? "$" : "R$"}{p.value.toLocaleString()}</div>
      ))}
    </div>
  );
};

export default function VokuOps() {
  const [tab, setTab] = useState("overview");
  const [currency, setCurrency] = useState("usd");

  const tabs = ["overview", "pedidos", "funil", "clientes"];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'IBM Plex Mono', monospace" }}>
      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ color: C.accent, fontWeight: 700, fontSize: 16 }}>✦ VOKU</span>
          <span style={{ color: C.muted, fontSize: 10, letterSpacing: "0.15em" }}>OPERATIONS</span>
          <div style={{ display: "flex", gap: 2, marginLeft: 12 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? C.accent + "18" : "transparent",
                border: `1px solid ${tab === t ? C.accent + "44" : "transparent"}`,
                color: tab === t ? C.accent : C.muted,
                borderRadius: 5, padding: "5px 14px", fontSize: 10,
                letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase"
              }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 2 }}>
            {["usd", "brl"].map(c => (
              <button key={c} onClick={() => setCurrency(c)} style={{
                background: currency === c ? C.accent : "transparent",
                color: currency === c ? C.bg : C.muted,
                border: `1px solid ${currency === c ? C.accent : C.border}`,
                borderRadius: 4, padding: "4px 10px", fontSize: 10,
                cursor: "pointer", fontWeight: 700, letterSpacing: "0.08em"
              }}>{c.toUpperCase()}</button>
            ))}
          </div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
          <span style={{ fontSize: 10, color: C.muted }}>ao vivo</span>
        </div>
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>

        {/* KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          <Stat label="RECEITA DO MÊS" value={currency === "usd" ? "$2.522" : "R$12.908"} sub="março 2026" color={C.accent} delta={30} />
          <Stat label="PEDIDOS ATIVOS" value="42" sub="3 em produção agora" delta={18} />
          <Stat label="TICKET MÉDIO" value={currency === "usd" ? "$124" : "R$634"} sub="todos os produtos" delta={7} />
          <Stat label="TEMPO MÉDIO ENTREGA" value="28h" sub="meta: 36h" color={C.green} delta={-12} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          <Stat label="TOTAL CLIENTES" value="87" sub="23 recorrentes" delta={22} />
          <Stat label="TAXA DE RECOMPRA" value="26%" sub="meta: 35%" color={C.purple} delta={4} />
        </div>

        {/* Revenue chart + Product mix */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 24 }}>
          <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.12em", color: C.muted, marginBottom: 16 }}>RECEITA — ÚLTIMOS 7 MESES</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={revenueData}>
                <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey={currency} stroke={C.accent} strokeWidth={2} dot={{ fill: C.accent, r: 3 }} name={currency} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.12em", color: C.muted, marginBottom: 16 }}>MIX DE PRODUTOS</div>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={productMix} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                  {productMix.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12 }}>
              {productMix.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                  <span style={{ color: C.muted2, flex: 1 }}>{p.name}</span>
                  <span style={{ color: C.text, fontWeight: 700 }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Funil */}
        <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.12em", color: C.muted, marginBottom: 16 }}>FUNIL DE CONVERSÃO</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {funnelData.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 120, fontSize: 11, color: C.muted2 }}>{f.stage}</div>
                <div style={{ flex: 1, background: C.s3, borderRadius: 3, height: 20, overflow: "hidden" }}>
                  <div style={{
                    width: `${f.pct}%`, height: "100%",
                    background: `linear-gradient(to right, ${C.accent}88, ${C.accent})`,
                    borderRadius: 3, transition: "width 0.5s ease"
                  }} />
                </div>
                <div style={{ width: 50, fontSize: 11, color: C.text, textAlign: "right", fontWeight: 700 }}>{f.value.toLocaleString()}</div>
                <div style={{ width: 40, fontSize: 10, color: C.accentDim, textAlign: "right" }}>{f.pct}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, fontSize: 10, letterSpacing: "0.12em", color: C.muted }}>
            PEDIDOS RECENTES
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["ID", "CLIENTE", "PRODUTO", "VALOR", "TEMPO", "STATUS"].map(h => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 9, letterSpacing: "0.12em", color: C.muted, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o, i) => (
                <tr key={i} style={{ borderBottom: i < recentOrders.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <td style={{ padding: "12px 20px", fontSize: 11, color: C.muted2 }}>{o.id}</td>
                  <td style={{ padding: "12px 20px", fontSize: 11, color: C.text }}>{o.flag} {o.client}</td>
                  <td style={{ padding: "12px 20px", fontSize: 11, color: C.muted2 }}>{o.product}</td>
                  <td style={{ padding: "12px 20px", fontSize: 11, color: C.accent, fontWeight: 700 }}>{o.value}</td>
                  <td style={{ padding: "12px 20px", fontSize: 11, color: C.muted2 }}>{o.time}</td>
                  <td style={{ padding: "12px 20px" }}>
                    <span style={{
                      fontSize: 9, letterSpacing: "0.08em", fontWeight: 700,
                      color: statusColor[o.status], background: statusColor[o.status] + "18",
                      border: `1px solid ${statusColor[o.status]}33`,
                      borderRadius: 4, padding: "3px 8px"
                    }}>{o.status.toUpperCase()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
