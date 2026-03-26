import { ImageSlug, BrandContext } from './types'

/**
 * Build concise, descriptive prompts.
 * Ideogram's magic_prompt handles enhancement — we just describe WHAT we want clearly.
 * Rule: max 2-3 sentences. No style essays. Let the AI do its job.
 */

function brandTag(b: BrandContext): string {
  const parts: string[] = []
  if (b.nome_marca) parts.push(`"${b.nome_marca}"`)
  if (b.cor_primaria) parts.push(b.cor_primaria)
  if (b.cor_secundaria) parts.push(b.cor_secundaria)
  if (b.tom) parts.push(`tom ${b.tom}`)
  return parts.length ? parts.join(', ') : ''
}

function cleanText(text: string): string {
  // Extract the most meaningful content — first 2 lines or 200 chars
  const lines = text.split('\n').filter(l => l.trim())
  const meaningful = lines.slice(0, 2).join('. ').replace(/^[#*\-]+\s*/g, '')
  return meaningful.slice(0, 200)
}

// Product format hints (keep minimal)
const FORMAT: Record<string, string> = {
  post_instagram: 'Instagram post, square 1:1.',
  carrossel: 'Instagram carousel cover slide, square 1:1.',
  content_pack: 'Social media post, square 1:1.',
  email_sequence: 'Email header banner, landscape 2:1.',
  ad_copy: 'Paid ad creative, square 1:1.',
  reels_script: 'Instagram Reel cover, vertical 9:16.',
  landing_page_copy: 'Landing page hero image, wide 16:9.',
  app: 'App preview mockup, square 1:1.',
}

const builders: Record<ImageSlug, (text: string, brand: BrandContext, product?: string) => string> = {

  'type-first': (text, brand, product) => {
    const content = cleanText(text)
    const b = brandTag(brand)
    const fmt = product ? FORMAT[product] || '' : ''
    return `Bold typographic design with text: "${content}". ${b ? `Brand: ${b}.` : ''} ${fmt} Large modern sans-serif lettering on solid color background, no photos, pure typography.`
  },

  'product-scene': (text, brand, product) => {
    const content = cleanText(text)
    const b = brandTag(brand)
    const fmt = product ? FORMAT[product] || '' : ''
    return `Professional product photography: ${content}. ${b ? `Brand: ${b}.` : ''} ${fmt} Lifestyle scene, natural lighting, premium quality.`
  },

  'screen-mockup': (text, brand, product) => {
    const content = cleanText(text)
    const b = brandTag(brand)
    const fmt = product ? FORMAT[product] || '' : ''
    return `Modern device mockup showing app/website: ${content}. ${b ? `Brand: ${b}.` : ''} ${fmt} Clean minimal background, professional tech product shot.`
  },

  'split-layout': (text, brand, product) => {
    const content = cleanText(text)
    const b = brandTag(brand)
    const fmt = product ? FORMAT[product] || '' : ''
    return `Before and after comparison: ${content}. ${b ? `Brand: ${b}.` : ''} ${fmt} Split layout, left side muted/gray, right side vibrant with brand colors.`
  },

  'atmospheric': (text, brand, product) => {
    const content = cleanText(text)
    const b = brandTag(brand)
    const fmt = product ? FORMAT[product] || '' : ''
    return `Cinematic mood photography: ${content}. ${b ? `Brand: ${b}.` : ''} ${fmt} Atmospheric, no products or people, brand color tones as ambient lighting.`
  },

  'multi-screen': (text, brand, product) => {
    const content = cleanText(text)
    const b = brandTag(brand)
    const fmt = product ? FORMAT[product] || '' : ''
    return `Multi-device dashboard showcase: ${content}. ${b ? `Brand: ${b}.` : ''} ${fmt} 2-3 floating screens, professional UI showcase.`
  },

  'photo-text': (text, brand, product) => {
    const content = cleanText(text)
    const b = brandTag(brand)
    const fmt = product ? FORMAT[product] || '' : ''
    return `Editorial photo with bold text overlay: "${content}". ${b ? `Brand: ${b}.` : ''} ${fmt} Lifestyle photo base, text integrated naturally into composition.`
  },
}

export function buildPrompt(slug: ImageSlug, text: string, brand: BrandContext, product?: string): string {
  return builders[slug](text, brand, product)
}
