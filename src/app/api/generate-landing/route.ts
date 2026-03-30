import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, choice_id, structured_data, user_id } = body;

    if (!structured_data) {
      return NextResponse.json({ error: 'structured_data obrigatorio' }, { status: 400 });
    }

    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Chama a Edge Function gerar-landing-page (nome real no Supabase)
    const res = await fetch(`${supabaseUrl}/functions/v1/gerar-landing-page`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ order_id, choice_id, user_id, structured_data }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      console.error('[generate-landing] Edge error:', data.error);
      return NextResponse.json({ error: data.error || 'Falha ao gerar' }, { status: 502 });
    }

    // Inject logo into generated HTML if available
    const logoBase64 = structured_data?.brand_context?.logo_base64;
    const logoUrl = structured_data?.brand_context?.logo_url;
    const logoSrc = logoBase64 || logoUrl;
    if (logoSrc && data.html) {
      // Replace text-only logo with <img> logo in nav
      data.html = data.html.replace(
        /<a\s+href="#"\s+class="logo">[^<]*<\/a>/i,
        `<a href="#" class="logo"><img src="${logoSrc}" alt="${structured_data?.brand_context?.nome_marca || ''}" style="height:36px;object-fit:contain;" /></a>`
      );
      // Also replace hero badge if it just has the brand name
      const nomeMarca = structured_data?.brand_context?.nome_marca || '';
      if (nomeMarca) {
        data.html = data.html.replace(
          new RegExp(`<div class="hero-badge">✦\\s*${nomeMarca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</div>`, 'i'),
          `<div class="hero-badge"><img src="${logoSrc}" alt="${nomeMarca}" style="height:20px;object-fit:contain;vertical-align:middle;margin-right:6px;" /> ${nomeMarca}</div>`
        );
      }
    }

    // Upsert: atualiza choice existente OU cria novo
    if (order_id && user_id && data.html) {
      const sb = createClient(supabaseUrl, serviceKey);

      const { data: existing } = await sb
        .from('choices')
        .select('id')
        .eq('order_id', order_id)
        .maybeSingle();

      const choicePayload = {
        html_content: data.html,
        content: { text: 'Landing page gerada', copy: data.copy },
        label: 'Landing Page',
        type: 'landing_page_copy',
        image_url: null,
        is_selected: true,
        position: 0,
      };

      if (existing?.id) {
        await sb.from('choices').update(choicePayload).eq('id', existing.id);
      } else {
        await sb.from('choices').insert({ ...choicePayload, order_id });
      }

      // Marca order como entregue
      await sb.from('orders').update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      }).eq('id', order_id);
    }

    return NextResponse.json({ ok: true, html: data.html, copy: data.copy });

  } catch (err: any) {
    console.error('[generate-landing] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
