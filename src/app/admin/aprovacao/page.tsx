// @ts-nocheck
"use client";
import { useState, useEffect } from "react";

const SUPABASE_FN = "https://movfynswogmookzcjijt.supabase.co/functions/v1";

const T = {
  base: "#111111",
  secondary: "#333333",
  white: "#FFFFFF",
  accent: "#AAFF00",
  border: "#E2E2E2",
  borderMd: "#CCCCCC",
  faint: "#999999",
  bg: "#F7F7F7",
};

const PILAR_COLORS: Record<string, { color: string; bg: string }> = {
  EDUCAÇÃO:   { color: "#1D4ED8", bg: "#DBEAFE" },
  PROVOCAÇÃO: { color: "#DC2626", bg: "#FEE2E2" },
  PROCESSO:   { color: "#7C3AED", bg: "#EDE9FE" },
  PROVA:      { color: "#CA8A04", bg: "#FEF9C3" },
  CONVERSÃO:  { color: "#16A34A", bg: "#DCFCE7" },
};

const TIPO_BADGE: Record<string, { color: string; bg: string }> = {
  CARROSSEL: { color: T.base, bg: T.accent },
  REEL:      { color: T.white, bg: T.base },
};

function Badge({ label, colors }: { label: string; colors: { color: string; bg: string } }) {
  return (
    <span style={{
      display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
      padding: "3px 10px", borderRadius: 6, color: colors.color, background: colors.bg,
    }}>{label}</span>
  );
}

function SlideNav({ slides }: { slides: any[] }) {
  const [idx, setIdx] = useState(0);
  const s = slides[idx];
  return (
    <div style={{ background: T.bg, borderRadius: 10, padding: 16, marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.faint, marginBottom: 8, textTransform: "uppercase" }}>
        Slide {s.num}/{slides.length} — {s.label}
      </div>
      <div style={{ fontSize: 14, color: T.base, lineHeight: 1.5, minHeight: 48 }}>
        {s.texto}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", justifyContent: "center" }}>
        <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}
          style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.3 : 1, fontSize: 16, color: T.base }}>←</button>
        {slides.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} style={{
            width: 8, height: 8, borderRadius: 4, cursor: "pointer",
            background: i === idx ? T.accent : T.border,
          }} />
        ))}
        <button onClick={() => setIdx(Math.min(slides.length - 1, idx + 1))} disabled={idx === slides.length - 1}
          style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, cursor: idx === slides.length - 1 ? "default" : "pointer", opacity: idx === slides.length - 1 ? 0.3 : 1, fontSize: 16, color: T.base }}>→</button>
      </div>
    </div>
  );
}

function RoteiroCenas({ cenas }: { cenas: any[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
      {cenas.map((c, i) => (
        <div key={i} style={{ background: T.bg, borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ minWidth: 64, fontSize: 11, fontWeight: 700, color: T.faint }}>{c.tempo}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.secondary, textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 14, color: T.base, lineHeight: 1.5 }}>{c.fala}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PostCard({ post, status, comment, onToggle, onComment }: {
  post: any; status: "pendente" | "aprovado" | "rejeitado";
  comment: string; onToggle: (s: "aprovado" | "rejeitado") => void; onComment: (c: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pilar = PILAR_COLORS[post.pilar] || { color: T.base, bg: "#F3F3F3" };
  const tipo = TIPO_BADGE[post.tipo] || { color: T.base, bg: T.bg };

  const borderLeft = status === "aprovado" ? `4px solid ${T.accent}` : status === "rejeitado" ? "4px solid #EF4444" : `4px solid ${T.border}`;

  return (
    <div style={{
      background: T.white, borderRadius: 12, border: `1px solid ${T.border}`, borderLeft,
      overflow: "hidden", transition: "box-shadow 0.15s",
      boxShadow: expanded ? "0 4px 20px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      {/* Header */}
      <div onClick={() => setExpanded(!expanded)} style={{
        padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.faint, minWidth: 110 }}>
          {post.dia} • {post.horario}
        </div>
        <Badge label={post.tipo} colors={tipo} />
        <Badge label={post.pilar} colors={pilar} />
        <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: T.base }}>{post.titulo}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={(e) => { e.stopPropagation(); onToggle("aprovado"); }}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: status === "aprovado" ? "2px solid #16A34A" : `1px solid ${T.border}`,
              background: status === "aprovado" ? "#DCFCE7" : T.white,
              color: status === "aprovado" ? "#16A34A" : T.faint,
            }}>✓ Aprovar</button>
          <button onClick={(e) => { e.stopPropagation(); onToggle("rejeitado"); }}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: status === "rejeitado" ? "2px solid #EF4444" : `1px solid ${T.border}`,
              background: status === "rejeitado" ? "#FEE2E2" : T.white,
              color: status === "rejeitado" ? "#EF4444" : T.faint,
            }}>✗ Rejeitar</button>
        </div>
        <span style={{ fontSize: 18, color: T.faint, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${T.border}` }}>
          {post.tipo === "CARROSSEL" && post.slides_conteudo && <SlideNav slides={post.slides_conteudo} />}
          {post.tipo === "REEL" && post.roteiro_reel && <RoteiroCenas cenas={post.roteiro_reel} />}

          {/* Legenda */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.faint, textTransform: "uppercase", marginBottom: 6 }}>Legenda</div>
            <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.6, whiteSpace: "pre-line", background: T.bg, borderRadius: 8, padding: 12 }}>
              {post.legenda}
            </div>
          </div>

          {/* Hashtags */}
          {post.hashtags && (
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {post.hashtags.map((h: string, i: number) => (
                <span key={i} style={{ fontSize: 12, color: T.faint, background: T.bg, borderRadius: 6, padding: "2px 8px" }}>{h}</span>
              ))}
            </div>
          )}

          {/* Duração (Reel) */}
          {post.duracao && (
            <div style={{ marginTop: 8, fontSize: 12, color: T.faint }}>Duração estimada: {post.duracao}</div>
          )}

          {/* Comentário */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.faint, textTransform: "uppercase", marginBottom: 6 }}>Comentário</div>
            <textarea
              value={comment}
              onChange={(e) => onComment(e.target.value)}
              placeholder="Observação sobre este post..."
              style={{
                width: "100%", minHeight: 60, padding: 10, borderRadius: 8, border: `1px solid ${T.border}`,
                fontSize: 13, color: T.base, fontFamily: "Inter, sans-serif", resize: "vertical", outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = T.accent)}
              onBlur={(e) => (e.target.style.borderColor = T.border)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AprovacaoPage() {
  const [semanas, setSemanas] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [posts, setPosts] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<Record<string, "pendente" | "aprovado" | "rejeitado">>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [despachando, setDespachando] = useState(false);
  const [modal, setModal] = useState<{ show: boolean; success: boolean; msg: string }>({ show: false, success: false, msg: "" });

  useEffect(() => {
    fetch(`${SUPABASE_FN}/publicar-semana`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.semanas || [];
        setSemanas(list);
        if (list.length > 0) {
          const first = list[0];
          setSelected(first.semana_key);
          fetchPosts(first.semana_key);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function fetchPosts(semanaKey: string) {
    setLoadingPosts(true);
    setPosts([]);
    fetch(`${SUPABASE_FN}/publicar-semana?semana_key=${semanaKey}`)
      .then((r) => r.json())
      .then((data) => {
        const p = data?.semana?.posts || [];
        setPosts(p);
        const s: Record<string, "pendente" | "aprovado" | "rejeitado"> = {};
        const c: Record<string, string> = {};
        p.forEach((post: any) => { s[post.id] = "pendente"; c[post.id] = ""; });
        setStatuses(s);
        setComments(c);
        setLoadingPosts(false);
      })
      .catch(() => setLoadingPosts(false));
  }

  function selectSemana(key: string) {
    setSelected(key);
    fetchPosts(key);
  }

  function toggleStatus(postId: string, target: "aprovado" | "rejeitado") {
    setStatuses((prev) => ({ ...prev, [postId]: prev[postId] === target ? "pendente" : target }));
  }

  function aprovarTodos() {
    const s: Record<string, "aprovado"> = {};
    posts.forEach((p) => { s[p.id] = "aprovado"; });
    setStatuses((prev) => ({ ...prev, ...s }));
  }

  const aprovados = Object.values(statuses).filter((s) => s === "aprovado").length;
  const rejeitados = Object.values(statuses).filter((s) => s === "rejeitado").length;
  const total = posts.length;
  const pct = total > 0 ? Math.round((aprovados / total) * 100) : 0;

  async function despachar() {
    setDespachando(true);
    const aprovados_ids = Object.entries(statuses).filter(([, s]) => s === "aprovado").map(([id]) => id);
    const rejeitados_ids = Object.entries(statuses).filter(([, s]) => s === "rejeitado").map(([id]) => id);
    const comentarios: Record<string, string> = {};
    Object.entries(comments).forEach(([id, c]) => { if (c.trim()) comentarios[id] = c; });

    try {
      const res = await fetch(`${SUPABASE_FN}/despachar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semana_key: selected,
          conta: "@voku_studio",
          aprovados_ids,
          rejeitados_ids,
          comentarios,
        }),
      });
      const data = await res.json();
      if (data.ok || res.ok) {
        setModal({ show: true, success: true, msg: `Semana ${selected} despachada com sucesso.\n${aprovados_ids.length} aprovados, ${rejeitados_ids.length} rejeitados.` });
      } else {
        setModal({ show: true, success: false, msg: data.error || "Erro ao despachar." });
      }
    } catch (err: any) {
      setModal({ show: true, success: false, msg: err.message || "Erro de conexão." });
    }
    setDespachando(false);
  }

  if (loading) {
    return (
      <div style={{ background: T.white, minHeight: "100vh", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: T.faint }}>Carregando semanas...</span>
      </div>
    );
  }

  return (
    <div style={{ background: T.white, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{
        background: T.white, borderBottom: `1px solid ${T.border}`, padding: "0 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 64,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: T.base }}>VOKU</span>
          <span style={{ color: T.faint }}>|</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.secondary }}>Aprovação de Conteúdo</span>
        </div>
        <a href="/admin/dashboard" style={{ fontSize: 13, color: T.faint, textDecoration: "none" }}>← Dashboard</a>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px" }}>
        {/* Selector de semana */}
        {semanas.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {semanas.map((sem) => (
              <button key={sem.semana_key} onClick={() => selectSemana(sem.semana_key)}
                style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: selected === sem.semana_key ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                  background: selected === sem.semana_key ? T.base : T.white,
                  color: selected === sem.semana_key ? T.accent : T.secondary,
                }}>
                Semana {sem.semana_key}
              </button>
            ))}
          </div>
        )}

        {semanas.length === 0 && (
          <div style={{ textAlign: "center", padding: 80, color: T.faint, fontSize: 16 }}>
            Nenhuma semana publicada ainda.
          </div>
        )}

        {loadingPosts && (
          <div style={{ textAlign: "center", padding: 48, color: T.faint, fontSize: 15 }}>
            Carregando posts...
          </div>
        )}

        {!loadingPosts && posts.length > 0 && (
          <>
            {/* Barra de progresso + ações */}
            <div style={{
              background: T.bg, borderRadius: 12, padding: "20px 24px", marginBottom: 24,
              display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.base }}>
                    {aprovados}/{total} aprovados
                    {rejeitados > 0 && <span style={{ color: "#EF4444", marginLeft: 8 }}>• {rejeitados} rejeitados</span>}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.base }}>{pct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: T.border, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: T.accent, borderRadius: 4, transition: "width 0.3s" }} />
                </div>
              </div>

              <button onClick={aprovarTodos} style={{
                padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                border: `1px solid ${T.border}`, background: T.white, color: T.base, cursor: "pointer",
              }}>
                ✓ Aprovar Todos
              </button>

              <button onClick={despachar} disabled={aprovados === 0 || despachando}
                style={{
                  padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: "none", cursor: aprovados === 0 ? "default" : "pointer",
                  background: aprovados > 0 ? T.base : T.border,
                  color: aprovados > 0 ? T.accent : T.faint,
                  opacity: despachando ? 0.6 : 1,
                }}>
                {despachando ? "Despachando..." : "🚀 Despachar"}
              </button>
            </div>

            {/* Lista de posts */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  status={statuses[post.id] || "pendente"}
                  comment={comments[post.id] || ""}
                  onToggle={(s) => toggleStatus(post.id, s)}
                  onComment={(c) => setComments((prev) => ({ ...prev, [post.id]: c }))}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modal.show && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }} onClick={() => setModal({ ...modal, show: false })}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: T.white, borderRadius: 16, padding: 32, maxWidth: 440, width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)", textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{modal.success ? "✅" : "❌"}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.base, marginBottom: 12 }}>
              {modal.success ? "Despachado!" : "Erro"}
            </div>
            <div style={{ fontSize: 14, color: T.secondary, lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {modal.msg}
            </div>
            <button onClick={() => setModal({ ...modal, show: false })} style={{
              marginTop: 24, padding: "10px 32px", borderRadius: 10, fontSize: 14, fontWeight: 700,
              border: "none", background: T.base, color: T.accent, cursor: "pointer",
            }}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
