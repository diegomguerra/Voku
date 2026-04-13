import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  uploadReferenceImages,
  generateLanding,
  refineLanding,
  getExistingLandingHtml,
} from "@/lib/lovable-payload";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let orderIdForError: string | undefined;
  try {
    const body = await req.json();
    const { order_id, structured_data, refinement_instructions } = body;
    orderIdForError = order_id;

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const sd = structured_data || {};

    // Refinement mode: existing HTML + free-text instructions
    const existing = order_id ? await getExistingLandingHtml(sb, order_id) : null;
    const instructions: string | undefined =
      refinement_instructions || sd.refinement_instructions || sd.instrucoes_revisao;

    let html = "";
    let previewText = "";
    let contentCopy: Record<string, any> = {};

    if (existing?.html && instructions) {
      console.log(`[generate-landing] Refining existing HTML for order=${order_id}`);
      const result = await refineLanding(existing.html, instructions);
      if (!result.ok) {
        console.error(`[generate-landing] Lovable refine error ${result.status}:`, result.error);
        if (order_id) await sb.from("orders").update({ status: "failed" }).eq("id", order_id);
        return NextResponse.json(
          { error: result.userMessage || `Lovable Cloud error: ${result.status}` },
          { status: result.status === 429 || result.status === 402 ? result.status : 502 }
        );
      }
      html = result.html || "";
      previewText = instructions.slice(0, 300);
      contentCopy = { refinement_instructions: instructions };
    } else {
      const imagesArray = order_id
        ? await uploadReferenceImages(sb, order_id, sd)
        : Array.isArray(sd.images)
        ? sd.images.filter((u: any) => typeof u === "string")
        : [];

      let conversation = sd.raw_conversation ?? sd.conversation;
      if (!conversation && order_id) {
        const { data: briefingRow } = await sb
          .from("briefings")
          .select("raw_conversation")
          .eq("order_id", order_id)
          .maybeSingle();
        conversation = briefingRow?.raw_conversation;
      }

      const result = await generateLanding(sd, imagesArray, conversation);
      if (!result.ok) {
        console.error(`[generate-landing] Lovable error ${result.status}:`, result.error);
        if (order_id) await sb.from("orders").update({ status: "failed" }).eq("id", order_id);
        return NextResponse.json(
          { error: result.userMessage || `Lovable Cloud error: ${result.status}` },
          { status: result.status === 429 || result.status === 402 ? result.status : 502 }
        );
      }
      html = result.html || "";
      previewText = (sd.headline || sd.resumo || sd.nome_marca || "").toString().slice(0, 300);
      contentCopy = { text: previewText };
    }

    if (!html) {
      return NextResponse.json({ error: "Lovable returned empty HTML" }, { status: 502 });
    }

    if (order_id) {
      const choicePayload = {
        html_content: html,
        content: { text: previewText, ...contentCopy },
        label: "Landing Page",
        type: "landing_page_copy",
        is_selected: false,
        position: 0,
      };

      if (existing?.choice_id) {
        await sb.from("choices").update(choicePayload).eq("id", existing.choice_id);
      } else {
        await sb.from("choices").insert({ ...choicePayload, order_id });
      }

      await sb
        .from("orders")
        .update({ status: "awaiting_approval", preview_text: previewText })
        .eq("id", order_id);

      await sb
        .from("project_phases")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("order_id", order_id)
        .in("phase_number", [1, 2, 3]);
    }

    return NextResponse.json({ ok: true, html });
  } catch (err: any) {
    console.error("[generate-landing] Error:", err.message);
    if (orderIdForError) {
      try {
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await sb.from("orders").update({ status: "failed" }).eq("id", orderIdForError);
      } catch {}
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
