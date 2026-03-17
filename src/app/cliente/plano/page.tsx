"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/hooks/useUserContext";

const T = {
  sand: "#FAF8F3", white: "#FFFFFF", ink: "#111111", inkSub: "#3D3D3D", inkMid: "#6B6B6B", inkFaint: "#A0A0A0",
  lime: "#C8F135", border: "#E8E5DE", borderMd: "#D1CCBF",
  green: "#166534", greenBg: "#DCFCE7", teal: "#0D7A6E", tealBg: "#E6F5F3", amber: "#B45309", amberBg: "#FEF3C7",
  red: "#DC2626", redBg: "#FEE2E2",
};

const PLANS: Record<string, { name: string; credits: number; price_usd: number; price_brl: number }> = {
  free: { name: "Free", credits: 20, price_usd: 0, price_brl: 0 },
  starter: { name: "Starter", credits: 100, price_usd: 29, price_brl: 149 },
  pro: { name: "Pro", credits: 300, price_usd: 79, price_brl: 397 },
  business: { name: "Business", credits: 800, price_usd: 179, price_brl: 897 },
  enterprise: { name: "Enterprise", credits: 2000, price_usd: 399, price_brl: 1997 },
};

const CREDIT_PACKS = [
  { credits: 50, price_usd: 19, price_brl: 97 },
  { credits: 200, price_usd: 59, price_brl: 297 },
  { credits: 500, price_usd: 119, price_brl: 597 },
];

type Transaction = {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
  order_id: string | null;
};

export default function PlanoPage() {
  const { ctx, loading: ctxLoading } = useUserContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/cliente"; return; }
      setUserId(data.user.id);
      sb.from("credit_transactions")
        .select("*")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false })
        .limit(50)
        .then(({ data: txs }) => {
          setTransactions(txs || []);
          setLoadingTx(false);
        });
    });
  }, []);

  const handleLogout = async () => {
    const sb = supabase();
    await sb.auth.signOut();
    window.location.href = "/cliente";
  };

  const handleUpgrade = (planKey: string) => {
    // TODO: integrate with Stripe checkout
    window.location.href = `/api/checkout?plan=${planKey}`;
  };

  const handleBuyCredits = (pack: typeof CREDIT_PACKS[0]) => {
    // TODO: integrate with Stripe checkout
    window.location.href = `/api/checkout?credits=${pack.credits}`;
  };

  if (ctxLoading || loadingTx) return (
    <div style={{ background: T.sand, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkMid, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15 }}>
      Carregando...
    </div>
  );

  const currentPlan = PLANS[ctx?.plan || "free"] || PLANS.free;
  const creditsUsed = currentPlan.credits - (ctx?.credits ?? 0);
  const usagePercent = currentPlan.credits > 0 ? Math.min((creditsUsed / currentPlan.credits) * 100, 100) : 0;
  const isLow = usagePercent > 80;

  // Estimate renewal: assume monthly, 30 days from last credit reset
  const totalDebits = transactions.filter(t => t.type === "debit").reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div style={{ background: T.sand, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/cliente/pedidos" style={{ textDecoration: "none" }}>
            <div style={{ background: T.ink, color: T.lime, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 20, padding: "4px 14px", borderRadius: 6 }}>Voku</div>
          </a>
          <span style={{ color: T.borderMd, fontSize: 20 }}>|</span>
          <a href="/cliente/pedidos" style={{ fontSize: 13, fontWeight: 600, color: T.inkMid, textDecoration: "none" }}>Home</a>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Plano & Créditos</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: T.inkMid, fontSize: 13 }}>{ctx?.name}</span>
          <button onClick={handleLogout} style={{ background: "transparent", border: `1.5px solid ${T.borderMd}`, color: T.inkSub, borderRadius: 8, padding: "6px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sair</button>
        </div>
      </div>

      <div style={{ padding: "32px 40px", maxWidth: 960, margin: "0 auto" }}>

        {/* Plano atual + créditos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>

          {/* Card do plano */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: "28px 28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: T.inkMid, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Plano atual</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: T.ink }}>{currentPlan.name}</div>
              </div>
              <div style={{ background: T.lime, color: T.ink, borderRadius: 10, padding: "6px 16px", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
                Ativo
              </div>
            </div>
            <div style={{ fontSize: 13, color: T.inkMid, marginBottom: 16 }}>
              {currentPlan.credits} créditos/mês · {currentPlan.price_usd > 0 ? `$${currentPlan.price_usd}/mês` : "Grátis"}
            </div>
            {ctx?.plan !== "enterprise" && (
              <button onClick={() => {
                const plans = Object.keys(PLANS);
                const currentIdx = plans.indexOf(ctx?.plan || "free");
                const nextPlan = plans[currentIdx + 1];
                if (nextPlan) handleUpgrade(nextPlan);
              }} style={{
                width: "100%", background: T.ink, color: T.lime, border: "none", borderRadius: 12,
                padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                Fazer upgrade →
              </button>
            )}
          </div>

          {/* Card de créditos */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: "28px 28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 12, color: T.inkMid, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Créditos disponíveis</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: isLow ? T.amber : T.ink }}>{ctx?.credits ?? 0}</span>
              <span style={{ fontSize: 16, color: T.inkFaint, fontWeight: 600 }}>/ {currentPlan.credits}</span>
            </div>

            {/* Barra de progresso */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ height: 8, background: T.sand, borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 4, transition: "width 0.5s",
                  width: `${usagePercent}%`,
                  background: isLow ? `linear-gradient(90deg, ${T.amber}, ${T.red})` : `linear-gradient(90deg, ${T.lime}, ${T.teal})`,
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 11, color: T.inkFaint }}>{creditsUsed} usados</span>
                <span style={{ fontSize: 11, color: isLow ? T.amber : T.inkFaint, fontWeight: isLow ? 700 : 400 }}>
                  {isLow ? "Créditos acabando!" : `${ctx?.credits ?? 0} restantes`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Comprar créditos avulsos */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: "0 0 16px" }}>Comprar créditos avulsos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {CREDIT_PACKS.map(pack => (
              <div key={pack.credits} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: T.ink, marginBottom: 4 }}>{pack.credits}</div>
                <div style={{ fontSize: 12, color: T.inkMid, fontWeight: 600, marginBottom: 12 }}>créditos</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.teal, marginBottom: 4 }}>R$ {pack.price_brl}</div>
                <div style={{ fontSize: 11, color: T.inkFaint, marginBottom: 16 }}>ou ${pack.price_usd} USD</div>
                <button onClick={() => handleBuyCredits(pack)} style={{
                  width: "100%", background: T.sand, border: `1.5px solid ${T.borderMd}`, color: T.ink,
                  borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  Comprar →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Planos disponíveis */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: "0 0 16px" }}>Planos disponíveis</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {Object.entries(PLANS).map(([key, plan]) => {
              const isCurrent = (ctx?.plan || "free") === key;
              return (
                <div key={key} style={{
                  background: isCurrent ? T.ink : T.white,
                  border: `1px solid ${isCurrent ? T.ink : T.border}`,
                  borderRadius: 16, padding: "20px 16px", textAlign: "center",
                  boxShadow: isCurrent ? "0 4px 20px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
                }}>
                  {isCurrent && <div style={{ fontSize: 9, fontWeight: 800, color: T.lime, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Seu plano</div>}
                  <div style={{ fontSize: 16, fontWeight: 800, color: isCurrent ? T.white : T.ink, marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: isCurrent ? T.lime : T.teal, marginBottom: 2 }}>
                    {plan.price_usd > 0 ? `$${plan.price_usd}` : "Grátis"}
                  </div>
                  <div style={{ fontSize: 11, color: isCurrent ? "#888" : T.inkFaint, marginBottom: 8 }}>/mês</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? T.lime : T.ink, marginBottom: 12 }}>{plan.credits} créditos</div>
                  {!isCurrent && (
                    <button onClick={() => handleUpgrade(key)} style={{
                      width: "100%", background: "transparent",
                      border: `1.5px solid ${T.borderMd}`, color: T.inkSub,
                      borderRadius: 8, padding: "8px", fontSize: 11, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                      {PLANS[ctx?.plan || "free"].credits < plan.credits ? "Upgrade" : "Mudar plano"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Histórico de consumo */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: "0 0 16px" }}>Histórico de consumo</h2>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 100px 100px", padding: "12px 24px", borderBottom: `1px solid ${T.border}`, background: T.sand }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: "uppercase", letterSpacing: "0.06em" }}>Data</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: "uppercase", letterSpacing: "0.06em" }}>Descrição</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right" }}>Créditos</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "right" }}>Tipo</span>
            </div>

            {transactions.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: T.inkFaint, fontSize: 14 }}>
                Nenhuma transação ainda.
              </div>
            ) : (
              transactions.map((tx, i) => (
                <div key={tx.id || i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 100px 100px", padding: "14px 24px", borderBottom: i < transactions.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: T.inkSub }}>
                    {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  <span style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>{tx.description}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, textAlign: "right", color: tx.amount < 0 ? T.red : T.green }}>
                    {tx.amount < 0 ? "" : "+"}{tx.amount}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, textAlign: "right",
                    color: tx.type === "debit" ? T.amber : T.green,
                  }}>
                    {tx.type === "debit" ? "Uso" : "Crédito"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
