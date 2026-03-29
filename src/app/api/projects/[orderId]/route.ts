import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { status, choice_aprovada } = await req.json();
    const sb = supabaseAdmin();

    const update: Record<string, any> = {};
    if (status) update.status = status;
    if (choice_aprovada) update.choice_aprovada = choice_aprovada;
    if (status === "delivered") update.delivered_at = new Date().toISOString();

    const { error } = await sb.from("orders").update(update).eq("id", params.orderId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If approving, mark all phases/steps as done
    if (status === "delivered") {
      const now = new Date().toISOString();
      await Promise.all([
        sb.from("project_steps").update({ status: "done", completed_at: now }).eq("order_id", params.orderId).neq("status", "done"),
        sb.from("project_phases").update({ status: "done", completed_at: now }).eq("order_id", params.orderId).neq("status", "done"),
      ]);
      // Mark selected choice
      if (choice_aprovada) {
        await sb.from("choices").update({ is_selected: false }).eq("order_id", params.orderId);
        await sb.from("choices").update({ is_selected: true }).eq("id", choice_aprovada);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
