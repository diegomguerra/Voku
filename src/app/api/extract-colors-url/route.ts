import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ erro: "URL obrigatória", cores: [] }, { status: 400 });

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 3,
        } as any,
      ],
      messages: [
        {
          role: "user",
          content: `Acesse o site ${url} e extraia a paleta de cores da identidade visual.

Analise o HTML, CSS, botões, headers, logos e elementos visuais e identifique as cores principais da marca.

Retorne APENAS JSON válido, sem texto adicional:
{
  "cores": [
    {
      "hex": "#1A3A2A",
      "rgb": "rgb(26, 58, 42)",
      "nome": "Verde floresta",
      "uso_sugerido": "Cor primária / fundo",
      "fonte": "${url}"
    }
  ]
}

Regras:
- Extraia entre 3 e 8 cores dominantes da identidade visual
- Prefira cores de botões, headers, logos, destaques — não cores de fotos
- Nomes em português descritivos
- uso_sugerido em português prático
- Hex em maiúsculas com #
- Retorne SOMENTE o JSON`,
        },
      ],
    });

    // Extract text from response (may have tool_use blocks mixed in)
    const textBlock = response.content.find(b => b.type === "text");
    const text = textBlock?.type === "text" ? textBlock.text : "";
    const clean = text.replace(/```json|```/g, "").trim();

    try {
      const data = JSON.parse(clean);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({
        erro: "Não foi possível extrair cores desta URL automaticamente. Tente subir uma imagem ou screenshot do site.",
        cores: [],
      });
    }
  } catch {
    return NextResponse.json({
      erro: "Erro ao processar URL. Tente subir uma imagem do site.",
      cores: [],
    }, { status: 200 });
  }
}
