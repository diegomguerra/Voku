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
  'product-scene': 'imagineart',
  'atmospheric': 'imagineart',
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
  briefing_text: string
  choice_label: string
  choice_text: string
  brand: BrandContext
  reference_image_url?: string
  order_id: string
  choice_id: string
  choice_position: number
}

export interface ImageResult {
  url: string
  storage_path: string
  engine: ImageEngine
  slug: ImageSlug
}
