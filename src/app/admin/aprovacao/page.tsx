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
  faint: "#999999",
  bg: "#F7F7F7",
  rowApproved: "#F4FFF8",
  rowRejected: "#FFF4F4",
};

const PILAR: Record<string, { color: string; bg: string }> = {
  "EDUCAÇÃO":   { color: "#1A3FA0", bg: "#EBF0FF" },
  "PROVOCAÇÃO": { color: "#A01A1A", bg: "#FFE8E8" },
  "PROCESSO":   { color: "#6A1AB0", bg: "#F2EBFF" },
  "PROVA":      { color: "#7A5000", bg: "#FFF4D6" },
  "CONVERSÃO":  { color: "#0A6B34", bg: "#E6FFF2" },
};

const TIPO: Record<string, { color: string; bg: string }> = {
  CARROSSEL: { color: T.base, bg: T.accent },
  REEL: { color: T.white, bg: T.base },
};

const F = "Inter, sans-serif";

/* ─── Badges ─── */
function Badge({ label, colors }: { label: string; colors: { color: string; bg: string } }) {
  return (
    <span style={{
      display: "inline-block", fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
      padding: "2px 8px", borderRadius: 0, color: colors.color, background: colors.bg,
      fontFamily: F, textTransform: "uppercase",
    }}>{label}</span>
  );
}

/* ─── Carrossel Mockup (square) ─── */
function CarrosselMockup({ slides }: { slides: any[] }) {
  const [idx, setIdx] = useState(0);
  const s = slides[idx];
  return (
    <div>
      <div style={{
        aspectRatio: "1/1", background: T.base, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24, position: "relative",
      }}>
        {s.destaque && (
          <div style={{ width: 40, height: 3, background: T.accent, marginBottom: 12 }} />
        )}
        <div style={{
          color: T.white, fontSize: 15, fontWeight: 700, textAlign: "center", lineHeight: 1.5,
          fontFamily: F, maxWidth: "90%",
        }}>{s.texto}</div>
        {s.destaque && (
          <div style={{ color: T.accent, fontSize: 11, fontWeight: 800, marginTop: 12, fontFamily: F }}>VOKU</div>
        )}
      </div>
      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
        <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}
          style={{ width: 28, height: 28, border: `1px solid ${T.border}`, borderRadius: 0, background: T.white, cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.3 : 1, fontSize: 14, color: T.base, fontFamily: F }}>←</button>
        {slides.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} style={{
            width: 6, height: 6, borderRadius: 0, cursor: "pointer",
            background: i === idx ? T.accent : T.border,
          }} />
        ))}
        <button onClick={() => setIdx(Math.min(slides.length - 1, idx + 1))} disabled={idx === slides.length - 1}
          style={{ width: 28, height: 28, border: `1px solid ${T.border}`, borderRadius: 0, background: T.white, cursor: idx === slides.length - 1 ? "default" : "pointer", opacity: idx === slides.length - 1 ? 0.3 : 1, fontSize: 14, color: T.base, fontFamily: F }}>→</button>
      </div>
      <div style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: T.faint, marginTop: 4, fontFamily: F, textTransform: "uppercase" }}>
        {s.num}/{slides.length} — {s.label}
      </div>
    </div>
  );
}

/* ─── Reel Mockup (vertical) ─── */
function ReelMockup({ cenas, duracao }: { cenas: any[]; duracao?: string }) {
  return (
    <div style={{
      aspectRatio: "9/16", background: T.base, padding: 16, display: "flex", flexDirection: "column",
      justifyContent: "center", gap: 10, position: "relative", overflow: "hidden",
    }}>
      {duracao && (
        <div style={{
          position: "absolute", top: 10, right: 10, background: T.accent, color: T.base,
          fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 0, fontFamily: F,
        }}>{duracao}</div>
      )}
      {cenas.map((c, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, background: T.accent, color: T.base,
              padding: "1px 5px", borderRadius: 0, fontFamily: F,
            }}>{c.tempo}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: T.accent, fontFamily: F, textTransform: "uppercase" }}>{c.label}</span>
          </div>
          <div style={{ fontSize: 11, color: T.white, lineHeight: 1.4, fontFamily: F, opacity: 0.9 }}>{c.fala}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Visual Mockup (preview da imagem) ─── */
function VisualMockup({ titulo, tipo }: { titulo: string; tipo: string }) {
  const isReel = tipo === "REEL";
  return (
    <div style={{
      aspectRatio: isReel ? "9/16" : "1/1", background: T.base, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ width: 40, height: 3, background: T.accent, marginBottom: 16 }} />
      <div style={{
        color: T.white, fontSize: 14, fontWeight: 700, textAlign: "center", lineHeight: 1.5,
        fontFamily: F, maxWidth: "85%",
      }}>{titulo}</div>
      <div style={{ width: 40, height: 3, background: T.accent, marginTop: 16 }} />
      <div style={{ color: T.accent, fontSize: 13, fontWeight: 800, marginTop: 12, fontFamily: F, letterSpacing: "0.1em" }}>VOKU</div>
    </div>
  );
}

/* ─── Expanded Post (3 columns) ─── */
function ExpandedPost({ post, comment, onComment }: { post: any; comment: string; onComment: (c: string) => void }) {
  const isCarrossel = post.tipo === "CARROSSEL";
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, padding: "20px 0",
      borderTop: `1px solid ${T.border}`,
    }}>
      {/* Col 1 — Conteúdo */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, color: T.faint, textTransform: "uppercase", marginBottom: 8, fontFamily: F }}>Conteúdo</div>
        {isCarrossel && post.slides_conteudo ? (
          <CarrosselMockup slides={post.slides_conteudo} />
        ) : post.roteiro_reel ? (
          <ReelMockup cenas={post.roteiro_reel} duracao={post.duracao} />
        ) : null}
      </div>

      {/* Col 2 — Legenda */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, color: T.faint, textTransform: "uppercase", marginBottom: 8, fontFamily: F }}>Legenda</div>
        <div style={{
          border: `1px solid ${T.border}`, borderRadius: 0, padding: 12,
          fontSize: 12, color: T.secondary, lineHeight: 1.6, whiteSpace: "pre-line", fontFamily: F,
          maxHeight: 280, overflowY: "auto",
        }}>{post.legenda}</div>

        {post.hashtags && (
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
            {post.hashtags.map((h: string, i: number) => (
              <span key={i} style={{ fontSize: 10, color: T.faint, background: T.bg, borderRadius: 0, padding: "2px 6px", fontFamily: F }}>{h}</span>
            ))}
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: T.faint, textTransform: "uppercase", marginBottom: 4, fontFamily: F }}>Comentário</div>
          <textarea
            value={comment}
            onChange={(e) => onComment(e.target.value)}
            placeholder="Observação..."
            style={{
              width: "100%", minHeight: 60, padding: 8, borderRadius: 0, border: `1px solid ${T.border}`,
              fontSize: 12, color: T.base, fontFamily: F, resize: "vertical", outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = T.accent)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          />
        </div>
      </div>

      {/* Col 3 — Visual / Prompt */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, color: T.faint, textTransform: "uppercase", marginBottom: 8, fontFamily: F }}>Preview</div>
        <VisualMockup titulo={post.titulo} tipo={post.tipo} />
        {post.prompt_dalle && (
          <div style={{ marginTop: 8, fontSize: 11, color: T.faint, fontStyle: "italic", lineHeight: 1.4, fontFamily: F }}>
            {post.prompt_dalle}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Post Row ─── */
function PostRow({ post, status, comment, onToggle, onComment }: {
  post: any; status: "pendente" | "aprovado" | "rejeitado";
  comment: string; onToggle: (s: "aprovado" | "rejeitado") => void; onComment: (c: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pilar = PILAR[post.pilar] || { color: T.base, bg: "#F3F3F3" };
  const tipo = TIPO[post.tipo] || { color: T.base, bg: T.bg };
  const rowBg = status === "aprovado" ? T.rowApproved : status === "rejeitado" ? T.rowRejected : T.white;

  return (
    <div style={{ background: rowBg, borderBottom: `1px solid ${T.border}` }}>
      {/* Row */}
      <div onClick={() => setExpanded(!expanded)} style={{
        display: "grid", gridTemplateColumns: "120px 90px 110px 1fr 80px 80px 32px",
        alignItems: "center", gap: 8, padding: "10px 16px", cursor: "pointer", fontFamily: F,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.faint }}>{post.dia} {post.horario}</div>
        <Badge label={post.tipo} colors={tipo} />
        <Badge label={post.pilar} colors={pilar} />
        <div style={{ fontSize: 13, fontWeight: 600, color: T.base, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.titulo}</div>
        <button onClick={(e) => { e.stopPropagation(); onToggle("aprovado"); }}
          style={{
            padding: "4px 0", borderRadius: 0, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: F,
            border: status === "aprovado" ? "2px solid #0A6B34" : `1px solid ${T.border}`,
            background: status === "aprovado" ? "#E6FFF2" : T.white,
            color: status === "aprovado" ? "#0A6B34" : T.faint,
          }}>✓</button>
        <button onClick={(e) => { e.stopPropagation(); onToggle("rejeitado"); }}
          style={{
            padding: "4px 0", borderRadius: 0, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: F,
            border: status === "rejeitado" ? "2px solid #A01A1A" : `1px solid ${T.border}`,
            background: status === "rejeitado" ? "#FFE8E8" : T.white,
            color: status === "rejeitado" ? "#A01A1A" : T.faint,
          }}>✗</button>
        <span style={{ fontSize: 16, color: T.faint, textAlign: "center", transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s", display: "inline-block" }}>▾</span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: "0 16px 20px" }}>
          <ExpandedPost post={post} comment={comment} onComment={onComment} />
        </div>
      )}
    </div>
  );
}

/* ═══════ PAGE ═══════ */
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

  const total = posts.length;
  const aprovados = Object.values(statuses).filter((s) => s === "aprovado").length;
  const rejeitados = Object.values(statuses).filter((s) => s === "rejeitado").length;
  const pendentes = total - aprovados - rejeitados;
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
        setModal({ show: true, success: true, msg: `Semana ${selected} despachada.\n${aprovados_ids.length} aprovados, ${rejeitados_ids.length} rejeitados.` });
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
      <div style={{ background: T.white, minHeight: "100vh", fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: T.faint }}>Carregando...</span>
      </div>
    );
  }

  return (
    <div style={{ background: T.white, minHeight: "100vh", fontFamily: F }}>
      {/* ─── Header fixo ─── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100, background: T.white,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 16, padding: "0 24px", height: 56, flexWrap: "wrap",
        }}>
          {/* Logo */}
          <div style={{
            background: T.accent, color: T.base, fontSize: 14, fontWeight: 900,
            padding: "4px 10px", borderRadius: 0, letterSpacing: "0.08em", fontFamily: F,
          }}>VOKU</div>

          <span style={{ fontSize: 13, fontWeight: 700, color: T.base, fontFamily: F }}>APROVAÇÃO DE CONTEÚDO</span>

          <div style={{ width: 1, height: 24, background: T.border }} />

          {/* Seletor de semana */}
          {semanas.length > 0 && (
            <div style={{ display: "flex", gap: 4 }}>
              {semanas.map((sem) => (
                <button key={sem.semana_key} onClick={() => selectSemana(sem.semana_key)}
                  style={{
                    padding: "4px 12px", borderRadius: 0, fontSize: 11, fontWeight: 700, cursor: "pointer",
                    border: selected === sem.semana_key ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                    background: selected === sem.semana_key ? T.base : T.white,
                    color: selected === sem.semana_key ? T.accent : T.secondary,
                    fontFamily: F,
                  }}>{sem.semana_key}</button>
              ))}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Contadores */}
          {total > 0 && (
            <div style={{ display: "flex", gap: 12, fontSize: 11, fontWeight: 700, fontFamily: F }}>
              <span style={{ color: "#0A6B34" }}>✓ {aprovados}</span>
              <span style={{ color: T.faint }}>○ {pendentes}</span>
              <span style={{ color: "#A01A1A" }}>✕ {rejeitados}</span>
            </div>
          )}

          <div style={{ width: 1, height: 24, background: T.border }} />

          {/* Ações */}
          <button onClick={aprovarTodos} disabled={total === 0}
            style={{
              padding: "6px 14px", borderRadius: 0, fontSize: 11, fontWeight: 800, cursor: total > 0 ? "pointer" : "default",
              border: `1px solid ${T.border}`, background: T.white, color: T.base, fontFamily: F,
              opacity: total === 0 ? 0.4 : 1,
            }}>APROVAR TODOS</button>

          <button onClick={despachar} disabled={aprovados === 0 || despachando}
            style={{
              padding: "6px 16px", borderRadius: 0, fontSize: 11, fontWeight: 800, cursor: aprovados > 0 ? "pointer" : "default",
              border: "none", fontFamily: F,
              background: aprovados > 0 ? T.base : T.border,
              color: aprovados > 0 ? T.accent : T.faint,
              opacity: despachando ? 0.5 : 1,
            }}>{despachando ? "DESPACHANDO..." : "DESPACHAR"}</button>
        </div>

        {/* Progress bar 3px */}
        <div style={{ height: 3, background: T.border }}>
          <div style={{ height: "100%", width: `${pct}%`, background: T.accent, transition: "width 0.3s" }} />
        </div>
      </div>

      {/* ─── Content ─── */}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {semanas.length === 0 && (
          <div style={{ textAlign: "center", padding: 80, color: T.faint, fontSize: 14, fontFamily: F }}>
            Nenhuma semana publicada.
          </div>
        )}

        {loadingPosts && (
          <div style={{ textAlign: "center", padding: 48, color: T.faint, fontSize: 13, fontFamily: F }}>
            Carregando posts...
          </div>
        )}

        {!loadingPosts && posts.length > 0 && (
          <div>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "120px 90px 110px 1fr 80px 80px 32px",
              gap: 8, padding: "8px 16px", borderBottom: `2px solid ${T.base}`,
              fontSize: 10, fontWeight: 800, color: T.faint, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F,
            }}>
              <span>Dia / Hora</span>
              <span>Tipo</span>
              <span>Pilar</span>
              <span>Título</span>
              <span style={{ textAlign: "center" }}>Aprovar</span>
              <span style={{ textAlign: "center" }}>Rejeitar</span>
              <span></span>
            </div>

            {/* Rows */}
            {posts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                status={statuses[post.id] || "pendente"}
                comment={comments[post.id] || ""}
                onToggle={(s) => toggleStatus(post.id, s)}
                onComment={(c) => setComments((prev) => ({ ...prev, [post.id]: c }))}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Modal ─── */}
      {modal.show && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }} onClick={() => setModal({ ...modal, show: false })}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: T.white, borderRadius: 0, padding: 32, maxWidth: 420, width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center", fontFamily: F,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{modal.success ? "✓" : "✗"}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.base, marginBottom: 8 }}>
              {modal.success ? "DESPACHADO" : "ERRO"}
            </div>
            <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {modal.msg}
            </div>
            <button onClick={() => setModal({ ...modal, show: false })} style={{
              marginTop: 20, padding: "8px 28px", borderRadius: 0, fontSize: 12, fontWeight: 800,
              border: "none", background: T.base, color: T.accent, cursor: "pointer", fontFamily: F,
            }}>FECHAR</button>
          </div>
        </div>
      )}
    </div>
  );
}
