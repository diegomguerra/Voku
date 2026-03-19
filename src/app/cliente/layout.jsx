"use client";
import { useState, useEffect } from "react";
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

const TRIAL_DAYS = 7;

function getTrialInfo(createdAt) {
  if (!createdAt) return { isTrial: false, expired: true, daysLeft: 0, hoursLeft: 0, minutesLeft: 0 };
  const created = new Date(createdAt);
  const expires = new Date(created.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diff = expires.getTime() - now.getTime();
  if (diff <= 0) return { isTrial: false, expired: true, daysLeft: 0, hoursLeft: 0, minutesLeft: 0 };
  const daysLeft = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hoursLeft = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutesLeft = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  return { isTrial: true, expired: false, daysLeft, hoursLeft, minutesLeft };
}

export default function ClienteLayout({ children }) {
  const pathname = usePathname();
  const { ctx } = useUserContext();
  const [trialInfo, setTrialInfo] = useState({ isTrial: false, expired: false, daysLeft: 0, hoursLeft: 0, minutesLeft: 0 });

  // Update trial countdown every minute
  useEffect(() => {
    if (!ctx?.createdAt) return;
    const isPaid = ctx.plan && ctx.plan !== "free";
    if (isPaid) { setTrialInfo({ isTrial: false, expired: false, daysLeft: 0, hoursLeft: 0, minutesLeft: 0 }); return; }
    const update = () => setTrialInfo(getTrialInfo(ctx.createdAt));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [ctx?.createdAt, ctx?.plan]);

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

  const isPaid = ctx?.plan && ctx.plan !== "free";

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ─── TRIAL BANNER ─── */}
      {trialInfo.expired && !isPaid && (
        <div style={{
          background: "linear-gradient(135deg, #111 0%, #1a1a2e 100%)",
          padding: "12px 40px", display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 16 }}>⏰</span>
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 13, color: "#C8F135" }}>
                Seu período grátis acabou
              </div>
              <div style={{ fontSize: 12, color: "#A0A0A0", marginTop: 1 }}>
                Escolha um plano para continuar criando conteúdo ilimitado.
              </div>
            </div>
          </div>
          <a href="/cliente/plano" style={{
            background: "#C8F135", color: "#111", fontFamily: "'Inter', sans-serif",
            fontWeight: 800, fontSize: 12, padding: "8px 20px", borderRadius: 8,
            border: "none", textDecoration: "none", whiteSpace: "nowrap",
          }}>
            Escolher plano →
          </a>
        </div>
      )}

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

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/cliente/projetos/novo" style={{
            background: "#C8F135", color: "#111", fontFamily: "'Inter', sans-serif",
            fontWeight: 800, fontSize: 12, padding: "6px 14px", borderRadius: 7,
            border: "none", textDecoration: "none", whiteSpace: "nowrap",
          }}>
            + Novo Projeto
          </a>

          {/* Credits / Trial indicator */}
          {trialInfo.isTrial && !isPaid ? (
            /* ── TRIAL: show countdown + unlimited ── */
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#111", borderRadius: 10, padding: "6px 14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#C8F135", fontWeight: 700 }}>∞</span>
                <span style={{ fontSize: 11, color: "#C8F135", fontWeight: 700 }}>Ilimitado</span>
              </div>
              <div style={{ width: 1, height: 16, background: "#333" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: "#A0A0A0" }}>Restam</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 12, color: "#fff" }}>
                  {trialInfo.daysLeft > 0
                    ? `${trialInfo.daysLeft}d ${trialInfo.hoursLeft}h`
                    : `${trialInfo.hoursLeft}h ${trialInfo.minutesLeft}m`
                  }
                </span>
              </div>
            </div>
          ) : (
            /* ── PAID / EXPIRED: show credits ── */
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#FAF8F3", border: "1px solid #E8E5DE",
              borderRadius: 10, padding: "6px 14px",
            }}>
              <span style={{ fontSize: 12, color: "#6B6B6B", fontWeight: 600 }}>Créditos</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>
                {isPaid ? (ctx?.credits ?? 0) : 0}
              </span>
            </div>
          )}

          {/* Plan badge */}
          <div style={{
            background: trialInfo.isTrial && !isPaid ? "#111" : "#C8F135",
            color: trialInfo.isTrial && !isPaid ? "#C8F135" : "#111",
            borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 800,
            textTransform: "uppercase", letterSpacing: 1,
            border: trialInfo.isTrial && !isPaid ? "1px solid #C8F135" : "none",
          }}>
            {trialInfo.isTrial && !isPaid ? "TRIAL" : (ctx?.plan || "free")}
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
