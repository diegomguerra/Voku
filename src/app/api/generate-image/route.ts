import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/image-engine/router'
import { ImageSlug } from '@/lib/image-engine/types'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60  // 60s por imagem — suficiente para Ideogram + upload

export async function POST(req: NextRequest) {
  const supabase = supabaseAdmin()

  try {
    const {
      order_id,
      choice_id,
      choice_position,
      choice_label,
      choice_text,
      slug,
      brand,
      reference_image_url,
      briefing_text,
      product,
    } = await req.json()

    if (!order_id || !choice_id || !slug || !choice_text) {
      return NextResponse.json(
        { error: 'order_id, choice_id, slug, and choice_text are required' },
        { status: 400 }
      )
    }

    const result = await generateImage({
      slug: slug as ImageSlug,
      product,
      briefing_text: briefing_text || '',
      choice_label: choice_label || '',
      choice_text,
      brand: brand || {},
      reference_image_url,
      order_id,
      choice_id,
      choice_position: choice_position ?? 0,
    })

    // ── Verificar se TODAS as imagens do pedido já foram geradas ──
    // Se sim, avançar as fases do projeto automaticamente
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

    return NextResponse.json({ ok: true, ...result })

  } catch (err) {
    console.error('Image generation error:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
