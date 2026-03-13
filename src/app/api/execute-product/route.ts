import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ProductId } from '@/lib/products'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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
}

export async function POST(req: NextRequest) {
  try {
    const { order_id, user_id, email, name, product, structured_data, currency } = await req.json()
    const supabase = supabaseAdmin()
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const resend = new Resend(process.env.RESEND_API_KEY)

    const baseSystem = SYSTEM_PROMPTS[product as ProductId]
    const briefingText = JSON.stringify(structured_data, null, 2)

    // Generate 3 variations in a single API call
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
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

    // Insert choices
    for (let i = 0; i < variations.length; i++) {
      await supabase.from('choices').insert({
        order_id,
        type: product,
        label: variations[i].label || TONE_INSTRUCTIONS[i]?.label || `Option ${i + 1}`,
        content: { text: variations[i].text },
        is_selected: false,
        position: i,
      })
    }

    // Insert iteration
    await supabase.from('iterations').insert({
      order_id,
      iteration_num: 1,
      status: 'pending_choices',
      choices_sent_at: new Date().toISOString(),
    })

    // Do NOT update orders.status — it stays as 'in_production'
    // Do NOT insert into deliverables — client must choose first

    // Get order number for email
    const { data: order } = await supabase
      .from('orders').select('order_number').eq('id', order_id).single()

    // Send email: choices are ready
    const productName = PRODUCT_NAMES[product as ProductId]
    const choicesUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cliente/pedidos/${order_id}`

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

    return NextResponse.json({ success: true, choices: variations.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Execution error' }, { status: 500 })
  }
}
