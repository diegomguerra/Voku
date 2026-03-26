import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  const supabase = supabaseAdmin()

  try {
    const {
      order_id,
      choice_id,
      choice_position,
      semana_key,
      post_id,
    } = await req.json()

    if (!order_id || !choice_id) {
      return NextResponse.json(
        { error: 'order_id and choice_id are required' },
        { status: 400 }
      )
    }

    // Chama a Edge Function gerar-imagem do Supabase (fal.ai)
    const edgeRes = await fetch(
      `${SUPABASE_URL}/functions/v1/gerar-imagem`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          semana_key: semana_key || 'default',
          post_id: post_id || order_id,
          upload: true,
          engine: 'fal',
        }),
      }
    )

    const edgeData = await edgeRes.json()

    if (!edgeRes.ok || !edgeData.ok) {
      console.error('[generate-image] Edge function error:', edgeData)
      return NextResponse.json(
        { ok: false, error: edgeData.error || 'Edge function failed', details: edgeData },
        { status: 502 }
      )
    }

    const imageUrl = edgeData.url

    // Atualiza a choice com a image_url
    await supabase
      .from('choices')
      .update({ image_url: imageUrl })
      .eq('id', choice_id)

    // Verificar se TODAS as imagens do pedido já foram geradas
    const { data: allChoices } = await supabase
      .from('choices').select('id, image_url').eq('order_id', order_id)

    if (allChoices?.every(c => c.image_url)) {
      console.log(`[generate-image] All images done for order=${order_id}, advancing phases`)
      const now = new Date().toISOString()

      const [imgStep, prodPhase, approvalPhase, chooseStep] = await Promise.all([
        supabase.from('project_steps').select('id').eq('order_id', order_id).eq('step_number', 2).single(),
        supabase.from('project_phases').select('id').eq('order_id', order_id).eq('phase_number', 1).single(),
        supabase.from('project_phases').select('id').eq('order_id', order_id).eq('phase_number', 2).single(),
        supabase.from('project_steps').select('id').eq('order_id', order_id).eq('step_number', 3).single(),
      ])

      await Promise.all([
        imgStep.data ? supabase.from('project_steps').update({ status: 'done', completed_at: now }).eq('id', imgStep.data.id) : Promise.resolve(),
        prodPhase.data ? supabase.from('project_phases').update({ status: 'done', completed_at: now }).eq('id', prodPhase.data.id) : Promise.resolve(),
        approvalPhase.data ? supabase.from('project_phases').update({ status: 'active', started_at: now }).eq('id', approvalPhase.data.id) : Promise.resolve(),
        chooseStep.data ? supabase.from('project_steps').update({ status: 'active' }).eq('id', chooseStep.data.id) : Promise.resolve(),
      ])
    }

    return NextResponse.json({
      ok: true,
      url: imageUrl,
      engine: edgeData.engine,
      storage_path: edgeData.path,
    })

  } catch (err) {
    console.error('Image generation error:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
