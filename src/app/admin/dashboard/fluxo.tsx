"use client";
// @ts-nocheck
import { useState } from "react";
import AdminHeader from "@/components/AdminHeader";

const COLORS = {
  bg: "#0A0A0A",
  surface: "#111111",
  card: "#161616",
  border: "#222222",
  accent: "#E9F59E",
  accentDim: "#c8d878",
  text: "#F0F0EC",
  muted: "#666666",
  dim: "#333333",
  claude: "#7C6FCD",
  claudeLight: "#A99FE0",
  supabase: "#3ECF8E",
  vercel: "#FFFFFF",
  resend: "#FF6B6B",
  fiverr: "#1DBF73",
  workana: "#FF6B35",
  stripe: "#635BFF",
  google: "#4285F4",
};

const platforms = [
  {
    id: "fiverr",
    name: "Fiverr",
    role: "Canal de venda USD",
    color: COLORS.fiverr,
    icon: "🌍",
    subscription: "Conta gratuita — comissão 20% por venda",
    when: "Cliente chega pelo marketplace",
  },
  {
    id: "workana",
    name: "Workana",
    role: "Canal de venda BRL",
    color: COLORS.workana,
    icon: "🇧🇷",
    subscription: "Conta gratuita — comissão variável",
    when: "Cliente chega pelo marketplace",
  },
  {
    id: "voku",
    name: "voku.one",
    role: "Landing page + cadastro",
    color: COLORS.accent,
    icon: "✦",
    subscription: "Domínio próprio (já contratado)",
    when: "Captura lead, briefing, fluxo completo",
  },
  {
    id: "vercel",
    name: "Vercel",
    role: "Hospedagem + funções serverless",
    color: COLORS.vercel,
    icon: "▲",
    subscription: "Plano gratuito no início",
    when: "Roda o site e as automações de backend",
  },
  {
    id: "supabase",
    name: "Supabase",
    role: "Banco de dados + storage + auth",
    color: COLORS.supabase,
    icon: "⚡",
    subscription: "Plano gratuito no início (500MB)",
    when: "Armazena cadastros, briefings, pedidos, arquivos",
  },
  {
    id: "anthropic",
    name: "Anthropic API",
    role: "Execução inteligente (RORDENS)",
    color: COLORS.claude,
    icon: "◈",
    subscription: "Pay-per-use — ~$0.01–0.05 por produto gerado",
    when: "Formulário inteligente + execução do produto",
  },
  {
    id: "resend",
    name: "Resend",
    role: "E-mails transacionais",
    color: COLORS.resend,
    icon: "✉",
    subscription: "Gratuito até 3.000 e-mails/mês",
    when: "Confirmação de pedido, entrega, follow-up",
  },
  {
    id: "google",
    name: "Google Workspace",
    role: "E-mail profissional",
    color: COLORS.google,
    icon: "G",
    subscription: "Já contratado (2 e-mails)",
    when: "Comunicação com cliente, notificações internas",
  },
  {
    id: "stripe",
    name: "Stripe",
    role: "Pagamento direto (futuro)",
    color: COLORS.stripe,
    icon: "⬡",
    subscription: "2.9% + $0.30 por transação",
    when: "Quando cliente comprar direto pelo voku.one",
  },
];

const steps = [
  {
    id: 1,
    label: "ENTRADA",
    title: "Cliente descobre a Voku",
    desc: "Chega pelo Fiverr, Workana ou direto em voku.one via busca / redes sociais.",
    platforms: ["fiverr", "workana", "voku"],
    color: COLORS.accent,
    icon: "01",
  },
  {
    id: 2,
    label: "ESCOLHA",
    title: "Seleciona o produto",
    desc: "Visualiza os 3 produtos com preço visível. Escolhe: Landing Page Copy / Pacote de Posts / Sequência de E-mails.",
    platforms: ["voku"],
    color: COLORS.accent,
    icon: "02",
  },
  {
    id: 3,
    label: "CADASTRO",
    title: "Cria conta rápida",
    desc: "Nome + e-mail em 30 segundos. Sem cartão. Conta criada no Supabase Auth automaticamente.",
    platforms: ["voku", "supabase"],
    color: COLORS.supabase,
    icon: "03",
  },
  {
    id: 4,
    label: "BRIEFING",
    title: "Formulário inteligente com IA",
    desc: "RORDENS conversa com o cliente via chat. Faz as perguntas certas. Gera o briefing estruturado em JSON e salva no Supabase.",
    platforms: ["voku", "anthropic", "supabase"],
    color: COLORS.claude,
    icon: "04",
  },
  {
    id: 5,
    label: "CONFIRMAÇÃO",
    title: "E-mail automático disparado",
    desc: "Resend envia e-mail de confirmação com: produto escolhido, prazo exato de entrega e número do pedido.",
    platforms: ["resend", "google"],
    color: COLORS.resend,
    icon: "05",
  },
  {
    id: 6,
    label: "EXECUÇÃO",
    title: "RORDENS executa o produto",
    desc: "A API da Anthropic recebe o briefing, gera o conteúdo completo (copy, posts ou e-mails) no formato definido.",
    platforms: ["anthropic", "vercel"],
    color: COLORS.claude,
    icon: "06",
  },
  {
    id: 7,
    label: "GERAÇÃO",
    title: "Arquivo gerado automaticamente",
    desc: "Vercel converte o output em DOCX + PDF ou XLSX. Arquivo salvo no Supabase Storage com link privado por cliente.",
    platforms: ["vercel", "supabase"],
    color: COLORS.supabase,
    icon: "07",
  },
  {
    id: 8,
    label: "ENTREGA",
    title: "Cliente recebe e acessa",
    desc: "Resend dispara e-mail de entrega com link de acesso. Cliente entra na área própria em voku.one e faz o download.",
    platforms: ["resend", "voku", "supabase"],
    color: COLORS.accent,
    icon: "08",
  },
];

const PlatformBadge = ({ id, small }) => {
  const p = platforms.find((x) => x.id === id);
  if (!p) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: p.color + "18",
        border: `1px solid ${p.color}44`,
        color: p.color,
        borderRadius: 4,
        padding: small ? "2px 7px" : "3px 10px",
        fontSize: small ? 10 : 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        fontFamily: "monospace",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: small ? 9 : 10 }}>{p.icon}</span> {p.name}
    </span>
  );
};

export default function VokuFlow() {
  const [active, setActive] = useState<number | null>(null);
  const [activePlat, setActivePlat] = useState<string | null>(null);

  const selectedStep = steps.find((s) => s.id === active);
  const selectedPlat = platforms.find((p) => p.id === activePlat);

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        color: COLORS.text,
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        padding: "0 0 80px",
      }}
    >
      <AdminHeader title="Fluxo Operacional" sub="FLUXO" />

      <div style={{ padding: "0 40px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Section: Fluxo */}
        <div style={{ marginTop: 48 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.15em",
              color: COLORS.muted,
              marginBottom: 20,
            }}
          >
            [ 01 / FLUXO DO CLIENTE ]
          </div>

          {/* Steps */}
          <div style={{ position: "relative" }}>
            {/* Vertical line */}
            <div
              style={{
                position: "absolute",
                left: 27,
                top: 20,
                bottom: 20,
                width: 1,
                background: `linear-gradient(to bottom, ${COLORS.accent}44, ${COLORS.claude}44, ${COLORS.supabase}44)`,
              }}
            />

            {steps.map((step, i) => {
              const isActive = active === step.id;
              return (
                <div
                  key={step.id}
                  onClick={() => setActive(isActive ? null : step.id)}
                  style={{
                    display: "flex",
                    gap: 20,
                    marginBottom: 12,
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  {/* Node */}
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: isActive ? step.color + "22" : COLORS.card,
                      border: `1.5px solid ${isActive ? step.color : COLORS.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: isActive ? step.color : COLORS.muted,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      transition: "all 0.2s",
                      zIndex: 1,
                    }}
                  >
                    {step.icon}
                  </div>

                  {/* Card */}
                  <div
                    style={{
                      flex: 1,
                      background: isActive ? COLORS.card : COLORS.surface,
                      border: `1px solid ${isActive ? step.color + "55" : COLORS.border}`,
                      borderRadius: 8,
                      padding: "14px 20px",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: isActive ? 10 : 0,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span
                          style={{
                            fontSize: 9,
                            letterSpacing: "0.12em",
                            color: step.color,
                            fontWeight: 700,
                          }}
                        >
                          {step.label}
                        </span>
                        <span style={{ color: COLORS.muted, fontSize: 9 }}>—</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                          {step.title}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {step.platforms.map((pid) => (
                          <PlatformBadge key={pid} id={pid} small />
                        ))}
                      </div>
                    </div>

                    {isActive && (
                      <div
                        style={{
                          color: COLORS.muted,
                          fontSize: 12,
                          lineHeight: 1.7,
                          borderTop: `1px solid ${COLORS.border}`,
                          paddingTop: 10,
                        }}
                      >
                        {step.desc}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Plataformas */}
        <div style={{ marginTop: 64 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.15em",
              color: COLORS.muted,
              marginBottom: 20,
            }}
          >
            [ 02 / PLATAFORMAS — QUEM É QUEM ]
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
              gap: 12,
            }}
          >
            {platforms.map((p) => {
              const isActive = activePlat === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePlat(isActive ? null : p.id)}
                  style={{
                    background: isActive ? COLORS.card : COLORS.surface,
                    border: `1px solid ${isActive ? p.color + "66" : COLORS.border}`,
                    borderRadius: 8,
                    padding: "16px 20px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: p.color + "18",
                        border: `1px solid ${p.color}33`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        color: p.color,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {p.icon}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: p.color }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 10, color: COLORS.muted }}>{p.role}</div>
                    </div>
                  </div>

                  {isActive && (
                    <div
                      style={{
                        borderTop: `1px solid ${COLORS.border}`,
                        paddingTop: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 9,
                            letterSpacing: "0.1em",
                            color: COLORS.muted,
                            marginBottom: 3,
                          }}
                        >
                          ASSINATURA / CUSTO
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.text }}>{p.subscription}</div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 9,
                            letterSpacing: "0.1em",
                            color: COLORS.muted,
                            marginBottom: 3,
                          }}
                        >
                          QUANDO ENTRA NO FLUXO
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.text }}>{p.when}</div>
                      </div>
                    </div>
                  )}

                  {!isActive && (
                    <div style={{ fontSize: 10, color: COLORS.muted }}>{p.subscription}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Resumo de Custo */}
        <div style={{ marginTop: 64 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.15em",
              color: COLORS.muted,
              marginBottom: 20,
            }}
          >
            [ 03 / CUSTO DE INFRAESTRUTURA — MVP ]
          </div>

          <div
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {[
              { plat: "Vercel", cost: "$0/mês", note: "Plano gratuito cobre MVP" },
              { plat: "Supabase", cost: "$0/mês", note: "500MB gratuito — suficiente para início" },
              { plat: "Resend", cost: "$0/mês", note: "3.000 e-mails/mês gratuitos" },
              { plat: "Google Workspace", cost: "Já pago", note: "2 e-mails contratados" },
              { plat: "Anthropic API", cost: "~$0.05/produto", note: "Pay-per-use — custo só quando vende" },
              { plat: "Fiverr / Workana", cost: "~20% comissão", note: "Descontado da venda — sem custo fixo" },
              { plat: "Stripe", cost: "2.9% + $0.30", note: "Só quando ativar pagamento direto" },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "180px 120px 1fr",
                  padding: "12px 20px",
                  borderBottom: i < 6 ? `1px solid ${COLORS.border}` : "none",
                  alignItems: "center",
                  fontSize: 12,
                }}
              >
                <span style={{ color: COLORS.text, fontWeight: 600 }}>{row.plat}</span>
                <span
                  style={{
                    color: row.cost === "Já pago" ? COLORS.supabase : COLORS.accent,
                    fontWeight: 700,
                  }}
                >
                  {row.cost}
                </span>
                <span style={{ color: COLORS.muted }}>{row.note}</span>
              </div>
            ))}

            {/* Total */}
            <div
              style={{
                background: COLORS.accent + "11",
                borderTop: `1px solid ${COLORS.accent}33`,
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: COLORS.accent, fontWeight: 700, fontSize: 13, letterSpacing: "0.05em" }}>
                CUSTO FIXO MENSAL DO MVP
              </span>
              <span style={{ color: COLORS.accent, fontWeight: 700, fontSize: 18 }}>$0</span>
            </div>
          </div>

          <div style={{ color: COLORS.muted, fontSize: 11, marginTop: 12, lineHeight: 1.6 }}>
            ↳ Você só paga quando vende. Infraestrutura gratuita até escalar para centenas de pedidos por mês.
          </div>
        </div>

        {/* Section: Produtos */}
        <div style={{ marginTop: 64 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.15em",
              color: COLORS.muted,
              marginBottom: 20,
            }}
          >
            [ 04 / PRODUTOS MVP ]
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              {
                name: "Landing Page Copy",
                usd: "$97",
                brl: "R$497",
                prazo: "24h",
                output: "DOCX + PDF",
                color: COLORS.accent,
              },
              {
                name: "Pacote de Conteúdo para Redes",
                usd: "$147",
                brl: "R$747",
                prazo: "48h",
                output: "DOCX + XLSX",
                color: COLORS.claudeLight,
              },
              {
                name: "Sequência de E-mails de Nutrição",
                usd: "$127",
                brl: "R$647",
                prazo: "48h",
                output: "DOCX",
                color: COLORS.supabase,
              },
            ].map((prod, i) => (
              <div
                key={i}
                style={{
                  background: COLORS.card,
                  border: `1px solid ${prod.color}33`,
                  borderRadius: 10,
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: prod.color,
                    marginBottom: 16,
                    lineHeight: 1.4,
                  }}
                >
                  {prod.name}
                </div>
                {[
                  { label: "USD", value: prod.usd },
                  { label: "BRL", value: prod.brl },
                  { label: "PRAZO", value: prod.prazo },
                  { label: "ENTREGA", value: prod.output },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: `1px solid ${COLORS.border}`,
                      fontSize: 11,
                    }}
                  >
                    <span style={{ color: COLORS.muted, letterSpacing: "0.08em" }}>{row.label}</span>
                    <span style={{ color: COLORS.text, fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
