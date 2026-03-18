"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/hooks/useUserContext";
import OrderChoices from "@/components/OrderChoices";

const T = {
  sand:"#FAF8F3",white:"#FFFFFF",ink:"#111111",inkSub:"#3D3D3D",inkMid:"#6B6B6B",inkFaint:"#A0A0A0",
  lime:"#C8F135",border:"#E8E5DE",borderMd:"#D1CCBF",
  green:"#166534",greenBg:"#DCFCE7",teal:"#0D7A6E",tealBg:"#E6F5F3",amber:"#B45309",amberBg:"#FEF3C7",
};

const PRODUCT_NAME: Record<string,string> = {
  landing_page_copy:"Landing Page Copy",
  content_pack:"Pacote de Conteúdo para Redes",
  email_sequence:"Sequência de E-mails de Nutrição",
  post_instagram:"Post para Instagram",
  carrossel:"Carrossel para Instagram",
  reels_script:"Roteiro de Reels",
  ad_copy:"Copy para Meta Ads",
  app:"App Web",
};

const UPGRADE_THRESHOLD = 0.2; // 20%

const STATUS: Record<string,{label:string;color:string;bg:string;dot:string}> = {
  briefing:{label:"Briefing",color:T.amber,bg:T.amberBg,dot:"#F59E0B"},
  in_production:{label:"Em Produção",color:T.teal,bg:T.tealBg,dot:"#0D9488"},
  delivered:{label:"Entregue",color:T.green,bg:T.greenBg,dot:"#16A34A"},
};

const QUICK_STARTS = [
  "Preciso de copy para anúncio",
  "Quero posts para Instagram",
  "Me ajuda com uma landing page",
  "Quero ver meus créditos",
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function PedidosPage() {
  const { ctx, loading: ctxLoading } = useUserContext();
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<"pedidos" | "chat">("chat");
  const [isMobile, setIsMobile] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<{ orderId: string; choices: any[]; iterationId: string | null; orderData: any } | null>(null);
  const [choicesApproved, setChoicesApproved] = useState(false);
  const [landingPageSlugs, setLandingPageSlugs] = useState<Record<string, string>>({});
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const bottomRef = useRef<HTMLDivElement>(null);
  const userIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detecta mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Carrega pedidos + histórico de chat
  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/cliente"; return; }
      userIdRef.current = data.user.id;

      // Pedidos
      sb.from("orders")
        .select("*,deliverables(*)")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false })
        .then(async ({ data: orders }) => {
          setOrders(orders || []);
          setOrdersLoading(false);

          // Busca slugs de landing pages para pedidos entregues
          const lpOrders = (orders || []).filter((o: any) => o.product === "landing_page_copy" && o.status === "delivered");
          if (lpOrders.length > 0) {
            const slugMap: Record<string, string> = {};
            for (const o of lpOrders) {
              const { data: lp } = await sb.from("landing_pages").select("slug").eq("order_id", o.id).single();
              if (lp?.slug) slugMap[o.id] = lp.slug;
            }
            setLandingPageSlugs(slugMap);
          }
        });

      // Histórico de chat
      sb.from("chat_messages")
        .select("role, content")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: true })
        .limit(20)
        .then(({ data: msgs }) => {
          if (msgs && msgs.length > 0) {
            setMessages(msgs.map((m: any) => ({ role: m.role, content: m.content })));
            setChatStarted(true);
          }
        });
    });
  }, []);

  // Scroll automático do chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  // Polling para choices
  const pollForChoices = useCallback((orderId: string) => {
    let attempts = 0;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 30) { clearInterval(pollRef.current!); pollRef.current = null; return; }
      const sb = supabase();
      const { data: choices } = await sb.from("choices").select("*").eq("order_id", orderId);
      if (choices && choices.length > 0) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        // Busca iteration_id
        const { data: iterations } = await sb.from("iterations").select("id").eq("order_id", orderId).order("created_at", { ascending: false }).limit(1);
        // Busca order data
        const { data: orderData } = await sb.from("orders").select("*").eq("id", orderId).single();
        setPendingOrder({
          orderId,
          choices,
          iterationId: iterations?.[0]?.id || null,
          orderData: orderData || { id: orderId, order_number: 0, product: "", status: "in_production", delivered_at: null },
        });
      }
    }, 3000);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Persiste mensagem no banco
  const persistMessage = useCallback(async (role: "user" | "assistant", content: string) => {
    if (!userIdRef.current) return;
    const sb = supabase();
    await sb.from("chat_messages").insert({ user_id: userIdRef.current, role, content });
  }, []);

  // Watch for order approval (OrderChoices sets status to "delivered")
  useEffect(() => {
    if (!pendingOrder || choicesApproved) return;
    const interval = setInterval(async () => {
      const sb = supabase();
      const { data: order } = await sb.from("orders").select("status").eq("id", pendingOrder.orderId).single();
      if (order?.status === "delivered") {
        clearInterval(interval);
        setChoicesApproved(true);
        await persistMessage("assistant", "Material aprovado e pronto para download ✓");
        // Refresh orders list
        const { data: updatedOrders } = await sb.from("orders")
          .select("*,deliverables(*)")
          .eq("user_id", userIdRef.current!)
          .order("created_at", { ascending: false });
        if (updatedOrders) setOrders(updatedOrders);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [pendingOrder, choicesApproved, persistMessage]);

  const sendMessage = useCallback(async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || chatLoading) return;
    setInput("");
    setChatStarted(true);

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setChatLoading(true);

    // Persiste mensagem do usuário
    await persistMessage("user", userText);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const res = await fetch(`${supabaseUrl}/functions/v1/voku-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          user_context: {
            name: ctx?.name || "você",
            plan: ctx?.plan || "free",
            credits: ctx?.credits ?? 0,
            channel: "dashboard",
            user_id: userIdRef.current,
          },
        }),
      });

      const data = await res.json();
      const reply = data?.content?.[0]?.text || "Ops, tive um problema. Pode repetir?";

      // Remove JSON de action se vier na resposta
      const cleanReply = reply.replace(/\{[\s\S]*"action"[\s\S]*\}/g, "").trim();

      const withReply: ChatMessage[] = [...newMessages, { role: "assistant", content: cleanReply }];
      setMessages(withReply);
      await persistMessage("assistant", cleanReply);

      // ACTION=EXECUTE — submete briefing e cria pedido
      if (data?.action?.action === "execute") {
        const statusMsg: ChatMessage = { role: "assistant", content: "✦ Criando seu pedido..." };
        setMessages([...withReply, statusMsg]);

        try {
          const briefingRes = await fetch("/api/submit-briefing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data.action.structured_data),
          });
          const briefingData = await briefingRes.json();

          if (briefingData?.order_id) {
            setCreatedOrderId(briefingData.order_id);
            const successMsg = `Pedido criado! Suas opções estão sendo preparadas ✓`;
            const finalMessages: ChatMessage[] = [...withReply, { role: "assistant", content: successMsg }];
            setMessages(finalMessages);
            await persistMessage("assistant", successMsg);

            // Recarrega pedidos
            const sb = supabase();
            const { data: updatedOrders } = await sb.from("orders")
              .select("*,deliverables(*)")
              .eq("user_id", userIdRef.current!)
              .order("created_at", { ascending: false });
            if (updatedOrders) setOrders(updatedOrders);

            // Inicia polling para choices
            pollForChoices(briefingData.order_id);
          } else {
            const errMsg = "Ops, houve um problema ao criar o pedido. Tente novamente.";
            setMessages([...withReply, { role: "assistant", content: errMsg }]);
            await persistMessage("assistant", errMsg);
          }
        } catch {
          const errMsg = "Erro ao criar pedido. Tenta de novo!";
          setMessages([...withReply, { role: "assistant", content: errMsg }]);
          await persistMessage("assistant", errMsg);
        }
      }
    } catch {
      const errMsg = "Ops, algo deu errado. Tenta de novo!";
      setMessages([...messages, { role: "user", content: userText }, { role: "assistant", content: errMsg }]);
      await persistMessage("assistant", errMsg);
    }

    setChatLoading(false);
  }, [input, messages, chatLoading, ctx, persistMessage, isMobile, pollForChoices]);

  const handleLogout = async () => {
    const sb = supabase();
    await sb.auth.signOut();
    window.location.href = "/cliente";
  };

  const handleDownload = async (order: any) => {
    const d = order.deliverables?.[0];
    if (!d) return;
    const sb = supabase();
    const { data } = await sb.storage.from("deliverables").createSignedUrl(d.file_path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (ctxLoading || ordersLoading) return (
    <div style={{ background: T.sand, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkMid, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15 }}>
      Carregando...
    </div>
  );

  /* ─── Pedidos column content ─── */
  const pedidosContent = (
    <div style={{ padding: isMobile ? "20px 16px" : "32px 40px", overflowY: "auto" }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: isMobile ? 8 : 16, marginBottom: isMobile ? 20 : 28 }}>
        {[
          { label: "Total de pedidos", value: orders.length.toString(), color: T.ink },
          { label: "Em andamento", value: orders.filter(o => o.status === "in_production").length.toString(), color: T.teal },
          { label: "Entregues", value: orders.filter(o => o.status === "delivered").length.toString(), color: T.green },
        ].map(s => (
          <div key={s.label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: isMobile ? "14px 12px" : "22px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: isMobile ? 10 : 12, color: T.inkMid, fontWeight: 600, marginBottom: isMobile ? 4 : 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            <div style={{ fontSize: isMobile ? 24 : 36, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Banner de upgrade */}
      {ctx?.plan_credits && ctx.credits <= ctx.plan_credits * UPGRADE_THRESHOLD && ctx.credits > 0 && (
        <div style={{ background: `linear-gradient(135deg, ${T.ink}, #1a1a2e)`, borderRadius: 14, padding: "18px 24px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.lime, marginBottom: 2 }}>Créditos acabando!</div>
            <div style={{ fontSize: 12, color: "#A0A0A0" }}>Você tem {ctx.credits} créditos restantes. Faça upgrade para continuar criando.</div>
          </div>
          <a href="/precos" style={{ background: T.lime, color: T.ink, border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>Fazer upgrade →</a>
        </div>
      )}

      {/* Filtros */}
      {orders.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.inkSub, fontFamily: "inherit", cursor: "pointer" }}>
            <option value="all">Todos os tipos</option>
            {Object.entries(PRODUCT_NAME).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.inkSub, fontFamily: "inherit", cursor: "pointer" }}>
            <option value="all">Todos os status</option>
            <option value="briefing">Briefing</option>
            <option value="in_production">Em Produção</option>
            <option value="delivered">Entregue</option>
          </select>
          {(filterType !== "all" || filterStatus !== "all") && (
            <button onClick={() => { setFilterType("all"); setFilterStatus("all"); }} style={{ background: "transparent", border: "none", color: T.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Limpar filtros</button>
          )}
        </div>
      )}

      {/* Lista de pedidos */}
      {orders.length === 0 ? (
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: isMobile ? "40px 20px" : "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>✦</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Nenhum pedido ainda.</div>
          <div style={{ fontSize: 14, color: T.inkMid, marginBottom: 24 }}>Use o chat {isMobile ? "na aba ao lado" : "ao lado"} para criar seu primeiro projeto.</div>
          {isMobile && (
            <button onClick={() => setActiveTab("chat")} style={{ background: T.lime, color: T.ink, border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Ir para o chat →
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orders.filter(o => (filterType === "all" || o.product === filterType) && (filterStatus === "all" || o.status === filterStatus)).map((order) => {
            const st = STATUS[order.status] || STATUS.briefing;
            const deadline = order.delivery_deadline ? new Date(order.delivery_deadline) : null;
            return (
              <div key={order.id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div style={{ padding: isMobile ? "16px 16px" : "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{PRODUCT_NAME[order.product] || order.product}</div>
                    <div style={{ fontSize: 12, color: T.inkFaint }}>Pedido #{order.order_number}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, background: st.bg, color: st.color, borderRadius: 20, padding: "6px 14px 6px 10px", fontSize: 12, fontWeight: 700 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: st.dot, display: "inline-block" }} />
                    {st.label}
                  </div>
                </div>
                {!isMobile && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
                    {[
                      { label: "Valor", value: `${order.currency} ${order.amount}` },
                      { label: "Pedido em", value: new Date(order.created_at).toLocaleDateString("pt-BR") },
                      { label: "Entrega até", value: deadline ? deadline.toLocaleDateString("pt-BR") : "—" },
                    ].map((item, i) => (
                      <div key={item.label} style={{ padding: "14px 28px", borderRight: i < 2 ? `1px solid ${T.border}` : "none" }}>
                        <div style={{ fontSize: 11, color: T.inkFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ padding: isMobile ? "12px 16px" : "16px 28px" }}>
                  {order.status === "delivered" && (
                    <>
                      <a href={`/cliente/pedidos/${order.id}`} style={{ background: T.lime, color: T.ink, border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "inline-block" }}>↓ Ver pedido / Download</a>
                      {landingPageSlugs[order.id] && (
                        <iframe
                          src={`/lp/${landingPageSlugs[order.id]}`}
                          style={{ width: "100%", height: 400, border: `1px solid ${T.border}`, borderRadius: 12, marginTop: 12 }}
                          title="Preview da Landing Page"
                        />
                      )}
                    </>
                  )}
                  {order.status === "in_production" && (
                    <a href={`/cliente/pedidos/${order.id}`} style={{ color: T.teal, fontSize: 13, fontWeight: 600, textDecoration: "none", display: "inline-block" }}>✦ Ver opções / Acompanhar →</a>
                  )}
                  {order.status === "briefing" && (
                    <div style={{ color: T.amber, fontSize: 13, fontWeight: 600 }}>📋 Aguardando confirmação do briefing</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ─── Chat column content ─── */
  const chatContent = (
    <div style={{ background: T.white, borderRight: isMobile ? "none" : `1px solid ${T.border}`, display: "flex", flexDirection: "column", height: isMobile ? "calc(100vh - 64px - 48px)" : "calc(100vh - 64px)", position: isMobile ? "relative" : "sticky", top: isMobile ? undefined : 64 }}>

      {/* Chat header */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.ink, color: T.lime, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>V</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Voku</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
              <span style={{ fontSize: 11, color: T.inkMid }}>online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {!chatStarted && (
          <div>
            <div style={{ background: T.sand, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: T.inkSub, lineHeight: 1.6, margin: 0 }}>
                Oi{ctx?.name ? `, ${ctx.name.split(" ")[0]}` : ""}! 👋 O que você precisa criar hoje?
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {QUICK_STARTS.map(q => (
                <button key={q} onClick={() => sendMessage(q)} style={{ background: T.sand, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", color: T.inkSub, fontSize: 12, fontWeight: 500, cursor: "pointer", textAlign: "left", fontFamily: "inherit", lineHeight: 1.4 }}>
                  {q} →
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
            {msg.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.ink, color: T.lime, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, marginRight: 8, marginTop: 2 }}>V</div>
            )}
            <div style={{
              maxWidth: "78%",
              background: msg.role === "user" ? T.ink : T.sand,
              color: msg.role === "user" ? T.white : T.inkSub,
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
              fontSize: 13,
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* OrderChoices inline */}
        {pendingOrder && !choicesApproved && (
          <div style={{ marginTop: 16, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", background: "#0a0a0a" }}>
            <OrderChoices
              order={pendingOrder.orderData}
              choices={pendingOrder.choices}
              deliverables={[]}
              iterationId={pendingOrder.iterationId}
            />
          </div>
        )}

        {choicesApproved && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12, marginTop: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.ink, color: T.lime, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, marginRight: 8, marginTop: 2 }}>V</div>
            <div style={{ maxWidth: "78%", background: T.greenBg, color: T.green, padding: "10px 14px", borderRadius: "4px 16px 16px 16px", fontSize: 13, lineHeight: 1.65, fontWeight: 600 }}>
              Material aprovado e pronto para download ✓
            </div>
          </div>
        )}

        {chatLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.ink, color: T.lime, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>V</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.inkFaint, animation: "pulse 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "16px 24px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: T.sand, border: `1px solid ${T.borderMd}`, borderRadius: 12, padding: "10px 14px" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="O que você precisa criar hoje?"
            rows={1}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 13, color: T.ink, fontFamily: "inherit", lineHeight: 1.5, maxHeight: 100, overflowY: "auto" }}
            onInput={(e: any) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || chatLoading}
            style={{ width: 32, height: 32, borderRadius: "50%", background: input.trim() && !chatLoading ? T.ink : T.borderMd, border: "none", color: input.trim() && !chatLoading ? T.lime : T.white, cursor: input.trim() && !chatLoading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}
          >↑</button>
        </div>
        <p style={{ textAlign: "center", fontSize: 10, color: T.inkFaint, marginTop: 8 }}>Enter para enviar · Shift+Enter para nova linha</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: T.sand, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: isMobile ? "0 16px" : "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16 }}>
          <div style={{ background: T.ink, color: T.lime, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: isMobile ? 16 : 20, padding: "4px 14px", borderRadius: 6 }}>Voku</div>
          {!isMobile && (
            <>
              <span style={{ color: T.borderMd, fontSize: 20 }}>|</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Home</span>
              <a href="/cliente/calendario" style={{ fontSize: 13, fontWeight: 600, color: T.inkMid, textDecoration: "none" }}>Calendário</a>
              <a href="/cliente/plano" style={{ fontSize: 13, fontWeight: 600, color: T.inkMid, textDecoration: "none" }}>Plano</a>
              <a href="/vitrine/apps" style={{ fontSize: 13, fontWeight: 600, color: T.inkMid, textDecoration: "none" }}>Apps</a>
              <a href="/cliente/marca" style={{ fontSize: 13, fontWeight: 600, color: T.inkMid, textDecoration: "none" }}>Marca</a>
              <a href="/vitrine" style={{ fontSize: 13, fontWeight: 600, color: T.inkMid, textDecoration: "none" }}>Vitrine</a>
              <a href="/cliente/afiliados" style={{ fontSize: 13, fontWeight: 600, color: T.inkMid, textDecoration: "none" }}>Afiliados</a>
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16 }}>
          {/* Créditos */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.sand, border: `1px solid ${T.border}`, borderRadius: 10, padding: "6px 14px" }}>
            <span style={{ fontSize: 12, color: T.inkMid, fontWeight: 600 }}>Créditos</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{ctx?.credits ?? 0}</span>
          </div>
          {/* Plano */}
          {!isMobile && (
            <div style={{ background: T.lime, color: T.ink, borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
              {ctx?.plan || "free"}
            </div>
          )}
          {!isMobile && <span style={{ color: T.inkMid, fontSize: 13 }}>{ctx?.name}</span>}
          <button onClick={handleLogout} style={{ background: "transparent", border: `1.5px solid ${T.borderMd}`, color: T.inkSub, borderRadius: 8, padding: "6px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sair</button>
        </div>
      </div>

      {/* Mobile tabs */}
      {isMobile && (
        <div style={{ display: "flex", background: T.white, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 64, zIndex: 9 }}>
          {(["pedidos", "chat"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "12px 0",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab ? `2.5px solid ${T.ink}` : "2.5px solid transparent",
                color: activeTab === tab ? T.ink : T.inkFaint,
                cursor: "pointer",
              }}
            >
              {tab === "pedidos" ? "Pedidos" : "Chat"}
            </button>
          ))}
        </div>
      )}

      {/* Layout */}
      {isMobile ? (
        // Mobile: mostra tab ativa
        activeTab === "pedidos" ? pedidosContent : chatContent
      ) : (
        // Desktop: split grid
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 0, minHeight: "calc(100vh - 64px)" }}>
          {chatContent}
          {pedidosContent}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}
