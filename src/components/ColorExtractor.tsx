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

export interface DesignacoesCores {
  primaria?: string;
  secundaria?: string;
  fundo?: string;
  texto?: string;
  acento?: string;
}

interface ColorExtractorProps {
  cores: CoreExtraida[];
  onChange: (cores: CoreExtraida[]) => void;
  designacoes?: DesignacoesCores;
  onDesignacoes?: (d: DesignacoesCores) => void;
  maxCores?: number;
}

/* ── Funções de aplicação ── */
const FUNCOES: { id: keyof DesignacoesCores; label: string; desc: string }[] = [
  { id: "primaria",   label: "Primária",   desc: "Botões, destaques, CTA" },
  { id: "secundaria", label: "Secundária", desc: "Fundo escuro, seções" },
  { id: "fundo",      label: "Fundo",      desc: "Background principal" },
  { id: "texto",      label: "Texto",      desc: "Títulos e parágrafos" },
  { id: "acento",     label: "Acento",     desc: "Links, ícones, bordas" },
];

/* ── Helpers ── */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractColorsFromImage(file: File): Promise<{ hex: string; count: number }[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 200; // downsample for speed
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      // Quantize colors: round to nearest 16 to group similar colors
      const colorMap: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.round(data[i] / 16) * 16;
        const g = Math.round(data[i + 1] / 16) * 16;
        const b = Math.round(data[i + 2] / 16) * 16;
        const a = data[i + 3];
        if (a < 128) continue; // skip transparent
        const hex = "#" + [r, g, b].map(c => Math.min(c, 255).toString(16).padStart(2, "0")).join("").toUpperCase();
        colorMap[hex] = (colorMap[hex] || 0) + 1;
      }

      // Sort by frequency, filter out near-white and near-black
      const sorted = Object.entries(colorMap)
        .map(([hex, count]) => ({ hex, count }))
        .filter(({ hex }) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          const lum = (r * 299 + g * 587 + b * 114) / 1000;
          return lum > 20 && lum < 240; // skip near-black and near-white
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      resolve(sorted);
    };
    img.onerror = () => resolve([]);
    img.src = URL.createObjectURL(file);
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

function luminancia(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function saturacao(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return 0;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

/* ── Component ── */
export default function ColorExtractor({
  cores, onChange, designacoes = {}, onDesignacoes, maxCores = 12,
}: ColorExtractorProps) {
  const [extraindo, setExtraindo] = useState(false);
  const [imagensProcessadas, setImagensProcessadas] = useState<string[]>([]);
  const [hexManual, setHexManual] = useState("");
  const [dragging, setDragging] = useState(false);
  const [erroHex, setErroHex] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [extraindoUrl, setExtraindoUrl] = useState(false);
  const [erroUrl, setErroUrl] = useState("");
  const [corSelecionada, setCorSelecionada] = useState<number | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pre-load saved brand palette
  useEffect(() => {
    if (cores.length > 0) return;
    fetch("/api/marca/paleta")
      .then(r => r.json())
      .then(data => {
        if (data.cores?.length > 0 && cores.length === 0) onChange(data.cores);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processarImagens = async (files: FileList | File[]) => {
    setExtraindo(true);
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) continue;
      try {
        // Step 1: Extract real hex codes from pixels via Canvas
        const pixelColors = await extractColorsFromImage(file);
        if (pixelColors.length === 0) continue;

        // Step 2: Send extracted hex codes to Claude for naming/categorizing
        const res = await fetch("/api/extract-colors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cores_extraidas: pixelColors, filename: file.name }),
        });
        const data = await res.json();

        let novasCores: CoreExtraida[];
        if (data.cores?.length > 0) {
          novasCores = data.cores;
        } else {
          // Fallback: use raw pixel colors with auto-generated names
          novasCores = pixelColors.map(c => ({
            hex: c.hex, rgb: hexToRgb(c.hex), nome: nomeAutomatico(c.hex),
            uso_sugerido: "", fonte: file.name,
          }));
        }

        const filtradas = novasCores.filter(
          (nova: CoreExtraida) => !cores.some(e => e.hex.toLowerCase() === nova.hex.toLowerCase())
        );
        const merged = [...cores, ...filtradas].slice(0, maxCores);
        onChange(merged);
        autoDesignar(merged);
        setImagensProcessadas(prev => [...prev, file.name]);
      } catch { /* silently fail */ }
    }
    setExtraindo(false);
  };

  const extrairDeUrl = async () => {
    if (!urlInput.trim()) return;
    setExtraindoUrl(true);
    setErroUrl("");
    setScreenshotPreview(null);

    try {
      // Step 1: Screenshot the URL via Puppeteer
      const ssRes = await fetch("/api/screenshot-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const ssData = await ssRes.json();
      if (ssData.erro) { setErroUrl(ssData.erro); setExtraindoUrl(false); return; }

      // Step 2: Convert base64 PNG to File for Canvas extraction
      const dataUrl = `data:image/png;base64,${ssData.image}`;
      setScreenshotPreview(dataUrl);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `screenshot-${urlInput.trim().replace(/[^a-z0-9]/gi, "-")}.png`, { type: "image/png" });

      // Step 3: Extract real pixel colors via Canvas (same as image upload)
      const pixelColors = await extractColorsFromImage(file);
      if (pixelColors.length === 0) { setErroUrl("Nenhuma cor encontrada no screenshot."); setExtraindoUrl(false); return; }

      // Step 4: Send to Claude for naming/categorizing
      const res = await fetch("/api/extract-colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cores_extraidas: pixelColors, filename: urlInput.trim() }),
      });
      const data = await res.json();

      let novasCores: CoreExtraida[];
      if (data.cores?.length > 0) {
        novasCores = data.cores;
      } else {
        novasCores = pixelColors.map(c => ({
          hex: c.hex, rgb: hexToRgb(c.hex), nome: nomeAutomatico(c.hex),
          uso_sugerido: "", fonte: urlInput.trim(),
        }));
      }

      const filtradas = novasCores.filter(
        (nova: CoreExtraida) => !cores.some(e => e.hex.toLowerCase() === nova.hex.toLowerCase())
      );
      const merged = [...cores, ...filtradas].slice(0, maxCores);
      onChange(merged);
      autoDesignar(merged);
      setImagensProcessadas(prev => [...prev, urlInput]);
      setUrlInput("");
    } catch {
      setErroUrl("Erro ao processar a URL. Tente subir uma imagem.");
    } finally {
      setExtraindoUrl(false);
    }
  };

  // Auto-assign funções nas primeiras cores extraídas
  const autoDesignar = (novas: CoreExtraida[]) => {
    if (!onDesignacoes || novas.length === 0) return;
    const d: DesignacoesCores = { ...designacoes };

    // Primária = cor mais saturada/vibrante
    const porSaturacao = [...novas].sort((a, b) => saturacao(b.hex) - saturacao(a.hex));
    if (!d.primaria && porSaturacao[0]) d.primaria = porSaturacao[0].hex;

    const restantes = novas.filter(c => c.hex !== d.primaria);
    const porLum = [...restantes].sort((a, b) => luminancia(b.hex) - luminancia(a.hex));

    // Fundo = cor mais clara (que não seja a primária)
    if (!d.fundo && porLum[0]) d.fundo = porLum[0].hex;

    // Secundária = cor mais escura (que não seja primária nem fundo)
    const semFundo = porLum.filter(c => c.hex !== d.fundo);
    if (!d.secundaria && semFundo.length > 0) d.secundaria = semFundo[semFundo.length - 1].hex;

    // Texto = cor mais escura disponível (que não seja primária)
    if (!d.texto && porLum.length > 0) d.texto = porLum[porLum.length - 1].hex;

    onDesignacoes(d);
  };

  const designarCor = (funcao: keyof DesignacoesCores, hex: string) => {
    if (!onDesignacoes) return;
    const updated = { ...designacoes };
    // toggle: clicar na mesma cor remove
    if (updated[funcao] === hex) { delete updated[funcao]; }
    else { updated[funcao] = hex; }
    onDesignacoes(updated);
    setCorSelecionada(null);
  };

  const adicionarHexManual = () => {
    const hex = hexManual.startsWith("#") ? hexManual : "#" + hexManual;
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) { setErroHex("Código inválido. Use formato #RRGGBB"); return; }
    if (cores.some(c => c.hex.toLowerCase() === hex.toLowerCase())) { setErroHex("Esta cor já foi adicionada"); return; }
    onChange([...cores, { hex: hex.toUpperCase(), rgb: hexToRgb(hex), nome: nomeAutomatico(hex), uso_sugerido: "", fonte: "manual" }]);
    setHexManual("");
    setErroHex("");
  };

  const removerCor = (index: number) => {
    const removida = cores[index].hex;
    onChange(cores.filter((_, i) => i !== index));
    if (onDesignacoes) {
      const updated = { ...designacoes };
      (Object.keys(updated) as (keyof DesignacoesCores)[]).forEach(k => {
        if (updated[k] === removida) delete updated[k];
      });
      onDesignacoes(updated);
    }
  };

  const editarNome = (index: number, nome: string) => {
    const updated = [...cores];
    updated[index] = { ...updated[index], nome };
    onChange(updated);
  };

  const funcaoAtribuida = (hex: string): string => {
    const f = FUNCOES.find(fn => designacoes[fn.id] === hex);
    return f ? f.label : "";
  };

  const T = {
    lime: "#AAFF00", ink: "#111111", muted: "#888888",
    border: "#E8E5DE", sand: "#FAF8F3", bg: "#FFFFFF",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── ENTRADA: URL ─────────────────────────── */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Extrair cores do seu site ou landing page
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={urlInput}
            onChange={e => { setUrlInput(e.target.value); setErroUrl(""); }}
            onKeyDown={e => e.key === "Enter" && extrairDeUrl()}
            placeholder="https://suamarca.com.br"
            style={{
              flex: 1, height: 40, border: `1px solid ${T.border}`, borderRadius: 8,
              padding: "0 12px", fontSize: 13, color: T.ink, background: T.bg, outline: "none",
            }}
          />
          <button
            onClick={extrairDeUrl}
            disabled={extraindoUrl || !urlInput.trim()}
            style={{
              height: 40, padding: "0 16px", background: T.ink, color: T.lime,
              border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: extraindoUrl || !urlInput.trim() ? "not-allowed" : "pointer",
              whiteSpace: "nowrap", opacity: extraindoUrl || !urlInput.trim() ? 0.5 : 1,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {extraindoUrl ? (
              <><div style={{ width: 14, height: 14, border: "2px solid #333", borderTopColor: T.lime, borderRadius: "50%", animation: "cxspin 0.8s linear infinite" }} />Extraindo...</>
            ) : "Extrair cores →"}
          </button>
        </div>
        {erroUrl && <div style={{ fontSize: 11, color: "#E24B4A", marginTop: 4 }}>{erroUrl}</div>}
      </div>

      {/* ── SCREENSHOT PREVIEW ───────────────────── */}
      {screenshotPreview && (
        <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
          <div style={{ background: T.sand, padding: "6px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>Screenshot capturado</span>
            <button onClick={() => setScreenshotPreview(null)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 14 }}>×</button>
          </div>
          <img src={screenshotPreview} alt="Screenshot" style={{ width: "100%", display: "block" }} />
        </div>
      )}

      {/* ── TABELA DE CORES COM LOCALIZAÇÃO ──────── */}
      {cores.length > 0 && cores[0].uso_sugerido && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ background: T.sand, padding: "8px 12px", fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Cores identificadas
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {cores.map((cor, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderTop: i > 0 ? `1px solid ${T.border}` : "none",
              }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: cor.hex, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontFamily: "monospace", color: T.ink, fontWeight: 600, width: 70, flexShrink: 0 }}>{cor.hex}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.ink, flex: 1 }}>{cor.nome}</span>
                <span style={{ fontSize: 11, color: T.muted }}>{cor.uso_sugerido}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ENTRADA: Upload de imagem ─────────────── */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); processarImagens(e.dataTransfer.files); }}
        style={{
          border: `1.5px dashed ${dragging ? T.lime : T.border}`,
          borderRadius: 10, padding: "16px 20px", textAlign: "center", cursor: "pointer",
          background: dragging ? "#F5FDE8" : T.sand, transition: "all 0.15s",
        }}
      >
        <div style={{ fontSize: 22, marginBottom: 6 }}>🎨</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 3 }}>
          {extraindo ? "Extraindo cores com IA..." : "Ou suba uma imagem com suas cores"}
        </div>
        <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
          Print do site, paleta de marca, logo, apresentação — PNG, JPG até 10MB
        </div>
        {extraindo && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ width: 14, height: 14, border: `2px solid ${T.border}`, borderTopColor: T.lime, borderRadius: "50%", animation: "cxspin 0.8s linear infinite" }} />
            <span style={{ fontSize: 12, color: T.muted }}>Analisando com IA...</span>
          </div>
        )}
        <input ref={fileRef} type="file" multiple accept="image/*" onChange={e => e.target.files && processarImagens(e.target.files)} style={{ display: "none" }} />
      </div>

      {/* Arquivos processados */}
      {imagensProcessadas.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {imagensProcessadas.map((nome, i) => (
            <span key={i} style={{ background: "#EAF3DE", color: "#27500A", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500 }}>
              ✓ {nome.length > 40 ? nome.slice(0, 37) + "..." : nome}
            </span>
          ))}
        </div>
      )}

      {/* ── PALETA EXTRAÍDA + DESIGNAÇÃO ─────────── */}
      {cores.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
            Paleta da marca ({cores.length} {cores.length === 1 ? "cor" : "cores"})
          </div>

          {/* Grid de cores */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 8, marginBottom: 16 }}>
            {cores.map((cor, i) => {
              const atribuida = funcaoAtribuida(cor.hex);
              const selecionada = corSelecionada === i;
              return (
                <div
                  key={i}
                  onClick={() => setCorSelecionada(selecionada ? null : i)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
                >
                  <div style={{ position: "relative", width: "100%" }}>
                    <div style={{
                      width: "100%", paddingBottom: "100%", background: cor.hex,
                      borderRadius: 10,
                      border: selecionada ? `2.5px solid ${T.ink}` : atribuida ? `2px solid ${T.lime}` : "1px solid rgba(0,0,0,0.08)",
                      boxSizing: "border-box",
                    }} />
                    <button
                      onClick={e => { e.stopPropagation(); removerCor(i); }}
                      style={{
                        position: "absolute", top: 3, right: 3,
                        width: 16, height: 16, borderRadius: "50%",
                        background: "rgba(0,0,0,0.5)", border: "none",
                        color: "#fff", fontSize: 10, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >×</button>
                    {atribuida && (
                      <div style={{
                        position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)",
                        background: T.lime, color: T.ink, fontSize: 8, fontWeight: 800,
                        padding: "1px 5px", borderRadius: 4, whiteSpace: "nowrap",
                      }}>{atribuida}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 9, fontFamily: "monospace", color: T.muted, textAlign: "center" }}>
                    {cor.hex.toUpperCase()}
                  </div>
                  <input
                    value={cor.nome}
                    onClick={e => e.stopPropagation()}
                    onChange={e => editarNome(i, e.target.value)}
                    style={{ width: "100%", fontSize: 9, border: "none", background: "transparent", textAlign: "center", color: T.ink, fontWeight: 600, padding: 0, outline: "none" }}
                    placeholder="Nome"
                  />
                </div>
              );
            })}
          </div>

          {/* Painel de designação — aparece quando uma cor está selecionada */}
          {corSelecionada !== null && (
            <div style={{
              background: T.bg, border: `1.5px solid ${T.lime}`, borderRadius: 12,
              padding: "14px 16px", marginBottom: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: cores[corSelecionada].hex, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{cores[corSelecionada].nome}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{cores[corSelecionada].hex.toUpperCase()} · Atribuir a uma função:</div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {FUNCOES.map(fn => {
                  const ativa = designacoes[fn.id] === cores[corSelecionada].hex;
                  const outraCor = designacoes[fn.id] && designacoes[fn.id] !== cores[corSelecionada].hex;
                  return (
                    <button
                      key={fn.id}
                      onClick={() => designarCor(fn.id, cores[corSelecionada!].hex)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "flex-start",
                        padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                        background: ativa ? T.lime : T.sand,
                        border: `1.5px solid ${ativa ? T.ink : T.border}`,
                        transition: "all 0.15s", minWidth: 90,
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: ativa ? T.ink : T.ink }}>{fn.label}</div>
                      <div style={{ fontSize: 10, color: ativa ? "#333" : T.muted, marginTop: 2 }}>{fn.desc}</div>
                      {outraCor && (
                        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: designacoes[fn.id] }} />
                          <span style={{ fontSize: 9, color: T.muted }}>atual</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resumo das designações */}
          {Object.keys(designacoes).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {FUNCOES.filter(fn => designacoes[fn.id]).map(fn => (
                <div key={fn.id} style={{ display: "flex", alignItems: "center", gap: 6, background: T.sand, border: `1px solid ${T.border}`, borderRadius: 20, padding: "4px 10px" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: designacoes[fn.id], border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.ink }}>{fn.label}</span>
                  <span style={{ fontSize: 10, color: T.muted }}>{designacoes[fn.id]}</span>
                </div>
              ))}
            </div>
          )}

          {cores.length > 0 && Object.keys(designacoes).length === 0 && (
            <div style={{ fontSize: 12, color: T.muted, fontStyle: "italic" }}>
              Clique em uma cor para atribuir uma função (primária, fundo, texto...)
            </div>
          )}
        </div>
      )}

      {/* ── DIVISOR ─────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: T.border }} />
        <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>OU adicione manualmente</span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>

      {/* ── Input manual ────────────────────────── */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 0 }}>
            <span style={{
              background: hexManual && /^#?[0-9A-Fa-f]{6}$/.test(hexManual)
                ? (hexManual.startsWith("#") ? hexManual : "#" + hexManual) : T.border,
              width: 40, height: 40, borderRadius: "8px 0 0 8px",
              border: `1px solid ${T.border}`, borderRight: "none", display: "block", flexShrink: 0,
            }} />
            <input
              value={hexManual}
              onChange={e => { setHexManual(e.target.value); setErroHex(""); }}
              onKeyDown={e => e.key === "Enter" && adicionarHexManual()}
              placeholder="#1A3A2A"
              maxLength={7}
              style={{
                flex: 1, height: 40, border: `1px solid ${T.border}`, borderRadius: "0 8px 8px 0",
                padding: "0 12px", fontSize: 13, fontFamily: "monospace",
                color: T.ink, background: T.bg, outline: "none",
              }}
            />
          </div>
          {erroHex && <div style={{ fontSize: 11, color: "#E24B4A", marginTop: 4 }}>{erroHex}</div>}
        </div>
        <button
          onClick={adicionarHexManual}
          style={{
            height: 40, padding: "0 16px", background: T.ink, color: T.lime,
            border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}
        >+ Adicionar</button>
      </div>

      <style>{`@keyframes cxspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
