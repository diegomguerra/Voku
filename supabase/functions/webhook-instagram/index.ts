import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

serve(async (req) => {
  const url = new URL(req.url)

  // Webhook verification (GET)
  if (req.method === "GET") {
    const mode      = url.searchParams.get("hub.mode")
    const token     = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")

    if (mode === "subscribe" && token === Deno.env.get("META_WEBHOOK_VERIFY_TOKEN")) {
      return new Response(challenge, { status: 200 })
    }
    return new Response("Forbidden", { status: 403 })
  }

  // Receive events (POST)
  if (req.method === "POST") {
    const body = await req.json()

    await supabase.from("media_webhook_log").insert({
      platform: "instagram",
      event_type: body.object || "unknown",
      payload: body,
      received_at: new Date().toISOString()
    })

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const field = change.field
        const value = change.value

        if (field === "comments") {
          await supabase.from("media_webhook_log").insert({
            platform: "instagram",
            event_type: "comment",
            post_id: value.media_id,
            user_id: value.from?.id,
            content: value.text,
            payload: value,
            received_at: new Date().toISOString()
          })
        }

        if (field === "mentions") {
          await supabase.from("media_webhook_log").insert({
            platform: "instagram",
            event_type: "mention",
            payload: value,
            received_at: new Date().toISOString()
          })
        }
      }

      for (const msg of entry.messaging || []) {
        if (msg.message) {
          await supabase.from("media_webhook_log").insert({
            platform: "instagram",
            event_type: "dm",
            user_id: msg.sender?.id,
            content: msg.message.text,
            payload: msg,
            received_at: new Date().toISOString()
          })
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  }

  return new Response("Method not allowed", { status: 405 })
})
