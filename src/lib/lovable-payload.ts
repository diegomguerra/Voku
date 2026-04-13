import type { SupabaseClient } from '@supabase/supabase-js'

export const LOVABLE_LANDING_URL =
  process.env.LOVABLE_LANDING_URL ||
  'https://ivflzjzmsynijynuphnr.supabase.co/functions/v1/gerar-landing-page'

export interface LovableLandingPayload {
  brand_name: string
  headline: string
  cta_text: string
  product_name?: string
  tagline?: string
  subheadline?: string
  primary_color?: string
  secondary_color?: string
  text_color?: string
  background_color?: string
  accent_color?: string
  tone?: string
  audience?: string
  style?: string
  description?: string
  keywords?: string
  typography?: Record<string, any>
  sections?: string[]
  images?: string[]
  conversation_context?: string
}

/** Upload base64 reference images to Supabase Storage and return public URLs. */
export async function uploadReferenceImages(
  supabase: SupabaseClient,
  order_id: string,
  sd: Record<string, any>,
): Promise<string[]> {
  const out: string[] = []

  if (Array.isArray(sd.images) && sd.images.length) {
    out.push(...sd.images.filter((u: any) => typeof u === 'string' && u.startsWith('http')))
  }

  const base64List: string[] = Array.isArray(sd.imagens_referencia) ? sd.imagens_referencia : []
  for (let i = 0; i < base64List.length; i++) {
    try {
      const b64 = base64List[i]
      const clean = typeof b64 === 'string' ? b64.replace(/^data:image\/\w+;base64,/, '') : ''
      if (!clean) continue
      const buffer = Buffer.from(clean, 'base64')
      const path = `briefing/${order_id}/ref-${i}.png`
      await supabase.storage.from('imagens').upload(path, buffer, {
        contentType: 'image/png',
        upsert: true,
      })
      const { data: urlData } = supabase.storage.from('imagens').getPublicUrl(path)
      if (urlData?.publicUrl) out.push(urlData.publicUrl)
    } catch (e) {
      console.error(`[lovable-payload] image upload ${i} failed:`, e)
    }
  }

  return out
}

/** Normalize conversation data (array of {role,content} or string) to plain text. */
function stringifyConversation(conv: any): string | undefined {
  if (!conv) return undefined
  if (typeof conv === 'string') return conv.slice(0, 8000) || undefined
  if (Array.isArray(conv)) {
    const text = conv
      .map((m: any) => {
        if (!m) return ''
        if (typeof m === 'string') return m
        const role = m.role || m.author || ''
        const content = m.content || m.text || ''
        return role ? `${role}: ${content}` : content
      })
      .filter(Boolean)
      .join('\n')
    return text.slice(0, 8000) || undefined
  }
  return undefined
}

/** Build the full Lovable Cloud landing-page payload from structured_data. */
export function buildLovablePayload(
  sd: Record<string, any>,
  images: string[],
  conversation?: any,
): LovableLandingPayload {
  // Support the legacy shape where everything lives in structured_data.brand_context
  const bc: Record<string, any> = sd.brand_context || {}
  const pick = <T = any>(...keys: string[]): T | undefined => {
    for (const k of keys) {
      const v = sd[k] ?? bc[k]
      if (v !== undefined && v !== null && v !== '') return v as T
    }
    return undefined
  }

  const brand_name = pick<string>('nome_marca') || 'Marca'
  const product_name = pick<string>('produto', 'product_name')
  const tagline = pick<string>('tagline')
  const resumo = pick<string>('resumo', 'description', 'descricao')
  const subheadline = pick<string>('subheadline', 'subtitulo')
  const headline =
    pick<string>('headline') ||
    (product_name ? `${brand_name} ${product_name}`.trim() : brand_name) ||
    resumo ||
    'Transforme seu negócio'

  const typography = pick<Record<string, any>>('tipografia', 'typography')
  const sections =
    pick<string[]>('secoes', 'sections') ||
    pick<string[]>('objetivos') ||
    ['Hero', 'Benefícios', 'Como Funciona', 'Prova Social', 'CTA final']

  const payload: LovableLandingPayload = {
    brand_name,
    headline,
    cta_text: pick<string>('cta_texto', 'cta_text') || 'Começar agora',

    product_name: product_name && product_name !== 'produto' ? product_name : undefined,
    tagline,
    subheadline,

    primary_color: pick<string>('cor_primaria', 'primary_color') || '#6C3AED',
    secondary_color: pick<string>('cor_secundaria', 'secondary_color') || '#1E1B4B',
    text_color: pick<string>('cor_texto', 'text_color'),
    background_color: pick<string>('cor_fundo', 'background_color'),
    accent_color:
      pick<string>('cor_destaque', 'cor_accent', 'accent_color') ||
      pick<string>('cor_secundaria', 'secondary_color'),

    tone: pick<string>('tom', 'tone') || 'profissional e moderno',
    audience: pick<string>('publico_alvo', 'publico', 'audience') || 'empresas e profissionais',
    style: pick<string>('estilo', 'style'),
    description: resumo,
    keywords: pick<string>('palavras_chave', 'keywords'),

    typography,
    sections,
    images: images.length > 0 ? images : undefined,
    conversation_context: stringifyConversation(conversation),
  }

  // Drop undefined keys for a clean JSON body
  for (const k of Object.keys(payload) as (keyof LovableLandingPayload)[]) {
    if (payload[k] === undefined) delete payload[k]
  }

  return payload
}

const LOVABLE_TIMEOUT_MS = 90_000

interface LovableResponse {
  ok: boolean
  status: number
  html?: string
  metadata?: any
  error?: string
  /** Human-readable message suitable for surfacing to the end user. */
  userMessage?: string
}

function friendlyMessage(status: number, raw: string): string {
  if (status === 429) return 'Muitas requisições. Aguarde alguns segundos e tente novamente.'
  if (status === 402) return 'Créditos de IA insuficientes. Adicione créditos ao workspace.'
  if (status === 400) return raw || 'Campos obrigatórios faltando no briefing.'
  if (status === 0) return 'A geração demorou demais ou a rede falhou. Tente novamente.'
  return raw || 'Erro ao processar landing page.'
}

async function postToLovable(body: Record<string, any>): Promise<LovableResponse> {
  try {
    const res = await fetch(LOVABLE_LANDING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(LOVABLE_TIMEOUT_MS),
    })
    if (!res.ok) {
      const err = await res.text()
      return {
        ok: false,
        status: res.status,
        error: err.slice(0, 500),
        userMessage: friendlyMessage(res.status, err.slice(0, 200)),
      }
    }
    const data = await res.json()
    return { ok: true, status: res.status, html: data.html || '', metadata: data.metadata }
  } catch (e: any) {
    const msg = e?.message || 'fetch error'
    return { ok: false, status: 0, error: msg, userMessage: friendlyMessage(0, msg) }
  }
}

/** Generate a fresh landing page from structured_data + images + conversation. */
export async function generateLanding(
  sd: Record<string, any>,
  images: string[],
  conversation?: any,
): Promise<LovableResponse> {
  const payload = buildLovablePayload(sd, images, conversation)
  return postToLovable(payload as any)
}

/** Refine an existing landing page HTML with free-text instructions. */
export async function refineLanding(
  existing_html: string,
  refinement_instructions: string,
): Promise<LovableResponse> {
  return postToLovable({ existing_html, refinement_instructions })
}

/** Fetch current landing HTML stored for an order (if any). */
export async function getExistingLandingHtml(
  supabase: SupabaseClient,
  order_id: string,
): Promise<{ choice_id: string; html: string } | null> {
  const { data } = await supabase
    .from('choices')
    .select('id, html_content')
    .eq('order_id', order_id)
    .maybeSingle()
  if (data?.html_content) return { choice_id: data.id, html: data.html_content }
  return null
}
