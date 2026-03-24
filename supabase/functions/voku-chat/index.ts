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
    if (brand.cor_primaria) parts.push(`- Cor primária da marca: ${brand.cor_primaria}`);
    if (brand.cor_secundaria) parts.push(`- Cor secundária da marca: ${brand.cor_secundaria}`);
    if (brand.fonte_preferida) parts.push(`- Fonte/estilo visual preferido: ${brand.fonte_preferida}`);
    if (parts.length > 0) {
      brandSection = `\n\n## Brand Voice do cliente (USE SEMPRE)\n${parts.join("\n")}`;
    }
  }

  const brandCtxForExecution = brand ? {
    nome_marca: brand.nome_marca,
    tom: brand.tom,
    personalidade: brand.personalidade,
    cor_primaria: brand.cor_primaria || null,
    cor_secundaria: brand.cor_secundaria || null,
    fonte_preferida: brand.fonte_preferida || null,
    palavras_chave: brand.palavras_chave || [],
    palavras_proibidas: brand.palavras_proibidas || [],
  } : null;

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

## Coleta obrigatória ANTES de executar posts/carrossel/conteúdo
Se o produto for POSTS, CARROSSEL ou qualquer conteúdo visual, você PRECISA saber antes de confirmar execução:
1. Nome da empresa/marca do cliente
2. Produto ou serviço principal
3. Público-alvo (quem compra, faixa etária, dor principal)
4. Tom desejado (ex: leve e bem-humorado, sério e técnico, inspiracional)
5. Cor principal da marca (ex: azul #0057FF) — se não souber, pergunte "Qual a cor principal da sua marca? Pode ser o nome da cor ou o código hex"
6. Cor secundária ou de fundo (ex: branco, cinza claro)
Se o brand context já tem essas informações, não pergunte de novo — use o que já existe.

## Fluxo
1. Entenda o negócio com 1–3 perguntas simples (UMA POR VEZ)
2. Para conteúdo visual, colete as cores conforme regra acima
3. Confirme o que vai entregar antes de executar
4. Quando confirmado, retorne JSON no fim da mensagem:
   {"action":"execute","product":"copy","structured_data":{"objetivo":"...","publico":"...","tom":"...","resumo":"...","brand_context":${JSON.stringify(brandCtxForExecution)}}}
5. Para posts/carrossel, inclua SEMPRE no structured_data: "cor_primaria", "cor_secundaria", "nome_marca", "publico_detalhado"
6. Nunca mencione Claude, Anthropic ou tecnologias internas

## Tom
❌ "Para prosseguir com a geração do asset..."
✅ "Legal! Me conta — qual é o maior problema que seu produto resolve?"

## IMPORTANTE sobre imagens
Você cria CONTEÚDO ESTRATÉGICO: textos dos slides, hooks, CTAs, legendas, hashtags.
Você NÃO gera imagens. Se o cliente pedir imagem, explique isso brevemente e volte ao foco de criar conteúdo excelente.
Nunca sugira ferramentas externas de imagem — apenas entregue o melhor conteúdo possível.`;
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

  let brand = null;
  if (user_context?.user_id) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data } = await sb.from("brand_contexts").select("*").eq("user_id", user_context.user_id).single();
      if (data) brand = data;
    } catch { /* no brand context */ }
  }

  const systemPrompt = buildSystemPrompt(user_context, brand);
  const wantsStream = req.headers.get("accept") === "text/event-stream";

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
                  const { cleanText, action } = extractAction(fullText);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", text: cleanText, ...(action ? { action } : {}) })}\n\n`));
                }
              } catch { /* skip */ }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...CORS, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  }

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
  const rawText = data?.content?.[0]?.text || "";
  const { cleanText, action } = extractAction(rawText);
  const result: any = { ...data, content: [{ type: "text", text: cleanText }] };
  if (action) result.action = action;

  return new Response(JSON.stringify(result), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
