import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { buildPrompt } from '@/lib/image-engine/prompts'
import { PRODUCT_DIMENSIONS, ImageSlug } from '@/lib/image-engine/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const IMAGE_SLUGS: Record<string, ImageSlug> = {
  post_instagram: 'product-scene',
  carrossel: 'product-scene',
  content_pack: 'product-scene',
  email_sequence: 'product-scene',
  ad_copy: 'product-scene',
  reels_script: 'product-scene',
  landing_page_copy: 'atmospheric',
  app: 'screen-mockup',
}

export async function POST(req: NextRequest) {
  const supabase = supabaseAdmin()

  try {
    const {
      order_id,
      choice_id,
      choice_position,
      choice_label,
      choice_text,
      slug: slugOverride,
      brand,
      briefing_text,
      product,
      reference_image_url,
    } = await req.json()

    if (!order_id || !choice_id) {
      return NextResponse.json(
        { error: 'order_id and choice_id are required' },
        { status: 400 }
      )
    }

    // Build prompt locally
    const slug: ImageSlug = slugOverride || IMAGE_SLUGS[product] || 'product-scene'
    const textForPrompt = choice_text || briefing_text || ''
    const brandCtx = brand || {}
    const prompt = buildPrompt(slug, textForPrompt, brandCtx, product)

    // Get dimensions
    const dims = PRODUCT_DIMENSIONS[product] || { width: 1080, height: 1080 }
    const storageKey = `generated/${order_id}/choice-${choice_position ?? 0}.png`

    // Call edge function with direct prompt mode
    const edgeRes = await fetch(
      `${SUPABASE_URL}/functions/v1/gerar-imagem`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          prompt,
          storage_key: storageKey,
          upload: true,
          engine: 'fal',
          width: dims.width,
          height: dims.height,
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

    // Update choice with image_url
    await supabase
      .from('choices')
      .update({ image_url: imageUrl })
      .eq('id', choice_id)

    // Check if ALL images for this order are done
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
      prompt,
    })

  } catch (err) {
    console.error('Image generation error:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
