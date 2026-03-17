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

  const { structured_data, order_id, user_id, design = "minimal" } = await req.json();

  const prompt = `Você é um expert em landing pages de alta conversão. Crie um HTML completo, responsivo e auto-contido para uma landing page.

DADOS DO NEGÓCIO:
${JSON.stringify(structured_data, null, 2)}

DESIGN: ${design} (minimal | bold | modern)

REGRAS OBRIGATÓRIAS:
- HTML completo com <!DOCTYPE html>, <head> e <body>
- CSS inline no <style> dentro do <head> — sem dependências externas
- Responsivo para mobile e desktop
- Seções obrigatórias: Hero, Problema, Solução, Benefícios (3), Prova Social, CTA final
- Design ${design === "minimal" ? "limpo, muito espaço em branco, tipografia refinada, cores neutras com 1 acento" : design === "bold" ? "impactante, cores fortes, tipografia grande, contrastes altos" : "moderno, gradientes sutis, cards com sombra, layout assimétrico"}
- Fontes via Google Fonts (único CDN permitido)
- Botões de CTA com onclick que abre WhatsApp ou formulário
- Meta tags SEO básicas
- Retorne APENAS o HTML completo, sem explicações

Retorne SOMENTE o código HTML, começando com <!DOCTYPE html>`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  let html = data?.content?.[0]?.text || "";

  // Limpa markdown se vier
  html = html.replace(/^```html\n?/, "").replace(/\n?```$/, "").trim();

  if (!html.includes("<!DOCTYPE")) {
    return new Response(JSON.stringify({ error: "HTML inválido gerado" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // Salva no Supabase Storage
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const slug = order_id || crypto.randomUUID();
  const filePath = `${slug}/index.html`;

  const { error: uploadError } = await supabase.storage
    .from("landing-pages")
    .upload(filePath, new Blob([html], { type: "text/html" }), { upsert: true });

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // Salva referência no banco
  if (order_id) {
    await supabase.from("landing_pages").upsert({
      order_id,
      user_id,
      slug,
      design,
      html_path: filePath,
      published: true,
      updated_at: new Date().toISOString(),
    });
  }

  return new Response(JSON.stringify({ slug, url: `/lp/${slug}` }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
