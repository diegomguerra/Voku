import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { action, feedback } = body;
    const sb = supabaseAdmin();

    if (action === "approve") {
      const { error } = await sb
        .from("deliverables")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Also update order status
      const { data: del } = await sb.from("deliverables").select("order_id").eq("id", id).single();
      if (del?.order_id) {
        await sb.from("orders").update({ status: "delivered" }).eq("id", del.order_id);
      }

      return NextResponse.json({ success: true, status: "approved" });
    }

    if (action === "reject") {
      const { error } = await sb
        .from("deliverables")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
          feedback: feedback || null,
        })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ success: true, status: "rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("deliverables")
      .select("*")
      .eq("id", params.id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
