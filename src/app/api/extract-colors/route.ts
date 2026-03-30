import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { cores_extraidas, filename } = await req.json();

    // Client already extracted hex codes via Canvas — ask Claude to name/categorize them
    if (!cores_extraidas || cores_extraidas.length === 0) {
      return NextResponse.json({ cores: [] });
    }

    const hexList = cores_extraidas.map((c: { hex: string }) => c.hex).join(", ");

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `Estas cores foram extraídas de uma imagem/site (${filename}): ${hexList}

Para cada cor, dê um nome descritivo em português e sugira uso em design.

Retorne APENAS JSON válido:
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
- Mantenha os hex codes EXATAMENTE como fornecidos
- Nomes descritivos em português (ex: "Azul royal", "Verde musgo", "Dourado quente")
- uso_sugerido prático (ex: "Cor primária / botões", "Fundo escuro", "Texto / títulos")
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
    console.error("[extract-colors]", err?.message);
    return NextResponse.json({ cores: [] }, { status: 200 });
  }
}
