import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PRODUCT_DIMENSIONS } from '@/lib/image-engine/types'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Balanced realism — natural imperfections WITHOUT medical-level skin issues
const CAMERA_SIG = `shot on Sony A7III 50mm f/1.8, natural available light, overcast flat lighting, visible skin pores, subtle expression lines, slight uneven skin tone, natural hair with flyaways, film grain, muted color palette, low contrast, no dramatic lighting, no flash, no rim light, real body proportions, everyday clothes, minimal or no makeup, photojournalistic style`

export async function POST(req: NextRequest) {
  const supabase = supabaseAdmin()

  try {
    const {
      order_id,
      choice_id,
      choice_position,
      post_number,
      image_prompt: directImagePrompt,
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

    const postSuffix = post_number ? `-post-${post_number}` : ''
    const storageKey = `generated/${order_id}/choice-${choice_position ?? 0}${postSuffix}.png`

    let finalPrompt: string

    if (directImagePrompt) {
      // Structured path: image_prompt already in English from Art Director agent
      finalPrompt = directImagePrompt + `, ` + CAMERA_SIG
    } else {
      // Legacy path: translate visao_imagem from PT to EN via Haiku
      const context = briefing_text || choice_text || ''
      const sceneInput = visao_imagem || ''

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `Translate this scene to English. LITERAL, no embellishment. 30-60 words. Return ONLY the translation.\n\n"${sceneInput || context.slice(0, 400)}"`,
        }],
      })

      const sceneDesc = msg.content[0].type === 'text' ? msg.content[0].text.trim() : `a person in a real everyday setting`
      finalPrompt = sceneDesc + `, ` + CAMERA_SIG
    }

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

    if (post_number) {
      // Per-post image: store in post_images jsonb
      const { data: current } = await supabase.from('choices').select('post_images, image_url').eq('id', choice_id).single()
      const postImages = { ...(current?.post_images || {}), [String(post_number)]: imageUrl }
      await supabase.from('choices').update({
        post_images: postImages,
        image_url: current?.image_url || imageUrl, // First post image becomes the cover
      }).eq('id', choice_id)
    } else {
      // Legacy: single image per choice
      await supabase.from('choices').update({ image_url: imageUrl }).eq('id', choice_id)
    }

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
