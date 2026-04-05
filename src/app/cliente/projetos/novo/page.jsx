"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const TYPES = [
  { product: "landing_page_copy", title: "Landing Page Copy", desc: "Do hero ao CTA. Estruturado para converter.", credits: "40 créditos", tag: "LP" },
  { product: "content_pack", title: "Pack de Posts", desc: "4 posts com hook, legenda, hashtags e imagem.", credits: "25 créditos", hasCalendar: true, tag: "PK" },
  { product: "email_sequence", title: "Sequência de E-mails", desc: "5 e-mails do dia 0 ao dia 8.", credits: "25 créditos", tag: "EM" },
  { product: "ad_copy", title: "Copy Meta Ads", desc: "3 ângulos: dor, benefício, prova.", credits: "10 créditos", tag: "AD" },
];

export default function NovoProjetoPage() {
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showCalendarOption, setShowCalendarOption] = useState(false);

  useEffect(() => {
    supabase().auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/cliente"; return; }
      setUserId(data.user.id);
    });
  }, []);

  const handleSelect = (product) => {
    setSelected(product);
    const type = TYPES.find(t => t.product === product);
    setShowCalendarOption(type?.hasCalendar || false);
  };

  const handleCreate = async () => {
    if (!selected || !userId || creating) return;
    setCreating(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, product: selected }),
    });
    const { orderId } = await res.json();
    if (orderId) window.location.href = `/cliente/projetos/${orderId}`;
    else setCreating(false);
  };

  const selectedType = TYPES.find(t => t.product === selected);

  return (
    <div style={{ background: "#FAF8F3", minHeight: "calc(100vh - 64px)", padding: "32px 40px", maxWidth: 900, margin: "0 auto" }}>
      <a href="/cliente/home" style={{ fontSize: 13, fontWeight: 600, color: "#888", textDecoration: "none" }}>← Voltar</a>
      <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: 28, color: "#111", margin: "16px 0 4px" }}>
        Novo Projeto
      </h1>
      <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: "#888", margin: "0 0 32px" }}>
        Qual tipo de conteúdo você precisa?
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {TYPES.map(t => {
          const isActive = selected === t.product;
          return (
            <div
              key={t.product}
              onClick={() => handleSelect(t.product)}
              style={{
                background: isActive ? "#f8f8f5" : "#fff",
                border: `1.5px solid ${isActive ? "#111" : "#E8E5DE"}`,
                borderRadius: 8, padding: 24, cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 10, color: "#999", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>{t.tag}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: "#111" }}>{t.title}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 12, color: "#888", lineHeight: 1.5, marginTop: 6 }}>{t.desc}</div>
              <div style={{
                marginTop: 10, fontFamily: "'Inter', sans-serif", fontWeight: 600,
                fontSize: 11, color: "#888",
              }}>{t.credits}</div>
            </div>
          );
        })}
      </div>

      {/* Calendar suggestion for Pack de Posts */}
      {showCalendarOption && (
        <div style={{
          marginTop: 24, background: "#fff", border: "1px solid #E8E5DE",
          borderRadius: 12, padding: "20px 24px", display: "flex",
          alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#888" }}>CAL</span>
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: "#111" }}>
                Quer planejar um calendário de 30 dias primeiro?
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 12, color: "#888", marginTop: 2, lineHeight: 1.5 }}>
                A IA planeja 30 posts com pilares, hooks e formatos. Depois você gera cada um como projeto individual.
              </div>
            </div>
          </div>
          <a href="/cliente/calendario" style={{
            background: "#111", color: "#fff", fontFamily: "'Inter', sans-serif",
            fontWeight: 600, fontSize: 12, padding: "10px 20px", borderRadius: 6,
            border: "none", textDecoration: "none", whiteSpace: "nowrap",
          }}>
            Planejar calendário →
          </a>
        </div>
      )}

      {selected && (
        <button
          onClick={handleCreate}
          disabled={creating}
          style={{
            display: "block", width: "100%", marginTop: showCalendarOption ? 16 : 32, padding: 16,
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14,
            background: creating ? "#aaa" : "#111", color: "#fff",
            border: "none", borderRadius: 6, cursor: creating ? "wait" : "pointer",
          }}
        >
          {creating ? "Criando..." : `Começar projeto de ${selectedType?.title} →`}
        </button>
      )}
    </div>
  );
}
