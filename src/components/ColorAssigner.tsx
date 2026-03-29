"use client";
import { useState } from "react";
import type { CoreExtraida } from "./ColorExtractor";

/* ── Landing page elements ── */
interface ElementoLanding {
  id: string;
  label: string;
  descricao: string;
}

const ELEMENTOS_LANDING: ElementoLanding[] = [
  { id: "fundo_principal", label: "Fundo principal", descricao: "Cor de fundo da hero section e seções principais" },
  { id: "fundo_secundario", label: "Fundo secundário", descricao: "Cor das seções alternadas" },
  { id: "botao_primario", label: "Botão principal (CTA)", descricao: "Cor de fundo do botão de call-to-action" },
  { id: "texto_botao", label: "Texto do botão", descricao: "Cor do texto dentro do botão" },
  { id: "titulo", label: "Títulos (H1, H2)", descricao: "Cor dos títulos principais" },
  { id: "texto_corpo", label: "Texto corpo", descricao: "Cor do texto dos parágrafos" },
  { id: "destaque", label: "Destaque / acento", descricao: "Cor para palavras destacadas, bordas e ícones" },
  { id: "nav_fundo", label: "Fundo da navegação", descricao: "Cor de fundo do menu/header" },
  { id: "rodape", label: "Rodapé", descricao: "Cor de fundo do footer" },
];

/* ── Props ── */
interface ColorAssignerProps {
  paletaCores: CoreExtraida[];
  atribuicoes: Record<string, string>;
  onAtribuir: (elementoId: string, hex: string | null) => void;
}

export default function ColorAssigner({ paletaCores, atribuicoes, onAtribuir }: ColorAssignerProps) {
  const [expandido, setExpandido] = useState(true);

  if (paletaCores.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <button
        onClick={() => setExpandido(!expandido)}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: "4px 0",
          display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.6px" }}>
          Atribuir cores aos elementos ({Object.keys(atribuicoes).filter(k => atribuicoes[k]).length}/{ELEMENTOS_LANDING.length})
        </span>
        <span style={{ fontSize: 10, color: "#888", transform: expandido ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }}>▼</span>
      </button>

      {expandido && ELEMENTOS_LANDING.map(el => (
        <div key={el.id} style={{
          display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center",
          padding: "12px 14px", background: "#fff", border: "0.5px solid #E8E5DE",
          borderRadius: 10, marginBottom: 6,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{el.label}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{el.descricao}</div>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {atribuicoes[el.id] && (
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: atribuicoes[el.id], border: "1px solid rgba(0,0,0,0.1)",
                marginRight: 4,
              }} />
            )}
            <div style={{ display: "flex", gap: 4 }}>
              {paletaCores.map(cor => (
                <button
                  key={cor.hex}
                  onClick={() => onAtribuir(el.id, cor.hex)}
                  title={`${cor.nome} — ${cor.hex}`}
                  style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: cor.hex,
                    border: atribuicoes[el.id] === cor.hex ? "2px solid #C8F135" : "1px solid rgba(0,0,0,0.1)",
                    cursor: "pointer", transition: "transform 0.1s",
                    transform: atribuicoes[el.id] === cor.hex ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
              {atribuicoes[el.id] && (
                <button
                  onClick={() => onAtribuir(el.id, null)}
                  style={{
                    width: 24, height: 24, borderRadius: 6, border: "1px solid #E8E5DE",
                    background: "#FAF8F3", fontSize: 12, cursor: "pointer", color: "#888",
                  }}
                >×</button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
