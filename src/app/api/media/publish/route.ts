import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const { post_id, platform, image_url, caption, scheduled_for } = await req.json()
  const supabase = supabaseAdmin()

  if (scheduled_for) {
    await supabase.from("media_posts").update({
      status: "scheduled",
      scheduled_for,
      platform,
      image_url,
      caption
    }).eq("id", post_id)

    return NextResponse.json({ ok: true, status: "scheduled" })
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/post-to-meta`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        action: platform === "both" ? "publish_both" : `publish_${platform}`,
        post_id,
        image_url,
        caption,
        platform
      })
    }
  )

  const result = await res.json()
  return NextResponse.json(result)
}
