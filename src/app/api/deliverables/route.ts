import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST — create a deliverable
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.user_id;
    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("deliverables")
      .insert({
        user_id: userId,
        order_id: body.order_id || null,
        title: body.title || "Entrega",
        content: body.content || "",
        type: body.type || "copy",
        status: body.status || "pending",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deliverable: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET — list deliverables (by user_id query param or order_id)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const orderId = searchParams.get("order_id");

    if (!userId && !orderId) {
      return NextResponse.json({ error: "user_id or order_id required" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    let query = sb
      .from("deliverables")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) query = query.eq("user_id", userId);
    if (orderId) query = query.eq("order_id", orderId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deliverables: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
