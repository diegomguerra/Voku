"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const T = {
  sand: "#FAF8F3", white: "#FFFFFF", ink: "#111111", inkSub: "#3D3D3D", inkMid: "#6B6B6B", inkFaint: "#A0A0A0",
  lime: "#C8F135", border: "#E8E5DE", borderMd: "#D1CCBF",
  teal: "#0D7A6E", tealBg: "#E6F5F3", amber: "#B45309", amberBg: "#FEF3C7",
  blue: "#1D4ED8", blueBg: "#DBEAFE", purple: "#7C3AED", purpleBg: "#EDE9FE",
  green: "#166534", greenBg: "#DCFCE7", red: "#DC2626", redBg: "#FEE2E2",
};

const TYPE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  landing_page: { label: "Landing Page", color: T.teal, bg: T.tealBg },
  copy: { label: "Copy", color: T.blue, bg: T.blueBg },
  post: { label: "Post", color: T.green, bg: T.greenBg },
  carrossel: { label: "Carrossel", color: T.purple, bg: T.purpleBg },
  email: { label: "E-mail", color: T.amber, bg: T.amberBg },
  app: { label: "App", color: T.red, bg: T.redBg },
  reels: { label: "Reels", color: "#EC4899", bg: "#FCE7F3" },
};

const TIPO_OPTIONS = ["landing_page", "copy", "post", "carrossel", "email", "app", "reels"];

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

type VitrineItem = {
  id: string; tipo: string; titulo: string; descricao: string | null;
  nicho: string | null; conteudo_preview: string | null; url_publica: string | null;
  created_at: string;
};

export default function VitrinePage() {
  const [items, setItems] = useState<VitrineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterNicho, setFilterNicho] = useState("");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");

  useEffect(() => {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    sb.from("vitrine_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => { setItems(data || []); setLoading(false); });
  }, []);

  const filtered = items
    .filter(i => filterTipo === "all" || i.tipo === filterTipo)
    .filter(i => !filterNicho || (i.nicho || "").toLowerCase().includes(filterNicho.toLowerCase()) || (i.titulo || "").toLowerCase().includes(filterNicho.toLowerCase()))
    .sort((a, b) => sort === "recent" ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const selectStyle = { background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600 as const, color: T.inkSub, fontFamily: "inherit", cursor: "pointer" };

  return (
    <div style={{ background: T.sand, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <head>
        <title>Vitrine Voku — Landing pages, posts e copies criados com IA</title>
        <meta name="description" content="Vitrine de landing pages, posts e copies criados com IA pela Voku. Inspire-se e crie o seu." />
      </head>

      {/* Header */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <div style={{ background: T.ink, color: T.lime, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 20, padding: "4px 14px", borderRadius: 6 }}>Voku</div>
          </a>
          <span style={{ color: T.borderMd, fontSize: 20 }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.inkSub }}>Vitrine de criações</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <a href="/vitrine/marketplace" style={{ fontSize: 13, fontWeight: 600, color: T.inkMid, textDecoration: "none", padding: "8px 0" }}>Marketplace</a>
          <a href="/cliente" style={{ background: T.ink, color: T.lime, padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Criar o meu →</a>
        </div>
      </div>

      <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: T.ink, margin: "0 0 10px", letterSpacing: "-0.02em" }}>Inspire-se com criações reais</h1>
          <p style={{ fontSize: 15, color: T.inkMid, margin: 0 }}>Landing pages, posts, copies e apps gerados por IA na plataforma Voku.</p>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={selectStyle}>
            <option value="all">Todos os tipos</option>
            {TIPO_OPTIONS.map(t => <option key={t} value={t}>{TYPE_BADGE[t]?.label || t}</option>)}
          </select>
          <input value={filterNicho} onChange={e => setFilterNicho(e.target.value)} placeholder="Buscar por nicho..." style={{ ...selectStyle, width: 200, fontWeight: 400 as const }} />
          <select value={sort} onChange={e => setSort(e.target.value as any)} style={selectStyle}>
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
          </select>
          {(filterTipo !== "all" || filterNicho) && (
            <button onClick={() => { setFilterTipo("all"); setFilterNicho(""); }} style={{ background: "transparent", border: "none", color: T.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Limpar</button>
          )}
        </div>

        {/* Grid masonry */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: T.inkMid }}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Nenhuma criação encontrada.</div>
            <div style={{ fontSize: 14, color: T.inkMid, marginBottom: 24 }}>Seja o primeiro a publicar!</div>
            <a href="/cliente" style={{ background: T.ink, color: T.lime, padding: "14px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>Criar agora →</a>
          </div>
        ) : (
          <div style={{ columnCount: 3, columnGap: 16, columnFill: "balance" as const }}>
            {filtered.map(item => {
              const badge = TYPE_BADGE[item.tipo] || TYPE_BADGE.copy;
              return (
                <div key={item.id} style={{ breakInside: "avoid", marginBottom: 16, background: T.white, border: `1px solid ${T.border}`, borderRadius: 18, padding: "22px 20px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: badge.bg, color: badge.color }}>{badge.label}</span>
                    {item.nicho && <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: T.sand, color: T.inkMid }}>{item.nicho}</span>}
                    <span style={{ fontSize: 10, color: T.inkFaint, marginLeft: "auto" }}>{timeAgo(item.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 8, lineHeight: 1.35 }}>{item.titulo}</div>
                  {item.conteudo_preview && (
                    <div style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.6, marginBottom: 14 }}>
                      {item.conteudo_preview.slice(0, 150)}{item.conteudo_preview.length > 150 ? "..." : ""}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: T.inkFaint, marginBottom: 14 }}>Criado com Voku</div>
                  <a
                    href={`/cliente?tipo=${item.tipo}&nicho=${encodeURIComponent(item.nicho || "")}&ref=vitrine`}
                    style={{ display: "block", background: T.ink, color: T.lime, borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}
                  >
                    Criar algo parecido →
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) { div[style*="column-count: 3"] { column-count: 2 !important; } }
        @media (max-width: 640px) { div[style*="column-count: 3"] { column-count: 1 !important; } }
      `}</style>
    </div>
  );
}
