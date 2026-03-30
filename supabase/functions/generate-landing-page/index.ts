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

  const brand = structured_data?.brand_context || {};
  const corPrimaria = brand.cor_primaria || "#AAFF00";
  const corSecundaria = brand.cor_secundaria || "#0a0a0a";
  const corTexto = brand.cor_texto || "#ffffff";
  const logoBase64 = brand.logo_base64 || "";
  const nomeMarca = brand.nome_marca || structured_data?.nome_marca || "Marca";
  const ctaTexto = structured_data?.cta_texto || "";

  const logoInstruction = logoBase64
    ? `LOGO OBRIGATÓRIO: Inclua um <img> no header/navbar com src="${logoBase64.startsWith("data:") ? logoBase64 : `data:image/png;base64,${logoBase64}`}" com os seguintes estilos CSS: max-height:60px; width:auto; object-fit:contain; Posicione no canto superior esquerdo do header. Se por algum motivo não conseguir incluir inline, use src="LOGO_PLACEHOLDER" como fallback.`
    : `Sem logo disponível — use o nome "${nomeMarca}" como texto estilizado no header.`;

  const prompt = `Você é um expert mundial em landing pages de alta conversão. Crie um HTML completo, responsivo e auto-contido.

DADOS DO NEGÓCIO:
${JSON.stringify(structured_data, null, 2)}

DESIGN: ${design} (minimal | bold | modern)

═══ IDENTIDADE VISUAL ═══
${logoInstruction}

CORES OBRIGATÓRIAS:
- Cor primária (${corPrimaria}): USE em TODOS os botões CTA, headlines coloridas, elementos de destaque, bordas de acento, ícones. Esta é a cor principal de ação.
- Cor secundária (${corSecundaria}): USE como fundo de seções alternadas, fundo do header/footer, backgrounds escuros.
- Cor de texto (${corTexto}): USE como cor principal de parágrafos e títulos sobre fundos escuros.
- NUNCA use cores genéricas (#007bff, #333, etc.) quando as cores da marca foram fornecidas.

═══ ESTRUTURA OBRIGATÓRIA ═══
Gere as seguintes seções NESTA ORDEM com copy REAL baseado nos dados do negócio (NUNCA use placeholders como "[seu nome aqui]", "[insira aqui]", "Lorem ipsum"):

1. **HEADER/NAVBAR**: Logo (ou nome da marca) à esquerda + botão CTA à direita com fundo ${corPrimaria}
2. **HERO** (100vw, padding generoso em mobile): Headline de impacto direto baseada no produto/serviço e público-alvo. Subheadline com proposta de valor clara. Botão CTA grande com texto "${ctaTexto || 'Começar agora'}". Fundo usando ${corSecundaria}.
3. **DORES DO PÚBLICO**: 3-4 dores reais do público-alvo baseadas nos dados do briefing. Use ícones SVG inline simples (não emoji, não dependências externas).
4. **SOLUÇÃO**: Como o produto/serviço resolve essas dores. Texto direto e persuasivo.
5. **BENEFÍCIOS**: 3-4 benefícios concretos com ícones SVG inline. Cards com sombra sutil.
6. **PROVA SOCIAL**: Se houver dados/números no briefing, use-os. Senão, crie seção de depoimentos com formato plausível (nome + cargo + texto). Números grandes em destaque com cor ${corPrimaria}.
7. **CTA FINAL**: Seção com fundo ${corSecundaria}, headline de urgência, botão CTA grande com cor ${corPrimaria} e texto "${ctaTexto || 'Quero começar agora'}".
8. **FOOTER**: Nome da marca "${nomeMarca}", links fictícios de navegação, copyright ${new Date().getFullYear()}.

═══ REGRAS TÉCNICAS ═══
- HTML completo com <!DOCTYPE html>, <head> e <body>
- CSS no <style> dentro do <head> — ZERO dependências externas exceto Google Fonts
- Tipografia: Inter (ou similar) via Google Fonts, mínimo 2 pesos (400 e 700)
- Mobile-first: hero 100vw, padding mínimo 20px em mobile, font-size responsivo
- Botões CTA com border-radius, padding generoso, hover com opacity
- Meta tags SEO básicas (title, description, viewport)
- Retorne APENAS o HTML completo, sem explicações, começando com <!DOCTYPE html>`;


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

  // Fallback: replace LOGO_PLACEHOLDER or empty src with actual logo data URI
  if (logoBase64) {
    const logoDataUri = logoBase64.startsWith("data:") ? logoBase64 : `data:image/png;base64,${logoBase64}`;
    html = html.replace(/LOGO_PLACEHOLDER/g, logoDataUri);
    html = html.replace(/<img([^>]*?)src=["']#["']/g, `<img$1src="${logoDataUri}"`);
  }

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

  return new Response(JSON.stringify({ ok: true, slug, url: `/lp/${slug}`, html }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
