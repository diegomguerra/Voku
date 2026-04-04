"use client";
import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

const FF = "'Inter', sans-serif";
const S = {
  bg: "#FFFFFF",
  cardBg: "#FAFAFA",
  cardBorder: "#E5E5E5",
  accent: "#AAFF00",
  text: "#111111",
  textSub: "#555555",
  pillBg: "#f0f0f0",
};

type Choice = {
  id: string;
  label: string;
  content: any;
  position: number;
  is_selected: boolean;
  image_url?: string;
};

type OrderData = {
  id: string;
  order_number: number;
  product: string;
  status: string;
  delivered_at: string | null;
};

type Post = {
  label: string;
  formato: string;
  gancho: string;
  desenvolvimento: string;
  cta: string;
  hashtags: string[];
  sugestaoVisual: string;
};

type Props = {
  order: OrderData;
  choices: Choice[];
  iterationId: string | null;
};

/* ─── Parse helpers ─── */

function parsePosts(choice: Choice): Post[] {
  let raw: any = choice.content;

  // String content (might have markdown fences)
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw.replace(/^```json\n?/, "").replace(/\n?```$/, ""));
    } catch {
      raw = { text: raw };
    }
  }

  // Already an array of post objects
  if (Array.isArray(raw)) {
    return raw.map((obj: any, i: number) => parsePostObj(obj, i));
  }

  // Object with text field
  let text: string = raw?.text || "";

  // Unescape literal \\n to real newlines
  if (text.includes("\\n")) {
    text = text.replace(/\\n/g, "\n");
  }

  // If text is itself a JSON array string (embedded variations), try parsing
  if (text.trim().startsWith("[")) {
    try {
      const arr = JSON.parse(text);
      if (Array.isArray(arr) && arr.length > 0 && arr[0].text) {
        // Use the first variation's text to extract posts
        const inner = arr[0].text.replace(/\\n/g, "\n");
        return splitPostsFromText(inner);
      }
    } catch {
      // fall through to text splitting
    }
  }

  return splitPostsFromText(text);
}

function parsePostObj(obj: any, idx: number): Post {
  if (obj.text) return parseFieldsFromText(obj.label || `POST ${idx + 1}`, obj.text);
  return {
    label: obj.label || `POST ${idx + 1}`,
    formato: obj.formato || "",
    gancho: obj.gancho || "",
    desenvolvimento: obj.desenvolvimento || "",
    cta: obj.cta || "",
    hashtags: normalizeHashtags(obj.hashtags),
    sugestaoVisual: obj.sugestao_visual || obj.sugestaoVisual || "",
  };
}

function splitPostsFromText(text: string): Post[] {
  // Strip leading title lines like "# SELECT SIRES - CONTENT PACK (12 POSTS)"
  const cleaned = text.replace(/^#\s+[^\n]+\n+/, "").trim();

  // Try splitting by ## POST N or **POST N** or POST N (bold or header)
  const markers = /(?=##\s*POST\s+\d+|(?:^|\n)\*\*\s*POST\s+\d+)/gi;
  const sections = cleaned.split(markers).filter((s) => s.trim());

  if (sections.length > 1) {
    // Remove --- separators between posts
    return sections.map((s, i) =>
      parseFieldsFromText(`POST ${i + 1}`, s.replace(/\n---\s*$/, "").trim())
    );
  }

  // Fallback: try splitting by --- separators
  const bySep = cleaned.split(/\n---\n/).filter((s) => s.trim());
  if (bySep.length > 1) {
    return bySep.map((s, i) => parseFieldsFromText(`POST ${i + 1}`, s.trim()));
  }

  // Fallback: single post
  return [parseFieldsFromText("POST 1", cleaned)];
}

function parseFieldsFromText(defaultLabel: string, text: string): Post {
  const labelMatch = text.match(/##\s*(POST\s+\d+)|\*\*\s*(POST\s+\d+)\s*\*\*/i);
  const label = labelMatch ? (labelMatch[1] || labelMatch[2]) : defaultLabel;

  const extract = (pattern: RegExp): string => {
    const m = text.match(pattern);
    return m ? m[1].trim() : "";
  };

  // DESENVOLVIMENTO can be multi-line — capture until next **FIELD:**
  const devMatch = text.match(
    /\*\*DESENVOLVIMENTO:\*\*\s*([\s\S]*?)(?=\n\s*\*\*(?:CTA|HASHTAG|SUGEST)|$)/i
  );
  const desenvolvimento = devMatch ? devMatch[1].trim() : "";

  const hashStr = extract(/\*\*HASHTAGS?:\*\*\s*(.+)/i);
  const hashtags = hashStr
    .split(/\s+/)
    .filter((h) => h.startsWith("#"))
    .map((h) => h.replace(/,$/g, ""));

  return {
    label: label.toUpperCase(),
    formato: extract(/\*\*FORMATO:\*\*\s*(.+)/i),
    gancho: extract(/\*\*GANCHO:\*\*\s*(.+)/i),
    desenvolvimento,
    cta: extract(/\*\*CTA:\*\*\s*(.+)/i),
    hashtags,
    sugestaoVisual: extract(/\*\*SUGEST[ÃA]O\s*VISUAL:\*\*\s*([\s\S]*?)(?=\n\s*\*\*|$)/i),
  };
}

function normalizeHashtags(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string")
    return val
      .split(/\s+/)
      .filter((h: string) => h.startsWith("#"))
      .map((h: string) => h.replace(/,$/g, ""));
  return [];
}

/**
 * Expand choices: if there's a single choice whose text is a JSON array
 * of variations (fallback from execute-product), split into virtual choices.
 */
function expandChoices(choices: Choice[]): Choice[] {
  if (choices.length !== 1) return choices;
  const c = choices[0];
  const text = typeof c.content === "string" ? c.content : c.content?.text;
  if (typeof text !== "string" || !text.trim().startsWith("[")) return choices;

  try {
    const cleaned = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    const arr = JSON.parse(cleaned);
    if (!Array.isArray(arr) || arr.length <= 1) return choices;

    return arr.map((v: any, i: number) => ({
      ...c,
      id: c.id, // keep real ID for DB operations
      _virtualIndex: i,
      label: v.label || `Option ${String.fromCharCode(65 + i)}`,
      content: { text: typeof v.text === "string" ? v.text.replace(/\\n/g, "\n") : v.text || "" },
      position: i,
    })) as any[];
  } catch {
    return choices;
  }
}

/* ─── Component ─── */

export default function SocialPackViewer({ order, choices: rawChoices, iterationId }: Props) {
  const choices = useMemo(() => expandChoices(rawChoices), [rawChoices]);
  const sorted = [...choices].sort((a, b) => a.position - b.position);
  const [activeTab, setActiveTab] = useState(0);
  const [currentPost, setCurrentPost] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(order.status === "delivered");
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjustSending, setAdjustSending] = useState(false);
  const [adjustSent, setAdjustSent] = useState(false);

  const activeChoice = sorted[activeTab];
  const posts = activeChoice ? parsePosts(activeChoice) : [];
  const post = posts[currentPost];
  const totalPosts = posts.length;
  const tabLabels = ["A", "B", "C", "D"];

  /* ─── Approve ─── */
  const handleApprove = async () => {
    if (!activeChoice || submitting) return;
    setSubmitting(true);
    const sb = supabase();

    await sb
      .from("choices")
      .update({ is_selected: true, selected_at: new Date().toISOString() })
      .eq("id", activeChoice.id);

    if (iterationId) {
      await sb
        .from("iterations")
        .update({
          status: "approved",
          client_replied_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
        })
        .eq("id", iterationId);
    }

    // Save deliverable — use the parsed posts for clean output
    const choicePosts = parsePosts(activeChoice);
    const text = choicePosts.map((p) =>
      [p.label, p.formato && `FORMATO: ${p.formato}`, p.gancho && `GANCHO: ${p.gancho}`,
       p.desenvolvimento && `DESENVOLVIMENTO:\n${p.desenvolvimento}`, p.cta && `CTA: ${p.cta}`,
       p.hashtags.length > 0 && `HASHTAGS: ${p.hashtags.join(" ")}`,
       p.sugestaoVisual && `SUGESTÃO VISUAL: ${p.sugestaoVisual}`].filter(Boolean).join("\n")
    ).join("\n\n---\n\n");
    const fileName = `${order.product}_${order.id}.txt`;
    const filePath = `choices/${fileName}`;
    await sb.storage
      .from("deliverables")
      .upload(filePath, new Blob([text], { type: "text/plain" }), { upsert: true });

    const { data: userData } = await sb.auth.getUser();
    await sb.from("deliverables").insert({
      order_id: order.id,
      user_id: userData?.user?.id,
      file_name: fileName,
      file_path: filePath,
      file_type: "txt",
      storage_bucket: "deliverables",
    });

    await sb
      .from("orders")
      .update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("id", order.id);

    const completedAt = new Date().toISOString();
    await Promise.all([
      sb.from("project_steps").update({ status: "done", completed_at: completedAt }).eq("order_id", order.id).neq("status", "done"),
      sb.from("project_phases").update({ status: "done", completed_at: completedAt }).eq("order_id", order.id).neq("status", "done"),
    ]);

    setDone(true);
    setSubmitting(false);
  };

  // Real choice ID for DB operations (virtual choices share same real ID)
  const realChoiceId = rawChoices[0]?.id || activeChoice?.id;

  /* ─── Request adjustments ─── */
  const handleRequestAdjust = async () => {
    if (!adjustNotes.trim() || adjustSending) return;
    setAdjustSending(true);

    try {
      const { data: userData } = await supabase().auth.getUser();
      await fetch("/api/request-revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          user_id: userData?.user?.id,
          type: "new_variations",
          choice_id: realChoiceId,
          notes: adjustNotes.trim(),
        }),
      });
      setAdjustSent(true);
      setShowAdjustForm(false);
      setAdjustNotes("");
    } catch {
      // silent
    }
    setAdjustSending(false);
  };

  /* ─── Done state ─── */
  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px", fontFamily: FF }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: S.text, marginBottom: 8 }}>
          Social Pack aprovado!
        </h2>
        <p style={{ fontSize: 14, color: S.textSub }}>
          Seu pacote de conteúdo foi aprovado com sucesso.
        </p>
      </div>
    );
  }

  if (!activeChoice || !post) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px", fontFamily: FF, color: S.textSub }}>
        Nenhum conteúdo disponível.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FF, color: S.text, maxWidth: 720, margin: "0 auto" }}>
      {/* Cover image */}
      {activeChoice.image_url && (
        <img
          src={activeChoice.image_url}
          alt="Capa do projeto"
          style={{
            width: "100%",
            maxHeight: 280,
            objectFit: "cover",
            borderRadius: 8,
            display: "block",
            marginBottom: 24,
          }}
        />
      )}

      {/* Choice tabs (only if more than 1 choice) */}
      {sorted.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {sorted.map((c, i) => {
            const isActive = i === activeTab;
            return (
              <button
                key={c.id}
                onClick={() => { setActiveTab(i); setCurrentPost(0); }}
                style={{
                  fontFamily: FF,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: `2px solid ${isActive ? S.accent : S.cardBorder}`,
                  background: isActive ? S.accent : S.bg,
                  color: S.text,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Opção {tabLabels[i] || i + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* Choice label */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, margin: 0 }}>
        Opção {tabLabels[activeTab]} — {activeChoice.label}
      </h2>

      {/* Post counter + pagination */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700 }}>
          POST {currentPost + 1} de {totalPosts}
        </span>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button
            onClick={() => setCurrentPost((p) => Math.max(0, p - 1))}
            disabled={currentPost === 0}
            style={{
              fontFamily: FF,
              fontSize: 13,
              fontWeight: 600,
              width: 32,
              height: 32,
              borderRadius: 6,
              border: `1px solid ${S.cardBorder}`,
              background: S.bg,
              color: currentPost === 0 ? S.cardBorder : S.text,
              cursor: currentPost === 0 ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ←
          </button>
          {Array.from({ length: totalPosts }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPost(i)}
              style={{
                fontFamily: FF,
                fontSize: 12,
                fontWeight: i === currentPost ? 800 : 500,
                width: 32,
                height: 32,
                borderRadius: 6,
                border: `1px solid ${i === currentPost ? S.accent : S.cardBorder}`,
                background: i === currentPost ? S.accent : S.bg,
                color: S.text,
                cursor: "pointer",
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPost((p) => Math.min(totalPosts - 1, p + 1))}
            disabled={currentPost === totalPosts - 1}
            style={{
              fontFamily: FF,
              fontSize: 13,
              fontWeight: 600,
              width: 32,
              height: 32,
              borderRadius: 6,
              border: `1px solid ${S.cardBorder}`,
              background: S.bg,
              color: currentPost === totalPosts - 1 ? S.cardBorder : S.text,
              cursor: currentPost === totalPosts - 1 ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Post card */}
      <div
        style={{
          background: S.cardBg,
          border: `1px solid ${S.cardBorder}`,
          borderRadius: 12,
          padding: 28,
          marginBottom: 20,
        }}
      >
        {/* FORMATO */}
        {post.formato && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: S.textSub, marginBottom: 4 }}>
              FORMATO
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{post.formato}</div>
          </div>
        )}

        {/* GANCHO */}
        {post.gancho && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: S.textSub, marginBottom: 4 }}>
              GANCHO
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{post.gancho}</div>
          </div>
        )}

        {/* Separator */}
        {(post.formato || post.gancho) && post.desenvolvimento && (
          <hr style={{ border: "none", borderTop: `1px solid ${S.cardBorder}`, margin: "16px 0" }} />
        )}

        {/* DESENVOLVIMENTO */}
        {post.desenvolvimento && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: S.textSub, marginBottom: 8 }}>
              DESENVOLVIMENTO
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: S.text }}>
              {post.desenvolvimento.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i < post.desenvolvimento.split("\n").length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Separator */}
        {post.desenvolvimento && (post.cta || post.hashtags.length > 0 || post.sugestaoVisual) && (
          <hr style={{ border: "none", borderTop: `1px solid ${S.cardBorder}`, margin: "16px 0" }} />
        )}

        {/* CTA */}
        {post.cta && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: S.textSub, marginBottom: 4 }}>
              CTA
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{post.cta}</div>
          </div>
        )}

        {/* HASHTAGS */}
        {post.hashtags.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: S.textSub, marginBottom: 8 }}>
              HASHTAGS
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {post.hashtags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    background: S.pillBg,
                    color: S.text,
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "4px 10px",
                    borderRadius: 20,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SUGESTÃO VISUAL */}
        {post.sugestaoVisual && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: S.textSub, marginBottom: 4 }}>
              SUGESTÃO VISUAL
            </div>
            <div style={{ fontSize: 14, color: S.textSub, lineHeight: 1.6 }}>
              {post.sugestaoVisual}
            </div>
          </div>
        )}
      </div>

      {/* Prev / Next buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
        <button
          onClick={() => setCurrentPost((p) => Math.max(0, p - 1))}
          disabled={currentPost === 0}
          style={{
            fontFamily: FF,
            fontSize: 13,
            fontWeight: 600,
            padding: "10px 20px",
            borderRadius: 8,
            border: `1px solid ${S.cardBorder}`,
            background: S.bg,
            color: currentPost === 0 ? S.cardBorder : S.text,
            cursor: currentPost === 0 ? "default" : "pointer",
          }}
        >
          ← Post anterior
        </button>
        <button
          onClick={() => setCurrentPost((p) => Math.min(totalPosts - 1, p + 1))}
          disabled={currentPost === totalPosts - 1}
          style={{
            fontFamily: FF,
            fontSize: 13,
            fontWeight: 600,
            padding: "10px 20px",
            borderRadius: 8,
            border: `1px solid ${S.cardBorder}`,
            background: S.bg,
            color: currentPost === totalPosts - 1 ? S.cardBorder : S.text,
            cursor: currentPost === totalPosts - 1 ? "default" : "pointer",
          }}
        >
          Próximo post →
        </button>
      </div>

      {/* Separator */}
      <hr style={{ border: "none", borderTop: `1px solid ${S.cardBorder}`, margin: "0 0 24px" }} />

      {/* Adjust sent confirmation */}
      {adjustSent && (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #86EFAC",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 700,
            color: "#166534",
            textAlign: "center",
          }}
        >
          ✓ Pedido de ajuste enviado! Vamos revisar e atualizar em breve.
        </div>
      )}

      {/* Adjust form */}
      {showAdjustForm && (
        <div
          style={{
            background: S.cardBg,
            border: `1px solid ${S.cardBorder}`,
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            O que você gostaria de ajustar?
          </div>
          <textarea
            value={adjustNotes}
            onChange={(e) => setAdjustNotes(e.target.value)}
            placeholder='Ex: "Mude o tom para mais informal" ou "Adicione mais CTAs diretos"'
            rows={4}
            style={{
              fontFamily: FF,
              width: "100%",
              boxSizing: "border-box" as const,
              border: `1px solid ${S.cardBorder}`,
              borderRadius: 8,
              padding: "12px 14px",
              fontSize: 13,
              color: S.text,
              resize: "vertical",
              outline: "none",
              marginBottom: 12,
            }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleRequestAdjust}
              disabled={!adjustNotes.trim() || adjustSending}
              style={{
                fontFamily: FF,
                fontSize: 13,
                fontWeight: 700,
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: S.accent,
                color: S.text,
                cursor: adjustNotes.trim() && !adjustSending ? "pointer" : "not-allowed",
                opacity: adjustSending ? 0.6 : 1,
              }}
            >
              {adjustSending ? "Enviando..." : "Enviar pedido"}
            </button>
            <button
              onClick={() => { setShowAdjustForm(false); setAdjustNotes(""); }}
              style={{
                fontFamily: FF,
                fontSize: 13,
                fontWeight: 600,
                padding: "10px 20px",
                borderRadius: 8,
                border: `1.5px solid ${S.text}`,
                background: S.bg,
                color: S.text,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => setShowAdjustForm(!showAdjustForm)}
          style={{
            fontFamily: FF,
            flex: 1,
            fontSize: 14,
            fontWeight: 700,
            padding: "16px",
            borderRadius: 10,
            border: `2px solid ${S.text}`,
            background: S.bg,
            color: S.text,
            cursor: "pointer",
          }}
        >
          SOLICITAR AJUSTES
        </button>
        <button
          onClick={handleApprove}
          disabled={submitting}
          style={{
            fontFamily: FF,
            flex: 1,
            fontSize: 14,
            fontWeight: 700,
            padding: "16px",
            borderRadius: 10,
            border: "none",
            background: S.accent,
            color: S.text,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Aprovando..." : `✓ APROVAR OPÇÃO ${tabLabels[activeTab]}`}
        </button>
      </div>
    </div>
  );
}
