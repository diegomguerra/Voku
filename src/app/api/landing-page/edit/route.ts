import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { slug, instruction } = await req.json();

    const { data: lp } = await supabase
      .from("landing_pages")
      .select("html_path")
      .eq("slug", slug)
      .single();

    if (!lp) return NextResponse.json({ error: "LP não encontrada" }, { status: 404 });

    const { data: file } = await supabase.storage
      .from("landing-pages")
      .download(lp.html_path);

    const currentHtml = await file!.text();

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `Edite este HTML de landing page aplicando a seguinte instrução: "${instruction}"\n\nRetorne APENAS o HTML completo editado, sem explicações.\n\nHTML ATUAL:\n${currentHtml}`
      }]
    });

    let newHtml = response.content[0].type === "text" ? response.content[0].text : "";
    newHtml = newHtml.replace(/^```html\n?/, "").replace(/\n?```$/, "").trim();

    await supabase.storage
      .from("landing-pages")
      .upload(lp.html_path, new Blob([newHtml], { type: "text/html" }), { upsert: true });

    await supabase.from("landing_pages")
      .update({ updated_at: new Date().toISOString() })
      .eq("slug", slug);

    return NextResponse.json({ ok: true, slug });
  } catch (error) {
    console.error("LP edit error:", error);
    return NextResponse.json({ error: "Erro ao editar LP" }, { status: 500 });
  }
}
