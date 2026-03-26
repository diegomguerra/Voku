"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import OrderChoices from "@/components/OrderChoices";
import { useParams } from "next/navigation";

const FF = "'Plus Jakarta Sans', sans-serif";
const C = {
  bg: "#0a0a0a", card: "#141414", border: "#222",
  lime: "#C8F135", white: "#F0F0EC", sub: "#888", dark: "#111",
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [choices, setChoices] = useState<any[]>([]);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [iterationId, setIterationId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const sb = supabase();
      const { data: userData } = await sb.auth.getUser();
      if (!userData.user) { window.location.href = "/cliente"; return; }

      // Fetch order
      const { data: orderData, error: orderErr } = await sb
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderErr || !orderData) { setError("Pedido não encontrado."); setLoading(false); return; }
      if (orderData.user_id !== userData.user.id) { setError("Acesso negado."); setLoading(false); return; }
      setOrder(orderData);

      // Fetch choices
      const { data: choicesData } = await sb
        .from("choices")
        .select("*")
        .eq("order_id", orderId)
        .order("position", { ascending: true });
      setChoices(choicesData || []);

      // Fetch deliverables
      const { data: delData } = await sb
        .from("deliverables")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      setDeliverables(delData || []);

      // Fetch latest iteration
      const { data: iterData } = await sb
        .from("iterations")
        .select("id, status")
        .eq("order_id", orderId)
        .order("iteration_num", { ascending: false })
        .limit(1);
      if (iterData && iterData.length > 0) setIterationId(iterData[0].id);

      setLoading(false);
    }
    load();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: FF, fontSize: 14, color: C.sub }}>Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: FF, fontSize: 14, color: "#F87171" }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FF }}>
      {/* Navbar */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href="/cliente/pedidos" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ background: C.lime, color: C.dark, fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: "-0.5px", padding: "3px 12px", borderRadius: 6, textTransform: "uppercase" as const }}>VOKU</div>
            <span style={{ color: C.sub, fontSize: 13 }}>←</span>
            <span style={{ color: C.sub, fontSize: 13 }}>Meus Pedidos</span>
          </a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        <OrderChoices
          order={order}
          choices={choices}
          deliverables={deliverables}
          iterationId={iterationId}
        />
      </div>
    </div>
  );
}
