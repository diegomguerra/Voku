import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
const getEndpointSecret = () => process.env.STRIPE_WEBHOOK_SECRET!;

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

const CREDIT_PACK_AMOUNTS: Record<string, number> = {
  "50": 50,
  "200": 200,
  "500": 500,
};

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const userId = metadata.user_id;
  if (!userId) return;

  if (metadata.type === "plan") {
    const plan = metadata.plan;
    const credits = PLAN_CREDITS[plan] || 0;

    // Update plan + reset credits
    await getSupabase()
      .from("credits")
      .upsert({ user_id: userId, plan, balance: credits }, { onConflict: "user_id" });

    // Record transaction
    await getSupabase().from("credit_transactions").insert({
      user_id: userId,
      amount: credits,
      type: "credit",
      description: `Assinatura plano ${plan} — ${credits} créditos`,
    });

    // Reward affiliate if applicable
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://voku.one";
      await fetch(`${appUrl}/api/affiliates/reward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referred_user_id: userId, plan_slug: plan }),
      });
    } catch {
      // non-blocking
    }

    // Store Stripe customer ID for future billing
    if (session.customer) {
      await getSupabase()
        .from("profiles")
        .update({ stripe_customer_id: session.customer as string })
        .eq("id", userId);
    }
  } else if (metadata.type === "credits") {
    const packSize = metadata.credits;
    const amount = CREDIT_PACK_AMOUNTS[packSize] || 0;

    if (amount > 0) {
      // Add credits to existing balance
      const { data: current } = await getSupabase()
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      const newBalance = (current?.balance || 0) + amount;
      await getSupabase()
        .from("credits")
        .upsert({ user_id: userId, balance: newBalance }, { onConflict: "user_id" });

      await getSupabase().from("credit_transactions").insert({
        user_id: userId,
        amount,
        type: "credit",
        description: `Pacote de ${amount} créditos avulsos`,
      });
    }
  }
}

async function handleSubscriptionRenewed(invoice: Stripe.Invoice) {
  // On renewal, re-credit the plan amount
  const customerId = invoice.customer as string;
  if (!customerId) return;

  // Find user by stripe_customer_id
  const { data: profile } = await getSupabase()
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!profile) return;

  const { data: creditRow } = await getSupabase()
    .from("credits")
    .select("plan")
    .eq("user_id", profile.id)
    .single();

  const plan = creditRow?.plan || "free";
  const credits = PLAN_CREDITS[plan] || 0;

  if (credits > 0) {
    await getSupabase()
      .from("credits")
      .update({ balance: credits })
      .eq("user_id", profile.id);

    await getSupabase().from("credit_transactions").insert({
      user_id: profile.id,
      amount: credits,
      type: "credit",
      description: `Renovação mensal plano ${plan} — ${credits} créditos`,
    });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, getEndpointSecret());
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.paid":
        // Handle subscription renewals (not the first payment)
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason === "subscription_cycle") {
          await handleSubscriptionRenewed(invoice);
        }
        break;
      case "customer.subscription.deleted":
        // Downgrade to free on cancellation
        const sub = event.data.object as Stripe.Subscription;
        const cancelCustomerId = sub.customer as string;
        const { data: cancelProfile } = await getSupabase()
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", cancelCustomerId)
          .single();
        if (cancelProfile) {
          await getSupabase()
            .from("credits")
            .update({ plan: "free", balance: 20 })
            .eq("user_id", cancelProfile.id);
        }
        break;
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
  }

  return NextResponse.json({ received: true });
}
