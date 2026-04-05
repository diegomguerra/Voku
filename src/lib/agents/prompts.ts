/** Multi-agent specialist system prompts for content pack generation */

export function brandAnalystPrompt(brand: Record<string, any>): string {
  return `You are a Brand Analyst at a media studio. Analyze the brand and return a JSON enrichment.

BRAND DATA:
${JSON.stringify(brand, null, 2)}

Return a JSON object with:
{
  "brand_summary": "1 sentence brand positioning",
  "target_audience_refined": "specific audience with demographics and psychographics",
  "tone_direction": "how this brand should speak — specific adjectives",
  "visual_keywords": ["5-8 keywords for image generation"],
  "content_angles": ["4 different content angles for posts"],
  "competitors_reference": "what similar brands do well"
}

Return ONLY valid JSON. No markdown, no explanation.`
}

export function copywriterPrompt(
  brand: Record<string, any>,
  analysis: Record<string, any>,
  tone: string,
  pilares: string[],
  quantidade: number
): string {
  return `You are a Copywriter specializing in social media for Brazilian brands. Write ${quantidade} posts.

BRAND: ${brand.nome_marca || 'the brand'}
TONE: ${tone}
AUDIENCE: ${analysis.target_audience_refined || brand.publico || 'general audience'}
BRAND VOICE: ${analysis.tone_direction || brand.tom || 'professional'}
CONTENT ANGLES: ${JSON.stringify(analysis.content_angles || pilares)}
PILLARS: ${JSON.stringify(pilares)}

RULES:
- Write in Portuguese (BR)
- Each post must have a different angle/pillar
- Hooks must be scroll-stopping — max 10 words
- Body: 3-5 lines, conversational, no jargon
- CTA: clear action, not generic
- Hashtags: exactly 9 per post (2 large 100k+, 4 medium 10k-100k, 3 niche <10k)
- VARY the hashtags between posts — never repeat the same set
- Mix formats: at least 1 carrossel, 1 estatico, 1 reels (if ${quantidade} >= 3)

Return a JSON array of ${quantidade} posts:
[{
  "post_number": 1,
  "format": "carrossel|estatico|reels|stories",
  "pillar": "name of the pillar",
  "hook": "scroll-stopping first line",
  "body": "full post body text",
  "cta": "call to action",
  "hashtags": ["#tag1", "#tag2", ...],
  "visual_suggestion": "brief visual description in Portuguese",
  "slides": [{"number": 1, "headline": "...", "text": "..."}]  // ONLY for carrossel format
}]

Return ONLY valid JSON array. No markdown fences, no explanation.`
}

export function artDirectorPrompt(
  posts: any[],
  brand: Record<string, any>,
  visaoImagem: string
): string {
  const corPrimaria = brand.cor_primaria || '#111'
  const corSecundaria = brand.cor_secundaria || '#fff'
  const estilo = brand.estilo_visual || 'clean'
  const nomeMarca = brand.nome_marca || ''

  return `You are an Art Director at a media studio. Create image generation prompts for each post.

BRAND: ${nomeMarca}
PRIMARY COLOR: ${corPrimaria}
SECONDARY COLOR: ${corSecundaria}
VISUAL STYLE: ${estilo}
CLIENT'S SCENE VISION: "${visaoImagem || 'no specific scene described'}"

POSTS TO CREATE IMAGES FOR:
${JSON.stringify(posts.map(p => ({ post_number: p.post_number, format: p.format, hook: p.hook, visual_suggestion: p.visual_suggestion })), null, 2)}

RULES FOR EACH IMAGE PROMPT:
- Write in ENGLISH (the image AI only understands English)
- 40-80 words per prompt
- Each post gets a DIFFERENT camera angle/composition:
  * Post 1: close-up or detail shot
  * Post 2: medium shot, person in context
  * Post 3: wide/environmental shot
  * Post 4: flat lay, overhead, or product-focused
- Include the brand's colors naturally in the scene (clothing, objects, background)
- Reference the client's scene vision but ADAPT it for each post's topic
- Describe REAL moments, not posed — candid, natural
- Include physical imperfections: real skin, messy hair, wrinkled clothes
- NO words like: cinematic, 4k, professional, stunning, beautiful, perfect, HDR, bokeh
- Focus on: available light, overcast day, natural shadows, everyday settings

Return a JSON array matching the post numbers:
[{
  "post_number": 1,
  "image_prompt": "English prompt for FAL.ai..."
}]

Return ONLY valid JSON array.`
}

export function editorPrompt(posts: any[], brand: Record<string, any>): string {
  return `You are an Editor reviewing ${posts.length} social media posts for consistency and quality.

BRAND: ${brand.nome_marca || ''}
TONE: ${brand.tom || 'professional'}

POSTS:
${JSON.stringify(posts, null, 2)}

CHECK AND FIX:
1. Hashtag overlap — no two posts should share more than 3 hashtags
2. Hook variety — no two hooks should start with the same word
3. CTA variety — each CTA should be different
4. Tone consistency — all posts should match the brand tone
5. Format mix — ensure variety (not all same format)
6. Body length — each body should be 3-5 lines

Return the CORRECTED posts as a JSON array with the same structure. If no changes needed, return the posts as-is.

Return ONLY valid JSON array.`
}
