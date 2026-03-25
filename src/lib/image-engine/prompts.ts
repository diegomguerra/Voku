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

// Context hints per product — refines the prompt for the specific deliverable
const PRODUCT_CONTEXT: Record<string, string> = {
  post_instagram: 'This image will be used as an Instagram feed post. Must stop the scroll. Square 1:1 format.',
  carrossel: 'This image is the COVER SLIDE of an Instagram carousel. Must be bold and intriguing enough to make people swipe. Square 1:1.',
  content_pack: 'This image accompanies a social media post in a 12-post content pack. Cohesive brand look. Square 1:1.',
  email_sequence: 'This is a header banner for a marketing email. Wide, clean, professional. The image sits at the top of the email body. Aspect ratio 2:1 landscape, 1200x600px.',
  ad_copy: 'This is a paid ad creative for Meta Ads (Facebook/Instagram). Must communicate value in under 2 seconds. High-converting visual. Square 1:1.',
  reels_script: 'This is a thumbnail/cover image for an Instagram Reel. Vertical 9:16. Must convey energy, motion, and hook the viewer.',
  landing_page_copy: 'This is the hero image for a landing page. Wide cinematic format 16:9. Must evoke the brand promise and create emotional pull above the fold.',
  app: 'This is a preview mockup image showcasing a web app. Show the app interface on a modern device. Clean, professional, tech-forward. Square 1:1.',
}

const builders: Record<ImageSlug, (text: string, brand: BrandContext, product?: string) => string> = {
  'type-first': (text, brand, product) => {
    const headline = extractHeadline(text)
    const ctx = product ? PRODUCT_CONTEXT[product] || '' : ''
    return `Professional typographic social media post design. Clean, modern layout with bold text as the primary visual element.

Main text: "${headline}"
${brandLine(brand)}
${ctx ? `\nContext: ${ctx}` : ''}

Style: Minimalist typography poster. The text IS the design — large, bold, high-contrast lettering. Solid background using brand primary color. Text in white or contrasting color. No photos, no illustrations — pure typography. Modern sans-serif font. Professional, editorial quality. Subtle geometric accent elements if needed. The text must be perfectly legible and spelled correctly.`
  },

  'product-scene': (text, brand, product) => {
    const headline = extractHeadline(text)
    const ctx = product ? PRODUCT_CONTEXT[product] || '' : ''
    return `Premium product lifestyle photography for a digital marketing creative.

Product/service context: "${headline}"
${brandLine(brand)}
${ctx ? `\nContext: ${ctx}` : ''}

Style: Hyper-realistic product photography in a curated lifestyle scene. Soft natural lighting with subtle shadows. The product is the hero — centered with breathing room. Background environment complements the brand aesthetic. Color palette draws from brand colors as accent lighting and environment tones. Shallow depth of field. Studio-quality composition. No text overlays — let the image speak. High-converting visual that communicates value instantly.`
  },

  'screen-mockup': (text, brand, product) => {
    const headline = extractHeadline(text)
    const ctx = product ? PRODUCT_CONTEXT[product] || '' : ''
    return `Modern device mockup scene for app or website showcase.

Screen content context: "${headline}"
${brandLine(brand)}
${ctx ? `\nContext: ${ctx}` : ''}

Style: Clean, isometric device mockup — smartphone or laptop on a minimal desk or floating. Device screen shows a modern UI with brand colors. Soft gradient background using brand palette. Professional product photography lighting. Sharp device details, slightly blurred background. Premium tech product shot aesthetic.`
  },

  'split-layout': (text, brand, product) => {
    const headline = extractHeadline(text)
    const ctx = product ? PRODUCT_CONTEXT[product] || '' : ''
    return `Split comparison layout design for social media. Before and after or versus concept.

Comparison context: "${headline}"
${brandLine(brand)}
${ctx ? `\nContext: ${ctx}` : ''}

Style: Clean vertical split down the center. Left side: muted, gray, problem state. Right side: vibrant, brand-colored, solution state. Bold dividing line in brand primary color. Minimal text — "ANTES" on left, "DEPOIS" on right (or relevant comparison labels). Typography is clean and modern. Instagram square format 1:1 aspect ratio. Professional graphic design quality. The contrast between both sides must be dramatic and immediately clear.`
  },

  'atmospheric': (text, brand, product) => {
    const headline = extractHeadline(text)
    const ctx = product ? PRODUCT_CONTEXT[product] || '' : ''
    return `Atmospheric mood photography for brand storytelling.

Scene context: "${headline}"
${brandLine(brand)}
${ctx ? `\nContext: ${ctx}` : ''}

Style: Cinematic, moody environment shot. Rich tones drawn from brand color palette as ambient lighting — warm or cool depending on brand tone. Abstract enough to evoke emotion without showing specific products. Think: light rays through fog, minimalist architecture, textured surfaces, urban landscapes at golden hour. High-end editorial photography. Slight grain for texture. No people, no text — pure atmosphere.`
  },

  'multi-screen': (text, brand, product) => {
    const headline = extractHeadline(text)
    const ctx = product ? PRODUCT_CONTEXT[product] || '' : ''
    return `Multi-device dashboard showcase layout for social media.

Dashboard context: "${headline}"
${brandLine(brand)}
${ctx ? `\nContext: ${ctx}` : ''}

Style: 2-3 device screens arranged in an elegant floating composition. Each screen shows a different view of an app or dashboard. Clean dark or light background with brand color accents. Isometric or perspective arrangement. Professional UI/UX showcase photography. Subtle shadows and reflections. Tech-forward, premium aesthetic.`
  },

  'photo-text': (text, brand, product) => {
    const headline = extractHeadline(text)
    const ctx = product ? PRODUCT_CONTEXT[product] || '' : ''
    return `Editorial photo with bold text overlay for social media content.

Text to feature: "${headline}"
${brandLine(brand)}
${ctx ? `\nContext: ${ctx}` : ''}

Style: High-quality lifestyle or editorial photograph as the base. Bold, modern text overlay that integrates naturally with the image composition. Text placed in a clear area of the image or with a semi-transparent brand-colored overlay strip. Typography is large, confident, and immediately readable. Brand colors used for text or accent elements. Magazine-quality editorial design. The text and image must feel like one cohesive piece.`
  },
}

export function buildPrompt(slug: ImageSlug, text: string, brand: BrandContext, product?: string): string {
  return builders[slug](text, brand, product)
}
