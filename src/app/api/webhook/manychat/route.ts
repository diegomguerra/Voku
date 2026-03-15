import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface ManyChatPayload {
  id?: string;
  page_id?: string;
  contact?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    instagram_username?: string;
  };
  message?: {
    text?: string;
    mid?: string;
  };
  // ManyChat custom fields / flat format
  subscriber_id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  text?: string;
  timestamp?: number;
}

async function getContactHistory(contactId: string) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("platform_messages")
    .select("direction, content, created_at")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: true })
    .limit(10);

  return (data ?? []).map((m) => ({
    role: m.direction === "inbound" ? "user" : "assistant",
    content: m.content,
  }));
}

async function callVokuAgent(
  messages: { role: string; content: string }[],
  contactName: string
): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const res = await fetch(`${supabaseUrl}/functions/v1/voku-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      messages,
      user_context: {
        name: contactName || "você",
        plan: "free",
        credits: 0,
        channel: "instagram_dm",
      },
    }),
  });

  const data = await res.json();
  const text = data?.content?.[0]?.text || "";
  return text.replace(/\{[\s\S]*"action"[\s\S]*\}/g, "").trim();
}

async function saveMessage(
  contactId: string,
  content: string,
  direction: "inbound" | "outbound",
  platform: string,
  contactName?: string
) {
  const db = supabaseAdmin();
  await db.from("platform_messages").insert({
    contact_id: contactId,
    platform,
    direction,
    content,
    contact_name: contactName,
    message_type: direction === "inbound" ? "lead" : "reply",
    reply_sent: direction === "outbound",
    created_at: new Date().toISOString(),
  });
}

async function sendManyChatReply(
  contactId: string,
  message: string
): Promise<boolean> {
  const token = process.env.MANYCHAT_API_TOKEN;
  if (!token) {
    console.log("MANYCHAT SEND: no API token configured");
    return false;
  }

  const payload = {
    subscriber_id: contactId,
    data: {
      version: "v2",
      content: {
        messages: [{ type: "text", text: message }],
      },
    },
    message_tag: "ACCOUNT_UPDATE",
  };
  console.log("MANYCHAT SEND PAYLOAD:", JSON.stringify(payload));

  const res = await fetch(
    "https://api.manychat.com/fb/sending/sendContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const resBody = await res.text();
  console.log("MANYCHAT SEND RESPONSE:", res.status, resBody);

  return res.ok;
}

export async function POST(req: NextRequest) {
  try {
    console.log("WEBHOOK RECEIVED:", new Date().toISOString());
    console.log("URL:", req.url);
    console.log("HEADERS:", JSON.stringify(Object.fromEntries(req.headers)));

    // Secret: accept via header OR query param
    const secret =
      req.headers.get("x-manychat-secret") ||
      req.nextUrl.searchParams.get("secret");
    const expected = (process.env.MANYCHAT_WEBHOOK_SECRET || "").trim();
    console.log("SECRET CHECK:", { received: secret, expected, match: secret?.trim() === expected });
    if (expected && secret?.trim() !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body — handle empty body gracefully
    let payload: ManyChatPayload = {};
    try {
      const rawBody = await req.text();
      console.log("RAW BODY:", rawBody || "(empty)");
      if (rawBody && rawBody.trim()) {
        payload = JSON.parse(rawBody);
      }
    } catch (e) {
      console.log("BODY PARSE ERROR:", e);
    }
    console.log("PARSED PAYLOAD:", JSON.stringify(payload, null, 2));

    // Extract contact ID: body → header → query
    const contactId =
      payload.contact?.id ||
      payload.subscriber_id ||
      req.headers.get("x-manychat-subscriber-id") ||
      req.nextUrl.searchParams.get("subscriber_id") ||
      "";

    // Extract message text: body → query
    const messageText =
      payload.message?.text ||
      payload.text ||
      req.nextUrl.searchParams.get("text") ||
      "";

    // Extract contact name
    const contactName =
      payload.contact?.first_name ||
      payload.contact?.name ||
      payload.contact?.instagram_username ||
      payload.first_name ||
      payload.name ||
      req.nextUrl.searchParams.get("name") ||
      "você";

    console.log("RESOLVED:", { contactId, messageText: messageText.substring(0, 100), contactName });

    if (!contactId || !messageText || messageText.trim().length < 2) {
      console.log("SKIPPING: missing contactId or messageText");
      return NextResponse.json({ ok: true, skipped: true, reason: "missing contact_id or text" });
    }

    await saveMessage(contactId, messageText, "inbound", "instagram", contactName);

    const history = await getContactHistory(contactId);
    const messages = [
      ...history.slice(0, -1),
      { role: "user", content: messageText },
    ];

    console.log("CALLING VOKU AGENT for:", contactName, "message:", messageText);
    const reply = await callVokuAgent(messages, contactName);
    console.log("VOKU AGENT REPLY:", reply ? reply.substring(0, 200) : "(empty)");

    if (!reply) {
      console.log("NO REPLY — skipping sendManyChatReply");
      return NextResponse.json({ ok: true });
    }

    await saveMessage(contactId, reply, "outbound", "instagram", contactName);
    const sent = await sendManyChatReply(contactId, reply);
    console.log("MANYCHAT REPLY SENT:", sent);

    return NextResponse.json({ ok: true, reply });
  } catch (error) {
    console.error("ManyChat webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Health check + accept test via query params
  const text = req.nextUrl.searchParams.get("text");
  if (text) {
    console.log("GET TEST:", { text, subscriber_id: req.nextUrl.searchParams.get("subscriber_id") });
  }
  return NextResponse.json({ ok: true, service: "voku-manychat-webhook" });
}
