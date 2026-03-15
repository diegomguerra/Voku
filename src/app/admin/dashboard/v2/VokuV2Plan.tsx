"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface CheckItem {
  label: string;
  detail: string;
  type: "backend" | "frontend" | "ai" | "infra" | "design" | "biz";
}

interface Step {
  index: string | number;
  title: string;
  status: string;
  statusColor: string;
  indexColor: string;
  desc: string;
  items: CheckItem[];
}

interface Phase {
  id: number;
  num: string;
  title: string;
  sub: string;
  tags: { label: string; color: string }[];
  steps: Step[];
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const PHASES: Phase[] = [
  {
    id: 0, num: "01", title: "Fundação Técnica", sub: "Dia 1–2 · Infraestrutura que sustenta tudo",
    tags: [{ label: "Backend", color: "blue" }, { label: "Infra", color: "amber" }, { label: "Supabase", color: "muted" }],
    steps: [
      {
        index: 1, indexColor: "blue", title: "Modelagem do banco de dados", status: "Pendente", statusColor: "amber",
        desc: "Criar ou revisar todas as tabelas necessárias para suportar o novo modelo de plataforma. O Supabase já existe — só precisamos garantir que o schema cobre os novos módulos.",
        items: [
          { label: "Revisar tabela orders — adicionar campo channel (chat/form/api)", detail: "Permite rastrear de onde veio cada pedido para analytics", type: "backend" },
          { label: "Criar tabela credits — user_id, balance, plan, updated_at", detail: "Base do sistema de créditos. Saldo atual, histórico de consumo", type: "backend" },
          { label: "Criar tabela credit_transactions — user_id, amount, type, description, order_id", detail: "Log de cada débito/crédito. Necessário para dashboard do cliente", type: "backend" },
          { label: "Criar tabela plans — slug, name, price_brl, credits_monthly, features[]", detail: "Free / Starter / Pro / Business / Enterprise", type: "backend" },
          { label: "Criar tabela user_plans — user_id, plan_id, status, period_start, period_end", detail: "Assinaturas ativas. Relação com Stripe webhook", type: "backend" },
          { label: "Adicionar RLS (Row Level Security) em todas as novas tabelas", detail: "Cada usuário só vê seus próprios dados", type: "infra" },
          { label: "Criar trigger de créditos iniciais no cadastro (Free: 10 créditos)", detail: "Automaticamente ao inserir em auth.users", type: "backend" },
        ],
      },
      {
        index: 2, indexColor: "blue", title: "Autenticação e contexto do usuário", status: "Pendente", statusColor: "amber",
        desc: "O login/register já existe em /cliente. Precisamos que o contexto do usuário (nome, plano, créditos) chegue ao agente e ao dashboard.",
        items: [
          { label: "Criar hook useUserContext() — retorna nome, email, plano, créditos", detail: "Consumido pelo agente e pelo dashboard sem props drilling", type: "frontend" },
          { label: "Criar API route /api/me — retorna user_context completo", detail: "Plano, créditos, pedidos recentes, primeiro nome", type: "backend" },
          { label: "Passar user_context para a edge function voku-chat em cada mensagem", detail: "Agente precisa saber o nome e o plano para personalizar", type: "ai" },
        ],
      },
      {
        index: 3, indexColor: "blue", title: "Configurar Stripe / Pagar.me", status: "Bloqueador", statusColor: "red",
        desc: "Sem pagamentos não há monetização. Precisa ser configurado antes do launch, mesmo que só o plano Starter no início.",
        items: [
          { label: "Criar conta Stripe (ou Pagar.me para BRL nativo)", detail: "Pagar.me tem melhor suporte a boleto e Pix para mercado BR", type: "biz" },
          { label: "Criar produtos e preços no Stripe — Free, Starter R$49, Pro R$149, Business R$399", detail: "Cada plano como Product + Price recorrente mensal", type: "infra" },
          { label: "Criar API route /api/checkout — gera sessão de pagamento", detail: "Recebe plan_slug, retorna checkout URL", type: "backend" },
          { label: "Criar webhook handler /api/stripe-webhook", detail: "Ao pagar: atualiza user_plans + credita créditos mensais", type: "backend" },
        ],
      },
    ],
  },
  {
    id: 1, num: "02", title: "Agente Conversacional", sub: "Dia 2–3 · O coração da experiência Voku",
    tags: [{ label: "IA", color: "green" }, { label: "Frontend", color: "purple" }, { label: "Edge Function", color: "blue" }],
    steps: [
      {
        index: 1, indexColor: "green", title: "Reescrever voku-chat/index.ts com personalidade real", status: "Crítico", statusColor: "red",
        desc: "Hoje a edge function é um proxy burro. Precisa virar o cérebro do agente: receber contexto do usuário, montar o system prompt completo, e retornar a resposta + ação quando detectar intenção confirmada.",
        items: [
          { label: "Mover system prompt do LandingClient.jsx para a edge function", detail: "Personalidade, regras de comportamento e capacidades ficam no servidor", type: "ai" },
          { label: "Receber user_context no body — injetar nome e plano no system prompt", detail: '"Você está atendendo [Nome], plano [Pro], [X] créditos disponíveis"', type: "ai" },
          { label: "Implementar detecção de intenção — retornar action no JSON quando briefing confirmado", detail: '{"action": "execute", "product": "copy", "structured_data": {...}}', type: "ai" },
          { label: "Suporte a streaming (SSE) para resposta aparecer token a token", detail: "Experiência mais fluida — parece conversa real", type: "backend" },
          { label: "Tratar erros graciosamente — nunca expor stack trace para o cliente", detail: '"Opa, tive um problema aqui. Pode repetir?" em vez de 500 cru', type: "backend" },
        ],
      },
      {
        index: 2, indexColor: "green", title: "Construir UI do chat na área do cliente", status: "Crítico", statusColor: "red",
        desc: "Adicionar o chat em /cliente/pedidos. Layout split: lista de pedidos na esquerda, chat do agente na direita. O agente é o ponto de entrada para qualquer nova entrega.",
        items: [
          { label: "Layout split-pane — pedidos à esquerda (40%), chat à direita (60%)", detail: "Responsivo: em mobile vira tabs (Pedidos / Chat)", type: "frontend" },
          { label: "Mensagem de boas-vindas personalizada com nome do cliente", detail: '"Oi [Nome]! Pronto para criar algo novo? O que você precisa hoje?"', type: "frontend" },
          { label: "Quick-start chips — 4 botões de atalho abaixo da mensagem inicial", detail: "Copy para anúncio / Posts Instagram / Landing page / Estratégia", type: "frontend" },
          { label: "Typing indicator animado enquanto agente processa", detail: '3 dots pulsando com "Voku está criando…"', type: "frontend" },
          { label: "Quando action=execute retornar: chamar submit-briefing automaticamente", detail: "Sem redirect — tudo acontece no mesmo chat", type: "frontend" },
          { label: "Exibir OrderChoices inline no chat após execute-product terminar", detail: "As 3 opções A/B/C aparecem como card dentro do chat", type: "frontend" },
          { label: "Persistir histórico do chat no Supabase (tabela chat_messages)", detail: "Cliente retorna e vê conversa anterior. Agente mantém contexto", type: "backend" },
        ],
      },
      {
        index: 3, indexColor: "green", title: "System prompt — personalidade e regras completas", status: "Pendente", statusColor: "amber",
        desc: "O documento mais importante do agente. Define quem ele é, como fala, o que sabe fazer e como age em cada situação.",
        items: [
          { label: 'Definir identidade — "Você é a Voku, assistente de marketing com IA"', detail: "Nunca menciona Claude, Anthropic ou tecnologias internas", type: "ai" },
          { label: "Regras de comportamento — 1 pergunta por vez, usa nome, confirma antes de executar", detail: "Tom descontraído mas profissional. Sem jargão técnico", type: "ai" },
          { label: "Capacidades declaradas — copy, posts, LP, estratégia, apps", detail: "Com exemplos de como executar cada uma", type: "ai" },
          { label: "Fluxo de confirmação — sempre mostrar resumo antes de executar", detail: '"Vou criar X para Y com foco em Z. Posso ir?"', type: "ai" },
          { label: "Esquema JSON de saída quando briefing confirmado", detail: '{"action":"execute","product":"copy","structured_data":{...}}', type: "ai" },
        ],
      },
    ],
  },
  {
    id: 2, num: "03", title: "Copy & Posts por IA", sub: "Dia 3–4 · Módulos de conteúdo conectados ao pipeline",
    tags: [{ label: "IA", color: "green" }, { label: "Backend", color: "blue" }],
    steps: [
      {
        index: 1, indexColor: "green", title: "Expandir execute-product para novos formatos", status: "Pendente", statusColor: "amber",
        desc: "O execute-product já gera copy em 3 tons. Precisa suportar os novos formatos: posts, carrossel, legenda, roteiro de Reels.",
        items: [
          { label: "Adicionar product type post_instagram — legenda + hashtags + call to action", detail: "3 variações de tom: direto, inspiracional, educativo", type: "ai" },
          { label: "Adicionar product type carrossel — título + 5 slides + capa", detail: "Cada slide: headline + 2 linhas de texto + CTA final", type: "ai" },
          { label: "Adicionar product type reels_script — roteiro de 30s, 60s, 90s", detail: "Hook (3s) + Desenvolvimento + CTA. Com indicações de corte", type: "ai" },
          { label: "Adicionar product type email_sequence — sequência de 5 e-mails", detail: "Boas-vindas → Valor → Prova → Oferta → Urgência", type: "ai" },
          { label: "Adicionar product type ad_copy — copy para Meta Ads", detail: "Headline + Texto primário + Descrição para 3 variações A/B/C", type: "ai" },
          { label: "Deduzir créditos ao executar — cada geração consome X créditos", detail: "Copy: 2cr / Posts: 3cr / Carrossel: 5cr / Sequência email: 8cr", type: "backend" },
        ],
      },
      {
        index: 2, indexColor: "green", title: "Calendário editorial automático", status: "Pendente", statusColor: "amber",
        desc: "A partir do briefing do negócio, o agente sugere um calendário de conteúdo para o mês. O cliente aprova, ajusta e pode mandar gerar tudo de uma vez.",
        items: [
          { label: "Edge function generate-calendar — recebe nicho/objetivo, retorna 30 ideias de post", detail: "Com datas, formatos sugeridos e pilares de conteúdo", type: "ai" },
          { label: "UI de calendário na área do cliente — grid mensal com ideias", detail: "Cliente clica em cada ideia e manda gerar o conteúdo", type: "frontend" },
          { label: '"Gerar tudo" — batch de 30 posts em fila assíncrona', detail: "Processa em background, notifica quando pronto", type: "backend" },
        ],
      },
    ],
  },
  {
    id: 3, num: "04", title: "Landing Pages Automáticas", sub: "Dia 4–5 · Da conversa para URL publicada em minutos",
    tags: [{ label: "IA", color: "green" }, { label: "Frontend", color: "purple" }, { label: "Deploy", color: "amber" }],
    steps: [
      {
        index: 1, indexColor: "purple", title: "Geração de LP via prompt", status: "Pendente", statusColor: "amber",
        desc: "Cliente descreve o produto no chat → agente coleta informações → gera HTML completo da LP → hospeda e entrega URL.",
        items: [
          { label: "Edge function generate-landing-page — recebe structured_data, retorna HTML completo", detail: "Claude gera HTML/CSS inline responsivo. Sem dependências externas", type: "ai" },
          { label: "Template base — seções: Hero, Problema, Solução, Benefícios, Prova Social, CTA", detail: "IA preenche o conteúdo. Estrutura é consistente e validada", type: "ai" },
          { label: "3 variações de design — Minimal, Bold, Modern", detail: "Cliente escolhe a que mais combina com a marca (Choices Model)", type: "design" },
          { label: "Salvar HTML no Supabase Storage bucket landing-pages", detail: "Arquivo: landing-pages/{user_id}/{order_id}/index.html", type: "infra" },
        ],
      },
      {
        index: 2, indexColor: "purple", title: "Hosting e publicação automática", status: "Pendente", statusColor: "amber",
        desc: "A LP gerada precisa ter uma URL real e acessível. Duas abordagens possíveis: Supabase Storage com CDN público ou deploy via Vercel API.",
        items: [
          { label: "Opção A (rápida): URL pública do Supabase Storage — voku.one/lp/{slug}", detail: "Supabase serve o HTML diretamente. Zero infra extra. Pronto em horas", type: "infra" },
          { label: "Opção B (robusta): Next.js route dinâmica /lp/[slug] que lê do Storage", detail: "Mais controle, analytics, domínio customizado no futuro", type: "frontend" },
          { label: "Preview inline no dashboard antes de publicar", detail: "iframe com a LP gerada. Cliente vê antes de aprovar", type: "frontend" },
          { label: '"Muda a cor do botão para verde" via chat — edição por conversa', detail: "Agente interpreta, edita o HTML, republica. Sem código", type: "ai" },
        ],
      },
    ],
  },
  {
    id: 4, num: "05", title: "Dashboard do Cliente", sub: "Dia 5–6 · O que o cliente vê depois do login",
    tags: [{ label: "Frontend", color: "purple" }, { label: "Backend", color: "blue" }],
    steps: [
      {
        index: 1, indexColor: "purple", title: "Redesenhar /cliente/pedidos como home do cliente", status: "Pendente", statusColor: "amber",
        desc: "A tela de pedidos vira a home completa do cliente. Agente no centro, pedidos recentes, créditos e atalhos visíveis sem precisar navegar.",
        items: [
          { label: "Header com nome, plano atual e créditos disponíveis", detail: "Sempre visível. Créditos em destaque — cria urgência de uso", type: "frontend" },
          { label: "Chat do agente como elemento central (60% da tela em desktop)", detail: "Primeiro contato visual é o chat, não a lista de pedidos", type: "frontend" },
          { label: "Painel lateral direito — pedidos recentes com status em tempo real", detail: "Em produção / Aguardando escolha / Entregue / Download", type: "frontend" },
          { label: "Histórico de entregas com filtro por tipo e data", detail: "Copy / Posts / LP / Apps. Sempre acessível para download", type: "frontend" },
          { label: "Banner de upgrade quando créditos chegarem a 20%", detail: '"Você tem X créditos. Quer fazer upgrade para continuar criando?"', type: "frontend" },
        ],
      },
      {
        index: 2, indexColor: "purple", title: "Tela de créditos e plano", status: "Pendente", statusColor: "amber",
        desc: "Transparência total sobre consumo. Cliente vê exatamente quanto gastou, quando renova e quais recursos tem disponíveis.",
        items: [
          { label: "Rota /cliente/plano — plano atual, data de renovação, créditos usados vs. total", detail: 'Barra de progresso visual. "Renova em X dias"', type: "frontend" },
          { label: "Histórico de consumo — tabela com data, descrição, créditos usados", detail: '"Copy para anúncio — 2 créditos — 14/03/2025"', type: "frontend" },
          { label: "Botão de upgrade direto para o checkout do Stripe", detail: "Um clique para mudar de plano. Sem fricção", type: "frontend" },
          { label: "Compra de créditos avulsos — pacotes de 50, 200, 500 créditos", detail: "Para quem não quer upgrade mas precisa de mais créditos", type: "biz" },
        ],
      },
    ],
  },
  {
    id: 5, num: "06", title: "Modelo de Créditos & Planos", sub: "Dia 6 · Monetização recorrente",
    tags: [{ label: "Biz", color: "amber" }, { label: "Backend", color: "blue" }],
    steps: [
      {
        index: 1, indexColor: "amber", title: "Tabela de planos e preços", status: "Pendente", statusColor: "amber",
        desc: "Definição exata do que cada plano inclui e quanto custa. Baseado no modelo da Emergent adaptado para o mercado brasileiro.",
        items: [
          { label: "Free — R$0 / 10 créditos / 1 projeto ativo", detail: "Para curiosos e teste. Copy básico apenas", type: "biz" },
          { label: "Starter — R$49/mês / 100 créditos / todos os formatos básicos", detail: "Copy, posts, 1 LP por mês, dashboard completo", type: "biz" },
          { label: "Pro — R$149/mês / 400 créditos / LP ilimitadas + apps básicos", detail: "Tudo do Starter + geração de apps + calendário editorial", type: "biz" },
          { label: "Business — R$399/mês / 1.200 créditos / agentes customizados + equipes", detail: "Multi-usuário, agente treinado com voz da marca", type: "biz" },
          { label: "Enterprise — sob consulta / créditos ilimitados / white-label + SLA", detail: "Para agências e grandes empresas. API própria", type: "biz" },
          { label: "Tabela de consumo de créditos por produto — publicar na pricing page", detail: "Copy=2cr, Post=3cr, LP=10cr, App=20cr", type: "biz" },
        ],
      },
      {
        index: 2, indexColor: "amber", title: "Página de pricing pública", status: "Pendente", statusColor: "amber",
        desc: "A pricing page é uma das maiores alavancas de conversão. Precisa ser clara, sem fricção e com CTA direto para checkout.",
        items: [
          { label: "Rota /precos com grid de planos — toggle mensal/anual", detail: "Desconto anual: 2 meses grátis (equivalente)", type: "frontend" },
          { label: 'Badge "Mais popular" no plano Pro', detail: "Ancora a percepção de valor no plano do meio", type: "design" },
          { label: "FAQ abaixo dos planos — dúvidas sobre créditos, cancelamento, upgrade", detail: "Reduz objeções antes do clique", type: "frontend" },
        ],
      },
    ],
  },
  {
    id: 6, num: "07", title: "Geração de Apps", sub: "Mês 2 · Vibe coding focado em marketing",
    tags: [{ label: "IA", color: "green" }, { label: "Backend", color: "blue" }, { label: "Infra", color: "amber" }],
    steps: [
      {
        index: 1, indexColor: "green", title: "MVP de geração de apps via prompt", status: "Mês 2", statusColor: "blue",
        desc: "Apps simples e focados em marketing: calculadora de orçamento, gerador de bio, quiz de qualificação, página de captura interativa.",
        items: [
          { label: "Edge function generate-app — recebe descrição, retorna HTML+JS funcional", detail: "Apps simples: calculadora, quiz, formulário, gerador de conteúdo", type: "ai" },
          { label: "Hosting no Supabase Storage — URL pública em segundos", detail: "voku.one/app/{slug} serve o HTML gerado", type: "infra" },
          { label: "Preview e iteração via chat — \"adiciona um botão de WhatsApp\"", detail: "Agente edita e republica. Cliente nunca toca em código", type: "ai" },
          { label: "Vitrine de apps gerados — inspiração para novos clientes", detail: 'Gallery pública: "Criado com Voku em X minutos"', type: "biz" },
        ],
      },
    ],
  },
  {
    id: 7, num: "08", title: "Agentes Customizados", sub: "Mês 3 · IA treinada com a voz da marca do cliente",
    tags: [{ label: "IA", color: "green" }, { label: "Premium", color: "purple" }],
    steps: [
      {
        index: 1, indexColor: "green", title: "Builder de agente da marca", status: "Mês 3", statusColor: "blue",
        desc: "Plano Business em diante. O cliente configura a voz da marca — tom, palavras proibidas, exemplos de conteúdo — e a Voku sempre gera nesse estilo.",
        items: [
          { label: "Formulário de brand voice — tom, personalidade, palavras-chave, exemplos", detail: "5 campos. Salvo como brand_context por user_id", type: "frontend" },
          { label: "Injetar brand_context no system prompt do agente quando disponível", detail: "Automático. Cliente não precisa repetir o tom em cada pedido", type: "ai" },
          { label: "Upload de exemplos de conteúdo da marca (PDFs, textos)", detail: "RAG simples: vetorizar e usar como contexto adicional", type: "ai" },
          { label: "Teste de brand voice — chat de preview sem consumir créditos", detail: '"Peça um post de teste para ver se o tom está certo"', type: "ai" },
        ],
      },
    ],
  },
  {
    id: 8, num: "09", title: "Vitrine & Marketplace", sub: "Mês 4 · Canal de aquisição orgânica + receita extra",
    tags: [{ label: "Produto", color: "purple" }, { label: "Revenue", color: "amber" }],
    steps: [
      {
        index: 1, indexColor: "purple", title: "Galeria pública de entregas", status: "Mês 4", statusColor: "blue",
        desc: "Clientes podem optar por tornar suas entregas públicas na vitrine da Voku. Funciona como prova social e canal de descoberta orgânica.",
        items: [
          { label: "Rota /vitrine — galeria masonry de LPs, copies e apps gerados", detail: 'Filtro por nicho, formato, plano. "Criado com Voku"', type: "frontend" },
          { label: "Opt-in de publicação na entrega — \"Compartilhar na vitrine Voku?\"", detail: "Incentivo: 5 créditos bônus se publicar", type: "biz" },
          { label: "CTA em cada item da vitrine — \"Criar algo parecido\"", detail: "Clique abre o chat do agente com o contexto pré-carregado", type: "frontend" },
          { label: "Marketplace de templates — criadores vendem, Voku retém 20%", detail: "Templates de copy, LP e posts. Compra com créditos", type: "biz" },
        ],
      },
    ],
  },
  {
    id: 9, num: "10", title: "Launch & Distribuição", sub: "Dia 7 · Validação com clientes reais e lançamento público",
    tags: [{ label: "Biz", color: "amber" }, { label: "Marketing", color: "red" }],
    steps: [
      {
        index: 1, indexColor: "amber", title: "Beta com 5 clientes reais", status: "Pendente", statusColor: "amber",
        desc: "Antes do lançamento público, validar com 5 clientes reais — 1 MEI, 2 startups, 2 empresas médias. Coletar feedback e ajustar.",
        items: [
          { label: "Selecionar 5 clientes beta — mix de perfis (MEI, startup, empresa)", detail: "Preferencialmente clientes que já conhecem a Voku hoje", type: "biz" },
          { label: "Onboarding guiado — call de 30min com cada beta tester", detail: "Apresentar o agente, tirar dúvidas, coletar primeira impressão", type: "biz" },
          { label: "Formulário de feedback — NPS + 3 perguntas abertas", detail: "O que amou / O que confundiu / O que sente falta", type: "biz" },
          { label: "Iterar com base no feedback antes do lançamento público", detail: "48h para ajustes críticos de UX", type: "frontend" },
        ],
      },
      {
        index: 2, indexColor: "amber", title: "Distribuição no Instagram (estilo Emergent)", status: "Pendente", statusColor: "amber",
        desc: "A Emergent usa o Instagram para mostrar o produto funcionando — não branding genérico. A Voku faz o mesmo, mas em PT-BR e para o mercado brasileiro.",
        items: [
          { label: "3 posts de lançamento — mostrando o agente conversando e entregando", detail: 'Formato Reels: "Pedi uma landing page para meu negócio e em 2 minutos…"', type: "biz" },
          { label: "Anúncio de lançamento — copy + criativo para Meta Ads", detail: 'Prompt interativo como criativo: "Crie um anúncio para [seu negócio]"', type: "biz" },
          { label: "Programa de afiliados — 20% recorrente por indicação", detail: "Link único por afiliado. Rastreio via Supabase", type: "biz" },
          { label: "Onboarding automatizado para novos usuários via e-mail (Resend)", detail: "Dia 0: boas-vindas / Dia 1: dica de uso / Dia 3: caso de sucesso", type: "biz" },
        ],
      },
      {
        index: 3, indexColor: "red", title: "Automação de DMs e Comentários — ManyChat", status: "Pendente", statusColor: "amber",
        desc: "Usar ManyChat como camada de automação do Instagram enquanto o Meta App (VokuApp ID: 1157744663009370) aguarda aprovação de permissões avançadas. ManyChat já tem app verificado pela Meta — sem review, sem espera.",
        items: [
          { label: "Criar conta ManyChat e conectar Página do Facebook da Voku", detail: "manychat.com → plano Free resolve até 1.000 contatos. Pro ($15/mês) depois", type: "biz" },
          { label: "Ativar Instagram Direct Messages + Instagram Comments no ManyChat", detail: "Instagram vincula automaticamente via Página do Facebook", type: "infra" },
          { label: "Configurar gatilhos — qualquer DM nova + palavras-chave (preço, plano, quero, como funciona)", detail: "Também: gatilho em comentários de qualquer post → dispara DM automática", type: "infra" },
          { label: "Criar fluxo de boas-vindas — captura nome e qualifica o perfil do lead", detail: "4 opções: MEI/negócio próprio / Startup / Criador de conteúdo / Agência", type: "biz" },
          { label: "Criar fluxo de preços — explica modelo de créditos e planos Starter/Pro/Business", detail: "Starter R$97 / Pro R$197 / Business R$497. CTA final: voku.one", type: "biz" },
          { label: "Criar fluxo de dúvidas frequentes — keywords: grátis, cancelar, como funciona, humano", detail: "Keyword humano/atendente notifica Diego para assumir a conversa", type: "biz" },
          { label: "Configurar resposta automática em comentários — manda DM com detalhes", detail: '"Oi! Que bom que curtiu 😊 Te mandei uma mensagem no direct com mais detalhes!"', type: "biz" },
          { label: "Configurar tags de segmentação — lead_instagram, mei, startup, criador, agencia, interesse_preco, convertido", detail: "Permite filtrar e segmentar contatos para campanhas futuras", type: "biz" },
          { label: "Submeter VokuApp para revisão na Meta em paralelo — permissões: instagram_business_messaging, pages_messaging", detail: "Prazo típico: 5–10 dias úteis. Quando aprovado, avaliar migração da API própria", type: "infra" },
        ],
      },
    ],
  },
];

const NAV_ITEMS = [
  { label: "Fundação Técnica", badge: "Dia 1–2" },
  { label: "Agente Conversacional", badge: "Dia 2–3" },
  { label: "Copy & Posts por IA", badge: "Dia 3–4" },
  { label: "Landing Pages Auto", badge: "Dia 4–5" },
  { label: "Dashboard do Cliente", badge: "Dia 5–6" },
  { label: "Modelo de Créditos", badge: "Dia 6" },
  { label: "Geração de Apps", badge: "Mês 2" },
  { label: "Agentes Customizados", badge: "Mês 3" },
  { label: "Vitrine & Marketplace", badge: "Mês 4" },
  { label: "Launch & Distribuição", badge: "Dia 7" },
];

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const C = {
  green: "#AAFF00", greenDim: "rgba(170,255,0,0.12)", greenBorder: "rgba(170,255,0,0.25)",
  bg: "#111111", surface: "#1A1A1A", surface2: "#222222",
  border: "rgba(255,255,255,0.07)", text: "#FFFFFF",
  muted: "#888888", muted2: "#555555",
  red: "#FF4444", amber: "#FFB800", blue: "#4488FF", purple: "#9966FF",
};

function tagStyle(color: string) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    green: { bg: C.greenDim, color: C.green, border: C.greenBorder },
    blue: { bg: "rgba(68,136,255,0.1)", color: C.blue, border: "rgba(68,136,255,0.25)" },
    amber: { bg: "rgba(255,184,0,0.1)", color: C.amber, border: "rgba(255,184,0,0.25)" },
    purple: { bg: "rgba(153,102,255,0.1)", color: C.purple, border: "rgba(153,102,255,0.25)" },
    red: { bg: "rgba(255,68,68,0.1)", color: C.red, border: "rgba(255,68,68,0.25)" },
    muted: { bg: "rgba(255,255,255,0.05)", color: C.muted, border: C.border },
  };
  return map[color] || map.muted;
}

function typeStyle(type: string) {
  const map: Record<string, { bg: string; color: string }> = {
    backend: { bg: "rgba(68,136,255,0.12)", color: C.blue },
    frontend: { bg: "rgba(153,102,255,0.12)", color: C.purple },
    ai: { bg: C.greenDim, color: C.green },
    infra: { bg: "rgba(255,184,0,0.1)", color: C.amber },
    design: { bg: "rgba(255,68,68,0.1)", color: C.red },
    biz: { bg: "rgba(255,255,255,0.05)", color: C.muted },
  };
  return map[type] || map.biz;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function VokuV2Plan() {
  const [activePhase, setActivePhase] = useState(0);
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // Carregar estados salvos do Supabase
  useEffect(() => {
    supabase()
      .from("tasks_status")
      .select("id, done")
      .then(({ data, error }: { data: { id: string; done: boolean }[] | null; error: unknown }) => {
        if (error) { console.error("tasks_status load error:", error); return; }
        if (data) {
          const saved: Record<string, boolean> = {};
          data.forEach(row => { saved[row.id] = row.done; });
          setChecked(saved);
        }
      });
  }, []);

  const totalItems = PHASES.flatMap(p => p.steps.flatMap(s => s.items)).length;
  const doneItems = Object.values(checked).filter(Boolean).length;
  const pct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;

  const toggleStep = useCallback((key: string) => {
    setOpenSteps(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleCheck = useCallback((key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newDone = !checked[key];
    setChecked(prev => ({ ...prev, [key]: newDone }));
    supabase()
      .from("tasks_status")
      .upsert({ id: key, done: newDone, updated_at: new Date().toISOString() })
      .then(({ error }: { error: unknown }) => { if (error) console.error("tasks_status save error:", error); });
  }, [checked]);

  const phase = PHASES[activePhase];

  // Per-phase progress
  function phaseProgress(p: Phase) {
    const keys = p.steps.flatMap((s, si) => s.items.map((_, ii) => `${p.id}-${si}-${ii}`));
    const done = keys.filter(k => checked[k]).length;
    return keys.length ? done / keys.length : 0;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.6 }}>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside style={{ width: 260, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>

        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.green, letterSpacing: -1 }}>VOKU</div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>V2 · Plano de Reestruturação</div>
        </div>

        {/* Nav */}
        <div style={{ padding: "20px 12px 8px", flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted2, padding: "0 8px", marginBottom: 6 }}>Fases</div>
          {NAV_ITEMS.map((item, i) => {
            const active = activePhase === i;
            const prog = phaseProgress(PHASES[i]);
            return (
              <button key={i} onClick={() => setActivePhase(i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, cursor: "pointer", color: active ? C.green : C.muted, fontSize: 13, fontWeight: 500, background: active ? C.greenDim : "transparent", border: "none", width: "100%", textAlign: "left", marginBottom: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: prog === 1 ? C.green : active ? C.green : C.muted2, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                <span style={{ background: active ? C.greenDim : "rgba(255,255,255,0.05)", color: active ? C.green : C.muted, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, border: `1px solid ${active ? C.greenBorder : C.border}` }}>{item.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Progress */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted2, marginBottom: 8 }}>Progresso</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.green }}>{pct}%</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{doneItems} de {totalItems} itens concluídos</div>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "40px 48px", maxWidth: 960 }}>

        {/* Page header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.green, marginBottom: 10 }}>Voku V2</div>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, lineHeight: 1.1, marginBottom: 12 }}>Reestruturação Completa</div>
          <div style={{ color: C.muted, fontSize: 15, maxWidth: 560, lineHeight: 1.7 }}>De agência com formulário para plataforma SaaS de IA generativa. Cada fase tem etapas detalhadas e itens acionáveis. Marque conforme executa.</div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 40 }}>
          {[
            { label: "Fases", value: "10", sub: "MVP em 7 dias", color: C.green },
            { label: "Arquivos novos", value: "3", sub: "sem quebrar o existente", color: C.blue },
            { label: "Meta MRR", value: "R$150k", sub: "em 6 meses", color: C.amber },
            { label: "Concluído", value: `${pct}%`, sub: `${doneItems} itens`, color: pct > 60 ? C.green : pct > 30 ? C.amber : C.text },
          ].map(s => (
            <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 40 }}>
          {PHASES.map(p => {
            const prog = phaseProgress(p);
            return (
              <div key={p.id} onClick={() => setActivePhase(p.id)} style={{ flex: 1, height: 4, borderRadius: 2, background: prog === 1 ? C.green : prog > 0 ? "rgba(170,255,0,0.4)" : C.surface2, cursor: "pointer", transition: "background 0.3s" }} />
            );
          })}
        </div>

        {/* Phase header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, background: C.greenDim, color: C.green, border: `1px solid ${C.greenBorder}`, flexShrink: 0 }}>{phase.num}</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>{phase.title}</div>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 10 }}>{phase.sub}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {phase.tags.map(t => {
                const ts = tagStyle(t.color);
                return <span key={t.label} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>{t.label}</span>;
              })}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {phase.steps.map((step, si) => {
            const stepKey = `${phase.id}-${si}`;
            const isOpen = openSteps[stepKey];
            const idxStyle = tagStyle(step.indexColor);
            const itemKeys = step.items.map((_, ii) => `${phase.id}-${si}-${ii}`);
            const allDone = itemKeys.length > 0 && itemKeys.every(k => checked[k]);
            const stepStatus = allDone ? "Concluído" : step.status;
            const stepStatusColor = allDone ? "green" : step.statusColor;
            const statusStyle = tagStyle(stepStatusColor);
            return (
              <div key={si} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>

                {/* Step header */}
                <div onClick={() => toggleStep(stepKey)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", cursor: "pointer" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: idxStyle.bg, color: idxStyle.color, border: `1px solid ${idxStyle.border}`, flexShrink: 0 }}>{step.index}</div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{step.title}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, flexShrink: 0 }}>{stepStatus}</span>
                  <svg style={{ width: 16, height: 16, color: C.muted2, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                </div>

                {/* Step body */}
                {isOpen && (
                  <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${C.border}` }}>
                    <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, padding: "14px 0 16px", borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>{step.desc}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {step.items.map((item, ii) => {
                        const itemKey = `${phase.id}-${si}-${ii}`;
                        const isChecked = checked[itemKey];
                        const ts = typeStyle(item.type);
                        return (
                          <div key={ii} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 8, background: C.surface2, border: `1px solid transparent` }}>
                            <div onClick={(e) => toggleCheck(itemKey, e)} style={{ width: 18, height: 18, borderRadius: 5, border: isChecked ? `1.5px solid ${C.green}` : `1.5px solid ${C.muted2}`, background: isChecked ? C.green : "transparent", flexShrink: 0, marginTop: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {isChecked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: isChecked ? C.muted2 : C.text, textDecoration: isChecked ? "line-through" : "none", lineHeight: 1.5 }}>{item.label}</div>
                              <div style={{ fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 1.5 }}>{item.detail}</div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: ts.bg, color: ts.color, flexShrink: 0, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.type}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ height: 80 }} />
      </main>
    </div>
  );
}
