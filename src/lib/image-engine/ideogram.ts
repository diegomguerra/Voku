import { supabaseAdmin } from '@/lib/supabase'
import { ImageResult } from './types'

const IDEOGRAM_URL = 'https://api.ideogram.ai/generate'

interface IdeogramOptions {
  prompt: string
  order_id: string
  choice_position: number
  aspect_ratio?: string
}

export async function generateIdeogram(opts: IdeogramOptions): Promise<ImageResult> {
  const apiKey = process.env.IDEOGRAM_API_KEY
  if (!apiKey) throw new Error('IDEOGRAM_API_KEY not configured')

  const res = await fetch(IDEOGRAM_URL, {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_request: {
        prompt: opts.prompt,
        model: 'V_3',
        magic_prompt_option: 'AUTO',
        aspect_ratio: opts.aspect_ratio || 'ASPECT_1_1',
        style_type: 'DESIGN',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Ideogram API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const imageUrl = data.data?.[0]?.url
  if (!imageUrl) throw new Error('Ideogram returned no image URL')

  // Download and upload to Supabase Storage
  const imageRes = await fetch(imageUrl)
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer())
  const storagePath = `generated/${opts.order_id}/choice-${opts.choice_position}.webp`

  const supabase = supabaseAdmin()
  const { error: uploadErr } = await supabase.storage
    .from('generated-images')
    .upload(storagePath, imageBuffer, {
      contentType: 'image/webp',
      upsert: true,
    })

  if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

  const { data: urlData } = supabase.storage
    .from('generated-images')
    .getPublicUrl(storagePath)

  return {
    url: urlData.publicUrl,
    storage_path: storagePath,
    engine: 'ideogram',
    slug: 'type-first',
  }
}
