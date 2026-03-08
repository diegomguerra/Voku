# VOKU — CONTEXTO DO PROJETO

## Identidade
- Marca: VOKU | Site: voku.one | Entidade: Wyoming LLC
- Stack: Next.js 14 + Supabase + Vercel + Anthropic API + Resend
- Repositório: github.com/diegomguerra/Voku
- Engine de IA interna: RORDENS (Claude via Anthropic API)

## Credenciais e IDs
- Supabase project_id: nbxsfsuiwvoriyfwzezs
- Supabase URL: https://nbxsfsuiwvoriyfwzezs.supabase.co
- Vercel: projeto "voku" conectado ao GitHub main
- Deploy automático: qualquer push em main → Vercel redeploy

## Estrutura de Rotas
- / → Landing page (src/app/landing.tsx)
- /cliente → Login/cadastro (src/app/cliente/page.tsx)
- /cliente/pedidos → Área do cliente (src/app/cliente/pedidos/page.tsx)
- /admin/dashboard → Dashboard operacional (src/app/admin/dashboard/page.tsx)
- /admin/dashboard/media → Dashboard mídia (src/app/admin/dashboard/media/page.tsx)
- /api/submit-briefing → Cria pedido + e-mail de confirmação
- /api/execute-product → Executa produto com IA + e-mail de entrega

## Banco de Dados (Supabase)
Tabelas: users, orders, briefings, deliverables, media_posts, media_spend
Edge Functions: submit-briefing, execute-product
Storage bucket: deliverables (privado, signed URLs)
Auth trigger: on_auth_user_created → insere em public.users

## Produtos MVP
| Produto | USD | BRL | Prazo |
|---------|-----|-----|-------|
| Landing Page Copy | $97 | R$497 | 24h |
| Pacote de Conteúdo para Redes (12 posts) | $147 | R$747 | 48h |
| Sequência de E-mails de Nutrição (5 emails) | $127 | R$647 | 48h |

## Design System
- Fonte display: DM Serif Display (italic)
- Fonte corpo: Plus Jakarta Sans
- Cor accent: #C8F135 (lime)
- Fundo: #FAF8F3 (areia)
- Ink: #111111
- Border: #E8E5DE

## Status das Fases
- [✅] Fase 1 — Infraestrutura completa
- [✅] Fase 2 — Produtos e precificação definidos
- [✅] Fase 3 — Landing page no ar (voku.one)
- [✅] Fase 4 — Backend e automação (Edge Functions, e-mails)
- [✅] Fase 5 — Área do cliente (login, pedidos, download — deployado)
- [✅] Fase 6 — Dashboard operacional (/admin/dashboard)
- [✅] Fase 7 — Dashboard de mídia (/admin/dashboard/media)
- [⏳] Fase 8 — Canais de venda (Fiverr + Workana)
- [⏳] Fase 9 — Pagamentos diretos (Stripe)
- [🔵] Fase 10 — Máquina de conteúdo social

## Ambiente configurado
- Vercel: 6 env vars configuradas (Supabase, Anthropic, Resend, App URL)
- .env.local: completo para dev local
- Deploy automático: push em main → Vercel redeploy

## Pendências imediatas
1. Desativar site builder do GoDaddy (intercepta voku.one)
2. ~~Verificar domínio ola@voku.one no Resend~~ ✅ Verificado
3. Conectar dashboards a dados reais do Supabase

## Regras de trabalho
- Todo arquivo novo deve ter timestamp no nome: arquivo_YYYYMMDD_HHMMSS
- Sempre rodar npm run build antes de qualquer push
- Nunca alterar src/lib/products.ts sem confirmar com o usuário
- Sempre usar o design system acima em componentes novos
- Após cada push bem-sucedido, confirmar a URL em produção
