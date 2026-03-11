import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.24.3"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)
const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! })

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  const { topic, platform, tone, product, language = "en" } = await req.json()

  const platformGuide: Record<string, string> = {
    instagram: "Instagram post: hook na 1a linha, quebras de linha, emojis estratégicos, 5-8 hashtags no final",
    facebook: "Facebook post: mais texto, conversacional, sem hashtags em excesso, CTA claro no final",
    both: "Versão para Instagram E Facebook (retornar ambos separados)"
  }

  const prompt = `Você é RORDENS, o copywriter da Voku — estúdio de copy com IA.

Tom da marca: direto, confiante, sem floreios. Entrega rápida, resultado real.
Produto Voku: ${product || "serviços de copy (landing page $100, social pack $140, email sequence $195)"}
Plataforma: ${platform}
Instruções: ${platformGuide[platform] || platformGuide.instagram}
Idioma: ${language === "pt" ? "Português BR" : "English"}
Tema/briefing: ${topic}

Gere o post completo. Retorne APENAS JSON válido, sem markdown:
{
  "instagram": {
    "caption": "texto completo do post",
    "hashtags": ["tag1", "tag2"],
    "hook": "primeira linha (gancho)",
    "cta": "call to action"
  },
  "facebook": {
    "text": "texto completo do post",
    "cta": "call to action"
  }
}`

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }]
  })

  const raw = response.content[0].type === "text" ? response.content[0].text : ""
  const clean = raw.replace(/```json|```/g, "").trim()
  const post = JSON.parse(clean)

  const { data } = await supabase.from("media_posts").insert({
    platform,
    status: "draft",
    caption: post.instagram?.caption || post.facebook?.text,
    hashtags: post.instagram?.hashtags || [],
    content: post,
    topic,
    language,
    created_at: new Date().toISOString()
  }).select().single()

  return new Response(JSON.stringify({ ok: true, post_id: data?.id, content: post }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
})
