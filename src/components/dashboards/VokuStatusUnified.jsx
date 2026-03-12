"use client";
import { useState } from "react";

const T = {
  sand: "#FAF8F3", white: "#FFFFFF", ink: "#111111",
  inkSub: "#3D3D3D", inkMid: "#6B6B6B", inkFaint: "#A0A0A0",
  lime: "#C8F135", border: "#E8E5DE", borderMd: "#D1CCBF",
  green: "#166534", greenBg: "#DCFCE7",
  teal: "#0D7A6E", tealBg: "#E6F5F3",
  amber: "#B45309", amberBg: "#FEF3C7",
  blue: "#1D4ED8", blueBg: "#DBEAFE",
  purple: "#6D28D9", purpleBg: "#EDE9FE",
  red: "#991B1B", redBg: "#FEE2E2",
};

// ─── TASKS (from status-dashboard) ───────────────────────────────────────────
const TASKS = [
  {
    id: "choices-ui", section: "BLOQUEADORES",
    label: "Choices na Área do Cliente",
    detail: "Componente não construído — cliente precisa ver, escolher e aprovar variações. BLOQUEADOR principal para publicar Gigs.",
    url: "voku.one/cliente/pedidos", action: "claude-code",
    prompt: `Crie o componente Choices para voku.one/cliente/pedidos.

Stack: Next.js + Supabase (nbxsfsuiwvoriyfwzezs · sa-east-1)
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
    prompt: `Ative RLS nas tabelas choices, iterations e choice_feedback no Supabase (projeto nbxsfsuiwvoriyfwzezs).

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
    prompt: `Atualize a edge function execute-product (v5) no Supabase (nbxsfsuiwvoriyfwzezs).

Adicionar ao final do fluxo, após inserir as choices:

const notifyRes = await fetch(
  'https://nbxsfsuiwvoriyfwzezs.supabase.co/functions/v1/send-reply',
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

// ─── PHASES (from status-map) ─────────────────────────────────────────────────
const phases = [
  {
    id: 1, title: "Fundação & Infraestrutura", icon: "⚙️", status: "done",
    items: [
      { label: "Wyoming LLC aprovada", done: true },
      { label: "Domínio voku.one registrado (GoDaddy)", done: true },
      { label: "Supabase projeto criado (sa-east-1)", done: true },
      { label: "6 tabelas com RLS + triggers", done: true },
      { label: "Storage bucket 'deliverables'", done: true },
      { label: "GitHub repositório diegomguerra/Voku", done: true },
      { label: "Next.js 14 estruturado e buildando", done: true },
      { label: "Vercel conectado ao GitHub", done: true },
      { label: "voku.one apontado para Vercel (DNS + SSL)", done: true },
      { label: "Site GoDaddy removido — Vercel servindo 100%", done: true },
      { label: "Variáveis de ambiente na Vercel (6 keys)", done: true },
      { label: ".env.local configurado localmente", done: true },
      { label: "CONTEXT.md criado no repositório", done: true },
      { label: "Google Workspace (2 emails)", done: true },
    ]
  },
  {
    id: 2, title: "Produtos & Precificação", icon: "📦", status: "done",
    items: [
      { label: "Landing Page Copy — USD 100 / BRL 497 / 24h", done: true },
      { label: "Pacote de Conteúdo para Redes (12 posts) — USD 140 / BRL 747 / 48h", done: true },
      { label: "Sequência de E-mails de Nutrição (5 emails) — USD 195 / BRL 647 / 48h", done: true },
      { label: "src/lib/products.ts (fonte única de verdade)", done: true },
    ]
  },
  {
    id: 3, title: "Landing Page (voku.one)", icon: "🌐", status: "done",
    items: [
      { label: "Hero trilíngue (PT/EN/ES no subtítulo)", done: true },
      { label: "Seção 'O vazio do mercado'", done: true },
      { label: "Seção de produtos com preços visíveis", done: true },
      { label: "Código promocional (promo code)", done: true },
      { label: "Prova social / depoimentos", done: true },
      { label: "Modal de registro (4 etapas)", done: true },
      { label: "Formulário de briefing com IA (chat)", done: true },
      { label: "Explorer de serviços", done: true },
      { label: "Botão 'Minha conta' no navbar → /cliente", done: true, note: "adicionado hoje" },
      { label: "Deploy em produção ✅", done: true },
    ]
  },
  {
    id: 4, title: "Backend & Automação", icon: "🤖", status: "done",
    items: [
      { label: "Edge Function: submit-briefing (Supabase)", done: true },
      { label: "Edge Function: execute-product (Supabase)", done: true },
      { label: "API Route: /api/submit-briefing (Next.js)", done: true },
      { label: "API Route: /api/execute-product (Next.js)", done: true },
      { label: "Anthropic API key nos secrets", done: true },
      { label: "Resend API key nos secrets", done: true },
      { label: "Trigger auth → cria user em public.users", done: true },
      { label: "E-mail de confirmação automático (Resend)", done: true },
      { label: "E-mail de entrega com link de download", done: true },
      { label: "Verificação domínio ola@voku.one no Resend", done: true },
    ]
  },
  {
    id: 5, title: "Área do Cliente", icon: "👤", status: "done",
    items: [
      { label: "Login + Cadastro (/cliente) — tema claro", done: true, note: "design aprovado hoje" },
      { label: "Página de pedidos (/cliente/pedidos)", done: true, note: "design aprovado hoje" },
      { label: "Cards de resumo (total, andamento, entregues)", done: true },
      { label: "Download seguro via Supabase Storage (signed URL)", done: true },
      { label: "CTA 'Ver produtos' para novo pedido", done: true },
      { label: "Push para GitHub + deploy Vercel", done: true },
    ]
  },
  {
    id: 11, title: "Modelo Colaborativo — Choices", icon: "🤝", status: "next",
    items: [
      { label: "PRINCÍPIO: Nada 100% pronto — cliente tica opções e itera até aprovar", done: false, note: "OBRIGATÓRIO antes de publicar no Fiverr" },
      { label: "Tabela 'choices' no Supabase", done: true, note: "criada hoje" },
      { label: "Tabela 'iterations' no Supabase", done: true, note: "criada hoje" },
      { label: "Tabela 'choice_feedback' no Supabase", done: true, note: "criada hoje" },
      { label: "Componente Choices na área do cliente (/cliente/pedidos)", done: false },
      { label: "Cliente vê 2–3 variações lado a lado e tica a preferida", done: false },
      { label: "Campo de comentário livre por opção", done: false },
      { label: "Botão 'Aprovar e finalizar' → libera download", done: false },
      { label: "Edge Function execute-product gera choices automaticamente", done: false },
      { label: "Notificação por e-mail ao cliente quando opções estiverem prontas", done: false },
      { label: "Landing Page: 3 headlines + 2 CTAs como choices", done: false },
      { label: "Social Pack: 3 hooks por post para o cliente ticar", done: false },
      { label: "Email Sequence: 3 subject lines por e-mail para escolha", done: false },
    ]
  },
  {
    id: 6, title: "Dashboard Operacional", icon: "📊", status: "done",
    items: [
      { label: "Tema claro — fundo areia, letras escuras", done: true },
      { label: "KPIs: Receita, Pedidos, Ticket Médio, Entrega", done: true },
      { label: "Toggle USD / BRL", done: true },
      { label: "Gráfico de receita mensal", done: true },
      { label: "Funil de conversão", done: true },
      { label: "Mix de produtos (donut chart)", done: true },
      { label: "Tabela de pedidos recentes com status", done: true },
      { label: "Rota: /admin/dashboard", done: true },
      { label: "Link → Dashboard Mídia no header", done: true },
      { label: "Push para GitHub + deploy Vercel", done: true },
    ]
  },
  {
    id: 7, title: "Dashboard de Mídia", icon: "📱", status: "done",
    items: [
      { label: "Tema claro — mesmo design system", done: true },
      { label: "Cards Instagram / TikTok / YouTube", done: true },
      { label: "Seguidores + engajamento por plataforma", done: true },
      { label: "Gráfico de crescimento de seguidores", done: true },
      { label: "Investimento em tráfego pago vs leads", done: true },
      { label: "Tabela de performance de posts", done: true },
      { label: "Rota: /admin/dashboard/media", done: true },
      { label: "Link ← Dashboard Operacional no header", done: true },
      { label: "Push para GitHub + deploy Vercel", done: true },
    ]
  },
  {
    id: 8, title: "Canais de Venda", icon: "💼", status: "next",
    items: [
      { label: "Conta Fiverr criada (@voku_studio / Rordens Blake)", done: true, note: "hoje" },
      { label: "Avatar Fiverr (foto IA aprovada)", done: true, note: "hoje" },
      { label: "Gig 1: Landing Page Copy — configurado, gallery pendente", done: false, note: "Requirements ✅ Gallery ⏳" },
      { label: "Imagens PNG para galeria dos 3 gigs (1200×800px)", done: true, note: "hoje" },
      { label: "Gig 1: publicar no Fiverr", done: false },
      { label: "Gig 2: Social Media Content Pack — criar e publicar", done: false },
      { label: "Gig 3: Email Nurture Sequence — criar e publicar", done: false },
      { label: "Componente Choices pronto ANTES de publicar gigs", done: false, note: "⚠️ BLOCKER" },
      { label: "Conta Workana criada (workana@voku.one)", done: false },
      { label: "Conta Upwork criada (upwork@voku.one)", done: false },
      { label: "n8n: associar 3 credenciais Gmail OAuth2 e publicar workflow", done: false },
      { label: "DKIM ativado no Google Workspace", done: false },
    ]
  },
  {
    id: 9, title: "Pagamentos Diretos", icon: "💳", status: "next",
    items: [
      { label: "Stripe integrado ao voku.one", done: false },
      { label: "Checkout direto para 3 produtos", done: false },
      { label: "Webhook Stripe → cria pedido no Supabase", done: false },
      { label: "Fluxo completo: pagamento → briefing → entrega", done: false },
    ]
  },
  {
    id: 10, title: "Máquina de Conteúdo (Social)", icon: "🎬", status: "future",
    items: [
      { label: "Criar conta no YouTube (@voku_studio)", done: false },
      { label: "Criar conta no TikTok (@voku_studio)", done: false },
      { label: "Criar conta no Instagram (@voku_studio)", done: false },
      { label: "Criar conta no Facebook (Voku Page)", done: false },
      { label: "Estratégia editorial Instagram/TikTok/YouTube", done: false },
      { label: "Automação de posts (n8n ou Make)", done: false },
      { label: "Conexão com APIs das plataformas", done: false },
      { label: "Funil: conteúdo → leads → pedidos", done: false },
      { label: "Relatório automático semanal", done: false },
    ]
  },
];

const STATUS_CONFIG = {
  done:     { label: "Concluído",     color: T.green,    bg: T.greenBg,  bar: T.lime },
  building: { label: "Em build",      color: T.teal,     bg: T.tealBg,   bar: "#0D9488" },
  next:     { label: "Próxima fase",  color: T.amber,    bg: T.amberBg,  bar: "#F59E0B" },
  future:   { label: "Futuro",        color: T.inkFaint, bg: T.sand,     bar: T.borderMd },
};

const ACTION_CONFIG = {
  claude:        { label: "Claude aqui",  bg: T.greenBg,  border: "#B8D870", color: T.green,  dot: "#5A9000" },
  "claude-code": { label: "Claude Code",  bg: "#FDE8DC",  border: "#F0B090", color: "#8A3000", dot: "#C04A00" },
  terminal:      { label: "Terminal",     bg: "#E8E6F8",  border: "#B0A8E0", color: "#3A3080", dot: "#5043A0" },
  manual:        { label: "Manual",       bg: T.sand,     border: T.borderMd, color: T.inkMid, dot: T.inkFaint },
};

const flowSteps = [
  { n:"1", label:"Cliente descobre", sub:"Fiverr / Workana / voku.one", icon:"👁️" },
  { n:"2", label:"Seleciona produto", sub:"Preço visível desde o início", icon:"🛒" },
  { n:"3", label:"Registro rápido", sub:"Nome + e-mail → Supabase Auth", icon:"📝" },
  { n:"4", label:"Briefing com IA", sub:"RORDENS conversa → JSON estruturado", icon:"🤖" },
  { n:"5", label:"E-mail de confirmação", sub:"Resend → número do pedido + prazo", icon:"📧" },
  { n:"6", label:"RORDENS executa", sub:"Anthropic API → gera o conteúdo", icon:"⚡" },
  { n:"7", label:"Arquivo gerado", sub:"Vercel → Supabase Storage", icon:"📄" },
  { n:"8", label:"Entrega + download", sub:"E-mail + área do cliente (/cliente)", icon:"✅" },
];

const todayLog = [
  { done: true,  text: "Conta Fiverr criada (@voku_studio / Rordens Blake)" },
  { done: true,  text: "Gig 1 configurado — título, categoria, preços, descrição, requirements" },
  { done: true,  text: "Imagens PNG criadas para os 3 gigs (1200×800px)" },
  { done: true,  text: "Preços atualizados: $100 / $140 / $195" },
  { done: true,  text: "Hero da landing page reformulada — layout 2 colunas com cards" },
  { done: true,  text: "Princípio Colaborativo definido e documentado" },
  { done: true,  text: "Tabelas choices + iterations + choice_feedback criadas no Supabase" },
  { done: true,  text: "CONTEXT.md atualizado com princípio colaborativo e pendências" },
  { done: true,  text: "Status map atualizado com nova fase 11 (Modelo Colaborativo)" },
  { done: false, text: "Fazer upload das imagens na Gallery do Gig 1 e publicar" },
  { done: false, text: "Criar Gig 2 e Gig 3 no Fiverr" },
  { done: false, text: "Construir componente Choices na área do cliente" },
  { done: false, text: "Associar credenciais Gmail OAuth2 no n8n e publicar workflow" },
];

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
export default function VokuStatusUnified() {
  const [dark, setDark]           = useState(false);
  const [view, setView]           = useState("today");
  const [activePhase, setActivePhase] = useState(null);
  const [taskDone, setTaskDone]   = useState({});
  const [expanded, setExpanded]   = useState(null);
  const [modal, setModal]         = useState(null);
  const [copied, setCopied]       = useState(null);

  // Dark overrides for T
  const TD = dark ? {
    ...T,
    sand: "#0A0A0A", white: "#161616", ink: "#F0F0EC",
    inkSub: "#BBBBBB", inkMid: "#888888", inkFaint: "#555555",
    border: "#2A2A2A", borderMd: "#333333",
    greenBg: "#0D2310", tealBg: "#071A18", amberBg: "#1E1200",
    blueBg: "#071030", purpleBg: "#150D30", redBg: "#200808",
  } : T;

  function copyText(id, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const donePhases = phases.filter(p => p.status === "done").length;
  const allItems = phases.flatMap(p => p.items);
  const doneItems = allItems.filter(i => i.done).length;
  const totalTaskDone = TASKS.filter(t => taskDone[t.id]).length;
  const sections = [...new Set(TASKS.map(t => t.section))];

  return (
    <div style={{ background: TD.sand, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{
        background: "#FFFFFF",
        borderBottom: "2px solid #111111",
        padding: "20px 48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{
            background: "#AAFF00",
            color: "#111111",
            fontWeight: 900,
            fontSize: "13px",
            padding: "3px 8px",
            letterSpacing: "0.05em",
            fontFamily: "'Inter', sans-serif",
          }}>VOKU</span>
          <span style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#999999",
            letterSpacing: "0.15em",
            fontFamily: "'Inter', sans-serif",
          }}>MAPA</span>
          <span style={{
            fontSize: "18px",
            fontWeight: 900,
            color: "#111111",
            letterSpacing: "-0.02em",
            fontFamily: "'Inter', sans-serif",
          }}>Mapa do Projeto</span>
        </div>
        <a href="/admin/dashboard" style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#111111",
          fontWeight: 700,
          fontSize: "12px",
          textDecoration: "none",
          letterSpacing: "0.1em",
          border: "1px solid #E5E5E5",
          padding: "8px 16px",
          fontFamily: "'Inter', sans-serif",
        }}>← DASHBOARDS</a>
      </div>

      {/* ── NAV ── */}
      <div style={{ background: TD.white, borderBottom: `1px solid ${TD.border}`, padding: "0 40px", display: "flex", gap: 4 }}>
        {[
          { key: "today",   label: "Hoje" },
          { key: "tasks",   label: "Pendências & Prompts" },
          { key: "phases",  label: "Todas as Fases" },
          { key: "flow",    label: "Fluxo de Automação" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setView(tab.key)} style={{
            background: "none", border: "none",
            borderBottom: view === tab.key ? `3px solid ${TD.lime}` : "3px solid transparent",
            padding: "14px 20px", fontSize: 13, fontWeight: 700,
            color: view === tab.key ? TD.ink : TD.inkMid,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* ══ TODAY TAB ══ */}
        {view === "today" && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: TD.ink, marginBottom: 6 }}>Sessão de hoje — 09/03/2026</div>
            <div style={{ fontSize: 14, color: TD.inkMid, marginBottom: 28 }}>O que foi feito e o que falta para fechar o dia.</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div style={{ background: TD.white, border: `1px solid ${TD.border}`, borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TD.inkFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>✅ Concluído hoje</div>
                {todayLog.filter(i => i.done).map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                    <span style={{ color: TD.green, fontSize: 15, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 14, color: TD.inkSub, lineHeight: 1.4 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: TD.white, border: `1px solid ${TD.border}`, borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TD.inkFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>⏳ Pendente para fechar</div>
                {todayLog.filter(i => !i.done).map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                    <span style={{ color: TD.amber, fontSize: 15, flexShrink: 0, marginTop: 1 }}>○</span>
                    <span style={{ fontSize: 14, color: TD.inkSub, lineHeight: 1.4 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* URLs ativas */}
            <div style={{ background: TD.white, border: `1px solid ${TD.border}`, borderRadius: 14, padding: "22px 24px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TD.inkFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>🌐 URLs em produção</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                {[
                  { url: "voku.one", label: "Landing page", status: "live" },
                  { url: "voku.one/cliente", label: "Login do cliente", status: "live" },
                  { url: "voku.one/cliente/pedidos", label: "Meus pedidos", status: "live" },
                  { url: "voku.one/admin/dashboard", label: "Dashboard Operacional", status: "live" },
                  { url: "voku.one/admin/dashboard/media", label: "Dashboard de Mídia", status: "live" },
                ].map(u => (
                  <div key={u.url} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: TD.sand, borderRadius: 8, padding: "10px 16px", border: `1px solid ${TD.border}` }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TD.ink }}>{u.url}</div>
                      <div style={{ fontSize: 11, color: TD.inkFaint }}>{u.label}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: TD.green, background: TD.greenBg, borderRadius: 20, padding: "3px 10px" }}>AO VIVO</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Próximo passo */}
            <div style={{ background: TD.ink, borderRadius: 14, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#FFF", marginBottom: 4 }}>Próximo passo imediato</div>
                <div style={{ fontSize: 13, color: "#A0A0A0" }}>Clique em "Pendências & Prompts" para ver os prompts prontos.</div>
              </div>
              <div style={{ background: TD.lime, color: TD.ink, borderRadius: 10, padding: "10px 20px", fontSize: 12, fontWeight: 700 }}>Choices → Gig 1 publicado → Gig 2 e 3</div>
            </div>
          </div>
        )}

        {/* ══ TASKS TAB (from status-dashboard) ══ */}
        {view === "tasks" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: TD.ink }}>Pendências & Prompts</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: TD.inkMid }}>
                  <span style={{ color: TD.green, fontWeight: 700 }}>{totalTaskDone}</span>/{TASKS.length} concluídas
                </span>
                <div style={{ width: 80, height: 6, background: TD.border, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round((totalTaskDone / TASKS.length) * 100)}%`, background: TD.lime, borderRadius: 3 }} />
                </div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: TD.inkMid, marginBottom: 24 }}>Clique em qualquer task para ver o prompt — copie e cole onde indicado.</div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
              {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot }} />
                  <span style={{ fontSize: 11, color: TD.inkMid, fontWeight: 600 }}>{cfg.label}</span>
                </div>
              ))}
            </div>

            {sections.map(section => {
              const tasks = TASKS.filter(t => t.section === section);
              const sectionDone = tasks.filter(t => taskDone[t.id]).length;
              const isBlocker = section === "BLOQUEADORES";

              return (
                <div key={section} style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 3, height: 14, borderRadius: 2, background: isBlocker ? TD.red : TD.amber, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: isBlocker ? TD.red : TD.amber }}>
                      {isBlocker ? "🔴 BLOQUEADORES" : "🟡 EM PROGRESSO"}
                    </span>
                    <div style={{ flex: 1, height: 1, background: TD.border }} />
                    <span style={{ fontSize: 11, color: TD.inkFaint }}>{sectionDone}/{tasks.length}</span>
                  </div>

                  <div style={{ background: TD.white, border: `1px solid ${TD.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    {tasks.map((task, idx) => {
                      const isDone = !!taskDone[task.id];
                      const isExp = expanded === task.id;
                      const ac = ACTION_CONFIG[task.action];
                      const isLast = idx === tasks.length - 1;

                      return (
                        <div key={task.id}>
                          <div
                            onClick={() => setExpanded(isExp ? null : task.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", cursor: "pointer",
                              background: isDone ? "#FAFAF8" : isExp ? `${TD.sand}` : TD.white,
                              borderBottom: (!isLast || isExp) ? `1px solid ${TD.border}` : "none",
                              transition: "background 0.1s",
                            }}
                          >
                            {/* Checkbox */}
                            <button
                              onClick={e => { e.stopPropagation(); setTaskDone(prev => ({ ...prev, [task.id]: !prev[task.id] })); }}
                              style={{
                                width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                                background: isDone ? TD.green : "transparent",
                                border: `1.5px solid ${isDone ? TD.green : TD.borderMd}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: TD.white, cursor: "pointer",
                              }}
                            >
                              {isDone && <IcoCheck />}
                            </button>

                            <span style={{ flex: 1, fontSize: 13.5, fontWeight: isDone ? 400 : 600, color: isDone ? TD.inkFaint : TD.ink, textDecoration: isDone ? "line-through" : "none" }}>
                              {task.label}
                            </span>

                            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 6, background: ac.bg, border: `1px solid ${ac.border}`, flexShrink: 0 }}>
                              <div style={{ width: 5, height: 5, borderRadius: "50%", background: ac.dot }} />
                              <span style={{ fontSize: 10, fontWeight: 700, color: ac.color }}>{ac.label}</span>
                            </div>

                            {task.url && (
                              <a href={`https://${task.url}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: TD.inkFaint, display: "flex", textDecoration: "none", padding: 2, flexShrink: 0 }}>
                                <IcoExt />
                              </a>
                            )}

                            <span style={{ color: TD.inkFaint, fontSize: 9, transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}>▾</span>
                          </div>

                          {isExp && (
                            <div style={{ background: "#F8F7F2", borderBottom: !isLast ? `1px solid ${TD.border}` : "none", padding: "14px 18px 14px 50px" }}>
                              <p style={{ fontSize: 13, color: TD.inkMid, lineHeight: 1.7, marginBottom: task.prompt ? 14 : 0 }}>
                                {task.detail}
                              </p>

                              {task.prompt && (
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  {task.action === "claude" && (
                                    <button onClick={() => setModal(task)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 6, border: `1px solid ${ACTION_CONFIG.claude.border}`, background: ACTION_CONFIG.claude.bg, color: ACTION_CONFIG.claude.color, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                      <IcoBot /> Executar com Claude
                                    </button>
                                  )}
                                  {task.action === "claude-code" && (
                                    <button onClick={() => setModal(task)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 6, border: `1px solid ${ACTION_CONFIG["claude-code"].border}`, background: ACTION_CONFIG["claude-code"].bg, color: ACTION_CONFIG["claude-code"].color, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                      <IcoTerm /> Ver prompt Claude Code
                                    </button>
                                  )}
                                  {task.action === "terminal" && (
                                    <button onClick={() => setModal(task)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 6, border: `1px solid ${ACTION_CONFIG.terminal.border}`, background: ACTION_CONFIG.terminal.bg, color: ACTION_CONFIG.terminal.color, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                      <IcoTerm /> Ver comandos Terminal
                                    </button>
                                  )}
                                  <button onClick={() => copyText(task.id, task.prompt)} style={{
                                    display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 6, cursor: "pointer",
                                    border: `1px solid ${copied === task.id ? "#B8D870" : TD.borderMd}`,
                                    background: copied === task.id ? TD.greenBg : TD.sand,
                                    color: copied === task.id ? TD.green : TD.inkMid,
                                    fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                                    transition: "all 0.15s",
                                  }}>
                                    <IcoCopy /> {copied === task.id ? "Copiado!" : "Copiar prompt"}
                                  </button>
                                </div>
                              )}

                              {task.action === "manual" && (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: TD.sand, border: `1px solid ${TD.border}`, borderRadius: 4 }}>
                                  <span style={{ fontSize: 11, color: TD.inkFaint }}>Ação manual — nenhum script disponível</span>
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
          </div>
        )}

        {/* ══ PHASES TAB ══ */}
        {view === "phases" && (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.bar, display: "inline-block" }} />
                  {cfg.label}
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
              {phases.map(phase => {
                const cfg = STATUS_CONFIG[phase.status];
                const doneCount = phase.items.filter(i => i.done).length;
                const pct = Math.round((doneCount / phase.items.length) * 100);
                const isOpen = activePhase === phase.id;
                return (
                  <div key={phase.id} style={{ background: TD.white, border: `1px solid ${TD.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", cursor: "pointer" }} onClick={() => setActivePhase(isOpen ? null : phase.id)}>
                    <div style={{ height: 3, background: TD.border }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: cfg.bar }} />
                    </div>
                    <div style={{ padding: "18px 22px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{phase.icon}</span>
                          <div>
                            <div style={{ fontSize: 10, color: TD.inkFaint, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Fase {phase.id}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: TD.ink }}>{phase.title}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 20, padding: "3px 10px" }}>{cfg.label}</span>
                          <span style={{ color: TD.inkFaint }}>{isOpen ? "▲" : "▼"}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: TD.sand, borderRadius: 99, border: `1px solid ${TD.border}` }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: cfg.bar, borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: TD.inkMid }}>{doneCount}/{phase.items.length}</span>
                      </div>
                      {isOpen && (
                        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                          {phase.items.map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                              <span style={{ fontSize: 13, marginTop: 1, flexShrink: 0, color: item.done ? TD.green : TD.inkFaint }}>{item.done ? "✓" : "○"}</span>
                              <div>
                                <span style={{ fontSize: 13, color: item.done ? TD.inkSub : TD.inkMid }}>{item.label}</span>
                                {item.note && <span style={{ fontSize: 11, color: TD.teal, marginLeft: 6, fontWeight: 600 }}>← {item.note}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══ FLOW TAB ══ */}
        {view === "flow" && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: TD.ink, marginBottom: 6 }}>Fluxo Operacional Completo</div>
            <div style={{ fontSize: 14, color: TD.inkMid, marginBottom: 28 }}>Do primeiro clique à entrega — 100% automatizado após o briefing.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {flowSteps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 56, flexShrink: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: TD.ink, color: TD.lime, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{step.n}</div>
                    {i < flowSteps.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 32, background: TD.border, margin: "4px 0" }} />}
                  </div>
                  <div style={{ flex: 1, background: TD.white, border: `1px solid ${TD.border}`, borderRadius: 14, padding: "16px 22px", marginBottom: 12, marginLeft: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{step.icon}</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: TD.ink }}>{step.label}</div>
                        <div style={{ fontSize: 13, color: TD.inkMid, marginTop: 2 }}>{step.sub}</div>
                      </div>
                      {(step.n === "4" || step.n === "6") && <div style={{ marginLeft: "auto", background: TD.lime, color: TD.ink, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>IA</div>}
                      {(step.n === "5" || step.n === "8") && <div style={{ marginLeft: "auto", background: TD.tealBg, color: TD.teal, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>AUTO</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {[
                { title: "Banco de Dados", icon: "🗄️", items: ["users", "orders", "briefings", "deliverables", "media_posts", "media_spend", "choices", "iterations", "choice_feedback"], color: TD.blueBg, textColor: TD.blue },
                { title: "Edge Functions", icon: "⚡", items: ["submit-briefing", "execute-product", "send-reply"], color: TD.purpleBg, textColor: TD.purple },
                { title: "Serviços Externos", icon: "🔌", items: ["Anthropic API (IA)", "Resend (e-mail)", "Supabase Storage", "Vercel (deploy)", "Stripe (pagamentos)"], color: TD.greenBg, textColor: TD.green },
              ].map(block => (
                <div key={block.title} style={{ background: TD.white, border: `1px solid ${TD.border}`, borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 18 }}>{block.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: TD.ink }}>{block.title}</span>
                  </div>
                  {block.items.map(item => (
                    <div key={item} style={{ marginBottom: 7 }}>
                      <span style={{ fontSize: 11, background: block.color, color: block.textColor, borderRadius: 4, padding: "2px 8px", fontWeight: 700, fontFamily: "monospace" }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(17,17,17,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: TD.white, borderRadius: 14, border: `1px solid ${TD.border}`, width: "100%", maxWidth: 620, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ padding: "14px 20px", background: TD.sand, borderBottom: `1px solid ${TD.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: TD.lime, color: TD.ink, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 14, padding: "2px 10px", borderRadius: 6 }}>Voku</div>
                <span style={{ fontSize: 11, color: TD.inkMid, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {modal.action === "claude" ? "EXECUTAR COM CLAUDE" : modal.action === "claude-code" ? "PROMPT CLAUDE CODE" : "COMANDOS TERMINAL"}
                </span>
              </div>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: TD.inkFaint, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${TD.border}` }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: TD.ink, marginBottom: 4 }}>{modal.label}</p>
              <p style={{ fontSize: 12.5, color: TD.inkMid, lineHeight: 1.6 }}>{modal.detail}</p>
            </div>

            {modal.action === "claude" && (
              <div style={{ padding: "8px 20px", background: TD.greenBg, borderBottom: `1px solid #B8D870` }}>
                <p style={{ fontSize: 11, color: TD.green, fontWeight: 600 }}>✓ Cole este prompt diretamente no chat com o Claude</p>
              </div>
            )}
            {modal.action === "claude-code" && (
              <div style={{ padding: "8px 20px", background: "#FDE8DC", borderBottom: "1px solid #F0B090" }}>
                <p style={{ fontSize: 11, color: "#8A3000", fontWeight: 600 }}>→ Abra o Claude Code no terminal (<code style={{ fontFamily: "monospace" }}>claude</code>) e cole este prompt</p>
              </div>
            )}
            {modal.action === "terminal" && (
              <div style={{ padding: "8px 20px", background: "#E8E6F8", borderBottom: "1px solid #B0A8E0" }}>
                <p style={{ fontSize: 11, color: "#3A3080", fontWeight: 600 }}>→ Cole estes comandos diretamente no terminal</p>
              </div>
            )}

            <div style={{ padding: "16px 20px", maxHeight: 280, overflowY: "auto", background: "#FAFAF8" }}>
              <pre style={{ fontFamily: "monospace", fontSize: 12, color: TD.inkSub, lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {modal.prompt}
              </pre>
            </div>

            <div style={{ padding: "12px 20px", borderTop: `1px solid ${TD.border}`, display: "flex", gap: 8 }}>
              <button onClick={() => copyText(modal.id, modal.prompt)} style={{
                flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: copied === modal.id ? TD.greenBg : TD.sand,
                border: `1px solid ${copied === modal.id ? "#B8D870" : TD.borderMd}`,
                color: copied === modal.id ? TD.green : TD.ink,
                transition: "all 0.15s",
              }}>
                <IcoCopy /> {copied === modal.id ? "Copiado!" : "Copiar prompt"}
              </button>
              <button onClick={() => setModal(null)} style={{ padding: "10px 20px", borderRadius: 8, background: "transparent", border: `1px solid ${TD.borderMd}`, color: TD.inkMid, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
