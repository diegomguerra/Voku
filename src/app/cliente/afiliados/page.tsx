"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/hooks/useUserContext";
import { LAUNCH_POSTS } from "@/content/launch-posts";

const T = {
  sand: "#FAF8F3", white: "#FFFFFF", ink: "#111111", inkSub: "#3D3D3D", inkMid: "#6B6B6B", inkFaint: "#A0A0A0",
  lime: "#C8F135", border: "#E8E5DE", borderMd: "#D1CCBF",
  green: "#166534", greenBg: "#DCFCE7", teal: "#0D7A6E", tealBg: "#E6F5F3",
};

const COMISSOES = [
  { plano: "Starter", preco: "R$149", creditos: 20, desc: "20% de 100cr" },
  { plano: "Pro", preco: "R$397", creditos: 60, desc: "20% de 300cr" },
  { plano: "Business", preco: "R$897", creditos: 160, desc: "20% de 800cr" },
];

const WHATSAPP_TEXT = `Ei! Conhece a Voku? É uma plataforma que cria landing pages, posts e copy de anúncios com IA em minutos. Eu uso e funciona muito. Testa grátis: voku.one/?ref={CODIGO}`;
const INSTA_TEXT = `Se você gasta horas criando conteúdo, precisa conhecer a Voku. IA que cria posts, landing pages e copy em minutos. Testa grátis: voku.one/?ref={CODIGO}`;
const LINKEDIN_TEXT = `Descobri uma ferramenta que mudou minha produtividade em marketing: a Voku. IA que gera landing pages, posts e sequências de e-mail em minutos. Vale testar: voku.one/?ref={CODIGO}`;

type Referral = { id: string; plan_purchased: string | null; creditos_gerados: number; created_at: string };

export default function AfiliadosPage() {
  const { ctx, loading: ctxLoading } = useUserContext();
  const [affiliate, setAffiliate] = useState<any>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = "/cliente"; return; }

      // Get or create affiliate
      let { data: aff } = await sb.from("affiliates").select("*").eq("user_id", data.user.id).single();
      if (!aff) {
        const { data: newAff } = await sb.from("affiliates").insert({ user_id: data.user.id }).select().single();
        aff = newAff;
      }
      setAffiliate(aff);

      // Get referrals
      if (aff) {
        const { data: refs } = await sb.from("affiliate_referrals").select("*").eq("affiliate_id", aff.id).order("created_at", { ascending: false });
        setReferrals(refs || []);
      }
      setLoading(false);
    });
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLogout = async () => {
    const sb = supabase(); await sb.auth.signOut(); window.location.href = "/cliente";
  };

  if (ctxLoading || loading) return (
    <div style={{ background: T.sand, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkMid, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15 }}>Carregando...</div>
  );

  const codigo = affiliate?.codigo || "---";
  const link = `voku.one/?ref=${codigo}`;

  return (
    <div style={{ background: T.sand, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      {/* Header */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/cliente/pedidos" style={{ textDecoration: "none" }}>
            <div style={{ background: T.ink, color: T.lime, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 20, padding: "4px 14px", borderRadius: 6 }}>Voku</div>
          </a>
          <span style={{ color: T.borderMd, fontSize: 20 }}>|</span>
          <a href="/cliente/pedidos" style={{ fontSize: 13, fontWeight: 600, color: T.inkMid, textDecoration: "none" }}>Home</a>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Programa de Afiliados</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: T.inkMid, fontSize: 13 }}>{ctx?.name}</span>
          <button onClick={handleLogout} style={{ background: "transparent", border: `1.5px solid ${T.borderMd}`, color: T.inkSub, borderRadius: 8, padding: "6px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sair</button>
        </div>
      </div>

      <div style={{ padding: "32px 40px", maxWidth: 900, margin: "0 auto" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 16, marginBottom: 32 }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: "22px 24px" }}>
            <div style={{ fontSize: 11, color: T.inkMid, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Indicados</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: T.ink }}>{affiliate?.total_indicados || 0}</div>
          </div>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: "22px 24px" }}>
            <div style={{ fontSize: 11, color: T.inkMid, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Créditos ganhos</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: T.green }}>{affiliate?.total_ganho_creditos || 0}</div>
          </div>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: "22px 24px" }}>
            <div style={{ fontSize: 11, color: T.inkMid, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Seu link</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <code style={{ fontSize: 15, fontWeight: 700, color: T.ink, background: T.sand, padding: "6px 12px", borderRadius: 8, flex: 1 }}>{link}</code>
              <button onClick={() => copyToClipboard(`https://${link}`, "link")} style={{ background: T.lime, color: T.ink, border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                {copied === "link" ? "Copiado!" : "Copiar link"}
              </button>
            </div>
          </div>
        </div>

        {/* Como funciona */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 18, padding: "28px 28px 24px", marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: "0 0 16px" }}>Como funciona</h2>
          <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
            {["Compartilhe seu link", "Alguém assina um plano", "Você ganha 20% em créditos"].map((step, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.lime, color: T.ink, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, margin: "0 auto 10px" }}>{i + 1}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.inkSub }}>{step}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.sand, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "10px 16px", borderBottom: `1px solid ${T.border}` }}>
              {["Plano", "Preço", "Você ganha", ""].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
              ))}
            </div>
            {COMISSOES.map(c => (
              <div key={c.plano} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{c.plano}</span>
                <span style={{ fontSize: 14, color: T.inkSub }}>{c.preco}/mês</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.green }}>{c.creditos} créditos</span>
                <span style={{ fontSize: 11, color: T.inkFaint }}>{c.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Histórico */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 18, padding: "28px 28px 24px", marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: "0 0 16px" }}>Histórico de indicações</h2>
          {referrals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: T.inkFaint, fontSize: 14 }}>Nenhuma indicação ainda. Compartilhe seu link!</div>
          ) : (
            <div>
              {referrals.map(r => (
                <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 13, color: T.inkSub }}>{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                  <span style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{r.plan_purchased || "Free"}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{r.creditos_gerados > 0 ? `+${r.creditos_gerados} créditos` : "Aguardando"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Materiais */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: "0 0 16px" }}>Materiais de divulgação</h2>

          {/* Textos prontos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { label: "WhatsApp", text: WHATSAPP_TEXT.replace("{CODIGO}", codigo), id: "wa" },
              { label: "Instagram", text: INSTA_TEXT.replace("{CODIGO}", codigo), id: "ig" },
              { label: "LinkedIn", text: LINKEDIN_TEXT.replace("{CODIGO}", codigo), id: "li" },
            ].map(m => (
              <div key={m.id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 14px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 12, color: T.inkMid, lineHeight: 1.5, marginBottom: 12, maxHeight: 80, overflow: "hidden" }}>{m.text}</div>
                <button onClick={() => copyToClipboard(m.text, m.id)} style={{ background: T.sand, border: `1px solid ${T.borderMd}`, borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: T.inkSub, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
                  {copied === m.id ? "Copiado!" : "Copiar texto"}
                </button>
              </div>
            ))}
          </div>

          {/* Roteiros de Reels */}
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.inkSub, margin: "0 0 12px" }}>Roteiros de Reels</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {LAUNCH_POSTS.map(post => (
              <div key={post.id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 18px 14px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 8 }}>{post.titulo}</div>
                <pre style={{ fontSize: 12, color: T.inkMid, lineHeight: 1.6, whiteSpace: "pre-wrap", margin: "0 0 12px", maxHeight: 120, overflow: "hidden" }}>{post.roteiro.slice(0, 300)}...</pre>
                <button onClick={() => copyToClipboard(post.roteiro, post.id)} style={{ background: T.sand, border: `1px solid ${T.borderMd}`, borderRadius: 8, padding: "6px 14px", fontSize: 11, fontWeight: 700, color: T.inkSub, cursor: "pointer", fontFamily: "inherit" }}>
                  {copied === post.id ? "Copiado!" : "Copiar roteiro completo"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
