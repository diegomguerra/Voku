// @ts-nocheck
import { useState, useEffect, useRef } from "react";

const FONTS = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400&family=DM+Serif+Display:ital@0;1&display=swap";

/* ─── PRICING ANCHORS ───────────────────────────── */
const PRICES = {
  mkt: { from: "$197", label: { PT: "a partir de", EN: "from", ES: "desde" } },
  auto: { from: "$297", label: { PT: "a partir de", EN: "from", ES: "desde" } },
  cnt: { from: "$147", label: { PT: "/mês a partir de", EN: "/mo from", ES: "/mes desde" } },
};

/* ─── COPY (trilingual) ─────────────────────────── */
const T = {
  PT: {
    nav: ["Serviços", "Processo", "Preços"],
    navCta: "Começar agora",
    eyebrow: "Serviço digitalizado · entrega sem reunião",
    h1a: "Você traz",
    h1b: "o problema.",
    h1italic: "Nós entregamos.",
    sub: "Marketing digital, automação e conteúdo — pacotes fixos, preço visível, entrega em 24h. Em português, inglês ou espanhol. Sem proposta. Sem reunião.",
    cta: "Quero meu projeto",
    ctaSec: "Ver serviços",
    scrollHint: "role para explorar",

    trustBadges: ["Sem contrato longo", "Revisão inclusa", "Entrega em 24h"],

    statsLabel: "Por que a Voku",
    stats: [
      { n: "24h", l: "Primeira entrega" },
      { n: "3×", l: "Mais rápido que agência" },
      { n: "100%", l: "Revisão inclusa" },
      { n: "0", l: "Reuniões obrigatórias" },
    ],

    gapTitle: "O mercado tem dois extremos.",
    gapSub: "A Voku ocupa o meio.",
    gapItems: [
      { label: "Freelas nas plataformas", icon: "👎", points: ["Preço invisível", "Sem processo", "Somem após entrega", "Competem por centavos"] },
      { label: "VOKU", icon: "✦", points: ["Preço âncora visível", "Pacote fixo, escopo claro", "Processo e garantia", "Entrega em 24–48h"], highlight: true },
      { label: "Agências tradicionais", icon: "👎", points: ["R$10k+/mês de contrato", "Reunião semanal obrigatória", "6 meses de fidelidade", "Burocracia de proposta"] },
    ],

    exploreLabel: "SERVIÇOS & PREÇOS",
    exploreTitle: "Escolha. Pague. Receba.",
    exploreSub: "Sem proposta customizada. Sem espera.",

    proofLabel: "QUEM JÁ USOU",
    proofQuote: "Precisava de copy para lançamento em 48h. A Voku entregou em 36h, revisado, pronto pra publicar. Nunca mais voltei ao freela tradicional.",
    proofAuthor: "— Eduardo M., fundador de SaaS, São Paulo",

    guaranteeTitle: "Garantia sem discussão.",
    guaranteeBody: "Não gostou do resultado? Refazemos. Sem questionamentos, sem custo extra. Cada projeto tem revisão inclusa por padrão.",

    processLabel: "PROCESSO",
    processTitle: "4 etapas. Sem surpresa.",
    steps: [
      { n: "01", t: "Cadastro rápido", d: "Crie sua conta em 30 segundos. Sem cartão de crédito." },
      { n: "02", t: "Formulário inteligente", d: "Descreva o projeto para nossa IA. Ela qualifica, organiza e prepara o briefing automaticamente." },
      { n: "03", t: "Proposta imediata", d: "Confirmação automática com escopo, prazo e valor fixo. Sem negociação." },
      { n: "04", t: "Entrega + revisão", d: "Material pronto para usar. Revisão inclusa. Você cresce." },
    ],

    pricingLabel: "PLANOS",
    pricingTitle: "Preço fixo. Escopo claro.",
    pricingSub: "Nada de 'me manda o briefing que faço orçamento'.",
    plans: [
      {
        id: "starter",
        name: "Starter",
        price: "$197",
        period: "",
        desc: "Um entregável pontual, bem feito, sem enrolação.",
        items: ["1 landing page com copy completa", "OU sequência de 5 e-mails", "OU 15 posts para redes sociais", "1 rodada de revisão inclusa", "Entrega em 48h"],
        cta: "Começar com Starter",
        highlight: false,
      },
      {
        id: "growth",
        name: "Growth",
        price: "$397",
        period: "/mês",
        desc: "Presença contínua com copy, conteúdo e estratégia.",
        items: ["30 posts/mês prontos para publicar", "Copy para 2 campanhas", "1 automação WhatsApp ou e-mail", "Estratégia mensal revisada", "Revisões ilimitadas no mês"],
        cta: "Quero o Growth",
        highlight: true,
        badge: "Mais escolhido",
      },
      {
        id: "scale",
        name: "Scale",
        price: "$797",
        period: "/mês",
        desc: "Time completo dedicado ao seu crescimento.",
        items: ["Tudo do Growth +", "Setup completo de automação CRM", "Funil de vendas do zero", "Dashboard de resultados", "Suporte prioritário direto"],
        cta: "Falar sobre Scale",
        highlight: false,
      },
    ],

    promoTitle: "Ganhe 15% de desconto.",
    promoBody: "Siga @voku.one no Instagram e TikTok e receba um promo code exclusivo antes de finalizar o cadastro.",
    promoInstagram: "Seguir no Instagram",
    promoTikTok: "Seguir no TikTok",
    promoAlready: "Já sigo — quero meu código",

    finalTitle: "Pronto para",
    finalHighlight: "resolver de vez?",
    finalSub: "Crie sua conta grátis e descreva o projeto. Nossa IA organiza tudo. Você recebe a proposta em minutos.",
    finalCta: "Criar conta e começar",

    footer: "We make it Happen.",
    footerLinks: ["Workana", "Fiverr", "WhatsApp"],
  },
  EN: {
    nav: ["Services", "Process", "Pricing"],
    navCta: "Get started",
    eyebrow: "Productized service · no-meeting delivery",
    h1a: "You bring",
    h1b: "the problem.",
    h1italic: "We deliver.",
    sub: "Digital marketing, automation and content — fixed packages, visible pricing, 24h delivery. In English, Portuguese or Spanish. No proposals. No meetings.",
    cta: "Start my project",
    ctaSec: "See services",
    scrollHint: "scroll to explore",
    trustBadges: ["No long contracts", "Revision included", "24h delivery"],
    statsLabel: "Why Voku",
    stats: [
      { n: "24h", l: "First delivery" },
      { n: "3×", l: "Faster than agencies" },
      { n: "100%", l: "Revision included" },
      { n: "0", l: "Mandatory meetings" },
    ],
    gapTitle: "The market has two extremes.",
    gapSub: "Voku owns the middle.",
    gapItems: [
      { label: "Platform freelancers", icon: "👎", points: ["Invisible pricing", "No process", "Disappear after delivery", "Race to the bottom"] },
      { label: "VOKU", icon: "✦", points: ["Visible anchor pricing", "Fixed package, clear scope", "Process + guarantee", "Delivery in 24–48h"], highlight: true },
      { label: "Traditional agencies", icon: "👎", points: ["$3k+/mo contracts", "Weekly mandatory meetings", "6-month lock-in", "Proposal bureaucracy"] },
    ],
    exploreLabel: "SERVICES & PRICING",
    exploreTitle: "Choose. Pay. Receive.",
    exploreSub: "No custom proposals. No waiting.",
    proofLabel: "WHO ALREADY USED US",
    proofQuote: "Needed launch copy in 48h. Voku delivered in 36h, revised, ready to publish. Never going back to traditional freelancers.",
    proofAuthor: "— Eduardo M., SaaS founder, São Paulo",
    guaranteeTitle: "Guarantee. No questions.",
    guaranteeBody: "Don't like the result? We redo it. No questions asked, no extra cost. Every project includes revision by default.",
    processLabel: "PROCESS",
    processTitle: "4 steps. No surprises.",
    steps: [
      { n: "01", t: "Quick signup", d: "Create your account in 30 seconds. No credit card." },
      { n: "02", t: "Smart form", d: "Describe the project to our AI. It qualifies, organizes and prepares the brief automatically." },
      { n: "03", t: "Instant proposal", d: "Automatic confirmation with fixed scope, deadline and price. No negotiation." },
      { n: "04", t: "Delivery + revision", d: "Ready-to-use material. Revision included. You grow." },
    ],
    pricingLabel: "PLANS",
    pricingTitle: "Fixed price. Clear scope.",
    pricingSub: "No more 'send me a brief and I'll quote it'.",
    plans: [
      { id: "starter", name: "Starter", price: "$197", period: "", desc: "One deliverable, done right, no nonsense.", items: ["1 landing page with full copy", "OR sequence of 5 emails", "OR 15 social media posts", "1 revision round included", "Delivered in 48h"], cta: "Start with Starter", highlight: false },
      { id: "growth", name: "Growth", price: "$397", period: "/mo", desc: "Continuous presence with copy, content and strategy.", items: ["30 posts/mo ready to publish", "Copy for 2 campaigns", "1 WhatsApp or email automation", "Monthly strategy review", "Unlimited revisions in the month"], cta: "Get Growth", highlight: true, badge: "Most chosen" },
      { id: "scale", name: "Scale", price: "$797", period: "/mo", desc: "Full team dedicated to your growth.", items: ["Everything in Growth +", "Full CRM automation setup", "Sales funnel from scratch", "Results dashboard", "Priority direct support"], cta: "Talk about Scale", highlight: false },
    ],
    promoTitle: "Get 15% off.",
    promoBody: "Follow @voku.one on Instagram and TikTok and receive an exclusive promo code before checkout.",
    promoInstagram: "Follow on Instagram",
    promoTikTok: "Follow on TikTok",
    promoAlready: "Already following — give me the code",
    finalTitle: "Ready to",
    finalHighlight: "solve it for good?",
    finalSub: "Create your free account and describe the project. Our AI organizes everything. You get the proposal in minutes.",
    finalCta: "Create account and start",
    footer: "We make it Happen.",
    footerLinks: ["Workana", "Fiverr", "WhatsApp"],
  },
  ES: {
    nav: ["Servicios", "Proceso", "Precios"],
    navCta: "Empezar ahora",
    eyebrow: "Servicio productizado · entrega sin reunión",
    h1a: "Tú traes",
    h1b: "el problema.",
    h1italic: "Nosotros entregamos.",
    sub: "Marketing digital, automatización y contenido — paquetes fijos, precio visible, entrega en 24h. En español, portugués o inglés. Sin propuesta. Sin reuniones.",
    cta: "Quiero mi proyecto",
    ctaSec: "Ver servicios",
    scrollHint: "desliza para explorar",
    trustBadges: ["Sin contrato largo", "Revisión incluida", "Entrega en 24h"],
    statsLabel: "Por qué Voku",
    stats: [
      { n: "24h", l: "Primera entrega" },
      { n: "3×", l: "Más rápido que agencia" },
      { n: "100%", l: "Revisión incluida" },
      { n: "0", l: "Reuniones obligatorias" },
    ],
    gapTitle: "El mercado tiene dos extremos.",
    gapSub: "Voku ocupa el medio.",
    gapItems: [
      { label: "Freelancers en plataformas", icon: "👎", points: ["Precio invisible", "Sin proceso", "Desaparecen tras la entrega", "Compiten por centavos"] },
      { label: "VOKU", icon: "✦", points: ["Precio ancla visible", "Paquete fijo, alcance claro", "Proceso + garantía", "Entrega en 24–48h"], highlight: true },
      { label: "Agencias tradicionales", icon: "👎", points: ["$3k+/mes de contrato", "Reunión semanal obligatoria", "6 meses de fidelidad", "Burocracia de propuesta"] },
    ],
    exploreLabel: "SERVICIOS & PRECIOS",
    exploreTitle: "Elige. Paga. Recibe.",
    exploreSub: "Sin propuestas personalizadas. Sin esperas.",
    proofLabel: "QUIENES YA LO USARON",
    proofQuote: "Necesitaba copy para lanzamiento en 48h. Voku entregó en 36h, revisado, listo para publicar. Nunca más volví al freelancer tradicional.",
    proofAuthor: "— Eduardo M., fundador de SaaS, São Paulo",
    guaranteeTitle: "Garantía sin discusión.",
    guaranteeBody: "¿No te gusta el resultado? Lo rehacemos. Sin preguntas, sin costo extra. Cada proyecto incluye revisión por defecto.",
    processLabel: "PROCESO",
    processTitle: "4 pasos. Sin sorpresas.",
    steps: [
      { n: "01", t: "Registro rápido", d: "Crea tu cuenta en 30 segundos. Sin tarjeta de crédito." },
      { n: "02", t: "Formulario inteligente", d: "Describe el proyecto a nuestra IA. Ella califica, organiza y prepara el briefing automáticamente." },
      { n: "03", t: "Propuesta inmediata", d: "Confirmación automática con alcance, plazo y valor fijo. Sin negociación." },
      { n: "04", t: "Entrega + revisión", d: "Material listo para usar. Revisión incluida. Tú creces." },
    ],
    pricingLabel: "PLANES",
    pricingTitle: "Precio fijo. Alcance claro.",
    pricingSub: "Nada de 'mándame el briefing y te cotizo'.",
    plans: [
      { id: "starter", name: "Starter", price: "$197", period: "", desc: "Un entregable puntual, bien hecho, sin rodeos.", items: ["1 landing page con copy completa", "O secuencia de 5 emails", "O 15 posts para redes sociales", "1 ronda de revisión incluida", "Entrega en 48h"], cta: "Empezar con Starter", highlight: false },
      { id: "growth", name: "Growth", price: "$397", period: "/mes", desc: "Presencia continua con copy, contenido y estrategia.", items: ["30 posts/mes listos para publicar", "Copy para 2 campañas", "1 automatización WhatsApp o email", "Revisión de estrategia mensual", "Revisiones ilimitadas en el mes"], cta: "Quiero el Growth", highlight: true, badge: "El más elegido" },
      { id: "scale", name: "Scale", price: "$797", period: "/mes", desc: "Equipo completo dedicado a tu crecimiento.", items: ["Todo de Growth +", "Setup completo de automatización CRM", "Embudo de ventas desde cero", "Dashboard de resultados", "Soporte prioritario directo"], cta: "Hablar sobre Scale", highlight: false },
    ],
    promoTitle: "Obtén 15% de descuento.",
    promoBody: "Sigue @voku.one en Instagram y TikTok y recibe un código promo exclusivo antes de finalizar el registro.",
    promoInstagram: "Seguir en Instagram",
    promoTikTok: "Seguir en TikTok",
    promoAlready: "Ya sigo — dame mi código",
    finalTitle: "¿Listo para",
    finalHighlight: "resolver de una vez?",
    finalSub: "Crea tu cuenta gratuita y describe el proyecto. Nuestra IA organiza todo. Recibes la propuesta en minutos.",
    finalCta: "Crear cuenta y empezar",
    footer: "We make it Happen.",
    footerLinks: ["Workana", "Fiverr", "WhatsApp"],
  },
};

/* ─── SERVICES DATA ─────────────────────────────── */
const SVC = {
  PT: [
    {
      id: "mkt", index: "01",
      label: "Marketing Digital & Copy",
      badge: "Mais contratado",
      price: "$197",
      priceSuffix: "",
      priceNote: "por entregável",
      tagline: "Palavras que fazem\no cliente agir.",
      body: "Copy estratégico para todos os canais — do primeiro clique à venda fechada. Escopo fixo, preço visível, entrega garantida.",
      deliverables: ["Anúncios Meta & Google", "Landing pages de alta conversão", "Sequências de e-mail marketing", "Scripts para vídeo e reels", "Estratégia de funil completo", "Copywriting para sites"],
      kpi: "Até 3× mais cliques",
      time: "Entrega em 24–48h",
      bg: "#F8F8F6", accent: "#E9F59E", accentDark: "#2A3D00", textColor: "#111",
    },
    {
      id: "auto", index: "02",
      label: "Automação & IA",
      badge: "Crescimento mais rápido",
      price: "$297",
      priceSuffix: "",
      priceNote: "por setup",
      tagline: "Seus processos no\npiloto automático.",
      body: "Automatize tudo que repete. WhatsApp, CRM, atendimento e relatórios rodando sem intervenção manual. Setup fixo, suporte incluso.",
      deliverables: ["Automação WhatsApp Business", "Funis e CRM integrados", "Fluxos de atendimento 24/7", "Dashboards em tempo real", "Integrações entre ferramentas", "Bots de qualificação de leads"],
      kpi: "80% menos tarefas manuais",
      time: "Setup em 3–5 dias",
      bg: "#111", accent: "#E9F59E", accentDark: "#111", textColor: "#F8F8F6",
    },
    {
      id: "cnt", index: "03",
      label: "Conteúdo",
      badge: "Demanda recorrente",
      price: "$147",
      priceSuffix: "/mês",
      priceNote: "por mês",
      tagline: "Presença constante,\nsem esforço.",
      body: "Um mês de conteúdo numa entrega. Posts, artigos, roteiros e newsletters — sua marca sempre ativa, sempre consistente.",
      deliverables: ["30 posts prontos por mês", "Artigos e blog posts otimizados", "Roteiros para YouTube & Reels", "Newsletters e e-mail content", "Legendas + hashtags + calendário", "Conteúdo para LinkedIn"],
      kpi: "4× mais engajamento",
      time: "Entrega mensal",
      bg: "#EDE8DF", accent: "#111", accentDark: "#111", textColor: "#111",
    },
  ],
  EN: [
    {
      id: "mkt", index: "01", label: "Digital Marketing & Copy", badge: "Most hired",
      price: "$197", priceSuffix: "", priceNote: "per deliverable",
      tagline: "Words that make\nclients act.",
      body: "Strategic copy for every channel — from the first click to the closed sale. Fixed scope, visible price, guaranteed delivery.",
      deliverables: ["Meta & Google Ads", "High-converting landing pages", "Email marketing sequences", "Video & reels scripts", "Full funnel strategy", "Website copywriting"],
      kpi: "Up to 3× more clicks", time: "Delivered in 24–48h",
      bg: "#F8F8F6", accent: "#E9F59E", accentDark: "#2A3D00", textColor: "#111",
    },
    {
      id: "auto", index: "02", label: "Automation & AI", badge: "Fastest growing",
      price: "$297", priceSuffix: "", priceNote: "per setup",
      tagline: "Your processes on\nautopilot.",
      body: "Automate everything that repeats. WhatsApp, CRM, support and reports running without manual intervention. Fixed setup, support included.",
      deliverables: ["WhatsApp Business automation", "Integrated funnels & CRM", "24/7 support flows", "Real-time dashboards", "Tool integrations", "Lead qualification bots"],
      kpi: "80% less manual tasks", time: "Setup in 3–5 days",
      bg: "#111", accent: "#E9F59E", accentDark: "#111", textColor: "#F8F8F6",
    },
    {
      id: "cnt", index: "03", label: "Content", badge: "Recurring demand",
      price: "$147", priceSuffix: "/mo", priceNote: "per month",
      tagline: "Constant presence,\nzero effort.",
      body: "One month of content in one delivery. Posts, articles, scripts and newsletters — your brand always active and consistent.",
      deliverables: ["30 posts ready per month", "Optimized blog articles", "YouTube & Reels scripts", "Newsletters & email content", "Captions + hashtags + calendar", "LinkedIn content"],
      kpi: "4× more engagement", time: "Monthly delivery",
      bg: "#EDE8DF", accent: "#111", accentDark: "#111", textColor: "#111",
    },
  ],
  ES: [
    {
      id: "mkt", index: "01", label: "Marketing Digital & Copy", badge: "El más contratado",
      price: "$197", priceSuffix: "", priceNote: "por entregable",
      tagline: "Palabras que hacen\nactuar al cliente.",
      body: "Copy estratégico para todos los canales — del primer clic a la venta cerrada. Alcance fijo, precio visible, entrega garantizada.",
      deliverables: ["Anuncios Meta & Google", "Landing pages de alta conversión", "Secuencias de email marketing", "Guiones para video y reels", "Estrategia de embudo completo", "Copywriting para sitios web"],
      kpi: "Hasta 3× más clics", time: "Entrega en 24–48h",
      bg: "#F8F8F6", accent: "#E9F59E", accentDark: "#2A3D00", textColor: "#111",
    },
    {
      id: "auto", index: "02", label: "Automatización & IA", badge: "Crecimiento más rápido",
      price: "$297", priceSuffix: "", priceNote: "por setup",
      tagline: "Tus procesos en\npiloto automático.",
      body: "Automatiza todo lo que se repite. WhatsApp, CRM, atención y reportes funcionando sin intervención manual. Setup fijo, soporte incluido.",
      deliverables: ["Automatización WhatsApp Business", "Embudos y CRM integrados", "Flujos de atención 24/7", "Dashboards en tiempo real", "Integraciones entre herramientas", "Bots de calificación de leads"],
      kpi: "80% menos tareas manuales", time: "Setup en 3–5 días",
      bg: "#111", accent: "#E9F59E", accentDark: "#111", textColor: "#F8F8F6",
    },
    {
      id: "cnt", index: "03", label: "Contenido", badge: "Demanda recurrente",
      price: "$147", priceSuffix: "/mes", priceNote: "por mes",
      tagline: "Presencia constante,\nsin esfuerzo.",
      body: "Un mes de contenido en una entrega. Posts, artículos, guiones y newsletters — tu marca siempre activa y consistente.",
      deliverables: ["30 posts listos por mes", "Artículos de blog optimizados", "Guiones para YouTube & Reels", "Newsletters y email content", "Leyendas + hashtags + calendario", "Contenido para LinkedIn"],
      kpi: "4× más engagement", time: "Entrega mensual",
      bg: "#EDE8DF", accent: "#111", accentDark: "#111", textColor: "#111",
    },
  ],
};

/* ─── HOOKS ─────────────────────────────────────── */
function useReveal(delay = 0): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setVisible(true), delay); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return [ref, visible];
}

/* ─── TICKER ────────────────────────────────────── */
function Ticker({ items }) {
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: "hidden", background: "#E9F59E", padding: "10px 0" }}>
      <div style={{ display: "flex", width: "max-content", animation: "scrollTicker 24s linear infinite" }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#2A3D00", padding: "0 24px", whiteSpace: "nowrap" }}>
            {item} <span style={{ opacity: 0.35 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── SERVICE EXPLORER ──────────────────────────── */
function ServiceExplorer({ services, lang }) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [dlVisible, setDlVisible] = useState(false);
  const ctaLabel = lang === "PT" ? "Quero este serviço →" : lang === "EN" ? "I want this →" : "Quiero este →";

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % services.length), 5000);
    return () => clearInterval(t);
  }, [services.length]);

  useEffect(() => {
    setDlVisible(false);
    const t = setTimeout(() => setDlVisible(true), 180);
    return () => clearTimeout(t);
  }, [active]);

  const svc = services[active];
  const isDark = svc.bg === "#111";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: 540, borderRadius: 20, overflow: "hidden", border: "1px solid #E0E0D8", boxShadow: "0 24px 80px rgba(0,0,0,0.08)" }}>
      {/* LEFT */}
      <div style={{ background: "#111", display: "flex", flexDirection: "column" }}>
        {services.map((s, i) => {
          const isA = active === i;
          return (
            <button key={s.id} onClick={() => setActive(i)} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              style={{ all: "unset", cursor: "pointer", padding: "24px 28px", borderBottom: i < services.length - 1 ? "1px solid #1A1A1A" : "none", background: isA ? "#1A1A1A" : hovered === i ? "#161616" : "transparent", transition: "background 0.2s", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: isA ? "#E9F59E" : "transparent", transition: "background 0.3s", borderRadius: "0 2px 2px 0" }} />
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 2, color: isA ? "#E9F59E" : "#333", marginBottom: 6, transition: "color 0.3s" }}>{s.index}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: isA ? 700 : 500, color: isA ? "#F8F8F6" : "#555", lineHeight: 1.3, transition: "all 0.3s" }}>{s.label}</div>
              {isA && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 800, color: "#E9F59E" }}>{s.price}{s.priceSuffix}</span>
                  <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 10, color: "#444" }}>{s.priceNote}</span>
                </div>
              )}
            </button>
          );
        })}
        <div style={{ marginTop: "auto", padding: "20px 28px", display: "flex", gap: 6 }}>
          {services.map((_, i) => (
            <div key={i} onClick={() => setActive(i)} style={{ height: 3, borderRadius: 2, cursor: "pointer", background: active === i ? "#E9F59E" : "#222", flex: active === i ? 2 : 1, transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)" }} />
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ background: svc.bg, padding: "44px 48px", display: "flex", flexDirection: "column", transition: "background 0.5s ease", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: "linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          {/* badge + price */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, opacity: dlVisible ? 1 : 0, transform: dlVisible ? "translateY(0)" : "translateY(-8px)", transition: "all 0.4s ease" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: svc.accent, color: svc.accentDark, padding: "5px 14px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>
              {svc.badge.toUpperCase()}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 26, fontWeight: 800, color: isDark ? "#E9F59E" : "#111", letterSpacing: -0.5 }}>{svc.price}{svc.priceSuffix}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 10, color: isDark ? "#555" : "#AAA", marginTop: 2 }}>{svc.priceNote}</div>
            </div>
          </div>

          <h3 style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontSize: "clamp(26px,2.8vw,40px)", fontWeight: 400, color: svc.textColor, lineHeight: 1.15, margin: "0 0 16px", whiteSpace: "pre-line", opacity: dlVisible ? 1 : 0, transform: dlVisible ? "translateY(0)" : "translateY(12px)", transition: "all 0.45s ease 0.05s" }}>{svc.tagline}</h3>

          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 400, color: isDark ? "#888" : "#666", lineHeight: 1.75, margin: "0 0 28px", maxWidth: 380, opacity: dlVisible ? 1 : 0, transform: dlVisible ? "translateY(0)" : "translateY(12px)", transition: "all 0.45s ease 0.1s" }}>{svc.body}</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 16px", marginBottom: 28, opacity: dlVisible ? 1 : 0, transition: "all 0.45s ease 0.15s" }}>
            {svc.deliverables.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: isDark ? "#E9F59E" : "#888", flexShrink: 0 }} />
                <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, fontWeight: 500, color: isDark ? "#AAA" : "#444" }}>{d}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "auto", paddingTop: 20, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, opacity: dlVisible ? 1 : 0, transition: "opacity 0.4s ease 0.2s" }}>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 800, color: isDark ? "#E9F59E" : "#111", letterSpacing: -0.5 }}>{svc.kpi}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, color: isDark ? "#555" : "#AAA", marginTop: 2 }}>{svc.time}</div>
            </div>
            <a href="#cadastro" style={{ background: isDark ? "#E9F59E" : "#111", color: isDark ? "#111" : "#F8F8F6", padding: "12px 24px", borderRadius: 8, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 700, textDecoration: "none", letterSpacing: 0.2, transition: "transform 0.2s, box-shadow 0.2s", display: "inline-block" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
              {ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── GAP SECTION ───────────────────────────────── */
function GapSection({ t }) {
  const [ref, vis] = useReveal(0);
  return (
    <section ref={ref} style={{ padding: "100px 52px", background: "#0D0D0D", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(233,245,158,0.03) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1040, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ ...rv(vis), fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(28px,3.5vw,46px)", color: "#F8F8F6", margin: "0 0 12px", letterSpacing: -0.5 }}>{t.gapTitle}</h2>
          <p style={{ ...rv(vis, 0.1), fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, color: "#555" }}>{t.gapSub}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 3, alignItems: "stretch" }}>
          {t.gapItems.map((col, i) => (
            <div key={i} style={{
              ...rv(vis, 0.1 + i * 0.1),
              background: col.highlight ? "#E9F59E" : "#141414",
              borderRadius: 16,
              padding: "36px 32px",
              border: col.highlight ? "none" : "1px solid #1C1C1C",
              transform: col.highlight ? "scaleY(1.04)" : "none",
              position: "relative",
            }}>
              {col.highlight && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#111", color: "#E9F59E", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 2, padding: "4px 14px", borderRadius: 20 }}>O MEIO VAZIO</div>}
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 700, color: col.highlight ? "#111" : "#333", marginBottom: 20, letterSpacing: 0.3 }}>{col.label}</div>
              {col.points.map((p, j) => (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: col.highlight ? "#2A3D00" : "#2A2A2A", flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: col.highlight ? "#2A3D00" : "#444", lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PROMO CODE SECTION ────────────────────────── */
function PromoSection({ t }) {
  const [ref, vis] = useReveal(0);
  const [igDone, setIgDone] = useState(false);
  const [ttDone, setTtDone] = useState(false);
  const [codeRevealed, setCodeRevealed] = useState(false);
  const bothDone = igDone && ttDone;

  return (
    <section ref={ref} style={{ padding: "80px 52px", background: "#111", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.02, backgroundImage: "repeating-linear-gradient(45deg, #E9F59E 0, #E9F59E 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px", pointerEvents: "none" }} />
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ ...rv(vis), fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#333", marginBottom: 16 }}>PROMO</div>
        <h2 style={{ ...rv(vis, 0.08), fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(28px,3.5vw,44px)", color: "#F8F8F6", margin: "0 0 16px", letterSpacing: -0.5 }}>{t.promoTitle}</h2>
        <p style={{ ...rv(vis, 0.14), fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, color: "#555", lineHeight: 1.7, marginBottom: 36 }}>{t.promoBody}</p>

        <div style={{ ...rv(vis, 0.18), display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <button onClick={() => { setIgDone(true); window.open("https://instagram.com/voku.one", "_blank"); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 22px", borderRadius: 10, border: igDone ? "1.5px solid #E9F59E" : "1.5px solid #2A2A2A", background: igDone ? "rgba(233,245,158,0.08)" : "transparent", color: igDone ? "#E9F59E" : "#555", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.3s" }}>
            <span style={{ fontSize: 16 }}>📸</span>
            {igDone ? "✓ " : ""}{t.promoInstagram}
          </button>
          <button onClick={() => { setTtDone(true); window.open("https://tiktok.com/@voku.one", "_blank"); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 22px", borderRadius: 10, border: ttDone ? "1.5px solid #E9F59E" : "1.5px solid #2A2A2A", background: ttDone ? "rgba(233,245,158,0.08)" : "transparent", color: ttDone ? "#E9F59E" : "#555", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.3s" }}>
            <span style={{ fontSize: 16 }}>🎵</span>
            {ttDone ? "✓ " : ""}{t.promoTikTok}
          </button>
        </div>

        {!codeRevealed && (
          <button onClick={() => bothDone && setCodeRevealed(true)}
            style={{ ...rv(vis, 0.22), padding: "14px 28px", borderRadius: 10, background: bothDone ? "#E9F59E" : "#1A1A1A", color: bothDone ? "#111" : "#333", border: "none", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: bothDone ? "pointer" : "default", transition: "all 0.4s", opacity: bothDone ? 1 : 0.5 }}>
            {t.promoAlready}
          </button>
        )}

        {codeRevealed && (
          <div style={{ marginTop: 8, padding: "20px 32px", background: "rgba(233,245,158,0.08)", border: "1.5px solid rgba(233,245,158,0.2)", borderRadius: 12, display: "inline-block" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, color: "#555", marginBottom: 8, letterSpacing: 1 }}>SEU CÓDIGO</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 28, fontWeight: 800, color: "#E9F59E", letterSpacing: 4 }}>VOKU15</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, color: "#444", marginTop: 8 }}>15% de desconto · válido por 7 dias</div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── PRICING SECTION ───────────────────────────── */
function PricingSection({ t }) {
  const [ref, vis] = useReveal(0);
  return (
    <section id="precos" ref={ref} style={{ padding: "112px 52px", background: "#F8F8F6" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ ...rv(vis), fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#CCC", marginBottom: 12 }}>{t.pricingLabel}</div>
          <h2 style={{ ...rv(vis, 0.08), fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(28px,4vw,50px)", color: "#111", margin: "0 0 14px", letterSpacing: -0.5 }}>{t.pricingTitle}</h2>
          <p style={{ ...rv(vis, 0.14), fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, color: "#AAA", fontStyle: "italic" }}>{t.pricingSub}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, alignItems: "start" }}>
          {t.plans.map((plan, i) => (
            <div key={plan.id} style={{
              ...rv(vis, 0.1 + i * 0.1),
              background: plan.highlight ? "#111" : "#fff",
              border: plan.highlight ? "none" : "1px solid #E8E8E0",
              borderRadius: 20,
              padding: "40px 32px",
              position: "relative",
              boxShadow: plan.highlight ? "0 32px 80px rgba(0,0,0,0.18)" : "0 4px 24px rgba(0,0,0,0.04)",
              transform: plan.highlight ? "translateY(-12px)" : "none",
            }}>
              {plan.badge && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#E9F59E", color: "#2A3D00", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "4px 16px", borderRadius: 20, whiteSpace: "nowrap" }}>
                  {plan.badge.toUpperCase()}
                </div>
              )}
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 700, color: plan.highlight ? "#555" : "#AAA", letterSpacing: 1, marginBottom: 20 }}>{plan.name.toUpperCase()}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 40, fontWeight: 800, color: plan.highlight ? "#F8F8F6" : "#111", letterSpacing: -1.5 }}>{plan.price}</span>
                <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, color: plan.highlight ? "#444" : "#AAA", fontWeight: 500 }}>{plan.period}</span>
              </div>
              <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, color: plan.highlight ? "#555" : "#888", lineHeight: 1.6, marginBottom: 28, minHeight: 40 }}>{plan.desc}</p>
              <div style={{ marginBottom: 32 }}>
                {plan.items.map((item, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <span style={{ color: plan.highlight ? "#E9F59E" : "#2A3D00", fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
                    <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, color: plan.highlight ? "#888" : "#555", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
              <a href="#cadastro" style={{ display: "block", textAlign: "center", padding: "14px 24px", borderRadius: 10, background: plan.highlight ? "#E9F59E" : "#111", color: plan.highlight ? "#111" : "#F8F8F6", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 700, textDecoration: "none", letterSpacing: 0.3, transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── REGISTER + AI FORM MODAL ──────────────────── */
function RegisterFlow({ t, lang, onClose }) {
  const [step, setStep] = useState("register"); // register | promo | form | chat | done
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState(null);
  const chatRef = useRef(null);

  const systemPrompt = lang === "PT"
    ? `Você é o assistente de qualificação da Voku, uma micro-agência digital especializada em marketing, automação e conteúdo. Seu papel é conversar naturalmente com o cliente para entender o projeto e montar um briefing estruturado. Seja direto, profissional e amigável. Faça perguntas uma de cada vez. Após 4-5 trocas, apresente um resumo do briefing e confirme com o cliente. Quando o cliente confirmar, responda APENAS com um JSON no formato: {"briefingConfirmado": true, "servico": "...", "objetivo": "...", "prazo": "...", "orcamento": "...", "resumo": "..."}`
    : lang === "EN"
    ? `You are Voku's qualification assistant, a digital micro-agency specializing in marketing, automation and content. Your role is to naturally converse with the client to understand the project and build a structured brief. Be direct, professional and friendly. Ask one question at a time. After 4-5 exchanges, present a briefing summary and confirm with the client. When confirmed, respond ONLY with JSON: {"briefingConfirmado": true, "servico": "...", "objetivo": "...", "prazo": "...", "orcamento": "...", "resumo": "..."}`
    : `Eres el asistente de calificación de Voku, una micro-agencia digital especializada en marketing, automatización y contenido. Tu papel es conversar naturalmente con el cliente para entender el proyecto y armar un briefing estructurado. Sé directo, profesional y amigable. Haz una pregunta a la vez. Después de 4-5 intercambios, presenta un resumen del briefing y confirma con el cliente. Cuando confirme, responde SOLO con JSON: {"briefingConfirmado": true, "servico": "...", "objetivo": "...", "prazo": "...", "orcamento": "...", "resumo": "..."}`;

  const firstMessage = lang === "PT"
    ? `Olá, ${name || "seja bem-vindo"}! 👋 Sou a IA da Voku. Vou te ajudar a montar o briefing do seu projeto — rápido e sem formulário longo.\n\nPara começar: **o que você precisa?** Marketing e copy, automação, conteúdo — ou uma combinação?`
    : lang === "EN"
    ? `Hi ${name || "there"}! 👋 I'm Voku's AI. I'll help you build your project brief — fast and without long forms.\n\nTo start: **what do you need?** Marketing & copy, automation, content — or a combination?`
    : `¡Hola ${name || ""}! 👋 Soy la IA de Voku. Te ayudaré a armar el briefing de tu proyecto — rápido y sin formularios largos.\n\n¿Para empezar: **qué necesitas?** Marketing y copy, automatización, contenido — ¿o una combinación?`;

  const startChat = () => {
    setStep("form");
    setMessages([{ role: "assistant", text: firstMessage }]);
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", text: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text }));
      const res = await fetch("https://nbxsfsuiwvoriyfwzezs.supabase.co/functions/v1/voku-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemPrompt,
          messages: apiMessages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "";

      // check for JSON briefing confirmation
      try {
        const jsonMatch = reply.match(/\{[\s\S]*"briefingConfirmado"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.briefingConfirmado) {
            setBriefing(parsed);
            setStep("done");
            return;
          }
        }
      } catch (_) {}

      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", text: lang === "PT" ? "Erro de conexão. Tente novamente." : "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const overlay = { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };
  const card = { background: "#F8F8F6", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.4)" };
  const labelStyle = { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 6, display: "block" };
  const inputStyle = { fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, color: "#111", background: "#fff", border: "1.5px solid #E0E0D8", borderRadius: 10, padding: "12px 14px", width: "100%", outline: "none", transition: "border-color 0.2s" };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={card}>
        {/* Header */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid #E8E8E0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>VOKU</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, color: "#AAA", marginTop: 2 }}>
              {step === "register" ? (lang === "PT" ? "Criar conta" : lang === "EN" ? "Create account" : "Crear cuenta") :
               step === "promo" ? "Promo Code" :
               step === "form" ? (lang === "PT" ? "Formulário inteligente" : lang === "EN" ? "Smart form" : "Formulario inteligente") :
               step === "done" ? (lang === "PT" ? "Briefing confirmado" : lang === "EN" ? "Brief confirmed" : "Briefing confirmado") : ""}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* step dots */}
            <div style={{ display: "flex", gap: 5 }}>
              {["register","promo","form","done"].map((s, i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: ["register","promo","form","done"].indexOf(step) >= i ? "#111" : "#DDD", transition: "background 0.3s" }} />
              ))}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#AAA", lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* STEP: REGISTER */}
        {step === "register" && (
          <div style={{ padding: "32px 28px", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: 26, color: "#111", margin: "0 0 8px" }}>
              {lang === "PT" ? "Crie sua conta grátis." : lang === "EN" ? "Create your free account." : "Crea tu cuenta gratuita."}
            </h3>
            <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, color: "#888", margin: "0 0 28px", lineHeight: 1.6 }}>
              {lang === "PT" ? "Sem cartão de crédito. Proposta em minutos." : lang === "EN" ? "No credit card. Proposal in minutes." : "Sin tarjeta de crédito. Propuesta en minutos."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>{lang === "PT" ? "Seu nome" : lang === "EN" ? "Your name" : "Tu nombre"}</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder={lang === "PT" ? "Como posso te chamar?" : lang === "EN" ? "What should I call you?" : "¿Cómo te llamo?"} style={inputStyle} onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#111"} onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#E0E0D8"} />
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" type="email" style={inputStyle} onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#111"} onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#E0E0D8"} />
              </div>
              <button
                onClick={() => email && name && setStep("promo")}
                style={{ padding: "14px", borderRadius: 10, background: email && name ? "#111" : "#E0E0D8", color: email && name ? "#F8F8F6" : "#AAA", border: "none", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 700, cursor: email && name ? "pointer" : "default", transition: "all 0.3s", marginTop: 4 }}>
                {lang === "PT" ? "Continuar →" : lang === "EN" ? "Continue →" : "Continuar →"}
              </button>
            </div>
            <div style={{ marginTop: 20, padding: "14px 16px", background: "#F0EFE8", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, color: "#888", lineHeight: 1.5 }}>
                {lang === "PT" ? "Seus dados ficam só aqui. Sem spam. Sem revenda." : lang === "EN" ? "Your data stays here. No spam. No resale." : "Tus datos se quedan aquí. Sin spam. Sin reventa."}
              </span>
            </div>
          </div>
        )}

        {/* STEP: PROMO */}
        {step === "promo" && (
          <div style={{ padding: "32px 28px", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: 24, color: "#111", margin: "0 0 8px" }}>
              {lang === "PT" ? `Olá, ${name}! 🎉` : lang === "EN" ? `Welcome, ${name}! 🎉` : `¡Bienvenido, ${name}! 🎉`}
            </h3>
            <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, color: "#888", margin: "0 0 24px", lineHeight: 1.6 }}>
              {lang === "PT" ? "Siga a Voku nas redes e ganhe 15% de desconto no seu projeto." : lang === "EN" ? "Follow Voku on social media and get 15% off your project." : "Sigue a Voku en redes sociales y obtén 15% de descuento en tu proyecto."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              <a href="https://instagram.com/voku.one" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#fff", border: "1.5px solid #E0E0D8", borderRadius: 10, textDecoration: "none", transition: "border-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#111"} onMouseLeave={e => e.currentTarget.style.borderColor = "#E0E0D8"}>
                <span style={{ fontSize: 20 }}>📸</span>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 600, color: "#111" }}>@voku.one no Instagram</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, color: "#AAA" }}>Abrir e seguir</div>
                </div>
              </a>
              <a href="https://tiktok.com/@voku.one" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#fff", border: "1.5px solid #E0E0D8", borderRadius: 10, textDecoration: "none", transition: "border-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#111"} onMouseLeave={e => e.currentTarget.style.borderColor = "#E0E0D8"}>
                <span style={{ fontSize: 20 }}>🎵</span>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 600, color: "#111" }}>@voku.one no TikTok</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, color: "#AAA" }}>Abrir e seguir</div>
                </div>
              </a>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{lang === "PT" ? "Tem um código promo?" : lang === "EN" ? "Have a promo code?" : "¿Tienes un código promo?"}</label>
              <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="VOKU15" style={inputStyle} onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#111"} onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#E0E0D8"} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep("form")} style={{ flex: 1, padding: "13px", borderRadius: 10, background: "transparent", color: "#888", border: "1.5px solid #E0E0D8", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {lang === "PT" ? "Pular" : lang === "EN" ? "Skip" : "Omitir"}
              </button>
              <button onClick={startChat} style={{ flex: 2, padding: "13px", borderRadius: 10, background: "#111", color: "#F8F8F6", border: "none", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {promoCode === "VOKU15" ? "✓ 15% OFF · " : ""}{lang === "PT" ? "Continuar →" : lang === "EN" ? "Continue →" : "Continuar →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP: AI FORM CHAT */}
        {step === "form" && (
          <>
            <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16, minHeight: 320, maxHeight: 400 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  {m.role === "assistant" && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0, fontSize: 11, color: "#E9F59E", fontWeight: 800 }}>V</div>
                  )}
                  <div style={{
                    maxWidth: "78%", padding: "11px 16px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: m.role === "user" ? "#111" : "#fff",
                    color: m.role === "user" ? "#F8F8F6" : "#111",
                    fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, lineHeight: 1.6,
                    border: m.role === "assistant" ? "1px solid #E8E8E0" : "none",
                    whiteSpace: "pre-wrap",
                  }}>
                    {m.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#E9F59E", fontWeight: 800 }}>V</div>
                  <div style={{ padding: "11px 16px", background: "#fff", borderRadius: "16px 16px 16px 4px", border: "1px solid #E8E8E0" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#CCC", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: "16px 20px", borderTop: "1px solid #E8E8E0", display: "flex", gap: 10, flexShrink: 0 }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder={lang === "PT" ? "Descreva seu projeto..." : lang === "EN" ? "Describe your project..." : "Describe tu proyecto..."} style={{ ...inputStyle, flex: 1, padding: "11px 14px" }} onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#111"} onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#E0E0D8"} />
              <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ padding: "11px 18px", borderRadius: 10, background: input.trim() ? "#111" : "#E0E0D8", color: input.trim() ? "#F8F8F6" : "#AAA", border: "none", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: input.trim() ? "pointer" : "default", transition: "all 0.2s" }}>→</button>
            </div>
          </>
        )}

        {/* STEP: DONE */}
        {step === "done" && briefing && (
          <div style={{ padding: "32px 28px", overflowY: "auto" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#E9F59E", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22 }}>✓</div>
              <h3 style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: 24, color: "#111", margin: "0 0 8px" }}>
                {lang === "PT" ? "Briefing confirmado!" : lang === "EN" ? "Brief confirmed!" : "¡Briefing confirmado!"}
              </h3>
              <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, color: "#888" }}>
                {lang === "PT" ? "Você receberá a proposta em até 2h no e-mail:" : lang === "EN" ? "You'll receive the proposal within 2h at:" : "Recibirás la propuesta en 2h en el email:"}
              </p>
              <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 700, color: "#111", margin: "4px 0 0" }}>{email}</p>
            </div>
            <div style={{ background: "#F0EFE8", borderRadius: 12, padding: "20px 20px" }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#AAA", marginBottom: 14 }}>RESUMO DO PROJETO</div>
              {[["Serviço", briefing.servico], ["Objetivo", briefing.objetivo], ["Prazo", briefing.prazo], ["Orçamento", briefing.orcamento]].filter(([,v]) => v).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#AAA", letterSpacing: 1 }}>{k.toUpperCase()}</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, color: "#111", marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{ width: "100%", marginTop: 20, padding: "14px", borderRadius: 10, background: "#111", color: "#F8F8F6", border: "none", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {lang === "PT" ? "Fechar" : lang === "EN" ? "Close" : "Cerrar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── HELPERS ───────────────────────────────────── */
const rv = (vis, delay = 0) => ({
  opacity: vis ? 1 : 0,
  transform: vis ? "translateY(0)" : "translateY(24px)",
  transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
});

/* ─── CUSTOM CURSOR ─────────────────────────────── */
function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [big, setBig] = useState(false);
  useEffect(() => {
    const move = e => setPos({ x: e.clientX, y: e.clientY });
    const over = e => { if (e.target.closest("a,button,[data-hover]")) setBig(true); };
    const out = () => setBig(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mouseout", out);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseover", over); window.removeEventListener("mouseout", out); };
  }, []);
  return (
    <div style={{ position: "fixed", zIndex: 9999, pointerEvents: "none", width: big ? 40 : 10, height: big ? 40 : 10, borderRadius: "50%", background: big ? "rgba(233,245,158,0.15)" : "#E9F59E", border: big ? "1.5px solid rgba(233,245,158,0.5)" : "none", transform: `translate(${pos.x - (big ? 20 : 5)}px, ${pos.y - (big ? 20 : 5)}px)`, transition: "width 0.2s, height 0.2s, background 0.2s, border 0.2s, transform 0.08s", mixBlendMode: "multiply" }} />
  );
}

function NoiseTexture() {
  return <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0.022, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundSize: "200px 200px" }} />;
}

/* ─── MAIN APP ──────────────────────────────────── */
export default function VokuLanding() {
  const [lang, setLang] = useState("PT");
  const [navSolid, setNavSolid] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const t = T[lang];
  const services = SVC[lang];

  const [statsRef, statsVis] = useReveal(0);
  const [exploreRef, exploreVis] = useReveal(0);
  const [processRef, processVis] = useReveal(0);
  const [proofRef, proofVis] = useReveal(0);
  const [ctaRef, ctaVis] = useReveal(0);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = FONTS; link.rel = "stylesheet";
    document.head.appendChild(link);
    setTimeout(() => setHeroVisible(true), 120);
  }, []);

  useEffect(() => {
    const fn = () => setNavSolid(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const tickerItems = {
    PT: ["Pacote Fixo", "Preço Visível", "Entrega em 24h", "Sem Reunião", "Sem Contrato Longo", "Copy que Converte", "Automação WhatsApp", "30 Posts/Mês", "Revisão Inclusa", "Sem Burocracia"],
    EN: ["Fixed Package", "Visible Pricing", "24h Delivery", "No Meetings", "No Long Contracts", "Converting Copy", "WhatsApp Automation", "30 Posts/Mo", "Revision Included", "No Bureaucracy"],
    ES: ["Paquete Fijo", "Precio Visible", "Entrega en 24h", "Sin Reuniones", "Sin Contrato Largo", "Copy que Convierte", "Automatización WA", "30 Posts/Mes", "Revisión Incluida", "Sin Burocracia"],
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "#F8F8F6", color: "#111", overflowX: "hidden", cursor: "none" }}>
      <CustomCursor />
      <NoiseTexture />
      {showModal && <RegisterFlow t={t} lang={lang} onClose={() => setShowModal(false)} />}

      {/* ══ NAV ══ */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 500, height: 64, background: navSolid ? "rgba(248,248,246,0.95)" : "transparent", backdropFilter: navSolid ? "blur(18px)" : "none", borderBottom: navSolid ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent", padding: "0 52px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.4s ease" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: -1 }}>VOKU</div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {t.nav.map((item, i) => (
            <a key={i} href={["#servicos", "#processo", "#precos"][i]} style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 500, color: "#888", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#111"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#888"}>{item}</a>
          ))}
          {/* lang */}
          <div style={{ display: "flex", gap: 2 }}>
            {["PT", "EN", "ES"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ background: lang === l ? "#111" : "transparent", color: lang === l ? "#F8F8F6" : "#AAA", border: "none", borderRadius: 5, padding: "4px 8px", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>{l}</button>
            ))}
          </div>
          <a href="/cliente" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 600, color: "#888", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#111"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#888"}>{lang === "PT" ? "Minha área" : lang === "EN" ? "My account" : "Mi cuenta"}</a>
          <button onClick={() => setShowModal(true)} style={{ background: "#111", color: "#F8F8F6", border: "none", borderRadius: 8, padding: "10px 20px", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#2A3D00"; (e.currentTarget as HTMLElement).style.color = "#E9F59E"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#111"; (e.currentTarget as HTMLElement).style.color = "#F8F8F6"; }}>{t.navCta}</button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 52px 80px", position: "relative", overflow: "hidden" }}>
        {/* bg orbs */}
        <div style={{ position: "absolute", top: "15%", right: "8%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(233,245,158,0.18) 0%, transparent 65%)", animation: "breathe 7s ease-in-out infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(233,245,158,0.08) 0%, transparent 65%)", animation: "breathe 9s ease-in-out 2s infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.025, backgroundImage: "linear-gradient(rgba(0,0,0,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.4) 1px,transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

        <div style={{ maxWidth: 840, position: "relative", zIndex: 2 }}>
          {/* eyebrow */}
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(16px)", transition: "all 0.6s ease 0.05s", display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(233,245,158,0.15)", border: "1px solid rgba(233,245,158,0.3)", borderRadius: 20, padding: "6px 14px", marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E9F59E", animation: "ping 2s ease-in-out infinite" }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#2A3D00", letterSpacing: 1.5 }}>{t.eyebrow.toUpperCase()}</span>
          </div>

          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(52px,8vw,96px)", fontWeight: 400, lineHeight: 0.98, letterSpacing: -3, margin: "0 0 28px", color: "#111" }}>
            <span style={{ display: "block", opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(28px)", transition: "all 0.7s ease 0.1s" }}>{t.h1a}</span>
            <span style={{ display: "block", opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(28px)", transition: "all 0.7s ease 0.18s" }}>{t.h1b}</span>
            <span style={{ display: "block", fontStyle: "italic", color: "#555", opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(28px)", transition: "all 0.7s ease 0.26s" }}>{t.h1italic}</span>
          </h1>

          <p style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: "all 0.65s ease 0.34s", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "clamp(15px,1.6vw,18px)", color: "#777", lineHeight: 1.65, marginBottom: 36, maxWidth: 540 }}>{t.sub}</p>

          {/* trust badges */}
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(16px)", transition: "all 0.6s ease 0.38s", display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 36 }}>
            {t.trustBadges.map((badge, i) => (
              <div key={i} style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, fontWeight: 600, color: "#888", background: "#fff", border: "1px solid #E0E0D8", borderRadius: 20, padding: "5px 12px", letterSpacing: 0.3 }}>
                {badge}
              </div>
            ))}
          </div>

          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: "all 0.65s ease 0.44s", display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button onClick={() => setShowModal(true)} style={{ background: "#111", color: "#F8F8F6", border: "none", borderRadius: 10, padding: "18px 40px", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3, transition: "all 0.3s" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#2A3D00"; (e.currentTarget as HTMLElement).style.color = "#E9F59E"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#111"; (e.currentTarget as HTMLElement).style.color = "#F8F8F6"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
              {t.cta}
            </button>
            <a href="#servicos" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "18px 28px", borderRadius: 10, border: "1.5px solid #E0E0D8", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 600, color: "#666", textDecoration: "none", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#111"; e.currentTarget.style.color = "#111"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#E0E0D8"; e.currentTarget.style.color = "#666"; }}>
              {t.ctaSec} ↓
            </a>
          </div>
        </div>

        {/* scroll hint */}
        <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", opacity: heroVisible ? 0.4 : 0, transition: "opacity 1s ease 1s", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 10, letterSpacing: 2, color: "#AAA" }}>{t.scrollHint.toUpperCase()}</span>
          <div style={{ width: 1, height: 32, background: "linear-gradient(to bottom, #AAA, transparent)", animation: "scrollLine 2s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ══ TICKER ══ */}
      <Ticker items={tickerItems[lang]} />

      {/* ══ STATS ══ */}
      <section ref={statsRef} style={{ padding: "80px 52px", background: "#fff", borderBottom: "1px solid #F0EFE8" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ ...rv(statsVis), fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#CCC", marginBottom: 40, textAlign: "center" }}>{t.statsLabel.toUpperCase()}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2 }}>
            {t.stats.map((s, i) => (
              <div key={i} style={{ ...rv(statsVis, i * 0.1), textAlign: "center", padding: "32px 24px", borderLeft: i > 0 ? "1px solid #F0EFE8" : "none" }}>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontSize: "clamp(36px,4vw,56px)", color: "#111", marginBottom: 8 }}>{statsVis ? s.n : "—"}</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: "#AAA", letterSpacing: 0.5, fontWeight: 500 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GAP SECTION ══ */}
      <GapSection t={t} />

      {/* ══ SERVICE EXPLORER ══ */}
      <section id="servicos" ref={exploreRef} style={{ padding: "112px 52px", background: "#F8F8F6" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ ...rv(exploreVis), fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#CCC", marginBottom: 10 }}>{t.exploreLabel}</div>
              <h2 style={{ ...rv(exploreVis, 0.08), fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(28px,4vw,48px)", color: "#111", margin: 0, letterSpacing: -0.5 }}>{t.exploreTitle}</h2>
            </div>
            <p style={{ ...rv(exploreVis, 0.12), fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, color: "#AAA", fontStyle: "italic" }}>{t.exploreSub}</p>
          </div>
          <div style={{ ...rv(exploreVis, 0.16) }}>
            <ServiceExplorer services={services} lang={lang} />
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF ══ */}
      <section ref={proofRef} style={{ padding: "80px 52px", background: "#fff" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <div style={{ ...rv(proofVis), fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#CCC", marginBottom: 28 }}>{t.proofLabel}</div>
          <blockquote style={{ ...rv(proofVis, 0.1), fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(18px,2.5vw,26px)", color: "#111", lineHeight: 1.5, margin: "0 0 20px", position: "relative" }}>
            <span style={{ position: "absolute", top: -20, left: -10, fontSize: 60, color: "#E9F59E", lineHeight: 1, fontFamily: "serif" }}>"</span>
            {t.proofQuote}
          </blockquote>
          <div style={{ ...rv(proofVis, 0.18), fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: "#AAA", letterSpacing: 0.5 }}>{t.proofAuthor}</div>

          {/* guarantee */}
          <div style={{ ...rv(proofVis, 0.24), marginTop: 48, padding: "28px 32px", background: "#F0EFE8", borderRadius: 16, textAlign: "left", display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#E9F59E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🛡️</div>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 6 }}>{t.guaranteeTitle}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, color: "#777", lineHeight: 1.65 }}>{t.guaranteeBody}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PROCESS ══ */}
      <section id="processo" ref={processRef} style={{ padding: "112px 52px", background: "#111", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(233,245,158,0.04) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1040, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ ...rv(processVis), marginBottom: 10 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#333" }}>{t.processLabel}</span>
          </div>
          <h2 style={{ ...rv(processVis, 0.08), fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(28px,4.5vw,52px)", color: "#F8F8F6", margin: "0 0 60px", letterSpacing: -0.5 }}>{t.processTitle}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2 }}>
            {t.steps.map((s, i) => (
              <div key={i} style={{ ...rv(processVis, 0.1 + i * 0.12), padding: "36px 24px", borderLeft: `1px solid ${i === 0 ? "#E9F59E" : "#1C1C1C"}`, position: "relative" }}>
                {i === 0 && <div style={{ position: "absolute", left: -1, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom, #E9F59E, transparent)" }} />}
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 11, color: "#E9F59E", letterSpacing: 2.5, marginBottom: 20 }}>{s.n}</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 16, color: "#F8F8F6", marginBottom: 10, lineHeight: 1.3 }}>{s.t}</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 300, fontSize: 13, color: "#555", lineHeight: 1.75 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <PricingSection t={t} />

      {/* ══ PROMO ══ */}
      <PromoSection t={t} />

      {/* ══ FINAL CTA ══ */}
      <section id="cadastro" ref={ctaRef} style={{ padding: "140px 52px", background: "#F8F8F6", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: "-20%", left: "50%", transform: "translateX(-50%)", width: 900, height: 500, background: "radial-gradient(ellipse, rgba(233,245,158,0.3) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <h2 style={{ ...rv(ctaVis), fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(38px,6vw,76px)", lineHeight: 1.05, letterSpacing: -1.5, color: "#111", marginBottom: 20 }}>
            {t.finalTitle}{" "}
            <span style={{ textDecoration: "underline", textDecorationColor: "#E9F59E", textDecorationThickness: 4, textUnderlineOffset: 6 }}>{t.finalHighlight}</span>
          </h2>
          <p style={{ ...rv(ctaVis, 0.1), fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, color: "#888", lineHeight: 1.7, marginBottom: 40 }}>{t.finalSub}</p>
          <button onClick={() => setShowModal(true)} style={{ ...rv(ctaVis, 0.18), background: "#111", color: "#F8F8F6", border: "none", borderRadius: 12, padding: "20px 52px", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", transition: "all 0.3s" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#2A3D00"; (e.currentTarget as HTMLElement).style.color = "#E9F59E"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 48px rgba(0,0,0,0.18)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#111"; (e.currentTarget as HTMLElement).style.color = "#F8F8F6"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)"; }}>
            {t.finalCta} →
          </button>
          <div style={{ ...rv(ctaVis, 0.24), marginTop: 20, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 12, color: "#CCC", letterSpacing: 1 }}>
            {t.footerLinks.join(" · ")}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: "#0A0A0A", padding: "28px 52px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 18, color: "#1E1E1E", letterSpacing: -0.5 }}>VOKU</div>
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11, color: "#2A2A2A", letterSpacing: 1 }}>voku.one · {t.footer}</div>
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 10, color: "#1E1E1E", letterSpacing: 0.5 }}>Voku LLC · Wyoming, USA · © 2025</div>
      </footer>

      <style>{`
        @keyframes scrollTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes breathe { 0%,100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.08); opacity: 1; } }
        @keyframes ping { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.6); opacity: 0.3; } }
        @keyframes scrollLine { 0%,100% { opacity: 0.3; transform: scaleY(1); } 50% { opacity: 1; transform: scaleY(0.7); } }
        @keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::selection { background: #E9F59E; color: #111; }
        a, button { cursor: none !important; }
        @media (max-width: 768px) {
          nav > div:last-child > a { display: none; }
          [style*="repeat(4,1fr)"] { grid-template-columns: 1fr 1fr !important; }
          [style*="repeat(3,1fr)"] { grid-template-columns: 1fr !important; }
          [style*="320px 1fr"] { grid-template-columns: 1fr !important; }
          [style*="1fr auto 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
