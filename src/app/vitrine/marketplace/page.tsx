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
  landing_page: { label: "Landing Page", color: T.teal, bg: T.tealBg },
  copy: { label: "Copy", color: T.blue, bg: T.blueBg },
  post: { label: "Post", color: T.green, bg: T.greenBg },
  carrossel: { label: "Carrossel", color: T.purple, bg: T.purpleBg },
  email: { label: "E-mail", color: T.amber, bg: T.amberBg },
  app: { label: "App", color: "#DC2626", bg: "#FEE2E2" },
  reels: { label: "Reels", color: "#EC4899", bg: "#FCE7F3" },
};

type Template = {
  id: string; titulo: string; descricao: string; tipo: string;
  nicho: string | null; preco_creditos: number; vendas: number; created_at: string;
};

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterNicho, setFilterNicho] = useState("");
  const [sortPrice, setSortPrice] = useState<"asc" | "desc" | "none">("none");
  const [buying, setBuying] = useState<string | null>(null);
  const [boughtIds, setBoughtIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // Load templates
    sb.from("marketplace_templates")
      .select("*")
      .eq("aprovado", true)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => { setTemplates(data || []); setLoading(false); });

    // Check if logged in + load purchases
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        sb.from("marketplace_purchases")
          .select("template_id")
          .eq("buyer_user_id", data.user.id)
          .then(({ data: purchases }) => {
            if (purchases) setBoughtIds(purchases.map((p: any) => p.template_id));
          });
      }
    });
  }, []);

  const handleBuy = async (template: Template) => {
    if (!userId || buying) return;
    if (boughtIds.includes(template.id)) return;
    if (!confirm(`Comprar "${template.titulo}" por ${template.preco_creditos} créditos?`)) return;

    setBuying(template.id);
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // Check balance
    const { data: credits } = await sb.from("credits").select("balance").eq("user_id", userId).single();
    if (!credits || credits.balance < template.preco_creditos) {
      alert("Créditos insuficientes. Faça upgrade do seu plano.");
      setBuying(null);
      return;
    }

    // Deduct credits
    await sb.from("credits").update({ balance: credits.balance - template.preco_creditos }).eq("user_id", userId);
    await sb.from("credit_transactions").insert({
      user_id: userId, amount: -template.preco_creditos, type: "debit",
      description: `Compra de template: ${template.titulo}`,
    });

    // Record purchase
    await sb.from("marketplace_purchases").insert({
      buyer_user_id: userId, template_id: template.id, preco_creditos: template.preco_creditos,
    });

    // Increment vendas
    await sb.from("marketplace_templates").update({ vendas: (template.vendas || 0) + 1 }).eq("id", template.id);

    setBoughtIds(prev => [...prev, template.id]);
    setBuying(null);
  };

  const filtered = templates
    .filter(t => filterTipo === "all" || t.tipo === filterTipo)
    .filter(t => !filterNicho || (t.nicho || "").toLowerCase().includes(filterNicho.toLowerCase()) || t.titulo.toLowerCase().includes(filterNicho.toLowerCase()))
    .sort((a, b) => {
      if (sortPrice === "asc") return a.preco_creditos - b.preco_creditos;
      if (sortPrice === "desc") return b.preco_creditos - a.preco_creditos;
      return 0;
    });

  const selectStyle = { background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600 as const, color: T.inkSub, fontFamily: "inherit", cursor: "pointer" };

  return (
    <div style={{ background: T.sand, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <div style={{ background: T.ink, color: T.lime, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 20, padding: "4px 14px", borderRadius: 6 }}>Voku</div>
          </a>
          <span style={{ color: T.borderMd, fontSize: 20 }}>|</span>
          <a href="/vitrine" style={{ fontSize: 13, fontWeight: 600, color: T.inkMid, textDecoration: "none" }}>Vitrine</a>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.inkSub }}>Marketplace</span>
        </div>
        <a href="/cliente" style={{ background: T.ink, color: T.lime, padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Criar o meu →</a>
      </div>

      <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: T.ink, margin: "0 0 10px", letterSpacing: "-0.02em" }}>Marketplace de Templates</h1>
          <p style={{ fontSize: 15, color: T.inkMid, margin: 0 }}>Templates prontos criados pela comunidade Voku. Compre com créditos e customize.</p>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={selectStyle}>
            <option value="all">Todos os tipos</option>
            {Object.entries(TYPE_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <input value={filterNicho} onChange={e => setFilterNicho(e.target.value)} placeholder="Buscar por nicho..." style={{ ...selectStyle, width: 200, fontWeight: 400 as const }} />
          <select value={sortPrice} onChange={e => setSortPrice(e.target.value as any)} style={selectStyle}>
            <option value="none">Ordenar por preço</option>
            <option value="asc">Menor preço</option>
            <option value="desc">Maior preço</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: T.inkMid }}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Nenhum template disponível ainda.</div>
            <div style={{ fontSize: 14, color: T.inkMid }}>Volte em breve!</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {filtered.map(t => {
              const badge = TYPE_BADGE[t.tipo] || TYPE_BADGE.copy;
              const bought = boughtIds.includes(t.id);
              return (
                <div key={t.id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 18, padding: "24px 22px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: badge.bg, color: badge.color }}>{badge.label}</span>
                    {t.nicho && <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: T.sand, color: T.inkMid }}>{t.nicho}</span>}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: T.ink, marginBottom: 8, lineHeight: 1.3 }}>{t.titulo}</div>
                  <div style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.6, marginBottom: 16, flex: 1 }}>
                    {t.descricao.slice(0, 140)}{t.descricao.length > 140 ? "..." : ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>{t.preco_creditos}</span>
                      <span style={{ fontSize: 12, color: T.inkFaint, marginLeft: 4 }}>créditos</span>
                    </div>
                    {t.vendas > 0 && <span style={{ fontSize: 11, color: T.inkFaint }}>{t.vendas} venda{t.vendas > 1 ? "s" : ""}</span>}
                  </div>
                  {bought ? (
                    <div style={{ background: T.greenBg, color: T.green, borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 700, textAlign: "center" }}>
                      ✓ Comprado
                    </div>
                  ) : (
                    <button onClick={() => handleBuy(t)} disabled={buying === t.id || !userId} style={{
                      width: "100%", background: userId ? T.ink : T.borderMd, color: userId ? T.lime : T.inkFaint,
                      border: "none", borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 700,
                      cursor: userId ? "pointer" : "not-allowed", fontFamily: "inherit",
                    }}>
                      {buying === t.id ? "Comprando..." : !userId ? "Faça login para comprar" : `Comprar por ${t.preco_creditos} créditos`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
