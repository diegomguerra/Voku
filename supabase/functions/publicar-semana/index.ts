import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })

  try {
    const url = new URL(req.url)
    const semanaKey = url.searchParams.get("semana_key")

    // Se semana_key fornecida, retorna posts daquela semana
    if (semanaKey) {
      const { data, error } = await supabase
        .from("semanas_conteudo")
        .select("*")
        .eq("semana_key", semanaKey)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: "Semana não encontrada" }),
          { status: 404, headers: CORS }
        )
      }

      const posts = Array.isArray(data.posts) ? data.posts : JSON.parse(data.posts || "[]")
      return new Response(
        JSON.stringify({ semana: { ...data, posts } }),
        { headers: CORS }
      )
    }

    // Sem semana_key: lista semanas disponíveis
    const { data, error } = await supabase
      .from("semanas_conteudo")
      .select("id, semana_key, semana_label, conta, status, gerado_em, posts")
      .order("gerado_em", { ascending: false })
      .limit(12)

    if (error) throw error

    const semanas = (data || []).map((s: any) => {
      const posts = Array.isArray(s.posts) ? s.posts : JSON.parse(s.posts || "[]")
      return {
        semana_key: s.semana_key,
        semana_label: s.semana_label,
        conta: s.conta,
        status: s.status,
        total_posts: posts.length,
        gerado_em: s.gerado_em,
      }
    })

    return new Response(JSON.stringify(semanas), { headers: CORS })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: CORS }
    )
  }
})
