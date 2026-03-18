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

/* ─── BROWSER MOCKUP ──────────────────────────────── */
function BrowserFrame({ url, children }: { url: string; children: any }) {
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #ddd", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
      <div style={{ background: "#f1f1f1", padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 5 }}>{["#FF5F57","#FEBC2E","#28C840"].map((c,i)=><div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }}/>)}</div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 4, padding: "3px 10px", fontSize: 11, color: "#999", fontFamily: FF, marginLeft: 8 }}>{url}</div>
      </div>
      {children}
    </div>
  );
}

/* ─── LP CAROUSEL ────────────────────────────────── */
function LPCarousel() {
  const [active, setActive] = useState(0);
  useEffect(() => { const t = setInterval(() => setActive(a => (a + 1) % 3), 4000); return () => clearInterval(t); }, []);
  const lps = [
    { url: "clinicabelavida.com.br", bg: "linear-gradient(135deg, #1a3a2a, #0d1f15)", accent: "#4ADE80", headline: "Sua pele merece cuidado profissional.", sub: "Agende sua avaliação gratuita e descubra o tratamento ideal para você.", cta: "Agendar avaliação grátis", nicho: "Clínica de Estética", logo: "Bela Vida" },
    { url: "controlefacil.app", bg: "linear-gradient(135deg, #1e1b4b, #312e81)", accent: "#818CF8", headline: "Chega de planilha. Seu financeiro no automático.", sub: "Para MEIs e autônomos que querem controle sem complicação.", cta: "Testar grátis 14 dias", nicho: "Fintech / SaaS", logo: "ControleFácil" },
    { url: "chefemcasa.com.br", bg: "linear-gradient(135deg, #451a03, #78350f)", accent: "#FB923C", headline: "Refeições saudáveis entregues na sua porta.", sub: "Cardápio semanal personalizado por nutricionista. Sem esforço, sem desperdício.", cta: "Ver cardápio da semana", nicho: "Food Delivery", logo: "Chef em Casa" },
  ];
  const lp = lps[active];
  return (
    <div>
      <BrowserFrame url={lp.url}>
        <div style={{ background: lp.bg, padding: "36px 28px 32px", transition: "all 0.5s", minHeight: 200 }}>
          <div style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, letterSpacing: 2, color: lp.accent, marginBottom: 16, opacity: 0.8 }}>{lp.logo.toUpperCase()}</div>
          <div style={{ fontFamily: FF, fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: 10, maxWidth: 340 }}>{lp.headline}</div>
          <div style={{ fontFamily: FF, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, marginBottom: 20, maxWidth: 320 }}>{lp.sub}</div>
          <div style={{ display: "inline-block", background: lp.accent, color: "#111", padding: "12px 24px", borderRadius: 8, fontFamily: FF, fontSize: 13, fontWeight: 700 }}>{lp.cta}</div>
        </div>
      </BrowserFrame>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
        {lps.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ width: active === i ? 24 : 8, height: 8, borderRadius: 4, background: active === i ? T.ink : T.borderMd, border: "none", cursor: "pointer", transition: "all 0.3s" }} />
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 6, fontFamily: FF, fontSize: 11, color: T.inkFaint }}>{lp.nicho}</div>
    </div>
  );
}

/* ─── INSTAGRAM FEED ─────────────────────────────── */
function InstaFeed() {
  const posts = [
    { bg: "linear-gradient(135deg, #065f46, #047857)", emoji: "🥗", hook: "Você sabia que 70% das pessoas desistem da dieta na semana 2?", caption: "O problema não é falta de vontade — é falta de planejamento. Vou te mostrar como manter a consistência sem sofrimento.\n\n1. Prepare as refeições no domingo\n2. Tenha 3 lanches saudáveis sempre à mão\n3. Permita 1 refeição livre por semana\n\nSalve esse post e comece hoje 👇", hashtags: "#nutrição #dietaflexível #vidasaudável #emagrecimento #dica", likes: "847", comments: "63" },
    { bg: "linear-gradient(135deg, #7c2d12, #c2410c)", emoji: "🍫", hook: "3 substitutos do açúcar que realmente funcionam", caption: "Se você acha que precisa cortar o doce pra emagrecer, leia isso:\n\n1. Xilitol — mesma doçura, metade das calorias\n2. Stevia — zero calorias, sabor neutro\n3. Eritritol — não altera glicemia\n\nQual você já testou? Me conta nos comentários!", hashtags: "#semacucar #saudavel #alimentaçãoconsciente #nutricionista", likes: "1.2k", comments: "124" },
    { bg: "linear-gradient(135deg, #1e3a5f, #2563eb)", emoji: "⏱️", hook: "5 refeições em 15 min que me salvam na correria", caption: "Não ter tempo NÃO é desculpa.\n\nOvo mexido + pão integral + abacate → 5min\nBowl de iogurte + granola + fruta → 3min\nWrap de frango + salada → 10min\nSopa de legumes (congelada) → 8min\nSmoothie proteico → 5min\n\nCompartilha com quem vive dizendo que não tem tempo 😉", hashtags: "#mealprep #refeicaorapida #fitness #praticidade", likes: "2.1k", comments: "187" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
      {posts.map((p, i) => (
        <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e5e5", background: "#fff" }}>
          <div style={{ background: p.bg, padding: "20px 14px", minHeight: 110, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{p.emoji}</div>
            <div style={{ fontFamily: FF, fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.35 }}>{p.hook}</div>
          </div>
          <div style={{ padding: "10px 12px" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
              <span style={{ fontFamily: FF, fontSize: 10, color: "#111", fontWeight: 700 }}>♡ {p.likes}</span>
              <span style={{ fontFamily: FF, fontSize: 10, color: "#888" }}>💬 {p.comments}</span>
            </div>
            <div style={{ fontFamily: FF, fontSize: 10.5, color: "#333", lineHeight: 1.5, maxHeight: 52, overflow: "hidden" }}>{p.caption.slice(0, 90)}...</div>
            <div style={{ fontFamily: FF, fontSize: 9, color: "#3b82f6", marginTop: 4 }}>{p.hashtags}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── IMC CALCULATOR ─────────────────────────────── */
function IMCCalculator() {
  const [peso, setPeso] = useState("72");
  const [altura, setAltura] = useState("175");
  const [resultado, setResultado] = useState<{imc:string;cat:string;cor:string}|null>(null);
  const calcular = () => {
    const p = parseFloat(peso); const a = parseFloat(altura) / 100;
    if (!p || !a) return;
    const imc = p / (a * a);
    const cat = imc < 18.5 ? "Abaixo do peso" : imc < 25 ? "Peso normal" : imc < 30 ? "Sobrepeso" : "Obesidade";
    const cor = imc < 18.5 ? "#3b82f6" : imc < 25 ? "#22c55e" : imc < 30 ? "#f59e0b" : "#ef4444";
    setResultado({ imc: imc.toFixed(1), cat, cor });
  };
  const inp = { fontFamily: FF, fontSize: 14, color: "#111", background: "#f8f8f8", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 14px", width: "100%", outline: "none", boxSizing: "border-box" as const };
  return (
    <BrowserFrame url="meuapp.voku.one/imc">
      <div style={{ background: "#fff", padding: "28px 24px" }}>
        <div style={{ fontFamily: FF, fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 4 }}>Calculadora de IMC</div>
        <div style={{ fontFamily: FF, fontSize: 12, color: "#888", marginBottom: 20 }}>Descubra se você está no peso ideal</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ fontFamily: FF, fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Peso (kg)</label>
            <input value={peso} onChange={e => setPeso(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{ fontFamily: FF, fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Altura (cm)</label>
            <input value={altura} onChange={e => setAltura(e.target.value)} style={inp} />
          </div>
        </div>
        <button onClick={calcular} style={{ width: "100%", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontFamily: FF, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Calcular meu IMC</button>
        {resultado && (
          <div style={{ marginTop: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px", textAlign: "center" }}>
            <div style={{ fontFamily: FF, fontSize: 36, fontWeight: 800, color: resultado.cor }}>{resultado.imc}</div>
            <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, color: resultado.cor, marginTop: 2 }}>{resultado.cat}</div>
            <div style={{ fontFamily: FF, fontSize: 11, color: "#999", marginTop: 8 }}>IMC = peso ÷ altura²</div>
          </div>
        )}
      </div>
    </BrowserFrame>
  );
}

/* ─── SHOWCASE EXAMPLES ──────────────────────────── */
const EXAMPLES = [
  {
    id: "ex-lp", tipo: "landing_page", titulo: "Landing Pages — 3 mercados diferentes",
    content: <LPCarousel />,
    badges: ["3 variações de headline", "HTML publicado", "mobile responsive"],
    nicho: "Vários", created_at: "2026-03-15",
  },
  {
    id: "ex-posts", tipo: "post", titulo: "Pack Instagram — Nutricionista",
    content: <InstaFeed />,
    badges: ["12 posts", "legendas completas", "hashtags + CTA"],
    nicho: "Nutrição", created_at: "2026-03-14",
  },
  {
    id: "ex-email", tipo: "email", titulo: "Sequência de 5 E-mails — Nutrição",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { day: "Dia 0", subject: "Seu guia chegou 🎯", desc: "Boas-vindas + entrega do lead magnet", open: "68%" },
          { day: "Dia 2", subject: "O erro que trava o emagrecimento", desc: "Conteúdo de valor — dica prática", open: "52%" },
          { day: "Dia 4", subject: "Como Ana perdeu 8kg sem academia", desc: "Prova social — história de cliente", open: "45%" },
          { day: "Dia 6", subject: "Eu sei o que está te travando", desc: "Quebra de objeção", open: "41%" },
          { day: "Dia 8", subject: "Última chance: 30% off até meia-noite", desc: "CTA direto — oferta final", open: "58%" },
        ].map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ width: 44, textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontFamily: FF, fontSize: 9, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: 1 }}>{e.day}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, color: "#111" }}>{e.subject}</div>
              <div style={{ fontFamily: FF, fontSize: 11, color: "#999", marginTop: 2 }}>{e.desc}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: FF, fontSize: 14, fontWeight: 700, color: "#22c55e" }}>{e.open}</div>
              <div style={{ fontFamily: FF, fontSize: 9, color: "#bbb" }}>abertura</div>
            </div>
          </div>
        ))}
      </div>
    ),
    badges: ["5 e-mails", "assunto + corpo completo", "sequência automática"],
    nicho: "Nutrição", created_at: "2026-03-13",
  },
  {
    id: "ex-app", tipo: "app", titulo: "Calculadora de IMC — App funcional",
    content: <IMCCalculator />,
    badges: ["HTML + JS + CSS", "publicado com URL", "100% interativo"],
    nicho: "Saúde", created_at: "2026-03-12",
  },
  {
    id: "ex-carrossel", tipo: "carrossel", titulo: "Carrossel — Marketing Digital",
    content: (
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {[
          { title: "5 erros que matam\nseu engajamento", bg: "linear-gradient(135deg, #0f172a, #1e293b)", color: "#fff", accent: "#38bdf8", isCover: true },
          { title: "Postar sem estratégia", desc: "Conteúdo aleatório não gera resultado. Tenha um calendário editorial.", bg: "#fff", color: "#111" },
          { title: "Ignorar os comentários", desc: "Engajamento é via dupla. Responda em até 1h para multiplicar o alcance.", bg: "#fff", color: "#111" },
          { title: "Não usar CTA", desc: "Cada post precisa de uma ação clara: salvar, comentar, clicar no link.", bg: "#fff", color: "#111" },
          { title: "Copiar concorrentes", desc: "Inspiração sim, cópia não. Seu público quer autenticidade.", bg: "#fff", color: "#111" },
          { title: "Salve esse post\ne compartilha!", bg: "linear-gradient(135deg, #0f172a, #1e293b)", color: "#38bdf8", isCta: true },
        ].map((s, i) => (
          <div key={i} style={{ minWidth: 140, maxWidth: 140, background: s.bg, color: s.color, borderRadius: 10, padding: s.isCover || s.isCta ? "24px 14px" : "14px", border: s.bg === "#fff" ? "1px solid #e5e5e5" : "none", flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: s.isCover || s.isCta ? "flex-end" : "flex-start", minHeight: 160 }}>
            {s.isCover && <div style={{ fontFamily: FF, fontSize: 8, fontWeight: 700, letterSpacing: 2, color: s.accent, marginBottom: 8 }}>CARROSSEL</div>}
            <div style={{ fontFamily: FF, fontSize: s.isCover || s.isCta ? 15 : 12, fontWeight: 700, lineHeight: 1.3, whiteSpace: "pre-line" }}>{s.title}</div>
            {s.desc && <div style={{ fontFamily: FF, fontSize: 10.5, color: "#888", marginTop: 6, lineHeight: 1.5 }}>{s.desc}</div>}
            {s.isCta && <div style={{ marginTop: 12, background: s.color, color: "#0f172a", borderRadius: 6, padding: "6px 12px", textAlign: "center", fontFamily: FF, fontSize: 11, fontWeight: 700 }}>Compartilhar →</div>}
          </div>
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
          <a href="/" style={{ textDecoration: "none" }}><div style={{ background: T.ink, color: "#fff", fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 20, letterSpacing: "-0.5px", padding: "4px 14px", borderRadius: 6, textTransform: "uppercase" as const }}>VOKU</div></a>
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
