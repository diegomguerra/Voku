import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TYPE_PROMPTS: Record<string, string> = {
  calculadora: "Crie uma calculadora interativa e visualmente bonita. Campos de entrada numérica, resultado calculado em tempo real via JavaScript, design clean e profissional.",
  quiz: "Crie um quiz interativo com 5-7 perguntas, sistema de pontuação, resultado final personalizado baseado nas respostas, botão de compartilhar resultado.",
  formulario: "Crie um formulário de captura de leads com validação, campos relevantes ao negócio, integração visual com WhatsApp no submit (window.open com mensagem pré-preenchida).",
  gerador: "Crie uma ferramenta geradora de conteúdo — usuário preenche campos simples e recebe texto gerado, com botão copiar e opção de variações.",
  captura: "Crie uma página de captura de leads com headline impactante, benefícios em lista, formulário simples (nome + email + whatsapp) e botão CTA.",
  outro: "Crie um app web simples, funcional e visualmente bonito conforme a descrição fornecida.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const { descricao, tipo = "outro", user_id, order_id, slug_existente } = await req.json();

  const typeInstruction = TYPE_PROMPTS[tipo] || TYPE_PROMPTS.outro;

  const prompt = `Você é um expert em criar apps web interativos de alta qualidade. ${typeInstruction}

DESCRIÇÃO DO APP:
${descricao}

REGRAS OBRIGATÓRIAS:
- HTML completo com <!DOCTYPE html>, <head> e <body>
- CSS no <style> dentro do <head> — sem dependências externas
- JavaScript no <script> antes do </body>
- Responsivo (mobile-first)
- Paleta de cores: fundo branco ou neutro, acento #C8F135 ou cor adequada ao negócio
- Fontes via Google Fonts (único CDN permitido)
- Sem fetch() para APIs externas — tudo client-side
- Comentários no código explicando as seções principais
- Design moderno, profissional e polido
- UX intuitiva — o usuário deve entender o que fazer sem instruções

Retorne SOMENTE o código HTML completo, começando com <!DOCTYPE html>. Sem explicações.`;

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
  const slug = slug_existente || crypto.randomUUID().slice(0, 12);
  const filePath = `${slug}/index.html`;

  const { error: uploadError } = await supabase.storage
    .from("apps")
    .upload(filePath, new Blob([html], { type: "text/html" }), { upsert: true });

  if (uploadError) {
    return new Response(JSON.stringify({ error: uploadError.message }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // Salva referência no banco
  await supabase.from("apps").upsert({
    user_id,
    order_id: order_id || null,
    slug,
    descricao,
    tipo,
    html_path: filePath,
    publico: false,
    titulo: descricao.slice(0, 80),
    preview_descricao: descricao.slice(0, 200),
    updated_at: new Date().toISOString(),
  }, { onConflict: "slug" });

  return new Response(JSON.stringify({ slug, url: `/app/${slug}` }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
