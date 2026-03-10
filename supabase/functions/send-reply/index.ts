import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

async function sendReply({
  to, from, subject, body, thread_id
}: { to: string; from: string; subject: string; body: string; thread_id?: string }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: body,
      headers: thread_id ? { "In-Reply-To": thread_id, "References": thread_id } : {},
    }),
  });
  return response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { message_id, override_reply } = payload;

  if (!message_id) {
    return new Response(JSON.stringify({ error: "message_id is required" }), { status: 400 });
  }

  const { data: msg, error: fetchError } = await supabase
    .from("platform_messages")
    .select("*, automation_config!platform_messages_platform_fkey(*)")
    .eq("id", message_id)
    .single();

  if (fetchError || !msg) {
    const { data: msgSimple, error: e2 } = await supabase
      .from("platform_messages")
      .select("*")
      .eq("id", message_id)
      .single();
    if (e2 || !msgSimple) {
      return new Response(JSON.stringify({ error: "Message not found" }), { status: 404 });
    }

    const { data: config } = await supabase
      .from("automation_config")
      .select("*")
      .eq("platform", msgSimple.platform)
      .single();

    const replyBody = override_reply || msgSimple.ai_reply;
    const replySubject = msgSimple.subject?.startsWith("Re:") ? msgSimple.subject : `Re: ${msgSimple.subject ?? "Your inquiry"}` ;
    const fromEmail = config?.inbox_email ?? `${msgSimple.platform}@voku.one`;

    if (!replyBody || !msgSimple.from_email) {
      return new Response(JSON.stringify({ error: "No reply content or recipient" }), { status: 400 });
    }

    const result = await sendReply({
      to: msgSimple.from_email,
      from: `Voku <${fromEmail}>`,
      subject: replySubject,
      body: replyBody,
      thread_id: msgSimple.gmail_message_id,
    });

    await supabase.from("platform_messages").insert({
      platform: msgSimple.platform,
      direction: "outbound",
      message_type: msgSimple.message_type,
      from_email: fromEmail,
      to_email: msgSimple.from_email,
      subject: replySubject,
      body_raw: replyBody,
      body_clean: replyBody,
      thread_id: msgSimple.thread_id,
      reply_sent: true,
      reply_sent_at: new Date().toISOString(),
    });

    await supabase
      .from("platform_messages")
      .update({ reply_sent: true, reply_sent_at: new Date().toISOString() })
      .eq("id", message_id);

    return new Response(JSON.stringify({ success: true, resend: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500 });
});
