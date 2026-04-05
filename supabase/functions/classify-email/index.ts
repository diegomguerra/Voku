import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const PRODUCTS = `
Voku offers 3 productized services:
1. Landing Page Copy — $97 USD / R$497 BRL — 24h delivery — Full conversion-focused copy for a landing page (hero, benefits, CTA, FAQ, social proof). Output: DOCX + PDF.
2. Social Media Content Pack (12 posts) — $147 USD / R$747 BRL — 48h delivery — 12 ready-to-publish posts with captions and hashtags for Instagram/LinkedIn. Output: DOCX + XLSX.
3. Email Nurture Sequence (5 emails) — $127 USD / R$647 BRL — 48h delivery — 5-email sequence to nurture leads toward purchase. Output: DOCX.

All services: no calls needed, async delivery, revision included.
`;

const SYSTEM_PROMPT = `You are RORDENS, the AI operator of Voku — a productized digital studio.

${PRODUCTS}

Your job:
1. Classify incoming emails from freelance platforms (Fiverr, Workana, Upwork) or direct
2. Generate a professional, personalized reply that:
   - Matches the platform tone (Fiverr: friendly/casual EN, Workana: professional PT, Upwork: consultive EN, direct: professional PT)
   - Mentions the specific relevant product(s) with price and deadline
   - Is concise (max 150 words)
   - Ends with a clear next step ("Reply with your project details and I'll get started within 24h")
   - Never mentions AI or automation

Classification types:
- "lead": Interested in buying, asking about prices, scope or availability
- "order_inquiry": Existing client asking about order status
- "client_message": Client feedback, revision request, general message
- "notification": Automated platform notification
- "spam": Irrelevant or promotional
- "unknown": Cannot determine

Respond ONLY with raw JSON (no markdown, no backticks, no explanation):
{"type":"lead","confidence":0.95,"language":"en","summary":"brief summary","intent":"what they want","should_reply":true,"urgency":"medium","reply":"full reply text here","reply_subject":"Re: subject"}`;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let payload: any;
  try { payload = await req.json(); }
  catch { return new Response("Invalid JSON", { status: 400 }); }

  const { gmail_message_id, thread_id, platform, from_email, from_name, to_email, subject, body } = payload;

  const safePlatform = platform || "direct";
  const safeBody = (body || subject || "(empty)").substring(0, 1500);

  if (gmail_message_id) {
    const { data: existing } = await supabase
      .from("platform_messages")
      .select("id")
      .eq("gmail_message_id", gmail_message_id)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ status: "duplicate", id: existing.id }), { status: 200 });
    }
  }

  let classification: any = {
    type: "lead", confidence: 0.8, should_reply: true, language: "en",
    summary: "Incoming inquiry", intent: "interested in services", urgency: "medium",
    reply: `Hi ${from_name || "there"},\n\nThanks for reaching out to Voku! We specialize in fast, high-quality digital content — landing page copy (24h), social media packs (48h), and email sequences (48h).\n\nCould you share more details about your project? I'll get back to you with a tailored proposal right away.\n\nBest,\nVoku Studio`,
    reply_subject: "Re: " + (subject || "Your inquiry")
  };

  if (ANTHROPIC_API_KEY) {
    try {
      const userPrompt = `Platform: ${safePlatform}\nFrom: ${from_name} <${from_email}>\nSubject: ${subject}\nBody: ${safeBody}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      const data = await res.json();
      const rawText = (data.content?.[0]?.text ?? "").trim();
      console.log("Anthropic response:", rawText.substring(0, 300));

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) classification = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.log("Anthropic error:", String(e));
    }
  }

  const { data: saved, error } = await supabase
    .from("platform_messages")
    .insert({
      platform: safePlatform,
      direction: "inbound",
      message_type: classification.type ?? "unknown",
      from_email: from_email ?? "",
      from_name: from_name ?? "",
      to_email: to_email ?? "",
      subject: subject ?? "(sem assunto)",
      body_raw: safeBody,
      body_clean: safeBody,
      gmail_message_id: gmail_message_id ?? null,
      thread_id: thread_id ?? null,
      ai_classification: classification,
      ai_reply: classification.reply ?? null,
      reply_sent: false,
    })
    .select()
    .single();

  if (error) {
    console.log("DB error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({
    id: saved.id,
    type: classification.type,
    should_reply: classification.should_reply,
    urgency: classification.urgency,
    reply: classification.reply,
    reply_subject: classification.reply_subject,
  }), { status: 200, headers: { "Content-Type": "application/json" } });
});
