import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_CREDITS: Record<string, number> = {
  starter: 100,
  pro: 300,
  business: 800,
  enterprise: 2000,
};

export async function POST(req: NextRequest) {
  try {
    const { referred_user_id, plan_slug } = await req.json();

    // Find referred_by from profiles
    const { data: profile } = await getSupabase()
      .from("profiles")
      .select("referred_by")
      .eq("id", referred_user_id)
      .single();

    if (!profile?.referred_by) {
      return NextResponse.json({ skipped: true, reason: "no referral code" });
    }

    // Find affiliate by code
    const { data: affiliate } = await getSupabase()
      .from("affiliates")
      .select("id, user_id, total_indicados, total_ganho_creditos")
      .eq("codigo", profile.referred_by)
      .eq("status", "active")
      .single();

    if (!affiliate) {
      return NextResponse.json({ skipped: true, reason: "affiliate not found or suspended" });
    }

    // Calculate 20% of plan credits
    const planCredits = PLAN_CREDITS[plan_slug] || 0;
    const reward = Math.floor(planCredits * 0.2);

    if (reward <= 0) {
      return NextResponse.json({ skipped: true, reason: "no reward for this plan" });
    }

    // Credit the affiliate
    const { data: creditRow } = await getSupabase()
      .from("credits")
      .select("balance")
      .eq("user_id", affiliate.user_id)
      .single();

    if (creditRow) {
      await getSupabase()
        .from("credits")
        .update({ balance: creditRow.balance + reward })
        .eq("user_id", affiliate.user_id);
    }

    // Record transaction
    await getSupabase().from("credit_transactions").insert({
      user_id: affiliate.user_id,
      amount: reward,
      type: "credit",
      description: `Comissão de afiliado: plano ${plan_slug}`,
    });

    // Update referral record
    await getSupabase()
      .from("affiliate_referrals")
      .update({ plan_purchased: plan_slug, creditos_gerados: reward })
      .eq("referred_user_id", referred_user_id)
      .eq("affiliate_id", affiliate.id);

    // Update affiliate totals
    await getSupabase()
      .from("affiliates")
      .update({
        total_indicados: (affiliate.total_indicados || 0) + 1,
        total_ganho_creditos: (affiliate.total_ganho_creditos || 0) + reward,
      })
      .eq("id", affiliate.id);

    return NextResponse.json({ ok: true, reward, affiliate_user_id: affiliate.user_id });
  } catch (error) {
    console.error("Affiliate reward error:", error);
    return NextResponse.json({ error: "Erro ao processar comissão" }, { status: 500 });
  }
}
