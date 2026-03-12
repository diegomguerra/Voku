"use client";

export default function OpsDashboard() {
  const dashboards = [
    { href: "/admin/dashboard/unified", label: "Mapa do Projeto", sub: "UNIFIED", desc: "Visão geral de todas as iniciativas" },
    { href: "/admin/dashboard/status", label: "Status & Prompts", sub: "STATUS", desc: "Prompts operacionais e status do sistema" },
    { href: "/admin/dashboard/prospeccao", label: "Prospecção", sub: "PROSPECCAO", desc: "Pipeline de clientes e marketplace" },
    { href: "/admin/dashboard/media", label: "Media Intelligence", sub: "MÍDIA", desc: "Métricas Instagram e performance de posts" },
    { href: "/admin/dashboard/fluxo", label: "Fluxo Operacional", sub: "FLUXO", desc: "Automações e pipeline de entrega" },
    { href: "/admin/aprovacao", label: "Aprovação de Conteúdo", sub: "APROVAÇÃO", desc: "Revisar e despachar posts da semana", accent: true },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}>

      {/* TOPBAR */}
      <div style={{ borderBottom: "2px solid #111111", padding: "20px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ background: "#AAFF00", color: "#111111", fontWeight: 900, fontSize: "15px", padding: "4px 10px", letterSpacing: "0.05em" }}>VOKU</span>
          <span style={{ color: "#333333", fontWeight: 500, fontSize: "15px", letterSpacing: "0.08em" }}>ADMIN</span>
        </div>
        <a href="https://voku.one" style={{ color: "#111111", fontWeight: 700, fontSize: "13px", textDecoration: "none", letterSpacing: "0.1em", borderBottom: "2px solid #AAFF00", paddingBottom: "2px" }}>↗ VOKU.ONE</a>
      </div>

      {/* HERO */}
      <div style={{ padding: "80px 48px 48px", borderBottom: "1px solid #E5E5E5" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", color: "#999999", marginBottom: "16px" }}>VOKU · ADMIN</div>
        <h1 style={{ fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 900, color: "#111111", margin: 0, lineHeight: 1, letterSpacing: "-0.03em" }}>Dashboards</h1>
        <div style={{ width: "60px", height: "4px", background: "#AAFF00", marginTop: "24px" }} />
      </div>

      {/* GRID DESKTOP: 3 colunas × 2 linhas */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "2px",
        background: "#111111",
        padding: "2px",
      }}>
        {dashboards.map((d) => (
          <a
            key={d.href}
            href={d.href}
            style={{
              background: d.accent ? "#AAFF00" : "#FFFFFF",
              padding: "40px",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              minHeight: "220px",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = d.accent ? "#99EE00" : "#F5F5F5"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = d.accent ? "#AAFF00" : "#FFFFFF"; }}
          >
            <div style={{ width: "32px", height: "3px", background: d.accent ? "#111111" : "#AAFF00" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#111111", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: "10px" }}>{d.label}</div>
              <div style={{ fontSize: "13px", color: "#555555", fontWeight: 500, lineHeight: 1.5 }}>{d.desc}</div>
            </div>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", color: "#111111", display: "flex", alignItems: "center", gap: "8px" }}>
              {d.sub} <span style={{ fontSize: "16px" }}>→</span>
            </div>
          </a>
        ))}
      </div>

      {/* FOOTER */}
      <div style={{ padding: "24px 48px", borderTop: "1px solid #E5E5E5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", color: "#999999", fontWeight: 500 }}>Voku Digital Studio © 2026</span>
        <span style={{ fontSize: "12px", color: "#AAFF00", fontWeight: 700 }}>✦</span>
      </div>

      {/* RESPONSIVO MOBILE */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
          h1 {
            font-size: 40px !important;
          }
          div[style*="padding: 80px 48px"] {
            padding: 40px 24px 32px !important;
          }
          div[style*="padding: 20px 48px"] {
            padding: 16px 24px !important;
          }
          a[style*="padding: 40px"] {
            padding: 28px 24px !important;
            min-height: 160px !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          div[style*="repeat(3, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
