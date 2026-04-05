import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 120;

const LOVABLE_ENDPOINT = 'https://ivflzjzmsynijynuphnr.supabase.co/functions/v1/gerar-landing-page';

/** Claude generates the landing page copy (headline, subheadline, CTA, sections) */
async function generateCopy(anthropic: Anthropic, briefing: any, brand: any) {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: `You are a conversion copywriter. Generate landing page copy in the language of the briefing (Portuguese BR by default).

Return a JSON object:
{
  "headline": "main headline, max 10 words, impact-oriented",
  "subheadline": "supporting text, 1-2 sentences explaining the value",
  "cta_text": "CTA button text, max 5 words, action-oriented",
  "sections": [
    { "title": "section title", "body": "2-3 sentences", "type": "benefits|social_proof|how_it_works|faq|guarantee" }
  ]
}

Generate 4-5 sections. Make the copy direct, conversion-focused, no fluff.
Return ONLY valid JSON.`,
    messages: [{
      role: 'user',
      content: `BRAND: ${brand.nome_marca || ''}\nTONE: ${brand.tom || 'professional'}\nAUDIENCE: ${briefing.publico || ''}\nBRIEFING:\n${JSON.stringify(briefing, null, 2)}\n\nGenerate the landing page copy now.`,
    }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  try {
    return JSON.parse(text.replace(/```json\n?/g, '').replace(/```/g, '').trim());
  } catch {
    return { headline: brand.nome_marca || 'Welcome', subheadline: briefing.descricao || '', cta_text: 'Start Now' };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, user_id, structured_data } = body;

    if (!structured_data) {
      return NextResponse.json({ error: 'structured_data obrigatorio' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const sb = createClient(supabaseUrl, serviceKey);

    // 1. Get brand context
    const { data: brandRow } = await sb
      .from('brand_contexts')
      .select('*')
      .eq('user_id', user_id)
      .limit(1)
      .single();

    const brand = {
      nome_marca: structured_data?.nome_marca || brandRow?.nome_marca || '',
      tom: structured_data?.tom || brandRow?.tom || 'profissional',
      cor_primaria: structured_data?.cor_primaria || brandRow?.cor_primaria || '#6C3AED',
      cor_secundaria: structured_data?.cor_secundaria || brandRow?.cor_secundaria || '#1E1B4B',
      publico: structured_data?.publico || '',
    };

    // 2. Generate copy with Sonnet
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const copy = await generateCopy(anthropic, structured_data, brand);
    console.log(`[generate-landing] Copy generated: ${copy.headline}`);

    // 3. Generate hero image with FAL.ai (fire-and-forget for now, use URL later)
    const imageUrls: string[] = [];
    // TODO: integrate per-section images from Art Director

    // 4. Call Lovable Cloud to assemble the HTML
    const lovableRes = await fetch(LOVABLE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand_name: brand.nome_marca,
        primary_color: brand.cor_primaria,
        secondary_color: brand.cor_secundaria,
        tone: brand.tom,
        audience: brand.publico,
        headline: copy.headline,
        subheadline: copy.subheadline,
        cta_text: copy.cta_text,
        sections: copy.sections?.map((s: any) => s.title) || ['Benefícios', 'Como Funciona', 'Depoimentos'],
        images: imageUrls,
      }),
    });

    if (!lovableRes.ok) {
      const errText = await lovableRes.text();
      console.error(`[generate-landing] Lovable error ${lovableRes.status}:`, errText.slice(0, 300));
      return NextResponse.json({ error: `Lovable Cloud error: ${lovableRes.status}` }, { status: 502 });
    }

    const lovableData = await lovableRes.json();
    let html = lovableData.html || '';

    if (!html) {
      return NextResponse.json({ error: 'Lovable returned empty HTML' }, { status: 502 });
    }

    // 5. Inject logo if available
    const logoSrc = structured_data?.brand_context?.logo_base64 || structured_data?.brand_context?.logo_url || brandRow?.logo_url;
    if (logoSrc && html) {
      html = html.replace(
        /<a\s+href="#"\s+class="logo">[^<]*<\/a>/i,
        `<a href="#" class="logo"><img src="${logoSrc}" alt="${brand.nome_marca}" style="height:36px;object-fit:contain;" /></a>`
      );
    }

    // 6. Save as choice and mark delivered
    if (order_id && user_id) {
      const { data: existing } = await sb.from('choices').select('id').eq('order_id', order_id).maybeSingle();

      const choicePayload = {
        html_content: html,
        content: { text: copy.headline, copy },
        label: 'Landing Page',
        type: 'landing_page_copy',
        is_selected: true,
        position: 0,
      };

      if (existing?.id) {
        await sb.from('choices').update(choicePayload).eq('id', existing.id);
      } else {
        await sb.from('choices').insert({ ...choicePayload, order_id });
      }

      await sb.from('orders').update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      }).eq('id', order_id);
    }

    console.log(`[generate-landing] Delivered via Lovable Cloud for order=${order_id}`);
    return NextResponse.json({ ok: true, html, copy, metadata: lovableData.metadata });

  } catch (err: any) {
    console.error('[generate-landing] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
