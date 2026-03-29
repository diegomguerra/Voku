import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/* ── Style mapping ── */
const STYLE_MAP: Record<string, string> = {
  slideshow_cinematografico: 'cinematic photography, golden hour, warm tones',
  cenas_realistas: 'photorealistic, documentary style, high quality commercial',
  motion_grafico: 'clean white background, minimal, editorial typography',
  campo_natureza: 'Brazilian farm, cattle, plantation, aerial view, nature, golden hour',
}

/* ── Generate scene image using existing gerar-imagem edge function ── */
async function generateSceneImage(
  prompt: string,
  orderId: string,
  sceneNum: number,
  proporcao: string,
): Promise<string | null> {
  const isVertical = proporcao === '9:16'
  const storageKey = `generated/${orderId}/scene-${sceneNum}.png`

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/gerar-imagem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        storage_key: storageKey,
        upload: true,
        engine: 'fal',
        width: isVertical ? 1080 : 1080,
        height: isVertical ? 1920 : 1080,
      }),
    })
    const data = await res.json()
    return data.ok ? data.url : null
  } catch (e) {
    console.error(`[generate-video] Scene ${sceneNum} image failed:`, e)
    return null
  }
}

/* ── Generate video clip from image using fal.ai Kling/Minimax ── */
async function generateVideoClip(
  imageUrl: string,
  prompt: string,
  proporcao: string,
): Promise<string | null> {
  if (!FAL_KEY) return null

  // Try Kling first, then Minimax
  const models = [
    'fal-ai/kling-video/v1.5/standard/image-to-video',
    'fal-ai/minimax-video/image-to-video',
  ]

  for (const model of models) {
    try {
      // Submit to queue
      const queueRes = await fetch(`https://queue.fal.run/${model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${FAL_KEY}`,
        },
        body: JSON.stringify({
          prompt: prompt || 'smooth cinematic camera motion',
          image_url: imageUrl,
          duration: '5',
          aspect_ratio: proporcao === '9:16' ? '9:16' : '1:1',
        }),
      })

      if (!queueRes.ok) {
        console.error(`[generate-video] ${model} queue failed:`, queueRes.status)
        continue
      }

      const queue = await queueRes.json()
      const statusUrl = queue.status_url || `https://queue.fal.run/${model}/requests/${queue.request_id}/status`
      const responseUrl = queue.response_url || `https://queue.fal.run/${model}/requests/${queue.request_id}`

      // Poll for completion (max 90s)
      const deadline = Date.now() + 90_000
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 3000))
        const statusRes = await fetch(statusUrl, {
          headers: { Authorization: `Key ${FAL_KEY}` },
        })
        const status = await statusRes.json()

        if (status.status === 'COMPLETED') {
          // Fetch result
          const resultRes = await fetch(responseUrl, {
            headers: { Authorization: `Key ${FAL_KEY}` },
          })
          const result = await resultRes.json()
          const videoUrl = result.video?.url || result.data?.video_url || result.output?.video?.url
          if (videoUrl) return videoUrl
          break
        }
        if (status.status === 'FAILED') {
          console.error(`[generate-video] ${model} failed:`, status)
          break
        }
      }
    } catch (e) {
      console.error(`[generate-video] ${model} error:`, e)
    }
  }
  return null
}

/* ── Main handler ── */
export async function POST(req: NextRequest) {
  const supabase = supabaseAdmin()

  try {
    const {
      order_id,
      choice_id,
      roteiro,       // { hook, cenas: [{numero, duracao_segundos, descricao_visual, fala, movimento}], cta }
      estilo_video,  // 'slideshow_cinematografico' | 'cenas_realistas' | ...
      proporcao,     // '9:16' | '1:1'
    } = await req.json()

    if (!order_id || !roteiro?.cenas?.length) {
      return NextResponse.json({ error: 'order_id and roteiro with cenas required' }, { status: 400 })
    }

    const stylePrompt = STYLE_MAP[estilo_video] || STYLE_MAP.slideshow_cinematografico
    const ratioPrompt = proporcao === '9:16' ? 'vertical portrait 9:16' : 'square 1:1'

    // Update choice content with video_status = generating
    if (choice_id) {
      const { data: existingChoice } = await supabase.from('choices').select('content').eq('id', choice_id).single()
      const existingContent = existingChoice?.content || {}
      await supabase.from('choices').update({
        content: { ...existingContent, video_status: 'generating' },
      }).eq('id', choice_id)
    }

    const sceneImages: string[] = []
    const videoClips: string[] = []

    // 1. Generate images for each scene
    for (const cena of roteiro.cenas) {
      const prompt = `${cena.descricao_visual}, ${stylePrompt}, ${ratioPrompt}, cinematic, professional, no text, no watermark${!cena.descricao_visual?.includes('person') ? ', no people unless requested' : ''}`

      const imageUrl = await generateSceneImage(prompt, order_id, cena.numero, proporcao)
      sceneImages.push(imageUrl || '')
    }

    // 2. Try to generate video clips from images (if FAL_KEY available)
    if (FAL_KEY) {
      for (let i = 0; i < sceneImages.length; i++) {
        const img = sceneImages[i]
        if (!img) continue

        const cena = roteiro.cenas[i]
        const movePrompt = cena.movimento || 'smooth cinematic camera motion'
        const clipUrl = await generateVideoClip(img, movePrompt, proporcao)
        videoClips.push(clipUrl || '')
      }
    }

    const hasVideoClips = videoClips.some(v => v)

    // 3. Save results to Supabase Storage and update choice
    // Upload video clips to storage
    const storedClips: string[] = []
    for (let i = 0; i < videoClips.length; i++) {
      const clipUrl = videoClips[i]
      if (!clipUrl) { storedClips.push(''); continue }

      try {
        const videoRes = await fetch(clipUrl)
        const videoBlob = await videoRes.blob()
        const path = `videos/${order_id}/scene_${i + 1}.mp4`
        const { error } = await supabase.storage.from('generated-images').upload(path, videoBlob, {
          contentType: 'video/mp4', upsert: true,
        })
        if (!error) {
          const { data: urlData } = supabase.storage.from('generated-images').getPublicUrl(path)
          storedClips.push(urlData.publicUrl)
        } else {
          storedClips.push(clipUrl) // Use original URL as fallback
        }
      } catch {
        storedClips.push(clipUrl)
      }
    }

    // 4. Update the choice content with video data
    if (choice_id) {
      const { data: choice } = await supabase.from('choices').select('content').eq('id', choice_id).single()
      const content = choice?.content || {}
      const updatedContent = {
        ...content,
        scene_images: sceneImages.filter(Boolean),
        video_clips: storedClips.filter(Boolean),
        video_status: hasVideoClips ? 'ready' : 'images_only',
        roteiro,
      }
      await supabase.from('choices').update({ content: updatedContent }).eq('id', choice_id)
    }

    return NextResponse.json({
      ok: true,
      scene_images: sceneImages.filter(Boolean),
      video_clips: storedClips.filter(Boolean),
      video_status: hasVideoClips ? 'ready' : 'images_only',
    })

  } catch (err) {
    console.error('[generate-video] Error:', err)
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
