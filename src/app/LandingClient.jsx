"use client";
import { useState, useEffect, useRef } from "react";

const FF = "'Inter', sans-serif";

/* ─── COPY (trilingual) ─── */
const T = {
  PT: {
    nav: ["Serviços", "Processo", "Sobre"],
    navCta: "Começar projeto",
    hero: { eyebrow: "Estúdio de Mídia · IA", sub: "Pacotes fixos. Preço visível. Entrega em até 48h. Sem reunião, sem proposta, sem surpresa." },
    ticker: "Landing Page Copy · $100 · 24h · Social Media Pack · $140 · 48h · Email Nurture · $195 · 48h · Sem reunião · Revisão inclusa",
    portfolio: {
      label: "PORTFÓLIO",
      title: "Você já viu esse tipo de conteúdo por aí.",
      sub: "Posts, copy e e-mails com identidade visual real da sua marca.",
      tabs: ["Wellness & Beleza", "Agronegócio", "Tech & Serviços"],
      caption1: "Wellness & Beleza · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption1b: "Entrega completa em 48h",
      caption2: "Agronegócio · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption2b: "Entrega completa em 48h",
      caption3: "Tech & Serviços · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption3b: "Entrega completa em 48h",
    },
    products: {
      label: "PRODUTOS",
      title: "O que entregamos.",
      badge: "Mais pedido",
      items: [
        { num: "01", name: "Landing Page Copy", tagline: "Do briefing à URL publicada.", price: "$100", time: "24h", features: ["Headline + subheadline", "Seção de dor + benefícios", "Prova social estruturada", "CTA principal + secundário", "1 revisão inclusa"] },
        { num: "02", name: "Social Media Pack", tagline: "12 posts prontos para publicar.", price: "$140", time: "48h", features: ["12 posts (carrossel + estático + reels)", "Gancho + desenvolvimento + CTA", "Hashtags estratégicas (9/post)", "Sugestão visual por post", "3 opções de tom", "1 revisão inclusa"], highlight: true },
        { num: "03", name: "Email Nurture", tagline: "5 e-mails do dia 0 ao dia 8.", price: "$195", time: "48h", features: ["5 e-mails completos", "Assunto + pré-header + corpo", "Sequência lógica de nutrição", "CTAs otimizados", "1 revisão inclusa"] },
      ],
    },
    process: {
      label: "PROCESSO",
      title: "Do zero ao pronto.",
      sub: "Sem formulário longo. Sem reunião. Conversa direta com IA que já conhece sua marca.",
      steps: [
        { n: "01", t: "Cole o @ ou o link", d: "Nossa IA já conhece sua marca antes de começar." },
        { n: "02", t: "2 perguntas. Briefing feito.", d: "Nada de formulário longo. Conversa direta, contexto completo." },
        { n: "03", t: "Receba as opções", d: "Você escolhe, tica e aprova — não recebe arquivo final sem ver antes." },
        { n: "04", t: "Aprovado. Entregue.", d: "Download do arquivo final. Pronto para publicar." },
      ],
    },
    guarantee: { label: "GARANTIA", title: "Não gostou? Refazemos.", body: "Cada projeto inclui revisão por padrão. Se o resultado não atende, refazemos sem custo extra e sem questionamento.", cta: "Começar projeto →" },
    footer: {
      desc: "Estúdio de mídia com IA. Conteúdo profissional para marcas que não podem esperar.",
      col2label: "PRODUTOS", col2: ["Landing Page Copy", "Social Media Pack", "Email Nurture"],
      col3label: "ESTÚDIO", col3: ["Como funciona", "Área do Cliente", "Workana · Fiverr"],
      bottom1: "Voku LLC · Wyoming, USA", bottom2: "voku.one · © 2026",
    },
  },
  EN: {
    nav: ["Services", "Process", "About"],
    navCta: "Start project",
    hero: { eyebrow: "Media Studio · AI", sub: "Fixed packages. Visible pricing. Delivery in 48h. No meetings, no proposals, no surprises." },
    ticker: "Landing Page Copy · $100 · 24h · Social Media Pack · $140 · 48h · Email Nurture · $195 · 48h · No meetings · Revision included",
    portfolio: {
      label: "PORTFOLIO",
      title: "You've seen this kind of content before.",
      sub: "Posts, copy and emails with your brand's real visual identity.",
      tabs: ["Wellness & Beauty", "Agribusiness", "Tech & Services"],
      caption1: "Wellness & Beauty · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption1b: "Full delivery in 48h",
      caption2: "Agribusiness · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption2b: "Full delivery in 48h",
      caption3: "Tech & Services · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption3b: "Full delivery in 48h",
    },
    products: {
      label: "PRODUCTS",
      title: "What we deliver.",
      badge: "Most requested",
      items: [
        { num: "01", name: "Landing Page Copy", tagline: "From briefing to published URL.", price: "$100", time: "24h", features: ["Headline + subheadline", "Pain + benefits section", "Structured social proof", "Primary + secondary CTA", "1 revision included"] },
        { num: "02", name: "Social Media Pack", tagline: "12 posts ready to publish.", price: "$140", time: "48h", features: ["12 posts (carousel + static + reels)", "Hook + body + CTA", "Strategic hashtags (9/post)", "Visual suggestion per post", "3 tone options", "1 revision included"], highlight: true },
        { num: "03", name: "Email Nurture", tagline: "5 emails from day 0 to day 8.", price: "$195", time: "48h", features: ["5 complete emails", "Subject + pre-header + body", "Logical nurture sequence", "Optimized CTAs", "1 revision included"] },
      ],
    },
    process: {
      label: "PROCESS",
      title: "From zero to done.",
      sub: "No long forms. No meetings. Direct conversation with AI that already knows your brand.",
      steps: [
        { n: "01", t: "Paste your @ or link", d: "Our AI already knows your brand before you start." },
        { n: "02", t: "2 questions. Brief done.", d: "No long forms. Direct conversation, complete context." },
        { n: "03", t: "Receive the options", d: "You choose, check and approve — no final file without your review." },
        { n: "04", t: "Approved. Delivered.", d: "Download the final file. Ready to publish." },
      ],
    },
    guarantee: { label: "GUARANTEE", title: "Don't like it? We redo it.", body: "Every project includes revision by default. If the result doesn't meet expectations, we redo it at no extra cost.", cta: "Start project →" },
    footer: {
      desc: "AI-powered media studio. Professional content for brands that can't wait.",
      col2label: "PRODUCTS", col2: ["Landing Page Copy", "Social Media Pack", "Email Nurture"],
      col3label: "STUDIO", col3: ["How it works", "Client Area", "Workana · Fiverr"],
      bottom1: "Voku LLC · Wyoming, USA", bottom2: "voku.one · © 2026",
    },
  },
  ES: {
    nav: ["Servicios", "Proceso", "Acerca"],
    navCta: "Empezar proyecto",
    hero: { eyebrow: "Estudio de Medios · IA", sub: "Paquetes fijos. Precio visible. Entrega en 48h. Sin reuniones, sin propuestas, sin sorpresas." },
    ticker: "Landing Page Copy · $100 · 24h · Social Media Pack · $140 · 48h · Email Nurture · $195 · 48h · Sin reuniones · Revisión incluida",
    portfolio: {
      label: "PORTAFOLIO",
      title: "Ya viste este tipo de contenido por ahí.",
      sub: "Posts, copy y emails con la identidad visual real de tu marca.",
      tabs: ["Wellness & Belleza", "Agronegocio", "Tech & Servicios"],
      caption1: "Wellness & Belleza · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption1b: "Entrega completa en 48h",
      caption2: "Agronegocio · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption2b: "Entrega completa en 48h",
      caption3: "Tech & Servicios · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption3b: "Entrega completa en 48h",
    },
    products: {
      label: "PRODUCTOS",
      title: "Lo que entregamos.",
      badge: "Más pedido",
      items: [
        { num: "01", name: "Landing Page Copy", tagline: "Del briefing a la URL publicada.", price: "$100", time: "24h", features: ["Headline + subheadline", "Sección de dolor + beneficios", "Prueba social estructurada", "CTA principal + secundario", "1 revisión incluida"] },
        { num: "02", name: "Social Media Pack", tagline: "12 posts listos para publicar.", price: "$140", time: "48h", features: ["12 posts (carrusel + estático + reels)", "Gancho + desarrollo + CTA", "Hashtags estratégicos (9/post)", "Sugerencia visual por post", "3 opciones de tono", "1 revisión incluida"], highlight: true },
        { num: "03", name: "Email Nurture", tagline: "5 emails del día 0 al día 8.", price: "$195", time: "48h", features: ["5 emails completos", "Asunto + pre-header + cuerpo", "Secuencia lógica de nutrición", "CTAs optimizados", "1 revisión incluida"] },
      ],
    },
    process: {
      label: "PROCESO",
      title: "De cero a listo.",
      sub: "Sin formularios largos. Sin reuniones. Conversación directa con IA que ya conoce tu marca.",
      steps: [
        { n: "01", t: "Pega tu @ o link", d: "Nuestra IA ya conoce tu marca antes de empezar." },
        { n: "02", t: "2 preguntas. Brief listo.", d: "Nada de formularios largos. Conversación directa, contexto completo." },
        { n: "03", t: "Recibe las opciones", d: "Eliges, revisas y apruebas — no recibes archivo final sin verlo antes." },
        { n: "04", t: "Aprobado. Entregado.", d: "Descarga del archivo final. Listo para publicar." },
      ],
    },
    guarantee: { label: "GARANTÍA", title: "¿No te gustó? Lo rehacemos.", body: "Cada proyecto incluye revisión por defecto. Si el resultado no cumple, lo rehacemos sin costo extra.", cta: "Empezar proyecto →" },
    footer: {
      desc: "Estudio de medios con IA. Contenido profesional para marcas que no pueden esperar.",
      col2label: "PRODUCTOS", col2: ["Landing Page Copy", "Social Media Pack", "Email Nurture"],
      col3label: "ESTUDIO", col3: ["Cómo funciona", "Área del Cliente", "Workana · Fiverr"],
      bottom1: "Voku LLC · Wyoming, USA", bottom2: "voku.one · © 2026",
    },
  },
};

/* ─── Portfolio data ─── */
const STORAGE = "https://movfynswogmookzcjijt.supabase.co/storage/v1/object/public/imagens/portfolio";
const IMG = {
  skincare: `${STORAGE}/skincare-01.png`,
  wellness: `${STORAGE}/wellness-02.png`,
  drink: `${STORAGE}/drink-03.png`,
  agro: `${STORAGE}/agro-04.png`,
  tech: `${STORAGE}/tech-05.png`,
  product: `${STORAGE}/product-06.png`,
};

const TABS_DATA = [
  {
    accent: "#B06080", accentBg: "#3D1A24", dark: "#3D1A24",
    row1: [
      { type: "photo", src: IMG.skincare, span: 2, pill: "Conversão", pillBg: "#AAFF00", pillColor: "#111", tag: "Post Estático · Instagram", copy: "Sua pele merece ingredientes reais." },
      { type: "card", bg: "#3D1A24", label: "02 — Carrossel", headline: "5 erros que você comete na sua rotina de beleza.", accentWord: "Slide 1 →", accentColor: "#FFB3C6", progress: 5, progressColor: "#FFB3C6", tags: ["#skincare", "#beautycare", "#dicas"], tagColor: "#2a1018" },
      { type: "photo", src: IMG.drink, span: 1, pill: "Educação", pillBg: "#fff", pillColor: "#111", tag: "Reel · 30s", copy: "O que eu tomo toda manhã pra ter essa energia." },
    ],
    row2: [
      { type: "lp", bg: "#F5F0E8", label: "Landing Page Copy · 24h", hook: "Sua pele merece ingredientes que você consegue pronunciar.", body: "Fórmulas limpas, aprovadas por dermatologistas, com resultados visíveis em 14 dias.", bullets: ["Ingredientes 100% naturais", "Resultados em 14 dias", "Frete grátis acima de R$99"], accent: "#B06080", ctaText: "Quero pele saudável →" },
      { type: "photo", src: IMG.wellness, span: 1, pill: "Bastidores", pillBg: "#fff", pillColor: "#111", tag: "Story · Série", copy: "Como nasce cada fórmula." },
      { type: "email", bg: "#fff", label: "E-mail 1 · Dia 0 · Email Nurture", subject: "Você se inscreveu por um motivo. Vamos cuidar disso juntos.", body: "Bem-vinda à comunidade de quem cuida da pele de verdade.", bullets: ["Rotina personalizada em 3 passos", "Desconto de boas-vindas: 15%", "Acesso ao grupo exclusivo"], accent: "#B06080", ctaText: "Começar minha rotina →", footer: "Studio Marca · Cancelar inscrição" },
    ],
  },
  {
    accent: "#ED1C24", accentBg: "#0A1628", dark: "#0A1628",
    row1: [
      { type: "photo", src: IMG.agro, span: 2, pill: "Conversão", pillBg: "#ED1C24", pillColor: "#fff", tag: "Post Estático · Instagram", copy: "Rebanho que produz mais. Investimento que retorna mais rápido." },
      { type: "card", bg: "#0A1628", label: "02 — Dados", headline: "Genética de elite não é luxo.", accentWord: "É lucro.", accentColor: "#ED1C24", stats: [{ n: "+15%", l: "produção" }, { n: "-20%", l: "custo" }, { n: "1ª", l: "geração" }], statsColor: "#ED1C24" },
      { type: "photo", src: IMG.tech, span: 1, pill: "Educação", pillBg: "#fff", pillColor: "#111", tag: "Carrossel · 7 slides", copy: "Os 5 indicadores que todo pecuarista deveria acompanhar." },
    ],
    row2: [
      { type: "lp", bg: "#0A1628", color: "#fff", label: "Landing Page Copy · 24h", labelColor: "#345", hook: "Genética comprovada. Resultados mensuráveis desde a primeira geração.", hookColor: "#fff", body: "Touros testados, dados reais, suporte técnico dedicado.", bodyColor: "#789", bullets: ["Genealogias 100% rastreáveis", "ROI comprovado: +R$8-12 mil/vaca/ano", "Consultoria personalizada inclusa"], accent: "#ED1C24", ctaText: "Conhecer touros →", ctaBg: "#ED1C24", ctaColor: "#fff" },
      { type: "photo", src: IMG.product, span: 1, pill: "Bastidores", pillBg: "#fff", pillColor: "#111", tag: "Story · Bastidores", copy: "Por dentro da certificação." },
      { type: "email", bg: "#0d1f38", color: "#fff", label: "E-mail 1 · Dia 0 · Email Nurture", labelColor: "#345", subject: "Você pediu. A genética que transforma rebanhos está aqui.", subjectColor: "#fff", body: "Bem-vindo ao programa de genética de elite.", bodyColor: "#678", bullets: ["Catálogo completo de touros", "Consultoria gratuita agendada", "Cases de produtores parceiros"], accent: "#ED1C24", ctaText: "Ver catálogo →", ctaBg: "#ED1C24", ctaColor: "#fff", footer: "Select Sires · Cancelar inscrição", footerColor: "#234" },
    ],
    captionBg: "#060E1A", captionColor: "#345",
  },
  {
    accent: "#4FC3F7", accentBg: "#0F1B2D", dark: "#0F1B2D",
    row1: [
      { type: "photo", src: IMG.tech, span: 2, pill: "Educação", pillBg: "#4FC3F7", pillColor: "#0F1B2D", tag: "Post Estático · LinkedIn", copy: "Como a sua equipe pode entregar 3x mais sem trabalhar mais horas." },
      { type: "card", bg: "#0F1B2D", label: "02 — Insight", headline: "Seu time é bom.", accentWord: "A comunicação é o gargalo.", accentColor: "#4FC3F7" },
      { type: "photo", src: IMG.skincare, span: 1, pill: "Prova Social", pillBg: "#fff", pillColor: "#111", tag: "Reel · 60s", copy: "3 ferramentas que mudaram nossa produtividade." },
    ],
    row2: [
      { type: "lp", bg: "#0F1B2D", color: "#fff", label: "Landing Page Copy · 24h", labelColor: "#345", hook: "Sua equipe merece ferramentas que funcionam juntas.", hookColor: "#fff", body: "Integrações inteligentes, automação sem código, resultados em semanas.", bodyColor: "#789", bullets: ["Setup em 5 dias úteis", "Integração com 50+ ferramentas", "Suporte dedicado por 30 dias"], accent: "#4FC3F7", ctaText: "Agendar demo →", ctaBg: "#4FC3F7", ctaColor: "#0F1B2D" },
      { type: "photo", src: IMG.wellness, span: 1, pill: "Bastidores", pillBg: "#fff", pillColor: "#111", tag: "Story · Série", copy: "Um dia na nossa sprint." },
      { type: "email", bg: "#0A1221", color: "#fff", label: "E-mail 1 · Dia 0 · Email Nurture", labelColor: "#234", subject: "Você pediu. A automação que liberta sua equipe começa aqui.", subjectColor: "#fff", body: "Bem-vindo ao programa de produtividade inteligente.", bodyColor: "#567", bullets: ["Diagnóstico gratuito de processos", "Roadmap personalizado", "Acesso antecipado a features"], accent: "#4FC3F7", ctaText: "Ver diagnóstico →", ctaBg: "#4FC3F7", ctaColor: "#0F1B2D", footer: "TechCorp · Cancelar inscrição", footerColor: "#234" },
    ],
    captionBg: "#060E1A", captionColor: "#345",
  },
];

/* ─── Hooks ─── */
function useReveal(delay = 0) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTimeout(() => setVis(true), delay); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return [ref, vis];
}

/* ─── Sub-components ─── */

function PhotoCell({ item, height }) {
  return (
    <div style={{ position: "relative", gridColumn: item.span === 2 ? "span 2" : "span 1", height, overflow: "hidden", borderRadius: 2 }}>
      <img src={item.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
      {item.pill && <div style={{ position: "absolute", top: 12, left: 12, background: item.pillBg, color: item.pillColor, fontSize: 8, fontWeight: 700, letterSpacing: 2, padding: "4px 10px", textTransform: "uppercase" }}>{item.pill}</div>}
      <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
        <div style={{ fontSize: 7, fontWeight: 600, letterSpacing: 2, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 6 }}>{item.tag}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>{item.copy}</div>
      </div>
    </div>
  );
}

function CardCell({ item }) {
  return (
    <div style={{ background: item.bg, padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: 2 }}>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2, color: "#444", textTransform: "uppercase", marginBottom: 16 }}>{item.label}</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1.3, marginBottom: 16 }}>
          {item.headline}
          {item.accentWord && <><br /><span style={{ color: item.accentColor }}>{item.accentWord}</span></>}
        </div>
        {item.progress && (
          <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
            {Array.from({ length: item.progress }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i === 0 ? item.progressColor : "rgba(255,255,255,0.1)" }} />
            ))}
          </div>
        )}
        {item.stats && (
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            {item.stats.map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: item.statsColor }}>{s.n}</div>
                <div style={{ fontSize: 9, color: "#888" }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}
        {item.tags && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {item.tags.map((tag, i) => <span key={i} style={{ fontSize: 9, color: item.tagColor, fontWeight: 600 }}>{tag}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

function LPCell({ item }) {
  return (
    <div style={{ background: item.bg, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: 2 }}>
      <div>
        <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: item.labelColor || "#BBB", textTransform: "uppercase", marginBottom: 12 }}>{item.label}</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: item.hookColor || "#111", lineHeight: 1.3, marginBottom: 12 }}>{item.hook}</div>
        <div style={{ fontSize: 12, color: item.bodyColor || "#666", lineHeight: 1.7, marginBottom: 16 }}>{item.body}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {item.bullets.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11, color: item.bodyColor || "#666" }}>
              <span style={{ color: item.accent, fontWeight: 700 }}>→</span>{b}
            </div>
          ))}
        </div>
      </div>
      <button style={{ background: item.ctaBg || item.accent, color: item.ctaColor || "#fff", border: "none", padding: "10px 20px", fontSize: 11, fontWeight: 700, fontFamily: FF, cursor: "pointer" }}>{item.ctaText}</button>
    </div>
  );
}

function EmailCell({ item }) {
  return (
    <div style={{ background: item.bg, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: 2 }}>
      <div>
        <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: item.labelColor || "#CCC", textTransform: "uppercase", marginBottom: 12 }}>{item.label}</div>
        <div style={{ fontSize: 15, fontWeight: 900, color: item.subjectColor || "#111", lineHeight: 1.3, marginBottom: 12 }}>{item.subject}</div>
        <div style={{ fontSize: 11, color: item.bodyColor || "#888", lineHeight: 1.7, marginBottom: 16 }}>{item.body}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {item.bullets.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11, color: item.bodyColor || "#888" }}>
              <span style={{ color: item.accent, fontWeight: 700 }}>→</span>{b}
            </div>
          ))}
        </div>
      </div>
      <div>
        <button style={{ background: item.ctaBg || item.accent, color: item.ctaColor || "#fff", border: "none", padding: "10px 20px", fontSize: 11, fontWeight: 700, fontFamily: FF, cursor: "pointer", marginBottom: 12, width: "100%" }}>{item.ctaText}</button>
        {item.footer && <div style={{ fontSize: 9, color: item.footerColor || "#aaa", textAlign: "center", paddingTop: 8, borderTop: `1px solid ${item.footerColor || "rgba(0,0,0,0.1)"}` }}>{item.footer}</div>}
      </div>
    </div>
  );
}

function PortfolioGrid({ tab, caption, captionB }) {
  const data = TABS_DATA[tab];
  if (!data) return null;
  return (
    <div>
      {/* Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 2, marginBottom: 2 }}>
        {data.row1.map((item, i) => {
          if (item.type === "photo") return <PhotoCell key={i} item={item} height={420} />;
          if (item.type === "card") return <CardCell key={i} item={item} />;
          return null;
        })}
      </div>
      {/* Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, marginBottom: 2 }}>
        {data.row2.map((item, i) => {
          if (item.type === "photo") return <PhotoCell key={i} item={item} height={340} />;
          if (item.type === "lp") return <LPCell key={i} item={item} />;
          if (item.type === "email") return <EmailCell key={i} item={item} />;
          return null;
        })}
      </div>
      {/* Caption */}
      <div style={{ background: data.captionBg || "#F5F0E8", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: data.captionColor || "#888" }}>{caption}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: data.captionColor || "#888" }}>{captionB}</span>
      </div>
    </div>
  );
}

/* ─── Logo SVG ─── */
function LogoIcon({ size = 20 }) {
  const s = size / 4;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="1" y="1" width="7.5" height="7.5" rx="1" fill="#AAFF00" />
      <rect x="11.5" y="1" width="7.5" height="7.5" rx="1" fill="#AAFF00" />
      <rect x="1" y="11.5" width="7.5" height="7.5" rx="1" fill="#AAFF00" />
      <rect x="11.5" y="11.5" width="7.5" height="7.5" rx="1" fill="#AAFF00" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  MAIN                                               */
/* ═══════════════════════════════════════════════════ */

const BETA_MODE = true;

export default function VokuLanding() {
  const [lang, setLang] = useState("PT");
  const [portfolioTab, setPortfolioTab] = useState(0);
  const [betaModal, setBetaModal] = useState(false);

  const handleCta = (e) => { if (BETA_MODE) { e.preventDefault(); setBetaModal(true); } };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("voku_ref", ref);
  }, []);

  const t = T[lang];
  const [portfolioRef, portfolioVis] = useReveal(0);
  const [productsRef, productsVis] = useReveal(0);
  const [processRef, processVis] = useReveal(0);
  const [guaranteeRef, guaranteeVis] = useReveal(0);

  const rv = (vis, d = 0) => ({ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(16px)", transition: `opacity 0.5s ease ${d}s, transform 0.5s ease ${d}s` });

  return (
    <div style={{ fontFamily: FF, background: "#F5F0E8", color: "#111" }}>

      {/* ══ NAV ══ */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#F5F0E8", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "0 48px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoIcon size={18} />
          <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: -1 }}>VOKU</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {t.nav.map((n, i) => <a key={i} href={`#s${i}`} style={{ fontSize: 11, color: "#888", textDecoration: "none", fontWeight: 500 }}>{n}</a>)}
          <div style={{ display: "flex", gap: 0, border: "1px solid rgba(0,0,0,0.12)" }}>
            {["PT", "EN", "ES"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, padding: "6px 12px", border: "none", cursor: "pointer", background: lang === l ? "#111" : "transparent", color: lang === l ? "#AAFF00" : "#888" }}>{l}</button>
            ))}
          </div>
          <a href="/cliente" onClick={handleCta} style={{ background: "#111", color: "#AAFF00", padding: "9px 20px", fontSize: 11, fontWeight: 700, textDecoration: "none", letterSpacing: 0.5 }}>{t.navCta}</a>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "calc(100vh - 56px)" }}>
        {/* Left */}
        <div style={{ padding: "64px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <div style={{ width: 32, height: 1, background: "#111" }} />
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 3, color: "#888", textTransform: "uppercase" }}>{t.hero.eyebrow}</span>
          </div>
          <h1 style={{ fontSize: "clamp(52px,6vw,84px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: -3, textTransform: "uppercase", margin: 0 }}>
            <span style={{ WebkitTextStroke: "1.5px #111", color: "transparent", display: "block" }}>SEU</span>
            <span style={{ WebkitTextStroke: "1.5px #111", color: "transparent", display: "block" }}>CONTEÚDO.</span>
            <span style={{ color: "#111", display: "block" }}>PRONTO.</span>
          </h1>
          <div style={{ width: "100%", height: 1, background: "rgba(0,0,0,0.12)", margin: "32px 0" }} />
          <p style={{ fontSize: 13, color: "#555", lineHeight: 1.75, maxWidth: 340, margin: 0 }}>{t.hero.sub}</p>
        </div>
        {/* Right — 2 stacked cells */}
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr" }}>
          <div style={{ background: "#111", padding: 48, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 3, color: "#444", textTransform: "uppercase", marginBottom: 8 }}>{lang === "PT" ? "Tempo de entrega" : lang === "ES" ? "Tiempo de entrega" : "Delivery time"}</div>
            <div style={{ fontSize: 72, fontWeight: 900, color: "#AAFF00", letterSpacing: -3, lineHeight: 1 }}>48h</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>{lang === "PT" ? "Do briefing à entrega. Garantido." : lang === "ES" ? "Del briefing a la entrega. Garantizado." : "From briefing to delivery. Guaranteed."}</div>
          </div>
          <div style={{ background: "#AAFF00", padding: 48, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#111", lineHeight: 1.4, maxWidth: 320, marginBottom: 28 }}>
              {lang === "PT" ? "Parece escrito por alguém que conhece sua marca há anos." : lang === "ES" ? "Parece escrito por alguien que conoce tu marca hace años." : "Looks like it was written by someone who's known your brand for years."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="/cliente" onClick={handleCta} style={{ display: "inline-block", background: "#111", color: "#AAFF00", padding: "14px 28px", fontSize: 13, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>{t.navCta} →</a>
              <a href="#s0" style={{ fontSize: 11, color: "#111", opacity: 0.6, textDecoration: "none", textAlign: "center" }}>{lang === "PT" ? "Ver serviços ↓" : lang === "ES" ? "Ver servicios ↓" : "See services ↓"}</a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TICKER ══ */}
      <div style={{ background: "#111", padding: "12px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-block", animation: "ticker 30s linear infinite" }}>
          {[0, 1].map(i => (
            <span key={i} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "#AAFF00", textTransform: "uppercase", paddingRight: 48 }}>
              {t.ticker} &nbsp;&nbsp;·&nbsp;&nbsp; {t.ticker} &nbsp;&nbsp;·&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ══ PORTFOLIO ══ */}
      <section id="s0" ref={portfolioRef} style={{ padding: "96px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ ...rv(portfolioVis), marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "#888", marginBottom: 12 }}>{t.portfolio.label}</div>
            <h2 style={{ fontSize: "clamp(32px,4vw,56px)", fontWeight: 900, letterSpacing: -2, textTransform: "uppercase", margin: 0, lineHeight: 1.05 }}>{t.portfolio.title}</h2>
          </div>
          <p style={{ ...rv(portfolioVis, 0.1), fontSize: 14, color: "#666", lineHeight: 1.75, marginBottom: 40 }}>{t.portfolio.sub}</p>

          {/* Tabs */}
          <div style={{ ...rv(portfolioVis, 0.15), display: "flex", gap: 32, marginBottom: 32, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            {t.portfolio.tabs.map((tab, i) => (
              <button key={i} onClick={() => setPortfolioTab(i)} style={{
                fontFamily: FF, fontSize: 13, fontWeight: portfolioTab === i ? 700 : 500,
                color: portfolioTab === i ? "#111" : "#888", background: "none", border: "none",
                borderBottom: portfolioTab === i ? "2px solid #111" : "2px solid transparent",
                padding: "12px 0", cursor: "pointer", marginBottom: -1,
              }}>{tab}</button>
            ))}
          </div>

          {/* Grid */}
          <div style={{ ...rv(portfolioVis, 0.2) }}>
            <PortfolioGrid
              tab={portfolioTab}
              caption={t.portfolio[`caption${portfolioTab + 1}`]}
              captionB={t.portfolio[`caption${portfolioTab + 1}b`]}
            />
          </div>
        </div>
      </section>

      {/* ══ PRODUCTS ══ */}
      <section id="s1" ref={productsRef} style={{ padding: "96px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ ...rv(productsVis), marginBottom: 48 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "#888", marginBottom: 12 }}>{t.products.label}</div>
            <h2 style={{ fontSize: "clamp(32px,4vw,56px)", fontWeight: 900, letterSpacing: -2, textTransform: "uppercase", margin: 0, lineHeight: 1.05 }}>{t.products.title}</h2>
          </div>
          <div style={{ ...rv(productsVis, 0.1), display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
            {t.products.items.map((p, i) => {
              const isDark = p.highlight;
              return (
                <div key={i} style={{
                  background: isDark ? "#111" : "#F5F0E8",
                  padding: "36px 32px",
                  borderLeft: i > 0 ? "1px solid rgba(0,0,0,0.12)" : "none",
                  position: "relative",
                }}>
                  {isDark && <div style={{ position: "absolute", top: 16, right: 16, background: "#AAFF00", color: "#111", fontSize: 8, fontWeight: 700, letterSpacing: 2, padding: "4px 10px", textTransform: "uppercase" }}>{t.products.badge}</div>}
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2, color: isDark ? "#555" : "#999", textTransform: "uppercase", marginBottom: 16 }}>{p.num}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: isDark ? "#fff" : "#111", textTransform: "uppercase", letterSpacing: -0.5, marginBottom: 8 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: isDark ? "#888" : "#666", marginBottom: 24 }}>{p.tagline}</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: isDark ? "#AAFF00" : "#111", letterSpacing: -1, marginBottom: 4 }}>{p.price}</div>
                  <div style={{ fontSize: 11, color: isDark ? "#555" : "#999", marginBottom: 24 }}>{p.time}</div>
                  <div style={{ height: 1, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", marginBottom: 24 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                    {p.features.map((f, j) => (
                      <div key={j} style={{ fontSize: 11, color: isDark ? "#888" : "#666", display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: isDark ? "#AAFF00" : "#111", fontWeight: 700 }}>→</span>{f}
                      </div>
                    ))}
                  </div>
                  <a href="/cliente" onClick={handleCta} style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#AAFF00" : "#111", textDecoration: "none" }}>{t.navCta} →</a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ PROCESS ══ */}
      <section id="s2" ref={processRef} style={{ background: "#111", padding: "96px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }}>
          <div style={{ ...rv(processVis) }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "#555", marginBottom: 12, textTransform: "uppercase" }}>{t.process.label}</div>
            <h2 style={{ fontSize: "clamp(32px,4vw,56px)", fontWeight: 900, letterSpacing: -2, textTransform: "uppercase", color: "#fff", margin: 0, lineHeight: 1.05, marginBottom: 20 }}>{t.process.title}</h2>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.75 }}>{t.process.sub}</p>
          </div>
          <div>
            {t.process.steps.map((step, i) => (
              <div key={i} style={{ ...rv(processVis, 0.1 + i * 0.08), borderTop: "1px solid #1e1e1e", padding: "28px 0" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#AAFF00", marginBottom: 8 }}>{step.n}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 8 }}>{step.t}</div>
                <div style={{ fontSize: 13, color: "#999", lineHeight: 1.6 }}>{step.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GUARANTEE ══ */}
      <section ref={guaranteeRef} style={{ background: "#AAFF00", padding: "80px 48px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ ...rv(guaranteeVis), fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "rgba(0,0,0,0.4)", textTransform: "uppercase", marginBottom: 16 }}>{t.guarantee.label}</div>
          <h2 style={{ ...rv(guaranteeVis, 0.08), fontSize: "clamp(36px,5vw,64px)", fontWeight: 900, letterSpacing: -2, textTransform: "uppercase", color: "#111", margin: 0, lineHeight: 1.05, marginBottom: 20 }}>{t.guarantee.title}</h2>
          <p style={{ ...rv(guaranteeVis, 0.14), fontSize: 14, color: "rgba(0,0,0,0.6)", lineHeight: 1.75, maxWidth: 480, marginBottom: 32 }}>{t.guarantee.body}</p>
          <a href="/cliente" onClick={handleCta} style={{ ...rv(guaranteeVis, 0.2), display: "inline-block", background: "#111", color: "#AAFF00", padding: "15px 36px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>{t.guarantee.cta}</a>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: "#E8E3D8", borderTop: "1px solid rgba(0,0,0,0.1)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 40, padding: "56px 48px", maxWidth: 1200, margin: "0 auto" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <LogoIcon size={16} />
              <span style={{ fontWeight: 900, fontSize: 14, letterSpacing: -0.5 }}>VOKU</span>
            </div>
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.7, maxWidth: 280, margin: 0 }}>{t.footer.desc}</p>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "#888", marginBottom: 16, textTransform: "uppercase" }}>{t.footer.col2label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {t.footer.col2.map((l, i) => <span key={i} style={{ fontSize: 13, color: "#333" }}>{l}</span>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "#888", marginBottom: 16, textTransform: "uppercase" }}>{t.footer.col3label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {t.footer.col3.map((l, i) => {
                const href = i === 1 ? "/cliente" : i === 0 ? "#s2" : null;
                return href ? <a key={i} href={href} style={{ fontSize: 13, color: "#333", textDecoration: "none" }}>{l}</a> : <span key={i} style={{ fontSize: 13, color: "#333" }}>{l}</span>;
              })}
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.1)", padding: "20px 48px", display: "flex", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto" }}>
          <span style={{ fontSize: 11, color: "#888" }}>{t.footer.bottom1}</span>
          <span style={{ fontSize: 11, color: "#888" }}>{t.footer.bottom2}</span>
        </div>
      </footer>

      {/* Beta Modal */}
      {betaModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setBetaModal(false); }} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#111", border: "1.5px solid #AAFF00", borderRadius: 4, padding: "48px 40px", maxWidth: 440, width: "100%", textAlign: "center", position: "relative", animation: "modalIn 0.35s ease forwards" }}>
            <button onClick={() => setBetaModal(false)} style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", color: "#444", fontSize: 22, cursor: "pointer" }}>×</button>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "#AAFF00", marginBottom: 24 }}>ACESSO BETA LIBERADO</div>
            <div style={{ fontWeight: 900, fontSize: 28, color: "#fff", lineHeight: 1.1, marginBottom: 12, letterSpacing: -1 }}>7 dias grátis.</div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.7, marginBottom: 32 }}>Acesso completo. Sem cartão. Sem compromisso.</div>
            <div style={{ height: 1, background: "#222", marginBottom: 24 }} />
            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
              {[
                lang === "PT" ? "Todos os produtos desbloqueados" : "All products unlocked",
                lang === "PT" ? "Chat com agente IA" : "AI agent chat",
                lang === "PT" ? "Landing pages, posts, e-mails" : "Landing pages, posts, emails",
                lang === "PT" ? "Sem limite de projetos" : "Unlimited projects",
              ].map(item => (
                <div key={item} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "#AAFF00", fontWeight: 700, fontSize: 13 }}>→</span>
                  <span style={{ color: "#fff", fontSize: 13 }}>{item}</span>
                </div>
              ))}
            </div>
            <a href="/cliente" style={{ display: "block", background: "#AAFF00", color: "#111", fontWeight: 800, fontSize: 14, padding: 16, border: "none", textDecoration: "none", textAlign: "center" }}>Ativar agora →</a>
            <div style={{ fontSize: 11, color: "#444", marginTop: 14 }}>{lang === "PT" ? "Sem cartão de crédito. Cancele quando quiser." : "No credit card. Cancel anytime."}</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
