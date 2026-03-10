"use client";
import { useState, useEffect, useRef } from "react";

const FONTS = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=DM+Serif+Display:ital@0;1&display=swap";
const FF = "'Plus Jakarta Sans', sans-serif";
const FFS = "'DM Serif Display', serif";

/* ── COPY ─────────────────────────────────────────── */
const T = {
  PT: {
    nav: ["Serviços", "Processo", "Preços"],
    navCta: "Começar agora",
    navCliente: "Área do Cliente",
    eyebrow: "Serviço digitalizado · sem reunião · entrega em 24h",
    h1: "Você traz o\nproblema.",
    h1italic: "Nós entregamos.",
    sub: "Pacotes fixos de copy, conteúdo e e-mail. Preço visível. Entrega rápida. Sem proposta, sem reunião.",
    cta: "Quero meu projeto",
    ctaSec: "Ver serviços",
    trustBadges: ["Sem contrato longo", "Revisão inclusa", "24h–48h"],
    stats: [
      { n: "24h", l: "Primeira entrega" },
      { n: "3×", l: "Mais rápido que agência" },
      { n: "100%", l: "Revisão inclusa" },
      { n: "0", l: "Reuniões obrigatórias" },
    ],
    productsLabel: "PRODUTOS",
    productsTitle: "Escolha. Pague. Receba.",
    products: [
      {
        id: "copy",
        label: "01",
        name: "Landing Page Copy",
        price: "$100",
        delivery: "24h",
        tagline: "Copy que\nconverte.",
        desc: "Do hero ao CTA. Problema, solução, benefícios — tudo estruturado e pronto para publicar.",
        items: ["Hero · Problema · Solução · CTA", "3 variações de headline", "DOCX + PDF", "1 revisão inclusa"],
        cta: "Quero este →",
      },
      {
        id: "social",
        label: "02",
        name: "Social Media Pack",
        price: "$140",
        delivery: "48h",
        tagline: "12 posts.\nProntos.",
        desc: "Hook, caption e hashtags para Instagram, LinkedIn e TikTok — calendário incluso.",
        items: ["12 posts: hook + caption + hashtags", "Instagram · LinkedIn · TikTok", "DOCX + XLSX com calendário", "2 revisões inclusas"],
        featured: true,
        cta: "Quero este →",
      },
      {
        id: "email",
        label: "03",
        name: "Email Nurture",
        price: "$195",
        delivery: "48h",
        tagline: "5 emails.\nSem enrolação.",
        desc: "Do boas-vindas ao fechamento. Subject lines e preview text inclusos.",
        items: ["Welcome → Valor → Prova → Objeção → CTA", "Subject lines + preview text", "DOCX", "1 revisão inclusa"],
        cta: "Quero este →",
      },
    ],
    gapTitle: "O mercado tem dois extremos.",
    gapSub: "A Voku ocupa o meio.",
    gapItems: [
      { label: "Freelas nas plataformas", points: ["Preço invisível", "Sem processo", "Somem após entrega"] },
      { label: "VOKU", points: ["Preço âncora visível", "Pacote fixo + garantia", "Entrega em 24–48h"], highlight: true },
      { label: "Agências tradicionais", points: ["R$10k+/mês", "Reunião semanal", "6 meses de contrato"] },
    ],
    processLabel: "PROCESSO",
    processTitle: "4 etapas. Sem surpresa.",
    steps: [
      { n: "01", t: "Cadastro rápido", d: "Conta criada em 30 segundos." },
      { n: "02", t: "Briefing por IA", d: "Nossa IA organiza o projeto automaticamente." },
      { n: "03", t: "Proposta imediata", d: "Escopo, prazo e valor fixo. Sem negociação." },
      { n: "04", t: "Entrega + revisão", d: "Material pronto. Revisão inclusa." },
    ],
    proofQuote: "Precisava de copy para lançamento em 48h. A Voku entregou em 36h, revisado, pronto pra publicar.",
    proofAuthor: "— Eduardo M., fundador de SaaS, São Paulo",
    guaranteeTitle: "Garantia sem discussão.",
    guaranteeBody: "Não gostou? Refazemos. Sem questionamentos, sem custo extra.",
    finalTitle: "Pronto para resolver?",
    finalSub: "Crie sua conta grátis. Nossa IA organiza tudo.",
    finalCta: "Começar agora",
    footer: "We make it Happen.",
  },
  EN: {
    nav: ["Services", "Process", "Pricing"],
    navCta: "Get started",
    navCliente: "Client Area",
    eyebrow: "Productized service · no meeting · 24h delivery",
    h1: "You bring\nthe problem.",
    h1italic: "We deliver.",
    sub: "Fixed packages for copy, content and email. Visible pricing. Fast delivery. No proposals, no meetings.",
    cta: "Start my project",
    ctaSec: "See services",
    trustBadges: ["No long contracts", "Revision included", "24h–48h"],
    stats: [
      { n: "24h", l: "First delivery" },
      { n: "3×", l: "Faster than agencies" },
      { n: "100%", l: "Revision included" },
      { n: "0", l: "Mandatory meetings" },
    ],
    productsLabel: "PRODUCTS",
    productsTitle: "Choose. Pay. Receive.",
    products: [
      { id: "copy", label: "01", name: "Landing Page Copy", price: "$100", delivery: "24h", tagline: "Copy that\nconverts.", desc: "From hero to CTA. Problem, solution, benefits — structured and ready to publish.", items: ["Hero · Problem · Solution · CTA", "3 headline variations", "DOCX + PDF", "1 revision included"], cta: "I want this →" },
      { id: "social", label: "02", name: "Social Media Pack", price: "$140", delivery: "48h", tagline: "12 posts.\nReady.", desc: "Hook, caption and hashtags for Instagram, LinkedIn and TikTok — calendar included.", items: ["12 posts: hook + caption + hashtags", "Instagram · LinkedIn · TikTok", "DOCX + XLSX with calendar", "2 revisions included"], featured: true, cta: "I want this →" },
      { id: "email", label: "03", name: "Email Nurture", price: "$195", delivery: "48h", tagline: "5 emails.\nNo fluff.", desc: "From welcome to close. Subject lines and preview text included.", items: ["Welcome → Value → Proof → Objection → CTA", "Subject lines + preview text", "DOCX", "1 revision included"], cta: "I want this →" },
    ],
    gapTitle: "The market has two extremes.",
    gapSub: "Voku owns the middle.",
    gapItems: [
      { label: "Platform freelancers", points: ["Invisible pricing", "No process", "Disappear after delivery"] },
      { label: "VOKU", points: ["Visible anchor pricing", "Fixed package + guarantee", "Delivery in 24–48h"], highlight: true },
      { label: "Traditional agencies", points: ["$3k+/mo contracts", "Weekly meetings", "6-month lock-in"] },
    ],
    processLabel: "PROCESS",
    processTitle: "4 steps. No surprises.",
    steps: [
      { n: "01", t: "Quick signup", d: "Account created in 30 seconds." },
      { n: "02", t: "AI briefing", d: "Our AI organizes your project automatically." },
      { n: "03", t: "Instant proposal", d: "Fixed scope, deadline and price. No negotiation." },
      { n: "04", t: "Delivery + revision", d: "Ready material. Revision included." },
    ],
    proofQuote: "Needed launch copy in 48h. Voku delivered in 36h, revised, ready to publish.",
    proofAuthor: "— Eduardo M., SaaS founder, São Paulo",
    guaranteeTitle: "Guarantee. No questions.",
    guaranteeBody: "Don't like it? We redo it. No questions asked, no extra cost.",
    finalTitle: "Ready to solve it?",
    finalSub: "Create your free account. Our AI organizes everything.",
    finalCta: "Get started",
    footer: "We make it Happen.",
  },
  ES: {
    nav: ["Servicios", "Proceso", "Precios"],
    navCta: "Empezar ahora",
    navCliente: "Área del Cliente",
    eyebrow: "Servicio productizado · sin reunión · entrega en 24h",
    h1: "Tú traes\nel problema.",
    h1italic: "Nosotros entregamos.",
    sub: "Paquetes fijos de copy, contenido y email. Precio visible. Entrega rápida. Sin propuesta, sin reuniones.",
    cta: "Quiero mi proyecto",
    ctaSec: "Ver servicios",
    trustBadges: ["Sin contrato largo", "Revisión incluida", "24h–48h"],
    stats: [
      { n: "24h", l: "Primera entrega" },
      { n: "3×", l: "Más rápido que agencia" },
      { n: "100%", l: "Revisión incluida" },
      { n: "0", l: "Reuniones obligatorias" },
    ],
    productsLabel: "PRODUCTOS",
    productsTitle: "Elige. Paga. Recibe.",
    products: [
      { id: "copy", label: "01", name: "Landing Page Copy", price: "$100", delivery: "24h", tagline: "Copy que\nconvierte.", desc: "Desde el hero hasta el CTA. Problema, solución, beneficios — todo estructurado y listo para publicar.", items: ["Hero · Problema · Solución · CTA", "3 variaciones de headline", "DOCX + PDF", "1 revisión incluida"], cta: "Lo quiero →" },
      { id: "social", label: "02", name: "Social Media Pack", price: "$140", delivery: "48h", tagline: "12 posts.\nListos.", desc: "Hook, caption y hashtags para Instagram, LinkedIn y TikTok — calendario incluido.", items: ["12 posts: hook + caption + hashtags", "Instagram · LinkedIn · TikTok", "DOCX + XLSX con calendario", "2 revisiones incluidas"], featured: true, cta: "Lo quiero →" },
      { id: "email", label: "03", name: "Email Nurture", price: "$195", delivery: "48h", tagline: "5 emails.\nSin relleno.", desc: "De la bienvenida al cierre. Subject lines y preview text incluidos.", items: ["Bienvenida → Valor → Prueba → Objeción → CTA", "Subject lines + preview text", "DOCX", "1 revisión incluida"], cta: "Lo quiero →" },
    ],
    gapTitle: "El mercado tiene dos extremos.",
    gapSub: "Voku ocupa el medio.",
    gapItems: [
      { label: "Freelancers en plataformas", points: ["Precio invisible", "Sin proceso", "Desaparecen tras entrega"] },
      { label: "VOKU", points: ["Precio ancla visible", "Paquete fijo + garantía", "Entrega en 24–48h"], highlight: true },
      { label: "Agencias tradicionales", points: ["$3k+/mes de contrato", "Reunión semanal", "6 meses de fidelidad"] },
    ],
    processLabel: "PROCESO",
    processTitle: "4 pasos. Sin sorpresas.",
    steps: [
      { n: "01", t: "Registro rápido", d: "Cuenta creada en 30 segundos." },
      { n: "02", t: "Briefing por IA", d: "Nuestra IA organiza el proyecto automáticamente." },
      { n: "03", t: "Propuesta inmediata", d: "Alcance, plazo y precio fijo. Sin negociación." },
      { n: "04", t: "Entrega + revisión", d: "Material listo. Revisión incluida." },
    ],
    proofQuote: "Necesitaba copy de lanzamiento en 48h. Voku entregó en 36h, revisado, listo para publicar.",
    proofAuthor: "— Eduardo M., fundador de SaaS, São Paulo",
    guaranteeTitle: "Garantía sin discusión.",
    guaranteeBody: "¿No te gustó? Lo rehacemos. Sin preguntas, sin costo extra.",
    finalTitle: "¿Listo para resolverlo?",
    finalSub: "Crea tu cuenta gratis. Nuestra IA organiza todo.",
    finalCta: "Empezar ahora",
    footer: "We make it Happen.",
  },
};

/* ── HOOKS ────────────────────────────────────────── */
function useReveal() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
}

const fade = (vis, delay) => ({
  opacity: vis ? 1 : 0,
  transform: vis ? "translateY(0)" : "translateY(20px)",
  transition: "opacity 0.7s ease " + (delay || 0) + "s, transform 0.7s ease " + (delay || 0) + "s",
});

/* ── TICKER ───────────────────────────────────────── */
function Ticker({ lang }) {
  const items = {
    PT: ["Landing Page Copy · $100 · 24h", "Social Media Pack · $140 · 48h", "Email Nurture · $195 · 48h", "Sem Reunião", "Revisão Inclusa", "Preço Fixo"],
    EN: ["Landing Page Copy · $100 · 24h", "Social Media Pack · $140 · 48h", "Email Nurture · $195 · 48h", "No Meetings", "Revision Included", "Fixed Price"],
    ES: ["Landing Page Copy · $100 · 24h", "Social Media Pack · $140 · 48h", "Email Nurture · $195 · 48h", "Sin Reuniones", "Revisión Incluida", "Precio Fijo"],
  }[lang];
  const doubled = [...items, ...items];
  return (
    <div style={{ background: "#C8F135", overflow: "hidden", padding: "12px 0", borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", animation: "ticker 32s linear infinite", width: "max-content" }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ fontFamily: FF, fontSize: 11, fontWeight: 700, color: "#111", letterSpacing: 2, padding: "0 36px", whiteSpace: "nowrap" }}>{item}</span>
        ))}
      </div>
    </div>
  );
}

/* ── PRODUCT CARDS ────────────────────────────────── */
function ProductCards({ t, onCta }) {
  const [ref, vis] = useReveal();
  return (
    <section id="servicos" ref={ref} style={{ padding: "96px 64px", background: "#0a0a0a" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 64 }}>
          <div style={{ ...fade(vis), fontFamily: FF, fontSize: 10, fontWeight: 700, letterSpacing: 4, color: "#333", marginBottom: 14 }}>{t.productsLabel}</div>
          <h2 style={{ ...fade(vis, 0.06), fontFamily: FFS, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(32px,4vw,56px)", color: "#FAF8F3", margin: 0, lineHeight: 1.05, letterSpacing: -1 }}>{t.productsTitle}</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>
          {t.products.map((p, i) => (
            <div key={p.id} style={{ ...fade(vis, 0.08 + i * 0.1), background: p.featured ? "#141414" : "#0d0d0d", border: "1px solid " + (p.featured ? "#252525" : "#161616"), borderRadius: 2, padding: "36px 32px", position: "relative", display: "flex", flexDirection: "column" }}>
              {p.featured && (
                <div style={{ position: "absolute", top: 0, left: 36, background: "#C8F135", color: "#111", fontFamily: FF, fontSize: 9, fontWeight: 800, letterSpacing: 2, padding: "5px 14px", borderRadius: "0 0 6px 6px" }}>
                  MAIS PEDIDO
                </div>
              )}
              <div style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#333", marginBottom: 28, marginTop: p.featured ? 16 : 0 }}>{p.label}</div>
              <div style={{ fontFamily: FFS, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(28px,3vw,42px)", color: "#FAF8F3", lineHeight: 1.0, marginBottom: 24, whiteSpace: "pre-line", letterSpacing: -0.5 }}>{p.tagline}</div>
              <p style={{ fontFamily: FF, fontSize: 13, color: "#555", lineHeight: 1.75, marginBottom: 28 }}>{p.desc}</p>
              <div style={{ marginBottom: 32, flex: 1 }}>
                {p.items.map((item, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 9 }}>
                    <span style={{ color: "#C8F135", fontSize: 11, marginTop: 2, flexShrink: 0 }}>→</span>
                    <span style={{ fontFamily: FF, fontSize: 13, color: "#444", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontFamily: FF, fontSize: 10, color: "#333", letterSpacing: 1, marginBottom: 4 }}>a partir de</div>
                  <div style={{ fontFamily: FF, fontWeight: 900, fontSize: 38, color: "#FAF8F3", lineHeight: 1, letterSpacing: -1 }}>{p.price}</div>
                  <div style={{ fontFamily: FF, fontSize: 10, color: "#444", marginTop: 4, letterSpacing: 1 }}>{p.delivery} · DOCX</div>
                </div>
                <button onClick={onCta} style={{ background: p.featured ? "#C8F135" : "#161616", color: p.featured ? "#111" : "#FAF8F3", border: p.featured ? "none" : "1px solid #252525", borderRadius: 6, padding: "12px 22px", fontFamily: FF, fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5, transition: "opacity 0.2s" }}
                  onMouseEnter={e => { e.target.style.opacity = "0.8"; }}
                  onMouseLeave={e => { e.target.style.opacity = "1"; }}>
                  {p.cta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── GAP SECTION ─────────────────────────────────── */
function GapSection({ t }) {
  const [ref, vis] = useReveal();
  return (
    <section ref={ref} style={{ padding: "96px 64px", background: "#070707" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ ...fade(vis), fontFamily: FF, fontSize: 10, fontWeight: 700, letterSpacing: 4, color: "#333", marginBottom: 40 }}>POSICIONAMENTO</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
          {t.gapItems.map((col, i) => (
            <div key={i} style={{ ...fade(vis, 0.06 + i * 0.08), borderLeft: "2px solid " + (col.highlight ? "#C8F135" : "#161616"), paddingLeft: 24, paddingRight: 40 }}>
              <div style={{ fontFamily: FF, fontSize: 12, fontWeight: col.highlight ? 800 : 600, color: col.highlight ? "#C8F135" : "#2a2a2a", marginBottom: 16, letterSpacing: 0.3 }}>{col.label}</div>
              {col.points.map((p, j) => (
                <div key={j} style={{ fontFamily: FF, fontSize: 13, color: col.highlight ? "#FAF8F3" : "#2d2d2d", lineHeight: 1.9, fontWeight: col.highlight ? 400 : 300 }}>{p}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── PROCESS ─────────────────────────────────────── */
function ProcessSection({ t }) {
  const [ref, vis] = useReveal();
  return (
    <section id="processo" ref={ref} style={{ padding: "96px 64px", background: "#0a0a0a" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 72 }}>
          <div style={{ ...fade(vis), fontFamily: FF, fontSize: 10, fontWeight: 700, letterSpacing: 4, color: "#333", marginBottom: 14 }}>{t.processLabel}</div>
          <h2 style={{ ...fade(vis, 0.06), fontFamily: FFS, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(32px,4vw,52px)", color: "#FAF8F3", margin: 0, letterSpacing: -1 }}>{t.processTitle}</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0 }}>
          {t.steps.map((s, i) => (
            <div key={i} style={{ ...fade(vis, 0.08 + i * 0.1), padding: "0 32px 0 0", borderRight: i < t.steps.length - 1 ? "1px solid #161616" : "none", paddingRight: i < t.steps.length - 1 ? 32 : 0, paddingLeft: i > 0 ? 32 : 0 }}>
              <div style={{ fontFamily: FF, fontWeight: 800, fontSize: 11, color: "#C8F135", letterSpacing: 3, marginBottom: 24 }}>{s.n}</div>
              <div style={{ fontFamily: FF, fontWeight: 600, fontSize: 17, color: "#FAF8F3", marginBottom: 10, lineHeight: 1.3 }}>{s.t}</div>
              <div style={{ fontFamily: FF, fontWeight: 300, fontSize: 13, color: "#444", lineHeight: 1.8 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── PROOF ───────────────────────────────────────── */
function ProofSection({ t, onCta }) {
  const [ref, vis] = useReveal();
  return (
    <section ref={ref} style={{ padding: "96px 64px", background: "#070707" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
        <blockquote style={{ ...fade(vis), fontFamily: FFS, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(18px,2.4vw,28px)", color: "#555", lineHeight: 1.6, margin: "0 0 20px", borderLeft: "2px solid #C8F135", textAlign: "left", paddingLeft: 28 }}>
          {t.proofQuote}
        </blockquote>
        <div style={{ ...fade(vis, 0.1), fontFamily: FF, fontSize: 12, color: "#2d2d2d", letterSpacing: 0.5, marginBottom: 56, textAlign: "left", paddingLeft: 28 }}>{t.proofAuthor}</div>
        <div style={{ ...fade(vis, 0.18), display: "flex", gap: 20, alignItems: "flex-start", background: "#0f0f0f", border: "1px solid #161616", borderRadius: 2, padding: "28px 32px", textAlign: "left" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#C8F135", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🛡️</div>
          <div>
            <div style={{ fontFamily: FF, fontSize: 15, fontWeight: 700, color: "#FAF8F3", marginBottom: 6 }}>{t.guaranteeTitle}</div>
            <div style={{ fontFamily: FF, fontSize: 13, color: "#444", lineHeight: 1.7 }}>{t.guaranteeBody}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── REGISTER MODAL ──────────────────────────────── */
function RegisterModal({ t, lang, onClose }) {
  const [step, setStep] = useState("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState(null);
  const chatRef = useRef(null);

  const canProceed = name.trim().length > 0 && email.includes("@");

  useEffect(() => {
    if (step === "chat" && messages.length === 0) {
      const g = lang === "PT"
        ? "Olá, " + name + "! Sou o assistente da Voku. Qual produto te interessa — Copy, Social Pack ou Email Nurture?"
        : lang === "EN"
          ? "Hi " + name + "! I'm Voku's assistant. Which product interests you — Copy, Social Pack or Email Nurture?"
          : "Hola " + name + "! Soy el asistente de Voku. ¿Qué producto te interesa?";
      setMessages([{ role: "assistant", text: g }]);
    }
  }, [step, lang, name, messages.length]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  async function send() {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const sys = lang === "PT"
        ? "Você é o assistente da Voku. Converse naturalmente, uma pergunta por vez. Após 4-5 trocas, confirme o briefing. Quando confirmado, responda SOMENTE com JSON: {\"briefingConfirmado\":true,\"servico\":\"...\",\"objetivo\":\"...\",\"prazo\":\"...\",\"resumo\":\"...\"}"
        : "You are Voku's assistant. Chat naturally, one question at a time. After 4-5 exchanges, confirm the brief. When confirmed, respond ONLY with JSON: {\"briefingConfirmado\":true,\"servico\":\"...\",\"objetivo\":\"...\",\"prazo\":\"...\",\"resumo\":\"...\"}";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: sys,
          messages: [...messages, { role: "user", text: msg }].map(m => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json();
      const reply = (data.content && data.content[0] && data.content[0].text) || "";
      try {
        const parsed = JSON.parse(reply.replace(/```json|```/g, "").trim());
        if (parsed.briefingConfirmado) { setBriefing(parsed); setStep("done"); setLoading(false); return; }
      } catch (_) {}
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch (_) {
      setMessages(prev => [...prev, { role: "assistant", text: "Erro. Tente novamente." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 4, width: "100%", maxWidth: 500, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.6)" }}>
        <div style={{ background: "#0a0a0a", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: FF, fontSize: 13, fontWeight: 800, color: "#C8F135", letterSpacing: 2 }}>VOKU</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        {step === "form" && (
          <div style={{ padding: "40px 32px" }}>
            <h3 style={{ fontFamily: FFS, fontStyle: "italic", fontWeight: 400, fontSize: 30, color: "#111", margin: "0 0 6px" }}>Vamos começar.</h3>
            <p style={{ fontFamily: FF, fontSize: 13, color: "#999", marginBottom: 28, lineHeight: 1.6 }}>Conta grátis em 30 segundos.</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" style={{ width: "100%", padding: "13px 16px", border: "1.5px solid #e8e8e0", borderRadius: 6, fontFamily: FF, fontSize: 14, color: "#111", outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" type="email" style={{ width: "100%", padding: "13px 16px", border: "1.5px solid #e8e8e0", borderRadius: 6, fontFamily: FF, fontSize: 14, color: "#111", outline: "none", marginBottom: 24, boxSizing: "border-box" }} />
            <button onClick={() => canProceed && setStep("chat")} style={{ width: "100%", padding: "15px", borderRadius: 6, background: canProceed ? "#0a0a0a" : "#e8e8e0", color: canProceed ? "#fff" : "#aaa", border: "none", fontFamily: FF, fontSize: 14, fontWeight: 700, cursor: canProceed ? "pointer" : "default" }}>
              Continuar →
            </button>
          </div>
        )}

        {step === "chat" && (
          <>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f0e8" }}>
              <p style={{ fontFamily: FF, fontSize: 13, color: "#888", margin: 0 }}>Olá, <strong style={{ color: "#111" }}>{name}</strong> 👋</p>
            </div>
            <div ref={chatRef} style={{ overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 14, minHeight: 280, maxHeight: 360 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  {m.role === "assistant" && (
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 9, flexShrink: 0, fontSize: 10, color: "#C8F135", fontWeight: 800 }}>V</div>
                  )}
                  <div style={{ maxWidth: "80%", padding: "10px 15px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? "#0a0a0a" : "#f8f8f4", color: m.role === "user" ? "#FAF8F3" : "#111", fontFamily: FF, fontSize: 13, lineHeight: 1.6, border: m.role === "assistant" ? "1px solid #eee" : "none" }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#C8F135", fontWeight: 800 }}>V</div>
                  <div style={{ padding: "10px 15px", background: "#f8f8f4", borderRadius: "16px 16px 16px 4px", border: "1px solid #eee", display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#ccc", animation: "bounce 1.2s ease-in-out " + (i * 0.2) + "s infinite" }} />)}
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid #f0f0e8", display: "flex", gap: 10 }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Digite aqui..." style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #e8e8e0", borderRadius: 6, fontFamily: FF, fontSize: 13, color: "#111", outline: "none" }} />
              <button onClick={send} disabled={!input.trim() || loading} style={{ padding: "10px 16px", borderRadius: 6, background: input.trim() ? "#0a0a0a" : "#e8e8e0", color: input.trim() ? "#fff" : "#aaa", border: "none", fontFamily: FF, fontWeight: 700, cursor: "pointer" }}>→</button>
            </div>
          </>
        )}

        {step === "done" && briefing && (
          <div style={{ padding: "36px 32px" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#C8F135", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 20 }}>✓</div>
              <h3 style={{ fontFamily: FFS, fontStyle: "italic", fontWeight: 400, fontSize: 26, color: "#111", margin: "0 0 8px" }}>Briefing confirmado!</h3>
              <p style={{ fontFamily: FF, fontSize: 13, color: "#888" }}>Você receberá a proposta em até 2h em <strong>{email}</strong></p>
            </div>
            <button onClick={onClose} style={{ width: "100%", padding: "14px", borderRadius: 6, background: "#0a0a0a", color: "#fff", border: "none", fontFamily: FF, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Fechar</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── CURSOR ──────────────────────────────────────── */
function Cursor() {
  const [p, setP] = useState({ x: -100, y: -100 });
  const [big, setBig] = useState(false);
  useEffect(() => {
    const mv = e => setP({ x: e.clientX, y: e.clientY });
    const ov = e => { if (e.target.closest("a,button")) setBig(true); };
    const ou = () => setBig(false);
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseover", ov);
    window.addEventListener("mouseout", ou);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseover", ov); window.removeEventListener("mouseout", ou); };
  }, []);
  return (
    <div style={{ position: "fixed", zIndex: 9999, pointerEvents: "none", width: big ? 36 : 8, height: big ? 36 : 8, borderRadius: "50%", background: big ? "rgba(200,241,53,0.12)" : "#C8F135", border: big ? "1px solid rgba(200,241,53,0.4)" : "none", transform: "translate(" + (p.x - (big ? 18 : 4)) + "px," + (p.y - (big ? 18 : 4)) + "px)", transition: "width 0.15s,height 0.15s,background 0.15s,border 0.15s,transform 0.06s" }} />
  );
}

/* ── MAIN ────────────────────────────────────────── */
export default function VokuLanding() {
  const [lang, setLang] = useState("PT");
  const [navSolid, setNavSolid] = useState(false);
  const [hero, setHero] = useState(false);
  const [modal, setModal] = useState(false);
  const [ctaRef, ctaVis] = useReveal();
  const t = T[lang];

  useEffect(() => {
    const link = document.createElement("link");
    link.href = FONTS; link.rel = "stylesheet";
    document.head.appendChild(link);
    setTimeout(() => setHero(true), 100);
  }, []);

  useEffect(() => {
    const fn = () => setNavSolid(window.scrollY > 32);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ background: "#0a0a0a", color: "#FAF8F3", overflowX: "hidden", cursor: "none" }}>
      <Cursor />
      {modal && <RegisterModal t={t} lang={lang} onClose={() => setModal(false)} />}

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 500, height: 60, background: navSolid ? "rgba(6,6,6,0.97)" : "transparent", backdropFilter: navSolid ? "blur(20px)" : "none", borderBottom: navSolid ? "1px solid #161616" : "1px solid transparent", padding: "0 64px", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.3s" }}>
        <div style={{ fontFamily: FF, fontWeight: 900, fontSize: 19, letterSpacing: -0.5, color: "#FAF8F3" }}>VOKU</div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {t.nav.map((item, i) => (
            <a key={i} href={["#servicos", "#processo", "#precos"][i]} style={{ fontFamily: FF, fontSize: 13, fontWeight: 500, color: "#444", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.target.style.color = "#FAF8F3"} onMouseLeave={e => e.target.style.color = "#444"}>{item}</a>
          ))}
          <div style={{ display: "flex", gap: 1, background: "#111", borderRadius: 5, padding: 3 }}>
            {["PT", "EN", "ES"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ background: lang === l ? "#C8F135" : "transparent", color: lang === l ? "#111" : "#444", border: "none", borderRadius: 4, padding: "3px 9px", fontFamily: FF, fontSize: 10, fontWeight: 800, cursor: "pointer", transition: "all 0.2s", letterSpacing: 0.5 }}>{l}</button>
            ))}
          </div>
          <a href="/cliente" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 5, border: "1px solid #1e1e1e", fontFamily: FF, fontSize: 12, fontWeight: 600, color: "#444", textDecoration: "none", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#FAF8F3"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.color = "#444"; }}>
            {t.navCliente}
          </a>
          <button onClick={() => setModal(true)} style={{ background: "#C8F135", color: "#111", border: "none", borderRadius: 5, padding: "9px 20px", fontFamily: FF, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={e => { e.target.style.opacity = "0.85"; }} onMouseLeave={e => { e.target.style.opacity = "1"; }}>{t.navCta}</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 64px 72px", position: "relative", overflow: "hidden" }}>
        
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          {/* Eyebrow */}
          <div style={{ opacity: hero ? 1 : 0, transform: hero ? "translateY(0)" : "translateY(10px)", transition: "all 0.5s ease 0.05s", display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8F135", animation: "ping 2.5s ease-in-out infinite" }} />
            <span style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, color: "#C8F135", letterSpacing: 3 }}>VOKU · SERVIÇO DIGITALIZADO</span>
          </div>

          {/* H1 — editorial, massivo */}
          <h1 style={{ fontFamily: FFS, fontWeight: 400, margin: "0 0 0", lineHeight: 0.88, letterSpacing: -4, color: "#FAF8F3" }}>
            {t.h1.split("\n").map((line, i) => (
              <span key={i} style={{ display: "block", fontSize: "clamp(64px,9vw,136px)", opacity: hero ? 1 : 0, transform: hero ? "translateY(0)" : "translateY(40px)", transition: "all 0.8s ease " + (0.1 + i * 0.1) + "s" }}>{line}</span>
            ))}
            <span style={{ display: "block", fontSize: "clamp(64px,9vw,136px)", fontStyle: "italic", color: "#C8F135", opacity: hero ? 1 : 0, transform: hero ? "translateY(0)" : "translateY(40px)", transition: "all 0.8s ease 0.3s" }}>{t.h1italic}</span>
          </h1>

          {/* Linha divisória + sub + CTAs */}
          <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "end" }}>
            <div>
              <div style={{ width: "100%", height: 1, background: "#1a1a1a", marginBottom: 32, opacity: hero ? 1 : 0, transition: "opacity 0.6s ease 0.4s" }} />
              <p style={{ opacity: hero ? 1 : 0, transition: "opacity 0.6s ease 0.44s", fontFamily: FF, fontSize: 15, color: "#444", lineHeight: 1.8, margin: "0 0 32px", maxWidth: 440 }}>{t.sub}</p>
              <div style={{ opacity: hero ? 1 : 0, transition: "opacity 0.6s ease 0.5s", display: "flex", gap: 12 }}>
                <button onClick={() => setModal(true)} style={{ background: "#C8F135", color: "#111", border: "none", borderRadius: 5, padding: "15px 32px", fontFamily: FF, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.25s" }}
                  onMouseEnter={e => { e.target.style.opacity = "0.88"; e.target.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.target.style.opacity = "1"; e.target.style.transform = "none"; }}>
                  {t.cta}
                </button>
                <a href="#servicos" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 28px", borderRadius: 5, border: "1px solid #1e1e1e", fontFamily: FF, fontSize: 14, fontWeight: 600, color: "#444", textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#C8F135"; e.currentTarget.style.color = "#C8F135"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.color = "#444"; }}>
                  {t.ctaSec} ↓
                </a>
              </div>
            </div>

            {/* Stats */}
            <div style={{ opacity: hero ? 1 : 0, transition: "opacity 0.6s ease 0.56s", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              {t.stats.map((s, i) => (
                <div key={i} style={{ padding: "24px 0 24px " + (i % 2 === 0 ? 0 : 28) + "px", borderLeft: i % 2 === 1 ? "1px solid #1a1a1a" : "none", borderTop: i > 1 ? "1px solid #1a1a1a" : "none", paddingTop: i > 1 ? 24 : 0 }}>
                  <div style={{ fontFamily: FFS, fontStyle: "italic", fontSize: "clamp(28px,3vw,44px)", color: "#FAF8F3", lineHeight: 1, marginBottom: 6 }}>{s.n}</div>
                  <div style={{ fontFamily: FF, fontSize: 11, color: "#333", letterSpacing: 0.3 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <Ticker lang={lang} />

      {/* ── PRODUCTS ── */}
      <ProductCards t={t} onCta={() => setModal(true)} />

      {/* ── GAP ── */}
      <GapSection t={t} />

      {/* ── PROCESS ── */}
      <ProcessSection t={t} />

      {/* ── PROOF ── */}
      <ProofSection t={t} onCta={() => setModal(true)} />

      {/* ── FINAL CTA ── */}
      <section id="precos" ref={ctaRef} style={{ padding: "120px 64px", background: "#0a0a0a", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 800, height: 400, background: "radial-gradient(ellipse, rgba(200,241,53,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <h2 style={{ ...fade(ctaVis), fontFamily: FFS, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(40px,6vw,80px)", lineHeight: 1.0, letterSpacing: -2, color: "#FAF8F3", marginBottom: 24 }}>
            {t.finalTitle.split("?")[0]}
            <span style={{ color: "#C8F135" }}>?</span>
          </h2>
          <p style={{ ...fade(ctaVis, 0.1), fontFamily: FF, fontSize: 16, color: "#444", lineHeight: 1.7, marginBottom: 44 }}>{t.finalSub}</p>
          <button onClick={() => setModal(true)} style={{ ...fade(ctaVis, 0.18), background: "#C8F135", color: "#111", border: "none", borderRadius: 5, padding: "18px 52px", fontFamily: FF, fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 0.25s" }}
            onMouseEnter={e => { e.target.style.opacity = "0.88"; e.target.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.target.style.opacity = "1"; e.target.style.transform = "translateY(0)"; }}>
            {t.finalCta} →
          </button>
          <div style={{ ...fade(ctaVis, 0.26), marginTop: 20, fontFamily: FF, fontSize: 11, color: "#222", letterSpacing: 2 }}>
            Workana · Fiverr · voku.one
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#060606", padding: "24px 64px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #111" }}>
        <div style={{ fontFamily: FF, fontWeight: 900, fontSize: 16, color: "#161616" }}>VOKU</div>
        <div style={{ fontFamily: FF, fontSize: 11, color: "#222", letterSpacing: 1.5 }}>voku.one · {t.footer}</div>
        <div style={{ fontFamily: FF, fontSize: 10, color: "#161616", letterSpacing: 0.5 }}>Voku LLC · Wyoming · © 2026</div>
      </footer>

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes ping { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.7); opacity: 0.25; } }
        @keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-5px); } }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::selection { background: #C8F135; color: #111; }
        a, button { cursor: none !important; }
      `}</style>
    </div>
  );
}
