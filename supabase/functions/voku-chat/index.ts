import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept",
};

// Timeout para chamadas ao Anthropic (ms)
const ANTHROPIC_TIMEOUT = 55_000  // 55s — abaixo do limite de 60s da Edge Function

// ── Fetch com timeout via AbortController ────────────────────────────────────
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer))
}

// ── Merge seguro de mensagens consecutivas do mesmo role ─────────────────────
// CORREÇÃO: o content pode ser string OU array (quando tem imagem).
// Merge incorreto quebrava mensagens com imagem, causando erro 400 no Anthropic.
function mergeMessages(rawMessages: any[]): any[] {
  const messages: any[] = []

  for (const m of rawMessages) {
    const last = messages[messages.length - 1]

    if (last && last.role === m.role) {
      // Normaliza ambos para array antes de concatenar
      const existingParts = normalizeContent(last.content)
      const newParts = normalizeContent(m.content)
      last.content = [...existingParts, ...newParts]
    } else {
      messages.push({ ...m })
    }
  }

  return messages
}

// Normaliza content para sempre ser array de content blocks
function normalizeContent(content: any): any[] {
  if (Array.isArray(content)) return content
  if (typeof content === "string") return [{ type: "text", text: content }]
  return [{ type: "text", text: String(content) }]
}

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

  return `Você é Rordens — Agente de IA — Supervisor de Prompts da plataforma Voku.

⚠️ REGRA #1 — OBRIGATÓRIA: Quando o cliente confirmar geração ("sim", "pode gerar", "aprovado", "manda", "gera", "vai", "bora"), sua resposta DEVE conter o JSON de execução abaixo. Sem este JSON, o sistema NÃO executa nada. NUNCA responda apenas com texto como "gerando..." sem incluir o JSON.
Formato: {"action":"execute","product":"<tipo>","structured_data":{...}}

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

## Coleta de Pilares de Conteúdo (para content_pack)
Quando o produto for content_pack, pergunte NATURALMENTE: "Quais são os 3 a 4 temas principais que sua marca aborda? Ex: educação, bastidores, depoimentos, promoções."
Se o cliente não souber, use os padrões: Educação, Bastidores, Prova Social, Conversão.
Inclua no structured_data: "pilares_conteudo": ["pilar1", "pilar2", "pilar3", "pilar4"]

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

## REGRA CRÍTICA — JSON de execução
- O JSON {"action":"execute",...} é o ÚNICO mecanismo que dispara a geração real. Sem ele, NADA acontece.
- SEMPRE que o cliente confirmar ("sim", "pode gerar", "aprovado", "manda", "gera", "vai"), você DEVE incluir o JSON de execução na sua resposta.
- NUNCA diga "gerando..." ou "aguarde..." sem incluir o JSON — isso trava o sistema.
- Isso vale para o PRIMEIRO pedido E para QUALQUER pedido subsequente na mesma conversa.
- Cada novo pedido precisa do seu próprio JSON de execução completo.

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
✅ Coletar o mínimo e já gerar preview

⚠️ LEMBRETE FINAL: Se o cliente disse "sim/gera/aprovado/pode gerar", sua resposta OBRIGATORIAMENTE deve conter {"action":"execute","product":"...","structured_data":{...}}. Texto sem JSON = sistema travado.`;
}

function extractAction(text: string): { cleanText: string; action: any | null } {
  const marker = '"action"';
  const idx = text.indexOf(marker);
  if (idx === -1) return { cleanText: text, action: null };

  let start = text.lastIndexOf("{", idx);
  if (start === -1) return { cleanText: text, action: null };

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

  try {
    const { messages: rawMessages, user_context } = await req.json();

    // ✅ CORRIGIDO: merge seguro que preserva content blocks de imagem
    const messages = mergeMessages(rawMessages)

    let brand = null;
    if (user_context?.user_id) {
      try {
        const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data } = await sb.from("brand_contexts").select("*").eq("user_id", user_context.user_id).single();
        if (data) brand = data;
      } catch { /* no brand context */ }
    }

    const systemPrompt = buildSystemPrompt(user_context, brand);

    const confirmPattern = /^(sim|pode gerar|aprovado|manda|gera|vai|bora|pode|gerar|ok|vamos|fechou|manda ver|gera!|gerar!)/i;
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");

    // ✅ CORRIGIDO: extrai texto do content mesmo quando é array (mensagem com imagem)
    const lastUserText = (() => {
      if (!lastUserMsg) return ""
      const c = lastUserMsg.content
      if (typeof c === "string") return c.trim()
      if (Array.isArray(c)) {
        return c.filter((b: any) => b.type === "text").map((b: any) => b.text).join(" ").trim()
      }
      return ""
    })()

    const isConfirmation = confirmPattern.test(lastUserText)

    const apiMessages = isConfirmation
      ? [...messages, { role: "assistant", content: "Perfeito! Gerando agora 🚀\n\n{\"action\":\"execute\"," }]
      : messages;

    const wantsStream = req.headers.get("accept") === "text/event-stream";

    if (wantsStream) {
      // ✅ CORRIGIDO: fetchWithTimeout evita pendurar a Edge Function
      const anthropicRes = await fetchWithTimeout(
        "https://api.anthropic.com/v1/messages",
        {
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
            messages: apiMessages,
          }),
        },
        ANTHROPIC_TIMEOUT
      )

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text()
        throw new Error(`Anthropic stream error (${anthropicRes.status}): ${errText}`)
      }

      let fullText = isConfirmation ? "Perfeito! Gerando agora 🚀\n\n{\"action\":\"execute\"," : "";
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
                } catch { /* skip malformed SSE */ }
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

    // ✅ CORRIGIDO: fetchWithTimeout no modo non-streaming também
    const response = await fetchWithTimeout(
      "https://api.anthropic.com/v1/messages",
      {
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
          messages: apiMessages,
        }),
      },
      ANTHROPIC_TIMEOUT
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Anthropic error (${response.status}): ${errText}`)
    }

    const data = await response.json();
    const prefill = isConfirmation ? "Perfeito! Gerando agora 🚀\n\n{\"action\":\"execute\"," : "";
    const rawText = prefill + (data?.content?.[0]?.text || "");
    const { cleanText: noAction, action } = extractAction(rawText);
    const { cleanText, preview } = extractPreview(noAction);
    const result: any = { ...data, content: [{ type: "text", text: cleanText }], fullText: rawText };
    if (action) result.action = action;
    if (preview) result.preview = preview;

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    const errMsg = (err as Error).message || "Internal error";
    console.error("voku-chat error:", errMsg);

    // Mensagem mais específica dependendo do tipo de erro
    const isTimeout = errMsg.includes("abort") || errMsg.includes("timeout")
    const userMsg = isTimeout
      ? "Demorou mais que o esperado. Tenta de novo!"
      : "Ops, tive um problema técnico. Tenta de novo!"

    return new Response(JSON.stringify({
      content: [{ type: "text", text: userMsg }],
      error: errMsg,
    }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
