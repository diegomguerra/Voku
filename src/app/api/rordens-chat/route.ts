import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const PRODUCT_PROMPTS: Record<string, string> = {
  landing_page_copy: `Campos do formulário de Landing Page:
Passo 1 — Sobre o negócio: nome_marca, site_url, produto (produto/serviço), publico (público-alvo), objetivos (múltipla escolha: Capturar leads, Vender diretamente, Agendar reunião, Divulgar produto, Lançamento, Outro), resumo, palavras_chave
Passo 2 — Visual: logo, paleta de cores (cor_primaria, cor_secundaria, cor_texto), estilo (moderno, clean, corporativo, startup, editorial, luxury)
Passo 3 — Copy: tom (direto, inspiracional, educativo, premium, descontraido, urgente), cta_texto`,
  post_instagram: `Campos: hook (frase de abertura), legenda, hashtags, público-alvo, tom, objetivo do post`,
  carrossel: `Campos: tema, número de slides (7), hook do primeiro slide, CTA do último slide, público-alvo, tom`,
  email_sequence: `Campos: objetivo da sequência, público-alvo, número de e-mails (5), tom, assunto do primeiro e-mail, CTA principal`,
  reels_script: `Campos: tema, duração (30s/60s/90s), hook dos primeiros 3 segundos, público-alvo, CTA, tom`,
  ad_copy: `Campos: produto/serviço, público-alvo, plataforma (Meta/Google), ângulos (dor, benefício, prova), tom, CTA`,
  content_pack: `Campos: tema geral, público-alvo, número de posts, pilares de conteúdo, tom, hashtags principais`,
};

function buildSystemPrompt(produto: string, passo: number, formContext: string) {
  const productFields = PRODUCT_PROMPTS[produto] || PRODUCT_PROMPTS.post_instagram;
  const productLabel: Record<string, string> = {
    landing_page_copy: "Landing Page",
    post_instagram: "Post Instagram",
    carrossel: "Carrossel",
    email_sequence: "Sequência de E-mails",
    reels_script: "Roteiro de Reels",
    ad_copy: "Copy para Meta Ads",
    content_pack: "Pack de Conteúdo",
  };

  return `Você é Rordens, diretor criativo da Voku. Você NÃO é um formulário — você é um estrategista de conteúdo que conduz o briefing de ${productLabel[produto] || "conteúdo"} como um coaching criativo.

SUA PERSONALIDADE:
- Você é um diretor criativo experiente, não um chatbot genérico
- Fale com confiança: "Eu sugiro...", "O que funciona bem para esse tipo de marca é...", "Vou propor 3 ângulos..."
- Proponha ideias ativamente — não fique só perguntando
- Traga referências e exemplos concretos de conteúdo que funciona

FLUXO DO BRIEFING:
1. Quando receber URL/@ → confirme os dados LITERAIS extraídos (título, descrição, cores)
2. Proponha 3 temas de posts baseados no que entendeu da marca. Exemplo:
   "Baseado no que vi, sugiro 3 ângulos:
   1. **Educativo** — Como funciona [produto], por que importa
   2. **Bastidores** — O processo por trás, a equipe, o dia a dia
   3. **Prova social** — Resultados, depoimentos, números
   Qual desses faz mais sentido? Ou tem outro ângulo?"
3. Proponha 2-3 cenas visuais para as imagens. Exemplo:
   "Para as imagens, imagino:
   - Executivo usando o produto no escritório pela manhã
   - Close no produto com luz natural
   - Pessoa real em ambiente de trabalho, estilo documental
   Gostou ou quer algo diferente?"
4. Confirme o tom: "Pelo que vi da marca, sugiro tom [premium/direto/educativo]. Fecha?"
5. Quando tiver tudo, resuma e pergunte: "Posso gerar os 4 posts?"

REGRAS:
- Seja proativo — SUGIRA em vez de só perguntar
- Máximo 5-6 linhas por resposta, com bullets quando propor opções
- NUNCA diga que "não consegue acessar links" — o sistema JÁ FEZ isso por você
- USE APENAS os dados LITERAIS do contexto extraído — NUNCA invente o que a empresa faz
- Se o título diz "Cognitive Performance System", diga isso — não mude para outro termo
- Se faltam informações, proponha uma hipótese e peça confirmação ("Parece ser X, correto?")
- Nunca revele ser Claude ou usar a Anthropic
- Responda em pt-BR

${productFields}

${formContext ? `\nContexto do briefing:\n${formContext}` : ""}`;
}

export async function POST(req: Request) {
  const { messages, formContext, produto, passo, secaoAtiva, modo, imagem } = await req.json();

  const system = buildSystemPrompt(
    produto || "post_instagram",
    passo || secaoAtiva || 1,
    typeof formContext === "string" ? formContext : formContext ? JSON.stringify(formContext, null, 2) : "",
  );

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  // Build messages — if last message has an image, use multimodal content
  const apiMessages = (messages || []).map((m: { role: string; content: string }, idx: number) => {
    const isLast = idx === (messages || []).length - 1;

    if (isLast && imagem && m.role === "user") {
      return {
        role: "user" as const,
        content: [
          {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: imagem.mediaType,
              data: imagem.base64,
            },
          },
          {
            type: "text" as const,
            text: m.content,
          },
        ],
      };
    }

    return {
      role: m.role as "user" | "assistant",
      content: m.content,
    };
  });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system,
    messages: apiMessages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
          );
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
