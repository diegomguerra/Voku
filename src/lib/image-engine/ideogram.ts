import { supabaseAdmin } from '@/lib/supabase'
import { ImageResult } from './types'

const IDEOGRAM_V3_URL = 'https://api.ideogram.ai/v1/ideogram-v3/generate'

// Map legacy ASPECT_X_Y format to v3 format (WxH)
const ASPECT_MAP: Record<string, string> = {
  ASPECT_1_1: '1x1',
  ASPECT_2_1: '2x1',
  ASPECT_9_16: '9x16',
  ASPECT_16_9: '16x9',
  ASPECT_2_3: '2x3',
  ASPECT_3_2: '3x2',
  ASPECT_4_3: '4x3',
  ASPECT_3_4: '3x4',
}

interface IdeogramOptions {
  prompt: string
  order_id: string
  choice_position: number
  aspect_ratio?: string
}

export async function generateIdeogram(opts: IdeogramOptions): Promise<ImageResult> {
  const apiKey = process.env.IDEOGRAM_API_KEY
  if (!apiKey) throw new Error('IDEOGRAM_API_KEY not configured')

  const aspect = opts.aspect_ratio ? (ASPECT_MAP[opts.aspect_ratio] || '1x1') : '1x1'

  const res = await fetch(IDEOGRAM_V3_URL, {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: opts.prompt,
      rendering_speed: 'DEFAULT',
      magic_prompt: 'AUTO',
      aspect_ratio: aspect,
      style_type: 'DESIGN',
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
