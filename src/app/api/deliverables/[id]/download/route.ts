import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sb = supabaseAdmin();
    const { data: del, error } = await sb
      .from("deliverables")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !del) {
      return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
    }

    // If file_path exists, return signed URL from storage
    if (del.file_path) {
      const { data: urlData } = await sb.storage
        .from(del.storage_bucket || "deliverables")
        .createSignedUrl(del.file_path, 3600);

      if (urlData?.signedUrl) {
        return NextResponse.json({ url: urlData.signedUrl });
      }
    }

    // If content exists, return as downloadable text
    if (del.content) {
      const filename = del.file_name || `${del.title || "deliverable"}.txt`;
      return new NextResponse(del.content, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: "No content available" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
