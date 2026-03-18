"use client";
import { useState } from "react";

const T = {
  sand: "#FAF8F3", white: "#FFFFFF", ink: "#111111", inkSub: "#3D3D3D", inkMid: "#6B6B6B", inkFaint: "#A0A0A0",
  lime: "#C8F135", border: "#E8E5DE", borderMd: "#D1CCBF",
  green: "#166534", greenBg: "#DCFCE7", teal: "#0D7A6E", tealBg: "#E6F5F3",
};

const PLANS = [
  {
    key: "free", name: "Free", popular: false,
    monthly: 0, annual: 0,
    credits: 20,
    features: ["20 créditos/mês", "Chat com agente IA", "1 projeto por vez", "Suporte por e-mail"],
    cta: "Começar grátis",
  },
  {
    key: "starter", name: "Starter", popular: false,
    monthly: 149, annual: 124,
    credits: 100,
    features: ["100 créditos/mês", "Chat com agente IA", "Projetos ilimitados", "Calendário editorial", "Suporte prioritário"],
    cta: "Assinar Starter",
  },
  {
    key: "pro", name: "Pro", popular: true,
    monthly: 397, annual: 331,
    credits: 300,
    features: ["300 créditos/mês", "Chat com agente IA", "Projetos ilimitados", "Calendário editorial", "Landing pages com IA", "Geração em batch", "Suporte prioritário"],
    cta: "Assinar Pro",
  },
  {
    key: "business", name: "Business", popular: false,
    monthly: 897, annual: 748,
    credits: 800,
    features: ["800 créditos/mês", "Tudo do Pro", "API de integração", "Múltiplos usuários", "Account manager dedicado"],
    cta: "Assinar Business",
  },
  {
    key: "enterprise", name: "Enterprise", popular: false,
    monthly: 1997, annual: 1664,
    credits: 2000,
    features: ["2.000 créditos/mês", "Tudo do Business", "SLA garantido", "White-label disponível", "Onboarding personalizado"],
    cta: "Falar com vendas",
  },
];

const FAQ = [
  {
    q: "O que são créditos?",
    a: "Créditos são a moeda interna da Voku. Cada tipo de conteúdo consome uma quantidade diferente: um post para Instagram usa 8 créditos, um carrossel 15, um roteiro de Reels 10, copy para ads 10, e-mails 25, landing page 40. Seus créditos renovam todo mês.",
  },
  {
    q: "Posso mudar de plano a qualquer momento?",
    a: "Sim! O upgrade é imediato — você recebe os créditos extras na hora. Se fizer downgrade, ele vale a partir do próximo ciclo de cobrança.",
  },
  {
    q: "E se meus créditos acabarem antes do fim do mês?",
    a: "Você pode comprar pacotes avulsos de créditos (50, 200 ou 500) sem precisar mudar de plano. Os créditos avulsos não expiram.",
  },
  {
    q: "Como funciona o cancelamento?",
    a: "Cancele a qualquer momento pelo painel, sem burocracia. Você mantém acesso até o fim do período pago. Sem multa, sem perguntas.",
  },
  {
    q: "O plano anual tem desconto?",
    a: "Sim! No plano anual você economiza o equivalente a 2 meses — paga 10 meses e usa 12.",
  },
  {
    q: "Posso testar antes de assinar?",
    a: "Claro. O plano Free dá 20 créditos por mês para você experimentar o agente, gerar conteúdo e ver a qualidade antes de investir.",
  },
];

export default function PrecosPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCheckout = (planKey: string) => {
    if (planKey === "free") {
      window.location.href = "/cliente";
      return;
    }
    if (planKey === "enterprise") {
      window.location.href = "mailto:ola@voku.one?subject=Enterprise";
      return;
    }
    window.location.href = `/api/checkout?plan=${planKey}&billing=${billing}`;
  };

  return (
    <div style={{ background: T.sand, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

      {/* Nav */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <div style={{ background: T.ink, color: T.lime, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 20, padding: "4px 14px", borderRadius: 6 }}>Voku</div>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/cliente" style={{ fontSize: 13, fontWeight: 600, color: T.inkSub, textDecoration: "none" }}>Login</a>
          <a href="/cliente" style={{ background: T.ink, color: T.lime, padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Começar grátis</a>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "60px 20px 40px" }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: T.ink, margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
          Planos simples, resultado real.
        </h1>
        <p style={{ fontSize: 16, color: T.inkMid, margin: "0 0 32px", maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
          Escolha seu plano e comece a criar conteúdo profissional em minutos. Sem contratos, cancele quando quiser.
        </p>

        {/* Toggle mensal/anual */}
        <div style={{ display: "inline-flex", background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: 4 }}>
          <button onClick={() => setBilling("monthly")} style={{
            padding: "10px 24px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700,
            fontFamily: "inherit", cursor: "pointer",
            background: billing === "monthly" ? T.ink : "transparent",
            color: billing === "monthly" ? T.lime : T.inkMid,
          }}>Mensal</button>
          <button onClick={() => setBilling("annual")} style={{
            padding: "10px 24px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700,
            fontFamily: "inherit", cursor: "pointer", position: "relative",
            background: billing === "annual" ? T.ink : "transparent",
            color: billing === "annual" ? T.lime : T.inkMid,
          }}>
            Anual
            <span style={{
              position: "absolute", top: -8, right: -12,
              background: T.green, color: T.white, fontSize: 9, fontWeight: 800,
              padding: "2px 6px", borderRadius: 6,
            }}>-17%</span>
          </button>
        </div>
      </div>

      {/* Grid de planos */}
      <div style={{ padding: "0 40px 60px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, alignItems: "start" }}>
          {PLANS.map(plan => {
            const price = billing === "monthly" ? plan.monthly : plan.annual;
            return (
              <div key={plan.key} style={{
                background: plan.popular ? T.ink : T.white,
                border: plan.popular ? `2px solid ${T.lime}` : `1px solid ${T.border}`,
                borderRadius: 20, padding: "28px 20px 24px",
                boxShadow: plan.popular ? "0 8px 40px rgba(0,0,0,0.15)" : "0 2px 12px rgba(0,0,0,0.04)",
                position: "relative", transform: plan.popular ? "scale(1.04)" : "none",
              }}>
                {/* Badge popular */}
                {plan.popular && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: T.lime, color: T.ink, fontSize: 10, fontWeight: 800,
                    padding: "4px 14px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 1,
                    whiteSpace: "nowrap",
                  }}>Mais popular</div>
                )}

                <div style={{ fontSize: 18, fontWeight: 800, color: plan.popular ? T.white : T.ink, marginBottom: 8 }}>
                  {plan.name}
                </div>

                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: plan.popular ? T.lime : T.ink }}>
                    {price > 0 ? `R$${price}` : "Grátis"}
                  </span>
                  {price > 0 && <span style={{ fontSize: 14, color: plan.popular ? "#888" : T.inkFaint }}>/mês</span>}
                </div>

                {billing === "annual" && price > 0 && (
                  <div style={{ fontSize: 11, color: T.green, fontWeight: 700, marginBottom: 4 }}>
                    cobrado anualmente · 2 meses grátis
                  </div>
                )}

                <div style={{ fontSize: 14, fontWeight: 700, color: plan.popular ? T.lime : T.teal, marginBottom: 20 }}>
                  {plan.credits} créditos/mês
                </div>

                {/* Features */}
                <div style={{ marginBottom: 24 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ color: plan.popular ? T.lime : T.green, fontSize: 13, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 12, color: plan.popular ? "#ccc" : T.inkSub, lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button onClick={() => handleCheckout(plan.key)} style={{
                  width: "100%", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700,
                  fontFamily: "inherit", cursor: "pointer",
                  background: plan.popular ? T.lime : plan.key === "free" ? T.sand : T.ink,
                  color: plan.popular ? T.ink : plan.key === "free" ? T.inkSub : T.lime,
                }}>
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding: "0 40px 80px", maxWidth: 720, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: T.ink, textAlign: "center", margin: "0 0 32px", letterSpacing: "-0.02em" }}>
          Perguntas frequentes
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "18px 24px", background: "transparent", border: "none",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{item.q}</span>
                <span style={{ fontSize: 18, color: T.inkFaint, transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginLeft: 16 }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: "0 24px 18px" }}>
                  <p style={{ fontSize: 14, color: T.inkSub, lineHeight: 1.7, margin: 0 }}>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA final */}
      <div style={{ background: T.ink, padding: "60px 40px", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: T.white, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          Pronto para criar conteúdo que converte?
        </h2>
        <p style={{ fontSize: 15, color: "#888", margin: "0 0 28px" }}>Comece grátis. Sem cartão de crédito.</p>
        <a href="/cliente" style={{ background: T.lime, color: T.ink, padding: "16px 36px", borderRadius: 12, fontSize: 16, fontWeight: 800, textDecoration: "none", display: "inline-block" }}>
          Começar agora →
        </a>
        <div style={{ marginTop: 16, fontSize: 12, color: "#555" }}>Voku LLC · Wyoming, USA · voku.one</div>
      </div>
    </div>
  );
}
