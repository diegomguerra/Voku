import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { descricao, choice_id, tipos, arquivos_referencia } = await req.json();
    const sb = supabaseAdmin();

    // Save structured revision to revisoes table
    await sb.from("revisoes").insert({
      order_id: params.orderId,
      choice_id: choice_id || null,
      tipos: tipos || [],
      descricao,
      arquivos_referencia: arquivos_referencia || [],
      status: "pendente",
    });

    // Also insert into platform_messages for existing notification flow
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

    // Set order back to in_production
    await sb.from("orders").update({ status: "in_production" }).eq("id", params.orderId);

    // Reset production phases
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
