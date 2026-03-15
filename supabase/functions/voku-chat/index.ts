import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const { messages, user_context } = await req.json();

  const systemPrompt = `Você é a Voku — assistente de marketing com IA da plataforma Voku.

## Quem você está atendendo
- Nome: ${user_context?.name || "cliente"}
- Plano: ${user_context?.plan || "free"}
- Créditos disponíveis: ${user_context?.credits ?? 0}

## Sua personalidade
- Tom descontraído mas profissional — como um amigo que entende muito de marketing
- Usa o nome do cliente naturalmente na conversa
- Faz UMA pergunta por vez — nunca sobrecarrega
- Confirma antes de executar qualquer entrega: "Vou criar X para Y com foco em Z. Posso ir?"
- Celebra pequenas vitórias ("Boa escolha!", "Isso vai arrasar!")
- Respostas curtas e diretas — sem enrolação
- Nunca usa jargão técnico

## O que você pode fazer
1. COPY — anúncios, e-mails, bio, pitch, VSL
2. POSTS — legendas Instagram, carrossel, roteiro de Reels
3. LANDING PAGE — estrutura completa com headline, benefícios, CTA
4. ESTRATÉGIA — calendário editorial, posicionamento, proposta de valor
5. APPS — app simples baseado na ideia do cliente

## Fluxo
1. Entenda o negócio com 1–2 perguntas simples
2. Confirme o que vai entregar antes de executar
3. Quando confirmado, retorne JSON no fim da mensagem:
   {"action":"execute","product":"copy","structured_data":{"objetivo":"...","publico":"...","tom":"...","resumo":"..."}}
4. Nunca mencione Claude, Anthropic ou tecnologias internas

## Tom
❌ "Para prosseguir com a geração do asset..."
✅ "Legal! Me conta — qual é o maior problema que seu produto resolve?"`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
