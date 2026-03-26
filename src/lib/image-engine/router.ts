import { ImageRequest, ImageResult, SLUG_ENGINE_MAP, PRODUCT_DIMENSIONS } from './types'
import { buildPrompt } from './prompts'
import { generateIdeogram } from './ideogram'
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

  // When a reference image (screenshot) is provided, force image-to-image mode
  // so the screenshot is actually used as the base for generation
  if (req.reference_image_url && engine !== 'sharp-flux' && engine !== 'sharp-compose') {
    engine = 'flux-i2i'
  }

  let prompt = buildPrompt(req.slug, req.choice_text, req.brand, req.product)

  // Enhance prompt for image-to-image with a reference screenshot
  if (req.reference_image_url && engine === 'flux-i2i') {
    prompt = `Professional marketing creative incorporating the provided screenshot/image. ${prompt}\n\nIMPORTANT: Use the provided reference image as the core visual element. Place it naturally within the composition — on a device screen, as a featured element, or as the main visual. Enhance it with professional lighting, subtle shadows, and brand-consistent styling. The final image should look like a polished marketing asset that prominently features the provided screenshot.`
  }

  const supabase = supabaseAdmin()
  const dims = req.product ? PRODUCT_DIMENSIONS[req.product] : undefined

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
      case 'ideogram': {
        // Typography slugs use DESIGN style, everything else uses REALISTIC
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

    // Check if ALL choices for this order have images → mark image step done, activate approval
    const { data: allChoices } = await supabase
      .from('choices').select('id, image_url')
      .eq('order_id', req.order_id)
    const allDone = allChoices?.every(c => c.image_url)
    if (allDone) {
      // Mark "Gerar imagens" step as done
      const { data: imgStep } = await supabase
        .from('project_steps').select('id')
        .eq('order_id', req.order_id).eq('step_number', 2).single()
      if (imgStep) {
        await supabase.from('project_steps').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', imgStep.id)
      }
      // Mark production phase as done, activate approval phase
      const { data: prodPhase } = await supabase
        .from('project_phases').select('id')
        .eq('order_id', req.order_id).eq('phase_number', 1).single()
      if (prodPhase) {
        await supabase.from('project_phases').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', prodPhase.id)
      }
      const { data: approvalPhase } = await supabase
        .from('project_phases').select('id')
        .eq('order_id', req.order_id).eq('phase_number', 2).single()
      if (approvalPhase) {
        await supabase.from('project_phases').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', approvalPhase.id)
      }
      // Activate "Escolher variação" step
      const { data: chooseStep } = await supabase
        .from('project_steps').select('id')
        .eq('order_id', req.order_id).eq('step_number', 3).single()
      if (chooseStep) {
        await supabase.from('project_steps').update({ status: 'active' }).eq('id', chooseStep.id)
      }
    }

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
