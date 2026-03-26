import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ProductId } from '@/lib/products'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const SYSTEM_PROMPTS: Record<ProductId, string> = {
  landing_page_copy: `Você é RORDENS, o motor de execução da Voku. Escreva uma landing page copy completa e de alta conversão.

Estrutura obrigatória:
1. HEADLINE PRINCIPAL
2. SUBHEADLINE
3. SEÇÃO DE DOR (3 pontos)
4. PROPOSTA DE VALOR ÚNICA
5. BENEFÍCIOS (3 blocos: título + 2 linhas)
6. PROVA SOCIAL (estrutura para preenchimento)
7. GARANTIA
8. CTA PRINCIPAL + CTA SECUNDÁRIO

Tom: direto, sem floreios, orientado a conversão. Idioma do briefing.`,

  content_pack: `Você é RORDENS, o motor de execução da Voku. Crie 12 posts completos para redes sociais.

Para cada post:
- Número (Post 1–12)
- FORMATO: Carrossel / Reels / Estático
- GANCHO: primeira linha que para o scroll
- DESENVOLVIMENTO: corpo (3-5 linhas)
- CTA: chamada clara
- HASHTAGS: 5-8 relevantes
- SUGESTÃO VISUAL: descrição breve

Mix: 5 carrosséis, 4 estáticos, 3 reels. Tom e idioma do briefing.`,

  email_sequence: `Você é RORDENS, o motor de execução da Voku. Escreva uma sequência de 5 e-mails de nutrição.

Estrutura:
- E-MAIL 1 (Dia 0): Boas-vindas + promessa
- E-MAIL 2 (Dia 2): O problema em profundidade
- E-MAIL 3 (Dia 4): A solução revelada
- E-MAIL 4 (Dia 6): Prova social + objeções
- E-MAIL 5 (Dia 8): Oferta + urgência

Para cada e-mail: ASSUNTO, PRÉ-HEADER, CORPO completo, CTA. Tom e idioma do briefing.`,

  post_instagram: `Você é RORDENS, o motor de execução da Voku. Crie 3 variações de post para Instagram.

FORMATO OBRIGATÓRIO para cada variação:
**VARIAÇÃO [A/B/C] — Tom [Direto/Inspiracional/Educativo]**
LEGENDA:
[texto completo da legenda, máximo 2200 caracteres]
HASHTAGS:
[20-30 hashtags relevantes separadas por espaço]
CALL TO ACTION:
[CTA final da legenda]

REGRAS:
- Variação A: tom direto e objetivo, foco no resultado
- Variação B: tom inspiracional, foco na transformação
- Variação C: tom educativo, foco no aprendizado
- Cada legenda deve ter hook forte na primeira linha
- Use quebras de linha estratégicas para leitura mobile`,

  carrossel: `Você é RORDENS, o motor de execução da Voku. Crie 3 variações de carrossel para Instagram.

FORMATO OBRIGATÓRIO para cada variação:
**VARIAÇÃO [A/B/C] — Ângulo [Nome do ângulo]**
CAPA:
Título: [headline impactante]
Subtítulo: [complemento em até 10 palavras]

SLIDE 1: [tema]
Headline: [frase curta e impactante]
Texto: [2 linhas explicando o ponto]

SLIDE 2: [tema]
Headline: [frase curta e impactante]
Texto: [2 linhas explicando o ponto]

SLIDE 3: [tema]
Headline: [frase curta e impactante]
Texto: [2 linhas explicando o ponto]

SLIDE 4: [tema]
Headline: [frase curta e impactante]
Texto: [2 linhas explicando o ponto]

SLIDE 5: [tema]
Headline: [frase curta e impactante]
Texto: [2 linhas explicando o ponto]

CTA FINAL:
[chamada para ação do último slide]

REGRAS:
- 5 slides de conteúdo + capa + CTA final = 7 slides no total
- Cada variação deve ter ângulo diferente (problema, solução, resultados)
- Headlines curtas — máximo 6 palavras`,

  reels_script: `Você é RORDENS, o motor de execução da Voku. Crie 3 roteiros de Reels.

FORMATO OBRIGATÓRIO para cada variação:
**VARIAÇÃO [A/B/C] — Duração: [30s/60s/90s]**

HOOK (0-3s):
[frase de abertura que para o scroll — máximo 10 palavras]
[indicação visual: o que mostrar na tela]

DESENVOLVIMENTO:
[segundo a segundo, com indicações de corte]
[ex: 0:03-0:15 — Explique X mostrando Y]
[ex: 0:15-0:25 — Mostre resultado Z com legenda "texto"]

CTA (últimos 5s):
[chamada para ação falada]
[texto na tela]
[indicação de CTA no sticker/link]

LEGENDA DO POST:
[legenda para acompanhar o Reels]

REGRAS:
- Variação A: 30 segundos — direto ao ponto
- Variação B: 60 segundos — com desenvolvimento
- Variação C: 90 segundos — storytelling completo
- Sempre incluir indicações de corte e elementos visuais`,

  ad_copy: `Você é RORDENS, o motor de execução da Voku. Crie 3 variações de copy para Meta Ads.

FORMATO OBRIGATÓRIO para cada variação:
**VARIAÇÃO [A/B/C] — Ângulo [Nome do ângulo]**

HEADLINE PRIMÁRIO:
[até 40 caracteres — aparece em destaque]

HEADLINE SECUNDÁRIO:
[até 40 caracteres — variação do primário]

HEADLINE TERCIÁRIO:
[até 40 caracteres — terceira opção]

TEXTO PRIMÁRIO:
[corpo do anúncio, até 125 caracteres ideais, máximo 500]

DESCRIÇÃO:
[até 30 caracteres — aparece abaixo do criativo]

CALL TO ACTION:
[botão: Saiba Mais / Comprar Agora / Cadastre-se / etc]

ÂNGULO:
- Variação A: dor — foca no problema que o produto resolve
- Variação B: benefício — foca na transformação positiva
- Variação C: prova social — foca em resultados e credibilidade

REGRAS:
- Respeitar limites de caracteres do Meta rigorosamente
- Headline deve parar o scroll em 2 segundos
- Texto primário deve qualificar e converter`,

  app: `Você é RORDENS, o motor de execução da Voku. Gere a especificação completa de um app web simples focado em marketing.

FORMATO OBRIGATÓRIO — retorne 3 variações:
**VARIAÇÃO A — [tipo: calculadora/quiz/formulario/gerador/captura]**
TÍTULO: [nome do app]
TIPO: [tipo técnico]
DESCRIÇÃO: [o que o app faz em 2-3 frases]
FUNCIONALIDADES:
- [funcionalidade 1]
- [funcionalidade 2]
- [funcionalidade 3]
CTA_PRINCIPAL: [ação principal do botão]
COR_DESTAQUE: [cor hex sugerida para o negócio]

VARIAÇÃO B — [tipo diferente]
[mesma estrutura]

VARIAÇÃO C — [tipo diferente]
[mesma estrutura]`,
}

const CREDIT_COST: Record<string, number> = {
  landing_page_copy: 40,
  content_pack: 25,
  email_sequence: 25,
  post_instagram: 8,
  carrossel: 15,
  reels_script: 10,
  ad_copy: 10,
  app: 20,
}

const TONE_INSTRUCTIONS = [
  { label: 'Option A — Direct & bold tone', instruction: 'Use a direct, bold, no-nonsense tone. Short sentences. Strong verbs. Go straight to the point.' },
  { label: 'Option B — Consultive & empathetic tone', instruction: 'Use a consultive, empathetic tone. Show understanding of the reader\'s pain. Guide them step by step.' },
  { label: 'Option C — Creative & provocative tone', instruction: 'Use a creative, provocative tone. Challenge assumptions. Use unexpected angles and compelling hooks.' },
]

const PRODUCT_NAMES: Record<ProductId, string> = {
  landing_page_copy: 'Landing Page Copy',
  content_pack: 'Content Pack',
  email_sequence: 'Email Sequence',
  post_instagram: 'Post para Instagram',
  carrossel: 'Carrossel para Instagram',
  reels_script: 'Roteiro de Reels',
  ad_copy: 'Copy para Meta Ads',
  app: 'App Web',
}

export async function POST(req: NextRequest) {
  let order_id: string | undefined
  let supabase: ReturnType<typeof supabaseAdmin> | undefined

  try {
    const body = await req.json()
    order_id = body.order_id
    const { user_id, email, name, product, structured_data, currency } = body
    supabase = supabaseAdmin()

    console.log(`[execute-product] Starting order=${order_id} product=${product}`)

    // ── 1. Credit check FIRST (before any expensive operations) ──
    const cost = CREDIT_COST[product] || 0
    if (cost > 0) {
      const { data: creditRow, error: creditError } = await supabase
        .from('credits')
        .select('balance')
        .eq('user_id', user_id)
        .single()

      if (creditError || !creditRow || creditRow.balance < cost) {
        console.error(`[execute-product] Insufficient credits: order=${order_id} balance=${creditRow?.balance} cost=${cost}`)
        await supabase.from('orders').update({ status: 'failed' }).eq('id', order_id)
        return NextResponse.json({ error: 'Créditos insuficientes' }, { status: 402 })
      }
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const resend = new Resend(process.env.RESEND_API_KEY)

    const baseSystem = SYSTEM_PROMPTS[product as ProductId]
    const briefingText = JSON.stringify(structured_data, null, 2)

    // ── 2. Create project phases & steps for tracking (parallelized) ──
    const [{ data: phase1 }, { data: phase2 }] = await Promise.all([
      supabase.from('project_phases').insert({
        order_id, title: 'Produção', phase_number: 1, status: 'active', started_at: new Date().toISOString(),
      }).select('id').single(),
      supabase.from('project_phases').insert({
        order_id, title: 'Aprovação', phase_number: 2, status: 'pending',
      }).select('id').single(),
    ])

    await Promise.all([
      phase1?.id ? supabase.from('project_steps').insert([
        { order_id, phase_id: phase1.id, label: 'Gerar 3 variações de texto', step_number: 1, status: 'active' },
        { order_id, phase_id: phase1.id, label: 'Gerar imagens', step_number: 2, status: 'pending' },
      ]) : Promise.resolve(),
      phase2?.id ? supabase.from('project_steps').insert([
        { order_id, phase_id: phase2.id, label: 'Escolher variação favorita', step_number: 3, status: 'pending' },
        { order_id, phase_id: phase2.id, label: 'Aprovar entrega final', step_number: 4, status: 'pending' },
      ]) : Promise.resolve(),
    ])

    console.log(`[execute-product] Phases created, calling Anthropic API for order=${order_id}`)

    // ── 3. Generate 3 variations via Anthropic API ──
    const SIMPLE_PRODUCTS = ['post_instagram', 'ad_copy', 'reels_script']
    const maxTokens = SIMPLE_PRODUCTS.includes(product) ? 4000 : 6000
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: `${baseSystem}

IMPORTANT: You must generate EXACTLY 3 variations of the deliverable, each with a different tone.
Return your response as a JSON array with exactly 3 objects:
[
  { "label": "Option A — Direct & bold tone", "text": "...full content here..." },
  { "label": "Option B — Consultive & empathetic tone", "text": "...full content here..." },
  { "label": "Option C — Creative & provocative tone", "text": "...full content here..." }
]

Each variation must be complete and production-ready. Only output the JSON array, no other text.`,
      messages: [{
        role: 'user',
        content: `BRIEFING DO CLIENTE:\n${briefingText}\n\nGenerate 3 complete variations now.`,
      }],
    })

    const rawOutput = message.content[0].type === 'text' ? message.content[0].text : '[]'

    // Parse the 3 variations
    let variations: { label: string; text: string }[]
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = rawOutput.match(/\[[\s\S]*\]/)
      variations = JSON.parse(jsonMatch ? jsonMatch[0] : rawOutput)
    } catch {
      // Fallback: if JSON parsing fails, create 1 choice with the raw output
      variations = [{ label: 'Option A', text: rawOutput }]
    }

    // Ensure we have at least 1 and at most 3 variations
    variations = variations.slice(0, 3)

    console.log(`[execute-product] Generated ${variations.length} variations for order=${order_id}`)

    // ── 4. Save preview_text (first 300 chars of first variation) ──
    const previewText = (variations[0]?.text || '').slice(0, 300)
    await supabase.from('orders').update({ preview_text: previewText }).eq('id', order_id)

    // ── 5. Batch insert choices (single query) ──
    await supabase.from('choices').insert(
      variations.map((v, i) => ({
        order_id,
        type: product,
        label: v.label || TONE_INSTRUCTIONS[i]?.label || `Option ${i + 1}`,
        content: { text: v.text },
        is_selected: false,
        position: i,
      }))
    )

    // ── Mark "Gerar texto" step as done, activate "Gerar imagens" (parallelized) ──
    const [{ data: textStep }, { data: imageStep }] = await Promise.all([
      supabase.from('project_steps').select('id').eq('order_id', order_id).eq('step_number', 1).single(),
      supabase.from('project_steps').select('id').eq('order_id', order_id).eq('step_number', 2).single(),
    ])
    await Promise.all([
      textStep ? supabase.from('project_steps').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', textStep.id) : Promise.resolve(),
      imageStep ? supabase.from('project_steps').update({ status: 'active' }).eq('id', imageStep.id) : Promise.resolve(),
    ])

    // Insert iteration
    await supabase.from('iterations').insert({
      order_id,
      iteration_num: 1,
      status: 'pending_choices',
      choices_sent_at: new Date().toISOString(),
    })

    // Do NOT update orders.status — it stays as 'in_production'
    // Do NOT insert into deliverables — client must choose first

    // ── 6. Deduct credits (already validated at the top) ──
    if (cost > 0) {
      const { data: creditRow } = await supabase
        .from('credits')
        .select('balance')
        .eq('user_id', user_id)
        .single()

      if (creditRow) {
        await supabase
          .from('credits')
          .update({ balance: creditRow.balance - cost })
          .eq('user_id', user_id)

        await supabase.from('credit_transactions').insert({
          user_id,
          amount: -cost,
          type: 'debit',
          description: `Geração de ${PRODUCT_NAMES[product as ProductId] || product}`,
          order_id,
        })
      }
    }

    // Get order number for email
    const { data: order } = await supabase
      .from('orders').select('order_number').eq('id', order_id).single()

    // Send email: choices are ready
    const productName = PRODUCT_NAMES[product as ProductId]
    const choicesUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cliente/pedidos/${order_id}`

    // Fire image generation for visual products
    const IMAGE_PRODUCTS: Record<string, string> = {
      post_instagram: 'product-scene',
      carrossel: 'product-scene',
      content_pack: 'product-scene',
      email_sequence: 'product-scene',
      ad_copy: 'product-scene',
      reels_script: 'product-scene',
      landing_page_copy: 'atmospheric',
      app: 'screen-mockup',
    }
    const imageSlug = structured_data?.image_slug || IMAGE_PRODUCTS[product]
    if (imageSlug) {
      // Fetch inserted choices to get their IDs
      const { data: insertedChoices } = await supabase
        .from('choices')
        .select('id, position, label, content')
        .eq('order_id', order_id)
        .order('position')

      // Fetch brand context if available
      const { data: brandRow } = await supabase
        .from('brand_contexts')
        .select('nome_marca, tom, palavras_chave')
        .eq('user_id', user_id)
        .limit(1)
        .single()

      const brand = brandRow ? {
        nome_marca: brandRow.nome_marca,
        tom: brandRow.tom,
      } : {}

      if (insertedChoices?.length) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voku.one'
        // Await all image generations in parallel (within maxDuration=60s)
        await Promise.all(insertedChoices.map(choice =>
          fetch(`${appUrl}/api/generate-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id,
              choice_id: choice.id,
              choice_position: choice.position,
              choice_label: choice.label,
              choice_text: choice.content?.text || '',
              slug: imageSlug,
              brand,
              briefing_text: briefingText,
              product,
            }),
          }).catch(e => console.error('Image gen error for choice:', choice.id, e))
        ))
      }
    }

    // E-mail (non-blocking — não impede geração das choices)
    resend.emails.send({
      from: 'Voku <ola@voku.one>',
      to: email,
      subject: `✦ Your 3 ${productName} options are ready`,
      html: `
        <div style="font-family: 'Helvetica Neue', sans-serif; background: #0A0A0A; color: #F0F0EC; padding: 40px; max-width: 560px; margin: 0 auto; border-radius: 12px;">
          <div style="color: #C8F135; font-size: 20px; font-weight: bold; margin-bottom: 24px;">✦ VOKU</div>
          <h2 style="color: #FFFFFF; font-size: 18px; margin-bottom: 8px;">Your options are ready, ${name}.</h2>
          <p style="color: #888; font-size: 14px; line-height: 1.6;">We generated ${variations.length} variations of your ${productName}. Pick your favorite, add notes if needed, and approve.</p>
          <div style="margin: 24px 0;">
            <a href="${choicesUrl}" style="background: #C8F135; color: #0A0A0A; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">Choose your favorite →</a>
          </div>
          <p style="color: #555; font-size: 12px;">Order #${order?.order_number} · Don't like any of them? Reply to this email and we'll redo it. No questions asked.</p>
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1F1F1F; color: #333; font-size: 11px;">Voku LLC · Wyoming, USA · voku.one</div>
        </div>
      `,
    }).catch(e => console.error('Resend email error:', e))

    console.log(`[execute-product] Completed successfully for order=${order_id}`)
    return NextResponse.json({ success: true, order_id, choices: variations.length, preview_text: previewText })
  } catch (err) {
    console.error(`[execute-product] FAILED for order=${order_id}:`, err)
    // Mark order as failed so frontend stops polling
    if (supabase && order_id) {
      try { await supabase.from('orders').update({ status: 'failed' }).eq('id', order_id) } catch {}
    }
    return NextResponse.json({ error: 'Execution error' }, { status: 500 })
  }
}
