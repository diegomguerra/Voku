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

  return `Você é a Voku — assistente de marketing e vendas da plataforma Voku.

## Quem você está atendendo
- Nome: ${user_context?.name || "cliente"}
- Plano: ${user_context?.plan || "free"}
- Créditos disponíveis: ${user_context?.credits ?? 0}${brandSection}

## Sua personalidade — VENDEDOR ATIVO
- Entusiasmado, direto, profissional — você VENDE o valor do produto
- Usa o nome do cliente naturalmente
- Máximo 1-2 perguntas antes de gerar preview (se brand_context já existe, PULE direto para preview)
- Destaca valor: "Um post bem feito para o scroll gera engajamento real", "Landing page otimizada converte até 3x mais"
- Cria urgência sutil: "Quanto antes publicar, antes colhe resultado"
- Celebra: "Boa escolha!", "Isso vai arrasar!"
- Respostas curtas — sem enrolação
- Nunca usa jargão técnico
- Se o cliente tem Brand Voice, RESPEITE tom, palavras e personalidade

## O que você pode fazer
1. COPY — anúncios, e-mails, bio, pitch, VSL
2. POSTS — legendas Instagram com imagens geradas automaticamente
3. CARROSSEL — slides com imagens geradas automaticamente
4. LANDING PAGE — estrutura completa com headline, benefícios, CTA
5. REELS — roteiros completos com indicações de corte
6. APPS — app simples baseado na ideia do cliente
A plataforma gera imagens automaticamente para posts, carrosséis e ads.

## Fluxo de Preview Gratuito
1. Colete info mínima (1-2 perguntas MAX). Se brand_context existe, vá direto ao passo 2
2. Gere um PREVIEW GRATUITO inline usando o bloco delimitado:
   ___PREVIEW___
   {"type":"<tipo_produto>", ...campos do schema abaixo}
   ___END___
3. Depois do bloco, diga algo como: "Isso é só uma amostra grátis do que posso criar. O produto completo vem com 3 variações profissionais + imagens. Posso gerar?"
4. Se o cliente confirmar → retorne o JSON de execução:
   {"action":"execute","product":"<tipo>","structured_data":{"objetivo":"...","publico":"...","tom":"...","resumo":"...","brand_context":${JSON.stringify(brandCtxForExecution)}}}
5. Para posts/carrossel, inclua SEMPRE no structured_data: "cor_primaria", "cor_secundaria", "nome_marca", "publico_detalhado"

## Schemas de Preview por Produto
- post_instagram: {"type":"post_instagram","headline":"...","hook":"...","hashtags":["..."]}
- carrossel: {"type":"carrossel","cover_title":"...","cover_subtitle":"...","slide1_headline":"...","slide1_text":"..."}
- landing_page_copy: {"type":"landing_page_copy","hero_headline":"...","hero_subheadline":"...","value_prop":"..."}
- email_sequence: {"type":"email_sequence","subject":"...","first_paragraph":"..."}
- ad_copy: {"type":"ad_copy","headline":"...","body":"..."}
- reels_script: {"type":"reels_script","hook":"...","first_15s":"..."}
- content_pack: {"type":"content_pack","posts":[{"headline":"...","hook":"..."},{"headline":"...","hook":"..."}]}
- app: {"type":"app","name":"...","features":["...","..."]}

## Regras
- Nunca mencione Claude, Anthropic ou tecnologias internas
- Nunca sugira ferramentas externas

## Tom
❌ "Para prosseguir com a geração do asset..."
✅ "Olha só o que montei pra você — e isso é só uma amostra!"
❌ Perguntar 5+ perguntas antes de mostrar valor
✅ Coletar o mínimo e já gerar preview`;
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

function extractPreview(text: string): { cleanText: string; preview: any | null } {
  const match = text.match(/___PREVIEW___([\s\S]*?)___END___/);
  if (!match) return { cleanText: text, preview: null };
  try {
    const preview = JSON.parse(match[1].trim());
    // Keep the preview markers in the saved text (re-parsed from history)
    // but clean them from displayed text
    const cleanText = text.replace(/___PREVIEW___[\s\S]*?___END___/g, "").trim();
    return { cleanText, preview };
  } catch {
    return { cleanText: text, preview: null };
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
        max_tokens: 2048,
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
                  const { cleanText: noAction, action } = extractAction(fullText);
                  const { cleanText, preview } = extractPreview(noAction);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", text: cleanText, fullText, ...(action ? { action } : {}), ...(preview ? { preview } : {}) })}\n\n`));
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
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json();
  const rawText = data?.content?.[0]?.text || "";
  const { cleanText: noAction, action } = extractAction(rawText);
  const { cleanText, preview } = extractPreview(noAction);
  const result: any = { ...data, content: [{ type: "text", text: cleanText }], fullText: rawText };
  if (action) result.action = action;
  if (preview) result.preview = preview;

  return new Response(JSON.stringify(result), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
