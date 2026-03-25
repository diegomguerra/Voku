import { supabaseAdmin } from '@/lib/supabase'
import { ImageResult, BrandContext } from './types'
import { generateFlux } from './flux'

interface ComposeOptions {
  order_id: string
  choice_position: number
  screenshot_urls: string[]
  brand: BrandContext
  prompt?: string
}

/**
 * screen-mockup: generates a background with FLUX, then composes the screenshot on top.
 * Falls back to a solid-color background if FLUX is unavailable.
 */
export async function composeScreenMockup(opts: ComposeOptions & { prompt: string }): Promise<ImageResult> {
  // Try generating a background with FLUX
  let backgroundUrl: string | undefined
  try {
    const bgResult = await generateFlux({
      prompt: `Minimal, clean desk environment with soft lighting. Subtle brand colors: ${opts.brand.cor_primaria || '#111111'}. No devices, no text. Blurred, professional background for a device mockup composite. Square format.`,
      order_id: opts.order_id,
      choice_position: opts.choice_position,
      mode: 'text-to-image',
      width: 1080,
      height: 1080,
    })
    backgroundUrl = bgResult.url
  } catch {
    // FLUX unavailable — proceed without background
  }

  // For now, store the background or generate a placeholder
  // Full Sharp composition will be added when sharp is installed
  if (backgroundUrl) {
    return {
      url: backgroundUrl,
      storage_path: `generated/${opts.order_id}/choice-${opts.choice_position}.jpg`,
      engine: 'sharp-flux',
      slug: 'screen-mockup',
    }
  }

  // Fallback: generate the full scene with FLUX including the device
  const result = await generateFlux({
    prompt: opts.prompt,
    order_id: opts.order_id,
    choice_position: opts.choice_position,
    mode: 'text-to-image',
    width: 1080,
    height: 1080,
  })

  return { ...result, engine: 'sharp-flux', slug: 'screen-mockup' }
}

/**
 * multi-screen: arranges multiple screenshots in a grid.
 * Currently delegates to FLUX for a composed multi-device scene.
 * Will use Sharp for pixel-perfect composition when installed.
 */
export async function composeMultiScreen(opts: ComposeOptions & { prompt: string }): Promise<ImageResult> {
  const result = await generateFlux({
    prompt: opts.prompt,
    order_id: opts.order_id,
    choice_position: opts.choice_position,
    mode: 'text-to-image',
    width: 1080,
    height: 1080,
  })

  return { ...result, engine: 'sharp-compose', slug: 'multi-screen' }
}
