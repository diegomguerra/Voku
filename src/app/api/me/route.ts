import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: credits } = await supabase
    .from("credits")
    .select("balance, plan")
    .eq("user_id", user.id)
    .single();

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, product, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    id: user.id,
    name: profile?.full_name || user.email?.split("@")[0] || "você",
    email: user.email,
    plan: credits?.plan || "free",
    credits: credits?.balance || 0,
    recent_orders: recentOrders || [],
  });
}
