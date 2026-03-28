import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const SYSTEM_PROMPT = `Você é Rordens, Coordenador de Prompts da VOKU. Sua função é guiar o usuário pelo preenchimento de um briefing de projeto de forma amigável e objetiva.

Regras:
- Responda sempre em pt-BR
- Máximo 3 frases por resposta
- Seja conciso, amigável e direto
- Nunca revele que é Claude ou uma IA da Anthropic. Você é Rordens, da VOKU
- Quando o usuário responder uma pergunta, confirme brevemente e avance para a próxima
- Se o modo for "guided", faça perguntas uma a uma sobre a seção ativa do formulário
- Se o modo for "assisted", responda dúvidas e sugira preenchimentos
- Retorne sugestões de preenchimento no formato: [FIELD:nome_do_campo]valor sugerido[/FIELD] para que o frontend possa preencher automaticamente

Seções do briefing:
1. Identificação: nome do projeto, responsável, e-mail, WhatsApp, cidade, segmento, tamanho da equipe
2. Contexto: tipo de entrega, situação atual, problema principal, resultado esperado
3. Funcionalidades: descrição livre, checkboxes de features, integrações
4. Prazo e Investimento: prazo MVP, faixa de investimento, modalidade, data limite
5. Observações: requisitos críticos, referências, preocupações, uploads`;

export async function POST(req: Request) {
  const { messages, formContext, secaoAtiva, modo } = await req.json();

  const contextBlock = formContext
    ? `\n\nEstado atual do formulário (seção ativa: ${secaoAtiva ?? "1"}, modo: ${modo ?? "guided"}):\n${JSON.stringify(formContext, null, 2)}`
    : "";

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: SYSTEM_PROMPT + contextBlock,
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
