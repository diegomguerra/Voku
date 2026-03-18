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
  const [billing, setBilling] = useState<"monthly" | "annual" | "addons">("monthly");
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
          <div style={{ background: T.ink, color: "#fff", fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 20, letterSpacing: "-0.5px", padding: "4px 14px", borderRadius: 6, textTransform: "uppercase" as const }}>VOKU</div>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/cliente" style={{ fontSize: 13, fontWeight: 600, color: T.inkSub, textDecoration: "none" }}>Login</a>
          <a href="/cliente" style={{ background: T.ink, color: T.lime, padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Começar grátis</a>
        </div>
      </div>

      {/* Beta Hero + Card */}
      <div style={{ padding: "60px 20px 80px", background: "#0d0d0d" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 48, color: "#ffffff", margin: "0 0 12px", letterSpacing: "-2px" }}>
            Comece agora.
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 16, color: "#888", margin: 0 }}>
            Plataforma completa. 7 dias para explorar.
          </p>
        </div>

        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ background: "#111111", border: "1.5px solid #C8F135", borderRadius: 16, padding: "48px 40px", textAlign: "center" }}>

            <span style={{ display: "inline-block", background: "#C8F135", color: "#111", fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: 3, padding: "6px 16px", borderRadius: 20 }}>
              ✦ ACESSO BETA
            </span>

            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 32, color: "#ffffff", marginTop: 24 }}>
              7 dias grátis.
            </div>

            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15, color: "#888", marginTop: 12, lineHeight: 1.7 }}>
              Acesso completo à plataforma. Sem cartão, sem compromisso.<br />
              Explore tudo antes de escolher seu plano.
            </div>

            <div style={{ height: 1, background: "#222", marginTop: 32, marginBottom: 32 }} />

            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Créditos ilimitados por 7 dias",
                "Todos os produtos desbloqueados",
                "Chat com agente IA",
                "Landing pages, posts, e-mails, apps",
                "Sem limite de projetos",
              ].map(item => (
                <div key={item} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "#C8F135", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14 }}>→</span>
                  <span style={{ color: "#ffffff", fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14 }}>{item}</span>
                </div>
              ))}
            </div>

            <a href="/cliente" style={{
              display: "block", marginTop: 40, width: "100%", background: "#C8F135", color: "#111",
              fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 16,
              padding: 18, borderRadius: 10, border: "none", textDecoration: "none", textAlign: "center",
              boxSizing: "border-box",
            }}>
              Criar conta grátis →
            </a>

            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 12, color: "#444", marginTop: 16 }}>
              Em breve: planos a partir de R$149/mês.
            </div>
          </div>
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
