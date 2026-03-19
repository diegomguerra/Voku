"use client";
import { useState } from "react";

const FONT = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap";

// ─── TASKS ───────────────────────────────────────────────────────────────────
const TASKS = [
  {
    id: "choices-ui", section: "BLOQUEADORES",
    label: "Choices na Área do Cliente",
    detail: "Componente não construído — cliente precisa ver, escolher e aprovar variações. BLOQUEADOR principal para publicar Gigs.",
    url: "voku.one/cliente/pedidos", action: "claude-code",
    prompt: `Crie o componente Choices para voku.one/cliente/pedidos.

Stack: Next.js + Supabase (movfynswogmookzcjijt · sa-east-1)
Design system: dark #0a0a0a, lime #C8F135, Plus Jakarta Sans

O componente deve:
1. Buscar choices do pedido: SELECT * FROM choices WHERE order_id = :id AND status = 'pending'
2. Renderizar 2-3 cards de variação com preview do conteúdo (truncado 3 linhas)
3. Permitir selecionar UMA variação (radio style, borda lime quando selecionado)
4. Campo textarea "Comentário (opcional)" abaixo
5. Botão "Aprovar e finalizar" - só ativo quando uma choice selecionada
6. Ao clicar:
   UPDATE choices SET status='approved', selected_at=now() WHERE id=:choiceId
   INSERT INTO iterations (order_id, choice_id, comment) VALUES (...)
   UPDATE orders SET status='approved' WHERE id=:orderId
7. Após aprovação: tela de sucesso + botão de download do DOCX

Tabelas: choices, iterations, choice_feedback, orders, deliverables`,
  },
  {
    id: "fiverr-verify", section: "BLOQUEADORES",
    label: "Verificação de identidade Fiverr",
    detail: "CNH não aceita — suporte acionado. Aguardando resolução para publicar Gigs.",
    url: "fiverr.com/support", action: "manual", prompt: null,
  },
  {
    id: "stripe", section: "BLOQUEADORES",
    label: "Integração Stripe — voku.one",
    detail: "Pagamento direto sem Stripe não funciona. Necessário para checkout em voku.one.",
    url: "dashboard.stripe.com", action: "claude-code",
    prompt: `Integre Stripe no voku.one para pagamento direto dos 3 produtos.

Stack: Next.js + Supabase + Stripe SDK

Produtos:
  - Landing Page Copy: $100
  - Social Media Pack: $140
  - Email Nurture Sequence: $195

Criar:
1. /api/checkout — cria Stripe Checkout Session
   metadata: { product_id, briefing_id, user_email }
2. /api/webhook/stripe — payment_intent.succeeded
   UPDATE orders SET status='paid', payment_id=stripeId
3. Página /checkout/[product] — resumo + botão Pagar com Stripe
4. Redirect pós-pagamento: /cliente/pedidos?new=true

Env vars:
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  NEXT_PUBLIC_STRIPE_KEY=pk_live_...

Usar Stripe Checkout hosted.`,
  },
  {
    id: "push-landing", section: "EM PROGRESSO",
    label: "Push landing page refatorada → Vercel",
    detail: "Arquivo voku-landing.jsx atualizado com dark theme, preços corretos e modal IA. Push pendente — voku.one ainda mostra versão antiga.",
    url: "github.com/diegomguerra/Voku", action: "terminal",
    prompt: `cd ~/Downloads/voku-app
cp ~/Downloads/voku-landing.jsx src/app/page.jsx
git add src/app/page.jsx
git commit -m "feat: landing page v3 - dark theme, MVP pricing PT/EN/ES, modal IA"
git push origin main`,
  },
  {
    id: "n8n-oauth", section: "EM PROGRESSO",
    label: "Gmail OAuth2 no n8n — 4 credenciais",
    detail: "Workflow publicado mas credenciais não associadas aos nós. Automação de e-mail travada sem isso.",
    url: "app.n8n.cloud", action: "manual", prompt: null,
  },
  {
    id: "dkim", section: "EM PROGRESSO",
    label: "DKIM Google Workspace",
    detail: "Aguardando propagação DNS para autenticidade de e-mail nas 4 contas @voku.one.",
    url: "admin.google.com", action: "manual", prompt: null,
  },
  {
    id: "workana", section: "EM PROGRESSO",
    label: "Criar conta Workana",
    detail: "workana@voku.one — mercado BR principal. Alta prioridade.",
    url: "workana.com/register", action: "manual", prompt: null,
  },
  {
    id: "upwork-verify", section: "EM PROGRESSO",
    label: "Verificar conta Upwork",
    detail: "Conta criada com upwork@voku.one — e-mail de verificação pendente.",
    url: "upwork.com", action: "manual", prompt: null,
  },
  {
    id: "rls", section: "EM PROGRESSO",
    label: "RLS — choices / iterations / choice_feedback",
    detail: "Row Level Security desativado nas 3 tabelas. Ativar antes de ir para produção.",
    url: "supabase.com/dashboard", action: "claude",
    prompt: `Ative RLS nas tabelas choices, iterations e choice_feedback no Supabase (projeto movfynswogmookzcjijt).

ALTER TABLE choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cliente ve proprias choices" ON choices
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );
CREATE POLICY "Service role acesso total choices" ON choices
  USING (auth.role() = 'service_role');

ALTER TABLE iterations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cliente ve proprias iteracoes" ON iterations
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );
CREATE POLICY "Service role acesso total iterations" ON iterations
  USING (auth.role() = 'service_role');

ALTER TABLE choice_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cliente ve proprio feedback" ON choice_feedback
  FOR SELECT USING (
    choice_id IN (
      SELECT c.id FROM choices c
      JOIN orders o ON o.id = c.order_id
      WHERE o.user_id = auth.uid()
    )
  );
CREATE POLICY "Service role acesso total feedback" ON choice_feedback
  USING (auth.role() = 'service_role');`,
  },
  {
    id: "notify-email", section: "EM PROGRESSO",
    label: "Notificação e-mail — execute-product",
    detail: "execute-product gera choices mas não notifica o cliente. Implementar trigger de e-mail ao fim da função.",
    url: "supabase.com/dashboard/functions", action: "claude",
    prompt: `Atualize a edge function execute-product (v5) no Supabase (movfynswogmookzcjijt).

Adicionar ao final do fluxo, após inserir as choices:

const notifyRes = await fetch(
  'https://movfynswogmookzcjijt.supabase.co/functions/v1/send-reply',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    },
    body: JSON.stringify({
      to: clientEmail,
      from_platform: 'direct',
      subject: 'Suas opcoes estao prontas - Voku',
      body: 'Ola ' + clientName + ', suas opcoes para ' + productName + ' estao prontas. Acesse: https://voku.one/cliente/pedidos'
    })
  }
);`,
  },
  {
    id: "fiverr-gigs", section: "EM PROGRESSO",
    label: "Gigs 2 e 3 no Fiverr",
    detail: "Social Media Pack ($140 · 48h) + Email Nurture ($195 · 48h) — criar após desbloquear conta.",
    url: "fiverr.com/users/voku_studio/manage_gigs", action: "manual", prompt: null,
  },
];

// ─── ACTION CONFIG ────────────────────────────────────────────────────────────
const ACTION_CONFIG = {
  claude:        { label: "Claude aqui",   bg: "#EAF4D0", border: "#B8D870", color: "#3A6800", dot: "#5A9000" },
  "claude-code": { label: "Claude Code",   bg: "#FDE8DC", border: "#F0B090", color: "#8A3000", dot: "#C04A00" },
  terminal:      { label: "Terminal",      bg: "#E8E6F8", border: "#B0A8E0", color: "#3A3080", dot: "#5043A0" },
  manual:        { label: "Manual",        bg: "#EDECE8", border: "#D0CEC8", color: "#6A6560", dot: "#AAA49A" },
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
function IcoCheck() {
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5L4 8L9.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function IcoCopy() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 8.5V2C1 1.45 1.45 1 2 1H8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
}
function IcoExt() {
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M4 2H2C1.45 2 1 2.45 1 3V9C1 9.55 1.45 10 2 10H8C8.55 10 9 9.55 9 9V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M6 1H10V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 1L5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
}
function IcoBot() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="4" width="9" height="6.5" rx="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="4" cy="7.2" r="1" fill="currentColor"/><circle cx="8" cy="7.2" r="1" fill="currentColor"/><path d="M6 1.5V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="6" cy="1.5" r="0.8" fill="currentColor"/></svg>;
}
function IcoTerm() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M3 4.5L5.5 6L3 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.5 7.5H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function VokuDashboard() {
  const [dark, setDark]         = useState(false);
  const [done, setDone]         = useState({});
  const [expanded, setExpanded] = useState(null);
  const [modal, setModal]       = useState(null);
  const [copied, setCopied]     = useState(null);

  const D = dark ? {
    bg: "#0A0A0A", header: "rgba(10,10,10,0.96)", border: "#222",
    surface: "#111", card: "#161616", text: "#F0F0EC",
    textSub: "#A0A0A0", textMid: "#666", accent: "#7AAA10",
    accentText: "#A8CC30", rowHover: "#1A1A1A", scrollThumb: "#333",
    legendBorder: "#1E1E1E", sectionLine: "#333", progressBg: "#222",
  } : {
    bg: "#F0EEE8", header: "rgba(240,238,232,0.96)", border: "#D8D4CC",
    surface: "#FFFFFF", card: "#FFFFFF", text: "#1A1814",
    textSub: "#7A756A", textMid: "#9A9590", accent: "#7AAA10",
    accentText: "#3A6800", rowHover: "#ECEAE3", scrollThumb: "#C8C4BC",
    legendBorder: "#DDD9D0", sectionLine: "#DDD9D0", progressBg: "#DDD9D0",
  };

  function toggleDone(id, e) {
    e.stopPropagation();
    setDone(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id);
  }

  function copyText(id, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const totalDone = TASKS.filter(t => done[t.id]).length;
  const pct = Math.round((totalDone / TASKS.length) * 100);
  const sections = [...new Set(TASKS.map(t => t.section))];

  return (
    <>
      <style>{`
        @import url('${FONT}');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${D.bg}; font-family: 'IBM Plex Sans', sans-serif; color: ${D.text}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${D.scrollThumb}; border-radius: 2px; }
        .row-hover { transition: background 0.1s; cursor: pointer; }
        .row-hover:hover { background: ${D.rowHover} !important; }
        .btn-hover { transition: opacity 0.1s; cursor: pointer; }
        .btn-hover:hover { opacity: 0.72; }
        .chk-btn { transition: transform 0.12s; cursor: pointer; }
        .chk-btn:hover { transform: scale(1.1); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.16s ease both; }
        @keyframes bgIn { from { opacity:0; } to { opacity:1; } }
        .bg-in { animation: bgIn 0.15s ease; }
        .strike { text-decoration: line-through; }
      `}</style>

      <div style={{ minHeight: "100vh", background: D.bg, transition: "background 0.2s" }}>

        {/* ── HEADER ── */}
        <div className="adm-header" style={{
          background: "#FFFFFF",
          borderBottom: "2px solid #111111",
          position: "sticky",
          top: 0,
          zIndex: 100,
          fontFamily: "'Inter', sans-serif",
        }}>
          <div className="adm-header-left">
            <span style={{
              background: "#AAFF00",
              color: "#111111",
              fontWeight: 900,
              fontSize: "13px",
              padding: "3px 8px",
              letterSpacing: "0.05em",
              flexShrink: 0,
            }}>VOKU</span>
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#999999",
              letterSpacing: "0.15em",
              flexShrink: 0,
            }}>STATUS</span>
            <span className="adm-header-title" style={{
              fontSize: "18px",
              fontWeight: 900,
              color: "#111111",
              letterSpacing: "-0.02em",
            }}>Status & Prompts</span>
          </div>
          <div className="adm-header-actions">
            <button onClick={() => setDark(d => !d)} style={{
              background: dark ? "#111111" : "#F0F0F0",
              border: "1px solid #E5E5E5",
              borderRadius: 20, padding: "4px 12px",
              display: "flex", alignItems: "center", gap: 6,
              cursor: "pointer", fontFamily: "'Inter', sans-serif",
              fontSize: 11, color: dark ? "#AAFF00" : "#333333", fontWeight: 700,
              transition: "all 0.2s"
            }}>
              <span>{dark ? "☀" : "◑"}</span>
              <span>{dark ? "LIGHT" : "DARK"}</span>
            </button>
            <a href="/admin/dashboard" className="adm-header-back"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >← <span className="adm-header-back-label">DASHBOARDS</span></a>
          </div>
        </div>

        {/* ── LEGEND ── */}
        <div className="adm-status-legend" style={{ borderBottom: `1px solid ${D.legendBorder}`, background: dark ? "#0D0D0D" : "#F8F7F3" }}>
          {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: D.textMid }}>{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div className="adm-status-body">
          {sections.map(section => {
            const tasks = TASKS.filter(t => t.section === section);
            const sectionDone = tasks.filter(t => done[t.id]).length;
            const isBlocker = section === "BLOQUEADORES";

            return (
              <div key={section} style={{ marginBottom: 32 }}>

                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                  <div style={{ width: 3, height: 13, borderRadius: 2, background: isBlocker ? "#C02020" : "#BB7700", flexShrink: 0 }} />
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 700, letterSpacing: 2, color: isBlocker ? "#C04040" : "#BB7700" }}>
                    {isBlocker ? "🔴 BLOQUEADORES" : "🟡 EM PROGRESSO"}
                  </span>
                  <div style={{ flex: 1, height: 1, background: D.sectionLine }} />
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: D.textMid }}>{sectionDone}/{tasks.length}</span>
                </div>

                {/* Task list */}
                <div style={{ background: D.surface, borderRadius: 8, border: `1px solid ${D.border}`, overflow: "hidden", boxShadow: dark ? "none" : "0 1px 4px rgba(0,0,0,0.05)" }}>
                  {tasks.map((task, idx) => {
                    const isDone = !!done[task.id];
                    const isExp = expanded === task.id;
                    const ac = ACTION_CONFIG[task.action];
                    const isLast = idx === tasks.length - 1;

                    return (
                      <div key={task.id}>
                        {/* Row */}
                        <div
                          className="row-hover"
                          onClick={() => toggleExpand(task.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "12px 16px",
                            background: dark
                              ? (isDone ? "#0F0F0F" : isExp ? "#181818" : D.surface)
                              : (isDone ? "#FAFAF8" : isExp ? "#F5F3EE" : "#FFFFFF"),
                            borderBottom: !isLast || isExp ? `1px solid ${D.border}` : "none",
                          }}
                        >
                          {/* Checkbox */}
                          <button
                            className="chk-btn"
                            onClick={(e) => toggleDone(task.id, e)}
                            style={{
                              width: 19, height: 19, borderRadius: 4, flexShrink: 0,
                              background: isDone ? "#5A8A00" : "transparent",
                              border: "1.5px solid " + (isDone ? "#5A8A00" : D.textMid),
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#FFFFFF",
                            }}
                          >
                            {isDone && <IcoCheck />}
                          </button>

                          {/* Label */}
                          <span
                            className={isDone ? "strike" : ""}
                            style={{ flex: 1, fontSize: 13, fontWeight: isDone ? 400 : 500, color: isDone ? D.textMid : D.text, lineHeight: 1.4 }}
                          >
                            {task.label}
                          </span>

                          {/* Badge */}
                          <div style={{
                            display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                            padding: "3px 8px", borderRadius: 4,
                            background: ac.bg, border: "1px solid " + ac.border,
                          }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: ac.dot }} />
                            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 600, color: ac.color }}>
                              {ac.label}
                            </span>
                          </div>

                          {/* External */}
                          {task.url && (
                            <a
                              href={"https://" + task.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ color: D.textMid, display: "flex", textDecoration: "none", padding: 2, flexShrink: 0 }}
                            >
                              <IcoExt />
                            </a>
                          )}

                          {/* Chevron */}
                          <span style={{
                            color: D.textMid, fontSize: 9, flexShrink: 0,
                            display: "inline-block",
                            transform: isExp ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.15s",
                          }}>▾</span>
                        </div>

                        {/* Expanded panel */}
                        {isExp && (
                          <div
                            className="fade-up"
                            style={{
                              background: dark ? "#111" : "#F8F7F3",
                              borderBottom: !isLast ? `1px solid ${D.border}` : "none",
                              padding: "14px 18px 14px 47px",
                            }}
                          >
                            <p style={{ fontSize: 12.5, color: D.textSub, lineHeight: 1.7, marginBottom: task.prompt ? 12 : 0 }}>
                              {task.detail}
                            </p>

                            {task.prompt && (
                              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                                {task.action === "claude" && (
                                  <button className="btn-hover" onClick={() => setModal(task)} style={{
                                    display: "flex", alignItems: "center", gap: 5,
                                    padding: "6px 12px", borderRadius: 5, border: "1px solid #B8D870",
                                    background: dark ? "#1A2200" : "#EAF4D0", color: dark ? "#B8D870" : "#3A6800",
                                    fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 600,
                                  }}>
                                    <IcoBot /> Executar com Claude
                                  </button>
                                )}
                                {task.action === "claude-code" && (
                                  <button className="btn-hover" onClick={() => setModal(task)} style={{
                                    display: "flex", alignItems: "center", gap: 5,
                                    padding: "6px 12px", borderRadius: 5, border: "1px solid #F0B090",
                                    background: "#FDE8DC", color: "#8A3000",
                                    fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 600,
                                  }}>
                                    <IcoTerm /> Ver prompt Claude Code
                                  </button>
                                )}
                                {task.action === "terminal" && (
                                  <button className="btn-hover" onClick={() => setModal(task)} style={{
                                    display: "flex", alignItems: "center", gap: 5,
                                    padding: "6px 12px", borderRadius: 5, border: "1px solid #B0A8E0",
                                    background: "#E8E6F8", color: "#3A3080",
                                    fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 600,
                                  }}>
                                    <IcoTerm /> Ver comandos
                                  </button>
                                )}
                                <button className="btn-hover" onClick={() => copyText(task.id, task.prompt)} style={{
                                  display: "flex", alignItems: "center", gap: 5,
                                  padding: "6px 12px", borderRadius: 5,
                                  border: "1px solid " + (copied === task.id ? "#B8D870" : "#D0CEC8"),
                                  background: copied === task.id ? "#EAF4D0" : "#EDECE8",
                                  color: copied === task.id ? "#3A6800" : "#6A6560",
                                  fontFamily: "'IBM Plex Mono',monospace", fontSize: 10,
                                }}>
                                  <IcoCopy /> {copied === task.id ? "Copiado!" : "Copiar prompt"}
                                </button>
                              </div>
                            )}

                            {task.action === "manual" && (
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: dark ? "#1A1A1A" : "#EDECE8", border: `1px solid ${D.border}`, borderRadius: 4, marginTop: task.detail ? 10 : 0 }}>
                                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: D.textMid }}>Ação manual — nenhum script disponível</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Footer */}
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: D.textMid, letterSpacing: 1 }}>VOKU LLC · WYOMING · © 2026</span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: D.textMid }}>voku.one</span>
          </div>
        </div>
      </div>

      {/* ── MODAL ── */}
      {modal && (
        <div
          className="bg-in"
          onClick={() => setModal(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(20,18,14,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <div
            className="fade-up adm-status-modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              background: D.surface, borderRadius: 10, border: `1px solid ${D.border}`,
              overflow: "hidden",
              boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header */}
            <div style={{ padding: "13px 18px", background: dark ? "#181818" : "#F5F3EE", borderBottom: `1px solid ${D.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700, letterSpacing: 2.5, color: D.text }}>VOKU</span>
                <span style={{ color: D.textMid }}>·</span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: D.textMid, letterSpacing: 1.5 }}>
                  {modal.action === "claude" ? "EXECUTAR COM CLAUDE" : modal.action === "claude-code" ? "PROMPT CLAUDE CODE" : "COMANDOS TERMINAL"}
                </span>
              </div>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: D.textMid, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            {/* Task info */}
            <div style={{ padding: "13px 18px", borderBottom: `1px solid ${D.border}` }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: D.text, marginBottom: 3 }}>{modal.label}</p>
              <p style={{ fontSize: 12, color: D.textSub, lineHeight: 1.6 }}>{modal.detail}</p>
            </div>

            {/* Banner */}
            {modal.action === "claude" && (
              <div style={{ padding: "8px 18px", background: dark ? "#1A2200" : "#EAF4D0", borderBottom: "1px solid #C8E870" }}>
                <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: dark ? "#B8D870" : "#3A6800" }}>✓ Cole este prompt diretamente no chat com o Claude</p>
              </div>
            )}
            {modal.action === "claude-code" && (
              <div style={{ padding: "8px 18px", background: dark ? "#200D00" : "#FDE8DC", borderBottom: "1px solid #F0B090" }}>
                <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: dark ? "#F0A070" : "#8A3000" }}>→ Abra o Claude Code no terminal (<code style={{ fontFamily: "'IBM Plex Mono',monospace" }}>claude</code>) e cole este prompt</p>
              </div>
            )}
            {modal.action === "terminal" && (
              <div style={{ padding: "8px 18px", background: dark ? "#0D0B1E" : "#E8E6F8", borderBottom: "1px solid #B0A8E0" }}>
                <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: dark ? "#A09AE0" : "#3A3080" }}>→ Cole estes comandos diretamente no terminal</p>
              </div>
            )}

            {/* Prompt content */}
            <div style={{ padding: "16px 18px", maxHeight: 280, overflowY: "auto", background: dark ? "#0F0F0F" : "#FAFAF8" }}>
              <pre style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: dark ? "#C0C0B8" : "#4A4844", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {modal.prompt}
              </pre>
            </div>

            {/* Footer actions */}
            <div style={{ padding: "12px 18px", borderTop: `1px solid ${D.border}`, display: "flex", gap: 8 }}>
              <button
                className="btn-hover"
                onClick={() => copyText(modal.id, modal.prompt)}
                style={{
                  flex: 1, padding: "9px", borderRadius: 6, cursor: "pointer",
                  fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: copied === modal.id ? (dark ? "#1A2200" : "#EAF4D0") : (dark ? "#1A1A1A" : "#F0EEE8"),
                  border: "1px solid " + (copied === modal.id ? "#B8D870" : D.border),
                  color: copied === modal.id ? (dark ? "#B8D870" : "#3A6800") : D.textSub,
                  transition: "all 0.15s",
                }}
              >
                <IcoCopy /> {copied === modal.id ? "Copiado!" : "Copiar"}
              </button>
              <button className="btn-hover" onClick={() => setModal(null)} style={{
                padding: "9px 18px", borderRadius: 6, background: "transparent",
                border: `1px solid ${D.border}`, color: D.textSub, cursor: "pointer",
                fontFamily: "'IBM Plex Mono',monospace", fontSize: 12,
              }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
