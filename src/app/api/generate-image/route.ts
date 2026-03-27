import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PRODUCT_DIMENSIONS } from '@/lib/image-engine/types'
import Anthropic from '@anthropic-ai/sdk'

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
      choice_label,
      choice_text,
      brand,
      briefing_text,
      product,
    } = await req.json()

    if (!order_id || !choice_id) {
      return NextResponse.json(
        { error: 'order_id and choice_id are required' },
        { status: 400 }
      )
    }

    // Build image prompt with Claude Haiku from the original briefing
    const brandName = brand?.nome_marca || ''
    const brandTom = brand?.tom || ''
    const context = briefing_text || choice_text || ''

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Create an English image generation prompt for this project.
Product type: ${product || 'social media post'}
Brand: ${brandName}${brandTom ? `, tone: ${brandTom}` : ''}
Choice label: ${choice_label || ''}
Briefing/context: ${context}

Describe the exact scenario, lighting, colors, composition, and mood.
Cinematic photography style. NO text/words/letters in the image.
End with: high quality, professional, sharp focus, 4k.
100-180 words. Return ONLY the prompt, nothing else.`,
      }],
    })

    const prompt = msg.content[0].type === 'text'
      ? msg.content[0].text.trim()
      : `Professional photo related to ${context.slice(0, 100)}, high quality, 4k`

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
