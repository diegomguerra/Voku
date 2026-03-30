import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const maxDuration = 30;

export async function POST(req: Request) {
  let browser;
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ erro: "URL obrigatória" }, { status: 400 });

    const urlNorm = url.startsWith("http") ? url : `https://${url}`;

    // Launch headless browser (works on Vercel serverless)
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 900 },
      executablePath: await chromium.executablePath(),
      headless: "shell",
    });

    const page = await browser.newPage();
    await page.goto(urlNorm, { waitUntil: "networkidle2", timeout: 15000 });

    // Wait a bit for fonts/images to render
    await new Promise(r => setTimeout(r, 1500));

    // Screenshot as PNG base64
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false, // viewport only (above the fold)
      encoding: "base64",
    });

    await browser.close();
    browser = null;

    return NextResponse.json({
      image: screenshot,
      mediaType: "image/png",
      url: urlNorm,
    });
  } catch (err: any) {
    if (browser) await browser.close().catch(() => {});
    console.error("[screenshot-url]", err?.message);
    return NextResponse.json({
      erro: "Não foi possível capturar o site. Verifique a URL.",
    }, { status: 200 });
  }
}
