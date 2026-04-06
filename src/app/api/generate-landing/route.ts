import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 120;

const EDGE_FUNCTION_URL =
  "https://ivflzjzmsynijynuphnr.supabase.co/functions/v1/gerar-landing-page";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, user_id, structured_data } = body;

    // Build payload for Lovable Cloud from structured_data
    const brand = structured_data?.brand_context || structured_data || {};
    const payload = {
      brand_name: brand.nome_marca || structured_data?.nome_marca || "Marca",
      headline: brand.headline || structured_data?.headline || structured_data?.resumo || "Transforme seu negócio",
      cta_text: brand.cta_text || structured_data?.cta_texto || "Começar agora",
      primary_color: brand.cor_primaria || "#6C3AED",
      secondary_color: brand.cor_secundaria || "#1E1B4B",
      tone: brand.tom || structured_data?.tom || "profissional e moderno",
      audience: brand.publico || structured_data?.publico || "empresas e profissionais",
      subheadline: brand.subheadline || structured_data?.subheadline || "",
      sections: structured_data?.sections || ["Hero", "Benefícios", "Como Funciona", "CTA final"],
      images: structured_data?.images || [],
    };

    // Validate required fields
    if (!payload.brand_name || !payload.headline || !payload.cta_text) {
      return NextResponse.json(
        { error: "brand_name, headline e cta_text são obrigatórios" },
        { status: 400 }
      );
    }

    console.log(`[generate-landing] Calling Lovable Cloud for order=${order_id} brand=${payload.brand_name}`);

    // Call Lovable Cloud Edge Function
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[generate-landing] Lovable error ${response.status}:`, errText.slice(0, 300));

      // Mark order as failed
      if (order_id) {
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await sb.from("orders").update({ status: "failed" }).eq("id", order_id);
      }

      return NextResponse.json(
        { error: `Lovable Cloud error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const html = data.html || "";

    if (!html) {
      return NextResponse.json({ error: "Lovable returned empty HTML" }, { status: 502 });
    }

    // Save choice and mark delivered
    if (order_id) {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Upsert choice
      const { data: existing } = await sb
        .from("choices")
        .select("id")
        .eq("order_id", order_id)
        .maybeSingle();

      const choicePayload = {
        html_content: html,
        content: { text: payload.headline, copy: payload },
        label: "Landing Page",
        type: "landing_page_copy",
        is_selected: false,
        position: 0,
      };

      if (existing?.id) {
        await sb.from("choices").update(choicePayload).eq("id", existing.id);
      } else {
        await sb.from("choices").insert({ ...choicePayload, order_id });
      }

      // Mark order as ready for approval (not auto-delivered)
      await sb.from("orders").update({
        status: "awaiting_approval",
        preview_text: payload.headline,
      }).eq("id", order_id);

      // Update phases
      await sb.from("project_phases").update({ status: "done", completed_at: new Date().toISOString() })
        .eq("order_id", order_id).in("phase_number", [1, 2, 3]);

      console.log(`[generate-landing] Choice saved, order=${order_id} ready for approval`);
    }

    return NextResponse.json({ ok: true, html, metadata: data.metadata });
  } catch (err: any) {
    console.error("[generate-landing] Error:", err.message);

    // Try to mark order as failed
    try {
      const body = await (err as any)._body;
      if (body?.order_id) {
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await sb.from("orders").update({ status: "failed" }).eq("id", body.order_id);
      }
    } catch {}

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
