import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANT_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const FAL_KEY = Deno.env.get("FAL_KEY") || Deno.env.get("FAL_API_KEY") || "";
const IDG_KEY = Deno.env.get("IDEOGRAM_API_KEY") || "";
const IMA_KEY = Deno.env.get("IMAGINEART_API_KEY") || "";
const BKT = "imagens";

// ── Claude: builds image prompt from post data ─────────────────────────
async function mkPrompt(post: any): Promise<string> {
  const t = post.tipo || "POST";
  const tit = post.titulo || "";
  const leg = post.legenda || "";
  const pil = post.pilar || "";
  const ht = (post.hashtags || []).join(", ");
  const pw = post.pillow || {};
  const reel = t.toUpperCase() === "REEL" || pw.formato === "9:16";
  const rat = reel ? "9:16 vertical" : "1:1 square";

  const msg = `Create an English image generation prompt for Instagram. Post: type=${t}, format=${rat}, pillar=${pil}, title=${tit}, caption=${leg}, hashtags=${ht}. Describe scenario, lighting, colors, composition, mood. Cinematic photography style. Format ${rat}. NO text in image. End: high quality, professional, sharp focus, 4k. 100-180 words. Return ONLY prompt.`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANT_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: msg }],
    }),
  });

  const d = await r.json();
  return d.content?.[0]?.text?.trim() ?? tit;
}

// ── Engine 1: fal.ai (FLUX Pro v1.1) ──────────────────────────────────
async function falGen(p: string, reel: boolean): Promise<string | null> {
  if (!FAL_KEY) return null;
  const w = reel ? 1080 : 1024;
  const h = reel ? 1920 : 1024;

  const r = await fetch("https://fal.run/fal-ai/flux-pro/v1.1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${FAL_KEY}`,
    },
    body: JSON.stringify({
      prompt: p,
      image_size: { width: w, height: h },
      num_images: 1,
      enable_safety_checker: true,
      sync_mode: true,
    }),
  });

  if (!r.ok) {
    const e = await r.text();
    throw new Error(`fal ${r.status}: ${e.substring(0, 200)}`);
  }

  const d = await r.json();
  return d.images?.[0]?.url ?? null;
}

// ── Engine 2: Ideogram v3 turbo ────────────────────────────────────────
async function idgGen(p: string, reel: boolean): Promise<string | null> {
  if (!IDG_KEY) return null;
  const rat = reel ? "9x16" : "1x1";

  const r = await fetch("https://api.ideogram.ai/v1/ideogram-v3/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": IDG_KEY,
    },
    body: JSON.stringify({
      prompt: p,
      rendering_speed: "TURBO",
      magic_prompt: "AUTO",
      aspect_ratio: rat,
      style_type: "REALISTIC",
    }),
  });

  if (!r.ok) {
    const e = await r.text();
    throw new Error(`ideogram ${r.status}: ${e.substring(0, 200)}`);
  }

  const d = await r.json();
  return d.data?.[0]?.url ?? null;
}

// ── Engine 3: ImagineArt (vyro.ai) ────────────────────────────────────
async function imaGen(p: string, reel: boolean): Promise<string | null> {
  if (!IMA_KEY) return null;
  const rat = reel ? "9:16" : "1:1";

  const f = new FormData();
  f.append("prompt", p);
  f.append("style", "realistic");
  f.append("aspect_ratio", rat);

  const r = await fetch("https://api.vyro.ai/v2/image/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${IMA_KEY}` },
    body: f,
  });

  if (!r.ok) {
    const e = await r.text();
    throw new Error(`imagineart ${r.status}: ${e.substring(0, 300)}`);
  }

  const ct = r.headers.get("content-type") || "image/jpeg";
  const buf = await r.arrayBuffer();
  if (buf.byteLength < 1000) return null;

  const sb = createClient(SB_URL, SB_KEY);
  const path = `imagineart-tmp/${Date.now()}.jpg`;
  const { error } = await sb.storage
    .from(BKT)
    .upload(path, buf, { contentType: ct, upsert: true });
  if (error) return null;

  const { data } = sb.storage.from(BKT).getPublicUrl(path);
  return data.publicUrl;
}

// ── Upload remote URL to Storage ───────────────────────────────────────
async function upRemoto(
  sb: any,
  url: string,
  sp: string
): Promise<string | null> {
  const r = await fetch(url);
  if (!r.ok) return null;
  const b = await r.arrayBuffer();
  const ct = r.headers.get("content-type") || "image/png";
  const { error } = await sb.storage
    .from(BKT)
    .upload(sp, b, { contentType: ct, upsert: true });
  if (error) return null;
  const { data } = sb.storage.from(BKT).getPublicUrl(sp);
  return data.publicUrl;
}

// ── Main handler ───────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: CORS });

  const u = new URL(req.url);
  const b = req.method === "POST" ? await req.json().catch(() => ({})) : {};

  const sk = u.searchParams.get("semana_key") || b.semana_key;
  const pi = u.searchParams.get("post_id") || b.post_id;
  const up = u.searchParams.get("upload") === "true" || b.upload === true;
  const eo = u.searchParams.get("engine") || b.engine || null;

  if (!sk || !pi) {
    return new Response(
      JSON.stringify({ error: "semana_key e post_id obrigatorios" }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  const sb = createClient(SB_URL, SB_KEY);
  const { data: sem, error: se } = await sb
    .from("semanas_conteudo")
    .select("posts")
    .eq("semana_key", sk)
    .single();

  if (se || !sem) {
    return new Response(
      JSON.stringify({ error: "Semana nao encontrada" }),
      { status: 404, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  const post = (sem.posts || []).find((x: any) => x.id === pi);
  if (!post) {
    return new Response(
      JSON.stringify({ error: "Post nao encontrado" }),
      { status: 404, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  const tipo = (post.tipo || "POST").toUpperCase();
  const reel = tipo === "REEL" || post.pillow?.formato === "9:16";

  let pr: string;
  try {
    pr = await mkPrompt(post);
  } catch {
    pr = `${post.titulo || "professional Instagram post"}, modern design, high quality, 4k`;
  }

  // Engine fallback order: fal → ideogram → imagineart
  const eng: Array<[string, () => Promise<string | null>]> = [
    ["fal", () => falGen(pr, reel)],
    ["ideogram", () => idgGen(pr, reel)],
    ["imagineart", () => imaGen(pr, reel)],
  ];

  let iu: string | null = null;
  let eu = "none";
  const errs: Record<string, string> = {};

  for (const [n, fn] of eng) {
    if (eo && eo !== n) continue;
    try {
      iu = await fn();
      if (iu) {
        eu = n;
        break;
      }
    } catch (e: any) {
      errs[n] = e.message;
    }
  }

  if (!iu) {
    return new Response(
      JSON.stringify({
        error: "Falha em todos os engines",
        prompt: pr,
        engine_errors: errs,
        engines_tentados: eo ? [eo] : ["fal", "ideogram", "imagineart"],
        keys_configuradas: {
          fal: !!FAL_KEY,
          ideogram: !!IDG_KEY,
          imagineart: !!IMA_KEY,
        },
      }),
      { status: 503, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  if (up && eu !== "imagineart") {
    const sp = `${sk}/${pi}.png`;
    const pu = await upRemoto(sb, iu, sp);
    return new Response(
      JSON.stringify({
        ok: true,
        url: pu ?? iu,
        path: pu ? sp : null,
        engine: eu,
        prompt: pr,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ ok: true, url: iu, engine: eu, prompt: pr }),
    { headers: { ...CORS, "Content-Type": "application/json" } }
  );
});
