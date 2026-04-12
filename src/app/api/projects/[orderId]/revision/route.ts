import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { refineLanding, getExistingLandingHtml } from "@/lib/lovable-payload";

export const maxDuration = 120;

export async function POST(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { descricao, choice_id, tipos, arquivos_referencia } = await req.json();
    const sb = supabaseAdmin();

    await sb.from("revisoes").insert({
      order_id: params.orderId,
      choice_id: choice_id || null,
      tipos: tipos || [],
      descricao,
      arquivos_referencia: arquivos_referencia || [],
      status: "pendente",
    });

    await sb.from("platform_messages").insert({
      order_id: params.orderId,
      sender: "client",
      content: descricao,
      metadata: {
        type: "revision_request",
        choice_id,
        tipos: tipos || [],
        arquivos_referencia: arquivos_referencia || [],
      },
    });

    // If this is a landing page order, refine the existing HTML in place
    const { data: order } = await sb
      .from("orders")
      .select("product")
      .eq("id", params.orderId)
      .maybeSingle();

    const isLanding =
      order?.product === "landing_page_copy" || order?.product === "landing_page";

    if (isLanding && descricao) {
      const existing = await getExistingLandingHtml(sb, params.orderId);
      if (existing?.html) {
        await sb.from("orders").update({ status: "in_production" }).eq("id", params.orderId);

        const result = await refineLanding(existing.html, descricao);
        if (result.ok && result.html) {
          await sb
            .from("choices")
            .update({
              html_content: result.html,
              content: { text: descricao.slice(0, 300), refinement_instructions: descricao },
            })
            .eq("id", existing.choice_id);

          await sb
            .from("orders")
            .update({ status: "awaiting_approval", preview_text: descricao.slice(0, 300) })
            .eq("id", params.orderId);

          await sb
            .from("revisoes")
            .update({ status: "aplicada" })
            .eq("order_id", params.orderId)
            .eq("status", "pendente");

          return NextResponse.json({ ok: true, refined: true });
        }

        console.error("[revision] Lovable refine failed:", result.status, result.error);
        await sb.from("orders").update({ status: "in_production" }).eq("id", params.orderId);
        return NextResponse.json({ ok: true, refined: false, error: result.error }, { status: 200 });
      }
    }

    // Non-landing orders (or no existing HTML): reset phases so the team picks it up
    await sb.from("orders").update({ status: "in_production" }).eq("id", params.orderId);
    const now = new Date().toISOString();
    await Promise.all([
      sb.from("project_phases").update({ status: "active", started_at: now, completed_at: null }).eq("order_id", params.orderId).eq("phase_number", 3),
      sb.from("project_phases").update({ status: "pending", started_at: null, completed_at: null }).eq("order_id", params.orderId).eq("phase_number", 4),
      sb.from("project_steps").update({ status: "active", completed_at: null }).eq("order_id", params.orderId).eq("step_number", 6),
      sb.from("project_steps").update({ status: "pending", completed_at: null }).eq("order_id", params.orderId).in("step_number", [7, 8, 9, 10, 11]),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
