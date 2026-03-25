import { supabaseAdmin } from '@/lib/supabase'
import { ImageResult } from './types'

const IMAGINE_URL = 'https://api.vyro.ai/v2/image/generations'

interface ImagineOptions {
  prompt: string
  order_id: string
  choice_position: number
  style?: string
  aspect_ratio?: string
}

export async function generateImagineArt(opts: ImagineOptions): Promise<ImageResult> {
  const apiKey = process.env.IMAGINEART_API_KEY
  if (!apiKey) throw new Error('IMAGINEART_API_KEY not configured')

  const formData = new FormData()
  formData.append('prompt', opts.prompt)
  formData.append('style', opts.style || 'realistic')
  formData.append('aspect_ratio', opts.aspect_ratio || '1:1')

  const res = await fetch(IMAGINE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`ImagineArt API error (${res.status}): ${err}`)
  }

  // ImagineArt returns the image binary directly
  const imageBuffer = Buffer.from(await res.arrayBuffer())
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

  return {
    url: urlData.publicUrl,
    storage_path: storagePath,
    engine: 'imagineart',
    slug: 'product-scene',
  }
}
