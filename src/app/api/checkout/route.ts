import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-03-31.basil" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://voku.one";

// Plan → Stripe price mapping (set these in Stripe Dashboard)
const PLAN_PRICES: Record<string, { monthly: string; annual: string }> = {
  starter: { monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "", annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || "" },
  pro: { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "", annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "" },
  business: { monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || "", annual: process.env.STRIPE_PRICE_BUSINESS_ANNUAL || "" },
  enterprise: { monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || "", annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || "" },
};

// Credit pack → Stripe price mapping
const CREDIT_PRICES: Record<string, string> = {
  "50": process.env.STRIPE_PRICE_CREDITS_50 || "",
  "200": process.env.STRIPE_PRICE_CREDITS_200 || "",
  "500": process.env.STRIPE_PRICE_CREDITS_500 || "",
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const plan = searchParams.get("plan");
    const billing = searchParams.get("billing") || "monthly";
    const credits = searchParams.get("credits");

    // Get user from auth header or cookie
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || req.cookies.get("sb-access-token")?.value;

    let userId: string | null = null;
    let userEmail: string | null = null;

    if (token) {
      const { data } = await supabase.auth.getUser(token);
      userId = data.user?.id || null;
      userEmail = data.user?.email || null;
    }

    let priceId: string;
    let mode: "subscription" | "payment";
    let metadata: Record<string, string> = {};

    if (plan && PLAN_PRICES[plan]) {
      // Subscription checkout
      priceId = billing === "annual" ? PLAN_PRICES[plan].annual : PLAN_PRICES[plan].monthly;
      mode = "subscription";
      metadata = { type: "plan", plan, billing, user_id: userId || "" };
    } else if (credits && CREDIT_PRICES[credits]) {
      // One-time credit pack purchase
      priceId = CREDIT_PRICES[credits];
      mode = "payment";
      metadata = { type: "credits", credits, user_id: userId || "" };
    } else {
      return NextResponse.json({ error: "Invalid plan or credit pack" }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json({ error: "Stripe price not configured. Set STRIPE_PRICE_* env vars." }, { status: 500 });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/cliente/pedidos?checkout=success`,
      cancel_url: `${APP_URL}/precos?checkout=cancel`,
      metadata,
      ...(userEmail ? { customer_email: userEmail } : {}),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.redirect(session.url!, 303);
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message || "Checkout error" }, { status: 500 });
  }
}
