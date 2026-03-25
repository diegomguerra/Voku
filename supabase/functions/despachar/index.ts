import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/imagens`

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
}

async function callPostToMeta(payload: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/post-to-meta`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify(payload),
  })
  return await res.json()
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS })

  try {
    const { semana_key, conta, aprovados_ids, rejeitados_ids, comentarios } = await req.json()

    if (!semana_key || !aprovados_ids) {
      return new Response(
        JSON.stringify({ ok: false, error: "semana_key e aprovados_ids obrigatórios" }),
        { status: 400, headers: CORS }
      )
    }

    // Buscar semana de conteúdo
    const { data: semana, error: semErr } = await supabase
      .from("semanas_conteudo")
      .select("*")
      .eq("semana_key", semana_key)
      .single()

    if (semErr || !semana) {
      return new Response(
        JSON.stringify({ ok: false, error: "Semana não encontrada" }),
        { status: 404, headers: CORS }
      )
    }

    const allPosts: any[] = Array.isArray(semana.posts)
      ? semana.posts
      : JSON.parse(semana.posts || "[]")

    // Salvar aprovação na tabela aprovacoes
    const aprovadosPosts = allPosts.filter((p: any) => aprovados_ids.includes(p.id))
    const now = new Date().toISOString()

    await supabase.from("aprovacoes").upsert({
      semana_key,
      semana: semana.semana_label,
      conta: conta || semana.conta,
      aprovados: aprovados_ids,
      rejeitados: rejeitados_ids || [],
      comentarios: comentarios || {},
      salvo_em: now,
      updated_at: now,
      status_despacho: "processando",
      despachado_em: now,
      webhook_tentativas: 0,
      payload_completo: {
        conta: conta || semana.conta,
        semana: semana.semana_label,
        semana_key,
        aprovados: aprovadosPosts.map((p: any) => ({ ...p, status: "aprovado", comentario: comentarios?.[p.id] || "" })),
        rejeitados: rejeitados_ids || [],
        gerado_em: now,
      },
    }, { onConflict: "semana_key" })

    // Atualizar status da semana
    await supabase.from("semanas_conteudo").update({
      status: "despachado",
      updated_at: now,
    }).eq("semana_key", semana_key)

    const results: any[] = []
    const errors: any[] = []

    // Publicar cada post aprovado no Instagram
    for (const postId of aprovados_ids) {
      const post = allPosts.find((p: any) => p.id === postId)
      if (!post) {
        errors.push({ id: postId, error: "Post não encontrado no calendário" })
        continue
      }

      // Montar legenda com hashtags
      const hashtags = post.hashtags?.join(" ") || ""
      const caption = hashtags
        ? `${post.legenda}\n\n${hashtags}`
        : post.legenda || post.titulo || ""

      // URL da imagem no Storage (slide 1 como capa)
      const imageUrl = `${STORAGE_BASE}/${semana_key}/${postId}-slide-1.png`

      // Inserir na media_posts
      const { data: mediaPost, error: insertErr } = await supabase
        .from("media_posts")
        .insert({
          platform: "instagram",
          status: "publishing",
          title: post.titulo || "Sem título",
          caption,
          hashtags: post.hashtags || [],
          content: JSON.stringify(post),
          topic: post.titulo,
          image_url: imageUrl,
          created_at: now,
        })
        .select()
        .single()

      if (insertErr) {
        errors.push({ id: postId, error: insertErr.message })
        continue
      }

      // Publicar no Instagram via post-to-meta
      try {
        const pubResult = await callPostToMeta({
          action: "publish_instagram",
          post_id: mediaPost.id,
          image_url: imageUrl,
          caption,
          platform: "instagram",
        })

        if (pubResult.ok) {
          results.push({
            id: postId,
            media_post_id: mediaPost.id,
            status: "published",
            result: pubResult.result,
          })
        } else {
          await supabase.from("media_posts").update({ status: "failed" }).eq("id", mediaPost.id)
          errors.push({ id: postId, media_post_id: mediaPost.id, error: pubResult.error })
        }
      } catch (pubErr) {
        await supabase.from("media_posts").update({ status: "failed" }).eq("id", mediaPost.id)
        errors.push({ id: postId, error: (pubErr as Error).message })
      }
    }

    // Atualizar status do despacho
    const finalStatus = errors.length === 0 ? "despachado" : "despachado_com_erros"
    await supabase.from("aprovacoes").update({
      status_despacho: finalStatus,
      webhook_tentativas: 1,
      updated_at: new Date().toISOString(),
    }).eq("semana_key", semana_key)

    const summary = {
      ok: true,
      published: results.length,
      failed: errors.length,
      rejected: rejeitados_ids?.length || 0,
      results,
      errors: errors.length > 0 ? errors : undefined,
    }

    return new Response(JSON.stringify(summary), { headers: CORS })
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: CORS }
    )
  }
})
