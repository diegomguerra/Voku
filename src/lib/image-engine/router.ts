import { ImageRequest, ImageResult, SLUG_ENGINE_MAP, PRODUCT_DIMENSIONS } from './types'
import { buildPrompt } from './prompts'
import { generateIdeogram, remixIdeogram } from './ideogram'
import { generateImagineArt } from './imagineart'
import { generateFlux } from './flux'
import { composeScreenMockup, composeMultiScreen } from './compose'
import { supabaseAdmin } from '@/lib/supabase'

// Convert PRODUCT_DIMENSIONS aspect string to ImagineArt format
function toImagineAspect(aspect: string): string {
  const map: Record<string, string> = {
    ASPECT_1_1: '1:1',
    ASPECT_2_1: '2:1',
    ASPECT_9_16: '9:16',
    ASPECT_16_9: '16:9',
  }
  return map[aspect] || '1:1'
}

export async function generateImage(req: ImageRequest): Promise<ImageResult> {
  let engine = SLUG_ENGINE_MAP[req.slug]

  // When a reference image (screenshot) is provided:
  // → Use Ideogram remix (understands image content) instead of FLUX i2i
  // → Only fall back to FLUX i2i for sharp-flux/sharp-compose engines
  const hasReference = !!req.reference_image_url
  const useIdeogramRemix = hasReference && engine !== 'sharp-flux' && engine !== 'sharp-compose'

  if (hasReference && !useIdeogramRemix) {
    // Legacy fallback for compose engines
    engine = 'flux-i2i'
  }

  const prompt = buildPrompt(req.slug, req.choice_text, req.brand, req.product)

  const supabase = supabaseAdmin()
  const dims = req.product ? PRODUCT_DIMENSIONS[req.product] : undefined
  const effectiveEngine = useIdeogramRemix ? 'ideogram-remix' : engine

  // Insert tracking row
  const { data: trackRow } = await supabase.from('post_requests').insert({
    order_id: req.order_id,
    choice_id: req.choice_id,
    slug: req.slug,
    engine: effectiveEngine,
    prompt_used: prompt,
    status: 'generating',
  }).select('id').single()

  const trackId = trackRow?.id

  try {
    let result: ImageResult

    // Screenshot provided → Ideogram remix (best quality, understands content)
    if (useIdeogramRemix) {
      const typoSlugs = ['type-first', 'split-layout']
      const styleType = typoSlugs.includes(req.slug) ? 'DESIGN' : 'REALISTIC'
      result = await remixIdeogram({
        prompt,
        order_id: req.order_id,
        choice_position: req.choice_position,
        reference_image_url: req.reference_image_url!,
        image_weight: 60,
        aspect_ratio: dims?.aspect,
        style_type: styleType,
      })
      result.slug = req.slug
    } else {
      // No reference image → use mapped engine
      switch (engine) {
        case 'ideogram': {
          const typoSlugs = ['type-first', 'split-layout']
          const styleType = typoSlugs.includes(req.slug) ? 'DESIGN' : 'REALISTIC'
          result = await generateIdeogram({
            prompt,
            order_id: req.order_id,
            choice_position: req.choice_position,
            aspect_ratio: dims?.aspect,
            style_type: styleType,
          })
          result.slug = req.slug
          break
        }

        case 'imagineart':
          result = await generateImagineArt({
            prompt,
            order_id: req.order_id,
            choice_position: req.choice_position,
            aspect_ratio: dims ? toImagineAspect(dims.aspect) : undefined,
          })
          result.slug = req.slug
          break

        case 'flux-pro':
          result = await generateFlux({
            prompt,
            order_id: req.order_id,
            choice_position: req.choice_position,
            mode: 'text-to-image',
            width: dims?.width,
            height: dims?.height,
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
            width: dims?.width,
            height: dims?.height,
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
            width: dims?.width,
            height: dims?.height,
          })
          break

        case 'sharp-compose':
          result = await composeMultiScreen({
            prompt,
            order_id: req.order_id,
            choice_position: req.choice_position,
            screenshot_urls: req.reference_image_url ? [req.reference_image_url] : [],
            brand: req.brand,
            width: dims?.width,
            height: dims?.height,
          })
          break

        default:
          throw new Error(`Unknown engine: ${engine}`)
      }
    }

    // Update tracking + choice in parallel
    const now = new Date().toISOString()
    await Promise.all([
      trackId
        ? supabase.from('post_requests').update({
            status: 'done',
            image_url: result.url,
            storage_path: result.storage_path,
            completed_at: now,
          }).eq('id', trackId)
        : Promise.resolve(),
      supabase.from('choices').update({
        image_url: result.url,
      }).eq('id', req.choice_id),
    ])

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
