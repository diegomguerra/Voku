import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PRODUCTS, ProductId } from '@/lib/products'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { user_id: rawUserId, email, name, product, conversation, structured_data, currency = 'USD' } = await req.json()

    if (!email || !product || !structured_data) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const supabase = supabaseAdmin()

    // Resolve user_id: use provided, or look up by email, or create
    let user_id = rawUserId
    if (!user_id) {
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .limit(1)
      if (existingUsers && existingUsers.length > 0) {
        user_id = existingUsers[0].id
      } else {
        // Look up in auth.users via admin API
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const match = users?.find((u: any) => u.email === email)
        if (match) {
          user_id = match.id
        }
      }
    }

    if (!user_id) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 400 })
    }

    const productInfo = PRODUCTS[product as ProductId]
    if (!productInfo) {
      return NextResponse.json({ error: 'Produto inválido' }, { status: 400 })
    }

    const deadline = new Date()
    deadline.setHours(deadline.getHours() + productInfo.deadline_hours)

    // Criar pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id,
        product,
        status: 'in_production',
        currency,
        amount: currency === 'USD' ? productInfo.usd : productInfo.brl,
        platform: 'voku',
        delivery_deadline: deadline.toISOString(),
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Salvar briefing
    await supabase.from('briefings').insert({
      order_id: order.id,
      user_id,
      product,
      raw_conversation: conversation,
      structured_data,
      confirmed_at: new Date().toISOString(),
    })

    // Disparar execução em background (não bloqueia resposta)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/execute-product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order.id, user_id, email, name, product, structured_data, currency }),
    }).catch(console.error)

    // E-mail de confirmação (non-blocking)
    const deadlineFormatted = deadline.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'short',
    })

    const resend = new Resend(process.env.RESEND_API_KEY)
    resend.emails.send({
      from: 'Voku <ola@voku.one>',
      to: email,
      subject: `✦ Pedido #${order.order_number} recebido — ${productInfo.name}`,
      html: `
        <div style="font-family: monospace; background: #0A0A0A; color: #F0F0EC; padding: 40px; max-width: 560px; margin: 0 auto; border-radius: 12px;">
          <div style="color: #E9F59E; font-size: 20px; font-weight: bold; margin-bottom: 24px;">✦ VOKU</div>
          <h2 style="color: #F0F0EC; font-size: 18px; margin-bottom: 8px;">Pedido recebido, ${name}.</h2>
          <p style="color: #888; font-size: 14px; line-height: 1.6;">Seu briefing foi confirmado e já estamos trabalhando no seu projeto.</p>
          <div style="background: #161616; border: 1px solid #222; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <div style="margin-bottom: 12px;"><span style="color: #555; font-size: 11px;">PEDIDO</span><br><span style="color: #E9F59E; font-weight: bold;">#${order.order_number}</span></div>
            <div style="margin-bottom: 12px;"><span style="color: #555; font-size: 11px;">PRODUTO</span><br><span style="color: #F0F0EC;">${productInfo.name}</span></div>
            <div style="margin-bottom: 12px;"><span style="color: #555; font-size: 11px;">ENTREGA ATÉ</span><br><span style="color: #4ADE80; font-weight: bold;">${deadlineFormatted}</span></div>
            <div><span style="color: #555; font-size: 11px;">VALOR</span><br><span style="color: #F0F0EC;">${currency} ${currency === 'USD' ? productInfo.usd : productInfo.brl}</span></div>
          </div>
          <p style="color: #555; font-size: 12px;">Você receberá outro e-mail assim que o arquivo estiver pronto.</p>
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1F1F1F; color: #333; font-size: 11px;">Voku LLC · Wyoming, USA · voku.one</div>
        </div>
      `,
    }).catch(e => console.error('Resend email error:', e))

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      deadline: deadline.toISOString(),
    })
  } catch (err: any) {
    console.error('submit-briefing error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
