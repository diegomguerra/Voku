import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PRODUCT_DIMENSIONS } from '@/lib/image-engine/types'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Technical camera signature — anchored AFTER translation, never filtered
const CAMERA_SIG = `photograph taken with a phone camera, natural available light, overcast flat lighting, visible skin pores and imperfections, crow's feet around eyes, forehead lines, nasolabial folds, uneven skin texture with dark spots and sun damage, under-eye circles, real body proportions not model-thin, worn everyday clothes, no makeup or minimal makeup, slight image noise, muted desaturated colors, no dramatic shadows, no rim light, no backlight glow, real aged skin appropriate for the person's age`

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

    // Sonnet ONLY translates — zero creative direction, zero artistic embellishment
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Translate this scene description from Portuguese to English. LITERAL translation. Do NOT add any artistic direction, mood, style, composition guidance, or photography terms. Do NOT say "documentary", "intimate", "candid", "captures", "moment". Just describe what is physically there.

"${sceneInput || context.slice(0, 500)}"

Example of what I want:
Input: "Mulher de 30 anos na cozinha fazendo café"
Output: "A 30-year-old woman in a kitchen making coffee"

That's it. Plain. Boring. Factual. 30-60 words max. Return ONLY the translation.`,
      }],
    })

    const sceneDesc = msg.content[0].type === 'text'
      ? msg.content[0].text.trim()
      : `a person in a real everyday setting`

    // Final prompt = literal scene + camera/realism signature (never passes through LLM)
    const finalPrompt = sceneDesc + `, ` + CAMERA_SIG

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
