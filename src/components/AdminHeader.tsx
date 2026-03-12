"use client";

export default function AdminHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="adm-header" style={{
      background: "#FFFFFF",
      borderBottom: "2px solid #111111",
      position: "sticky",
      top: 0,
      zIndex: 100,
      fontFamily: "'Inter', sans-serif",
    }}>
      <div className="adm-header-left">
        <span style={{
          background: "#AAFF00",
          color: "#111111",
          fontWeight: 900,
          fontSize: "13px",
          padding: "3px 8px",
          letterSpacing: "0.05em",
        }}>VOKU</span>
        <span style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#999999",
          letterSpacing: "0.15em",
        }}>{sub}</span>
        <span className="adm-header-title" style={{
          fontSize: "18px",
          fontWeight: 900,
          color: "#111111",
          letterSpacing: "-0.02em",
        }}>{title}</span>
      </div>
      <a href="/admin/dashboard" className="adm-header-back"
        style={{ fontFamily: "'Inter', sans-serif" }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = "#111111";
          (e.currentTarget as HTMLElement).style.color = "#AAFF00";
          (e.currentTarget as HTMLElement).style.borderColor = "#111111";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "#111111";
          (e.currentTarget as HTMLElement).style.borderColor = "#E5E5E5";
        }}
      >
        ← DASHBOARDS
      </a>
    </div>
  );
}
