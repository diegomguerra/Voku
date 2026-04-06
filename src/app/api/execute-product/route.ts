import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ProductId } from '@/lib/products'
import { ImageSlug } from '@/lib/image-engine/types'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { brandAnalystPrompt, copywriterPrompt, artDirectorPrompt, editorPrompt } from '@/lib/agents/prompts'
import type { StructuredPost } from '@/lib/types/post'

export const dynamic = 'force-dynamic'
export const maxDuration = 120  // Haiku for text (fast) + fire-and-forget images

function stripFences(s: string): string {
  return s.replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()
}

const SYSTEM_PROMPTS: Record<ProductId, string> = {
  landing_page_copy: `Você é RORDENS, o motor de execução da Voku. Escreva uma landing page copy completa e de alta conversão.

Estrutura obrigatória:
1. HEADLINE PRINCIPAL
2. SUBHEADLINE
3. SEÇÃO DE DOR (3 pontos)
4. PROPOSTA DE VALOR ÚNICA
5. BENEFÍCIOS (3 blocos: título + 2 linhas)
6. PROVA SOCIAL (estrutura para preenchimento)
7. GARANTIA
8. CTA PRINCIPAL + CTA SECUNDÁRIO

Tom: direto, sem floreios, orientado a conversão. Idioma do briefing.`,

  content_pack: `Você é RORDENS, o motor de execução da Voku. Crie 12 posts completos para redes sociais.

Para cada post:
- Número (Post 1–12)
- FORMATO: Carrossel / Reels / Estático
- GANCHO: primeira linha que para o scroll
- DESENVOLVIMENTO: corpo (3-5 linhas)
- CTA: chamada clara
- HASHTAGS: 5-8 relevantes
- SUGESTÃO VISUAL: descrição breve

Mix: 5 carrosséis, 4 estáticos, 3 reels. Tom e idioma do briefing.`,

  email_sequence: `Você é RORDENS, o motor de execução da Voku. Escreva uma sequência de 5 e-mails de nutrição.

Estrutura:
- E-MAIL 1 (Dia 0): Boas-vindas + promessa
- E-MAIL 2 (Dia 2): O problema em profundidade
- E-MAIL 3 (Dia 4): A solução revelada
- E-MAIL 4 (Dia 6): Prova social + objeções
- E-MAIL 5 (Dia 8): Oferta + urgência

Para cada e-mail: ASSUNTO, PRÉ-HEADER, CORPO completo, CTA. Tom e idioma do briefing.`,

  post_instagram: `Você é RORDENS, o motor de execução da Voku. Crie 3 variações de post para Instagram.

FORMATO OBRIGATÓRIO para cada variação:
**VARIAÇÃO [A/B/C] — Tom [Direto/Inspiracional/Educativo]**
LEGENDA:
[texto completo da legenda, máximo 2200 caracteres]
HASHTAGS:
[20-30 hashtags relevantes separadas por espaço]
CALL TO ACTION:
[CTA final da legenda]

REGRAS:
- Variação A: tom direto e objetivo, foco no resultado
- Variação B: tom inspiracional, foco na transformação
- Variação C: tom educativo, foco no aprendizado
- Cada legenda deve ter hook forte na primeira linha
- Use quebras de linha estratégicas para leitura mobile`,

  carrossel: `Você é RORDENS, o motor de execução da Voku. Crie 3 variações de carrossel para Instagram.

FORMATO OBRIGATÓRIO para cada variação:
**VARIAÇÃO [A/B/C] — Ângulo [Nome do ângulo]**
CAPA:
Título: [headline impactante]
Subtítulo: [complemento em até 10 palavras]

SLIDE 1: [tema]
Headline: [frase curta e impactante]
Texto: [2 linhas explicando o ponto]

SLIDE 2-5: [mesma estrutura]

CTA FINAL:
[chamada para ação do último slide]

REGRAS:
- 5 slides de conteúdo + capa + CTA final = 7 slides no total
- Cada variação deve ter ângulo diferente (problema, solução, resultados)
- Headlines curtas — máximo 6 palavras`,

  reels_script: `Você é RORDENS, o motor de execução da Voku. Crie 3 roteiros de Reels.

FORMATO OBRIGATÓRIO para cada variação:
**VARIAÇÃO [A/B/C] — Duração: [30s/60s/90s]**

HOOK (0-3s):
[frase de abertura que para o scroll — máximo 10 palavras]
[indicação visual: o que mostrar na tela]

DESENVOLVIMENTO:
[segundo a segundo, com indicações de corte]

CTA (últimos 5s):
[chamada para ação falada]

LEGENDA DO POST:
[legenda para acompanhar o Reels]

REGRAS:
- Variação A: 30 segundos — direto ao ponto
- Variação B: 60 segundos — com desenvolvimento
- Variação C: 90 segundos — storytelling completo`,

  ad_copy: `Você é RORDENS, o motor de execução da Voku. Crie 3 variações de copy para Meta Ads.

FORMATO OBRIGATÓRIO para cada variação:
**VARIAÇÃO [A/B/C] — Ângulo [Nome do ângulo]**

HEADLINE PRIMÁRIO: [até 40 caracteres]
HEADLINE SECUNDÁRIO: [até 40 caracteres]
TEXTO PRIMÁRIO: [corpo do anúncio, até 125 caracteres ideais, máximo 500]
DESCRIÇÃO: [até 30 caracteres]
CALL TO ACTION: [botão: Saiba Mais / Comprar Agora / etc]

ÂNGULO:
- Variação A: dor — foca no problema
- Variação B: benefício — foca na transformação
- Variação C: prova social — foca em resultados`,

  app: `Você é RORDENS, o motor de execução da Voku. Gere a especificação completa de um app web simples focado em marketing.

FORMATO OBRIGATÓRIO — retorne 3 variações:
**VARIAÇÃO A — [tipo: calculadora/quiz/formulario/gerador/captura]**
TÍTULO: [nome do app]
TIPO: [tipo técnico]
DESCRIÇÃO: [o que o app faz em 2-3 frases]
FUNCIONALIDADES:
- [funcionalidade 1]
- [funcionalidade 2]
- [funcionalidade 3]
CTA_PRINCIPAL: [ação principal do botão]
COR_DESTAQUE: [cor hex sugerida]

VARIAÇÃO B — [tipo diferente]
[mesma estrutura]

VARIAÇÃO C — [tipo diferente]
[mesma estrutura]`,
}

const CREDIT_COST: Record<string, number> = {
  landing_page_copy: 40,
  content_pack: 25,
  email_sequence: 25,
  post_instagram: 8,
  carrossel: 15,
  reels_script: 10,
  ad_copy: 10,
  app: 20,
}

const TONE_INSTRUCTIONS = [
  { label: 'Option A — Direct & bold tone', instruction: '' },
  { label: 'Option B — Consultive & empathetic tone', instruction: '' },
  { label: 'Option C — Creative & provocative tone', instruction: '' },
]

const PRODUCT_NAMES: Record<ProductId, string> = {
  landing_page_copy: 'Landing Page Copy',
  content_pack: 'Content Pack',
  email_sequence: 'Email Sequence',
  post_instagram: 'Post para Instagram',
  carrossel: 'Carrossel para Instagram',
  reels_script: 'Roteiro de Reels',
  ad_copy: 'Copy para Meta Ads',
  app: 'App Web',
}

const IMAGE_PRODUCTS: Record<string, string> = {
  post_instagram: 'product-scene',
  carrossel: 'product-scene',
  content_pack: 'product-scene',
  email_sequence: 'product-scene',
  ad_copy: 'product-scene',
  reels_script: 'product-scene',
  landing_page_copy: 'atmospheric',
  app: 'screen-mockup',
}

function fireImageGeneration(params: {
  order_id: string
  choice_id: string
  choice_position: number
  post_number?: number
  image_prompt?: string
  choice_label?: string
  choice_text?: string
  slug?: string
  brand?: Record<string, string>
  reference_image_url?: string
  briefing_text?: string
  product: string
  visao_imagem?: string | null
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  fetch(`${baseUrl}/api/generate-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).catch(e => console.error('[fire-image] fetch error:', e))
}

/** Call a specialist agent (Haiku for speed) and parse JSON response */
async function callAgent(
  anthropic: Anthropic,
  systemPrompt: string,
  userContent: string,
  maxTokens = 4000,
  temperature = 0.7
): Promise<any> {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })
  const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
  return JSON.parse(stripFences(text))
}

/** Multi-agent pipeline: Copywriter → Art Director → Editor
 *  Brand Analyst runs ONCE before this (shared across tones)
 *  ACCUMULATIVE: each agent receives the full output of all previous agents */
async function generateContentPackWithAnalysis(
  anthropic: Anthropic,
  tone: string,
  briefingText: string,
  brand: Record<string, any>,
  visaoImagem: string,
  quantidade: number,
  pilares: string[],
  analysis: Record<string, any>,
  sharedAgentLog: Record<string, any>,
): Promise<StructuredPost[]> {
  // Start with shared analyst log, add per-tone agents
  const agentLog: Record<string, any> = { ...sharedAgentLog }

  // Agent 2: Copywriter (temp 0.8 — creative but controlled)
  const copyPrompt = copywriterPrompt(brand, analysis, tone, pilares, quantidade, briefingText)
  let posts: StructuredPost[]
  try {
    const copyContext = `${briefingText}\n\n[BRAND ANALYSIS]\n${JSON.stringify(analysis, null, 2)}\n\n[CLIENT SCENE VISION]\n${visaoImagem || 'not specified'}`
    posts = await callAgent(anthropic, copyPrompt, copyContext, 4000, 0.8)
    if (!Array.isArray(posts)) posts = []
    agentLog.copywriter = { prompt: copyPrompt.slice(0, 500) + '...', output_count: posts.length }
  } catch {
    posts = []
    agentLog.copywriter = { prompt: copyPrompt.slice(0, 500) + '...', error: true }
  }

  if (posts.length === 0) return []

  // Agent 3: Art Director (temp 0.5 — visual consistency)
  const artPrompt = artDirectorPrompt(posts, brand, visaoImagem, analysis)
  try {
    const artContext = `[BRAND ANALYSIS]\n${JSON.stringify(analysis, null, 2)}\n\n[POSTS TO ILLUSTRATE]\n${JSON.stringify(posts.map(p => ({ n: p.post_number, hook: p.hook, visual: p.visual_suggestion })))}`
    const imagePrompts = await callAgent(anthropic, artPrompt, artContext, 2000, 0.5)
    if (Array.isArray(imagePrompts)) {
      for (const ip of imagePrompts) {
        const post = posts.find(p => p.post_number === ip.post_number)
        if (post) post.image_prompt = ip.image_prompt
      }
    }
    agentLog.art_director = { prompt: artPrompt.slice(0, 500) + '...', output_count: imagePrompts?.length || 0 }
  } catch {
    for (const post of posts) {
      if (!post.image_prompt) post.image_prompt = `${brand.nome_marca || 'brand'} product, ${post.visual_suggestion || visaoImagem || 'natural setting'}`
    }
    agentLog.art_director = { prompt: artPrompt.slice(0, 500) + '...', fallback: true }
  }

  // Agent 4: Editor (temp 0.2 — correct, don't reinvent)
  const editPromptText = editorPrompt(posts, brand, analysis, visaoImagem)
  try {
    const edited = await callAgent(anthropic, editPromptText, '', 4000, 0.2)
    if (Array.isArray(edited) && edited.length === posts.length) posts = edited
    agentLog.editor = { prompt: editPromptText.slice(0, 500) + '...', corrections_applied: true }
  } catch {
    agentLog.editor = { prompt: editPromptText.slice(0, 500) + '...', skipped: true }
  }

  // Attach log to posts for transparency
  ;(posts as any).__agentLog = agentLog

  return posts
}

export async function POST(req: NextRequest) {
  let order_id: string | undefined
  let supabase: ReturnType<typeof supabaseAdmin> | undefined

  try {
    const body = await req.json()
    order_id = body.order_id
    const { user_id, email, name, product, structured_data, reference_image_url } = body
    supabase = supabaseAdmin()

    console.log(`[execute-product] Starting order=${order_id} product=${product}`)

    // Landing page: call Lovable Cloud directly (no self-fetch proxy)
    // Accept both "landing_page_copy" and "landing_page" (Rordens may use either)
    if (product === 'landing_page_copy' || product === 'landing_page') {
      await supabase.from('orders').update({ status: 'in_production' }).eq('id', order_id)
      try {
        const sd = structured_data || {}

        // Upload reference images to Supabase Storage
        const imagesArray: string[] = []
        if (sd.images?.length) {
          imagesArray.push(...sd.images)
        } else if (sd.imagens_referencia?.length) {
          for (let i = 0; i < sd.imagens_referencia.length; i++) {
            try {
              const b64 = sd.imagens_referencia[i]
              const buffer = Buffer.from(b64, 'base64')
              const path = `briefing/${order_id}/ref-${i}.png`
              await supabase.storage.from('imagens').upload(path, buffer, { contentType: 'image/png', upsert: true })
              const { data: urlData } = supabase.storage.from('imagens').getPublicUrl(path)
              if (urlData?.publicUrl) imagesArray.push(urlData.publicUrl)
            } catch (e) {
              console.error(`[execute-product] image upload ${i} failed:`, e)
            }
          }
        }

        // Map structured_data → Lovable Cloud payload (exact spec from Lovable)
        const payload = {
          // OBRIGATÓRIOS
          brand_name: `${sd.nome_marca || 'Marca'} ${sd.produto && sd.produto !== 'produto' ? sd.produto : ''}`.trim(),
          headline: sd.resumo || sd.nome_marca || 'Transforme seu negócio',
          cta_text: sd.cta_texto || 'Começar agora',
          // CORES
          primary_color: sd.cor_primaria || '#6C3AED',
          secondary_color: sd.cor_secundaria || '#1E1B4B',
          // CONTEXTO
          tone: [sd.tom, sd.estilo].filter(Boolean).join(' + ') || 'profissional e moderno',
          audience: sd.publico || 'empresas e profissionais',
          subheadline: sd.tagline || '',
          sections: sd.objetivos || ['Hero', 'Benefícios', 'Como Funciona', 'CTA final'],
          images: imagesArray,
          // CAMPOS EXTRAS
          ...(sd.cor_texto && { text_color: sd.cor_texto }),
          ...(sd.estilo && { style: sd.estilo }),
          ...(sd.palavras_chave && { keywords: sd.palavras_chave }),
          ...(sd.tagline && { tagline: sd.tagline }),
          ...(sd.tipografia && { typography: sd.tipografia }),
          ...(sd.visao_imagem && { image_description: sd.visao_imagem }),
        }

        console.log(`[execute-product] Calling Lovable Cloud for order=${order_id} brand=${payload.brand_name}`)

        const res = await fetch('https://ivflzjzmsynijynuphnr.supabase.co/functions/v1/gerar-landing-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const err = await res.text()
          console.error(`[execute-product] Lovable Cloud error ${res.status}:`, err.slice(0, 300))
          await supabase.from('orders').update({ status: 'failed' }).eq('id', order_id)
          return NextResponse.json({ error: 'Lovable Cloud error' }, { status: 502 })
        }

        const data = await res.json()
        const html = data.html || ''

        if (!html) {
          console.error('[execute-product] Lovable returned empty HTML')
          await supabase.from('orders').update({ status: 'failed' }).eq('id', order_id)
          return NextResponse.json({ error: 'Empty HTML' }, { status: 502 })
        }

        // Save choice
        const { data: existing } = await supabase.from('choices').select('id').eq('order_id', order_id).maybeSingle()
        const choicePayload = {
          html_content: html,
          content: { text: payload.headline, copy: payload },
          label: 'Landing Page',
          type: 'landing_page_copy',
          is_selected: false,
          position: 0,
        }
        if (existing?.id) {
          await supabase.from('choices').update(choicePayload).eq('id', existing.id)
        } else {
          await supabase.from('choices').insert({ ...choicePayload, order_id })
        }

        // Mark ready for approval
        await supabase.from('orders').update({ status: 'awaiting_approval', preview_text: payload.headline }).eq('id', order_id)
        await supabase.from('project_phases').update({ status: 'done', completed_at: new Date().toISOString() })
          .eq('order_id', order_id).in('phase_number', [1, 2, 3])

        console.log(`[execute-product] Landing page delivered for order=${order_id}`)
        return NextResponse.json({ ok: true, product: 'landing_page_copy', html: true })
      } catch (e: any) {
        console.error('[execute-product] landing error:', e.message)
        await supabase.from('orders').update({ status: 'failed' }).eq('id', order_id)
        return NextResponse.json({ error: e.message }, { status: 500 })
      }
    }

    const { data: existingChoices } = await supabase
      .from('choices').select('id').eq('order_id', order_id).limit(1)
    if (existingChoices && existingChoices.length > 0) {
      console.log(`[execute-product] SKIPPED — choices already exist for order=${order_id}`)
      return NextResponse.json({ success: true, order_id, skipped: true })
    }

    const gerarVideo = product === 'reels_script' && structured_data?.gerarVideo === true
    const cost = (CREDIT_COST[product] || 0) + (gerarVideo ? 25 : 0)
    if (cost > 0) {
      const { data: creditRow, error: creditError } = await supabase
        .from('credits').select('balance').eq('user_id', user_id).single()
      if (creditError || !creditRow || creditRow.balance < cost) {
        await supabase.from('orders').update({ status: 'failed' }).eq('id', order_id)
        return NextResponse.json({ error: 'Créditos insuficientes' }, { status: 402 })
      }
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const resend = new Resend(process.env.RESEND_API_KEY)
    const baseSystem = SYSTEM_PROMPTS[product as ProductId]
    const briefingText = JSON.stringify(structured_data, null, 2)

    const now = new Date().toISOString()
    await Promise.all([
      supabase.from('project_phases').update({ status: 'done', completed_at: now }).eq('order_id', order_id).eq('phase_number', 1),
      supabase.from('project_phases').update({ status: 'done', completed_at: now }).eq('order_id', order_id).eq('phase_number', 2),
      supabase.from('project_phases').update({ status: 'active', started_at: now }).eq('order_id', order_id).eq('phase_number', 3),
      supabase.from('project_steps').update({ status: 'done', completed_at: now }).eq('order_id', order_id).in('step_number', [1, 2, 3, 4, 5]),
      supabase.from('project_steps').update({ status: 'active' }).eq('order_id', order_id).eq('step_number', 6),
    ])

    // ── Content Pack: Multi-agent pipeline (structured JSON) ──
    // ── Other products: Single Haiku call per tone (legacy text) ──
    const isContentPack = product === 'content_pack'
    const quantidade = structured_data?.quantidade || 4
    const pilares = structured_data?.pilares_conteudo || structured_data?.pilares || ['Educativo', 'Bastidores', 'Prova Social', 'Conversão']
    const visaoImagem = structured_data?.visao_imagem || ''

    // Fetch full brand context for multi-agent pipeline
    const { data: brandRow } = await supabase
      .from('brand_contexts').select('*').eq('user_id', user_id).limit(1).single()
    const brand: Record<string, any> = {
      nome_marca: structured_data?.nome_marca || brandRow?.nome_marca || '',
      tom: structured_data?.tom || brandRow?.tom || '',
      cor_primaria: structured_data?.cor_primaria || brandRow?.cor_primaria || '#111',
      cor_secundaria: structured_data?.cor_secundaria || brandRow?.cor_secundaria || '#fff',
      estilo_visual: structured_data?.estilo_visual || brandRow?.estilo_visual || 'clean',
      publico: structured_data?.publico_detalhado || structured_data?.publico || '',
      fonte_preferida: brandRow?.fonte_preferida || '',
    }

    let variations: { label: string; text?: string; posts?: StructuredPost[] }[]

    if (isContentPack) {
      // OPTIMIZATION: Brand Analyst runs ONCE (same result for all 3 tones)
      const analystPrompt = brandAnalystPrompt(brand)
      let sharedAnalysis: Record<string, any>
      const sharedAgentLog: Record<string, any> = {}
      try {
        sharedAnalysis = await callAgent(anthropic, analystPrompt, briefingText, 1000, 0.3)
        sharedAgentLog.brand_analyst = { prompt: analystPrompt, output: sharedAnalysis }
      } catch {
        sharedAnalysis = { business_summary: brand.descricao || structured_data?.descricao || '', target_audience_refined: brand.publico || '', tone_direction: '', content_angles: pilares, visual_keywords: [] }
        sharedAgentLog.brand_analyst = { prompt: analystPrompt, output: sharedAnalysis, fallback: true }
      }
      console.log(`[execute-product] Brand Analyst done: "${sharedAnalysis.business_summary?.slice(0, 60)}"`)

      // 3 tones in parallel — each runs Copywriter→ArtDirector→Editor (NOT Analyst again)
      const toneResults = await Promise.all(
        TONE_INSTRUCTIONS.map(async (tone) => {
          try {
            const posts = await generateContentPackWithAnalysis(anthropic, tone.label, briefingText, brand, visaoImagem, quantidade, pilares, sharedAnalysis, sharedAgentLog)
            if (posts.length === 0) return null
            return { label: tone.label, posts }
          } catch (err) {
            console.error(`[execute-product] Multi-agent ${tone.label} failed:`, (err as Error).message)
            return null
          }
        })
      )
      variations = toneResults.filter((v): v is { label: string; posts: StructuredPost[] } => v !== null && (v.posts?.length || 0) > 0)
    } else {
      // Legacy: single Haiku call per tone for non-content-pack products
      const SIMPLE_PRODUCTS = ['post_instagram', 'ad_copy', 'reels_script']
      const maxTokens = SIMPLE_PRODUCTS.includes(product) ? 4000 : 6000
      const toneResults = await Promise.all(
        TONE_INSTRUCTIONS.map(async (tone) => {
          try {
            const msg = await anthropic.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: maxTokens,
              system: `${baseSystem}\n\nTone for this variation: ${tone.label}. Generate ONE complete variation. Output ONLY the content text — no JSON, no wrapper, no label prefix.`,
              messages: [{ role: 'user', content: `BRIEFING DO CLIENTE:\n${briefingText}\n\nGenerate the complete deliverable in ${tone.label} tone now.` }],
            })
            const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
            return { label: tone.label, text: stripFences(text) }
          } catch (err) {
            console.error(`[execute-product] Tone ${tone.label} failed:`, (err as Error).message)
            return null
          }
        })
      )
      variations = toneResults.filter((v): v is { label: string; text: string } => v !== null && (v.text?.length || 0) > 50)
    }

    if (variations.length === 0) throw new Error('All tone generations failed')
    console.log(`[execute-product] Generated ${variations.length} variations for order=${order_id} (${isContentPack ? 'structured' : 'legacy'})`)

    const previewText = (variations[0]?.text || '').slice(0, 300)
    await supabase.from('orders').update({ preview_text: previewText }).eq('id', order_id)

    await supabase.from('choices').insert(
      variations.map((v, i) => ({
        order_id,
        type: product,
        label: v.label || TONE_INSTRUCTIONS[i]?.label || `Option ${i + 1}`,
        content: v.posts ? { posts: v.posts } : { text: stripFences(v.text || '') },
        agent_prompts: v.posts ? ((v.posts as any).__agentLog || {}) : {},
        is_selected: false,
        position: i,
      }))
    )

    await Promise.all([
      supabase.from('project_steps').update({ status: 'done', completed_at: new Date().toISOString() }).eq('order_id', order_id).eq('step_number', 6),
      supabase.from('project_steps').update({ status: 'active' }).eq('order_id', order_id).eq('step_number', 7),
    ])

    await supabase.from('iterations').insert({
      order_id,
      iteration_num: 1,
      status: 'pending_choices',
      choices_sent_at: new Date().toISOString(),
    })

    if (cost > 0) {
      const { data: creditRow } = await supabase.from('credits').select('balance').eq('user_id', user_id).single()
      if (creditRow) {
        await supabase.from('credits').update({ balance: creditRow.balance - cost }).eq('user_id', user_id)
        await supabase.from('credit_transactions').insert({
          user_id, amount: -cost, type: 'debit',
          description: `Geração de ${PRODUCT_NAMES[product as ProductId] || product}`,
          order_id,
        })
      }
    }

    const imageSlug = structured_data?.image_slug || IMAGE_PRODUCTS[product]
    if (imageSlug) {
      const { data: insertedChoices } = await supabase
        .from('choices').select('id, position, label, content').eq('order_id', order_id).order('position')

      if (insertedChoices?.length) {
        let imageCount = 0
        for (const choice of insertedChoices) {
          if (isContentPack && choice.content?.posts?.length > 0) {
            // Structured: fire image for FIRST post only (preview). Remaining on approval.
            const firstPost = choice.content.posts[0]
            fireImageGeneration({
              order_id: order_id!,
              choice_id: choice.id,
              choice_position: choice.position,
              post_number: 1,
              image_prompt: firstPost.image_prompt,
              product,
              brand,
              visao_imagem: visaoImagem || null,
            })
            imageCount++
          } else {
            // Legacy: one image per choice using visao_imagem
            fireImageGeneration({
              order_id: order_id!,
              choice_id: choice.id,
              choice_position: choice.position,
              choice_text: choice.content?.text || '',
              product,
              brand,
              briefing_text: briefingText,
              visao_imagem: visaoImagem || null,
            })
            imageCount++
          }
        }
        console.log(`[execute-product] Fired ${imageCount} image jobs`)

        if (gerarVideo && insertedChoices?.length) {
          for (const choice of insertedChoices) {
            const text = choice.content?.text || ''
            const hookMatch = text.match(/HOOK[^:]*:\s*([^\n]+)/i)
            const cenas: any[] = []
            const sectionMatches = text.matchAll(/\[(\d+)-(\d+)s\]\s*([^\n]+(?:\n(?!\[)[^\n]*)*)|\bCENA\s*#?(\d+)[^:]*:\s*([^\n]+(?:\n(?!\bCENA)[^\n]*)*)/gi)
            let sceneNum = 1
            for (const m of sectionMatches) {
              const desc = (m[3] || m[5] || '').trim().slice(0, 200)
              if (desc) {
                cenas.push({
                  numero: sceneNum++,
                  duracao_segundos: 5,
                  descricao_visual: desc.split('\n')[0],
                  fala: desc,
                  movimento: 'smooth cinematic camera motion',
                })
              }
            }
            if (cenas.length === 0) {
              const lines = text.split('\n').filter((l: string) => l.trim().length > 20)
              for (let i = 0; i < Math.min(lines.length, 5); i++) {
                cenas.push({
                  numero: i + 1,
                  duracao_segundos: 5,
                  descricao_visual: lines[i].trim().slice(0, 150),
                  fala: lines[i].trim(),
                  movimento: 'smooth cinematic camera motion',
                })
              }
            }
            const roteiro = { hook: hookMatch?.[1] || '', cenas: cenas.slice(0, 8), cta: '' }
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            fetch(`${baseUrl}/api/generate-video`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id,
                choice_id: choice.id,
                roteiro,
                estilo_video: structured_data?.estiloVideo || 'slideshow_cinematografico',
                proporcao: structured_data?.proporcao || '9:16',
              }),
            }).catch(e => console.error('[fire-video] fetch error:', e))
          }
        }
      }
    }

    const { data: order } = await supabase.from('orders').select('order_number').eq('id', order_id).single()
    const productName = PRODUCT_NAMES[product as ProductId]
    const choicesUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cliente/pedidos/${order_id}`

    resend.emails.send({
      from: 'Voku <ola@voku.one>',
      to: email,
      subject: `✦ Your 3 ${productName} options are ready`,
      html: `
        <div style="font-family: 'Helvetica Neue', sans-serif; background: #0A0A0A; color: #F0F0EC; padding: 40px; max-width: 560px; margin: 0 auto; border-radius: 12px;">
          <div style="color: #C8F135; font-size: 20px; font-weight: bold; margin-bottom: 24px;">✦ VOKU</div>
          <h2 style="color: #FFFFFF; font-size: 18px; margin-bottom: 8px;">Your options are ready, ${name}.</h2>
          <p style="color: #888; font-size: 14px; line-height: 1.6;">We generated ${variations.length} variations of your ${productName}. Pick your favorite, add notes if needed, and approve.</p>
          <div style="margin: 24px 0;">
            <a href="${choicesUrl}" style="background: #C8F135; color: #0A0A0A; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">Choose your favorite →</a>
          </div>
          <p style="color: #555; font-size: 12px;">Order #${order?.order_number} · Don't like any of them? Reply to this email and we'll redo it.</p>
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1F1F1F; color: #333; font-size: 11px;">Voku LLC · Wyoming, USA · voku.one</div>
        </div>
      `,
    }).catch(e => console.error('Resend email error:', e))

    console.log(`[execute-product] Completed for order=${order_id}`)
    return NextResponse.json({ success: true, order_id, choices: variations.length, preview_text: previewText })

  } catch (err) {
    console.error(`[execute-product] FAILED for order=${order_id}:`, err)
    if (supabase && order_id) {
      try { await supabase.from('orders').update({ status: 'failed' }).eq('id', order_id) } catch {}
    }
    return NextResponse.json({ error: 'Execution error' }, { status: 500 })
  }
}
