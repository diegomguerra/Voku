import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const HMAC_SECRET = Deno.env.get("TIKTOK_WEBHOOK_SECRET") ?? "voku_tt_secret";
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function verifyTikTokSignature(req: Request, body: string): Promise<boolean> {
  const sig = req.headers.get("x-tiktok-signature") ?? "";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const hex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
  return sig === `sha256=${hex}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "POST") {
    const body = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const valid = await verifyTikTokSignature(req, body);
    if (!valid) {
      return new Response("Unauthorized", { status: 401 });
    }

    await supabase.from("media_webhook_log").insert({
      platform: "tiktok",
      event_type: payload?.event ?? "unknown",
      payload,
      processed: false,
    });

    const event = payload?.event;
    const data = payload?.data;

    if ((event === "video.publish" || event === "post.publish") && data?.video_id) {
      const postData = {
        external_id: `tt_${data.video_id}`,
        platform: "tiktok" as const,
        title: data.video_description?.substring(0, 255) ?? "TikTok video",
        content: data.video_description ?? null,
        post_url: data.share_url ?? null,
        published_at: data.create_time ? new Date(data.create_time * 1000).toISOString() : null,
        likes: data.digg_count ?? 0,
        comments: data.comment_count ?? 0,
        shares: data.share_count ?? 0,
        reach: data.reach ?? 0,
        impressions: data.play_count ?? 0,
        video_views: data.play_count ?? 0,
        saves: data.collect_count ?? 0,
        thumbnail_url: data.cover_image_url ?? null,
        webhook_raw: data,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("media_posts")
        .upsert(postData, { onConflict: "external_id" });

      if (error) {
        console.error("media_posts upsert error:", error.message);
      }
    }

    if (event === "video.metrics_update" && data?.video_id) {
      await supabase
        .from("media_posts")
        .update({
          likes: data.digg_count ?? 0,
          comments: data.comment_count ?? 0,
          shares: data.share_count ?? 0,
          video_views: data.play_count ?? 0,
          impressions: data.play_count ?? 0,
          saves: data.collect_count ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq("external_id", `tt_${data.video_id}`);
    }

    await supabase
      .from("media_webhook_log")
      .update({ processed: true })
      .eq("platform", "tiktok")
      .eq("processed", false);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method not allowed", { status: 405 });
});
