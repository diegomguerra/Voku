import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PRODUCT_DIMENSIONS } from '@/lib/image-engine/types'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Technical camera signature — anchored AFTER Sonnet, never filtered
const CAMERA_SIG = `shot on Sony A7III with 50mm f/1.8 lens, natural lens distortion, subtle chromatic aberration on edges, visible skin pores and texture, slight uneven skin tone, faint expression lines, real hair with flyaways, film grain, natural available light only, no flash, no reflectors`

export async function POST(req: NextRequest) {
  const supabase = supabaseAdmin()

  try {
    const {
      order_id,
      choice_id,
      choice_position,
      choice_text,
      choice_label,
      briefing_text,
      product,
      brand,
      visao_imagem,
    } = await req.json()

    if (!order_id || !choice_id) {
      return NextResponse.json(
        { error: 'order_id and choice_id are required' },
        { status: 400 }
      )
    }

    const isReels = product === 'reels_script'
    const isSocial = ['post_instagram', 'carrossel', 'content_pack', 'ad_copy'].includes(product)
    const dims = isReels
      ? { width: 1080, height: 1920 }
      : isSocial
        ? { width: 1080, height: 1350 }
        : PRODUCT_DIMENSIONS[product] || { width: 1080, height: 1350 }

    const storageKey = `generated/${order_id}/choice-${choice_position ?? 0}.png`

    const context = briefing_text || choice_text || ''
    const brandName = brand?.nome_marca || ''
    const brandTom = brand?.tom || ''
    const sceneInput = visao_imagem || ''

    // Sonnet builds the scene — it understands nuance better than Haiku
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 250,
      messages: [{
        role: 'user',
        content: `You are a documentary photographer directing a shoot. Write an image generation prompt in English for this scene.

SCENE THE CLIENT DESCRIBED: "${sceneInput || context.slice(0, 500)}"
${brandName ? `BRAND CONTEXT: ${brandName}${brandTom ? ` (${brandTom})` : ''}` : ''}

YOUR STYLE: You shoot like a seasoned photojournalist — real moments, real people, real light. Think Steve McCurry meets everyday life. Your photos feel intimate and authentic. People in your photos look like they exist — with skin texture, messy hair, wrinkled clothes, natural posture.

RULES:
- Describe the EXACT scene: who, what they wear, what they hold, where they are, time of day, weather
- Lighting must be NATURAL and AVAILABLE — overcast daylight, window light, open shade. Never studio.
- Include at least 2 physical imperfections: uneven skin, flyaway hair, wrinkled fabric, chipped nail polish, faded clothes
- The person should NOT be posing — they are caught in a real moment
- NO text, words, or letters visible in the image
- 80-120 words. Return ONLY the prompt text.

NEVER USE these words: cinematic, stunning, beautiful, elegant, glamorous, perfect, flawless, masterpiece, award-winning, hyper-realistic, ultra-detailed, 4k, 8k, HDR, bokeh, dreamy, ethereal, magical`,
      }],
    })

    const sceneDesc = msg.content[0].type === 'text'
      ? msg.content[0].text.trim()
      : `Person in a candid moment, natural light, real environment`

    // Final prompt = Sonnet scene + camera signature (never passes through any LLM)
    const finalPrompt = sceneDesc + `. ` + CAMERA_SIG

    // Call edge function — uses flux-realism for human photos
    const edgeRes = await fetch(
      `${SUPABASE_URL}/functions/v1/gerar-imagem`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          storage_key: storageKey,
          upload: true,
          engine: 'fal',
          model: 'flux-realism',
          width: dims.width,
          height: dims.height,
          num_inference_steps: 32,
          guidance_scale: 3.5,
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

    await supabase
      .from('choices')
      .update({ image_url: imageUrl })
      .eq('id', choice_id)

    const { data: allChoices } = await supabase
      .from('choices')
      .select('id, image_url')
      .eq('order_id', order_id)

    if (allChoices?.every(c => c.image_url)) {
      console.log(`[generate-image] All images done for order=${order_id}`)
      const now = new Date().toISOString()
      await Promise.all([
        supabase.from('project_steps').update({ status: 'done', completed_at: now }).eq('order_id', order_id).eq('step_number', 7),
        supabase.from('project_steps').update({ status: 'done', completed_at: now }).eq('order_id', order_id).eq('step_number', 8),
        supabase.from('project_phases').update({ status: 'done', completed_at: now }).eq('order_id', order_id).eq('phase_number', 3),
        supabase.from('project_phases').update({ status: 'active', started_at: now }).eq('order_id', order_id).eq('phase_number', 4),
        supabase.from('project_steps').update({ status: 'active' }).eq('order_id', order_id).eq('step_number', 9),
      ])
    }

    return NextResponse.json({
      ok: true,
      url: imageUrl,
      engine: edgeData.engine,
      storage_path: edgeData.path,
      prompt: edgeData.prompt,
    })

  } catch (err) {
    console.error('Image generation error:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
