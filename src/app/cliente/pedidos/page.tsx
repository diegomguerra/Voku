"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const T = {
  sand: "#FAF8F3",
  white: "#FFFFFF",
  ink: "#111111",
  inkSub: "#3D3D3D",
  inkMid: "#6B6B6B",
  inkFaint: "#A0A0A0",
  lime: "#C8F135",
  border: "#E8E5DE",
  borderMd: "#D1CCBF",
  teal: "#0D7A6E",
  tealBg: "#E6F5F3",
  amber: "#B45309",
  amberBg: "#FEF3C7",
  emerald: "#166534",
  emeraldBg: "#DCFCE7",
};

const PRODUCTS: Record<string, string> = {
  landing_page_copy: "Landing Page Copy",
  content_pack: "Pacote de Conteúdo para Redes",
  email_sequence: "Sequência de E-mails de Nutrição",
};

const STATUSES: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  briefing: {
    label: "Briefing",
    color: T.amber,
    bg: T.amberBg,
    dot: "#F59E0B",
  },
  in_production: {
    label: "Em Produção",
    color: T.teal,
    bg: T.tealBg,
    dot: "#0D9488",
  },
  delivered: {
    label: "Entregue",
    color: T.emerald,
    bg: T.emeraldBg,
    dot: "#16A34A",
  },
};

type Order = {
  id: string;
  order_number: number;
  product: string;
  status: string;
  currency: string;
  amount: number;
  created_at: string;
  delivery_deadline: string;
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const sb = supabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      window.location.href = "/cliente";
      return;
    }
    setUserEmail(user.email || "");

    const { data } = await sb
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setOrders(data || []);
    setLoading(false);
  };

  const handleDownload = async (orderId: string, product: string) => {
    const sb = supabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;

    const filePath = `${user.id}/${product}_${orderId}.txt`;
    const { data } = await sb.storage
      .from("deliverables")
      .createSignedUrl(filePath, 300);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  const handleLogout = async () => {
    const sb = supabase();
    await sb.auth.signOut();
    window.location.href = "/cliente";
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR");

  const delivered = orders.filter((o) => o.status === "delivered").length;
  const inProgress = orders.filter(
    (o) => o.status === "in_production" || o.status === "briefing"
  ).length;

  if (loading) {
    return (
      <div
        style={{
          background: T.sand,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: T.inkMid,
          fontSize: 15,
        }}
      >
        Carregando...
      </div>
    );
  }

  return (
    <div
      style={{
        background: T.sand,
        minHeight: "100vh",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: T.white,
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          height: 64,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              background: T.ink,
              color: T.lime,
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontStyle: "italic",
              fontSize: 20,
              fontWeight: 400,
              padding: "4px 14px",
              borderRadius: 6,
            }}
          >
            Voku
          </div>
          <span
            style={{ color: T.borderMd, fontSize: 22, fontWeight: 200 }}
          >
            |
          </span>
          <span
            style={{
              color: T.inkSub,
              fontSize: 14,
              fontWeight: 500,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Meus Pedidos
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              color: T.inkMid,
              fontSize: 13,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {userEmail}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: `1.5px solid ${T.borderMd}`,
              color: T.inkSub,
              borderRadius: 8,
              padding: "6px 18px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 880, margin: "0 auto", padding: "40px 24px" }}>
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {[
            {
              label: "Total de pedidos",
              value: String(orders.length),
              color: T.ink,
            },
            {
              label: "Em andamento",
              value: String(inProgress),
              color: T.teal,
            },
            {
              label: "Entregues",
              value: String(delivered),
              color: T.emerald,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: T.white,
                border: `1px solid ${T.border}`,
                borderRadius: 16,
                padding: "22px 24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: T.inkMid,
                  fontWeight: 600,
                  marginBottom: 8,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: s.color,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Orders */}
        <div
          style={{
            display: "flex",
            flexDirection: "column" as const,
            gap: 14,
          }}
        >
          {orders.map((order) => {
            const st = STATUSES[order.status] || STATUSES.briefing;
            return (
              <div
                key={order.id}
                style={{
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  borderRadius: 18,
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    padding: "20px 28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: T.ink,
                        marginBottom: 4,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {PRODUCTS[order.product] || order.product}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: T.inkFaint,
                        fontWeight: 500,
                      }}
                    >
                      Pedido #{order.order_number}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      background: st.bg,
                      color: st.color,
                      borderRadius: 20,
                      padding: "6px 14px 6px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: st.dot,
                        display: "inline-block",
                      }}
                    />
                    {st.label}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    borderTop: `1px solid ${T.border}`,
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  {[
                    {
                      label: "Valor",
                      value: `${order.currency} ${order.amount}`,
                    },
                    { label: "Pedido em", value: fmtDate(order.created_at) },
                    {
                      label: "Entrega até",
                      value: fmtDate(order.delivery_deadline),
                    },
                  ].map((item, i) => (
                    <div
                      key={item.label}
                      style={{
                        padding: "14px 28px",
                        borderRight:
                          i < 2 ? `1px solid ${T.border}` : "none",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: T.inkFaint,
                          fontWeight: 600,
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.06em",
                          marginBottom: 4,
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{ fontSize: 15, fontWeight: 700, color: T.ink }}
                      >
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "16px 28px" }}>
                  {order.status === "delivered" && (
                    <button
                      onClick={() =>
                        handleDownload(order.id, order.product)
                      }
                      style={{
                        background: T.lime,
                        color: T.ink,
                        border: "none",
                        borderRadius: 10,
                        padding: "10px 24px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      ↓ Fazer download
                    </button>
                  )}
                  {order.status === "in_production" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        color: T.teal,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <span>⏳</span> Arquivo sendo preparado — entrega até{" "}
                      {fmtDate(order.delivery_deadline)}
                    </div>
                  )}
                  {order.status === "briefing" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        color: T.amber,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <span>📋</span> Aguardando confirmação do briefing
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 28,
            background: T.ink,
            borderRadius: 18,
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#FFFFFF",
                marginBottom: 4,
              }}
            >
              Precisa de mais conteúdo?
            </div>
            <div style={{ fontSize: 13, color: "#A0A0A0" }}>
              Novo pedido entregue em 24h.
            </div>
          </div>
          <a
            href="/#products"
            style={{
              background: T.lime,
              color: T.ink,
              border: "none",
              borderRadius: 10,
              padding: "12px 24px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              textDecoration: "none",
            }}
          >
            Ver produtos →
          </a>
        </div>
      </main>
    </div>
  );
}
