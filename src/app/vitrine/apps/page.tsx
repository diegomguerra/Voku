"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const T = {
  sand: "#FAF8F3", white: "#FFFFFF", ink: "#111111", inkSub: "#3D3D3D", inkMid: "#6B6B6B", inkFaint: "#A0A0A0",
  lime: "#C8F135", border: "#E8E5DE", borderMd: "#D1CCBF",
  teal: "#0D7A6E", tealBg: "#E6F5F3", amber: "#B45309", amberBg: "#FEF3C7",
  blue: "#1D4ED8", blueBg: "#DBEAFE", purple: "#7C3AED", purpleBg: "#EDE9FE",
  green: "#166534", greenBg: "#DCFCE7",
};

const TYPE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  calculadora: { label: "Calculadora", color: T.teal, bg: T.tealBg },
  quiz: { label: "Quiz", color: T.purple, bg: T.purpleBg },
  formulario: { label: "Formulário", color: T.blue, bg: T.blueBg },
  gerador: { label: "Gerador", color: T.amber, bg: T.amberBg },
  captura: { label: "Captura", color: T.green, bg: T.greenBg },
  outro: { label: "App", color: T.inkMid, bg: T.sand },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} dia${days > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `há ${months} mês${months > 1 ? "es" : ""}`;
}

type App = {
  id: string;
  slug: string;
  titulo: string | null;
  preview_descricao: string | null;
  descricao: string;
  tipo: string;
  created_at: string;
};

export default function VitrineAppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    sb.from("apps")
      .select("id, slug, titulo, preview_descricao, descricao, tipo, created_at")
      .eq("publico", true)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setApps(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ background: T.sand, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <div style={{ background: T.ink, color: T.lime, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 20, padding: "4px 14px", borderRadius: 6 }}>Voku</div>
        </a>
        <a href="/cliente" style={{ background: T.ink, color: T.lime, padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          Criar meu app grátis →
        </a>
      </div>

      <div style={{ padding: "48px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: T.ink, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            Apps criados com Voku
          </h1>
          <p style={{ fontSize: 15, color: T.inkMid, margin: 0 }}>
            Calculadoras, quizzes, formulários e ferramentas — tudo gerado por IA em minutos.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: T.inkMid, fontSize: 15 }}>Carregando...</div>
        ) : apps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Nenhum app publicado ainda.</div>
            <div style={{ fontSize: 14, color: T.inkMid, marginBottom: 28 }}>Seja o primeiro!</div>
            <a href="/cliente" style={{ background: T.ink, color: T.lime, padding: "14px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
              Criar meu app →
            </a>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {apps.map(app => {
              const badge = TYPE_BADGE[app.tipo] || TYPE_BADGE.outro;
              const title = app.titulo || app.descricao.slice(0, 50);
              return (
                <div key={app.id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 18, padding: "24px 22px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: badge.bg, color: badge.color }}>{badge.label}</span>
                    <span style={{ fontSize: 11, color: T.inkFaint, marginLeft: "auto" }}>{timeAgo(app.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 8, lineHeight: 1.35 }}>{title}</div>
                  <div style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.5, marginBottom: 16, flex: 1 }}>
                    {(app.preview_descricao || app.descricao).slice(0, 120)}{(app.preview_descricao || app.descricao).length > 120 ? "..." : ""}
                  </div>
                  <div style={{ fontSize: 10, color: T.inkFaint, marginBottom: 14 }}>Criado com Voku</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a href={`/app/${app.slug}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: T.ink, color: T.lime, border: "none", borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
                      Ver app →
                    </a>
                    <a href={`/cliente?tipo=${app.tipo}`} style={{ flex: 1, background: T.sand, border: `1px solid ${T.borderMd}`, color: T.inkSub, borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
                      Criar parecido →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
