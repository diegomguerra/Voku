import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AppPublicPage({ params }: { params: { slug: string } }) {
  // Busca app público ou do dono
  const { data } = await supabase
    .from("apps")
    .select("html_path, publico, user_id")
    .eq("slug", params.slug)
    .single();

  if (!data) {
    return <div style={{ padding: 40, fontFamily: "sans-serif", textAlign: "center", marginTop: 80 }}>App não encontrado.</div>;
  }

  // Apenas apps públicos são visíveis na rota pública (server component não tem auth fácil)
  // Para apps privados, o owner acessa via dashboard
  if (!data.publico) {
    return <div style={{ padding: 40, fontFamily: "sans-serif", textAlign: "center", marginTop: 80 }}>Este app não está publicado.</div>;
  }

  const { data: file } = await supabase.storage
    .from("apps")
    .download(data.html_path);

  if (!file) {
    return <div style={{ padding: 40, fontFamily: "sans-serif", textAlign: "center", marginTop: 80 }}>Erro ao carregar app.</div>;
  }

  const html = await file.text();

  return (
    <html>
      <body dangerouslySetInnerHTML={{ __html: html }} />
    </html>
  );
}

export const dynamic = "force-dynamic";
