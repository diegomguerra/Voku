import { supabaseAdmin } from '@/lib/supabase'
import { ImageResult, ImageEngine } from './types'

const FAL_BASE = 'https://queue.fal.run'
const FLUX_PRO_ENDPOINT = `${FAL_BASE}/fal-ai/flux-pro/v1.1`
const FLUX_I2I_ENDPOINT = `${FAL_BASE}/fal-ai/flux-pro/v1.1/image-to-image`

interface FluxOptions {
  prompt: string
  order_id: string
  choice_position: number
  mode: 'text-to-image' | 'image-to-image'
  reference_image_url?: string
  width?: number
  height?: number
}

async function pollResult(requestUrl: string, apiKey: string, maxWaitMs = 60000): Promise<any> {
  const start = Date.now()
  const statusUrl = requestUrl.replace('/queue/', '/requests/') + '/status'

  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(statusUrl, {
      headers: { Authorization: `Key ${apiKey}` },
    })
    const data = await res.json()

    if (data.status === 'COMPLETED') {
      const resultRes = await fetch(requestUrl.replace('/queue/', '/requests/') + '/result', {
        headers: { Authorization: `Key ${apiKey}` },
      })
      return await resultRes.json()
    }

    if (data.status === 'FAILED') {
      throw new Error(`FLUX generation failed: ${data.error || 'Unknown error'}`)
    }

    // Wait 2s before next poll
    await new Promise(r => setTimeout(r, 2000))
  }

  throw new Error('FLUX generation timed out')
}

export async function generateFlux(opts: FluxOptions): Promise<ImageResult> {
  const apiKey = process.env.FAL_KEY
  if (!apiKey) throw new Error('FAL_KEY not configured')

  const endpoint = opts.mode === 'image-to-image' ? FLUX_I2I_ENDPOINT : FLUX_PRO_ENDPOINT

  const body: Record<string, any> = {
    prompt: opts.prompt,
    image_size: { width: opts.width || 1080, height: opts.height || 1080 },
    num_images: 1,
    output_format: 'jpeg',
    guidance_scale: 3.5,
  }

  if (opts.mode === 'image-to-image' && opts.reference_image_url) {
    body.image_url = opts.reference_image_url
    body.strength = 0.75
  }

  // Submit to queue
  const submitRes = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!submitRes.ok) {
    const err = await submitRes.text()
    throw new Error(`fal.ai submit error (${submitRes.status}): ${err}`)
  }

  const submitData = await submitRes.json()

  // If response has images directly (sync mode), use them
  let imageUrl: string
  if (submitData.images?.[0]?.url) {
    imageUrl = submitData.images[0].url
  } else if (submitData.request_id) {
    // Async mode — poll for result
    const result = await pollResult(`${endpoint}/${submitData.request_id}`, apiKey)
    imageUrl = result.images?.[0]?.url
    if (!imageUrl) throw new Error('FLUX returned no image URL')
  } else {
    throw new Error('Unexpected fal.ai response format')
  }

  // Download and upload to Supabase Storage
  const imageRes = await fetch(imageUrl)
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer())
  const storagePath = `generated/${opts.order_id}/choice-${opts.choice_position}.jpg`

  const supabase = supabaseAdmin()
  const { error: uploadErr } = await supabase.storage
    .from('generated-images')
    .upload(storagePath, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

  const { data: urlData } = supabase.storage
    .from('generated-images')
    .getPublicUrl(storagePath)

  const engine: ImageEngine = opts.mode === 'image-to-image' ? 'flux-i2i' : 'flux-pro'

  return {
    url: urlData.publicUrl,
    storage_path: storagePath,
    engine,
    slug: 'product-scene',
  }
}
