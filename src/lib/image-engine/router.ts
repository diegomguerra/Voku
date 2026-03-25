import { ImageRequest, ImageResult, SLUG_ENGINE_MAP } from './types'
import { buildPrompt } from './prompts'
import { generateIdeogram } from './ideogram'
import { generateImagineArt } from './imagineart'
import { generateFlux } from './flux'
import { composeScreenMockup, composeMultiScreen } from './compose'
import { supabaseAdmin } from '@/lib/supabase'

export async function generateImage(req: ImageRequest): Promise<ImageResult> {
  const engine = SLUG_ENGINE_MAP[req.slug]
  const prompt = buildPrompt(req.slug, req.choice_text, req.brand)
  const supabase = supabaseAdmin()

  // Insert tracking row
  const { data: trackRow } = await supabase.from('post_requests').insert({
    order_id: req.order_id,
    choice_id: req.choice_id,
    slug: req.slug,
    engine,
    prompt_used: prompt,
    status: 'generating',
  }).select('id').single()

  const trackId = trackRow?.id

  try {
    let result: ImageResult

    switch (engine) {
      case 'ideogram':
        result = await generateIdeogram({
          prompt,
          order_id: req.order_id,
          choice_position: req.choice_position,
        })
        result.slug = req.slug
        break

      case 'imagineart':
        result = await generateImagineArt({
          prompt,
          order_id: req.order_id,
          choice_position: req.choice_position,
        })
        result.slug = req.slug
        break

      case 'flux-pro':
        result = await generateFlux({
          prompt,
          order_id: req.order_id,
          choice_position: req.choice_position,
          mode: 'text-to-image',
        })
        result.slug = req.slug
        break

      case 'flux-i2i':
        result = await generateFlux({
          prompt,
          order_id: req.order_id,
          choice_position: req.choice_position,
          mode: 'image-to-image',
          reference_image_url: req.reference_image_url,
        })
        result.slug = req.slug
        break

      case 'sharp-flux':
        result = await composeScreenMockup({
          prompt,
          order_id: req.order_id,
          choice_position: req.choice_position,
          screenshot_urls: req.reference_image_url ? [req.reference_image_url] : [],
          brand: req.brand,
        })
        break

      case 'sharp-compose':
        result = await composeMultiScreen({
          prompt,
          order_id: req.order_id,
          choice_position: req.choice_position,
          screenshot_urls: req.reference_image_url ? [req.reference_image_url] : [],
          brand: req.brand,
        })
        break

      default:
        throw new Error(`Unknown engine: ${engine}`)
    }

    // Update tracking row
    if (trackId) {
      await supabase.from('post_requests').update({
        status: 'done',
        image_url: result.url,
        storage_path: result.storage_path,
        completed_at: new Date().toISOString(),
      }).eq('id', trackId)
    }

    // Update choice with image URL
    await supabase.from('choices').update({
      image_url: result.url,
    }).eq('id', req.choice_id)

    return result
  } catch (err) {
    // Mark as failed
    if (trackId) {
      await supabase.from('post_requests').update({
        status: 'failed',
        error_message: (err as Error).message,
      }).eq('id', trackId)
    }
    throw err
  }
}
