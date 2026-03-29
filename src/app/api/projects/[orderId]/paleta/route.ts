import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// PATCH — save palette + color assignments to project, and persist to brand palette
export async function PATCH(req: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { cores, atribuicoes } = await req.json();
    const admin = supabaseAdmin();

    // Save to project
    const update: Record<string, unknown> = {};
    if (cores) update.paleta_cores = cores;
    if (atribuicoes) update.atribuicoes_cores = atribuicoes;

    const { error } = await admin.from("orders").update(update).eq("id", params.orderId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Also persist to user's brand palette (if we can identify the user)
    if (cores?.length > 0) {
      const { data: order } = await admin.from("orders").select("user_id").eq("id", params.orderId).single();
      if (order?.user_id) {
        await admin.from("marca_paleta").upsert(
          { user_id: order.user_id, cores, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
