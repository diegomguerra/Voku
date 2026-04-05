export interface StructuredPost {
  post_number: number
  format: 'carrossel' | 'estatico' | 'reels' | 'stories'
  pillar: string
  hook: string
  body: string
  cta: string
  hashtags: string[]
  visual_suggestion: string
  image_prompt: string
  slides?: { number: number; headline: string; text: string }[]
}

export interface ChoiceContent {
  posts?: StructuredPost[]
  text?: string // legacy fallback
}
