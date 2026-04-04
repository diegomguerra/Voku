import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;

function buildContentPackPrompt(structured_data: any): string {
  const bc = structured_data?.brand_context || {};
  const cor1 = structured_data?.cor_primaria || bc?.cor_primaria || "a cor principal da marca";
  const cor2 = structured_data?.cor_secundaria || bc?.cor_secundaria || "branco ou cor de fundo neutra";
  const nomeMarca = structured_data?.nome_marca || bc?.nome_marca || "a marca";
  const tom = structured_data?.tom || bc?.tom || "profissional e direto";
  const publico = structured_data?.publico_detalhado || structured_data?.publico || "público-alvo da marca";
  const fonte = bc?.fonte_preferida || "Inter ou sans-serif moderna";

  const pilares = structured_data?.pilares_conteudo?.length
    ? structured_data.pilares_conteudo
    : ["Educação", "Bastidores", "Prova Social", "Conversão"];

  return `Você é RORDENS, o motor de execução da Voku. Sua tarefa é criar 12 posts completos para redes sociais com base no briefing fornecido.

## IDENTIDADE VISUAL DO CLIENTE (use em TODAS as sugestões visuais)
- Nome da marca: ${nomeMarca}
- Cor primária: ${cor1}
- Cor secundária / fundo: ${cor2}
- Fonte/estilo: ${fonte}
- Tom de voz: ${tom}
- Público: ${publico}

IMPORTANTE: As sugestões visuais devem usar SEMPRE as cores da marca acima. NUNCA use preto com verde lime a menos que essas sejam as cores da marca.

## Pilares de conteúdo da marca
${pilares.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}

## Estrutura obrigatória para cada post

Post [N] — [FORMATO]
[PILAR: nome do pilar]
---
GANCHO: [primeira linha que para o scroll, max 10 palavras]
DESENVOLVIMENTO:
[corpo do post, 3–5 linhas no tom correto]
CTA: [chamada para ação direta]
HASHTAGS: use EXATAMENTE 9 hashtags por post com o seguinte mix:
- 2 grandes (100k+ posts): alcance amplo
- 4 médias (10k–100k posts): equilíbrio alcance/nicho
- 3 pequenas/nicho (<10k posts): alta relevância, baixa concorrência
Varie as hashtags entre os posts — nunca repita o mesmo conjunto.
SUGESTÃO VISUAL:
- Fundo: [cor hex ou descrição usando ${cor2}]
- Texto destaque: [cor hex usando ${cor1}]
- Elemento visual: [descrição do que aparece na imagem]
- Estilo: [foto realista / ilustração / tipografia / gradiente]
---

Se for CARROSSEL, liste os slides:
Slide 1 — CAPA: [título]
Slide 2: [conteúdo]
...e assim por diante

Mix obrigatório (12 posts no total):
- 4 Carrosséis
- 3 Posts Estáticos
- 3 Reels
- 2 Stories

Distribua os 12 posts PROPORCIONALMENTE entre os pilares acima.
Se há ${pilares.length} pilares, cada pilar recebe ~${Math.floor(12 / pilares.length)} posts.
Indique o pilar no início de cada post: [PILAR: nome]

Escreva no idioma e tom indicado no briefing.
NUNCA mencione Voku, Claude ou Anthropic no conteúdo gerado.`;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  landing_page_copy: `Você é RORDENS, o motor de execução da Voku. Sua tarefa é escrever uma landing page copy completa e de alta conversão com base no briefing fornecido.

Estrutura obrigatória:
1. HEADLINE PRINCIPAL (impactante, orientação a resultado)
2. SUBHEADLINE (complementa a headline, detalha o beneficio)
3. SEÇÃO DE DOR (3 pontos de dor do cliente ideal)
4. PROPOSTA DE VALOR Única (o que só esse produto/serviço oferece)
5. BENEFÍCIOS (3 blocos: título + descrição de 2 linhas cada)
6. PROVA SOCIAL (estrutura para o cliente preencher: [Nome], [Cargo/Contexto]: "[Depoimento]")
7. GARANTIA (clara e direta)
8. CTA PRINCIPAL + CTA SECUNDÁRIO

Escreva em português a menos que o briefing indique outro idioma. Tom: direto, sem floreios, orientado a conversão.`,

  email_sequence: `Você é RORDENS, o motor de execução da Voku. Sua tarefa é escrever uma sequência de 5 e-mails de nutrição completa com base no briefing fornecido.

Estrutura da sequência:
- E-MAIL 1 (Dia 0): Boas-vindas + promessa
- E-MAIL 2 (Dia 2): O problema em profundidade
- E-MAIL 3 (Dia 4): A solução revelada
- E-MAIL 4 (Dia 6): Prova social + quebra de objeções
- E-MAIL 5 (Dia 8): Oferta + urgência

Para cada e-mail:
- ASSUNTO: (até 60 caracteres, curiosidade ou benefício)
- PRÉ-HEADER: (até 90 caracteres, complementa o assunto)
- CORPO: (completo, pronto para copiar e colar)
- CTA: (botão ou link claro)

Escreva no idioma e tom indicado no briefing.`
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { order_id, user_id, email, name, product, structured_data, currency } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const systemPrompt = product === "content_pack"
      ? buildContentPackPrompt(structured_data)
      : SYSTEM_PROMPTS[product];

    const userPrompt = `BRIEFING DO CLIENTE:\n${JSON.stringify(structured_data, null, 2)}\n\nGere o produto completo agora.`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const anthropicData = await anthropicRes.json();
    const outputText = anthropicData.content?.[0]?.text || "";

    const fileName = `${product}_${order_id}.txt`;
    const filePath = `${user_id}/${fileName}`;

    const { error: storageError } = await supabase.storage
      .from("deliverables")
      .upload(filePath, new Blob([outputText], { type: "text/plain" }), { upsert: true });

    if (storageError) console.error("Storage error:", storageError);

    await supabase.from("deliverables").insert({
      order_id,
      user_id,
      file_name: fileName,
      file_path: filePath,
      file_type: "docx",
      storage_bucket: "deliverables",
    });

    await supabase.from("orders")
      .update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("id", order_id);

    const { data: order } = await supabase.from("orders").select("order_number").eq("id", order_id).single();

    const downloadUrl = `https://voku.one/cliente/pedidos/${order_id}`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: "Voku <ola@voku.one>",
        to: email,
        subject: `✅ Pronto! Seu ${product === 'landing_page_copy' ? 'Landing Page Copy' : product === 'content_pack' ? 'Pacote de Posts' : 'Sequência de E-mails'} foi entregue`,
        html: `
          <div style="font-family: monospace; background: #0A0A0A; color: #F0F0EC; padding: 40px; max-width: 560px; margin: 0 auto; border-radius: 12px;">
            <div style="color: #E9F59E; font-size: 20px; font-weight: bold; margin-bottom: 24px;">✦ VOKU</div>
            <h2 style="color: #4ADE80; font-size: 18px; margin-bottom: 8px;">✅ Entregue, ${name}.</h2>
            <p style="color: #888; font-size: 14px; line-height: 1.6;">Seu arquivo está pronto. Acesse sua área do cliente para fazer o download.</p>
            <div style="margin: 24px 0;">
              <a href="${downloadUrl}" style="background: #E9F59E; color: #0A0A0A; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">↓ Acessar e fazer download</a>
            </div>
            <p style="color: #555; font-size: 12px;">Pedido #${order?.order_number} · Não gostou? Respondemos este e-mail e refazemos. Sem discussão.</p>
            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1F1F1F; color: #333; font-size: 11px;">Voku LLC · Wyoming, USA · voku.one</div>
          </div>
        `,
      }),
    });

    return new Response(
      JSON.stringify({ success: true, file_path: filePath }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Erro na execução" }), { status: 500 });
  }
});
