import { ImageSlug, BrandContext } from './types'

function brandLine(b: BrandContext): string {
  const parts: string[] = []
  if (b.nome_marca) parts.push(`Brand: "${b.nome_marca}"`)
  if (b.cor_primaria) parts.push(`primary color: ${b.cor_primaria}`)
  if (b.cor_secundaria) parts.push(`secondary color: ${b.cor_secundaria}`)
  if (b.fonte) parts.push(`font: ${b.fonte}`)
  if (b.tom) parts.push(`tone: ${b.tom}`)
  return parts.join(', ')
}

function extractHeadline(text: string): string {
  const lines = text.split('\n').filter(l => l.trim())
  return lines[0]?.replace(/^[#*\-]+\s*/, '').slice(0, 80) || 'Headline'
}

const builders: Record<ImageSlug, (text: string, brand: BrandContext) => string> = {
  'type-first': (text, brand) => {
    const headline = extractHeadline(text)
    return `Professional typographic social media post design. Clean, modern layout with bold text as the primary visual element.

Main text: "${headline}"
${brandLine(brand)}

Style: Minimalist typography poster. The text IS the design — large, bold, high-contrast lettering. Solid background using brand primary color. Text in white or contrasting color. No photos, no illustrations — pure typography. Modern sans-serif font. Instagram square format 1:1 aspect ratio. Professional, editorial quality. Subtle geometric accent elements if needed. The text must be perfectly legible and spelled correctly.`
  },

  'product-scene': (text, brand) => {
    const headline = extractHeadline(text)
    return `Premium product lifestyle photography for social media advertisement.

Product context: "${headline}"
${brandLine(brand)}

Style: Hyper-realistic product photography in a curated lifestyle scene. Soft natural lighting with subtle shadows. The product is the hero — centered with breathing room. Background environment complements the brand aesthetic. Color palette draws from brand colors as accent lighting and environment tones. Shallow depth of field. Studio-quality composition. Instagram square format 1:1. No text overlays — let the image speak.`
  },

  'screen-mockup': (text, brand) => {
    const headline = extractHeadline(text)
    return `Modern device mockup scene for app or website showcase.

Screen content context: "${headline}"
${brandLine(brand)}

Style: Clean, isometric device mockup — smartphone or laptop on a minimal desk or floating. Device screen shows a modern UI with brand colors. Soft gradient background using brand palette. Professional product photography lighting. Sharp device details, slightly blurred background. Instagram square format 1:1. Premium tech product shot aesthetic.`
  },

  'split-layout': (text, brand) => {
    const headline = extractHeadline(text)
    return `Split comparison layout design for social media. Before and after or versus concept.

Comparison context: "${headline}"
${brandLine(brand)}

Style: Clean vertical split down the center. Left side: muted, gray, problem state. Right side: vibrant, brand-colored, solution state. Bold dividing line in brand primary color. Minimal text — "ANTES" on left, "DEPOIS" on right (or relevant comparison labels). Typography is clean and modern. Instagram square format 1:1 aspect ratio. Professional graphic design quality. The contrast between both sides must be dramatic and immediately clear.`
  },

  'atmospheric': (text, brand) => {
    const headline = extractHeadline(text)
    return `Atmospheric mood photography for brand storytelling on social media.

Scene context: "${headline}"
${brandLine(brand)}

Style: Cinematic, moody environment shot. Rich tones drawn from brand color palette as ambient lighting — warm or cool depending on brand tone. Abstract enough to evoke emotion without showing specific products. Think: light rays through fog, minimalist architecture, textured surfaces, urban landscapes at golden hour. High-end editorial photography. Slight grain for texture. Instagram square format 1:1. No people, no text — pure atmosphere.`
  },

  'multi-screen': (text, brand) => {
    const headline = extractHeadline(text)
    return `Multi-device dashboard showcase layout for social media.

Dashboard context: "${headline}"
${brandLine(brand)}

Style: 2-3 device screens arranged in an elegant floating composition. Each screen shows a different view of an app or dashboard. Clean dark or light background with brand color accents. Isometric or perspective arrangement. Professional UI/UX showcase photography. Subtle shadows and reflections. Instagram square format 1:1. Tech-forward, premium aesthetic.`
  },

  'photo-text': (text, brand) => {
    const headline = extractHeadline(text)
    return `Editorial photo with bold text overlay for social media content.

Text to feature: "${headline}"
${brandLine(brand)}

Style: High-quality lifestyle or editorial photograph as the base. Bold, modern text overlay that integrates naturally with the image composition. Text placed in a clear area of the image or with a semi-transparent brand-colored overlay strip. Typography is large, confident, and immediately readable. Brand colors used for text or accent elements. Instagram square format 1:1. Magazine-quality editorial design. The text and image must feel like one cohesive piece.`
  },
}

export function buildPrompt(slug: ImageSlug, text: string, brand: BrandContext): string {
  return builders[slug](text, brand)
}
