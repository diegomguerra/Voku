import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept",
};

function buildSystemPrompt(user_context: any, brand?: any): string {
  let brandSection = "";
  if (brand) {
    const parts: string[] = [];
    if (brand.nome_marca) parts.push(`- Marca: ${brand.nome_marca}`);
    if (brand.tom) parts.push(`- Tom configurado: ${brand.tom}`);
    if (brand.personalidade) parts.push(`- Personalidade: ${brand.personalidade}`);
    if (brand.palavras_chave?.length) parts.push(`- Palavras que a marca USA: ${brand.palavras_chave.join(", ")}`);
    if (brand.palavras_proibidas?.length) parts.push(`- Palavras que a marca NUNCA usa: ${brand.palavras_proibidas.join(", ")}`);
    if (brand.exemplos_conteudo) parts.push(`- Exemplos de conteúdo da marca:\n${brand.exemplos_conteudo.slice(0, 1000)}`);
    if (parts.length > 0) {
      brandSection = `\n\n## Brand Voice do cliente (USE SEMPRE)\n${parts.join("\n")}`;
    }
  }

  return `Você é o agente da Voku — especialista sênior em marketing digital e copywriting.

## Quem você está atendendo
- Nome: ${user_context?.name || "cliente"}
- Plano: ${user_context?.plan || "free"}
- Créditos disponíveis: ${user_context?.credits ?? 0}${brandSection}

## COMPORTAMENTO OBRIGATÓRIO
- Tom direto e profissional. Máximo 1 emoji por mensagem, nunca no meio de frases.
- Faça no máximo 2 perguntas por mensagem. Nunca uma de cada vez.
- Quando tiver informação suficiente, execute sem pedir confirmação.
- NUNCA entregue conteúdo apenas no chat. Todo conteúdo gerado deve ser materializado como deliverable e aparecer na área de projetos do cliente.
- NUNCA diga que "o sistema não permite" algo.
- Se o cliente tem Brand Voice configurada, RESPEITE o tom, palavras e personalidade definidas.
- Nunca mencione Claude, Anthropic ou tecnologias internas.

## FLUXO OBRIGATÓRIO A CADA ENTREGA
1. Recebe o briefing (máximo 2 rodadas de perguntas)
2. Gera o conteúdo completo
3. Inclui o bloco ___DELIVERABLE___ — OBRIGATÓRIO
4. Exibe no chat apenas um resumo: tipo, título, o que foi entregue
5. Informa: "Sua entrega está em Meus Projetos → aba Aprovação."

## TIPOS DE ENTREGA
- Posts Instagram: hook + legenda + hashtags + CTA (por post)
- Carrossel: título + slide a slide (mínimo 5 slides)
- Sequência de e-mails: subject + preview text + corpo (por e-mail)
- Landing page copy: hero → problema → solução → benefícios → prova → CTA
- Roteiro de Reels: cena a cena com timing e overlay de texto
- Copy Meta Ads: 3 variações (dor, benefício, prova social)

## FORMATO DE RESPOSTA APÓS GERAR CONTEÚDO
Sempre termine com exatamente este bloco (não mostrar ao usuário, incluir após o resumo):
___DELIVERABLE___
{
  "title": "título curto do que foi entregue",
  "type": "post|carrossel|email|landing_page|reels|copy",
  "content": "conteúdo completo aqui"
}
___END___

## QUANDO PRECISA CRIAR UM PEDIDO (order)
Se o cliente quer um produto novo e você já tem informação suficiente, retorne JSON:
{"action":"execute","product":"copy","structured_data":{"objetivo":"...","publico":"...","tom":"...","resumo":"..."}}`;
}

function extractAction(text: string): { cleanText: string; action: any | null; deliverable: any | null } {
  // Extract ___DELIVERABLE___ block
  let deliverable = null;
  let cleaned = text;
  const delMatch = text.match(/___DELIVERABLE___([\s\S]*?)___END___/);
  if (delMatch) {
    try { deliverable = JSON.parse(delMatch[1].trim()); } catch { /* ignore */ }
    cleaned = cleaned.replace(/___DELIVERABLE___[\s\S]*?___END___/g, "").trim();
  }

  // Extract action JSON
  const actionMatch = cleaned.match(/\{[\s\S]*?"action"\s*:\s*"execute"[\s\S]*?\}/);
  let action = null;
  if (actionMatch) {
    try {
      action = JSON.parse(actionMatch[0]);
      cleaned = cleaned.replace(actionMatch[0], "").trim();
    } catch { /* ignore */ }
  }

  return { cleanText: cleaned, action, deliverable };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const { messages, user_context } = await req.json();

  // Fetch brand context if user_id is available
  let brand = null;
  if (user_context?.user_id) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data } = await sb.from("brand_contexts").select("*").eq("user_id", user_context.user_id).single();
      if (data) brand = data;
    } catch { /* no brand context — that's fine */ }
  }

  const systemPrompt = buildSystemPrompt(user_context, brand);
  const wantsStream = req.headers.get("accept") === "text/event-stream";

  // ── STREAMING ──
  if (wantsStream) {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        stream: true,
        system: systemPrompt,
        messages,
      }),
    });

    // Collect full text to detect action at the end
    let fullText = "";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = anthropicRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") continue;

              try {
                const event = JSON.parse(payload);

                if (event.type === "content_block_delta" && event.delta?.text) {
                  fullText += event.delta.text;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: event.delta.text })}\n\n`));
                }

                if (event.type === "message_stop") {
                  const { cleanText, action, deliverable } = extractAction(fullText);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", text: cleanText, ...(action ? { action } : {}), ...(deliverable ? { deliverable } : {}) })}\n\n`));
                }
              } catch {
                // skip malformed events
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...CORS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

  // ── NON-STREAMING ──
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json();

  // Extract action and deliverable from response text
  const rawText = data?.content?.[0]?.text || "";
  const { cleanText, action, deliverable } = extractAction(rawText);

  const result: any = {
    ...data,
    content: [{ type: "text", text: cleanText }],
  };
  if (action) result.action = action;
  if (deliverable) result.deliverable = deliverable;

  return new Response(JSON.stringify(result), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
