import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const PAGE_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN")!
const PAGE_ID    = Deno.env.get("META_PAGE_ID")!
const IG_ID      = Deno.env.get("META_INSTAGRAM_ACCOUNT_ID")!

async function postToInstagram(imageUrl: string, caption: string) {
  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${IG_ID}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: PAGE_TOKEN
      })
    }
  )
  const container = await containerRes.json()
  if (!container.id) throw new Error(`IG container error: ${JSON.stringify(container)}`)

  await new Promise(r => setTimeout(r, 3000))

  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${IG_ID}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: PAGE_TOKEN
      })
    }
  )
  return await publishRes.json()
}

async function postToFacebook(message: string, imageUrl?: string) {
  const body: any = { message, access_token: PAGE_TOKEN }
  const endpoint = imageUrl
    ? `https://graph.facebook.com/v19.0/${PAGE_ID}/photos`
    : `https://graph.facebook.com/v19.0/${PAGE_ID}/feed`
  if (imageUrl) body.url = imageUrl

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  return await res.json()
}

async function getInstagramInsights(mediaId: string) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${mediaId}/insights?metric=impressions,reach,likes_count,comments_count,shares&access_token=${PAGE_TOKEN}`
  )
  return await res.json()
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  const { action, post_id, image_url, caption, message, platform } = await req.json()

  try {
    let result

    switch (action) {
      case "publish_instagram":
        if (!image_url || !caption) throw new Error("image_url e caption obrigatórios")
        result = await postToInstagram(image_url, caption)
        await supabase.from("media_posts").update({
          status: "published",
          platform_post_id: result.id,
          published_at: new Date().toISOString()
        }).eq("id", post_id)
        break

      case "publish_facebook":
        result = await postToFacebook(message || caption, image_url)
        await supabase.from("media_posts").update({
          status: "published",
          platform_post_id: result.post_id || result.id,
          published_at: new Date().toISOString()
        }).eq("id", post_id)
        break

      case "publish_both":
        const [igResult, fbResult] = await Promise.all([
          postToInstagram(image_url, caption),
          postToFacebook(caption, image_url)
        ])
        result = { instagram: igResult, facebook: fbResult }
        await supabase.from("media_posts").update({
          status: "published",
          published_at: new Date().toISOString()
        }).eq("id", post_id)
        break

      case "get_insights":
        result = await getInstagramInsights(post_id)
        break

      default:
        throw new Error(`Action desconhecida: ${action}`)
    }

    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (err) {
    await supabase.from("media_webhook_log").insert({
      platform: platform || "meta",
      event_type: "error",
      content: err.message,
      payload: { action, post_id },
      received_at: new Date().toISOString()
    })

    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
