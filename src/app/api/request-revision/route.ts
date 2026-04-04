import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ProductId } from '@/lib/products'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Strip markdown code fences from a string (```json ... ```) */
function stripFences(s: string): string {
  return s.replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()
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

/**
 * Fire-and-forget image generation via /api/generate-image
 */
function fireImageGeneration(params: {
  order_id: string
  choice_id: string
  choice_position: number
  choice_label: string
  choice_text: string
  slug: string
  brand: Record<string, string>
  reference_image_url?: string
  briefing_text: string
  product: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  fetch(`${baseUrl}/api/generate-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).catch(e => console.error('[fire-image-revision] fetch error:', e))
}

/**
 * POST /api/request-revision
 *
 * body: {
 *   order_id: string
 *   user_id: string
 *   type: 'new_variations' | 'new_images' | 'revision'
 *   notes?: string
 *   choice_id?: string  // required for type='revision'
 * }
 *
 * - new_variations: Apaga choices, gera 3 novas + imagens, reseta fases
 * - new_images: Limpa image_url das choices, regenera imagens
 * - revision: Reescreve 1 choice com notes, regenera imagem dela
 *
 * NÃO cobra créditos — revisão é gratuita.
 */
export async function POST(req: NextRequest) {
  const supabase = supabaseAdmin()

  try {
    const { order_id, user_id, type, notes, choice_id } = await req.json()

    if (!order_id || !user_id || !type) {
      return NextResponse.json({ error: 'order_id, user_id, and type are required' }, { status: 400 })
    }

    // Fetch order details
    const { data: order, error: orderErr } = await supabase
      .from('orders').select('*').eq('id', order_id).single()
    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const product = order.product as string
    const briefingText = order.structured_data ? JSON.stringify(order.structured_data, null, 2) : ''

    // Fetch brand context
    const { data: brandRow } = await supabase
      .from('brand_contexts').select('nome_marca, tom').eq('user_id', user_id).limit(1).single()
    const brand: Record<string, string> = brandRow
      ? { nome_marca: brandRow.nome_marca || '', tom: brandRow.tom || '' }
      : {}

    const imageSlug = order.structured_data?.image_slug || IMAGE_PRODUCTS[product]

    // ────────────────────────────────────────
    // TYPE: new_variations — 3 novas opções completas
    // ────────────────────────────────────────
    if (type === 'new_variations') {
      console.log(`[request-revision] new_variations for order=${order_id}`)

      // Delete old choices
      await supabase.from('choices').delete().eq('order_id', order_id)

      // Reset phases back to production (phase 3)
      const now = new Date().toISOString()
      await Promise.all([
        supabase.from('project_phases').update({ status: 'active', started_at: now, completed_at: null }).eq('order_id', order_id).eq('phase_number', 3),
        supabase.from('project_phases').update({ status: 'pending', started_at: null, completed_at: null }).eq('order_id', order_id).eq('phase_number', 4),
        supabase.from('project_steps').update({ status: 'active', completed_at: null }).eq('order_id', order_id).eq('step_number', 6),
        supabase.from('project_steps').update({ status: 'pending', completed_at: null }).eq('order_id', order_id).eq('step_number', 7),
        supabase.from('project_steps').update({ status: 'pending', completed_at: null }).eq('order_id', order_id).eq('step_number', 8),
        supabase.from('project_steps').update({ status: 'pending', completed_at: null }).eq('order_id', order_id).in('step_number', [9, 10, 11]),
        supabase.from('orders').update({ status: 'in_production' }).eq('id', order_id),
      ])

      // Generate 3 new variations with Anthropic
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 6000,
        system: `You are RORDENS, Voku's execution engine. Generate 3 NEW and DIFFERENT variations.
${notes ? `CLIENT FEEDBACK: "${notes}" — incorporate this feedback into all variations.` : ''}

Return a JSON array with exactly 3 objects:
[
  { "label": "Option A — Direct & bold tone", "text": "...full content here..." },
  { "label": "Option B — Consultive & empathetic tone", "text": "...full content here..." },
  { "label": "Option C — Creative & provocative tone", "text": "...full content here..." }
]
Only output the JSON array, no other text.`,
        messages: [{
          role: 'user',
          content: `PRODUCT TYPE: ${product}\nBRIEFING:\n${briefingText}\n\nGenerate 3 completely new variations.`,
        }],
      })

      const rawOutput = message.content[0].type === 'text' ? message.content[0].text : '[]'
      let variations: { label: string; text: string }[]
      try {
        const cleaned = rawOutput.replace(/```(?:json|JSON)?\s*\n?/g, '').trim()
        const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
        if (!jsonMatch) throw new Error('No JSON array found')
        variations = JSON.parse(jsonMatch[0])
        if (!Array.isArray(variations) || variations.length === 0) throw new Error('Empty')
      } catch {
        variations = [{ label: 'Option A', text: rawOutput }]
      }
      variations = variations.slice(0, 3)

      // Insert new choices
      await supabase.from('choices').insert(
        variations.map((v, i) => ({
          order_id,
          type: product,
          label: v.label || `Option ${String.fromCharCode(65 + i)}`,
          content: { text: stripFences(v.text || '') },
          is_selected: false,
          position: i,
        }))
      )

      // Mark text generation step (6) done, image step (7) active
      await Promise.all([
        supabase.from('project_steps').update({ status: 'done', completed_at: new Date().toISOString() }).eq('order_id', order_id).eq('step_number', 6),
        supabase.from('project_steps').update({ status: 'active' }).eq('order_id', order_id).eq('step_number', 7),
      ])

      // Fire image generation
      if (imageSlug) {
        const { data: newChoices } = await supabase
          .from('choices').select('id, position, label, content').eq('order_id', order_id).order('position')
        if (newChoices?.length) {
          for (const choice of newChoices) {
            fireImageGeneration({
              order_id,
              choice_id: choice.id,
              choice_position: choice.position,
              choice_label: choice.label || '',
              choice_text: choice.content?.text || '',
              slug: imageSlug,
              brand,
              briefing_text: briefingText,
              product,
            })
          }
        }
      }

      return NextResponse.json({ success: true, type: 'new_variations', choices: variations.length })
    }

    // ────────────────────────────────────────
    // TYPE: new_images — regenera imagens para choices existentes
    // ────────────────────────────────────────
    if (type === 'new_images') {
      console.log(`[request-revision] new_images for order=${order_id}`)

      // Clear existing image_urls
      await supabase.from('choices').update({ image_url: null }).eq('order_id', order_id)

      // Reset image step (7) to active, keep phase 3 active, reset phase 4 to pending
      await Promise.all([
        supabase.from('project_steps').update({ status: 'active', completed_at: null }).eq('order_id', order_id).eq('step_number', 7),
        supabase.from('project_phases').update({ status: 'active', completed_at: null }).eq('order_id', order_id).eq('phase_number', 3),
        supabase.from('project_phases').update({ status: 'pending', started_at: null }).eq('order_id', order_id).eq('phase_number', 4),
        supabase.from('project_steps').update({ status: 'pending' }).eq('order_id', order_id).eq('step_number', 9),
      ])

      // Fire image generation
      if (imageSlug) {
        const { data: choices } = await supabase
          .from('choices').select('id, position, label, content').eq('order_id', order_id).order('position')
        if (choices?.length) {
          for (const choice of choices) {
            fireImageGeneration({
              order_id,
              choice_id: choice.id,
              choice_position: choice.position,
              choice_label: choice.label || '',
              choice_text: choice.content?.text || '',
              slug: imageSlug,
              brand,
              briefing_text: briefingText,
              product,
            })
          }
        }
      }

      return NextResponse.json({ success: true, type: 'new_images' })
    }

    // ────────────────────────────────────────
    // TYPE: revision — reescreve 1 choice específica
    // ────────────────────────────────────────
    if (type === 'revision') {
      if (!choice_id) {
        return NextResponse.json({ error: 'choice_id is required for revision' }, { status: 400 })
      }

      console.log(`[request-revision] revision for choice=${choice_id}`)

      // Fetch the choice to revise
      const { data: choice, error: choiceErr } = await supabase
        .from('choices').select('*').eq('id', choice_id).single()
      if (choiceErr || !choice) {
        return NextResponse.json({ error: 'Choice not found' }, { status: 404 })
      }

      const originalText = choice.content?.text || ''

      // Rewrite with Anthropic
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: `You are RORDENS, Voku's execution engine. Revise the content based on client feedback.
Keep the same format and structure but apply the requested changes.
Output ONLY the revised content text, no JSON wrapper, no labels.`,
        messages: [{
          role: 'user',
          content: `ORIGINAL CONTENT:\n${originalText}\n\nCLIENT FEEDBACK:\n${notes || 'Improve overall quality'}\n\nRevise now.`,
        }],
      })

      const revisedText = message.content[0].type === 'text' ? message.content[0].text : originalText

      // Update the choice
      await supabase.from('choices').update({
        content: { text: stripFences(revisedText) },
        image_url: null, // Clear image so it regenerates
        is_selected: false,
      }).eq('id', choice_id)

      // Fire single image regeneration
      if (imageSlug) {
        fireImageGeneration({
          order_id,
          choice_id,
          choice_position: choice.position,
          choice_label: choice.label || '',
          choice_text: revisedText,
          slug: imageSlug,
          brand,
          briefing_text: briefingText,
          product,
        })
      }

      return NextResponse.json({ success: true, type: 'revision', choice_id })
    }

    return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })

  } catch (err) {
    console.error('[request-revision] Error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
