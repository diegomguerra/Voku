"use client";

import { useRouter } from "next/navigation";

const cards = [
  {
    id: "UNIFIED",
    label: "Mapa do Projeto",
    description: "Visão unificada de status, entregas e pipeline",
    href: "/admin/dashboard/unified",
    accent: false,
  },
  {
    id: "STATUS",
    label: "Status & Prompts",
    description: "Monitoramento de edge functions e prompts ativos",
    href: "/admin/dashboard/status",
    accent: false,
  },
  {
    id: "PROSPECCAO",
    label: "Prospecção",
    description: "Pipeline de leads, Upwork, Fiverr e Workana",
    href: "/admin/dashboard/prospeccao",
    accent: false,
  },
  {
    id: "MÍDIA",
    label: "Media Intelligence",
    description: "Aprovação, geração e publicação de conteúdo Instagram",
    href: "/admin/dashboard/media",
    accent: false,
  },
  {
    id: "FLUXO",
    label: "Fluxo Operacional",
    description: "Automações, n8n, e-mail e integrações ativas",
    href: "/admin/dashboard/fluxo",
    accent: false,
  },
  {
    id: "APROVAÇÃO",
    label: "Aprovação de Conteúdo",
    description: "Revisão e despacho semanal de posts",
    href: "/admin/aprovacao",
    accent: true,
  },
  {
    id: "VOKU V2",
    label: "Voku V2",
    description: "Plano de reestruturação completo — agente, créditos, plataforma",
    href: "/admin/dashboard/v2",
    accent: true,
    isNew: true,
  },
];

export default function OpsDashboard() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Topbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          borderBottom: "1px solid #f0f0f0",
          background: "#ffffff",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              background: "#111111",
              color: "#AAFF00",
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: 1,
              padding: "4px 10px",
              borderRadius: 4,
            }}
          >
            VOKU
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#888888",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            ADMIN
          </span>
        </div>
        <span style={{ fontSize: 12, color: "#cccccc" }}>
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 2,
          background: "#111111",
          padding: 2,
        }}
        className="dashboard-grid"
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => router.push(card.href)}
            style={{
              background: "#ffffff",
              border: "none",
              cursor: "pointer",
              padding: "36px 32px",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              position: "relative",
              transition: "background 0.15s",
              minHeight: 180,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#f9f9f9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#ffffff";
            }}
          >
            {/* New badge */}
            {card.isNew && (
              <span
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  background: "#AAFF00",
                  color: "#111111",
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: 3,
                }}
              >
                NOVO
              </span>
            )}

            {/* ID badge */}
            <span
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: card.accent ? "#111111" : "#aaaaaa",
                background: card.accent ? "#AAFF00" : "transparent",
                padding: card.accent ? "3px 8px" : "0",
                borderRadius: card.accent ? 3 : 0,
                marginBottom: 4,
                width: "fit-content",
              }}
            >
              {card.id}
            </span>

            {/* Label */}
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#111111",
                letterSpacing: -0.5,
                lineHeight: 1.2,
              }}
            >
              {card.label}
            </span>

            {/* Description */}
            <span
              style={{
                fontSize: 13,
                color: "#888888",
                lineHeight: 1.6,
                marginTop: 2,
              }}
            >
              {card.description}
            </span>

            {/* Arrow */}
            <span
              style={{
                position: "absolute",
                bottom: 24,
                right: 28,
                fontSize: 18,
                color: card.accent ? "#AAFF00" : "#dddddd",
                fontWeight: 300,
              }}
            >
              →
            </span>
          </button>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1100px) {
          .dashboard-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
