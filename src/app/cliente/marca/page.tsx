"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/hooks/useUserContext";

const T = {
  sand: "#FAF8F3", white: "#FFFFFF", ink: "#111111", inkSub: "#3D3D3D", inkMid: "#6B6B6B", inkFaint: "#A0A0A0",
  lime: "#C8F135", border: "#E8E5DE", borderMd: "#D1CCBF",
  green: "#166534", greenBg: "#DCFCE7", teal: "#0D7A6E", red: "#DC2626",
};

const inputStyle = {
  width: "100%", boxSizing: "border-box" as const, background: T.sand,
  border: `1.5px solid ${T.borderMd}`, borderRadius: 10, padding: "12px 16px",
  fontSize: 14, color: T.ink, fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none",
};

const textareaStyle = { ...inputStyle, resize: "vertical" as const, minHeight: 80 };

const TOM_OPTIONS = [
  "Profissional e sério",
  "Descontraído e próximo",
  "Inspiracional",
  "Educativo",
  "Direto e objetivo",
  "Irreverente e jovem",
];

export default function MarcaPage() {
  const { ctx, loading: ctxLoading } = useUserContext();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [nomeMarca, setNomeMarca] = useState("");
  const [tom, setTom] = useState("");
  const [personalidade, setPersonalidade] = useState("");
  const [palavrasChave, setPalavrasChave] = useState("");
  const [palavrasProibidas, setPalavrasProibidas] = useState("");
  const [exemplosConteudo, setExemplosConteudo] = useState("");
  const [arquivosPath, setArquivosPath] = useState<string[]>([]);

  // Load existing brand context
  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/cliente"; return; }
      setUserId(data.user.id);
      sb.from("brand_contexts")
        .select("*")
        .eq("user_id", data.user.id)
        .single()
        .then(({ data: bc }) => {
          if (bc) {
            setNomeMarca(bc.nome_marca || "");
            setTom(bc.tom || "");
            setPersonalidade(bc.personalidade || "");
            setPalavrasChave((bc.palavras_chave || []).join("\n"));
            setPalavrasProibidas((bc.palavras_proibidas || []).join("\n"));
            setExemplosConteudo(bc.exemplos_conteudo || "");
            setArquivosPath(bc.arquivos_path || []);
          }
          setLoading(false);
        });
    });
  }, []);

  const handleSave = async () => {
    if (!userId || saving) return;
    setSaving(true);
    setSaved(false);

    const sb = supabase();
    const payload = {
      user_id: userId,
      nome_marca: nomeMarca.trim() || null,
      tom: tom || null,
      personalidade: personalidade.trim() || null,
      palavras_chave: palavrasChave.trim() ? palavrasChave.trim().split("\n").map(s => s.trim()).filter(Boolean) : [],
      palavras_proibidas: palavrasProibidas.trim() ? palavrasProibidas.trim().split("\n").map(s => s.trim()).filter(Boolean) : [],
      exemplos_conteudo: exemplosConteudo.trim() || null,
      arquivos_path: arquivosPath,
      updated_at: new Date().toISOString(),
    };

    await sb.from("brand_contexts").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !userId) return;
    setUploading(true);

    const sb = supabase();
    const newPaths: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "pdf" && ext !== "txt") continue;

      const path = `${userId}/${Date.now()}_${file.name}`;
      const { error } = await sb.storage.from("brand-assets").upload(path, file);
      if (!error) newPaths.push(path);
    }

    setArquivosPath(prev => [...prev, ...newPaths]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleRemoveFile = async (path: string) => {
    const sb = supabase();
    await sb.storage.from("brand-assets").remove([path]);
    setArquivosPath(prev => prev.filter(p => p !== path));
  };

  const handleLogout = async () => {
    const sb = supabase();
    await sb.auth.signOut();
    window.location.href = "/cliente";
  };

  if (ctxLoading || loading) return (
    <div style={{ background: T.sand, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkMid, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15 }}>
      Carregando...
    </div>
  );

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
          <span style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Minha Marca</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: T.inkMid, fontSize: 13 }}>{ctx?.name}</span>
          <button onClick={handleLogout} style={{ background: "transparent", border: `1.5px solid ${T.borderMd}`, color: T.inkSub, borderRadius: 8, padding: "6px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sair</button>
        </div>
      </div>

      <div style={{ padding: "32px 40px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: "0 0 8px" }}>Brand Voice</h1>
          <p style={{ fontSize: 14, color: T.inkMid, margin: 0, lineHeight: 1.6 }}>
            Configure a voz da sua marca. O agente Voku vai usar essas informações para gerar conteúdo com o tom, as palavras e a personalidade certa para o seu negócio.
          </p>
        </div>

        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: "32px 28px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>

          {/* Nome da marca */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: T.inkSub, marginBottom: 7 }}>Nome da marca</label>
            <input value={nomeMarca} onChange={e => setNomeMarca(e.target.value)} placeholder="Ex: Voku, NutriVida, StudioX" style={inputStyle} />
          </div>

          {/* Tom */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: T.inkSub, marginBottom: 7 }}>Tom de comunicação</label>
            <select value={tom} onChange={e => setTom(e.target.value)} style={{ ...inputStyle, cursor: "pointer", appearance: "auto" as const }}>
              <option value="">Selecione...</option>
              {TOM_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Personalidade */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: T.inkSub, marginBottom: 7 }}>Personalidade da marca em 3 palavras</label>
            <input value={personalidade} onChange={e => setPersonalidade(e.target.value)} placeholder="ex: confiável, inovadora, humana" style={inputStyle} />
          </div>

          {/* Palavras-chave */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: T.inkSub, marginBottom: 7 }}>Palavras e expressões que a marca usa sempre</label>
            <textarea value={palavrasChave} onChange={e => setPalavrasChave(e.target.value)} placeholder="Uma por linha" rows={4} style={textareaStyle} />
          </div>

          {/* Palavras proibidas */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: T.inkSub, marginBottom: 7 }}>Palavras que a marca NUNCA usa</label>
            <textarea value={palavrasProibidas} onChange={e => setPalavrasProibidas(e.target.value)} placeholder="Uma por linha" rows={4} style={textareaStyle} />
          </div>

          {/* Exemplos */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: T.inkSub, marginBottom: 7 }}>Exemplos de conteúdo da marca</label>
            <textarea value={exemplosConteudo} onChange={e => setExemplosConteudo(e.target.value)} placeholder="Cole aqui textos, legendas, copies ou qualquer conteúdo que represente o tom da marca..." rows={6} style={{ ...textareaStyle, minHeight: 140 }} />
          </div>

          {/* Upload de arquivos */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: T.inkSub, marginBottom: 7 }}>Arquivos de referência (PDF, TXT)</label>

            {/* Lista de arquivos enviados */}
            {arquivosPath.length > 0 && (
              <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                {arquivosPath.map(path => {
                  const fileName = path.split("/").pop() || path;
                  return (
                    <div key={path} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.sand, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px" }}>
                      <span style={{ fontSize: 12, color: T.inkSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>{fileName}</span>
                      <button onClick={() => handleRemoveFile(path)} style={{ background: "transparent", border: "none", color: T.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: "2px 6px" }}>Remover</button>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${T.borderMd}`, borderRadius: 12, padding: "20px",
                textAlign: "center", cursor: "pointer", transition: "border-color 0.2s",
              }}
            >
              <div style={{ fontSize: 13, color: T.inkMid, fontWeight: 600 }}>
                {uploading ? "Enviando..." : "Clique para enviar arquivos PDF ou TXT"}
              </div>
              <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 4 }}>Múltiplos arquivos permitidos</div>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.txt" multiple onChange={handleUpload} style={{ display: "none" }} />
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving} style={{
            width: "100%", background: saving ? T.inkMid : T.ink, color: T.lime,
            border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}>
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>

          {saved && (
            <div style={{ marginTop: 14, background: T.greenBg, color: T.green, padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: "center" }}>
              Configurações salvas com sucesso!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
