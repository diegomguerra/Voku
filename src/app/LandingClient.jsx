"use client";
import { useState, useEffect, useRef } from "react";

/* ─── COPY (trilingual) ─── */
const T = {
  PT: {
    nav: ["Serviços", "Processo", "Sobre"],
    navCta: "Começar projeto",
    hero: { eyebrow: "ESTÚDIO DE MÍDIA · IA", sub: "Pacotes fixos. Preço visível. Entrega em até 48h. Sem reunião, sem proposta, sem surpresa." },
    heroRight: { label: "BRIEFING PRONTO EM", big: "minutos", sub: "Nossa IA organiza tudo. Você responde 2 perguntas." },
    heroCta: { title: "Parece escrito por alguém que conhece sua marca há anos.", badges: "SEM REUNIÃO · PREÇO FIXO · REVISÃO INCLUSA", cta: "Começar projeto →", plans: "Ver planos ↓" },
    ticker: "REVISÃO INCLUSA · PREÇO FIXO EM BRL · ENTREGA GARANTIDA · ÁREA DO CLIENTE · BRIEFING EM MINUTOS · ESTÚDIO DE MÍDIA · IA · LANDING PAGE COPY · SOCIAL MEDIA PACK · EMAIL NURTURE · SEM REUNIÃO",
    portfolio: {
      label: "O QUE CRIAMOS",
      title: "CONTEÚDO QUE VENDE. PARA QUALQUER SEGMENTO.",
      sub: "Da ideia ao post pronto. Criamos peças visuais com IA — revisadas por humanos — que funcionam em qualquer plataforma e nicho.",
      tabs: ["Wellness & Beleza", "Agronegócio", "Tech & Serviços"],
      caption1: "Wellness & Beleza · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption1b: "Entrega completa em 48h",
      caption2: "Agronegócio · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption2b: "Entrega completa em 48h",
      caption3: "Tech & Serviços · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption3b: "Entrega completa em 48h",
      bottom1: "Gerado com Fal.ai + Ideogram · Revisado pela equipe VOKU",
      bottom2: "Isto é apenas uma amostra. Criamos conteúdo sob medida para qualquer segmento.",
      cta: "Quero conteúdo assim",
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
      title: "DO ZERO AO PRONTO.",
      sub: "Sem formulário longo. Sem reunião. Conversa direta com IA que já conhece sua marca.",
      steps: [
        { n: "01", t: "Cole o @ ou o link", d: "Nossa IA já conhece sua marca antes de começar." },
        { n: "02", t: "2 perguntas. Briefing feito.", d: "Nada de formulário longo. Conversa direta, contexto completo." },
        { n: "03", t: "Receba as opções", d: "Você escolhe, tica e aprova — não recebe arquivo final sem ver antes." },
        { n: "04", t: "Aprovado. Entregue.", d: "Download do arquivo final. Pronto para publicar." },
      ],
    },
    pricing: {
      label: "PLANOS",
      title: "ESCOLHA. COMECE. CRIE.",
      sub: "Créditos mensais para gerar copy, posts e e-mails com a identidade da sua marca. Sem contrato longo. Cancele quando quiser.",
      more: "PRECISA DE MAIS?",
      moreSub: "Compre créditos avulsos sem alterar seu plano. Pagamento único.",
    },
    guarantee: { label: "GARANTIA", title: "NÃO GOSTOU? REFAZEMOS.", body: "Cada projeto inclui revisão por padrão. Se o resultado não atende, refazemos sem custo extra e sem questionamento.", cta: "Começar projeto →" },
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
    hero: { eyebrow: "MEDIA STUDIO · AI", sub: "Fixed packages. Visible pricing. Delivery in 48h. No meetings, no proposals, no surprises." },
    heroRight: { label: "BRIEF READY IN", big: "minutes", sub: "Our AI organizes everything. You answer 2 questions." },
    heroCta: { title: "Looks like it was written by someone who's known your brand for years.", badges: "NO MEETINGS · FIXED PRICE · REVISION INCLUDED", cta: "Start project →", plans: "See plans ↓" },
    ticker: "REVISION INCLUDED · FIXED PRICE · GUARANTEED DELIVERY · CLIENT DASHBOARD · BRIEFING IN MINUTES · AI MEDIA STUDIO · LANDING PAGE COPY · SOCIAL MEDIA PACK · EMAIL NURTURE · NO MEETINGS",
    portfolio: {
      label: "WHAT WE CREATE",
      title: "CONTENT THAT SELLS. FOR ANY SEGMENT.",
      sub: "From idea to finished post. We create visual content with AI — reviewed by humans — that works on any platform and niche.",
      tabs: ["Wellness & Beauty", "Agribusiness", "Tech & Services"],
      caption1: "Wellness & Beauty · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption1b: "Full delivery in 48h",
      caption2: "Agribusiness · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption2b: "Full delivery in 48h",
      caption3: "Tech & Services · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption3b: "Full delivery in 48h",
      bottom1: "Generated with Fal.ai + Ideogram · Reviewed by VOKU team",
      bottom2: "This is just a sample. We create custom content for any segment.",
      cta: "I want content like this",
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
      title: "FROM ZERO TO DONE.",
      sub: "No long forms. No meetings. Direct conversation with AI that already knows your brand.",
      steps: [
        { n: "01", t: "Paste your @ or link", d: "Our AI already knows your brand before you start." },
        { n: "02", t: "2 questions. Brief done.", d: "No long forms. Direct conversation, complete context." },
        { n: "03", t: "Receive the options", d: "You choose, check and approve — no final file without your review." },
        { n: "04", t: "Approved. Delivered.", d: "Download the final file. Ready to publish." },
      ],
    },
    pricing: {
      label: "PLANS",
      title: "CHOOSE. START. CREATE.",
      sub: "Monthly credits to generate copy, posts and emails with your brand's identity. No long contracts. Cancel anytime.",
      more: "NEED MORE?",
      moreSub: "Buy extra credits without changing your plan. One-time payment.",
    },
    guarantee: { label: "GUARANTEE", title: "DON'T LIKE IT? WE REDO IT.", body: "Every project includes revision by default. If the result doesn't meet expectations, we redo it at no extra cost.", cta: "Start project →" },
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
    hero: { eyebrow: "ESTUDIO DE MEDIOS · IA", sub: "Paquetes fijos. Precio visible. Entrega en 48h. Sin reuniones, sin propuestas, sin sorpresas." },
    heroRight: { label: "BRIEFING LISTO EN", big: "minutos", sub: "Nuestra IA organiza todo. Respondes 2 preguntas." },
    heroCta: { title: "Parece escrito por alguien que conoce tu marca hace años.", badges: "SIN REUNIÓN · PRECIO FIJO · REVISIÓN INCLUIDA", cta: "Empezar proyecto →", plans: "Ver planes ↓" },
    ticker: "REVISIÓN INCLUIDA · PRECIO FIJO · ENTREGA GARANTIZADA · ÁREA DEL CLIENTE · BRIEFING EN MINUTOS · ESTUDIO DE MEDIOS · IA · LANDING PAGE COPY · SOCIAL MEDIA PACK · EMAIL NURTURE · SIN REUNIONES",
    portfolio: {
      label: "LO QUE CREAMOS",
      title: "CONTENIDO QUE VENDE. PARA CUALQUIER SEGMENTO.",
      sub: "De la idea al post listo. Creamos piezas visuales con IA — revisadas por humanos — que funcionan en cualquier plataforma y nicho.",
      tabs: ["Wellness & Belleza", "Agronegocio", "Tech & Servicios"],
      caption1: "Wellness & Belleza · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption1b: "Entrega completa en 48h",
      caption2: "Agronegocio · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption2b: "Entrega completa en 48h",
      caption3: "Tech & Servicios · Social Media Pack (12 posts) + Landing Page Copy + Email Nurture",
      caption3b: "Entrega completa en 48h",
      bottom1: "Generado con Fal.ai + Ideogram · Revisado por el equipo VOKU",
      bottom2: "Esto es solo una muestra. Creamos contenido a medida para cualquier segmento.",
      cta: "Quiero contenido así",
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
      title: "DE CERO A LISTO.",
      sub: "Sin formularios largos. Sin reuniones. Conversación directa con IA que ya conoce tu marca.",
      steps: [
        { n: "01", t: "Pega tu @ o link", d: "Nuestra IA ya conoce tu marca antes de empezar." },
        { n: "02", t: "2 preguntas. Brief listo.", d: "Nada de formularios largos. Conversación directa, contexto completo." },
        { n: "03", t: "Recibe las opciones", d: "Eliges, revisas y apruebas — no recibes archivo final sin verlo antes." },
        { n: "04", t: "Aprobado. Entregado.", d: "Descarga del archivo final. Listo para publicar." },
      ],
    },
    pricing: {
      label: "PLANES",
      title: "ELIGE. EMPIEZA. CREA.",
      sub: "Créditos mensuales para generar copy, posts y emails con la identidad de tu marca. Sin contrato largo. Cancela cuando quieras.",
      more: "¿NECESITAS MÁS?",
      moreSub: "Compra créditos sueltos sin cambiar tu plan. Pago único.",
    },
    guarantee: { label: "GARANTÍA", title: "¿NO TE GUSTÓ? LO REHACEMOS.", body: "Cada proyecto incluye revisión por defecto. Si el resultado no cumple, lo rehacemos sin costo extra.", cta: "Empezar proyecto →" },
    footer: {
      desc: "Estudio de medios con IA. Contenido profesional para marcas que no pueden esperar.",
      col2label: "PRODUCTOS", col2: ["Landing Page Copy", "Social Media Pack", "Email Nurture"],
      col3label: "ESTUDIO", col3: ["Cómo funciona", "Área del Cliente", "Workana · Fiverr"],
      bottom1: "Voku LLC · Wyoming, USA", bottom2: "voku.one · © 2026",
    },
  },
};

/* ─── Portfolio images (Supabase) ─── */
const STORAGE = "https://movfynswogmookzcjijt.supabase.co/storage/v1/object/public/imagens/portfolio";
const IMG = {
  skincare: `${STORAGE}/skincare-01.png`,
  wellness: `${STORAGE}/wellness-02.png`,
  drink: `${STORAGE}/drink-03.png`,
  agro: `${STORAGE}/agro-04.png`,
  tech: `${STORAGE}/tech-05.png`,
  product: `${STORAGE}/product-06.png`,
};

const SHOWCASE = [
  { type: "REELS", niche: "SKINCARE", title: "Reels de produto com sérum anti-aging para marca de beleza.", image: IMG.skincare, span: "md:col-span-1 md:row-span-2" },
  { type: "POST INSTAGRAM", niche: "GASTRONOMIA", title: "Post de feed para restaurante gourmet com fotografia de produto.", image: IMG.drink, span: "md:col-span-1 md:row-span-1" },
  { type: "LANDING PAGE", niche: "MODA", title: "Landing page e-commerce para marca de streetwear.", image: IMG.agro, span: "md:col-span-2 md:row-span-1" },
  { type: "CARROSSEL", niche: "FITNESS", title: "Carrossel educativo com dicas de treino para personal trainer.", image: IMG.wellness, span: "md:col-span-1 md:row-span-1" },
  { type: "STORIES", niche: "IMOBILIÁRIO", title: "Stories de lançamento imobiliário com CTA de swipe up.", image: IMG.tech, span: "md:col-span-1 md:row-span-2" },
  { type: "EMAIL MARKETING", niche: "BELEZA", title: "Newsletter de lançamento para marca premium de skincare.", image: IMG.product, span: "md:col-span-1 md:row-span-1" },
  { type: "POST INSTAGRAM", niche: "ARQUITETURA", title: "Post para estúdio de design de interiores corporativo.", image: IMG.skincare, span: "md:col-span-1 md:row-span-1" },
  { type: "LANDING PAGE", niche: "INTERIORES", title: "Landing page para captação de leads no segmento corporativo.", image: IMG.agro, span: "md:col-span-2 md:row-span-1" },
];

const CONTENT_TYPES = ["Posts", "Reels", "Stories", "Carrosséis", "Landing Pages", "E-mails"];

/* ─── Plans + Stripe links ─── */
const PLANS = [
  { label: "STARTER", price: "R$149", credits: "100 créditos/mês", items: ["Landing pages, posts e e-mails", "Revisão inclusa em todos os projetos", "Área do cliente com aprovação", "Entrega em 24–48h"], href: "https://buy.stripe.com/fZu7sE33MgDL7Zu1324gg06", highlighted: false },
  { label: "PRO", price: "R$397", credits: "300 créditos/mês", items: ["Landing pages, posts e e-mails", "Revisão inclusa em todos os projetos", "Área do cliente com aprovação", "Entrega em 24–48h", "Suporte prioritário por e-mail"], href: "https://buy.stripe.com/bJe14g47Q73bfrW6nm4gg0a", highlighted: false },
  { label: "BUSINESS", price: "R$897", credits: "800 créditos/mês", badge: "Mais popular", items: ["Landing pages, posts e e-mails", "Revisão inclusa em todos os projetos", "Área do cliente com aprovação", "Volume para múltiplos projetos", "Histórico completo de entregas", "Suporte prioritário por e-mail"], href: "https://buy.stripe.com/6oUfZa7k20ENcfKcLK4gg07", highlighted: true },
  { label: "ENTERPRISE", price: "R$1.997", credits: "2.000 créditos/mês", items: ["Landing pages, posts e e-mails", "Revisão inclusa em todos os projetos", "Área do cliente com aprovação", "Volume para múltiplos projetos", "Histórico completo de entregas", "Suporte prioritário por e-mail", "Onboarding dedicado", "SLA garantido"], href: "https://buy.stripe.com/5kQcMY6fYdrz4Ni7rq4gg09", highlighted: false, ctaLabel: "Falar com a equipe →" },
];

const CREDIT_PACKS = [
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

/* ─── Logo ─── */
function LogoIcon({ size = 20 }) {
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

  const rv = (vis, d = 0) => ({ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(16px)", transition: `opacity 0.5s ease ${d}s, transform 0.5s ease ${d}s` });

  return (
    <div className="voku-landing min-h-screen">

      {/* ══ NAVBAR ══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b" style={{ background: "hsl(40 23% 95% / 0.9)", borderColor: "hsl(40 10% 85%)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <LogoIcon size={18} />
            <span className="text-lg font-bold tracking-tight">VOKU</span>
          </a>

          <div className="voku-nav-desktop hidden md:flex items-center gap-8">
            <a href="#servicos" className="text-sm hover:opacity-100 transition-colors" style={{ color: "hsl(0 0% 40%)" }}>
              {t.nav[0]}
            </a>
            <a href="#processo" className="text-sm hover:opacity-100 transition-colors" style={{ color: "hsl(0 0% 40%)" }}>
              {t.nav[1]}
            </a>
            <a href="#sobre" className="text-sm hover:opacity-100 transition-colors" style={{ color: "hsl(0 0% 40%)" }}>
              {t.nav[2]}
            </a>

            {/* Language switcher */}
            <div className="flex items-center gap-0 border rounded-full overflow-hidden text-xs" style={{ borderColor: "hsl(40 10% 85%)" }}>
              {["PT", "EN", "ES"].map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className="px-3 py-1.5 font-medium transition-colors"
                  style={{ background: lang === l ? "hsl(0 0% 10%)" : "transparent", color: lang === l ? "hsl(40 23% 95%)" : "hsl(0 0% 40%)", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.75rem" }}>
                  {l}
                </button>
              ))}
            </div>

            <a href="/cliente" onClick={handleCta} className="voku-btn-outline text-xs py-2.5 px-5">
              {t.navCta}
            </a>
          </div>

          {/* Mobile menu button */}
          <button className="voku-nav-mobile-btn md:hidden" style={{ display: "none", background: "none", border: "none", cursor: "pointer" }} onClick={() => setMobileMenu(!mobileMenu)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d={mobileMenu ? "M6 6l12 12M6 18L18 6" : "M3 12h18M3 6h18M3 18h18"} /></svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden px-6 py-6 flex flex-col gap-4 border-t" style={{ background: "hsl(40 23% 95%)", borderColor: "hsl(40 10% 85%)" }}>
            <a href="#servicos" className="text-sm" onClick={() => setMobileMenu(false)}>{t.nav[0]}</a>
            <a href="#processo" className="text-sm" onClick={() => setMobileMenu(false)}>{t.nav[1]}</a>
            <a href="#sobre" className="text-sm" onClick={() => setMobileMenu(false)}>{t.nav[2]}</a>
            <div className="flex gap-0 border rounded-full overflow-hidden text-xs w-fit" style={{ borderColor: "hsl(40 10% 85%)" }}>
              {["PT", "EN", "ES"].map(l => (
                <button key={l} onClick={() => setLang(l)} className="px-3 py-1.5 font-medium"
                  style={{ background: lang === l ? "hsl(0 0% 10%)" : "transparent", color: lang === l ? "hsl(40 23% 95%)" : "hsl(0 0% 40%)", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.75rem" }}>
                  {l}
                </button>
              ))}
            </div>
            <a href="/cliente" onClick={handleCta} className="voku-btn-primary text-center text-xs" style={{ padding: "12px 20px" }}>
              {t.navCta}
            </a>
          </div>
        )}
      </nav>

      {/* ══ HERO — Split Screen ══ */}
      <section className="min-h-screen pt-20 grid grid-cols-1 lg:grid-cols-2 voku-hero-grid">
        {/* Left */}
        <div className="flex flex-col justify-center px-8 md:px-16 lg:px-20 py-20">
          <p className="voku-text-subheading mb-8 flex items-center gap-3">
            <span className="w-8 h-px" style={{ background: "hsl(0 0% 40%)" }} />
            {t.hero.eyebrow}
          </p>
          <h1 className="voku-text-display">
            SEU<br />
            <span style={{ opacity: 0.3 }}>CONTEÚDO.</span><br />
            <span className="font-black">PRONTO.</span>
          </h1>
          <div className="mt-12">
            <div className="w-full h-px mb-8" style={{ background: "hsl(40 10% 85%)" }} />
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: "hsl(0 0% 40%)" }}>
              {t.hero.sub}
            </p>
          </div>
        </div>

        {/* Right — Dark side */}
        <div className="voku-surface-dark flex flex-col">
          <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-20">
            <p className="voku-text-subheading mb-4" style={{ color: "hsl(40 23% 95% / 0.5)" }}>
              {t.heroRight.label}
            </p>
            <h2 className="text-6xl md:text-8xl lg:text-9xl font-black leading-none" style={{ color: "#AAFF00" }}>
              {t.heroRight.big}
            </h2>
            <p className="mt-6 text-sm max-w-sm" style={{ color: "hsl(40 23% 95% / 0.5)" }}>
              {t.heroRight.sub}
            </p>
          </div>

          {/* Bottom lime card */}
          <div className="voku-surface-lime px-8 md:px-16 lg:px-20 py-12">
            <h3 className="text-lg md:text-xl font-bold leading-tight max-w-md mb-3">
              {t.heroCta.title}
            </h3>
            <p className="text-xs uppercase tracking-[0.15em] opacity-70 mb-8">
              {t.heroCta.badges}
            </p>
            <a href="/cliente" onClick={handleCta} className="block w-full text-center py-4 font-semibold text-sm hover:opacity-90 transition-opacity" style={{ background: "hsl(0 0% 10%)", color: "hsl(40 23% 95%)", textDecoration: "none" }}>
              {t.heroCta.cta}
            </a>
            <a href="#planos" className="block text-center mt-4 text-sm opacity-70 hover:opacity-100 transition-opacity" style={{ textDecoration: "none", color: "inherit" }}>
              {t.heroCta.plans}
            </a>
          </div>
        </div>
      </section>

      {/* ══ MARQUEE ══ */}
      <div className="voku-surface-dark py-3 overflow-hidden" style={{ borderTop: "1px solid rgba(170,255,0,0.3)", borderBottom: "1px solid rgba(170,255,0,0.3)" }}>
        <div className="voku-animate-marquee flex whitespace-nowrap">
          {[0, 1].map(r => (
            <span key={r} className="text-xs uppercase tracking-[0.15em] font-medium mx-2" style={{ color: "#AAFF00" }}>
              {t.ticker} &nbsp;&nbsp;·&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ══ PORTFOLIO ══ */}
      <section id="servicos" ref={portfolioRef} className="py-24 px-6 md:px-16 lg:px-20 max-w-7xl mx-auto">
        <div className="mb-12" style={rv(portfolioVis)}>
          <p className="voku-text-subheading mb-4">{t.portfolio.label}</p>
          <h2 className="voku-text-heading max-w-4xl">{t.portfolio.title}</h2>
          <p className="text-sm mt-4 max-w-xl" style={{ color: "hsl(0 0% 40%)" }}>
            {t.portfolio.sub}
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            {CONTENT_TYPES.map(type => (
              <span key={type} className="text-[10px] uppercase tracking-wider font-semibold border px-3 py-1.5 rounded-full" style={{ borderColor: "hsl(40 10% 85%)", color: "hsl(0 0% 40%)" }}>
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* Showcase grid */}
        <div className="voku-portfolio-grid grid grid-cols-1 md:grid-cols-3 auto-rows-[260px] gap-3" style={rv(portfolioVis, 0.15)}>
          {SHOWCASE.map((item, i) => (
            <div key={i} className={`${item.span} relative rounded-lg overflow-hidden voku-portfolio-item cursor-pointer group`}>
              <img src={item.image} alt={item.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <div className="voku-overlay absolute inset-0" style={{ background: "linear-gradient(to top, hsl(0 0% 10% / 0.9), hsl(0 0% 10% / 0.3) 50%, transparent)" }} />
              <div className="absolute top-3 left-3 z-10 flex gap-1.5">
                <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider" style={{ background: "#AAFF00", color: "hsl(0 0% 5%)" }}>{item.type}</span>
                <span className="text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wider" style={{ background: "hsl(0 0% 10% / 0.8)", color: "hsl(40 23% 95%)" }}>{item.niche}</span>
              </div>
              <div className="voku-hover-text absolute bottom-0 left-0 right-0 p-5 z-10">
                <h3 className="text-sm md:text-base font-bold leading-tight" style={{ color: "hsl(40 23% 95%)" }}>{item.title}</h3>
              </div>
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, hsl(0 0% 10% / 0.4), transparent)" }} />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6" style={rv(portfolioVis, 0.25)}>
          <div>
            <p className="text-xs" style={{ color: "hsl(0 0% 40%)" }}>{t.portfolio.bottom1}</p>
            <p className="text-xs mt-1" style={{ color: "hsl(0 0% 40%)" }}>{t.portfolio.bottom2}</p>
          </div>
          <a href="/cliente" onClick={handleCta} className="inline-flex items-center gap-2 text-xs font-semibold px-6 py-3 rounded-full shrink-0 transition-all duration-300" style={{ background: "hsl(0 0% 10%)", color: "hsl(40 23% 95%)", textDecoration: "none" }}>
            {t.portfolio.cta} <span>→</span>
          </a>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="planos" ref={pricingRef} className="py-24 px-6 md:px-16 lg:px-20 max-w-7xl mx-auto">
        <div style={rv(pricingVis)}>
          <p className="voku-text-subheading mb-4">{t.pricing.label}</p>
          <h2 className="voku-text-heading mb-4">{t.pricing.title}</h2>
          <p className="text-sm mb-12 max-w-lg" style={{ color: "hsl(0 0% 40%)" }}>{t.pricing.sub}</p>
        </div>

        <div className="voku-plans-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20" style={rv(pricingVis, 0.1)}>
          {PLANS.map((plan, i) => (
            <div key={plan.label} className={`p-6 rounded-sm border flex flex-col ${plan.highlighted ? "voku-surface-lime" : ""}`}
              style={{ borderColor: plan.highlighted ? "#AAFF00" : "hsl(40 10% 85%)", background: plan.highlighted ? undefined : "hsl(40 23% 95%)" }}>
              {plan.badge && (
                <div className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 w-fit" style={{ background: "#AAFF00", color: "hsl(0 0% 5%)" }}>{plan.badge}</div>
              )}
              <p className="voku-text-subheading mb-2" style={plan.highlighted ? { color: "hsl(0 0% 5% / 0.6)" } : undefined}>{plan.label}</p>
              <div className="mb-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-sm" style={{ color: plan.highlighted ? "hsl(0 0% 5% / 0.6)" : "hsl(0 0% 40%)" }}>/mês</span>
              </div>
              <p className="text-xs mb-6" style={{ color: plan.highlighted ? "hsl(0 0% 5% / 0.6)" : "hsl(0 0% 40%)" }}>{plan.credits}</p>
              <ul className="flex-1 space-y-2 mb-8">
                {plan.items.map(f => (
                  <li key={f} className="text-xs leading-relaxed" style={{ color: plan.highlighted ? "hsl(0 0% 5% / 0.8)" : "hsl(0 0% 40%)" }}>{f}</li>
                ))}
              </ul>
              <a href={plan.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold group" style={{ color: plan.highlighted ? "hsl(0 0% 5%)" : "hsl(0 0% 10%)", textDecoration: "none" }}>
                {plan.ctaLabel || "Começar agora"} <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </a>
            </div>
          ))}
        </div>

        {/* Credit packs */}
        <div className="border-t pt-12" style={{ borderColor: "hsl(40 10% 85%)" }}>
          <h3 className="text-lg font-bold mb-2">{t.pricing.more}</h3>
          <p className="text-sm mb-8" style={{ color: "hsl(0 0% 40%)" }}>{t.pricing.moreSub}</p>
          <div className="voku-credits-grid grid grid-cols-1 md:grid-cols-3 gap-4">
            {CREDIT_PACKS.map(pack => (
              <div key={pack.n} className="border p-6 rounded-sm" style={{ borderColor: "hsl(40 10% 85%)" }}>
                <p className="text-3xl font-bold mb-1">{pack.n}</p>
                <p className="text-xs uppercase tracking-wider mb-4" style={{ color: "hsl(0 0% 40%)" }}>CRÉDITOS</p>
                <p className="text-2xl font-bold mb-4">{pack.price}</p>
                <a href={pack.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold group" style={{ textDecoration: "none", color: "hsl(0 0% 10%)" }}>
                  COMPRAR <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PROCESS ══ */}
      <section id="processo" ref={processRef} className="voku-surface-dark py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-20">
          <div className="voku-process-grid grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left */}
            <div style={rv(processVis)}>
              <p className="voku-text-subheading" style={{ color: "hsl(40 23% 95% / 0.4)" }}>{t.process.label}</p>
              <h2 className="voku-text-heading mt-4 mb-8" style={{ color: "hsl(40 23% 95%)" }}>{t.process.title}</h2>
              <p className="text-sm mb-12 max-w-sm" style={{ color: "hsl(40 23% 95% / 0.5)" }}>{t.process.sub}</p>
              <div className="flex gap-8">
                {[
                  { n: "24h", l: "Landing Page" },
                  { n: "48h", l: "Social Pack" },
                  { n: "100%", l: lang === "PT" ? "Revisão inclusa" : lang === "ES" ? "Revisión incluida" : "Revision included" },
                ].map(stat => (
                  <div key={stat.n}>
                    <p className="text-3xl md:text-4xl font-bold" style={{ color: "#AAFF00" }}>{stat.n}</p>
                    <p className="text-xs mt-1" style={{ color: "hsl(40 23% 95% / 0.4)" }}>{stat.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Steps */}
            <div className="space-y-8">
              {t.process.steps.map((step, i) => (
                <div key={step.n} className="border-t pt-6" style={{ ...rv(processVis, 0.1 + i * 0.08), borderColor: "hsl(40 23% 95% / 0.1)" }}>
                  <p className="text-xs font-bold mb-2" style={{ color: "#AAFF00" }}>{step.n}</p>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "hsl(40 23% 95%)" }}>{step.t}</h3>
                  <p className="text-sm" style={{ color: "hsl(40 23% 95% / 0.5)" }}>{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ GUARANTEE ══ */}
      <section ref={guaranteeRef} className="voku-surface-lime py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-20 text-center">
          <p className="voku-text-subheading mb-4" style={{ ...rv(guaranteeVis), color: "hsl(0 0% 5% / 0.5)" }}>{t.guarantee.label}</p>
          <h2 className="voku-text-heading mb-6 max-w-2xl mx-auto" style={{ ...rv(guaranteeVis, 0.08), color: "hsl(0 0% 5%)" }}>{t.guarantee.title}</h2>
          <p className="text-sm max-w-md mx-auto mb-10" style={{ ...rv(guaranteeVis, 0.14), color: "hsl(0 0% 5% / 0.7)" }}>{t.guarantee.body}</p>
          <a href="/cliente" onClick={handleCta} className="inline-block font-semibold py-4 px-10 text-sm hover:opacity-90 transition-opacity rounded-sm" style={{ ...rv(guaranteeVis, 0.2), background: "hsl(0 0% 10%)", color: "hsl(40 23% 95%)", textDecoration: "none" }}>
            {t.guarantee.cta}
          </a>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="voku-surface-dark py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-20">
          <div className="voku-footer-grid grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="w-2 h-2 rounded-sm" style={{ background: "#AAFF00" }} />
                  <div className="w-2 h-2 rounded-sm" style={{ background: "#AAFF00" }} />
                  <div className="w-2 h-2 rounded-sm" style={{ background: "#AAFF00" }} />
                  <div className="w-2 h-2 rounded-sm" style={{ background: "#AAFF00" }} />
                </div>
                <span className="font-bold" style={{ color: "hsl(40 23% 95%)" }}>VOKU</span>
              </div>
              <p className="text-xs leading-relaxed max-w-xs" style={{ color: "hsl(40 23% 95% / 0.4)" }}>{t.footer.desc}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] font-medium mb-4" style={{ color: "hsl(40 23% 95% / 0.4)" }}>{t.footer.col2label}</p>
              <ul className="space-y-2">
                {t.footer.col2.map(l => <li key={l}><span className="text-sm" style={{ color: "hsl(40 23% 95% / 0.6)" }}>{l}</span></li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] font-medium mb-4" style={{ color: "hsl(40 23% 95% / 0.4)" }}>{t.footer.col3label}</p>
              <ul className="space-y-2">
                {t.footer.col3.map((l, i) => {
                  const href = i === 1 ? "/cliente" : i === 0 ? "#processo" : null;
                  return <li key={l}>{href ? <a href={href} className="text-sm transition-colors hover:text-white" style={{ color: "hsl(40 23% 95% / 0.6)", textDecoration: "none" }}>{l}</a> : <span className="text-sm" style={{ color: "hsl(40 23% 95% / 0.6)" }}>{l}</span>}</li>;
                })}
              </ul>
            </div>
            <div />
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: "hsl(40 23% 95% / 0.1)" }}>
            <p className="text-xs" style={{ color: "hsl(40 23% 95% / 0.3)" }}>{t.footer.bottom1}</p>
            <p className="text-xs" style={{ color: "hsl(40 23% 95% / 0.3)" }}>{t.footer.bottom2}</p>
          </div>
        </div>
      </footer>

      {/* ══ BETA MODAL ══ */}
      {betaModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setBetaModal(false); }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}>
          <div className="relative w-full max-w-md text-center" style={{ background: "#111", border: "1.5px solid #AAFF00", borderRadius: 4, padding: "48px 40px", animation: "voku-modal-in 0.35s ease forwards" }}>
            <button onClick={() => setBetaModal(false)} className="absolute top-4 right-5" style={{ background: "none", border: "none", color: "#444", fontSize: 22, cursor: "pointer" }}>×</button>
            <div className="text-[10px] font-bold tracking-[3px] mb-6" style={{ color: "#AAFF00" }}>ACESSO BETA LIBERADO</div>
            <div className="text-3xl font-black mb-3" style={{ color: "#fff", letterSpacing: -1 }}>7 dias grátis.</div>
            <div className="text-sm mb-8" style={{ color: "#888", lineHeight: 1.7 }}>Acesso completo. Sem cartão. Sem compromisso.</div>
            <div className="h-px mb-6" style={{ background: "#222" }} />
            <div className="text-left space-y-3 mb-8">
              {[
                lang === "PT" ? "Todos os produtos desbloqueados" : lang === "ES" ? "Todos los productos desbloqueados" : "All products unlocked",
                lang === "PT" ? "Chat com agente IA" : lang === "ES" ? "Chat con agente IA" : "AI agent chat",
                lang === "PT" ? "Landing pages, posts, e-mails" : lang === "ES" ? "Landing pages, posts, emails" : "Landing pages, posts, emails",
                lang === "PT" ? "Sem limite de projetos" : lang === "ES" ? "Sin límite de proyectos" : "Unlimited projects",
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <span className="text-sm font-bold" style={{ color: "#AAFF00" }}>→</span>
                  <span className="text-sm" style={{ color: "#fff" }}>{item}</span>
                </div>
              ))}
            </div>
            <a href="/cliente" className="block w-full py-4 text-center font-bold text-sm" style={{ background: "#AAFF00", color: "#111", textDecoration: "none" }}>
              Ativar agora →
            </a>
            <div className="text-xs mt-4" style={{ color: "#444" }}>
              {lang === "PT" ? "Sem cartão de crédito. Cancele quando quiser." : lang === "ES" ? "Sin tarjeta de crédito. Cancela cuando quieras." : "No credit card. Cancel anytime."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
