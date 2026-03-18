"use client";
import { useState, useEffect, useRef } from "react";

const FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400&family=DM+Serif+Display:ital@0;1&display=swap";
const FF = "'Plus Jakarta Sans', sans-serif";
const FFS = "'DM Serif Display', serif";

/* ─── SVG ICONS ──────────────────────────────────── */
const S = { w: 24, h: 24, vb: "0 0 24 24", f: "none", s: "currentColor", sw: 1.5, lc: "round", lj: "round" };
const Icon = ({ children }) => <svg width={S.w} height={S.h} viewBox={S.vb} fill={S.f} stroke={S.s} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj}>{children}</svg>;
const ICONS = {
  post: <Icon><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="4"/></Icon>,
  carrossel: <Icon><rect x="2" y="5" width="14" height="14" rx="2"/><rect x="6" y="3" width="14" height="14" rx="2" opacity=".5"/><path d="M20 10l2 2-2 2"/></Icon>,
  reels: <Icon><rect x="6" y="3" width="12" height="18" rx="2"/><polygon points="10,9 10,15 15,12"/></Icon>,
  ads: <Icon><path d="M3 12l6-8v5h6v6h-6v5z"/><path d="M17 8l2-1m0 4h2m-2 4l2 1" opacity=".6"/></Icon>,
  email: <Icon><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 5l10 7 10-7"/><path d="M18 13l3 3" opacity=".6"/></Icon>,
  pack: <Icon><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></Icon>,
  lp: <Icon><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18"/><circle cx="5.5" cy="5.5" r=".8" fill="currentColor" stroke="none"/><circle cx="8" cy="5.5" r=".8" fill="currentColor" stroke="none"/><path d="M7 13h10"/></Icon>,
  app: <Icon><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M13 8l-2 4h4l-2 4"/></Icon>,
};

/* ─── COPY (trilingual) ─────────────────────────── */
const T = {
  PT: {
    nav: ["Produtos", "Como funciona", "Preços", "Vitrine"],
    navCta: "Começar grátis",
    navLogin: "Minha conta",
    eyebrow: "IA que cria marketing em minutos",
    h1a: "Seu agente de",
    h1b: "marketing",
    h1italic: "com IA.",
    sub: "Posts, landing pages, e-mails, copies de anúncios e apps — tudo gerado por IA em minutos. 20 créditos grátis para começar.",
    cta: "Começar grátis →",
    ctaSec: "Ver produtos",
    trustBadges: ["20 créditos grátis", "Sem cartão de crédito", "3 variações por pedido"],
    chatDemo: [
      { role: "user", text: "Preciso de 5 posts sobre nutrição para Instagram" },
      { role: "assistant", text: "Legal! Qual o tom da marca — mais técnico ou acessível? 🤔" },
      { role: "user", text: "Acessível e próximo" },
      { role: "assistant", text: "✦ Criando 3 variações de posts..." },
    ],
    productsLabel: "O QUE VOCÊ PODE CRIAR",
    productsTitle: "8 produtos. Um agente.",
    productsSub: "Descreva no chat e receba em minutos.",
    products: [
      { icon: "post", name: "Post Instagram", credits: 8, desc: "Legenda + hashtags + CTA" },
      { icon: "carrossel", name: "Carrossel", credits: 15, desc: "7 slides com copy completa" },
      { icon: "reels", name: "Roteiro Reels", credits: 10, desc: "30s, 60s ou 90s com cortes" },
      { icon: "ads", name: "Copy Meta Ads", credits: 10, desc: "3 ângulos: dor, benefício, prova" },
      { icon: "email", name: "Sequência E-mails", credits: 25, desc: "5 e-mails dia 0 a dia 8" },
      { icon: "pack", name: "Pack Conteúdo", credits: 25, desc: "12 posts prontos para publicar" },
      { icon: "lp", name: "Landing Page", credits: 40, desc: "HTML publicado com URL real" },
      { icon: "app", name: "App Web", credits: 20, desc: "Calculadora, quiz, formulário" },
    ],
    howLabel: "COMO FUNCIONA",
    howTitle: "3 passos. Sem reunião.",
    steps: [
      { n: "01", t: "Descreva no chat", d: "Conte o que precisa para o agente IA. Ele faz as perguntas certas." },
      { n: "02", t: "Escolha sua favorita", d: "Receba 3 variações com tons diferentes. Selecione a melhor." },
      { n: "03", t: "Publique ou baixe", d: "Download imediato ou publicação automática com URL." },
    ],
    gapTitle: "Ferramentas genéricas vs agentes com IA vs agências.",
    gapSub: "A Voku é o agente que faltava.",
    gapItems: [
      { label: "Ferramentas genéricas", icon: "🤖", points: ["Templates prontos sem contexto", "Você faz tudo sozinho", "Sem estratégia, só execução", "Resultados medianos"], highlight: false },
      { label: "VOKU", icon: "✦", points: ["Agente que entende seu negócio", "Faz as perguntas certas", "3 variações estratégicas", "Entrega em minutos, não dias"], highlight: true },
      { label: "Agências tradicionais", icon: "🏢", points: ["R$3.000+/mês mínimo", "Reuniões semanais obrigatórias", "Entrega em semanas", "Contratos de 6 meses"], highlight: false },
    ],
    proofLabel: "QUEM JÁ USA",
    proofQuote: "Pedi uma landing page pelo chat e em 2 minutos tinha uma LP publicada com URL real. Nunca mais voltei para agência.",
    proofAuthor: "— Eduardo M., fundador de SaaS, São Paulo",
    guaranteeTitle: "Não gostou? Refazemos.",
    guaranteeBody: "Cada pedido gera 3 variações. Se nenhuma servir, o agente ajusta até você aprovar. Sem custo extra.",
    pricingLabel: "PLANOS",
    pricingTitle: "Simples. Sem surpresa.",
    pricingSub: "Comece grátis. Faça upgrade quando precisar.",
    plans: [
      { id: "free", name: "Free", price: "R$0", period: "", credits: "20 créditos", desc: "Para testar a plataforma", items: ["20 créditos/mês", "Chat com agente IA", "1 projeto por vez", "Suporte por e-mail"], cta: "Começar grátis", highlight: false },
      { id: "starter", name: "Starter", price: "R$149", period: "/mês", credits: "100 créditos", desc: "Para quem está começando", items: ["100 créditos/mês", "Projetos ilimitados", "Calendário editorial", "Suporte prioritário"], cta: "Assinar Starter", highlight: false },
      { id: "pro", name: "Pro", price: "R$397", period: "/mês", credits: "300 créditos", desc: "Para negócios em crescimento", items: ["300 créditos/mês", "Landing pages com IA", "Geração em batch", "Brand voice personalizada", "Suporte prioritário"], cta: "Assinar Pro", highlight: true, badge: "Mais popular" },
      { id: "business", name: "Business", price: "R$897", period: "/mês", credits: "800 créditos", desc: "Para times e agências", items: ["800 créditos/mês", "Tudo do Pro", "API de integração", "Múltiplos usuários", "Account manager"], cta: "Assinar Business", highlight: false },
    ],
    vitrineLabel: "VITRINE",
    vitrineTitle: "Veja o que outros criaram.",
    vitrineSub: "Inspire-se com projetos reais da comunidade Voku.",
    vitrineCta: "Ver vitrine completa →",
    faqLabel: "PERGUNTAS FREQUENTES",
    faqTitle: "Dúvidas? Aqui estão as respostas.",
    faqs: [
      { q: "O que são créditos?", a: "Créditos são a moeda da Voku. Cada tipo de conteúdo consome uma quantidade: post (8), carrossel (15), reels (10), ads (10), e-mails (25), LP (40), app (20). Renovam todo mês." },
      { q: "Posso mudar de plano a qualquer momento?", a: "Sim! Upgrade é imediato, downgrade vale no próximo ciclo. Sem multa." },
      { q: "E se meus créditos acabarem?", a: "Compre pacotes avulsos de 50, 200 ou 500 créditos sem mudar de plano. Créditos avulsos não expiram." },
      { q: "Como funciona o cancelamento?", a: "Cancele pelo painel a qualquer momento. Sem burocracia, sem multa. Acesso até o fim do período pago." },
      { q: "A IA é boa mesmo?", a: "Usamos Claude, a IA mais avançada da Anthropic. Cada pedido gera 3 variações com tons diferentes. Se nenhuma servir, refazemos." },
      { q: "Posso testar antes de pagar?", a: "Sim! O plano Free dá 20 créditos/mês — suficiente para testar posts, copies e ver a qualidade." },
    ],
    finalTitle: "Pronto para criar",
    finalHighlight: "conteúdo que converte?",
    finalSub: "20 créditos grátis. Sem cartão de crédito. Comece agora.",
    finalCta: "Começar grátis →",
    footer: "IA para marketing. Simples assim.",
  },
  EN: {
    nav: ["Products", "How it works", "Pricing", "Showcase"],
    navCta: "Start free",
    navLogin: "My account",
    eyebrow: "AI that creates marketing in minutes",
    h1a: "Your AI",
    h1b: "marketing",
    h1italic: "agent.",
    sub: "Posts, landing pages, emails, ad copy and apps — all AI-generated in minutes. 20 free credits to start.",
    cta: "Start free →",
    ctaSec: "See products",
    trustBadges: ["20 free credits", "No credit card", "3 variations per order"],
    chatDemo: [
      { role: "user", text: "I need 5 posts about nutrition for Instagram" },
      { role: "assistant", text: "Nice! What's the brand tone — more technical or friendly? 🤔" },
      { role: "user", text: "Friendly and approachable" },
      { role: "assistant", text: "✦ Creating 3 post variations..." },
    ],
    productsLabel: "WHAT YOU CAN CREATE",
    productsTitle: "8 products. One agent.",
    productsSub: "Describe it in the chat and receive in minutes.",
    products: [
      { icon: "post", name: "Instagram Post", credits: 8, desc: "Caption + hashtags + CTA" },
      { icon: "carrossel", name: "Carousel", credits: 15, desc: "7 slides with full copy" },
      { icon: "reels", name: "Reels Script", credits: 10, desc: "30s, 60s or 90s with cuts" },
      { icon: "ads", name: "Meta Ad Copy", credits: 10, desc: "3 angles: pain, benefit, proof" },
      { icon: "email", name: "Email Sequence", credits: 25, desc: "5 emails day 0 to day 8" },
      { icon: "pack", name: "Content Pack", credits: 25, desc: "12 posts ready to publish" },
      { icon: "lp", name: "Landing Page", credits: 40, desc: "Published HTML with real URL" },
      { icon: "app", name: "Web App", credits: 20, desc: "Calculator, quiz, form" },
    ],
    howLabel: "HOW IT WORKS",
    howTitle: "3 steps. No meetings.",
    steps: [
      { n: "01", t: "Describe in chat", d: "Tell the AI agent what you need. It asks the right questions." },
      { n: "02", t: "Pick your favorite", d: "Get 3 variations with different tones. Select the best one." },
      { n: "03", t: "Publish or download", d: "Instant download or auto-publish with URL." },
    ],
    gapTitle: "Generic tools vs AI agents vs agencies.",
    gapSub: "Voku is the agent you were missing.",
    gapItems: [
      { label: "Generic tools", icon: "🤖", points: ["Templates without context", "You do everything alone", "No strategy, just execution", "Mediocre results"], highlight: false },
      { label: "VOKU", icon: "✦", points: ["Agent that understands your business", "Asks the right questions", "3 strategic variations", "Delivery in minutes, not days"], highlight: true },
      { label: "Traditional agencies", icon: "🏢", points: ["R$3.000+/mo minimum", "Weekly mandatory meetings", "Delivery in weeks", "6-month contracts"], highlight: false },
    ],
    proofLabel: "WHO ALREADY USES IT",
    proofQuote: "I asked for a landing page via chat and in 2 minutes had a published LP with a real URL. Never going back to agencies.",
    proofAuthor: "— Eduardo M., SaaS founder, São Paulo",
    guaranteeTitle: "Don't like it? We redo it.",
    guaranteeBody: "Each order generates 3 variations. If none works, the agent adjusts until you approve. No extra cost.",
    pricingLabel: "PRICING",
    pricingTitle: "Simple. No surprises.",
    pricingSub: "Start free. Upgrade when you need to.",
    plans: [
      { id: "free", name: "Free", price: "R$0", period: "", credits: "20 credits", desc: "To test the platform", items: ["20 credits/month", "AI agent chat", "1 project at a time", "Email support"], cta: "Start free", highlight: false },
      { id: "starter", name: "Starter", price: "R$149", period: "/mo", credits: "100 credits", desc: "For getting started", items: ["100 credits/month", "Unlimited projects", "Editorial calendar", "Priority support"], cta: "Subscribe Starter", highlight: false },
      { id: "pro", name: "Pro", price: "R$397", period: "/mo", credits: "300 credits", desc: "For growing businesses", items: ["300 credits/month", "AI landing pages", "Batch generation", "Custom brand voice", "Priority support"], cta: "Subscribe Pro", highlight: true, badge: "Most popular" },
      { id: "business", name: "Business", price: "R$897", period: "/mo", credits: "800 credits", desc: "For teams and agencies", items: ["800 credits/month", "Everything in Pro", "API integration", "Multiple users", "Account manager"], cta: "Subscribe Business", highlight: false },
    ],
    vitrineLabel: "SHOWCASE",
    vitrineTitle: "See what others created.",
    vitrineSub: "Get inspired by real projects from the Voku community.",
    vitrineCta: "See full showcase →",
    faqLabel: "FAQ",
    faqTitle: "Questions? Here are the answers.",
    faqs: [
      { q: "What are credits?", a: "Credits are Voku's currency. Each content type uses different amounts: post (8), carousel (15), reels (10), ads (10), emails (25), LP (40), app (20). They renew monthly." },
      { q: "Can I change plans anytime?", a: "Yes! Upgrades are instant, downgrades apply next cycle. No penalties." },
      { q: "What if I run out of credits?", a: "Buy add-on packs of 50, 200, or 500 credits without changing your plan. Add-on credits don't expire." },
      { q: "How does cancellation work?", a: "Cancel from your dashboard anytime. No bureaucracy, no penalties. Access until the end of the paid period." },
      { q: "Is the AI actually good?", a: "We use Claude, Anthropic's most advanced AI. Each order generates 3 variations with different tones. If none works, we redo it." },
      { q: "Can I try before paying?", a: "Yes! The Free plan gives 20 credits/month — enough to test posts, copies and see the quality." },
    ],
    finalTitle: "Ready to create",
    finalHighlight: "content that converts?",
    finalSub: "20 free credits. No credit card. Start now.",
    finalCta: "Start free →",
    footer: "AI for marketing. Simple as that.",
  },
  ES: {
    nav: ["Productos", "Cómo funciona", "Precios", "Vitrina"],
    navCta: "Empezar gratis",
    navLogin: "Mi cuenta",
    eyebrow: "IA que crea marketing en minutos",
    h1a: "Tu agente de",
    h1b: "marketing",
    h1italic: "con IA.",
    sub: "Posts, landing pages, emails, copies de anuncios y apps — todo generado por IA en minutos. 20 créditos gratis para empezar.",
    cta: "Empezar gratis →",
    ctaSec: "Ver productos",
    trustBadges: ["20 créditos gratis", "Sin tarjeta de crédito", "3 variaciones por pedido"],
    chatDemo: [
      { role: "user", text: "Necesito 5 posts sobre nutrición para Instagram" },
      { role: "assistant", text: "¡Genial! ¿Cuál es el tono de la marca — más técnico o cercano? 🤔" },
      { role: "user", text: "Cercano y amigable" },
      { role: "assistant", text: "✦ Creando 3 variaciones de posts..." },
    ],
    productsLabel: "QUÉ PUEDES CREAR",
    productsTitle: "8 productos. Un agente.",
    productsSub: "Describe en el chat y recibe en minutos.",
    products: [
      { icon: "post", name: "Post Instagram", credits: 8, desc: "Leyenda + hashtags + CTA" },
      { icon: "carrossel", name: "Carrusel", credits: 15, desc: "7 slides con copy completo" },
      { icon: "reels", name: "Guión Reels", credits: 10, desc: "30s, 60s o 90s con cortes" },
      { icon: "ads", name: "Copy Meta Ads", credits: 10, desc: "3 ángulos: dolor, beneficio, prueba" },
      { icon: "email", name: "Secuencia Emails", credits: 25, desc: "5 emails día 0 a día 8" },
      { icon: "pack", name: "Pack Contenido", credits: 25, desc: "12 posts listos para publicar" },
      { icon: "lp", name: "Landing Page", credits: 40, desc: "HTML publicado con URL real" },
      { icon: "app", name: "App Web", credits: 20, desc: "Calculadora, quiz, formulario" },
    ],
    howLabel: "CÓMO FUNCIONA",
    howTitle: "3 pasos. Sin reuniones.",
    steps: [
      { n: "01", t: "Describe en el chat", d: "Cuéntale al agente IA lo que necesitas. Hace las preguntas correctas." },
      { n: "02", t: "Elige tu favorita", d: "Recibe 3 variaciones con tonos diferentes. Selecciona la mejor." },
      { n: "03", t: "Publica o descarga", d: "Descarga inmediata o publicación automática con URL." },
    ],
    gapTitle: "Herramientas genéricas vs agentes IA vs agencias.",
    gapSub: "Voku es el agente que faltaba.",
    gapItems: [
      { label: "Herramientas genéricas", icon: "🤖", points: ["Templates sin contexto", "Haces todo solo", "Sin estrategia, solo ejecución", "Resultados medianos"], highlight: false },
      { label: "VOKU", icon: "✦", points: ["Agente que entiende tu negocio", "Hace las preguntas correctas", "3 variaciones estratégicas", "Entrega en minutos, no días"], highlight: true },
      { label: "Agencias tradicionales", icon: "🏢", points: ["R$3.000+/mes mínimo", "Reuniones semanales obligatorias", "Entrega en semanas", "Contratos de 6 meses"], highlight: false },
    ],
    proofLabel: "QUIÉNES YA LO USAN",
    proofQuote: "Pedí una landing page por el chat y en 2 minutos tenía una LP publicada con URL real. Nunca más volví a una agencia.",
    proofAuthor: "— Eduardo M., fundador de SaaS, São Paulo",
    guaranteeTitle: "¿No te gusta? Lo rehacemos.",
    guaranteeBody: "Cada pedido genera 3 variaciones. Si ninguna sirve, el agente ajusta hasta que apruebes. Sin costo extra.",
    pricingLabel: "PRECIOS",
    pricingTitle: "Simple. Sin sorpresas.",
    pricingSub: "Empieza gratis. Mejora cuando necesites.",
    plans: [
      { id: "free", name: "Free", price: "R$0", period: "", credits: "20 créditos", desc: "Para probar la plataforma", items: ["20 créditos/mes", "Chat con agente IA", "1 proyecto a la vez", "Soporte por email"], cta: "Empezar gratis", highlight: false },
      { id: "starter", name: "Starter", price: "R$149", period: "/mes", credits: "100 créditos", desc: "Para empezar", items: ["100 créditos/mes", "Proyectos ilimitados", "Calendario editorial", "Soporte prioritario"], cta: "Suscribir Starter", highlight: false },
      { id: "pro", name: "Pro", price: "R$397", period: "/mes", credits: "300 créditos", desc: "Para negocios en crecimiento", items: ["300 créditos/mes", "Landing pages con IA", "Generación en batch", "Voz de marca personalizada", "Soporte prioritario"], cta: "Suscribir Pro", highlight: true, badge: "Más popular" },
      { id: "business", name: "Business", price: "R$897", period: "/mes", credits: "800 créditos", desc: "Para equipos y agencias", items: ["800 créditos/mes", "Todo del Pro", "API de integración", "Múltiples usuarios", "Account manager"], cta: "Suscribir Business", highlight: false },
    ],
    vitrineLabel: "VITRINA",
    vitrineTitle: "Mira lo que otros crearon.",
    vitrineSub: "Inspírate con proyectos reales de la comunidad Voku.",
    vitrineCta: "Ver vitrina completa →",
    faqLabel: "PREGUNTAS FRECUENTES",
    faqTitle: "¿Dudas? Aquí están las respuestas.",
    faqs: [
      { q: "¿Qué son los créditos?", a: "Los créditos son la moneda de Voku. Cada tipo de contenido consume una cantidad distinta: post (8), carrusel (15), reels (10), ads (10), emails (25), LP (40), app (20). Se renuevan cada mes." },
      { q: "¿Puedo cambiar de plan?", a: "¡Sí! Los upgrades son inmediatos, los downgrades aplican en el próximo ciclo. Sin penalidades." },
      { q: "¿Y si se me acaban los créditos?", a: "Compra paquetes adicionales de 50, 200 o 500 créditos sin cambiar de plan. Los créditos adicionales no expiran." },
      { q: "¿Cómo funciona la cancelación?", a: "Cancela desde tu panel en cualquier momento. Sin burocracia, sin multas. Acceso hasta el fin del período pagado." },
      { q: "¿La IA es buena de verdad?", a: "Usamos Claude, la IA más avanzada de Anthropic. Cada pedido genera 3 variaciones con tonos diferentes. Si ninguna sirve, la rehacemos." },
      { q: "¿Puedo probar antes de pagar?", a: "¡Sí! El plan Free da 20 créditos/mes — suficiente para probar posts, copies y ver la calidad." },
    ],
    finalTitle: "¿Listo para crear",
    finalHighlight: "contenido que convierte?",
    finalSub: "20 créditos gratis. Sin tarjeta. Empieza ahora.",
    finalCta: "Empezar gratis →",
    footer: "IA para marketing. Así de simple.",
  },
};

/* ─── HOOKS ─────────────────────────────────────── */
function useReveal(delay = 0) {
  const ref = useRef(null);
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

const rv = (vis, delay = 0) => ({
  opacity: vis ? 1 : 0,
  transform: vis ? "translateY(0)" : "translateY(24px)",
  transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
});

/* ─── CHAT DEMO (animated loop) ──────────────────── */
function ChatDemo() {
  const [step, setStep] = useState(-1);
  useEffect(() => {
    const delays = [0, 800, 1600, 2600, 4000, 4900, 6600, 8400, 11000];
    const timers = [];
    function run() {
      delays.forEach((d, i) => { timers.push(setTimeout(() => setStep(i), d)); });
      timers.push(setTimeout(() => { setStep(-1); setTimeout(run, 400); }, 11000));
    }
    const init = setTimeout(run, 300);
    timers.push(init);
    return () => timers.forEach(clearTimeout);
  }, []);
  const show = (n) => ({ opacity: step >= n ? 1 : 0, transform: step >= n ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.4s ease, transform 0.4s ease" });
  const VA = { width: 26, height: 26, borderRadius: "50%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#C8F135", flexShrink: 0 };
  const MB = (isUser) => ({ padding: "9px 13px", borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px", fontSize: 12.5, lineHeight: 1.55, maxWidth: "75%", ...(isUser ? { background: "#111", color: "#fff" } : { background: "#fff", border: "1px solid #E8E5DE", color: "#111" }) });

  return (
    <div style={{ background: "#fff", border: "1px solid #E8E5DE", borderRadius: 20, width: 340, overflow: "hidden", fontFamily: FF, boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
      <div style={{ background: "#111", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#C8F135", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#111", flexShrink: 0 }}>V</div>
        <div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: "-0.5px", color: "#fff", textTransform: "uppercase" }}>VOKU</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8F135" }} />
            <span style={{ color: "#888", fontSize: 11 }}>online</span>
          </div>
        </div>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, minHeight: 280, background: "#FAFAF8" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", ...show(0) }}><div style={VA}>V</div><div style={MB(false)}>Oi! O que você precisa criar hoje?</div></div>
        <div style={{ display: "flex", justifyContent: "flex-end", ...show(1) }}><div style={MB(true)}>Preciso de 5 posts sobre nutrição para Instagram</div></div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", opacity: step === 2 ? 1 : 0, transition: "opacity 0.3s" }}><div style={VA}>V</div><div style={{ ...MB(false), display: "flex", gap: 4, padding: "10px 13px" }}>{[0,1,2].map(i=><div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#bbb", animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}</div></div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", ...show(3) }}><div style={VA}>V</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: "80%" }}>
            <div style={MB(false)}>Legal! Qual o tom da marca?</div>
            {step >= 3 && step < 5 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{["Técnico","Acessível e próximo","Inspiracional"].map(c=><span key={c} style={{ padding: "5px 12px", borderRadius: 20, background: "#f0f0e8", border: "1px solid #e0e0d8", fontSize: 11.5, fontWeight: 600, color: "#444" }}>{c}</span>)}</div>}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", ...show(4) }}><div style={MB(true)}>Acessível e próximo</div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", background: "#f8f8f0", border: "1px solid #d8e8a0", borderRadius: 12, fontSize: 12, color: "#556", fontWeight: 500, opacity: step >= 5 && step < 7 ? 1 : 0, transition: "opacity 0.3s" }}><span style={{ color: "#C8F135", fontSize: 14 }}>✦</span>Criando 3 variações...</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", ...show(6) }}><div style={VA}>V</div><div style={MB(false)}>Pronto! 3 variações geradas. Escolha a que mais combina.</div></div>
      </div>
      <div style={{ padding: "10px 12px", borderTop: "1px solid #E8E5DE", display: "flex", gap: 8, alignItems: "center", background: "#fff" }}>
        <div style={{ flex: 1, padding: "9px 13px", background: "#f5f5f0", borderRadius: 20, fontSize: 12, color: "#aaa", fontFamily: FF }}>O que você precisa criar hoje?</div>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#C8F135", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
      </div>
    </div>
  );
}

const BETA_MODE = true;
const IF = "'Inter', sans-serif";

/* ─── MAIN ──────────────────────────────────────── */
export default function VokuLanding() {
  const [lang, setLang] = useState("PT");
  const [navSolid, setNavSolid] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [betaModal, setBetaModal] = useState(false);

  const handleCta = (e) => {
    if (BETA_MODE) { e.preventDefault(); setBetaModal(true); }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("voku_ref", ref);
  }, []);

  const t = T[lang];
  const [productsRef, productsVis] = useReveal(0);
  const [howRef, howVis] = useReveal(0);
  const [gapRef, gapVis] = useReveal(0);
  const [proofRef, proofVis] = useReveal(0);
  const [pricingRef, pricingVis] = useReveal(0);
  const [faqRef, faqVis] = useReveal(0);
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

  return (
    <div style={{ background: "#0d0d0d", color: "#FAF8F3", overflowX: "hidden" }}>

      {/* ══ NAV ══ */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 500, height: 64, background: navSolid ? "rgba(10,10,10,0.96)" : "transparent", backdropFilter: navSolid ? "blur(18px)" : "none", borderBottom: navSolid ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent", padding: "0 52px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.4s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 20, letterSpacing: "-0.5px", color: "#ffffff", textTransform: "uppercase" }}>VOKU</span>
          <div style={{ display: "flex", gap: 24 }}>
            {t.nav.map((item, i) => (
              <a key={i} href={["#produtos", "#como-funciona", "#precos", "/vitrine"][i]} style={{ fontFamily: FF, fontSize: 13, fontWeight: 500, color: "#888", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#FAF8F3"} onMouseLeave={e => e.target.style.color = "#888"}>{item}</a>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 2 }}>
            {["PT", "EN", "ES"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ background: lang === l ? "#C8F135" : "transparent", color: lang === l ? "#111" : "#555", border: "none", borderRadius: 5, padding: "4px 8px", fontFamily: FF, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>{l}</button>
            ))}
          </div>
          <a href="/cliente" style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, color: "#888", textDecoration: "none" }}>{t.navLogin}</a>
          <a href="/cliente" onClick={handleCta} style={{ background: "#C8F135", color: "#111", borderRadius: 8, padding: "10px 20px", fontFamily: FF, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>{t.navCta}</a>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "100px 52px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "linear-gradient(rgba(255,255,255,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.12) 1px,transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
        <div className="hero-grid" style={{ width: "100%", maxWidth: 1300, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center", position: "relative", zIndex: 2 }}>

          {/* LEFT — copy */}
          <div>
            <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(16px)", transition: "all 0.6s ease 0.05s", display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(200,241,53,0.08)", border: "1px solid rgba(200,241,53,0.2)", borderRadius: 20, padding: "6px 14px", marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8F135", animation: "ping 2s ease-in-out infinite" }} />
              <span style={{ fontFamily: FF, fontSize: 11, fontWeight: 700, color: "#C8F135", letterSpacing: 1.5 }}>{t.eyebrow.toUpperCase()}</span>
            </div>

            <h1 style={{ fontFamily: FFS, fontSize: "clamp(44px,5vw,80px)", fontWeight: 400, lineHeight: 0.98, letterSpacing: -2, margin: "0 0 28px", color: "#FAF8F3" }}>
              <span style={{ display: "block", opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(28px)", transition: "all 0.7s ease 0.1s" }}>{t.h1a}</span>
              <span style={{ display: "block", opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(28px)", transition: "all 0.7s ease 0.18s" }}>{t.h1b}</span>
              <span style={{ display: "block", fontStyle: "italic", color: "#C8F135", opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(28px)", transition: "all 0.7s ease 0.26s" }}>{t.h1italic}</span>
            </h1>

            <p style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: "all 0.65s ease 0.34s", fontFamily: FF, fontSize: "clamp(15px,1.2vw,17px)", color: "#AAA", lineHeight: 1.7, marginBottom: 32, maxWidth: 460 }}>{t.sub}</p>

            <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(16px)", transition: "all 0.6s ease 0.38s", display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 36 }}>
              {t.trustBadges.map((badge, i) => (
                <div key={i} style={{ fontFamily: FF, fontSize: 11, fontWeight: 600, color: "#AAA", background: "#161616", border: "1px solid #222", borderRadius: 20, padding: "5px 12px" }}>{badge}</div>
              ))}
            </div>

            <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: "all 0.65s ease 0.44s", display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a href="/cliente" onClick={handleCta} style={{ display: "inline-block", background: "#C8F135", color: "#111", borderRadius: 10, padding: "18px 40px", fontFamily: FF, fontSize: 15, fontWeight: 700, textDecoration: "none", transition: "all 0.3s", cursor: "pointer" }}>{t.cta}</a>
              <a href="#produtos" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "18px 28px", borderRadius: 10, border: "1.5px solid #2a2a2a", fontFamily: FF, fontSize: 15, fontWeight: 600, color: "#888", textDecoration: "none", transition: "all 0.2s" }}>{t.ctaSec} ↓</a>
            </div>
          </div>

          {/* RIGHT — chat demo */}
          <div className="hero-right-panel" style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(32px)", transition: "all 0.9s ease 0.3s" }}>
            <ChatDemo />
          </div>
        </div>
      </section>

      {/* ══ PRODUCTS ══ */}
      <section id="produtos" ref={productsRef} style={{ padding: "112px 52px", background: "#0a0a0a" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ ...rv(productsVis), fontFamily: FF, fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#888", marginBottom: 12 }}>{t.productsLabel}</div>
            <h2 style={{ ...rv(productsVis, 0.08), fontFamily: FFS, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(28px,4vw,48px)", color: "#FAF8F3", margin: "0 0 12px", letterSpacing: -0.5 }}>{t.productsTitle}</h2>
            <p style={{ ...rv(productsVis, 0.14), fontFamily: FF, fontSize: 14, color: "#888", fontStyle: "italic" }}>{t.productsSub}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {t.products.map((p, i) => (
              <a key={i} href="/cliente" style={{
                ...rv(productsVis, 0.1 + i * 0.05),
                background: "#141414", border: "1px solid #1e1e1e", borderRadius: 16,
                padding: "28px 22px", textDecoration: "none", transition: "all 0.25s",
                display: "block", cursor: "pointer",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#C8F135"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ marginBottom: 14, color: "#C8F135" }}>{ICONS[p.icon] || p.icon}</div>
                <div style={{ fontFamily: FF, fontSize: 15, fontWeight: 700, color: "#FAF8F3", marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontFamily: FF, fontSize: 12, color: "#888", lineHeight: 1.5, marginBottom: 12 }}>{p.desc}</div>
                <div style={{ display: "inline-block", background: "rgba(200,241,53,0.1)", border: "1px solid rgba(200,241,53,0.2)", borderRadius: 20, padding: "3px 10px" }}>
                  <span style={{ fontFamily: FF, fontSize: 11, fontWeight: 700, color: "#C8F135" }}>{p.credits} cr</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="como-funciona" ref={howRef} style={{ padding: "112px 52px", background: "#111", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,241,53,0.04) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ ...rv(howVis), fontFamily: FF, fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#888", marginBottom: 12 }}>{t.howLabel}</div>
            <h2 style={{ ...rv(howVis, 0.08), fontFamily: FFS, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(28px,4vw,48px)", color: "#FAF8F3", margin: 0, letterSpacing: -0.5 }}>{t.howTitle}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
            {t.steps.map((s, i) => (
              <div key={i} style={{ ...rv(howVis, 0.1 + i * 0.12), padding: "40px 28px", borderLeft: `1px solid ${i === 0 ? "#C8F135" : "#1C1C1C"}`, position: "relative" }}>
                {i === 0 && <div style={{ position: "absolute", left: -1, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom, #C8F135, transparent)" }} />}
                <div style={{ fontFamily: FF, fontWeight: 800, fontSize: 11, color: "#C8F135", letterSpacing: 2.5, marginBottom: 20 }}>{s.n}</div>
                <div style={{ fontFamily: FF, fontWeight: 700, fontSize: 18, color: "#FAF8F3", marginBottom: 10, lineHeight: 1.3 }}>{s.t}</div>
                <div style={{ fontFamily: FF, fontWeight: 300, fontSize: 13, color: "#888", lineHeight: 1.75 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GAP ══ */}
      <section ref={gapRef} style={{ padding: "100px 52px", background: "#0D0D0D", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ ...rv(gapVis), fontFamily: FFS, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(26px,3.5vw,42px)", color: "#FAF8F3", margin: "0 0 12px" }}>{t.gapTitle}</h2>
            <p style={{ ...rv(gapVis, 0.1), fontFamily: FF, fontSize: 15, color: "#888" }}>{t.gapSub}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 3 }}>
            {t.gapItems.map((col, i) => (
              <div key={i} style={{
                ...rv(gapVis, 0.1 + i * 0.1),
                background: col.highlight ? "#C8F135" : "#141414",
                borderRadius: 16, padding: "36px 32px",
                border: col.highlight ? "none" : "1px solid #1C1C1C",
                transform: col.highlight ? "scaleY(1.04)" : "none",
                position: "relative",
              }}>
                {col.highlight && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#111", color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 900, letterSpacing: "-0.3px", padding: "4px 14px", borderRadius: 20 }}>VOKU</div>}
                <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, color: col.highlight ? "#111" : "#555", marginBottom: 20 }}>{col.label}</div>
                {col.points.map((p, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: col.highlight ? "#2A3D00" : "#2A2A2A", flexShrink: 0 }} />
                    <span style={{ fontFamily: FF, fontSize: 12, color: col.highlight ? "#2A3D00" : "#555", lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF ══ */}
      <section ref={proofRef} style={{ padding: "80px 52px", background: "#0a0a0a" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <div style={{ ...rv(proofVis), fontFamily: FF, fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#888", marginBottom: 28 }}>{t.proofLabel}</div>
          <blockquote style={{ ...rv(proofVis, 0.1), fontFamily: FFS, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(18px,2.5vw,26px)", color: "#FAF8F3", lineHeight: 1.5, margin: "0 0 20px", position: "relative" }}>
            <span style={{ position: "absolute", top: -20, left: -10, fontSize: 60, color: "#C8F135", lineHeight: 1, fontFamily: "serif" }}>"</span>
            {t.proofQuote}
          </blockquote>
          <div style={{ ...rv(proofVis, 0.18), fontFamily: FF, fontSize: 12, color: "#888" }}>{t.proofAuthor}</div>
          <div style={{ ...rv(proofVis, 0.24), marginTop: 48, padding: "28px 32px", background: "#141414", borderRadius: 16, border: "1px solid #222", textAlign: "left", display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#C8F135", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>✓</div>
            <div>
              <div style={{ fontFamily: FF, fontSize: 14, fontWeight: 700, color: "#FAF8F3", marginBottom: 6 }}>{t.guaranteeTitle}</div>
              <div style={{ fontFamily: FF, fontSize: 13, color: "#888", lineHeight: 1.65 }}>{t.guaranteeBody}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="precos" ref={pricingRef} style={{ padding: "112px 52px", background: "#0d0d0d" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ ...rv(pricingVis), fontFamily: FF, fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#888", marginBottom: 12 }}>{t.pricingLabel}</div>
            <h2 style={{ ...rv(pricingVis, 0.08), fontFamily: FFS, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(28px,4vw,48px)", color: "#FAF8F3", margin: "0 0 12px" }}>{t.pricingTitle}</h2>
            <p style={{ ...rv(pricingVis, 0.14), fontFamily: FF, fontSize: 14, color: "#888", fontStyle: "italic" }}>{t.pricingSub}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, alignItems: "start" }}>
            {t.plans.map((plan, i) => (
              <div key={plan.id} style={{
                ...rv(pricingVis, 0.1 + i * 0.08),
                background: plan.highlight ? "#141414" : "#0f0f0f",
                border: plan.highlight ? "2px solid #C8F135" : "1px solid #1e1e1e",
                borderRadius: 20, padding: "36px 28px", position: "relative",
                boxShadow: plan.highlight ? "0 20px 60px rgba(200,241,53,0.08)" : "none",
                transform: plan.highlight ? "translateY(-8px)" : "none",
              }}>
                {plan.badge && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#C8F135", color: "#111", fontFamily: FF, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "4px 16px", borderRadius: 20, whiteSpace: "nowrap" }}>{plan.badge.toUpperCase()}</div>
                )}
                <div style={{ fontFamily: FF, fontSize: 12, fontWeight: 700, color: "#777", letterSpacing: 1, marginBottom: 16 }}>{plan.name.toUpperCase()}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: FF, fontSize: 36, fontWeight: 800, color: "#FAF8F3" }}>{plan.price}</span>
                  <span style={{ fontFamily: FF, fontSize: 14, color: "#777" }}>{plan.period}</span>
                </div>
                <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 700, color: "#C8F135", marginBottom: 8 }}>{plan.credits}</div>
                <p style={{ fontFamily: FF, fontSize: 12, color: "#888", lineHeight: 1.6, marginBottom: 24 }}>{plan.desc}</p>
                <div style={{ marginBottom: 28 }}>
                  {plan.items.map((item, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <span style={{ color: "#C8F135", fontSize: 12, flexShrink: 0 }}>✓</span>
                      <span style={{ fontFamily: FF, fontSize: 12, color: "#AAA", lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <a href={plan.id === "free" ? "/cliente" : `/api/checkout?plan=${plan.id}&billing=monthly`} onClick={handleCta} style={{
                  display: "block", textAlign: "center", padding: "14px 24px", borderRadius: 10,
                  background: plan.highlight ? "#C8F135" : "#1e1e1e",
                  color: plan.highlight ? "#111" : "#FAF8F3",
                  fontFamily: FF, fontSize: 13, fontWeight: 700, textDecoration: "none", transition: "all 0.2s", cursor: "pointer",
                }}>{plan.cta}</a>
              </div>
            ))}
          </div>
          {/* Credit pack callout */}
          <div style={{ ...rv(pricingVis, 0.5), marginTop: 32, background: "#141414", border: "1px solid #1e1e1e", borderRadius: 16, padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontFamily: FF, fontSize: 14, fontWeight: 700, color: "#FAF8F3", marginBottom: 4 }}>
                {lang === "PT" ? "Precisa de mais créditos sem mudar de plano?" : lang === "EN" ? "Need more credits without changing plans?" : "Necesitas más créditos sin cambiar de plan?"}
              </div>
              <div style={{ fontFamily: FF, fontSize: 12, color: "#888" }}>
                {lang === "PT" ? "Pacotes avulsos: 50 créditos por R$49 · 200 por R$149 · 500 por R$297" : lang === "EN" ? "Add-on packs: 50 credits for R$49 · 200 for R$149 · 500 for R$297" : "Paquetes adicionales: 50 créditos por R$49 · 200 por R$149 · 500 por R$297"}
              </div>
            </div>
            <a href="/precos" style={{ background: "#1e1e1e", color: "#FAF8F3", border: "1px solid #333", borderRadius: 10, padding: "10px 20px", fontFamily: FF, fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
              {lang === "PT" ? "Ver pacotes →" : lang === "EN" ? "See packs →" : "Ver paquetes →"}
            </a>
          </div>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <a href="/precos" style={{ fontFamily: FF, fontSize: 13, color: "#888", textDecoration: "none" }}>
              {lang === "PT" ? "Ver todos os planos e pacotes avulsos →" : lang === "EN" ? "See all plans and add-on packs →" : "Ver todos los planes y paquetes →"}
            </a>
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section ref={faqRef} style={{ padding: "100px 52px", background: "#0a0a0a" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ ...rv(faqVis), fontFamily: FF, fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#888", marginBottom: 12 }}>{t.faqLabel}</div>
            <h2 style={{ ...rv(faqVis, 0.08), fontFamily: FFS, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(26px,3.5vw,40px)", color: "#FAF8F3", margin: 0 }}>{t.faqTitle}</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {t.faqs.map((item, i) => (
              <div key={i} style={{ ...rv(faqVis, 0.1 + i * 0.05), background: "#141414", border: "1px solid #1e1e1e", borderRadius: 14, overflow: "hidden" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", background: "transparent", border: "none", cursor: "pointer", fontFamily: FF, textAlign: "left" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#FAF8F3" }}>{item.q}</span>
                  <span style={{ fontSize: 18, color: "#777", transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginLeft: 16 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 24px 18px" }}>
                    <p style={{ fontFamily: FF, fontSize: 13, color: "#888", lineHeight: 1.7, margin: 0 }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section ref={ctaRef} style={{ padding: "140px 52px", background: "#0d0d0d", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: "-20%", left: "50%", transform: "translateX(-50%)", width: 900, height: 500, background: "radial-gradient(ellipse, rgba(200,241,53,0.25) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <h2 style={{ ...rv(ctaVis), fontFamily: FFS, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(36px,5.5vw,68px)", lineHeight: 1.05, letterSpacing: -1.5, color: "#FAF8F3", marginBottom: 20 }}>
            {t.finalTitle}{" "}
            <span style={{ textDecoration: "underline", textDecorationColor: "#C8F135", textDecorationThickness: 4, textUnderlineOffset: 6 }}>{t.finalHighlight}</span>
          </h2>
          <p style={{ ...rv(ctaVis, 0.1), fontFamily: FF, fontSize: 16, color: "#888", lineHeight: 1.7, marginBottom: 40 }}>{t.finalSub}</p>
          <a href="/cliente" onClick={handleCta} style={{ ...rv(ctaVis, 0.18), display: "inline-block", background: "#C8F135", color: "#111", borderRadius: 12, padding: "20px 52px", fontFamily: FF, fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 8px 48px rgba(200,241,53,0.15)", transition: "all 0.3s", cursor: "pointer" }}>{t.finalCta}</a>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: "#0A0A0A", padding: "28px 52px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderTop: "1px solid #161616" }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: "-0.5px", color: "#ffffff", textTransform: "uppercase" }}>VOKU</span>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { label: lang === "PT" ? "Vitrine" : "Showcase", href: "/vitrine" },
            { label: "Marketplace", href: "/vitrine/marketplace" },
            { label: lang === "PT" ? "Preços" : "Pricing", href: "/precos" },
            { label: lang === "PT" ? "Afiliados" : "Affiliates", href: "/cliente/afiliados" },
          ].map(l => (
            <a key={l.label} href={l.href} style={{ fontFamily: FF, fontSize: 12, color: "#777", textDecoration: "none" }}>{l.label}</a>
          ))}
        </div>
        <div style={{ fontFamily: FF, fontSize: 10, color: "#777" }}>Voku LLC · Wyoming, USA · voku.one · © 2025</div>
      </footer>

      {/* Beta Modal */}
      {betaModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setBetaModal(false); }} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#111111", border: "1.5px solid #C8F135", borderRadius: 20, padding: "48px 40px", maxWidth: 440, width: "100%", textAlign: "center", position: "relative", animation: "modalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}>
            <button onClick={() => setBetaModal(false)} style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", color: "#444", fontSize: 22, cursor: "pointer" }}>×</button>
            <div style={{ fontSize: 40, color: "#C8F135", marginBottom: 16, animation: "betaPulse 2s ease-in-out infinite" }}>✦</div>
            <span style={{ display: "inline-block", background: "#C8F135", color: "#111", fontFamily: IF, fontWeight: 800, fontSize: 10, letterSpacing: 3, padding: "6px 16px", borderRadius: 20, marginBottom: 24 }}>ACESSO BETA LIBERADO</span>
            <div style={{ fontFamily: IF, fontWeight: 900, fontSize: 32, color: "#ffffff", lineHeight: 1.1, marginBottom: 12 }}>Você ganhou 7 dias grátis.</div>
            <div style={{ fontFamily: IF, fontWeight: 400, fontSize: 14, color: "#888", lineHeight: 1.7, marginBottom: 32 }}>Acesso completo à plataforma, sem cartão, sem compromisso.<br/>Explore tudo antes de escolher seu plano.</div>
            <div style={{ height: 1, background: "#222", marginBottom: 28 }} />
            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 10 }}>
              {["Créditos ilimitados por 7 dias", "Todos os produtos desbloqueados", "Chat com agente IA", "Landing pages, posts, e-mails, apps", "Sem limite de projetos"].map(item => (
                <div key={item} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "#C8F135", fontFamily: IF, fontWeight: 700, fontSize: 14 }}>→</span>
                  <span style={{ color: "#ffffff", fontFamily: IF, fontWeight: 400, fontSize: 14 }}>{item}</span>
                </div>
              ))}
            </div>
            <a href="/cliente" style={{ display: "block", marginTop: 36, width: "100%", background: "#C8F135", color: "#111", fontFamily: IF, fontWeight: 800, fontSize: 16, padding: 18, borderRadius: 10, border: "none", textDecoration: "none", textAlign: "center", boxSizing: "border-box" }}>Ativar agora →</a>
            <div style={{ fontFamily: IF, fontWeight: 400, fontSize: 11, color: "#444", marginTop: 14 }}>Sem cartão de crédito. Cancele quando quiser.</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ping { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.6); opacity: 0.3; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-5px); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.92) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes betaPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::selection { background: #C8F135; color: #111; }
        @media (max-width: 768px) {
          nav > div:first-child > div:last-child { display: none !important; }
          nav > div:last-child > a:first-child { display: none !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .hero-right-panel { max-width: 100% !important; }
          div[style*="repeat(4, 1fr)"] { grid-template-columns: 1fr 1fr !important; }
          div[style*="repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
          div[style*="1fr auto 1fr"] { grid-template-columns: 1fr !important; }
          section { padding-left: 24px !important; padding-right: 24px !important; }
          nav { padding: 0 20px !important; }
          footer { padding: 20px 24px !important; }
        }
      `}</style>
    </div>
  );
}
