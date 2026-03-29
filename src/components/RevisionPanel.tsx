"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

/* ── Design tokens (same as page) ── */
const T = {
  lime: "#C8F135", ink: "#111111", bg: "#FFFFFF", sand: "#FAF8F3",
  border: "#E8E5DE", muted: "#888888",
};
const FF = "'Plus Jakarta Sans', sans-serif";
const FI = "'Inter', sans-serif";

/* ── Products that support revision ── */
export const REVISION_PRODUCTS = [
  "landing_page_copy",
  "content_pack",
  "post_instagram",
  "carrossel",
  "reels_script",
];

/* ── Placeholders by product ── */
function getPlaceholder(produto: string): string {
  const map: Record<string, string> = {
    landing_page_copy: "Ex: Quero mudar a cor do botão para azul, o headline está muito genérico, adicionar seção de depoimentos...",
    content_pack: "Ex: Os posts estão muito formais, quero um tom mais próximo, mudar a hashtag, incluir mais emojis...",
    post_instagram: "Ex: Os posts estão muito formais, quero um tom mais próximo, mudar a hashtag, incluir mais emojis...",
    carrossel: "Ex: O primeiro slide precisa de um hook mais impactante, reduzir de 9 para 7 slides, mudar a estrutura...",
    reels_script: "Ex: O roteiro está muito longo para 30s, quero uma abertura mais direta, mudar o CTA final...",
  };
  return map[produto] || "Descreva com detalhes o que você gostaria de alterar...";
}

/* ── File helpers ── */
function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "🖼️";
  if (["svg"].includes(ext)) return "🎨";
  if (["pdf"].includes(ext)) return "📄";
  if (["ai", "eps"].includes(ext)) return "🎯";
  if (["fig", "sketch"].includes(ext)) return "📐";
  return "📎";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/* ── Tipo alteração options ── */
const TIPOS = [
  { id: "texto", label: "Texto / copy" },
  { id: "tom", label: "Tom de voz" },
  { id: "cores", label: "Cores / estilo visual" },
  { id: "estrutura", label: "Estrutura / ordem" },
  { id: "imagens", label: "Imagens / fotos" },
  { id: "outro", label: "Outro" },
];

/* ── Props ── */
interface RevisionPanelProps {
  orderId: string;
  choiceId?: string;
  produto: string;
  onClose: () => void;
  onSubmit: (arquivosCount: number) => void;
}

export default function RevisionPanel({ orderId, choiceId, produto, onClose, onSubmit }: RevisionPanelProps) {
  const [tiposSelecionados, setTiposSelecionados] = useState<string[]>([]);
  const [descricao, setDescricao] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTipo = (id: string) => {
    setTiposSelecionados(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const valid = Array.from(fileList).filter(f => f.size <= MAX_FILE_SIZE);
    setArquivos(prev => [...prev, ...valid]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removerArquivo = (idx: number) => {
    setArquivos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!descricao.trim()) return;
    setEnviando(true);

    try {
      // 1. Upload files to Supabase Storage
      const sb = supabase();
      const urlsArquivos: string[] = [];
      for (const arquivo of arquivos) {
        const path = `revisoes/${orderId}/${Date.now()}_${arquivo.name}`;
        const { error } = await sb.storage.from("deliverables").upload(path, arquivo);
        if (!error) {
          const { data: urlData } = await sb.storage.from("deliverables").createSignedUrl(path, 86400);
          if (urlData?.signedUrl) urlsArquivos.push(urlData.signedUrl);
        }
      }

      // 2. Send revision request to API
      await fetch(`/api/projects/${orderId}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choice_id: choiceId,
          tipos: tiposSelecionados,
          descricao,
          arquivos_referencia: urlsArquivos,
        }),
      });

      // 3. Callback
      onSubmit(arquivos.length);
    } catch (err) {
      console.error("Erro ao enviar revisão:", err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{
      background: T.sand, border: `1.5px solid ${T.border}`, borderRadius: 14,
      padding: 20, marginTop: 12, animation: "fadeUp 0.2s ease",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: FI }}>Solicitar alteração</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2, fontFamily: FF }}>
            Descreva o que quer mudar e suba arquivos de referência se tiver.
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: T.muted }}>×</button>
      </div>

      {/* Tipo de alteração */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, fontFamily: FI }}>
          O que você quer mudar?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {TIPOS.map(tipo => (
            <label key={tipo.id} onClick={() => toggleTipo(tipo.id)} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 10px",
              background: tiposSelecionados.includes(tipo.id) ? "#EAF3DE" : T.bg,
              border: tiposSelecionados.includes(tipo.id) ? `1.5px solid ${T.lime}` : `1px solid ${T.border}`,
              borderRadius: 8, cursor: "pointer", fontSize: 12, color: T.ink,
              transition: "all 0.15s", fontFamily: FF,
            }}>
              {tipo.label}
            </label>
          ))}
        </div>
      </div>

      {/* Descrição */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6, fontFamily: FI }}>
          Descreva o que mudar *
        </div>
        <textarea
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          placeholder={getPlaceholder(produto)}
          rows={4}
          style={{
            width: "100%", background: T.bg, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: FF,
            color: T.ink, resize: "vertical", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Upload */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6, fontFamily: FI }}>
          Arquivos de referência (opcional)
        </div>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `1.5px dashed ${dragging ? T.lime : "#D1CCBF"}`,
            borderRadius: 10, padding: 16, textAlign: "center", cursor: "pointer",
            background: dragging ? "#F5FDE8" : T.bg, transition: "all 0.15s",
          }}
        >
          <div style={{ fontSize: 22, marginBottom: 6 }}>📎</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, fontFamily: FF }}>
            Clique ou arraste arquivos aqui
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 3, fontFamily: FF }}>
            Logo, paleta de cores, fotos, prints de referência<br />
            PNG, JPG, SVG, PDF, AI, Figma — até 20MB por arquivo
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.ai,.svg,.eps,.fig,.sketch"
            onChange={e => handleFiles(e.target.files)}
            style={{ display: "none" }}
          />
        </div>

        {/* File list */}
        {arquivos.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {arquivos.map((file, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 10px", background: T.bg,
                border: `0.5px solid ${T.border}`, borderRadius: 8,
              }}>
                <span style={{ fontSize: 14 }}>{getFileIcon(file.name)}</span>
                <span style={{ fontSize: 12, color: T.ink, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FF }}>
                  {file.name}
                </span>
                <span style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>
                  {formatFileSize(file.size)}
                </span>
                <button onClick={() => removerArquivo(i)}
                  style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16, padding: "0 2px" }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!descricao.trim() || enviando}
        style={{
          width: "100%",
          background: descricao.trim() ? T.ink : T.border,
          color: descricao.trim() ? T.lime : T.muted,
          border: "none", borderRadius: 10, padding: 11,
          fontSize: 13, fontWeight: 700, fontFamily: FI,
          cursor: descricao.trim() && !enviando ? "pointer" : "not-allowed",
          transition: "all 0.15s",
        }}
      >
        {enviando ? "Enviando..." : "Enviar pedido de alteração"}
      </button>
    </div>
  );
}
