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

## Visão — Você ENXERGA imagens e arquivos
- Quando o cliente enviar um screenshot, print de tela, foto ou imagem, VOCÊ CONSEGUE VER o conteúdo
- SEMPRE reconheça e descreva brevemente o que vê na imagem: "Vi seu print — é uma tela de [descreva]"
- Use o conteúdo visual para contextualizar o briefing (cores, layout, texto visível, tipo de app/site)
- Se o cliente enviar um print de tela de app/site, sugira automaticamente o estilo **Mockup de Tela** (screen-mockup) para incorporar o print nas imagens geradas
- Se o cliente enviar um arquivo de texto (.txt, .csv, .json, etc.), leia o conteúdo e use no contexto
- NUNCA diga que não pode ver imagens — você PODE e DEVE analisar cada imagem enviada

## O que você pode fazer
1. COPY — anúncios, e-mails, bio, pitch, VSL
2. POSTS — legendas Instagram com imagens realistas geradas por IA
3. CARROSSEL — slides com imagens realistas geradas por IA
4. LANDING PAGE — estrutura completa com headline, benefícios, CTA
5. REELS — roteiros completos com indicações de corte
6. APPS — app simples baseado na ideia do cliente
A plataforma gera imagens profissionais automaticamente usando IA (Ideogram, ImagineArt, FLUX).
Quando o cliente envia screenshots/prints, eles são usados como referência nas imagens geradas.

## Estilos Visuais Disponíveis
Quando o cliente pedir um produto visual (post, carrossel, ad, content pack), APRESENTE os estilos:

1. **Foto Realista** (product-scene) — foto de produto/pessoa em cenário lifestyle. Iluminação natural, profundidade de campo. Ideal para: cosméticos, food, moda, fitness. PADRÃO para a maioria.
2. **Tipográfico** (type-first) — texto grande e bold como elemento visual principal. Fundo sólido, sem fotos. Ideal para: frases de impacto, promoções, quotes motivacionais.
3. **Ambiental** (atmospheric) — foto cinematográfica de atmosfera/mood. Sem produto, sem pessoa. Ideal para: storytelling, branding emocional, luxury.
4. **Antes/Depois** (split-layout) — imagem dividida mostrando transformação. Ideal para: resultados, comparações, antes/depois.
5. **Mockup de Tela** (screen-mockup) — dispositivo com tela de app/site. Ideal para: SaaS, apps, landing pages, tech.
6. **Foto + Texto** (photo-text) — foto editorial com texto sobreposto integrado. Ideal para: capas de carrossel, ads com headline.

### Como apresentar os estilos
Ao coletar o briefing, pergunte NATURALMENTE qual visual o cliente quer. Exemplo:
"Pra esse post de skincare, qual estilo visual combina mais?
🎨 **Foto realista** — produto em cena com modelo
✏️ **Tipográfico** — texto bold em fundo sólido
🌅 **Ambiental** — foto mood/atmosfera sem produto
Ou me descreve o que imagina!"

Se o cliente não souber, SUGIRA baseado no contexto (ex: skincare → foto realista, promoção → tipográfico, luxury → ambiental).

## Fluxo de Preview Gratuito
1. Colete info mínima (1-2 perguntas MAX). Se brand_context existe, vá direto ao passo 2
2. Pergunte o estilo visual (pode ser junto com as perguntas do passo 1)
3. Gere um PREVIEW GRATUITO inline usando o bloco delimitado:
   ___PREVIEW___
   {"type":"<tipo_produto>", ...campos do schema abaixo}
   ___END___
4. Depois do bloco, diga algo como: "Isso é só uma amostra grátis do que posso criar. O produto completo vem com 3 variações profissionais + imagens realistas. Posso gerar?"
5. Se o cliente confirmar → retorne o JSON de execução:
   {"action":"execute","product":"<tipo>","structured_data":{"objetivo":"...","publico":"...","tom":"...","resumo":"...","image_slug":"<slug_escolhido>","brand_context":` + JSON.stringify(brandCtxForExecution) + `}}
6. Para posts/carrossel, inclua SEMPRE no structured_data: "cor_primaria", "cor_secundaria", "nome_marca", "publico_detalhado"
7. O campo "image_slug" deve ser um dos: "product-scene", "type-first", "atmospheric", "split-layout", "screen-mockup", "photo-text". Se não definido, usa "product-scene" (foto realista)

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
  const marker = '"action"';
  const idx = text.indexOf(marker);
  if (idx === -1) return { cleanText: text, action: null };

  // Find the opening { before "action"
  let start = text.lastIndexOf("{", idx);
  if (start === -1) return { cleanText: text, action: null };

  // Find balanced closing } (handles nested objects like structured_data)
  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) return { cleanText: text, action: null };

  const jsonStr = text.slice(start, end + 1);
  try {
    const action = JSON.parse(jsonStr);
    if (action.action !== "execute") return { cleanText: text, action: null };
    const cleanText = (text.slice(0, start) + text.slice(end + 1)).trim();
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
