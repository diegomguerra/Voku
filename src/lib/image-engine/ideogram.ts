import { supabaseAdmin } from '@/lib/supabase'
import { ImageResult } from './types'

const IDEOGRAM_BASE = 'https://api.ideogram.ai/v1/ideogram-v3'

// Timeout para cada etapa (ms)
const TIMEOUT_IDEOGRAM_API = 45_000   // 45s para a API do Ideogram gerar
const TIMEOUT_DOWNLOAD_IMG = 15_000   // 15s para baixar imagem gerada
const TIMEOUT_DOWNLOAD_REF = 20_000   // 20s para baixar imagem de referência

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
  image_weight?: number
}

/** Wrapper de fetch com timeout via AbortController */
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer))
}

/**
 * Text-to-image generation using Ideogram v3
 */
export async function generateIdeogram(opts: IdeogramOptions): Promise<ImageResult> {
  const apiKey = process.env.IDEOGRAM_API_KEY
  if (!apiKey) throw new Error('IDEOGRAM_API_KEY not configured')

  const aspect = opts.aspect_ratio ? (ASPECT_MAP[opts.aspect_ratio] || '1x1') : '1x1'

  const res = await fetchWithTimeout(
    `${IDEOGRAM_BASE}/generate`,
    {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: opts.prompt,
        rendering_speed: 'TURBO',
        magic_prompt: 'AUTO',
        aspect_ratio: aspect,
        style_type: opts.style_type || 'REALISTIC',
      }),
    },
    TIMEOUT_IDEOGRAM_API
  )

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
 */
export async function remixIdeogram(opts: IdeogramRemixOptions): Promise<ImageResult> {
  const apiKey = process.env.IDEOGRAM_API_KEY
  if (!apiKey) throw new Error('IDEOGRAM_API_KEY not configured')

  const aspect = opts.aspect_ratio ? (ASPECT_MAP[opts.aspect_ratio] || '1x1') : '1x1'

  // Download reference image com timeout
  const imgRes = await fetchWithTimeout(opts.reference_image_url, {}, TIMEOUT_DOWNLOAD_REF)
  if (!imgRes.ok) throw new Error(`Failed to download reference image: ${imgRes.status}`)
  const imgBuffer = await imgRes.arrayBuffer()

  const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpeg'

  const formData = new FormData()
  const blob = new Blob([imgBuffer], { type: contentType })
  formData.append('image', blob, `reference.${ext}`)
  formData.append('prompt', opts.prompt)
  formData.append('image_weight', String(opts.image_weight ?? 60))
  formData.append('rendering_speed', 'TURBO')
  formData.append('magic_prompt', 'AUTO')
  formData.append('aspect_ratio', aspect)
  if (opts.style_type) {
    formData.append('style_type', opts.style_type)
  }

  const res = await fetchWithTimeout(
    `${IDEOGRAM_BASE}/remix`,
    {
      method: 'POST',
      headers: { 'Api-Key': apiKey },
      body: formData,
    },
    TIMEOUT_IDEOGRAM_API
  )

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
  const imageRes = await fetchWithTimeout(imageUrl, {}, TIMEOUT_DOWNLOAD_IMG)
  if (!imageRes.ok) throw new Error(`Failed to download generated image: ${imageRes.status}`)

  const imageBuffer = Buffer.from(await imageRes.arrayBuffer())

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
