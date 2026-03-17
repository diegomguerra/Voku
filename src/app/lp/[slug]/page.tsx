import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function LandingPagePublic({ params }: { params: { slug: string } }) {
  const { data } = await supabase
    .from("landing_pages")
    .select("html_path, published")
    .eq("slug", params.slug)
    .single();

  if (!data?.published) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Página não encontrada.</div>;
  }

  const { data: file } = await supabase.storage
    .from("landing-pages")
    .download(data.html_path);

  if (!file) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Erro ao carregar página.</div>;
  }

  const html = await file.text();

  return (
    <html>
      <body dangerouslySetInnerHTML={{ __html: html }} />
    </html>
  );
}

export const dynamic = "force-dynamic";
