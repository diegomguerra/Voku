import { supabaseAdmin } from '@/lib/supabase'
import { ImageResult } from './types'

const IDEOGRAM_BASE = 'https://api.ideogram.ai/v1/ideogram-v3'

// Map ASPECT_X_Y format to Ideogram v3 format (WxH)
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
  style_type?: 'DESIGN' | 'REALISTIC' | 'AUTO'
}

interface IdeogramRemixOptions extends IdeogramOptions {
  reference_image_url: string
  image_weight?: number  // 1-100, default 50
}

/**
 * Text-to-image generation using Ideogram v3
 */
export async function generateIdeogram(opts: IdeogramOptions): Promise<ImageResult> {
  const apiKey = process.env.IDEOGRAM_API_KEY
  if (!apiKey) throw new Error('IDEOGRAM_API_KEY not configured')

  const aspect = opts.aspect_ratio ? (ASPECT_MAP[opts.aspect_ratio] || '1x1') : '1x1'

  const res = await fetch(`${IDEOGRAM_BASE}/generate`, {
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
      style_type: opts.style_type || 'REALISTIC',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Ideogram generate error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const imageUrl = data.data?.[0]?.url
  if (!imageUrl) throw new Error('Ideogram returned no image URL')

  return uploadToStorage(imageUrl, opts.order_id, opts.choice_position)
}

/**
 * Image-to-image remix using Ideogram v3
 * This is the key feature — Ideogram UNDERSTANDS the reference image content
 * and generates based on both the prompt and the image context.
 */
export async function remixIdeogram(opts: IdeogramRemixOptions): Promise<ImageResult> {
  const apiKey = process.env.IDEOGRAM_API_KEY
  if (!apiKey) throw new Error('IDEOGRAM_API_KEY not configured')

  const aspect = opts.aspect_ratio ? (ASPECT_MAP[opts.aspect_ratio] || '1x1') : '1x1'

  // Download the reference image to send as binary
  const imgRes = await fetch(opts.reference_image_url)
  if (!imgRes.ok) throw new Error(`Failed to download reference image: ${imgRes.status}`)
  const imgBuffer = await imgRes.arrayBuffer()

  // Detect content type from response or default to jpeg
  const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpeg'

  // Build multipart form data
  const formData = new FormData()
  const blob = new Blob([imgBuffer], { type: contentType })
  formData.append('image', blob, `reference.${ext}`)
  formData.append('prompt', opts.prompt)
  formData.append('image_weight', String(opts.image_weight ?? 60))
  formData.append('rendering_speed', 'DEFAULT')
  formData.append('magic_prompt', 'AUTO')
  formData.append('aspect_ratio', aspect)
  if (opts.style_type) {
    formData.append('style_type', opts.style_type)
  }

  const res = await fetch(`${IDEOGRAM_BASE}/remix`, {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
    },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Ideogram remix error (${res.status}): ${err}`)
  }

  const data = await res.json()
  const imageUrl = data.data?.[0]?.url
  if (!imageUrl) throw new Error('Ideogram remix returned no image URL')

  return uploadToStorage(imageUrl, opts.order_id, opts.choice_position)
}

/**
 * Download generated image and upload to Supabase Storage
 */
async function uploadToStorage(imageUrl: string, orderId: string, position: number): Promise<ImageResult> {
  const imageRes = await fetch(imageUrl)
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer())

  // Detect format from URL or content-type
  const ct = imageRes.headers.get('content-type') || ''
  const isWebp = ct.includes('webp') || imageUrl.includes('.webp')
  const ext = isWebp ? 'webp' : 'jpg'
  const mime = isWebp ? 'image/webp' : 'image/jpeg'

  const storagePath = `generated/${orderId}/choice-${position}.${ext}`

  const supabase = supabaseAdmin()
  const { error: uploadErr } = await supabase.storage
    .from('generated-images')
    .upload(storagePath, imageBuffer, {
      contentType: mime,
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
    slug: 'product-scene',
  }
}
