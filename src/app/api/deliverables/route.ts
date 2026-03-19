import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

// POST — create a deliverable
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("cookie") || "";
    const sb = supabase();
    const { data: { user } } = await sb.auth.getUser();

    // Fallback: try to get user_id from body if no auth session (server-side call)
    const body = await req.json();
    const userId = user?.id || body.user_id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("deliverables")
      .insert({
        user_id: userId,
        order_id: body.order_id || null,
        title: body.title,
        content: body.content,
        type: body.type || "copy",
        status: body.status || "pending",
        file_name: body.title ? `${body.title.slice(0, 50).replace(/[^a-zA-Z0-9]/g, "_")}.txt` : "deliverable.txt",
        file_path: "",
        file_type: "txt",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deliverable: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET — list deliverables for current user
export async function GET(req: NextRequest) {
  try {
    const sb = supabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");

    const admin = supabaseAdmin();
    let query = admin
      .from("deliverables")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (orderId) query = query.eq("order_id", orderId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deliverables: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
