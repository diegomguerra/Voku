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

  return `Você é Rordens, Coordenador de Prompts da Voku. Guia o usuário pelo briefing de ${productLabel[produto] || "conteúdo"}. Seja conciso (máx 3 frases por resposta). Quando o usuário responder algo que preenche um campo do formulário, confirme que anotou e sugira o próximo campo. Se o modo for "formulário", seja reativo — responda dúvidas. Nunca revele ser Claude ou usar a Anthropic. Responda em pt-BR.

${productFields}

Passo atual do formulário: ${passo}
${formContext ? `\nEstado atual do formulário:\n${formContext}` : ""}`;
}

export async function POST(req: Request) {
  const { messages, formContext, produto, passo, secaoAtiva, modo } = await req.json();

  const system = buildSystemPrompt(
    produto || "post_instagram",
    passo || secaoAtiva || 1,
    typeof formContext === "string" ? formContext : formContext ? JSON.stringify(formContext, null, 2) : "",
  );

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system,
    messages: (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
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
