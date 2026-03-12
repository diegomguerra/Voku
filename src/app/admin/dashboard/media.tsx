"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";

const SUPABASE_URL = "https://movfynswogmookzcjijt.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdmZ5bnN3b2dtb29remNqaWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MjI1OTQsImV4cCI6MjA1NzI5ODU5NH0.xGa5i-UMXuUBCXFcIRiSBxHxG0IlX2xyK6ok7bS4W5k";

interface Metrica {
  id: string;
  post_id: string;
  semana_key: string;
  instagram_media_id: string;
  titulo: string;
  tipo: string;
  pilar: string;
  dia: string;
  horario: string;
  imagem_url: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  saved: number;
  shares: number;
  plays: number;
  engagement_rate: number;
  coletado_em: string;
}

const PILAR_COLORS: Record<string, { bg: string; text: string }> = {
  "EDUCAÇÃO":   { bg: "#EBF0FF", text: "#1A3FA0" },
  "PROVOCAÇÃO": { bg: "#FFE8E8", text: "#A01A1A" },
  "PROCESSO":   { bg: "#F2EBFF", text: "#6A1AB0" },
  "PROVA":      { bg: "#FFF4D6", text: "#7A5000" },
  "CONVERSÃO":  { bg: "#E6FFF2", text: "#0A6B34" },
};

function StatCard({ label, value, unit = "", accent = false }: { label: string; value: string | number; unit?: string; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? "#111111" : "#FFFFFF",
      border: "1px solid #E5E5E5",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    }}>
      <div style={{
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.15em",
        color: accent ? "#AAFF00" : "#999999",
      }}>{label}</div>
      <div style={{
        fontSize: "clamp(28px, 3vw, 40px)",
        fontWeight: 900,
        color: accent ? "#FFFFFF" : "#111111",
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}>
        {value}<span style={{ fontSize: "18px", fontWeight: 500 }}>{unit}</span>
      </div>
    </div>
  );
}

function PilarBadge({ pilar }: { pilar: string }) {
  const c = PILAR_COLORS[pilar] || { bg: "#F0F0F0", text: "#333333" };
  return (
    <span style={{
      background: c.bg,
      color: c.text,
      fontSize: "10px",
      fontWeight: 700,
      padding: "3px 8px",
      letterSpacing: "0.1em",
    }}>{pilar}</span>
  );
}

function EngagementBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "4px", background: "#E5E5E5" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#AAFF00" }} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 700, color: "#111111", minWidth: "40px", textAlign: "right" }}>
        {value.toLocaleString("pt-BR")}
      </span>
    </div>
  );
}

export default function MediaDashboard() {
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [loading, setLoading] = useState(true);
  const [semanaFiltro, setSemanaFiltro] = useState("todas");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [sortBy, setSortBy] = useState("engagement_rate");

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/salvar-metricas`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    })
      .then(r => r.json())
      .then(data => {
        setMetricas(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const semanas = ["todas", ...Array.from(new Set(metricas.map(m => m.semana_key)))];

  const filtered = metricas
    .filter(m => semanaFiltro === "todas" || m.semana_key === semanaFiltro)
    .filter(m => tipoFiltro === "todos" || m.tipo === tipoFiltro)
    .sort((a, b) => {
      const map: Record<string, keyof Metrica> = {
        engagement_rate: "engagement_rate",
        impressions: "impressions",
        reach: "reach",
        likes: "likes",
        saved: "saved",
        plays: "plays",
      };
      const key = map[sortBy] || "engagement_rate";
      return (b[key] as number) - (a[key] as number);
    });

  const total_impressions = filtered.reduce((s, m) => s + m.impressions, 0);
  const total_reach = filtered.reduce((s, m) => s + m.reach, 0);
  const total_likes = filtered.reduce((s, m) => s + m.likes, 0);
  const total_comments = filtered.reduce((s, m) => s + m.comments, 0);
  const total_saved = filtered.reduce((s, m) => s + m.saved, 0);
  const total_shares = filtered.reduce((s, m) => s + m.shares, 0);
  const total_plays = filtered.reduce((s, m) => s + m.plays, 0);
  const avg_engagement = filtered.length > 0
    ? (filtered.reduce((s, m) => s + m.engagement_rate, 0) / filtered.length).toFixed(2)
    : "0.00";
  const maxEngagement = Math.max(...filtered.map(m => m.engagement_rate), 1);

  const melhorPost = filtered.reduce((best, m) =>
    m.engagement_rate > (best?.engagement_rate || 0) ? m : best, filtered[0]);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F7", fontFamily: "'Inter', sans-serif" }}>
      <AdminHeader title="Media Intelligence" sub="MÍDIA" />

      <div style={{ padding: "40px 48px", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{
          display: "flex", gap: "12px", marginBottom: "32px",
          flexWrap: "wrap", alignItems: "center",
        }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#999999", letterSpacing: "0.1em" }}>FILTRAR</span>
          {semanas.map(s => (
            <button key={s} onClick={() => setSemanaFiltro(s)} style={{
              padding: "6px 14px",
              background: semanaFiltro === s ? "#111111" : "#FFFFFF",
              color: semanaFiltro === s ? "#AAFF00" : "#333333",
              border: "1px solid #E5E5E5", fontWeight: 700, fontSize: "12px",
              cursor: "pointer", letterSpacing: "0.05em", fontFamily: "Inter, sans-serif",
            }}>{s === "todas" ? "TODAS" : s}</button>
          ))}
          <span style={{ width: "1px", height: "20px", background: "#E5E5E5" }} />
          {["todos", "CARROSSEL", "REEL"].map(t => (
            <button key={t} onClick={() => setTipoFiltro(t)} style={{
              padding: "6px 14px",
              background: tipoFiltro === t ? "#AAFF00" : "#FFFFFF",
              color: "#111111", border: "1px solid #E5E5E5", fontWeight: 700,
              fontSize: "12px", cursor: "pointer", letterSpacing: "0.05em",
              fontFamily: "Inter, sans-serif",
            }}>{t.toUpperCase()}</button>
          ))}
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#999999", letterSpacing: "0.1em" }}>ORDENAR</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              padding: "6px 12px", border: "1px solid #E5E5E5", background: "#FFFFFF",
              fontWeight: 700, fontSize: "12px", color: "#111111",
              fontFamily: "Inter, sans-serif", cursor: "pointer",
            }}>
              <option value="engagement_rate">Engajamento %</option>
              <option value="impressions">Impressões</option>
              <option value="reach">Alcance</option>
              <option value="likes">Curtidas</option>
              <option value="saved">Salvamentos</option>
              <option value="plays">Plays</option>
            </select>
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px", color: "#999999", fontSize: "16px", fontWeight: 700 }}>
            Carregando métricas...
          </div>
        ) : metricas.length === 0 ? (
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E5E5", padding: "60px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>📊</div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#111111", marginBottom: "8px" }}>
              Nenhuma métrica ainda
            </div>
            <div style={{ fontSize: "14px", color: "#999999" }}>
              Execute <code style={{ background: "#F0F0F0", padding: "2px 6px" }}>python scripts/buscar_metricas.py</code> para coletar os dados
            </div>
          </div>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "2px", marginBottom: "2px",
            }}>
              <StatCard label="ALCANCE TOTAL" value={total_reach.toLocaleString("pt-BR")} accent />
              <StatCard label="IMPRESSÕES" value={total_impressions.toLocaleString("pt-BR")} />
              <StatCard label="ENGAJAMENTO MÉDIO" value={avg_engagement} unit="%" />
              <StatCard label="CURTIDAS" value={total_likes.toLocaleString("pt-BR")} />
              <StatCard label="COMENTÁRIOS" value={total_comments.toLocaleString("pt-BR")} />
              <StatCard label="SALVAMENTOS" value={total_saved.toLocaleString("pt-BR")} />
              <StatCard label="COMPARTILHAMENTOS" value={total_shares.toLocaleString("pt-BR")} />
              <StatCard label="PLAYS (REELS)" value={total_plays.toLocaleString("pt-BR")} />
            </div>

            {melhorPost && (
              <div style={{
                background: "#111111", padding: "24px 32px", marginBottom: "2px",
                display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap",
              }}>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#AAFF00", letterSpacing: "0.2em", marginBottom: "6px" }}>
                    ✦ MELHOR POST
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
                    {melhorPost.titulo}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: "24px" }}>
                  {[
                    { label: "ENGAJAMENTO", value: `${melhorPost.engagement_rate}%` },
                    { label: "ALCANCE", value: melhorPost.reach.toLocaleString("pt-BR") },
                    { label: "SALVAMENTOS", value: melhorPost.saved.toLocaleString("pt-BR") },
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "22px", fontWeight: 900, color: "#AAFF00" }}>{stat.value}</div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#666666", letterSpacing: "0.1em" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: "#FFFFFF", border: "1px solid #E5E5E5" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 80px 100px 90px 70px 70px 70px 70px 70px 90px",
                padding: "12px 24px", borderBottom: "2px solid #111111", gap: "8px",
              }}>
                {["TÍTULO","TIPO","PILAR","ENGAGEMENT","ALCANCE","LIKES","COMENTS","SALVOS","PLAYS","DIA"].map(h => (
                  <div key={h} style={{ fontSize: "10px", fontWeight: 700, color: "#999999", letterSpacing: "0.12em" }}>{h}</div>
                ))}
              </div>
              {filtered.map((m, i) => (
                <div key={m.id} style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 80px 100px 90px 70px 70px 70px 70px 70px 90px",
                  padding: "16px 24px",
                  borderBottom: i < filtered.length - 1 ? "1px solid #F0F0F0" : "none",
                  gap: "8px", alignItems: "center",
                  background: i % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F5FFF0"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "#FFFFFF" : "#FAFAFA"}
                >
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#111111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.titulo}
                  </div>
                  <div>
                    <span style={{
                      background: m.tipo === "REEL" ? "#111111" : "#AAFF00",
                      color: m.tipo === "REEL" ? "#AAFF00" : "#111111",
                      fontSize: "10px", fontWeight: 700, padding: "2px 6px", letterSpacing: "0.05em",
                    }}>{m.tipo}</span>
                  </div>
                  <div><PilarBadge pilar={m.pilar} /></div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 900, color: "#111111" }}>{m.engagement_rate}%</div>
                    <EngagementBar value={m.engagement_rate} max={maxEngagement} />
                  </div>
                  {[m.reach, m.likes, m.comments, m.saved, m.plays].map((val, vi) => (
                    <div key={vi} style={{ fontSize: "13px", fontWeight: val > 0 ? 700 : 400, color: val > 0 ? "#111111" : "#CCCCCC" }}>
                      {val > 0 ? val.toLocaleString("pt-BR") : "—"}
                    </div>
                  ))}
                  <div style={{ fontSize: "11px", color: "#999999", fontWeight: 500 }}>{m.dia}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2px", background: "#FFFFFF", border: "1px solid #E5E5E5", padding: "32px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", color: "#999999", marginBottom: "24px" }}>
                PERFORMANCE POR PILAR
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                {Object.keys(PILAR_COLORS).map(pilar => {
                  const posts = filtered.filter(m => m.pilar === pilar);
                  if (posts.length === 0) return null;
                  const avgEng = (posts.reduce((s, m) => s + m.engagement_rate, 0) / posts.length).toFixed(2);
                  const c = PILAR_COLORS[pilar];
                  return (
                    <div key={pilar} style={{ background: c.bg, padding: "20px", borderLeft: `3px solid ${c.text}` }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: c.text, letterSpacing: "0.12em", marginBottom: "8px" }}>{pilar}</div>
                      <div style={{ fontSize: "28px", fontWeight: 900, color: "#111111" }}>{avgEng}%</div>
                      <div style={{ fontSize: "11px", color: "#666666", marginTop: "4px" }}>{posts.length} post{posts.length > 1 ? "s" : ""}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
