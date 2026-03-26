export type ImageSlug =
  | 'type-first'
  | 'product-scene'
  | 'screen-mockup'
  | 'split-layout'
  | 'atmospheric'
  | 'multi-screen'
  | 'photo-text'

export type ImageEngine =
  | 'ideogram'
  | 'imagineart'
  | 'flux-pro'
  | 'flux-i2i'
  | 'sharp-compose'
  | 'sharp-flux'

export const SLUG_ENGINE_MAP: Record<ImageSlug, ImageEngine> = {
  'type-first': 'ideogram',
  'split-layout': 'ideogram',
  'product-scene': 'ideogram',
  'atmospheric': 'ideogram',
  'multi-screen': 'imagineart',
  'screen-mockup': 'flux-pro',
  'photo-text': 'flux-i2i',
}

export const SLUG_LABELS: Record<ImageSlug, string> = {
  'type-first': 'Tipográfico',
  'product-scene': 'Produto em Cena',
  'screen-mockup': 'Tela em Destaque',
  'split-layout': 'Comparação / Divisão',
  'atmospheric': 'Ambiental',
  'multi-screen': 'Multi-tela',
  'photo-text': 'Foto com Texto',
}

export interface BrandContext {
  nome_marca?: string
  cor_primaria?: string
  cor_secundaria?: string
  fonte?: string
  tom?: string
}

export interface ImageRequest {
  slug: ImageSlug
  product?: string
  briefing_text: string
  choice_label: string
  choice_text: string
  brand: BrandContext
  reference_image_url?: string
  order_id: string
  choice_id: string
  choice_position: number
}

// Aspect ratio and dimensions per product
export const PRODUCT_DIMENSIONS: Record<string, { width: number; height: number; aspect: string }> = {
  post_instagram: { width: 1080, height: 1080, aspect: 'ASPECT_1_1' },
  carrossel: { width: 1080, height: 1080, aspect: 'ASPECT_1_1' },
  content_pack: { width: 1080, height: 1080, aspect: 'ASPECT_1_1' },
  ad_copy: { width: 1080, height: 1080, aspect: 'ASPECT_1_1' },
  email_sequence: { width: 1200, height: 600, aspect: 'ASPECT_2_1' },
  reels_script: { width: 1080, height: 1920, aspect: 'ASPECT_9_16' },
  landing_page_copy: { width: 1920, height: 1080, aspect: 'ASPECT_16_9' },
  app: { width: 1080, height: 1080, aspect: 'ASPECT_1_1' },
}

export interface ImageResult {
  url: string
  storage_path: string
  engine: ImageEngine
  slug: ImageSlug
}
