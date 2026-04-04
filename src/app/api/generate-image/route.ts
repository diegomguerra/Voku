import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PRODUCT_DIMENSIONS } from '@/lib/image-engine/types'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Anti-AI photography directives — always appended to every prompt
const ANTI_AI_SUFFIX = `, shot on Sony A7III 50mm f/1.8, natural lens distortion, slight focus softness on edges, visible pores, slight uneven skin tone, faint facial lines, minor blemish, hair flyaways, chromatic aberration, film grain, muted flat color palette, low contrast, photojournalism aesthetic`
const NEGATIVE_PROMPT = `aiartstation, cgi, render, perfect skin, flawless face, airbrushed, studio lighting, dramatic lighting, overexposed glow, HDR, unnatural bokeh, plastic texture, magazine retouching, neon, vivid saturation`

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

    // Use 4:5 Instagram ratio (1080x1350) for social posts, keep original for others
    const isReels = product === 'reels_script'
    const isSocial = ['post_instagram', 'carrossel', 'content_pack', 'ad_copy'].includes(product)
    const dims = isReels
      ? { width: 1080, height: 1920 }
      : isSocial
        ? { width: 1080, height: 1350 }
        : PRODUCT_DIMENSIONS[product] || { width: 1080, height: 1350 }

    const storageKey = `generated/${order_id}/choice-${choice_position ?? 0}.png`

    // Build prompt: use Haiku to translate visao_imagem/context into a scene description,
    // then append anti-AI photography directives
    const context = briefing_text || choice_text || ''
    const brandName = brand?.nome_marca || ''
    const brandTom = brand?.tom || ''
    const sceneInput = visao_imagem || ''

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are a photography director. Translate this brief into a candid photo scene description in English.

${sceneInput ? `CLIENT VISION: "${sceneInput}"` : ''}
PRODUCT TYPE: ${product || 'social media post'}
${brandName ? `BRAND: ${brandName}${brandTom ? `, tone: ${brandTom}` : ''}` : ''}
CONTEXT: ${context.slice(0, 500)}

RULES:
- Describe a REAL candid moment, not a posed studio shot
- Include: setting, person(s) appearance/ethnicity if mentioned, natural lighting, time of day
- Natural imperfections: messy hair, wrinkled clothes, real skin
- NO words like "cinematic", "4k", "professional", "sharp focus", "high quality", "stunning"
- NO text/words/letters in the image
- 60-100 words max. Return ONLY the scene description.`,
      }],
    })

    const sceneDesc = msg.content[0].type === 'text'
      ? msg.content[0].text.trim()
      : `Person in a natural setting related to ${context.slice(0, 80)}`

    // Final prompt = scene + anti-AI directives (never removed by Haiku)
    const finalPrompt = sceneDesc + ANTI_AI_SUFFIX

    // Call edge function with fully constructed prompt
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
          negative_prompt: NEGATIVE_PROMPT,
          storage_key: storageKey,
          upload: true,
          engine: 'fal',
          width: dims.width,
          height: dims.height,
          num_inference_steps: 32,
          guidance_scale: 3.2,
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
