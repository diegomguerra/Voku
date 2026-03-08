import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ProductId } from '@/lib/products'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

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

const PRODUCT_NAMES: Record<ProductId, string> = {
  landing_page_copy: 'Landing Page Copy',
  content_pack: 'Pacote de Conteúdo para Redes',
  email_sequence: 'Sequência de E-mails de Nutrição',
}

export async function POST(req: NextRequest) {
  try {
    const { order_id, user_id, email, name, product, structured_data, currency } = await req.json()
    const supabase = supabaseAdmin()
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Executar com Anthropic
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SYSTEM_PROMPTS[product as ProductId],
      messages: [{
        role: 'user',
        content: `BRIEFING DO CLIENTE:\n${JSON.stringify(structured_data, null, 2)}\n\nGere o produto completo agora.`,
      }],
    })

    const outputText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Salvar no Supabase Storage
    const fileName = `${product}_${order_id}.txt`
    const filePath = `${user_id}/${fileName}`

    const { error: storageError } = await supabase.storage
      .from('deliverables')
      .upload(filePath, new Blob([outputText], { type: 'text/plain' }), { upsert: true })

    if (storageError) console.error('Storage:', storageError)

    // Salvar deliverable no banco
    await supabase.from('deliverables').insert({
      order_id,
      user_id,
      file_name: fileName,
      file_path: filePath,
      file_type: 'docx',
      storage_bucket: 'deliverables',
    })

    // Atualizar pedido para entregue
    await supabase.from('orders')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', order_id)

    const { data: order } = await supabase
      .from('orders').select('order_number').eq('id', order_id).single()

    // E-mail de entrega
    const productName = PRODUCT_NAMES[product as ProductId]
    const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cliente/pedidos/${order_id}`

    await resend.emails.send({
      from: 'Voku <ola@voku.one>',
      to: email,
      subject: `✅ Pronto! Seu ${productName} foi entregue`,
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
    })

    return NextResponse.json({ success: true, file_path: filePath })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro na execução' }, { status: 500 })
  }
}
