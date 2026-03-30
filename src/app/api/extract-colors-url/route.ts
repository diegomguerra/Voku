import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function fetchSiteContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; VokuBot/1.0)",
      "Accept": "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const styles: string[] = [];
  let styleMatch;
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((styleMatch = styleRe.exec(html)) !== null) styles.push(styleMatch[1].slice(0, 3000));

  const inlineColors = html.match(/(?:background|color|fill|stroke|background-color)\s*:\s*#[0-9a-fA-F]{3,8}/g) || [];
  const themeColor = html.match(/theme-color[^>]*content="([^"]+)"/)?.[1] || "";

  return [
    themeColor ? `theme-color: ${themeColor}` : "",
    ...inlineColors.slice(0, 80),
    ...styles.slice(0, 2),
  ].filter(Boolean).join("\n").slice(0, 6000);
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ erro: "URL obrigatória" }, { status: 400 });

    const urlNormalizada = url.startsWith("http") ? url : `https://${url}`;

    let conteudo = "";
    try {
      conteudo = await fetchSiteContent(urlNormalizada);
    } catch {
      return NextResponse.json({
        erro: "Não foi possível acessar o site. Verifique a URL ou suba uma imagem do site.",
        cores: [],
      });
    }

    if (!conteudo.trim()) {
      return NextResponse.json({
        erro: "Site não retornou dados de cor. Suba uma imagem ou screenshot do site.",
        cores: [],
      });
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `Analise estes dados de CSS extraídos do site ${urlNormalizada} e identifique a paleta de cores da identidade visual da marca.

DADOS DO SITE:
${conteudo}

Retorne APENAS este JSON válido, sem markdown:
{
  "cores": [
    {
      "hex": "#E02020",
      "rgb": "rgb(224, 32, 32)",
      "nome": "Vermelho vibrante",
      "uso_sugerido": "Botões e CTAs",
      "fonte": "${urlNormalizada}"
    }
  ]
}

Regras:
- 3 a 7 cores da identidade visual (botões, header, destaques, logo)
- Ignore cinzas genéricos e brancos/pretos puros a menos que sejam claramente da marca
- Hex em MAIÚSCULAS com #
- Nomes em português descritivos
- Retorne SOMENTE o JSON`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON não encontrado");

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);

  } catch (err: any) {
    console.error("[extract-colors-url]", err?.message);
    return NextResponse.json({
      erro: "Não foi possível extrair cores desta URL. Suba uma imagem ou screenshot do site.",
      cores: [],
    });
  }
}
