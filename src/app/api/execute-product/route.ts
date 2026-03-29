import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ProductId } from '@/lib/products'
import { ImageSlug } from '@/lib/image-engine/types'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
export const maxDuration = 60  // Texto + DB only — images are fire-and-forget

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

SLIDE 2-5: [mesma estrutura]

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

CTA (últimos 5s):
[chamada para ação falada]

LEGENDA DO POST:
[legenda para acompanhar o Reels]

REGRAS:
- Variação A: 30 segundos — direto ao ponto
- Variação B: 60 segundos — com desenvolvimento
- Variação C: 90 segundos — storytelling completo`,

  ad_copy: `Você é RORDENS, o motor de execução da Voku. Crie 3 variações de copy para Meta Ads.

FORMATO OBRIGATÓRIO para cada variação:
**VARIAÇÃO [A/B/C] — Ângulo [Nome do ângulo]**

HEADLINE PRIMÁRIO: [até 40 caracteres]
HEADLINE SECUNDÁRIO: [até 40 caracteres]
TEXTO PRIMÁRIO: [corpo do anúncio, até 125 caracteres ideais, máximo 500]
DESCRIÇÃO: [até 30 caracteres]
CALL TO ACTION: [botão: Saiba Mais / Comprar Agora / etc]

ÂNGULO:
- Variação A: dor — foca no problema
- Variação B: benefício — foca na transformação
- Variação C: prova social — foca em resultados`,

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
COR_DESTAQUE: [cor hex sugerida]

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
  { label: 'Option A — Direct & bold tone', instruction: '' },
  { label: 'Option B — Consultive & empathetic tone', instruction: '' },
  { label: 'Option C — Creative & provocative tone', instruction: '' },
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

/**
 * Dispara geração de imagem de forma NÃO BLOQUEANTE.
 * Usa fetch fire-and-forget — não aguarda resposta.
 * A rota /api/generate-image tem maxDuration=60 e cuida do timeout internamente.
 */
function fireImageGeneration(params: {
  order_id: string
  choice_id: string
  choice_position: number
  choice_label: string
  choice_text: string
  slug: string
  brand: Record<string, string>
  reference_image_url?: string
  briefing_text: string
  product: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Fire-and-forget: não awaita, não bloqueia
  fetch(`${baseUrl}/api/generate-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).catch(e => console.error('[fire-image] fetch error:', e))
}

export async function POST(req: NextRequest) {
  let order_id: string | undefined
  let supabase: ReturnType<typeof supabaseAdmin> | undefined

  try {
    const body = await req.json()
    order_id = body.order_id
    const { user_id, email, name, product, structured_data, reference_image_url } = body
    supabase = supabaseAdmin()

    console.log(`[execute-product] Starting order=${order_id} product=${product}`)

    // ── Landing page: early return — handled by dedicated form + generate-landing ──
    if (product === 'landing_page_copy') {
      await supabase.from('orders').update({
        status: 'briefing',
      }).eq('id', order_id);

      return NextResponse.json({
        ok: true,
        product: 'landing_page_copy',
        message: 'Landing page — aguardando formulário visual',
      });
    }

    // ── Guard: prevent duplicate execution ──
    const { data: existingChoices } = await supabase
      .from('choices').select('id').eq('order_id', order_id).limit(1)
    if (existingChoices && existingChoices.length > 0) {
      console.log(`[execute-product] SKIPPED — choices already exist for order=${order_id}`)
      return NextResponse.json({ success: true, order_id, skipped: true })
    }

    // ── 1. Credit check ──
    const cost = CREDIT_COST[product] || 0
    if (cost > 0) {
      const { data: creditRow, error: creditError } = await supabase
        .from('credits').select('balance').eq('user_id', user_id).single()

      if (creditError || !creditRow || creditRow.balance < cost) {
        await supabase.from('orders').update({ status: 'failed' }).eq('id', order_id)
        return NextResponse.json({ error: 'Créditos insuficientes' }, { status: 402 })
      }
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const resend = new Resend(process.env.RESEND_API_KEY)

    const baseSystem = SYSTEM_PROMPTS[product as ProductId]
    const briefingText = JSON.stringify(structured_data, null, 2)

    // ── 2. Advance project phases (trigger already created them on order INSERT) ──
    const now = new Date().toISOString()
    // Mark briefing phase (1) as done, research phase (2) as done, production phase (3) as active
    await Promise.all([
      supabase.from('project_phases').update({ status: 'done', completed_at: now }).eq('order_id', order_id).eq('phase_number', 1),
      supabase.from('project_phases').update({ status: 'done', completed_at: now }).eq('order_id', order_id).eq('phase_number', 2),
      supabase.from('project_phases').update({ status: 'active', started_at: now }).eq('order_id', order_id).eq('phase_number', 3),
      // Mark all briefing + research steps as done
      supabase.from('project_steps').update({ status: 'done', completed_at: now }).eq('order_id', order_id).in('step_number', [1, 2, 3, 4, 5]),
      // Mark production step 6 (primeira entrega) as active
      supabase.from('project_steps').update({ status: 'active' }).eq('order_id', order_id).eq('step_number', 6),
    ])

    // ── 3. Gerar variações via Anthropic ──
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

    let variations: { label: string; text: string }[]
    try {
      const cleaned = rawOutput.replace(/```(?:json|JSON)?\s*\n?/g, '').trim()
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON array found')
      variations = JSON.parse(jsonMatch[0])
      if (!Array.isArray(variations) || variations.length === 0) throw new Error('Empty array')
    } catch (parseErr) {
      console.error(`[execute-product] JSON parse failed:`, (parseErr as Error).message)
      variations = [{ label: 'Option A', text: rawOutput }]
    }

    variations = variations.slice(0, 3)

    // ── 4. Salvar preview + choices ──
    const previewText = (variations[0]?.text || '').slice(0, 300)
    await supabase.from('orders').update({ preview_text: previewText }).eq('id', order_id)

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

    // ── Avançar steps de texto ──
    // Mark "Primeira entrega gerada" (step 6) as done, "Variações e alternativas" (step 7) as active
    await Promise.all([
      supabase.from('project_steps').update({ status: 'done', completed_at: new Date().toISOString() }).eq('order_id', order_id).eq('step_number', 6),
      supabase.from('project_steps').update({ status: 'active' }).eq('order_id', order_id).eq('step_number', 7),
    ])

    await supabase.from('iterations').insert({
      order_id,
      iteration_num: 1,
      status: 'pending_choices',
      choices_sent_at: new Date().toISOString(),
    })

    // ── 5. Deduzir créditos ──
    if (cost > 0) {
      const { data: creditRow } = await supabase.from('credits').select('balance').eq('user_id', user_id).single()
      if (creditRow) {
        await supabase.from('credits').update({ balance: creditRow.balance - cost }).eq('user_id', user_id)
        await supabase.from('credit_transactions').insert({
          user_id, amount: -cost, type: 'debit',
          description: `Geração de ${PRODUCT_NAMES[product as ProductId] || product}`,
          order_id,
        })
      }
    }

    // ── 6. Disparar imagens — FIRE AND FORGET ──
    const imageSlug = structured_data?.image_slug || IMAGE_PRODUCTS[product]
    if (imageSlug) {
      const { data: insertedChoices } = await supabase
        .from('choices').select('id, position, label, content').eq('order_id', order_id).order('position')

      const { data: brandRow } = await supabase
        .from('brand_contexts').select('nome_marca, tom').eq('user_id', user_id).limit(1).single()

      const brand: Record<string, string> = brandRow
        ? { nome_marca: brandRow.nome_marca || '', tom: brandRow.tom || '' }
        : {}

      if (insertedChoices?.length) {
        for (const choice of insertedChoices) {
          fireImageGeneration({
            order_id: order_id!,
            choice_id: choice.id,
            choice_position: choice.position,
            choice_label: choice.label || '',
            choice_text: choice.content?.text || '',
            slug: imageSlug,
            brand,
            reference_image_url: reference_image_url || undefined,
            briefing_text: briefingText,
            product,
          })
        }
        console.log(`[execute-product] Fired ${insertedChoices.length} image jobs for order=${order_id}`)
      }
    }

    // ── 7. Email (non-blocking) ──
    const { data: order } = await supabase.from('orders').select('order_number').eq('id', order_id).single()
    const productName = PRODUCT_NAMES[product as ProductId]
    const choicesUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cliente/pedidos/${order_id}`

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
          <p style="color: #555; font-size: 12px;">Order #${order?.order_number} · Don't like any of them? Reply to this email and we'll redo it.</p>
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1F1F1F; color: #333; font-size: 11px;">Voku LLC · Wyoming, USA · voku.one</div>
        </div>
      `,
    }).catch(e => console.error('Resend email error:', e))

    console.log(`[execute-product] Completed for order=${order_id}`)
    return NextResponse.json({ success: true, order_id, choices: variations.length, preview_text: previewText })

  } catch (err) {
    console.error(`[execute-product] FAILED for order=${order_id}:`, err)
    if (supabase && order_id) {
      try { await supabase.from('orders').update({ status: 'failed' }).eq('id', order_id) } catch {}
    }
    return NextResponse.json({ error: 'Execution error' }, { status: 500 })
  }
}
