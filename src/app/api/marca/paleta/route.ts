import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// GET — return saved brand palette for current user
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ cores: [] });
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await sb.auth.getUser(token);
    if (!user) return NextResponse.json({ cores: [] });

    const admin = supabaseAdmin();
    const { data } = await admin
      .from("marca_paleta")
      .select("cores")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({ cores: data?.cores || [] });
  } catch {
    return NextResponse.json({ cores: [] });
  }
}
