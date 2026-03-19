# Voku App

Plataforma de serviços digitais productizados — Landing Page Copy, Pacote de Posts, Sequência de E-mails.

## Stack

- **Next.js 14** — framework
- **Supabase** — banco de dados, auth, storage
- **Anthropic API** — execução dos produtos (RORDENS)
- **Resend** — e-mails transacionais
- **Vercel** — hospedagem

## Setup local

```bash
# 1. Clonar
git clone https://github.com/seu-usuario/voku-app.git
cd voku-app

# 2. Instalar dependências
npm install

# 3. Variáveis de ambiente
# Copie o .env.local.example e preencha
cp .env.local.example .env.local

# 4. Rodar
npm run dev
```

## Variáveis de ambiente necessárias

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=https://voku.one
```

## Supabase — configuração manual necessária

1. Acesse: https://supabase.com/dashboard/project/movfynswogmookzcjijt/settings/functions
2. Adicione os secrets: ANTHROPIC_API_KEY, RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY

## Deploy na Vercel

1. Importe o repositório GitHub na Vercel
2. Adicione as variáveis de ambiente
3. Deploy automático a cada push na main

## Fluxo do sistema

```
Cliente → Cadastro → Briefing IA → submit-briefing API
  → Cria pedido no Supabase
  → E-mail de confirmação (Resend)
  → execute-product API (background)
    → Anthropic gera o produto
    → Arquivo salvo no Supabase Storage
    → Pedido atualizado para "delivered"
    → E-mail de entrega com link de download
```

## Edge Functions (Supabase)

- `submit-briefing` — ativa https://movfynswogmookzcjijt.supabase.co/functions/v1/submit-briefing
- `execute-product` — ativa https://movfynswogmookzcjijt.supabase.co/functions/v1/execute-product
