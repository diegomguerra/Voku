"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "@/hooks/useUserContext";

const T = {
  sand: "#FAF8F3", white: "#FFFFFF", ink: "#111111", inkSub: "#3D3D3D", inkMid: "#6B6B6B", inkFaint: "#A0A0A0",
  lime: "#C8F135", border: "#E8E5DE", borderMd: "#D1CCBF",
  green: "#166534", greenBg: "#DCFCE7", teal: "#0D7A6E", tealBg: "#E6F5F3", amber: "#B45309", amberBg: "#FEF3C7",
  blue: "#1D4ED8", blueBg: "#DBEAFE", purple: "#7C3AED", purpleBg: "#EDE9FE",
};

const FORMAT_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  post_instagram: { label: "Post", color: T.teal, bg: T.tealBg },
  carrossel: { label: "Carrossel", color: T.blue, bg: T.blueBg },
  reels_script: { label: "Reels", color: T.purple, bg: T.purpleBg },
  ad_copy: { label: "Ad Copy", color: T.amber, bg: T.amberBg },
};

const CREDIT_COST: Record<string, number> = {
  post_instagram: 8,
  carrossel: 15,
  reels_script: 10,
  ad_copy: 10,
};

function calcTotalCredits(posts: any[]): number {
  return posts.reduce((sum: number, p: any) => sum + (CREDIT_COST[p.formato] || 8), 0);
}

const PILAR_COLORS = ["#C8F135", "#0D9488", "#F59E0B", "#8B5CF6", "#EC4899", "#3B82F6"];
const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const inputStyle = {
  width: "100%", boxSizing: "border-box" as const, background: T.sand,
  border: `1.5px solid ${T.borderMd}`, borderRadius: 10, padding: "12px 16px",
  fontSize: 14, color: T.ink, fontFamily: "'Plus Jakarta Sans',sans-serif", outline: "none",
};

type CalendarPost = {
  dia: number; data_sugerida: string; pilar: string; formato: string;
  titulo: string; descricao: string; hook_sugerido: string;
};

type Calendar = {
  pilares: string[];
  posts: CalendarPost[];
};

export default function CalendarioPage() {
  const { ctx, loading: ctxLoading } = useUserContext();
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [nicho, setNicho] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [tom, setTom] = useState("");
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [generatedDias, setGeneratedDias] = useState<Set<number>>(new Set());
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; running: boolean; currentDia: number }>({ current: 0, total: 0, running: false, currentDia: -1 });
  const [batchDone, setBatchDone] = useState(false);

  // Carrega calendário existente
  useEffect(() => {
    const sb = supabase();
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/cliente"; return; }
      setUserId(data.user.id);
      sb.from("editorial_calendars")
        .select("*")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .then(({ data: calendars }) => {
          if (calendars && calendars.length > 0) {
            setCalendar({ pilares: calendars[0].pilares, posts: calendars[0].posts });
          }
          setLoading(false);
        });
    });
  }, []);

  const handleGenerate = async () => {
    if (!nicho.trim() || !objetivo.trim() || generating) return;
    setGenerating(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-calendar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ nicho, objetivo, tom, user_id: userId }),
      });
      const data = await res.json();
      if (data.posts?.length) {
        setCalendar(data);
      }
    } catch {
      // silently fail
    }
    setGenerating(false);
  };

  const handleLogout = async () => {
    const sb = supabase();
    await sb.auth.signOut();
    window.location.href = "/cliente";
  };

  const handleExecutePost = async (post: CalendarPost) => {
    if (!userId) return;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Submit briefing to create order
    const res = await fetch("/api/submit-briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: post.formato,
        structured_data: {
          titulo: post.titulo,
          descricao: post.descricao,
          hook_sugerido: post.hook_sugerido,
          pilar: post.pilar,
          nicho,
          objetivo,
          tom,
        },
      }),
    });
    const data = await res.json();
    if (data?.order_id) {
      window.location.href = `/cliente/pedidos`;
    }
  };

  const handleBatchGenerate = async () => {
    if (!calendar || !userId || batchProgress.running) return;
    const postsToGenerate = calendar.posts.filter(p => !generatedDias.has(p.dia));
    if (postsToGenerate.length === 0) return;
    const totalCredits = calcTotalCredits(postsToGenerate);
    if (!confirm(`Isso vai usar ${totalCredits} créditos do seu saldo. Confirmar?`)) return;

    setBatchDone(false);
    setBatchProgress({ current: 0, total: postsToGenerate.length, running: true, currentDia: -1 });

    for (let i = 0; i < postsToGenerate.length; i++) {
      const post = postsToGenerate[i];
      setBatchProgress(prev => ({ ...prev, current: i, currentDia: post.dia }));

      try {
        const res = await fetch("/api/submit-briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: post.formato,
            structured_data: {
              titulo: post.titulo,
              descricao: post.descricao,
              hook: post.hook_sugerido,
              nicho,
              objetivo,
            },
          }),
        });
        const data = await res.json();
        if (data?.order_id) {
          setGeneratedDias(prev => new Set([...prev, post.dia]));
        }
      } catch {
        // continue to next
      }

      setBatchProgress(prev => ({ ...prev, current: i + 1 }));

      // Wait 2s before next (except last)
      if (i < postsToGenerate.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    setBatchProgress(prev => ({ ...prev, running: false, currentDia: -1 }));
    setBatchDone(true);
  };

  if (ctxLoading || loading) return (
    <div style={{ background: T.sand, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkMid, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15 }}>
      Carregando...
    </div>
  );

  // Pilar → color mapping
  const pilarColor = (pilar: string) => {
    const idx = (calendar?.pilares || []).indexOf(pilar);
    return PILAR_COLORS[idx >= 0 ? idx % PILAR_COLORS.length : 0];
  };

  // Organize posts into weeks
  const getWeeks = () => {
    if (!calendar?.posts?.length) return [];
    const firstDate = new Date(calendar.posts[0].data_sugerida);
    const startDay = firstDate.getDay(); // 0=Sun
    const cells: (CalendarPost | null)[] = [];
    // Pad beginning
    for (let i = 0; i < startDay; i++) cells.push(null);
    // Fill posts
    for (const post of calendar.posts) cells.push(post);
    // Pad end to complete last week
    while (cells.length % 7 !== 0) cells.push(null);
    // Split into weeks
    const weeks: (CalendarPost | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  };

  return (
    <div style={{ background: T.sand, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/cliente/pedidos" style={{ textDecoration: "none" }}>
            <div style={{ background: T.ink, color: T.lime, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 20, padding: "4px 14px", borderRadius: 6 }}>Voku</div>
          </a>
          <span style={{ color: T.borderMd, fontSize: 20 }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.inkSub }}>Calendário Editorial</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.sand, border: `1px solid ${T.border}`, borderRadius: 10, padding: "6px 14px" }}>
            <span style={{ fontSize: 12, color: T.inkMid, fontWeight: 600 }}>Créditos</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{ctx?.credits ?? 0}</span>
          </div>
          <span style={{ color: T.inkMid, fontSize: 13 }}>{ctx?.name}</span>
          <button onClick={handleLogout} style={{ background: "transparent", border: `1.5px solid ${T.borderMd}`, color: T.inkSub, borderRadius: 8, padding: "6px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sair</button>
        </div>
      </div>

      <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Formulário — sem calendário */}
        {!calendar && !generating && (
          <div style={{ maxWidth: 560, margin: "60px auto" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: T.ink, margin: "0 0 8px" }}>Calendário Editorial com IA</h1>
              <p style={{ fontSize: 14, color: T.inkMid, margin: 0 }}>30 dias de conteúdo planejado em segundos. Preencha abaixo e a IA monta tudo.</p>
            </div>
            <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: "36px 32px", boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.inkSub, marginBottom: 7 }}>Nicho do negócio *</label>
                <input value={nicho} onChange={e => setNicho(e.target.value)} placeholder="Ex: nutricionista, SaaS, loja de roupas" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.inkSub, marginBottom: 7 }}>Objetivo principal *</label>
                <input value={objetivo} onChange={e => setObjetivo(e.target.value)} placeholder="Ex: gerar leads, vender curso, aumentar seguidores" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.inkSub, marginBottom: 7 }}>Tom de comunicação</label>
                <input value={tom} onChange={e => setTom(e.target.value)} placeholder="Ex: profissional, descontraído, provocador (opcional)" style={inputStyle} />
              </div>
              <button onClick={handleGenerate} disabled={!nicho.trim() || !objetivo.trim()} style={{
                width: "100%", background: nicho.trim() && objetivo.trim() ? T.ink : "#ccc",
                color: nicho.trim() && objetivo.trim() ? T.lime : "#888",
                border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700,
                cursor: nicho.trim() && objetivo.trim() ? "pointer" : "not-allowed", fontFamily: "inherit",
              }}>
                Gerar calendário com IA →
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {generating && (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 16, animation: "pulse 1.5s infinite" }}>📅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Criando seu calendário...</div>
            <div style={{ fontSize: 14, color: T.inkMid }}>A IA está planejando 30 dias de conteúdo para você.</div>
          </div>
        )}

        {/* Calendário gerado */}
        {calendar && !generating && (
          <>
            {/* Pilares */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.inkSub }}>Pilares:</span>
              {calendar.pilares.map((pilar, i) => (
                <span key={pilar} style={{
                  background: PILAR_COLORS[i % PILAR_COLORS.length] + "20",
                  color: T.ink, border: `1.5px solid ${PILAR_COLORS[i % PILAR_COLORS.length]}`,
                  borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 600,
                }}>{pilar}</span>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                {calendar.posts.some(p => !generatedDias.has(p.dia)) && !batchProgress.running && (
                  <button onClick={handleBatchGenerate} style={{
                    background: T.ink, color: T.lime, border: "none", borderRadius: 8,
                    padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}>
                    Gerar tudo ({calcTotalCredits(calendar.posts.filter(p => !generatedDias.has(p.dia)))} créditos)
                  </button>
                )}
                <button onClick={() => { setCalendar(null); setNicho(""); setObjetivo(""); setTom(""); setGeneratedDias(new Set()); setBatchDone(false); }} style={{
                  background: "transparent", border: `1.5px solid ${T.borderMd}`,
                  color: T.inkSub, borderRadius: 8, padding: "6px 16px", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  Gerar novo calendário
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {batchProgress.running && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Gerando {batchProgress.current} de {batchProgress.total}...</span>
                  <span style={{ fontSize: 12, color: T.inkMid }}>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                </div>
                <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: T.lime, borderRadius: 3, transition: "width 0.3s", width: `${(batchProgress.current / batchProgress.total) * 100}%` }} />
                </div>
              </div>
            )}

            {/* Batch done */}
            {batchDone && !batchProgress.running && (
              <div style={{ marginBottom: 16, background: T.greenBg, border: `1px solid ${T.green}30`, borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.green }}>✓ Todos os conteúdos foram gerados! Veja em Pedidos.</span>
                <a href="/cliente/pedidos" style={{ fontSize: 13, fontWeight: 700, color: T.green, textDecoration: "none" }}>Ver pedidos →</a>
              </div>
            )}

            {/* Grid header — dias da semana */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
              {DAYS_OF_WEEK.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: T.inkMid, padding: "8px 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>{d}</div>
              ))}
            </div>

            {/* Grid — semanas */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {getWeeks().map((week, wi) => (
                <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                  {week.map((post, di) => {
                    const isGenerated = post ? generatedDias.has(post.dia) : false;
                    const isCurrentBatch = post ? batchProgress.running && batchProgress.currentDia === post.dia : false;
                    return (
                    <div key={`${wi}-${di}`} onClick={() => post && setSelectedPost(post)} style={{
                      background: post ? T.white : "transparent",
                      border: isCurrentBatch ? `2px solid ${T.lime}` : post ? `1px solid ${T.border}` : "1px solid transparent",
                      borderRadius: 12, padding: post ? "10px 10px 8px" : 10,
                      minHeight: 110, cursor: post ? "pointer" : "default",
                      transition: "all 0.15s",
                      boxShadow: isCurrentBatch ? `0 0 12px ${T.lime}40` : post ? "0 1px 4px rgba(0,0,0,0.04)" : "none",
                      animation: isCurrentBatch ? "borderPulse 1.5s infinite" : "none",
                      position: "relative" as const,
                    }}>
                      {post && (
                        <>
                          {isGenerated && (
                            <div style={{ position: "absolute", top: 6, right: 6, background: T.greenBg, color: T.green, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6 }}>✓ Gerado</div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: T.inkFaint }}>Dia {post.dia}</span>
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6,
                              background: FORMAT_BADGE[post.formato]?.bg || T.sand,
                              color: FORMAT_BADGE[post.formato]?.color || T.inkMid,
                            }}>{FORMAT_BADGE[post.formato]?.label || post.formato}</span>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, lineHeight: 1.35, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {post.titulo}
                          </div>
                          <div style={{
                            fontSize: 9, fontWeight: 600, color: pilarColor(post.pilar),
                            display: "inline-block", padding: "1px 6px", borderRadius: 4,
                            background: pilarColor(post.pilar) + "20",
                          }}>{post.pilar}</div>
                        </>
                      )}
                    </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de detalhes do post */}
      {selectedPost && (
        <div onClick={() => setSelectedPost(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.white, borderRadius: 20, padding: "32px 28px", maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                background: FORMAT_BADGE[selectedPost.formato]?.bg || T.sand,
                color: FORMAT_BADGE[selectedPost.formato]?.color || T.inkMid,
              }}>{FORMAT_BADGE[selectedPost.formato]?.label || selectedPost.formato}</span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8,
                background: pilarColor(selectedPost.pilar) + "20",
                color: pilarColor(selectedPost.pilar),
              }}>{selectedPost.pilar}</span>
              <span style={{ fontSize: 12, color: T.inkFaint, marginLeft: "auto" }}>Dia {selectedPost.dia}</span>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: T.ink, margin: "0 0 12px", lineHeight: 1.3 }}>{selectedPost.titulo}</h2>
            <p style={{ fontSize: 14, color: T.inkSub, lineHeight: 1.6, margin: "0 0 16px" }}>{selectedPost.descricao}</p>

            <div style={{ background: T.sand, borderRadius: 12, padding: "14px 16px", marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMid, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Hook sugerido</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, lineHeight: 1.5, fontStyle: "italic" }}>"{selectedPost.hook_sugerido}"</div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { handleExecutePost(selectedPost); setSelectedPost(null); }} style={{
                flex: 1, background: T.ink, color: T.lime, border: "none", borderRadius: 12,
                padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                Gerar conteúdo com IA →
              </button>
              <button onClick={() => setSelectedPost(null)} style={{
                background: "transparent", border: `1.5px solid ${T.borderMd}`, color: T.inkSub,
                borderRadius: 12, padding: "14px 20px", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes borderPulse { 0%,100%{box-shadow:0 0 8px #C8F13540} 50%{box-shadow:0 0 18px #C8F13580} }
      `}</style>
    </div>
  );
}
