"use client";
import { useState, useRef, useEffect } from "react";

/* ── Types ── */
export interface CoreExtraida {
  hex: string;
  rgb: string;
  nome: string;
  uso_sugerido: string;
  fonte: string;
}

interface ColorExtractorProps {
  cores: CoreExtraida[];
  onChange: (cores: CoreExtraida[]) => void;
  maxCores?: number;
}

/* ── Helpers ── */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function nomeAutomatico(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (brightness > 200) return "Cor clara";
  if (brightness < 60) return "Cor escura";
  if (r > g && r > b) return "Tom quente";
  if (g > r && g > b) return "Tom verde";
  if (b > r && b > g) return "Tom frio";
  return "Cor neutra";
}

/* ── Component ── */
export default function ColorExtractor({ cores, onChange, maxCores = 12 }: ColorExtractorProps) {
  const [extraindo, setExtraindo] = useState(false);
  const [imagensProcessadas, setImagensProcessadas] = useState<string[]>([]);
  const [hexManual, setHexManual] = useState("");
  const [dragging, setDragging] = useState(false);
  const [erroHex, setErroHex] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Pre-load saved brand palette
  useEffect(() => {
    if (cores.length > 0) return;
    fetch("/api/marca/paleta")
      .then(r => r.json())
      .then(data => {
        if (data.cores?.length > 0 && cores.length === 0) {
          onChange(data.cores);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processarImagens = async (files: FileList | File[]) => {
    setExtraindo(true);
    const filesArray = Array.from(files);

    for (const file of filesArray) {
      if (file.size > 10 * 1024 * 1024) continue;
      const base64 = await fileToBase64(file);
      try {
        const res = await fetch("/api/extract-colors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mediaType: file.type, filename: file.name }),
        });
        const data = await res.json();
        if (data.cores?.length > 0) {
          const novas = data.cores.filter(
            (nova: CoreExtraida) => !cores.some(e => e.hex.toLowerCase() === nova.hex.toLowerCase())
          );
          onChange([...cores, ...novas].slice(0, maxCores));
          setImagensProcessadas(prev => [...prev, file.name]);
        }
      } catch (err) {
        console.error("Erro ao extrair cores:", err);
      }
    }
    setExtraindo(false);
  };

  const adicionarHexManual = () => {
    const hex = hexManual.startsWith("#") ? hexManual : "#" + hexManual;
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setErroHex("Código inválido. Use formato #RRGGBB");
      return;
    }
    if (cores.some(c => c.hex.toLowerCase() === hex.toLowerCase())) {
      setErroHex("Esta cor já foi adicionada");
      return;
    }
    onChange([...cores, {
      hex: hex.toUpperCase(),
      rgb: hexToRgb(hex),
      nome: nomeAutomatico(hex),
      uso_sugerido: "",
      fonte: "manual",
    }]);
    setHexManual("");
    setErroHex("");
  };

  const removerCor = (index: number) => onChange(cores.filter((_, i) => i !== index));

  const editarNome = (index: number, nome: string) => {
    const updated = [...cores];
    updated[index] = { ...updated[index], nome };
    onChange(updated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); processarImagens(e.dataTransfer.files); }}
        style={{
          border: `1.5px dashed ${dragging ? "#C8F135" : "#D1CCBF"}`,
          borderRadius: 12, padding: 20, textAlign: "center", cursor: "pointer",
          background: dragging ? "#F5FDE8" : "#FAF8F3", transition: "all 0.15s",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎨</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 4 }}>
          {extraindo ? "Extraindo cores..." : "Suba prints ou screenshots com suas cores"}
        </div>
        <div style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>
          Paleta de marca, site de referência, apresentação, foto de produto<br />
          Pode subir vários arquivos de uma vez — PNG, JPG até 10MB
        </div>
        {extraindo && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ width: 16, height: 16, border: "2px solid #E8E5DE", borderTopColor: "#C8F135", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 12, color: "#888" }}>Analisando imagem com IA...</span>
          </div>
        )}
        <input ref={fileRef} type="file" multiple accept="image/*" onChange={e => e.target.files && processarImagens(e.target.files)} style={{ display: "none" }} />
      </div>

      {/* Processed files badges */}
      {imagensProcessadas.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {imagensProcessadas.map((nome, i) => (
            <span key={i} style={{ background: "#EAF3DE", color: "#27500A", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500 }}>
              ✓ {nome}
            </span>
          ))}
        </div>
      )}

      {/* OR divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: "#E8E5DE" }} />
        <span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>OU adicione manualmente</span>
        <div style={{ flex: 1, height: 1, background: "#E8E5DE" }} />
      </div>

      {/* Manual hex input */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 0 }}>
            <span style={{
              background: hexManual && /^#?[0-9A-Fa-f]{6}$/.test(hexManual)
                ? (hexManual.startsWith("#") ? hexManual : "#" + hexManual)
                : "#E8E5DE",
              width: 38, height: 38, borderRadius: "8px 0 0 8px",
              border: "1px solid #E8E5DE", borderRight: "none",
              display: "block", flexShrink: 0,
            }} />
            <input
              value={hexManual}
              onChange={e => { setHexManual(e.target.value); setErroHex(""); }}
              onKeyDown={e => e.key === "Enter" && adicionarHexManual()}
              placeholder="#1A3A2A"
              maxLength={7}
              style={{
                flex: 1, height: 38, border: "1px solid #E8E5DE", borderRadius: "0 8px 8px 0",
                padding: "0 12px", fontSize: 13, fontFamily: "monospace",
                color: "#111", background: "#fff", outline: "none",
              }}
            />
          </div>
          {erroHex && <div style={{ fontSize: 11, color: "#E24B4A", marginTop: 4 }}>{erroHex}</div>}
        </div>
        <button
          onClick={adicionarHexManual}
          style={{
            height: 38, padding: "0 16px", background: "#111", color: "#C8F135",
            border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}
        >+ Adicionar</button>
      </div>

      {/* Color grid */}
      {cores.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
            Paleta da marca ({cores.length} {cores.length === 1 ? "cor" : "cores"})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
            {cores.map((cor, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ position: "relative", width: "100%" }}>
                  <div style={{
                    width: "100%", paddingBottom: "100%", background: cor.hex,
                    borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)",
                  }} />
                  <button
                    onClick={() => removerCor(i)}
                    style={{
                      position: "absolute", top: 4, right: 4,
                      width: 18, height: 18, borderRadius: "50%",
                      background: "rgba(0,0,0,0.5)", border: "none",
                      color: "#fff", fontSize: 11, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
                    }}
                  >×</button>
                </div>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: "#888", textAlign: "center" }}>
                  {cor.hex.toUpperCase()}
                </div>
                <input
                  value={cor.nome}
                  onChange={e => editarNome(i, e.target.value)}
                  style={{
                    width: "100%", fontSize: 10, border: "none", background: "transparent",
                    textAlign: "center", color: "#111", fontWeight: 600, padding: 0, outline: "none",
                  }}
                  placeholder="Nome da cor"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
