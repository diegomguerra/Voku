import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/image-engine/router'
import { ImageSlug } from '@/lib/image-engine/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const {
      order_id,
      choice_id,
      choice_position,
      choice_label,
      choice_text,
      slug,
      brand,
      reference_image_url,
      briefing_text,
      product,
    } = await req.json()

    if (!order_id || !choice_id || !slug || !choice_text) {
      return NextResponse.json(
        { error: 'order_id, choice_id, slug, and choice_text are required' },
        { status: 400 }
      )
    }

    const result = await generateImage({
      slug: slug as ImageSlug,
      product,
      briefing_text: briefing_text || '',
      choice_label: choice_label || '',
      choice_text,
      brand: brand || {},
      reference_image_url,
      order_id,
      choice_id,
      choice_position: choice_position ?? 0,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('Image generation error:', err)
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
