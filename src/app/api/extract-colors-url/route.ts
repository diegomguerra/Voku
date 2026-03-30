import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ erro: "URL obrigatória" }, { status: 400 });

    // Usa o web_fetch do Claude para capturar o HTML e extrair as cores via CSS/inline styles
    // Abordagem: passa a URL diretamente como source type "url" na API da Anthropic
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Acesse esta URL e extraia a paleta de cores da identidade visual do site: ${url}

Analise o HTML, CSS e elementos visuais disponíveis e identifique as cores principais da marca.

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
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    
    try {
      const data = JSON.parse(clean);
      return NextResponse.json(data);
    } catch {
      // Se Claude não conseguiu acessar a URL, retornar erro informativo
      return NextResponse.json({ 
        erro: "Não foi possível extrair cores desta URL automaticamente. Tente subir uma imagem ou screenshot do site.",
        cores: [] 
      });
    }
  } catch {
    return NextResponse.json({ 
      erro: "Erro ao processar URL. Tente subir uma imagem do site.",
      cores: [] 
    }, { status: 200 });
  }
}
