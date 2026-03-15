import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface ManyChatPayload {
  id: string;
  page_id: string;
  contact: {
    id: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    instagram_username?: string;
  };
  message: {
    text: string;
    mid?: string;
  };
  timestamp: number;
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
  if (!token) return false;

  const res = await fetch(
    "https://api.manychat.com/fb/sending/sendContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscriber_id: contactId,
        data: {
          version: "v2",
          content: {
            messages: [{ type: "text", text: message }],
          },
        },
        message_tag: "ACCOUNT_UPDATE",
      }),
    }
  );

  return res.ok;
}

export async function POST(req: NextRequest) {
  try {
    console.log("WEBHOOK RECEIVED:", new Date().toISOString());
    console.log("HEADERS:", JSON.stringify(Object.fromEntries(req.headers)));

    const secret = req.headers.get("x-manychat-secret");
    const expected = (process.env.MANYCHAT_WEBHOOK_SECRET || "").trim();
    console.log("SECRET CHECK:", { received: secret, expected, match: secret === expected });
    if (expected && secret?.trim() !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: ManyChatPayload = await req.json();
    console.log("MANYCHAT PAYLOAD:", JSON.stringify(payload, null, 2));

    const contactId = payload.contact?.id;
    const messageText = payload.message?.text;
    const contactName =
      payload.contact?.first_name ||
      payload.contact?.name ||
      payload.contact?.instagram_username ||
      "você";

    if (!contactId || !messageText || messageText.trim().length < 2) {
      return NextResponse.json({ ok: true });
    }

    await saveMessage(contactId, messageText, "inbound", "instagram", contactName);

    const history = await getContactHistory(contactId);
    const messages = [
      ...history.slice(0, -1),
      { role: "user", content: messageText },
    ];

    const reply = await callVokuAgent(messages, contactName);

    if (!reply) {
      return NextResponse.json({ ok: true });
    }

    await saveMessage(contactId, reply, "outbound", "instagram", contactName);
    await sendManyChatReply(contactId, reply);

    return NextResponse.json({ ok: true, reply });
  } catch (error) {
    console.error("ManyChat webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "voku-manychat-webhook" });
}
