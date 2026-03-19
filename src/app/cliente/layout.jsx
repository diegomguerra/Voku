"use client";
import { usePathname } from "next/navigation";
import { useUserContext } from "@/hooks/useUserContext";
import { supabase } from "@/lib/supabase";

const NAV = [
  { label: "Home", href: "/cliente/home" },
  { label: "Projetos", href: "/cliente/projetos" },
  { label: "Calendário", href: "/cliente/calendario" },
  { label: "Plano", href: "/cliente/plano" },
  { label: "Apps", href: "/vitrine/apps" },
  { label: "Marca", href: "/cliente/marca" },
  { label: "Vitrine", href: "/vitrine" },
  { label: "Afiliados", href: "/cliente/afiliados" },
];

export default function ClienteLayout({ children }) {
  const pathname = usePathname();
  const { ctx } = useUserContext();

  // Don't show nav on login page
  const isLoginPage = pathname === "/cliente";
  if (isLoginPage) return <>{children}</>;

  const handleLogout = async () => {
    await supabase().auth.signOut();
    window.location.href = "/cliente";
  };

  const isActive = (href) => {
    if (href === "/cliente/home") return pathname === "/cliente/home" || pathname === "/cliente/pedidos";
    return pathname.startsWith(href);
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ─── NAV ─── */}
      <div style={{
        background: "#FFFFFF", borderBottom: "1px solid #E8E5DE",
        padding: "0 40px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 64,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        {/* Left: Logo + Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/cliente/home" style={{ textDecoration: "none" }}>
            <div style={{
              background: "#111", color: "#fff", fontFamily: "'Inter', sans-serif",
              fontWeight: 900, fontSize: 20, letterSpacing: "-0.5px",
              padding: "4px 14px", borderRadius: 6, textTransform: "uppercase",
            }}>VOKU</div>
          </a>
          <span style={{ color: "#D1CCBF", fontSize: 20 }}>|</span>
          {NAV.map(item => (
            <a
              key={item.href}
              href={item.href}
              style={{
                fontSize: 13, fontWeight: isActive(item.href) ? 700 : 600,
                color: isActive(item.href) ? "#111" : "#6B6B6B",
                textDecoration: "none",
              }}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Right: New Project + Credits + Plan + Name + Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/cliente/projetos/novo" style={{
            background: "#C8F135", color: "#111", fontFamily: "'Inter', sans-serif",
            fontWeight: 800, fontSize: 12, padding: "6px 14px", borderRadius: 7,
            border: "none", textDecoration: "none", whiteSpace: "nowrap",
          }}>
            + Novo Projeto
          </a>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#FAF8F3", border: "1px solid #E8E5DE",
            borderRadius: 10, padding: "6px 14px",
          }}>
            <span style={{ fontSize: 12, color: "#6B6B6B", fontWeight: 600 }}>Créditos</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{ctx?.credits ?? 0}</span>
          </div>
          <div style={{
            background: "#C8F135", color: "#111", borderRadius: 8,
            padding: "4px 12px", fontSize: 11, fontWeight: 800,
            textTransform: "uppercase", letterSpacing: 1,
          }}>
            {ctx?.plan || "free"}
          </div>
          <span style={{ color: "#6B6B6B", fontSize: 13 }}>{ctx?.name}</span>
          <button onClick={handleLogout} style={{
            background: "transparent", border: "1.5px solid #D1CCBF",
            color: "#3D3D3D", borderRadius: 8, padding: "6px 18px",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>Sair</button>
        </div>
      </div>

      {/* ─── PAGE CONTENT ─── */}
      {children}
    </div>
  );
}
