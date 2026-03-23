"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/hooks/useUserContext";

const T = {
  sand: "#FAF8F3", white: "#FFFFFF", ink: "#111111", inkSub: "#3D3D3D", inkMid: "#6B6B6B", inkFaint: "#A0A0A0",
  lime: "#C8F135", border: "#E8E5DE", borderMd: "#D1CCBF",
  green: "#166534", greenBg: "#DCFCE7", red: "#DC2626", redBg: "#FEE2E2",
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ClientPhoto {
  id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  description: string | null;
  created_at: string;
  url?: string;
}

export default function FotosPage() {
  const { ctx, loading: ctxLoading } = useUserContext();
  const [userId, setUserId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<ClientPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ClientPhoto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const loadPhotos = useCallback(async (uid: string) => {
    const sb = supabase();
    const { data } = await sb
      .from("client_photos")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (!data) { setPhotos([]); return; }

    // Gera URLs assinadas para cada foto
    const withUrls = await Promise.all(
      data.map(async (photo: ClientPhoto) => {
        const { data: urlData } = await sb.storage
          .from("deliverables")
          .createSignedUrl(photo.file_path, 3600);
        return { ...photo, url: urlData?.signedUrl || "" };
      })
    );
    setPhotos(withUrls);
  }, []);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/cliente"; return; }
      setUserId(data.user.id);
      loadPhotos(data.user.id).then(() => setLoading(false));
    });
  }, [loadPhotos]);

  const handleUpload = async (files: FileList | File[]) => {
    if (!userId || uploading) return;
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    const sb = supabase();
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(f => {
      if (!ACCEPTED_TYPES.includes(f.type)) return false;
      if (f.size > MAX_FILE_SIZE) return false;
      return true;
    });

    if (validFiles.length === 0) {
      setError("Nenhum arquivo válido. Use JPG, PNG, WEBP ou GIF (máx 10MB).");
      setUploading(false);
      return;
    }

    if (validFiles.length < fileArray.length) {
      setError(`${fileArray.length - validFiles.length} arquivo(s) ignorado(s) (formato inválido ou >10MB).`);
    }

    let uploaded = 0;
    for (const file of validFiles) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/photos/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await sb.storage
        .from("deliverables")
        .upload(path, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        setError(`Erro no upload: ${uploadError.message}`);
        continue;
      }

      const { error: insertError } = await sb.from("client_photos").insert({
        user_id: userId,
        file_path: path,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });

      if (insertError) {
        console.error("DB insert error:", insertError);
        setError(`Erro ao salvar: ${insertError.message}`);
      }

      uploaded++;
      setUploadProgress(Math.round((uploaded / validFiles.length) * 100));
    }

    await loadPhotos(userId);
    setUploading(false);
    setUploadProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (photo: ClientPhoto) => {
    if (!userId) return;
    const sb = supabase();
    await sb.storage.from("deliverables").remove([photo.file_path]);
    await sb.from("client_photos").delete().eq("id", photo.id);
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
    if (selectedPhoto?.id === photo.id) setSelectedPhoto(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) handleUpload(e.dataTransfer.files);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: isMobile ? "0 16px" : "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16 }}>
          <a href="/cliente/pedidos" style={{ textDecoration: "none" }}>
            <div style={{ background: T.ink, color: "#fff", fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: isMobile ? 16 : 20, letterSpacing: "-0.5px", padding: "4px 14px", borderRadius: 6, textTransform: "uppercase" as const }}>VOKU</div>
          </a>
          {!isMobile && (
            <>
              <span style={{ color: T.borderMd, fontSize: 20 }}>|</span>
              <a href="/cliente/pedidos" style={{ fontSize: 13, fontWeight: 600, color: T.inkMid, textDecoration: "none" }}>Home</a>
              <span style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Banco de Fotos</span>
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.sand, border: `1px solid ${T.border}`, borderRadius: 10, padding: "6px 14px" }}>
            <span style={{ fontSize: 12, color: T.inkMid, fontWeight: 600 }}>Fotos</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{photos.length}</span>
          </div>
          {!isMobile && <span style={{ color: T.inkMid, fontSize: 13 }}>{ctx?.name}</span>}
          <button onClick={handleLogout} style={{ background: "transparent", border: `1.5px solid ${T.borderMd}`, color: T.inkSub, borderRadius: 8, padding: "6px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sair</button>
        </div>
      </div>

      <div style={{ padding: isMobile ? "20px 16px" : "32px 40px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Título + botão upload */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.ink, margin: "0 0 6px" }}>Banco de Fotos</h1>
            <p style={{ fontSize: 13, color: T.inkMid, margin: 0 }}>
              Suba suas fotos de referência. Os agentes Voku vão usar para entender seu estilo e criar em cima das suas imagens.
            </p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              background: T.ink, color: T.lime, border: "none", borderRadius: 12,
              padding: isMobile ? "10px 16px" : "12px 24px", fontSize: 14, fontWeight: 700,
              cursor: uploading ? "not-allowed" : "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
            {!isMobile && "Adicionar fotos"}
          </button>
        </div>

        {/* Erro */}
        {error && (
          <div style={{ background: T.redBg, color: T.red, padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: "transparent", border: "none", color: T.red, fontWeight: 800, cursor: "pointer", fontSize: 16 }}>x</button>
          </div>
        )}

        {/* Progress bar */}
        {uploading && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ background: T.border, borderRadius: 8, height: 6, overflow: "hidden" }}>
              <div style={{ background: T.lime, height: "100%", width: `${uploadProgress}%`, borderRadius: 8, transition: "width 0.3s" }} />
            </div>
            <p style={{ fontSize: 12, color: T.inkMid, marginTop: 6 }}>Enviando... {uploadProgress}%</p>
          </div>
        )}

        {/* Drop zone + galeria */}
        {photos.length === 0 && !uploading ? (
          /* Estado vazio — zona de drop grande */
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              background: dragActive ? `${T.lime}15` : T.white,
              border: `2px dashed ${dragActive ? T.lime : T.borderMd}`,
              borderRadius: 20, padding: isMobile ? "60px 20px" : "80px 40px",
              textAlign: "center", cursor: "pointer", transition: "all 0.2s",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>+</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 8 }}>
              Arraste suas fotos aqui ou clique para selecionar
            </div>
            <div style={{ fontSize: 13, color: T.inkMid }}>
              JPG, PNG, WEBP ou GIF — máximo 10MB por foto
            </div>
          </div>
        ) : (
          /* Galeria */
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
              gap: isMobile ? 8 : 16,
            }}>
              {/* Botão + para adicionar mais */}
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  aspectRatio: "1", background: dragActive ? `${T.lime}15` : T.white,
                  border: `2px dashed ${dragActive ? T.lime : T.borderMd}`,
                  borderRadius: 16, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: 36, color: T.inkFaint, fontWeight: 300, lineHeight: 1 }}>+</div>
                <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 6, fontWeight: 600 }}>Adicionar</div>
              </div>

              {photos.map(photo => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  style={{
                    aspectRatio: "1", borderRadius: 16, overflow: "hidden",
                    border: `1px solid ${T.border}`, cursor: "pointer",
                    position: "relative", background: T.white,
                  }}
                >
                  {photo.url && (
                    <img
                      src={photo.url}
                      alt={photo.file_name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                  {/* Overlay com nome */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                    padding: "20px 10px 8px",
                  }}>
                    <div style={{ fontSize: 11, color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {photo.file_name}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
                      {formatSize(photo.file_size)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={e => e.target.files && handleUpload(e.target.files)}
          style={{ display: "none" }}
        />
      </div>

      {/* Modal de preview */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: T.white, borderRadius: 20, overflow: "hidden",
              maxWidth: 700, width: "100%", maxHeight: "90vh",
              display: "flex", flexDirection: "column",
            }}
          >
            {/* Imagem */}
            <div style={{ flex: 1, overflow: "hidden", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", maxHeight: "60vh" }}>
              {selectedPhoto.url && (
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.file_name}
                  style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain" }}
                />
              )}
            </div>

            {/* Info + ações */}
            <div style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{selectedPhoto.file_name}</div>
                <div style={{ fontSize: 12, color: T.inkMid }}>
                  {formatSize(selectedPhoto.file_size)} · {selectedPhoto.file_type.split("/")[1]?.toUpperCase()} · {new Date(selectedPhoto.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  style={{
                    flex: 1, background: T.sand, color: T.inkSub, border: `1px solid ${T.border}`,
                    borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleDelete(selectedPhoto)}
                  style={{
                    background: T.redBg, color: T.red, border: `1px solid ${T.red}20`,
                    borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
