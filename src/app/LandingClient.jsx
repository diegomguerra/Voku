"use client";
import { useState, useEffect, useRef } from "react";

const FF = "'Inter', system-ui, sans-serif";
const C = {
  bg: "#F0EBE3",
  fg: "#1a1a1a",
  muted: "#666",
  mutedLight: "#999",
  border: "#D4CFC5",
  accent: "#AAFF00",
  accentFg: "#0D0D0D",
  dark: "#1a1a1a",
  darkFg: "#F0EBE3",
};

/* ─── COPY (trilingual) ─── */
const T = {
  PT: {
    nav: ["Serviços", "Processo", "Sobre"],
    navCta: "Começar projeto",
    hero: { eyebrow: "ESTÚDIO DE MÍDIA · IA", sub: "Pacotes fixos. Preço visível. Entrega em até 48h. Sem reunião, sem proposta, sem surpresa." },
    heroRight: { label: "BRIEFING PRONTO EM", big: "minutos", sub: "Nossa IA organiza tudo. Você responde 2 perguntas." },
    heroCta: { title: "Parece escrito por alguém que conhece sua marca há anos.", badges: "SEM REUNIÃO · PREÇO FIXO · REVISÃO INCLUSA", cta: "Começar projeto →", plans: "Ver planos ↓" },
    ticker: "REVISÃO INCLUSA ·  PREÇO FIXO EM BRL ·  ENTREGA GARANTIDA ·  ÁREA DO CLIENTE ·  BRIEFING EM MINUTOS ·  ESTÚDIO DE MÍDIA · IA ·  LANDING PAGE COPY ·  SOCIAL MEDIA PACK ·  EMAIL NURTURE ·  SEM REUNIÃO",
    portfolio: {
      label: "O QUE CRIAMOS",
      title: "CONTEÚDO QUE VENDE. PARA QUALQUER SEGMENTO.",
      sub: "Da ideia ao post pronto. Criamos peças visuais com IA — revisadas por humanos — que funcionam em qualquer plataforma e nicho.",
      bottom1: "Gerado com Fal.ai + Ideogram · Revisado pela equipe VOKU",
      bottom2: "Isto é apenas uma amostra. Criamos conteúdo sob medida para qualquer segmento.",
      cta: "Quero conteúdo assim",
    },
    pricing: {
      label: "PLANOS",
      title: "ESCOLHA. COMECE. CRIE.",
      sub: "Créditos mensais para gerar copy, posts e e-mails com a identidade da sua marca. Sem contrato longo. Cancele quando quiser.",
      more: "PRECISA DE MAIS?",
      moreSub: "Compre créditos avulsos sem alterar seu plano. Pagamento único.",
    },
    process: {
      label: "PROCESSO",
      title: "DO ZERO AO PRONTO.",
      sub: "Sem formulário longo. Sem reunião. Conversa direta com IA que já conhece sua marca.",
      stats: [{ n: "24h", l: "Landing Page" }, { n: "48h", l: "Social Pack" }, { n: "100%", l: "Revisão inclusa" }],
      steps: [
        { n: "01", t: "Cole o @ ou o link", d: "Nossa IA já conhece sua marca antes de começar." },
        { n: "02", t: "2 perguntas. Briefing feito.", d: "Nada de formulário longo. Conversa direta, contexto completo." },
        { n: "03", t: "Receba as opções", d: "Você escolhe, tica e aprova — não recebe arquivo final sem ver antes." },
        { n: "04", t: "Aprovado. Entregue.", d: "Download do arquivo final. Pronto para publicar." },
      ],
    },
    guarantee: { label: "GARANTIA", title: "NÃO GOSTOU? REFAZEMOS.", body: "Cada projeto inclui revisão por padrão. Se o resultado não atende, refazemos sem custo extra e sem questionamento.", cta: "Começar projeto →" },
    footer: {
      desc: "Estúdio de mídia com IA. Conteúdo profissional para marcas que não podem esperar.",
      col2label: "PRODUTOS", col2: ["Landing Page Copy", "Social Media Pack", "Email Nurture"],
      col3label: "ESTÚDIO", col3: ["Como funciona", "Área do Cliente", "Workana · Fiverr"],
      bottom1: "Voku LLC · Wyoming, USA", bottom2: "voku.one · © 2026",
    },
    beta: { tag: "ACESSO BETA LIBERADO", title: "7 dias grátis.", sub: "Acesso completo. Sem cartão. Sem compromisso.", items: ["Todos os produtos desbloqueados", "Chat com agente IA", "Landing pages, posts, e-mails", "Sem limite de projetos"], cta: "Ativar agora →", note: "Sem cartão de crédito. Cancele quando quiser." },
  },
  EN: {
    nav: ["Services", "Process", "About"],
    navCta: "Start project",
    hero: { eyebrow: "MEDIA STUDIO · AI", sub: "Fixed packages. Visible pricing. Delivery in 48h. No meetings, no proposals, no surprises." },
    heroRight: { label: "BRIEF READY IN", big: "minutes", sub: "Our AI organizes everything. You answer 2 questions." },
    heroCta: { title: "Looks like it was written by someone who's known your brand for years.", badges: "NO MEETINGS · FIXED PRICE · REVISION INCLUDED", cta: "Start project →", plans: "See plans ↓" },
    ticker: "REVISION INCLUDED ·  FIXED PRICE ·  GUARANTEED DELIVERY ·  CLIENT DASHBOARD ·  BRIEFING IN MINUTES ·  AI MEDIA STUDIO ·  LANDING PAGE COPY ·  SOCIAL MEDIA PACK ·  EMAIL NURTURE ·  NO MEETINGS",
    portfolio: {
      label: "WHAT WE CREATE",
      title: "CONTENT THAT SELLS. FOR ANY SEGMENT.",
      sub: "From idea to finished post. We create visual content with AI — reviewed by humans — that works on any platform and niche.",
      bottom1: "Generated with Fal.ai + Ideogram · Reviewed by VOKU team",
      bottom2: "This is just a sample. We create custom content for any segment.",
      cta: "I want content like this",
    },
    pricing: {
      label: "PLANS",
      title: "CHOOSE. START. CREATE.",
      sub: "Monthly credits to generate copy, posts and emails with your brand identity. No long contracts. Cancel anytime.",
      more: "NEED MORE?",
      moreSub: "Buy extra credits without changing your plan. One-time payment.",
    },
    process: {
      label: "PROCESS",
      title: "FROM ZERO TO DONE.",
      sub: "No long forms. No meetings. Direct conversation with AI that already knows your brand.",
      stats: [{ n: "24h", l: "Landing Page" }, { n: "48h", l: "Social Pack" }, { n: "100%", l: "Revision included" }],
      steps: [
        { n: "01", t: "Paste your @ or link", d: "Our AI already knows your brand before you start." },
        { n: "02", t: "2 questions. Brief done.", d: "No long forms. Direct conversation, complete context." },
        { n: "03", t: "Receive the options", d: "You choose, check and approve — no final file without your review." },
        { n: "04", t: "Approved. Delivered.", d: "Download the final file. Ready to publish." },
      ],
    },
    guarantee: { label: "GUARANTEE", title: "DON'T LIKE IT? WE REDO IT.", body: "Every project includes revision by default. If the result doesn't meet expectations, we redo it at no extra cost.", cta: "Start project →" },
    footer: {
      desc: "AI-powered media studio. Professional content for brands that can't wait.",
      col2label: "PRODUCTS", col2: ["Landing Page Copy", "Social Media Pack", "Email Nurture"],
      col3label: "STUDIO", col3: ["How it works", "Client Area", "Workana · Fiverr"],
      bottom1: "Voku LLC · Wyoming, USA", bottom2: "voku.one · © 2026",
    },
    beta: { tag: "BETA ACCESS UNLOCKED", title: "7 days free.", sub: "Full access. No card. No commitment.", items: ["All products unlocked", "AI agent chat", "Landing pages, posts, emails", "Unlimited projects"], cta: "Activate now →", note: "No credit card. Cancel anytime." },
  },
  ES: {
    nav: ["Servicios", "Proceso", "Acerca"],
    navCta: "Empezar proyecto",
    hero: { eyebrow: "ESTUDIO DE MEDIOS · IA", sub: "Paquetes fijos. Precio visible. Entrega en 48h. Sin reuniones, sin propuestas, sin sorpresas." },
    heroRight: { label: "BRIEFING LISTO EN", big: "minutos", sub: "Nuestra IA organiza todo. Respondes 2 preguntas." },
    heroCta: { title: "Parece escrito por alguien que conoce tu marca hace años.", badges: "SIN REUNIÓN · PRECIO FIJO · REVISIÓN INCLUIDA", cta: "Empezar proyecto →", plans: "Ver planes ↓" },
    ticker: "REVISIÓN INCLUIDA ·  PRECIO FIJO ·  ENTREGA GARANTIZADA ·  ÁREA DEL CLIENTE ·  BRIEFING EN MINUTOS ·  ESTUDIO DE MEDIOS · IA ·  LANDING PAGE COPY ·  SOCIAL MEDIA PACK ·  EMAIL NURTURE ·  SIN REUNIONES",
    portfolio: {
      label: "LO QUE CREAMOS",
      title: "CONTENIDO QUE VENDE. PARA CUALQUIER SEGMENTO.",
      sub: "De la idea al post listo. Creamos piezas visuales con IA — revisadas por humanos — que funcionan en cualquier plataforma y nicho.",
      bottom1: "Generado con Fal.ai + Ideogram · Revisado por el equipo VOKU",
      bottom2: "Esto es solo una muestra. Creamos contenido a medida para cualquier segmento.",
      cta: "Quiero contenido así",
    },
    pricing: {
      label: "PLANES",
      title: "ELIGE. EMPIEZA. CREA.",
      sub: "Créditos mensuales para generar copy, posts y emails con la identidad de tu marca. Sin contrato largo. Cancela cuando quieras.",
      more: "¿NECESITAS MÁS?",
      moreSub: "Compra créditos sueltos sin cambiar tu plan. Pago único.",
    },
    process: {
      label: "PROCESO",
      title: "DE CERO A LISTO.",
      sub: "Sin formularios largos. Sin reuniones. Conversación directa con IA que ya conoce tu marca.",
      stats: [{ n: "24h", l: "Landing Page" }, { n: "48h", l: "Social Pack" }, { n: "100%", l: "Revisión incluida" }],
      steps: [
        { n: "01", t: "Pega tu @ o link", d: "Nuestra IA ya conoce tu marca antes de empezar." },
        { n: "02", t: "2 preguntas. Brief listo.", d: "Nada de formularios largos. Conversación directa, contexto completo." },
        { n: "03", t: "Recibe las opciones", d: "Eliges, revisas y apruebas — no recibes archivo final sin verlo antes." },
        { n: "04", t: "Aprobado. Entregado.", d: "Descarga del archivo final. Listo para publicar." },
      ],
    },
    guarantee: { label: "GARANTÍA", title: "¿NO TE GUSTÓ? LO REHACEMOS.", body: "Cada proyecto incluye revisión por defecto. Si el resultado no cumple, lo rehacemos sin costo extra.", cta: "Empezar proyecto →" },
    footer: {
      desc: "Estudio de medios con IA. Contenido profesional para marcas que no pueden esperar.",
      col2label: "PRODUCTOS", col2: ["Landing Page Copy", "Social Media Pack", "Email Nurture"],
      col3label: "ESTUDIO", col3: ["Cómo funciona", "Área del Cliente", "Workana · Fiverr"],
      bottom1: "Voku LLC · Wyoming, USA", bottom2: "voku.one · © 2026",
    },
    beta: { tag: "ACCESO BETA LIBERADO", title: "7 días gratis.", sub: "Acceso completo. Sin tarjeta. Sin compromiso.", items: ["Todos los productos desbloqueados", "Chat con agente IA", "Landing pages, posts, emails", "Sin límite de proyectos"], cta: "Activar ahora →", note: "Sin tarjeta de crédito. Cancela cuando quieras." },
  },
};

/* ─── Portfolio images (Lovable-generated) ─── */
const P = "/portfolio";
const SHOWCASE = [
  { type: "REELS", niche: "SKINCARE", title: "Reels de produto com sérum anti-aging para marca de beleza.", image: `${P}/showcase-reels-skincare.jpg`, col: "1/2", row: "1/3" },
  { type: "POST INSTAGRAM", niche: "GASTRONOMIA", title: "Post de feed para restaurante gourmet com fotografia de produto.", image: `${P}/showcase-post-food.jpg`, col: "2/3", row: "1/2" },
  { type: "LANDING PAGE", niche: "MODA", title: "Landing page e-commerce para marca de streetwear.", image: `${P}/showcase-landing-fashion.jpg`, col: "2/4", row: "2/3" },
  { type: "CARROSSEL", niche: "FITNESS", title: "Carrossel educativo com dicas de treino para personal trainer.", image: `${P}/showcase-carousel-fitness.jpg`, col: "3/4", row: "1/2" },
  { type: "STORIES", niche: "IMOBILIÁRIO", title: "Stories de lançamento imobiliário com CTA de swipe up.", image: `${P}/showcase-stories-realestate.jpg`, col: "1/2", row: "3/5" },
  { type: "EMAIL MARKETING", niche: "BELEZA", title: "Newsletter de lançamento para marca premium de skincare.", image: `${P}/showcase-email-beauty.jpg`, col: "2/3", row: "3/4" },
  { type: "POST INSTAGRAM", niche: "ARQUITETURA", title: "Post de feed para estúdio de design de interiores corporativo.", image: `${P}/portfolio-interior-post.jpg`, col: "3/4", row: "3/4" },
  { type: "LANDING PAGE", niche: "INTERIORES", title: "Landing page para captação de leads no segmento corporativo.", image: `${P}/portfolio-interior-landing.jpg`, col: "2/4", row: "4/5" },
];

const CONTENT_TYPES = ["Posts", "Reels", "Stories", "Carrosséis", "Landing Pages", "E-mails"];

/* ─── Plans + Stripe ─── */
const PLANS = [
  { label: "STARTER", price: "R$149", credits: "100 créditos/mês", items: ["Landing pages, posts e e-mails", "Revisão inclusa", "Área do cliente", "Entrega em 24–48h"], href: "https://buy.stripe.com/fZu7sE33MgDL7Zu1324gg06", lime: false },
  { label: "PRO", price: "R$397", credits: "300 créditos/mês", items: ["Landing pages, posts e e-mails", "Revisão inclusa", "Área do cliente", "Entrega em 24–48h", "Suporte prioritário"], href: "https://buy.stripe.com/bJe14g47Q73bfrW6nm4gg0a", lime: false },
  { label: "BUSINESS", price: "R$897", credits: "800 créditos/mês", badge: "Mais popular", items: ["Landing pages, posts e e-mails", "Revisão inclusa", "Área do cliente", "Múltiplos projetos", "Histórico completo", "Suporte prioritário"], href: "https://buy.stripe.com/6oUfZa7k20ENcfKcLK4gg07", lime: true },
  { label: "ENTERPRISE", price: "R$1.997", credits: "2.000 créditos/mês", items: ["Tudo do Business +", "Onboarding dedicado", "SLA garantido"], href: "https://buy.stripe.com/5kQcMY6fYdrz4Ni7rq4gg09", lime: false, ctaLabel: "Falar com a equipe →" },
];
const CREDITS = [
  { n: "50", price: "R$49", href: "https://buy.stripe.com/eVq8wI33M87fcfKfXW4gg01" },
  { n: "200", price: "R$149", href: "https://buy.stripe.com/8x200ceMugDLenSaDC4gg08" },
  { n: "500", price: "R$297", href: "https://buy.stripe.com/6oU9AMdIq1IRgw02764gg02" },
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

/* ─── Shared styles ─── */
const S = {
  display: { fontSize: "clamp(3rem, 8vw, 6rem)", fontWeight: 700, textTransform: "uppercase", lineHeight: 0.9, letterSpacing: "-0.05em", margin: 0 },
  heading: { fontSize: "clamp(1.875rem, 5vw, 3rem)", fontWeight: 700, textTransform: "uppercase", lineHeight: 0.95, letterSpacing: "-0.02em", margin: 0 },
  subheading: { fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", color: C.muted, fontWeight: 500 },
  btnOutline: { border: `1px solid ${C.fg}`, color: C.fg, fontWeight: 600, padding: "10px 20px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", textDecoration: "none", transition: "all 0.2s", fontFamily: FF, cursor: "pointer", background: "transparent" },
};
const rv = (vis, d = 0) => ({ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(16px)", transition: `opacity 0.5s ease ${d}s, transform 0.5s ease ${d}s` });

/* ─── Logo ─── */
function LogoIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="1" y="1" width="7.5" height="7.5" rx="1" fill={C.accent} />
      <rect x="11.5" y="1" width="7.5" height="7.5" rx="1" fill={C.accent} />
      <rect x="1" y="11.5" width="7.5" height="7.5" rx="1" fill={C.accent} />
      <rect x="11.5" y="11.5" width="7.5" height="7.5" rx="1" fill={C.accent} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════ */
const BETA_MODE = true;

export default function VokuLanding() {
  const [lang, setLang] = useState("PT");
  const [mobileMenu, setMobileMenu] = useState(false);
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
  const [pricingRef, pricingVis] = useReveal(0);
  const [processRef, processVis] = useReveal(0);
  const [guaranteeRef, guaranteeVis] = useReveal(0);

  return (
    <div style={{ fontFamily: FF, background: C.bg, color: C.fg, WebkitFontSmoothing: "antialiased" }}>

      {/* ══ NAVBAR ══ */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: `${C.bg}ee`, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: C.fg }}>
            <LogoIcon size={18} />
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>VOKU</span>
          </a>

          {/* Desktop nav */}
          <div className="voku-nav-desktop" style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {t.nav.map((n, i) => <a key={i} href={`#s${i}`} style={{ fontSize: 14, color: C.muted, textDecoration: "none", fontWeight: 400, transition: "color 0.2s" }}>{n}</a>)}
            <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 999, overflow: "hidden" }}>
              {["PT", "EN", "ES"].map(l => (
                <button key={l} onClick={() => setLang(l)} style={{ fontFamily: FF, fontSize: 11, fontWeight: 500, padding: "6px 12px", border: "none", cursor: "pointer", background: lang === l ? C.fg : "transparent", color: lang === l ? C.bg : C.muted, transition: "all 0.2s" }}>{l}</button>
              ))}
            </div>
            <a href="/cliente" onClick={handleCta} style={S.btnOutline}>{t.navCta}</a>
          </div>

          {/* Mobile hamburger */}
          <button className="voku-nav-mobile-btn" onClick={() => setMobileMenu(!mobileMenu)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 4, color: C.fg }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d={mobileMenu ? "M6 6l12 12M6 18L18 6" : "M3 12h18M3 6h18M3 18h18"} /></svg>
          </button>
        </div>

        {mobileMenu && (
          <div style={{ background: C.bg, borderTop: `1px solid ${C.border}`, padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {t.nav.map((n, i) => <a key={i} href={`#s${i}`} onClick={() => setMobileMenu(false)} style={{ fontSize: 14, color: C.fg, textDecoration: "none" }}>{n}</a>)}
            <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 999, overflow: "hidden", width: "fit-content" }}>
              {["PT", "EN", "ES"].map(l => (
                <button key={l} onClick={() => { setLang(l); }} style={{ fontFamily: FF, fontSize: 11, fontWeight: 500, padding: "6px 12px", border: "none", cursor: "pointer", background: lang === l ? C.fg : "transparent", color: lang === l ? C.bg : C.muted }}>{l}</button>
              ))}
            </div>
            <a href="/cliente" onClick={handleCta} style={{ ...S.btnOutline, textAlign: "center", display: "block" }}>{t.navCta}</a>
          </div>
        )}
      </nav>

      {/* ══ HERO — Split Screen ══ */}
      <section style={{ minHeight: "100vh", paddingTop: 60, display: "grid", gridTemplateColumns: "1fr 1fr" }} className="voku-hero-grid">
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 48px" }}>
          <p style={{ ...S.subheading, marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 32, height: 1, background: C.muted, display: "inline-block" }} />
            {t.hero.eyebrow}
          </p>
          <h1 style={S.display}>
            SEU<br />
            <span style={{ opacity: 0.3 }}>CONTEÚDO.</span><br />
            <span style={{ fontWeight: 900 }}>PRONTO.</span>
          </h1>
          <div style={{ marginTop: 48 }}>
            <div style={{ width: "100%", height: 1, background: C.border, marginBottom: 32 }} />
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, maxWidth: 340, margin: 0 }}>{t.hero.sub}</p>
          </div>
        </div>

        {/* Right — Dark + Lime */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, background: C.dark, display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 48px" }}>
            <p style={{ ...S.subheading, color: `${C.darkFg}80`, marginBottom: 16 }}>{t.heroRight.label}</p>
            <h2 style={{ fontSize: "clamp(4rem, 9vw, 9rem)", fontWeight: 900, color: C.accent, lineHeight: 1, letterSpacing: "-0.03em", margin: 0 }}>{t.heroRight.big}</h2>
            <p style={{ fontSize: 14, color: `${C.darkFg}80`, marginTop: 24, maxWidth: 320 }}>{t.heroRight.sub}</p>
          </div>
          <div style={{ background: C.accent, padding: "48px", color: C.accentFg }}>
            <h3 style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", fontWeight: 700, lineHeight: 1.4, maxWidth: 400, marginBottom: 12 }}>{t.heroCta.title}</h3>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.7, marginBottom: 32 }}>{t.heroCta.badges}</p>
            <a href="/cliente" onClick={handleCta} style={{ display: "block", width: "100%", background: C.fg, color: C.bg, textAlign: "center", padding: "16px 0", fontWeight: 600, fontSize: 14, textDecoration: "none", transition: "opacity 0.2s" }}>{t.heroCta.cta}</a>
            <a href="#planos" style={{ display: "block", textAlign: "center", marginTop: 16, fontSize: 13, opacity: 0.7, color: "inherit", textDecoration: "none" }}>{t.heroCta.plans}</a>
          </div>
        </div>
      </section>

      {/* ══ MARQUEE ══ */}
      <div style={{ background: C.dark, padding: "12px 0", overflow: "hidden", borderTop: `1px solid ${C.accent}4D`, borderBottom: `1px solid ${C.accent}4D` }}>
        <div className="voku-ticker" style={{ display: "flex", whiteSpace: "nowrap" }}>
          {[0, 1].map(i => (
            <span key={i} style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", color: C.accent, textTransform: "uppercase", paddingRight: 24, flexShrink: 0 }}>
              {t.ticker} &nbsp;·&nbsp; {t.ticker} &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ══ PORTFOLIO ══ */}
      <section id="s0" ref={portfolioRef} style={{ padding: "96px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ ...rv(portfolioVis), marginBottom: 48 }}>
          <p style={{ ...S.subheading, marginBottom: 16 }}>{t.portfolio.label}</p>
          <h2 style={{ ...S.heading, maxWidth: 800 }}>{t.portfolio.title}</h2>
          <p style={{ fontSize: 14, color: C.muted, marginTop: 16, maxWidth: 540, lineHeight: 1.7 }}>{t.portfolio.sub}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
            {CONTENT_TYPES.map(type => (
              <span key={type} style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, border: `1px solid ${C.border}`, color: C.muted, padding: "6px 12px", borderRadius: 999 }}>{type}</span>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="voku-portfolio-grid" style={{ ...rv(portfolioVis, 0.15), display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridAutoRows: 260, gap: 3 }}>
          {SHOWCASE.map((item, i) => (
            <div key={i} className="voku-portfolio-item" style={{ position: "relative", overflow: "hidden", borderRadius: 8, cursor: "pointer", gridColumn: item.col, gridRow: item.row }}>
              <img src={item.image} alt={item.title} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s" }} />
              <div className="voku-overlay" style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${C.fg}E6 0%, ${C.fg}4D 50%, transparent 100%)` }} />
              <div style={{ position: "absolute", top: 12, left: 12, zIndex: 2, display: "flex", gap: 6 }}>
                <span style={{ fontSize: 10, background: C.accent, color: C.accentFg, padding: "4px 10px", borderRadius: 999, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.type}</span>
                <span style={{ fontSize: 10, background: `${C.fg}CC`, color: C.bg, padding: "4px 10px", borderRadius: 999, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.niche}</span>
              </div>
              <div className="voku-hover-text" style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, zIndex: 2 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: C.bg, margin: 0 }}>{item.title}</h3>
              </div>
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${C.fg}66 0%, transparent 50%)`, pointerEvents: "none" }} />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ ...rv(portfolioVis, 0.25), marginTop: 40, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <div>
            <p style={{ fontSize: 12, color: C.muted }}>{t.portfolio.bottom1}</p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{t.portfolio.bottom2}</p>
          </div>
          <a href="/cliente" onClick={handleCta} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.fg, color: C.bg, fontSize: 12, fontWeight: 600, padding: "12px 24px", borderRadius: 999, textDecoration: "none", transition: "all 0.3s" }}>
            {t.portfolio.cta} <span>→</span>
          </a>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="planos" ref={pricingRef} style={{ padding: "96px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={rv(pricingVis)}>
          <p style={{ ...S.subheading, marginBottom: 16 }}>{t.pricing.label}</p>
          <h2 style={{ ...S.heading, marginBottom: 16 }}>{t.pricing.title}</h2>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 48, maxWidth: 480, lineHeight: 1.7 }}>{t.pricing.sub}</p>
        </div>

        <div className="voku-plans-grid" style={{ ...rv(pricingVis, 0.1), display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 80 }}>
          {PLANS.map((plan) => (
            <div key={plan.label} style={{ padding: "24px", borderRadius: 2, border: `1px solid ${plan.lime ? C.accent : C.border}`, background: plan.lime ? C.accent : C.bg, color: plan.lime ? C.accentFg : C.fg, display: "flex", flexDirection: "column", position: "relative" }}>
              {plan.badge && <div style={{ position: "absolute", top: -1, right: -1, background: C.accent, color: C.accentFg, fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", padding: "5px 14px", textTransform: "uppercase" }}>{plan.badge}</div>}
              <p style={{ ...S.subheading, marginBottom: 8, color: plan.lime ? `${C.accentFg}99` : C.muted }}>{plan.label}</p>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 30, fontWeight: 700 }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: plan.lime ? `${C.accentFg}99` : C.muted }}>/mês</span>
              </div>
              <p style={{ fontSize: 12, marginBottom: 24, color: plan.lime ? `${C.accentFg}99` : C.muted }}>{plan.credits}</p>
              <ul style={{ flex: 1, listStyle: "none", padding: 0, margin: "0 0 32px 0", display: "flex", flexDirection: "column", gap: 8 }}>
                {plan.items.map(f => <li key={f} style={{ fontSize: 12, lineHeight: 1.6, color: plan.lime ? `${C.accentFg}CC` : C.muted }}>{f}</li>)}
              </ul>
              <a href={plan.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: plan.lime ? C.accentFg : C.fg, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                {plan.ctaLabel || "Começar agora"} <span>→</span>
              </a>
            </div>
          ))}
        </div>

        {/* Credit packs */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 48 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t.pricing.more}</h3>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 32 }}>{t.pricing.moreSub}</p>
          <div className="voku-credits-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {CREDITS.map(c => (
              <div key={c.n} style={{ border: `1px solid ${C.border}`, padding: 24, borderRadius: 2 }}>
                <p style={{ fontSize: 30, fontWeight: 700, marginBottom: 4 }}>{c.n}</p>
                <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 16 }}>CRÉDITOS</p>
                <p style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{c.price}</p>
                <a href={c.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: C.fg, textDecoration: "none", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 4 }}>COMPRAR <span>→</span></a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PROCESS ══ */}
      <section id="s1" ref={processRef} style={{ background: C.dark, padding: "96px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="voku-process-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64 }}>
            <div style={rv(processVis)}>
              <p style={{ ...S.subheading, color: `${C.darkFg}66`, marginBottom: 16 }}>{t.process.label}</p>
              <h2 style={{ ...S.heading, color: C.darkFg, marginBottom: 32 }}>{t.process.title}</h2>
              <p style={{ fontSize: 14, color: `${C.darkFg}80`, lineHeight: 1.75, marginBottom: 48, maxWidth: 340 }}>{t.process.sub}</p>
              <div style={{ display: "flex", gap: 32 }}>
                {t.process.stats.map(stat => (
                  <div key={stat.n}>
                    <p style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 700, color: C.accent, margin: 0 }}>{stat.n}</p>
                    <p style={{ fontSize: 11, color: `${C.darkFg}66`, marginTop: 4 }}>{stat.l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {t.process.steps.map((step, i) => (
                <div key={step.n} style={{ ...rv(processVis, 0.1 + i * 0.08), borderTop: `1px solid ${C.darkFg}1A`, padding: "24px 0" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 8 }}>{step.n}</p>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: C.darkFg, marginBottom: 8 }}>{step.t}</h3>
                  <p style={{ fontSize: 14, color: `${C.darkFg}80`, lineHeight: 1.6 }}>{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ GUARANTEE ══ */}
      <section ref={guaranteeRef} style={{ background: C.accent, padding: "96px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <p style={{ ...rv(guaranteeVis), ...S.subheading, color: `${C.accentFg}80`, marginBottom: 16 }}>{t.guarantee.label}</p>
          <h2 style={{ ...rv(guaranteeVis, 0.08), ...S.heading, color: C.accentFg, marginBottom: 24, maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>{t.guarantee.title}</h2>
          <p style={{ ...rv(guaranteeVis, 0.14), fontSize: 14, color: `${C.accentFg}B3`, maxWidth: 420, margin: "0 auto 40px", lineHeight: 1.7 }}>{t.guarantee.body}</p>
          <a href="/cliente" onClick={handleCta} style={{ ...rv(guaranteeVis, 0.2), display: "inline-block", background: C.fg, color: C.bg, fontWeight: 600, padding: "16px 40px", fontSize: 14, textDecoration: "none", borderRadius: 2, transition: "opacity 0.2s" }}>{t.guarantee.cta}</a>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: C.dark, padding: "64px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="voku-footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 64 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  {[0,1,2,3].map(i => <div key={i} style={{ width: 8, height: 8, background: C.accent, borderRadius: 1 }} />)}
                </div>
                <span style={{ fontWeight: 700, color: C.darkFg }}>VOKU</span>
              </div>
              <p style={{ fontSize: 12, color: `${C.darkFg}66`, lineHeight: 1.7, maxWidth: 280 }}>{t.footer.desc}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: `${C.darkFg}66`, marginBottom: 16 }}>{t.footer.col2label}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {t.footer.col2.map(l => <span key={l} style={{ fontSize: 14, color: `${C.darkFg}99` }}>{l}</span>)}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: `${C.darkFg}66`, marginBottom: 16 }}>{t.footer.col3label}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {t.footer.col3.map((l, i) => {
                  const href = i === 1 ? "/cliente" : i === 0 ? "#s1" : null;
                  return href
                    ? <a key={l} href={href} style={{ fontSize: 14, color: `${C.darkFg}99`, textDecoration: "none" }}>{l}</a>
                    : <span key={l} style={{ fontSize: 14, color: `${C.darkFg}99` }}>{l}</span>;
                })}
              </div>
            </div>
            <div />
          </div>
          <div style={{ borderTop: `1px solid ${C.darkFg}1A`, paddingTop: 32, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: `${C.darkFg}4D` }}>{t.footer.bottom1}</span>
            <span style={{ fontSize: 12, color: `${C.darkFg}4D` }}>{t.footer.bottom2}</span>
          </div>
        </div>
      </footer>

      {/* ══ BETA MODAL ══ */}
      {betaModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setBetaModal(false); }} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#111", border: `1.5px solid ${C.accent}`, borderRadius: 4, padding: "48px 40px", maxWidth: 440, width: "100%", textAlign: "center", position: "relative", animation: "modalIn 0.35s ease forwards" }}>
            <button onClick={() => setBetaModal(false)} style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", color: "#444", fontSize: 22, cursor: "pointer" }}>×</button>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: C.accent, marginBottom: 24 }}>{t.beta.tag}</div>
            <div style={{ fontWeight: 900, fontSize: 28, color: "#fff", lineHeight: 1.1, marginBottom: 12, letterSpacing: -1 }}>{t.beta.title}</div>
            <div style={{ fontSize: 14, color: "#888", lineHeight: 1.7, marginBottom: 32 }}>{t.beta.sub}</div>
            <div style={{ height: 1, background: "#222", marginBottom: 24 }} />
            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
              {t.beta.items.map(item => (
                <div key={item} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: C.accent, fontWeight: 700, fontSize: 13 }}>→</span>
                  <span style={{ color: "#fff", fontSize: 13 }}>{item}</span>
                </div>
              ))}
            </div>
            <a href="/cliente" style={{ display: "block", background: C.accent, color: "#111", fontWeight: 800, fontSize: 14, padding: 16, textDecoration: "none", textAlign: "center" }}>{t.beta.cta}</a>
            <div style={{ fontSize: 11, color: "#444", marginTop: 14 }}>{t.beta.note}</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .voku-ticker { animation: ticker 30s linear infinite; }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .voku-portfolio-item img { transition: transform 0.7s; }
        .voku-portfolio-item:hover img { transform: scale(1.05); }
        .voku-portfolio-item .voku-overlay { opacity: 0; transition: opacity 0.5s; }
        .voku-portfolio-item:hover .voku-overlay { opacity: 1; }
        .voku-portfolio-item .voku-hover-text { transform: translateY(1rem); opacity: 0; transition: all 0.5s; }
        .voku-portfolio-item:hover .voku-hover-text { transform: translateY(0); opacity: 1; }
        @media (max-width: 768px) {
          .voku-hero-grid { grid-template-columns: 1fr !important; }
          .voku-process-grid { grid-template-columns: 1fr !important; }
          .voku-plans-grid { grid-template-columns: 1fr !important; }
          .voku-credits-grid { grid-template-columns: 1fr !important; }
          .voku-portfolio-grid { grid-template-columns: 1fr !important; }
          .voku-portfolio-grid > * { grid-column: span 1 !important; grid-row: span 1 !important; }
          .voku-footer-grid { grid-template-columns: 1fr !important; }
          .voku-nav-desktop { display: none !important; }
          .voku-nav-mobile-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
