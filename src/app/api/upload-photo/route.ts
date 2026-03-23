import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const sb = supabase();
  const { data: { user }, error } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
  if (error || !user) return null;
  return user;
}

// Upload photos
export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

    const admin = supabaseAdmin();
    const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const MAX_SIZE = 10 * 1024 * 1024;
    const uploaded: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!ACCEPTED.includes(file.type)) { errors.push(`${file.name}: formato inválido`); continue; }
      if (file.size > MAX_SIZE) { errors.push(`${file.name}: excede 10MB`); continue; }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/photos/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: storageError } = await admin.storage
        .from("deliverables")
        .upload(path, buffer, { contentType: file.type });

      if (storageError) { errors.push(`${file.name}: ${storageError.message}`); continue; }

      const { error: dbError } = await admin.from("client_photos").insert({
        user_id: user.id, file_path: path, file_name: file.name,
        file_type: file.type, file_size: file.size,
      });

      if (dbError) {
        errors.push(`${file.name}: ${dbError.message}`);
        await admin.storage.from("deliverables").remove([path]);
        continue;
      }

      uploaded.push(file.name);
    }

    return NextResponse.json({ uploaded, errors });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// List photos with signed URLs
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("client_photos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ photos: [] });

    const photos = await Promise.all(
      data.map(async (photo: any) => {
        const { data: urlData } = await admin.storage
          .from("deliverables")
          .createSignedUrl(photo.file_path, 3600);
        return { ...photo, url: urlData?.signedUrl || "" };
      })
    );

    return NextResponse.json({ photos });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

// Delete photo
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, file_path } = await req.json();
    if (!id || !file_path) return NextResponse.json({ error: "Missing id or file_path" }, { status: 400 });

    const admin = supabaseAdmin();

    // Verify ownership
    const { data: photo } = await admin.from("client_photos").select("id").eq("id", id).eq("user_id", user.id).single();
    if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await admin.storage.from("deliverables").remove([file_path]);
    await admin.from("client_photos").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
