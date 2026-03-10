import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const BASE_URL = Deno.env.get("SUPABASE_URL")!;

async function callFunction(name: string, body: any) {
  const res = await fetch(`${BASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let payload: any;
  try { payload = await req.json(); }
  catch { return new Response("Invalid JSON", { status: 400 }); }

  console.log("Received payload:", JSON.stringify(payload));

  const { gmail_message_id, thread_id, platform, from_email, from_name, to_email, subject, body } = payload;

  const detectedPlatform = platform || (
    to_email?.includes("fiverr") ? "fiverr" :
    to_email?.includes("workana") ? "workana" :
    to_email?.includes("upwork") ? "upwork" : "direct"
  );

  const safeBody = body || subject || "(no body)";

  const classification = await callFunction("classify-email", {
    gmail_message_id,
    thread_id,
    platform: detectedPlatform,
    from_email,
    from_name,
    to_email,
    subject,
    body: safeBody,
  });

  console.log("Classification result:", JSON.stringify(classification));

  if (classification.status === "duplicate") {
    return new Response(JSON.stringify({ status: "duplicate" }), { status: 200 });
  }

  const messageId = classification.id;
  const shouldReply = classification.should_reply;

  let replySent = false;
  if (shouldReply && messageId) {
    await new Promise(r => setTimeout(r, 3000));
    const replyResult = await callFunction("send-reply", { message_id: messageId });
    replySent = replyResult.success ?? false;
    console.log("Reply result:", JSON.stringify(replyResult));
  }

  return new Response(JSON.stringify({
    status: "processed",
    message_id: messageId,
    type: classification.type,
    urgency: classification.urgency,
    reply_sent: replySent,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
