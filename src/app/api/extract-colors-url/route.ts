import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── Normalize short hex (#fff → #FFFFFF) ── */
function normalizeHex(h: string): string {
  let hex = h.trim().toUpperCase();
  if (hex.length === 4) hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  if (hex.length === 7) return hex;
  return "";
}

/* ── HSL saturation ── */
function saturation(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const l = (max + min) / 2;
  return l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
}

/* ── Luminance ── */
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

/* ── Fetch HTML + linked CSS, extract all hex codes with frequency ── */
async function extractColorsFromUrl(url: string): Promise<{ hex: string; count: number; sat: number }[]> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (compatible; VokuBot/1.0)",
    "Accept": "text/html,application/xhtml+xml,text/css",
  };

  // Fetch HTML
  const htmlRes = await fetch(url, { headers, signal: (() => { const c = new AbortController(); setTimeout(() => c.abort(), 10000); return c.signal; })() });
  if (!htmlRes.ok) throw new Error(`HTTP ${htmlRes.status}`);
  const html = await htmlRes.text();

  // Find linked CSS files
  const cssUrls: string[] = [];
  const linkRe = /href="([^"]*\.css[^"]*)"/gi;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    let cssUrl = m[1];
    if (cssUrl.startsWith("//")) cssUrl = "https:" + cssUrl;
    else if (cssUrl.startsWith("/")) cssUrl = new URL(cssUrl, url).href;
    else if (!cssUrl.startsWith("http")) cssUrl = new URL(cssUrl, url).href;
    cssUrls.push(cssUrl);
  }

  // Fetch CSS files (max 3, parallel)
  const cssTexts = await Promise.all(
    cssUrls.slice(0, 3).map(async (u) => {
      try {
        const ac = new AbortController(); setTimeout(() => ac.abort(), 8000);
        const r = await fetch(u, { headers, signal: ac.signal });
        return r.ok ? await r.text() : "";
      } catch { return ""; }
    })
  );

  // Combine all text
  const allText = html + "\n" + cssTexts.join("\n");

  // Extract hex codes from CSS properties AND inline styles
  const colorPropRe = /(?:color|background(?:-color)?|border(?:-color|-top-color|-bottom-color|-left-color|-right-color)?|fill|stroke|outline-color|box-shadow|text-shadow)\s*:\s*([^;}{]+)/gi;
  const colorMap: Record<string, number> = {};
  let propMatch;
  while ((propMatch = colorPropRe.exec(allText)) !== null) {
    const value = propMatch[1];
    const hexInValue = value.match(/#[0-9a-fA-F]{3,6}\b/g) || [];
    for (const raw of hexInValue) {
      const hex = normalizeHex(raw);
      if (hex) colorMap[hex] = (colorMap[hex] || 0) + 1;
    }
  }

  // Also extract from style="" attributes (React/SPA sites render inline)
  const styleAttrRe = /style="([^"]*)"/gi;
  let styleMatch;
  while ((styleMatch = styleAttrRe.exec(allText)) !== null) {
    const hexInStyle = styleMatch[1].match(/#[0-9a-fA-F]{3,6}\b/g) || [];
    for (const raw of hexInStyle) {
      const hex = normalizeHex(raw);
      if (hex) colorMap[hex] = (colorMap[hex] || 0) + 1;
    }
  }

  // Also check meta theme-color and og:image colors
  const metaRe = /content="(#[0-9a-fA-F]{3,6})"/gi;
  let metaMatch;
  while ((metaMatch = metaRe.exec(allText)) !== null) {
    const hex = normalizeHex(metaMatch[1]);
    if (hex) colorMap[hex] = (colorMap[hex] || 0) + 10; // boost meta colors
  }

  // Broad scan: extract ALL hex codes in the full HTML (catches Tailwind, CSS-in-JS, SVG fills)
  const allHexRe = /#[0-9a-fA-F]{6}\b/g;
  let allHexMatch;
  while ((allHexMatch = allHexRe.exec(allText)) !== null) {
    const hex = normalizeHex(allHexMatch[0]);
    if (hex && !colorMap[hex]) colorMap[hex] = 1; // only add if not already found
  }

  // Accept any color that appears 1+ times (very permissive for SPAs)
  const totalColors = Object.values(colorMap).reduce((a, b) => a + b, 0);
  const minCount = Math.max(1, totalColors * 0.003);

  return Object.entries(colorMap)
    .map(([hex, count]) => ({ hex, count, sat: saturation(hex) }))
    .filter(({ count }) => count >= minCount)
    .sort((a, b) => {
      const aChromatic = a.sat > 0.15 ? 1 : 0;
      const bChromatic = b.sat > 0.15 ? 1 : 0;
      if (aChromatic !== bChromatic) return bChromatic - aChromatic;
      return b.count - a.count;
    })
    .slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ erro: "URL obrigatória", cores: [] }, { status: 400 });

    const urlNorm = url.startsWith("http") ? url : `https://${url}`;

    let extracted: { hex: string; count: number; sat: number }[];
    try {
      extracted = await extractColorsFromUrl(urlNorm);
    } catch {
      return NextResponse.json({
        erro: "Não foi possível acessar o site. Verifique a URL ou suba uma imagem.",
        cores: [],
      });
    }

    if (extracted.length === 0) {
      return NextResponse.json({
        erro: "Nenhuma cor de marca encontrada no site. Suba uma imagem ou screenshot.",
        cores: [],
      });
    }

    // Ask Claude to name the already-extracted colors
    const hexList = extracted.map(c => `${c.hex} (${c.count}x, saturação ${(c.sat * 100).toFixed(0)}%)`).join(", ");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `Estas cores foram extraídas do CSS do site ${urlNorm}: ${hexList}

Para cada cor, dê um nome descritivo em português e sugira uso em design.

Retorne APENAS JSON válido:
{
  "cores": [
    { "hex": "#ED1C24", "rgb": "rgb(237, 28, 36)", "nome": "Vermelho marca", "uso_sugerido": "Botões e CTAs", "fonte": "${urlNorm}" }
  ]
}

Regras:
- Mantenha os hex codes EXATAMENTE como fornecidos
- Nomes descritivos em português
- uso_sugerido prático
- Retorne SOMENTE o JSON`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return NextResponse.json(data);
    }

    // Fallback: return raw colors with auto names
    return NextResponse.json({
      cores: extracted.map(c => ({
        hex: c.hex,
        rgb: hexToRgb(c.hex),
        nome: c.sat > 0.5 ? "Cor vibrante" : c.sat > 0.2 ? "Cor de marca" : "Cor neutra",
        uso_sugerido: c.sat > 0.3 ? "Cor primária / destaque" : "Fundo / suporte",
        fonte: urlNorm,
      })),
    });

  } catch (err: any) {
    console.error("[extract-colors-url]", err?.message);
    return NextResponse.json({
      erro: "Não foi possível extrair cores desta URL. Suba uma imagem ou screenshot.",
      cores: [],
    });
  }
}
