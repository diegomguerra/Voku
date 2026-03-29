import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { image, mediaType, filename } = await req.json();

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: image },
            },
            {
              type: "text",
              text: `Analise esta imagem e extraia as cores principais da paleta ou identidade visual presente.

Retorne APENAS um JSON válido, sem texto adicional, no formato:
{
  "cores": [
    {
      "hex": "#1A3A2A",
      "rgb": "rgb(26, 58, 42)",
      "nome": "Verde floresta",
      "uso_sugerido": "Cor principal / fundo",
      "fonte": "${filename}"
    }
  ]
}

Regras:
- Extraia entre 2 e 8 cores dominantes e significativas
- Ignore brancos puros (#FFFFFF) e pretos puros (#000000) a menos que sejam claramente parte da identidade visual
- Prefira cores que parecem ser da identidade de marca (não cores de fotos de fundo aleatórias)
- O campo "nome" deve ser em português, descritivo (ex: "Verde musgo", "Amarelo vibrante", "Creme quente")
- O campo "uso_sugerido" deve ser uma sugestão prática em português (ex: "Cor primária", "Destaque / CTA", "Texto sobre fundo escuro", "Fundo secundário")
- Os hex codes devem ser em maiúsculas com # (ex: #1A3A2A)
- Retorne SOMENTE o JSON, nada mais`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(clean);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ cores: [] }, { status: 200 });
  }
}
