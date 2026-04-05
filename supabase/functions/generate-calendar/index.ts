import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const { nicho, objetivo, tom, user_id } = await req.json();

  const prompt = `Crie um calendário editorial completo para 30 dias para um negócio com as seguintes características:

Nicho: ${nicho}
Objetivo principal: ${objetivo}
Tom de comunicação: ${tom || "profissional e próximo"}

Retorne EXATAMENTE um JSON válido com esta estrutura:
{
  "pilares": ["pilar1", "pilar2", "pilar3", "pilar4"],
  "posts": [
    {
      "dia": 1,
      "data_sugerida": "2025-04-01",
      "pilar": "nome do pilar",
      "formato": "post_instagram | carrossel | reels_script | ad_copy",
      "titulo": "título da ideia",
      "descricao": "descrição em 1-2 frases do que abordar",
      "hook_sugerido": "primeira linha sugerida para capturar atenção"
    }
  ]
}

REGRAS:
- Exatamente 30 posts no array
- Distribua os formatos: 40% post_instagram, 30% carrossel, 20% reels_script, 10% ad_copy
- Distribua os pilares de forma equilibrada
- Datas começando em ${new Date().toISOString().split("T")[0]}
- Retorne APENAS o JSON, sem texto adicional`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data?.content?.[0]?.text || "{}";

  let calendar;
  try {
    calendar = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    calendar = match ? JSON.parse(match[0]) : { pilares: [], posts: [] };
  }

  // Salvar no banco se user_id fornecido
  if (user_id && calendar.posts?.length) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from("editorial_calendars").insert({
      user_id,
      nicho,
      objetivo,
      tom,
      pilares: calendar.pilares,
      posts: calendar.posts,
      created_at: new Date().toISOString(),
    });
  }

  return new Response(JSON.stringify(calendar), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
