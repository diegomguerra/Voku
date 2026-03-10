import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const VERIFY_TOKEN = Deno.env.get("INSTAGRAM_WEBHOOK_VERIFY_TOKEN") ?? "voku_ig_verify";
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req: Request) => {
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "POST") {
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    await supabase.from("media_webhook_log").insert({
      platform: "instagram",
      event_type: payload?.object ?? "unknown",
      payload,
      processed: false,
    });

    const entries = payload?.entry ?? [];
    for (const entry of entries) {
      const changes = entry?.changes ?? [];
      for (const change of changes) {
        if (change.field !== "media") continue;
        const v = change.value;
        if (!v?.media_id) continue;

        const postData = {
          external_id: String(v.media_id),
          platform: "instagram" as const,
          title: v.caption?.substring(0, 255) ?? "Instagram post",
          content: v.caption ?? null,
          post_url: v.permalink ?? null,
          published_at: v.timestamp ? new Date(v.timestamp * 1000).toISOString() : null,
          likes: v.like_count ?? 0,
          comments: v.comments_count ?? 0,
          reach: v.reach ?? 0,
          impressions: v.impressions ?? 0,
          saves: v.saved ?? 0,
          shares: v.shares ?? 0,
          video_views: v.video_views ?? 0,
          thumbnail_url: v.thumbnail_url ?? null,
          webhook_raw: v,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("media_posts")
          .upsert(postData, { onConflict: "external_id" });

        if (error) {
          console.error("media_posts upsert error:", error.message);
        }
      }
    }

    await supabase
      .from("media_webhook_log")
      .update({ processed: true })
      .eq("platform", "instagram")
      .eq("processed", false);

    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
});
