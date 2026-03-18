"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const FF = "'Plus Jakarta Sans', sans-serif";
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

const TIPO_OPTIONS = ["landing_page", "copy", "post", "carrossel", "email", "app", "reels"];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `${days} dias atrás`;
  return `${Math.floor(days / 30)} meses atrás`;
}

/* ─── SHOWCASE EXAMPLES ──────────────────────────── */
const EXAMPLES = [
  {
    id: "ex-lp", tipo: "landing_page", titulo: "Landing Page — Clínica de Estética",
    content: (
      <div>
        <div style={{ background: T.ink, borderRadius: "12px 12px 0 0", padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
          {[T.inkFaint, T.inkFaint, T.inkFaint].map((c, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.4 }} />)}
          <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 4, padding: "3px 8px", fontSize: 10, color: "#888", fontFamily: FF, marginLeft: 8 }}>voku.one/lp/nutri-pro</div>
        </div>
        <div style={{ background: "#fff", padding: 20, borderRadius: "0 0 12px 12px", border: `1px solid ${T.border}`, borderTop: "none" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.ink, marginBottom: 6, fontFamily: FF, lineHeight: 1.2 }}>Chega de planilha. Seu financeiro no automático.</div>
          <div style={{ fontSize: 13, color: T.inkMid, marginBottom: 14, fontFamily: FF }}>Para MEIs e autônomos que querem controle sem complicação.</div>
          <div style={{ display: "inline-block", background: T.lime, color: T.ink, padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: FF }}>Testar grátis 14 dias</div>
        </div>
      </div>
    ),
    badges: ["3 variações de headline", "HTML publicado", "mobile responsive"],
    nicho: "Fintech / MEI", created_at: "2026-03-15",
  },
  {
    id: "ex-posts", tipo: "post", titulo: "Pack Instagram — Nutricionista",
    content: (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {[
          { hook: "Você sabia que 70% das pessoas desistem da dieta na semana 2? Aqui está o motivo.", tags: "#nutrição #dieta #saúde" },
          { hook: "3 substitutos do açúcar que realmente funcionam (o terceiro vai te surpreender)", tags: "#saudavel #alimentação" },
          { hook: "5 refeições que preparo em 15 min e me mantêm na dieta", tags: "#mealprep #fitness" },
        ].map((p, i) => (
          <div key={i} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.ink, lineHeight: 1.4, fontFamily: FF }}>{p.hook}</div>
            <div style={{ fontSize: 9, color: T.teal, fontFamily: FF }}>{p.tags}</div>
          </div>
        ))}
      </div>
    ),
    badges: ["12 posts", "legendas + hashtags", "CTA incluso"],
    nicho: "Nutrição", created_at: "2026-03-14",
  },
  {
    id: "ex-email", tipo: "email", titulo: "Sequência de 5 E-mails — Nutrição",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { day: "Dia 0", subject: "Seu guia chegou", open: "68%" },
          { day: "Dia 2", subject: "O erro que trava o emagrecimento", open: "52%" },
          { day: "Dia 4", subject: "Como Ana perdeu 8kg sem academia", open: "45%" },
          { day: "Dia 6", subject: "Eu sei o que está te travando", open: "41%" },
          { day: "Dia 8", subject: "Última chance: 30% off até meia-noite", open: "58%" },
        ].map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.teal, fontFamily: FF, width: 40, flexShrink: 0 }}>{e.day}</div>
            <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.ink, fontFamily: FF }}>{e.subject}</div>
            <div style={{ fontSize: 10, color: T.inkFaint, fontFamily: FF }}>~{e.open}</div>
          </div>
        ))}
      </div>
    ),
    badges: ["5 e-mails", "assunto + corpo completo", "sequência automática"],
    nicho: "Nutrição", created_at: "2026-03-13",
  },
  {
    id: "ex-app", tipo: "app", titulo: "Calculadora de IMC Personalizada",
    content: (
      <div>
        <div style={{ background: T.ink, borderRadius: "12px 12px 0 0", padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
          {[T.inkFaint, T.inkFaint, T.inkFaint].map((c, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.4 }} />)}
          <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 4, padding: "3px 8px", fontSize: 10, color: "#888", fontFamily: FF, marginLeft: 8 }}>voku.one/app/imc-pro</div>
        </div>
        <div style={{ background: "#fff", padding: 16, borderRadius: "0 0 12px 12px", border: `1px solid ${T.border}`, borderTop: "none" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 10, fontFamily: FF }}>Calculadora de IMC</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, background: T.sand, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: T.inkFaint, fontFamily: FF }}>Peso (kg)</div>
            <div style={{ flex: 1, background: T.sand, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: T.inkFaint, fontFamily: FF }}>Altura (cm)</div>
          </div>
          <div style={{ background: T.lime, color: T.ink, borderRadius: 6, padding: "8px", textAlign: "center", fontSize: 12, fontWeight: 700, fontFamily: FF }}>Calcular IMC</div>
        </div>
      </div>
    ),
    badges: ["HTML + JS + CSS", "publicado com URL", "100% client-side"],
    nicho: "Saúde", created_at: "2026-03-12",
  },
  {
    id: "ex-carrossel", tipo: "carrossel", titulo: "Carrossel — Marketing Digital",
    content: (
      <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {["CAPA: 5 erros que matam seu engajamento", "Slide 1: Postar sem estratégia", "Slide 2: Ignorar os comentários", "Slide 3: Não usar CTA", "Slide 4: Copiar concorrentes", "CTA: Salve para não esquecer"].map((s, i) => (
          <div key={i} style={{ minWidth: 100, background: i === 0 ? T.ink : "#fff", color: i === 0 ? T.lime : T.ink, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 8px", fontSize: 10, fontWeight: i === 0 ? 700 : 500, fontFamily: FF, lineHeight: 1.4, flexShrink: 0 }}>{s}</div>
        ))}
      </div>
    ),
    badges: ["7 slides", "3 ângulos diferentes", "copy completa por slide"],
    nicho: "Marketing", created_at: "2026-03-11",
  },
];

type VitrineItem = {
  id: string; tipo: string; titulo: string; descricao: string | null;
  nicho: string | null; conteudo_preview: string | null; created_at: string;
};

export default function VitrinePage() {
  const [dbItems, setDbItems] = useState<VitrineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterNicho, setFilterNicho] = useState("");

  useEffect(() => {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    sb.from("vitrine_items").select("*").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => { setDbItems(data || []); setLoading(false); });
  }, []);

  const selectStyle: any = { background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.inkSub, fontFamily: FF, cursor: "pointer" };

  // Filter examples
  const filteredExamples = EXAMPLES
    .filter(e => filterTipo === "all" || e.tipo === filterTipo)
    .filter(e => !filterNicho || (e.nicho || "").toLowerCase().includes(filterNicho.toLowerCase()));

  return (
    <div style={{ background: T.sand, minHeight: "100vh", fontFamily: FF }}>
      <head><title>Vitrine Voku — Exemplos de marketing criado com IA</title></head>

      {/* Header */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ textDecoration: "none" }}><div style={{ background: T.ink, color: T.lime, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 20, padding: "4px 14px", borderRadius: 6 }}>Voku</div></a>
          <span style={{ color: T.borderMd, fontSize: 20 }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.inkSub }}>Vitrine de criações</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <a href="/vitrine/marketplace" style={{ fontSize: 13, fontWeight: 600, color: T.inkMid, textDecoration: "none" }}>Marketplace</a>
          <a href="/cliente" style={{ background: T.ink, color: T.lime, padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Criar o meu →</a>
        </div>
      </div>

      <div style={{ padding: "48px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: T.ink, margin: "0 0 10px", letterSpacing: "-0.02em" }}>Veja como ficam as entregas</h1>
          <p style={{ fontSize: 15, color: T.inkMid, margin: 0 }}>Exemplos reais de landing pages, posts, e-mails, apps e copies criados com IA na Voku.</p>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 10, marginBottom: 36, flexWrap: "wrap", alignItems: "center" }}>
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={selectStyle}>
            <option value="all">Todos os tipos</option>
            {TIPO_OPTIONS.map(t => <option key={t} value={t}>{TYPE_BADGE[t]?.label || t}</option>)}
          </select>
          <input value={filterNicho} onChange={e => setFilterNicho(e.target.value)} placeholder="Buscar por nicho..." style={{ ...selectStyle, width: 200, fontWeight: 400 }} />
          {(filterTipo !== "all" || filterNicho) && (
            <button onClick={() => { setFilterTipo("all"); setFilterNicho(""); }} style={{ background: "transparent", border: "none", color: T.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>Limpar</button>
          )}
        </div>

        {/* Showcase examples */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {filteredExamples.map(ex => {
            const badge = TYPE_BADGE[ex.tipo] || TYPE_BADGE.copy;
            return (
              <div key={ex.id}>
                {/* Category label */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: badge.bg, color: badge.color, letterSpacing: 1, textTransform: "uppercase" }}>{badge.label}</span>
                  {ex.nicho && <span style={{ fontSize: 11, color: T.inkFaint }}>· {ex.nicho}</span>}
                  <span style={{ fontSize: 11, color: T.inkFaint, marginLeft: "auto" }}>{timeAgo(ex.created_at)}</span>
                </div>

                {/* Card */}
                <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 16, fontFamily: FF }}>{ex.titulo}</div>
                    {ex.content}
                  </div>
                  <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {ex.badges.map(b => (
                      <span key={b} style={{ background: T.ink, color: T.lime, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: FF }}>{b.toUpperCase()}</span>
                    ))}
                    <a href="/cliente" style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: T.teal, textDecoration: "none", fontFamily: FF }}>Criar algo parecido →</a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DB items */}
        {!loading && dbItems.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ height: 1, flex: 1, background: T.border }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: T.inkFaint, letterSpacing: 2, textTransform: "uppercase" }}>Criações da comunidade</span>
              <div style={{ height: 1, flex: 1, background: T.border }} />
            </div>
            <div style={{ columnCount: 3, columnGap: 16 }}>
              {dbItems.map(item => {
                const b = TYPE_BADGE[item.tipo] || TYPE_BADGE.copy;
                return (
                  <div key={item.id} style={{ breakInside: "avoid", marginBottom: 16, background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: b.bg, color: b.color }}>{b.label}</span>
                      <span style={{ fontSize: 10, color: T.inkFaint, marginLeft: "auto" }}>{timeAgo(item.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 6, fontFamily: FF }}>{item.titulo}</div>
                    {item.conteudo_preview && <div style={{ fontSize: 12, color: T.inkMid, lineHeight: 1.5, marginBottom: 10, fontFamily: FF }}>{item.conteudo_preview.slice(0, 120)}...</div>}
                    <div style={{ fontSize: 10, color: T.inkFaint, fontFamily: FF }}>Criado com Voku</div>
                  </div>
                );
              })}
            </div>
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
