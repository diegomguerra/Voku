import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { image, mediaType, filename } = await req.json();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
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
              text: `Você é um especialista em design e identidade visual. Olhe com atenção para esta imagem e extraia as cores EXATAS que aparecem nela.

INSTRUÇÕES CRÍTICAS:
1. Use um eyedropper mental — identifique os pixels reais das áreas de cor sólida
2. Para cada cor, aponte EXATAMENTE onde ela aparece na imagem (botão, header, fundo, logo, texto, etc.)
3. NÃO invente cores que não existem na imagem
4. NÃO use cores genéricas — extraia os hex codes PRECISOS que você observa
5. Se a imagem é um screenshot de site, foque nos elementos de UI: botões, headers, links, backgrounds, badges

Retorne APENAS este JSON válido, sem markdown nem texto adicional:
{
  "cores": [
    {
      "hex": "#E02020",
      "rgb": "rgb(224, 32, 32)",
      "nome": "Vermelho vibrante",
      "uso_sugerido": "Botões e CTAs",
      "fonte": "${filename}"
    }
  ]
}

Regras:
- 3 a 8 cores que REALMENTE aparecem na imagem
- Hex codes PRECISOS em MAIÚSCULAS com # (ex: #6366F1, não #6060F0)
- Ignore brancos puros e pretos puros, a menos que sejam claramente parte da marca
- Nomes descritivos em português
- uso_sugerido baseado em ONDE a cor aparece na imagem
- Retorne SOMENTE o JSON`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON não encontrado");

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[extract-colors]", err?.message);
    return NextResponse.json({ cores: [] }, { status: 200 });
  }
}
