"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const FONT = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap";

const ADMIN_EMAILS = [
  "diegomguerra@me.com",
  "dmarcondesguerra@gmail.com",
];

const NAV = [
  { href: "/admin/dashboard/unified",    label: "\u{1F5FA} Mapa do Projeto",      short: "MAPA"       },
  { href: "/admin/dashboard/status",     label: "\u2705 Status & Prompts",     short: "STATUS"     },
  { href: "/admin/dashboard/prospeccao", label: "\u{1F3AF} Prospecção",           short: "PROSPECÇÃO" },
  { href: "/admin/dashboard/media",      label: "\u{1F4F1} Media Intelligence",   short: "MÍDIA"      },
  { href: "/admin/dashboard/fluxo",      label: "\u{1F504} Fluxo Operacional",    short: "FLUXO"      },
];

export default function AdminLayout({ children }) {
  const path = usePathname();
  const isIndex = path === "/admin/dashboard";
  const [auth, setAuth] = useState("loading"); // "loading" | "denied" | "ok"

  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(({ data }) => {
      if (data?.user && ADMIN_EMAILS.includes(data.user.email)) {
        setAuth("ok");
      } else {
        setAuth("denied");
      }
    });
  }, []);

  if (auth === "loading") {
    return (
      <div style={{ background: "#0A0A0A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#444", letterSpacing: "0.12em" }}>LOADING...</div>
      </div>
    );
  }

  if (auth === "denied") {
    return (
      <div style={{ background: "#0A0A0A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: "#F87171", fontWeight: 700, letterSpacing: "0.08em" }}>ACCESS DENIED</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#444" }}>Admin authentication required.</div>
        <a href="/cliente" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#E9F59E", textDecoration: "none", marginTop: 8 }}>Login &rarr;</a>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('${FONT}');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0A0A0A; }
        .nav-link { transition: all 0.15s; }
        .nav-link:hover { opacity: 0.8; }
      `}</style>

      {/* ── TOP NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
        height: 44, background: "rgba(8,8,10,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1C1C26",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", fontFamily: "'IBM Plex Mono', monospace",
      }}>
        {/* Logo */}
        <Link href="/admin/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#E9F59E", fontWeight: 700, fontSize: 14, letterSpacing: "0.04em" }}>✦ VOKU</span>
          <span style={{ color: "#333", fontSize: 10, letterSpacing: "0.18em" }}>ADMIN</span>
        </Link>

        {/* Dashboard links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {NAV.map(({ href, short }) => {
            const active = path === href;
            return (
              <Link key={href} href={href} className="nav-link" style={{
                textDecoration: "none",
                padding: "5px 12px", borderRadius: 5,
                fontSize: 9, letterSpacing: "0.12em", fontWeight: 600,
                background: active ? "#E9F59E18" : "transparent",
                border: `1px solid ${active ? "#E9F59E55" : "transparent"}`,
                color: active ? "#E9F59E" : "#484858",
              }}>
                {short}
              </Link>
            );
          })}
        </div>

        {/* Back to site */}
        <Link href="/" style={{
          textDecoration: "none", fontSize: 9, letterSpacing: "0.12em",
          color: "#484858", fontWeight: 600,
        }} className="nav-link">
          &larr; VOKU.ONE
        </Link>
      </nav>

      {/* ── CONTENT (push down by nav height) ── */}
      <div style={{ paddingTop: 44 }}>
        {isIndex ? <DashboardIndex /> : children}
      </div>
    </>
  );
}

function DashboardIndex() {
  return (
    <div style={{
      minHeight: "calc(100vh - 44px)", background: "#06060A",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace",
      padding: "48px 24px",
    }}>
      <div style={{ marginBottom: 8, fontSize: 10, letterSpacing: "0.2em", color: "#444" }}>VOKU · ADMIN</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#E9F59E", marginBottom: 48, letterSpacing: "0.02em" }}>
        ✦ Dashboards
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, maxWidth: 900, width: "100%" }}>
        {NAV.map(({ href, label }) => (
          <Link key={href} href={href} style={{
            textDecoration: "none",
            background: "#101018", border: "1px solid #1C1C26",
            borderRadius: 10, padding: "24px 28px",
            display: "flex", flexDirection: "column", gap: 8,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#E9F59E44"; e.currentTarget.style.background = "#16161E"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#1C1C26"; e.currentTarget.style.background = "#101018"; }}
          >
            <span style={{ fontSize: 22 }}>{label.split(" ")[0]}</span>
            <span style={{ fontSize: 12, color: "#E9F59E", fontWeight: 700, letterSpacing: "0.06em" }}>
              {label.split(" ").slice(1).join(" ")}
            </span>
            <span style={{ fontSize: 9, color: "#484858", letterSpacing: "0.1em", marginTop: 4 }}>
              {href.split("/").pop().toUpperCase()} &rarr;
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
