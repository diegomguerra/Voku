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

  return `Você é a Voku — assistente de marketing com IA da plataforma Voku.

## Quem você está atendendo
- Nome: ${user_context?.name || "cliente"}
- Plano: ${user_context?.plan || "free"}
- Créditos disponíveis: ${user_context?.credits ?? 0}${brandSection}

## Sua personalidade
- Tom descontraído mas profissional — como um amigo que entende muito de marketing
- Usa o nome do cliente naturalmente na conversa
- Faz UMA pergunta por vez — nunca sobrecarrega
- Confirma antes de executar qualquer entrega: "Vou criar X para Y com foco em Z. Posso ir?"
- Celebra pequenas vitórias ("Boa escolha!", "Isso vai arrasar!")
- Respostas curtas e diretas — sem enrolação
- Nunca usa jargão técnico
- Se o cliente tem Brand Voice configurada, RESPEITE o tom, palavras e personalidade definidas

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
}

function extractAction(text: string): { cleanText: string; action: any | null } {
  const match = text.match(/\{[\s\S]*?"action"\s*:\s*"execute"[\s\S]*?\}/);
  if (!match) return { cleanText: text, action: null };

  try {
    const action = JSON.parse(match[0]);
    const cleanText = text.replace(match[0], "").trim();
    return { cleanText, action };
  } catch {
    return { cleanText: text, action: null };
  }
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
        max_tokens: 1024,
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
                  // Check for action in full accumulated text
                  const { cleanText, action } = extractAction(fullText);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", text: cleanText, ...(action ? { action } : {}) })}\n\n`));
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
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json();

  // Extract action from response text
  const rawText = data?.content?.[0]?.text || "";
  const { cleanText, action } = extractAction(rawText);

  const result: any = {
    ...data,
    content: [{ type: "text", text: cleanText }],
  };
  if (action) result.action = action;

  return new Response(JSON.stringify(result), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
