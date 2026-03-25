"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const FF = "'Plus Jakarta Sans', sans-serif";
const C = {
  bg: "#0a0a0a", card: "#141414", cardHover: "#1a1a1a", border: "#222",
  borderActive: "#C8F135", lime: "#C8F135", limeDim: "#C8F13540",
  white: "#F0F0EC", sub: "#888", faint: "#555", dark: "#111",
};

type Choice = {
  id: string;
  label: string;
  content: { text?: string; headline?: string; body?: string; sections?: any[] };
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

type Deliverable = {
  id: string;
  file_path: string;
  file_name: string;
};

type Props = {
  order: OrderData;
  choices: Choice[];
  deliverables: Deliverable[];
  iterationId: string | null;
};

const PRODUCT_NAMES: Record<string, string> = {
  landing_page_copy: "Landing Page Copy",
  content_pack: "Content Pack",
  email_sequence: "Email Sequence",
};

function getPreview(choice: Choice): string {
  const raw = choice.content?.text || choice.content?.body || "";
  const lines = raw.split("\n").filter((l: string) => l.trim());
  return lines.slice(0, 4).join("\n");
}

function getFullText(choice: Choice): string {
  return choice.content?.text || choice.content?.body || JSON.stringify(choice.content, null, 2);
}

export default function OrderChoices({ order, choices: initialChoices, deliverables, iterationId }: Props) {
  const [choices, setChoices] = useState<Choice[]>(initialChoices);
  const [selected, setSelected] = useState<string | null>(
    choices.find((c) => c.is_selected)?.id || null
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(order.status === "delivered");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showOptIn, setShowOptIn] = useState(false);
  const [optInDone, setOptInDone] = useState(false);
  const [optInLoading, setOptInLoading] = useState(false);

  // Poll for image_url updates (images generate async after text)
  useEffect(() => {
    const hasImages = choices.some((c) => c.image_url);
    const allHaveImages = choices.every((c) => c.image_url);
    if (allHaveImages || done) return;
    // Only poll if at least one choice might get an image
    const interval = setInterval(async () => {
      const sb = supabase();
      const { data } = await sb
        .from("choices")
        .select("id, image_url")
        .eq("order_id", order.id);
      if (data?.some((d: any) => d.image_url)) {
        setChoices((prev) =>
          prev.map((c) => {
            const updated = data.find((d: any) => d.id === c.id);
            return updated?.image_url ? { ...c, image_url: updated.image_url } : c;
          })
        );
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [choices, order.id, done]);

  const isPending = order.status === "in_production" && choices.length > 0 && !choices.some((c) => c.is_selected);
  const isWaiting = (order.status === "briefing" || order.status === "in_production") && choices.length === 0;

  const handleApprove = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    const sb = supabase();

    // 1. Mark choice as selected
    await sb.from("choices").update({ is_selected: true, selected_at: new Date().toISOString() }).eq("id", selected);

    // 2. Save feedback if any
    if (feedback.trim()) {
      await sb.from("choice_feedback").insert({ choice_id: selected, message: feedback.trim() });
    }

    // 3. Update iteration
    if (iterationId) {
      await sb.from("iterations").update({
        status: "approved",
        client_replied_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
      }).eq("id", iterationId);
    }

    // 4. Save chosen content as deliverable in storage
    const chosenChoice = choices.find((c) => c.id === selected);
    const text = chosenChoice ? getFullText(chosenChoice) : "";
    const fileName = `${order.product}_${order.id}.txt`;
    const filePath = `choices/${fileName}`;

    await sb.storage.from("deliverables").upload(filePath, new Blob([text], { type: "text/plain" }), { upsert: true });

    // Insert deliverable record
    const { data: userData } = await sb.auth.getUser();
    await sb.from("deliverables").insert({
      order_id: order.id,
      user_id: userData?.user?.id,
      file_name: fileName,
      file_path: filePath,
      file_type: "txt",
      storage_bucket: "deliverables",
    });

    // 5. Update order status
    await sb.from("orders").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", order.id);

    // 6. Get download URL
    const { data: urlData } = await sb.storage.from("deliverables").createSignedUrl(filePath, 3600);
    if (urlData?.signedUrl) setDownloadUrl(urlData.signedUrl);

    setDone(true);
    setShowOptIn(true);
    setSubmitting(false);
  };

  const PRODUCT_TO_VITRINE_TYPE: Record<string, string> = {
    landing_page_copy: "landing_page", content_pack: "post", email_sequence: "email",
    post_instagram: "post", carrossel: "carrossel", reels_script: "reels", ad_copy: "copy", app: "app",
  };

  const handleOptIn = async () => {
    setOptInLoading(true);
    const sb = supabase();
    const { data: userData } = await sb.auth.getUser();
    if (!userData?.user) { setOptInLoading(false); return; }

    const chosenChoice = choices.find((c) => c.id === selected);
    const previewText = chosenChoice ? (chosenChoice.content?.text || chosenChoice.content?.body || "").slice(0, 300) : "";

    await sb.from("vitrine_items").insert({
      user_id: userData.user.id,
      order_id: order.id,
      tipo: PRODUCT_TO_VITRINE_TYPE[order.product] || "copy",
      titulo: PRODUCT_NAMES[order.product] || order.product,
      conteudo_preview: previewText,
      credits_bonus_paid: true,
    });

    // Credit 5 bonus
    const { data: creditRow } = await sb.from("credits").select("balance").eq("user_id", userData.user.id).single();
    if (creditRow) {
      await sb.from("credits").update({ balance: creditRow.balance + 5 }).eq("user_id", userData.user.id);
      await sb.from("credit_transactions").insert({
        user_id: userData.user.id, amount: 5, type: "credit",
        description: "Bônus por publicação na vitrine", order_id: order.id,
      });
    }

    setOptInDone(true);
    setOptInLoading(false);
    setShowOptIn(false);
  };

  const handleDownload = async () => {
    if (downloadUrl) { window.open(downloadUrl, "_blank"); return; }
    const d = deliverables[0];
    if (!d) return;
    const sb = supabase();
    const { data } = await sb.storage.from("deliverables").createSignedUrl(d.file_path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  // ─── SUCCESS STATE ───
  if (done) {
    return (
      <div style={{ padding: "40px 24px" }}>
        {/* Opt-in banner */}
        {showOptIn && !optInDone && (
          <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 14, padding: "20px 24px", marginBottom: 28 }}>
            <div style={{ fontFamily: FF, fontSize: 15, fontWeight: 700, color: "#166534", marginBottom: 6 }}>
              ✦ Quer compartilhar na vitrine da Voku?
            </div>
            <div style={{ fontFamily: FF, fontSize: 13, color: "#3D3D3D", marginBottom: 16, lineHeight: 1.5 }}>
              Ganhe 5 créditos bônus e ajude outros criadores a se inspirar.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleOptIn} disabled={optInLoading} style={{
                fontFamily: FF, background: "#C8F135", color: "#111", border: "none", borderRadius: 10,
                padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                {optInLoading ? "Publicando..." : "Sim, compartilhar (+5 créditos)"}
              </button>
              <button onClick={() => setShowOptIn(false)} style={{
                fontFamily: FF, background: "transparent", border: "1.5px solid #D1CCBF", color: "#3D3D3D",
                borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                Não, obrigado
              </button>
            </div>
          </div>
        )}

        {/* Opt-in success toast */}
        {optInDone && (
          <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontFamily: FF, fontSize: 13, fontWeight: 700, color: "#166534", textAlign: "center" }}>
            ✓ Publicado! +5 créditos adicionados
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontFamily: FF, fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 8 }}>
            Choice approved!
          </h2>
          <p style={{ fontFamily: FF, fontSize: 14, color: C.sub, marginBottom: 32 }}>
            Your material is ready for download.
          </p>
          <button onClick={handleDownload} style={{
            fontFamily: FF, background: C.lime, color: C.dark, border: "none", borderRadius: 10,
            padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}>
            ⬇ Download
          </button>
        </div>
      </div>
    );
  }

  // ─── WAITING STATE ───
  if (isWaiting) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontFamily: FF, fontSize: 18, fontWeight: 700, color: C.white, marginBottom: 8 }}>
          We&apos;re producing your material
        </h2>
        <p style={{ fontFamily: FF, fontSize: 14, color: C.sub }}>
          You&apos;ll receive an email when your 3 options are ready.
        </p>
      </div>
    );
  }

  // ─── CHOICES SELECTION ───
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: FF, fontSize: 12, fontWeight: 600, color: C.lime, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          Order #{order.order_number} — {PRODUCT_NAMES[order.product] || order.product}
        </div>
        <h2 style={{ fontFamily: FF, fontSize: 22, fontWeight: 700, color: C.white, margin: 0, marginBottom: 6 }}>
          Your 3 options are ready
        </h2>
        <p style={{ fontFamily: FF, fontSize: 14, color: C.sub, margin: 0 }}>
          Pick your favorite. You can add notes before approving.
        </p>
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: choices.length <= 3 ? `repeat(${choices.length}, 1fr)` : "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {choices.sort((a, b) => a.position - b.position).map((choice) => {
          const isActive = selected === choice.id;
          const isExpanded = expanded === choice.id;
          const label = ["A", "B", "C", "D"][choice.position] || String(choice.position + 1);

          return (
            <div key={choice.id} style={{
              background: isActive ? C.cardHover : C.card,
              border: `1.5px solid ${isActive ? C.borderActive : C.border}`,
              borderRadius: 14, padding: 0, cursor: "pointer",
              transition: "all 0.2s", position: "relative", overflow: "hidden",
            }}>
              {/* Image preview */}
              {choice.image_url ? (
                <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden" }}>
                  <img
                    src={choice.image_url}
                    alt={`Visual ${label}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  <div style={{
                    position: "absolute", top: 10, left: 10,
                    background: C.lime, color: C.dark, padding: "2px 8px",
                    fontSize: 10, fontWeight: 800, fontFamily: FF,
                  }}>
                    {label}
                  </div>
                </div>
              ) : choices.some((c) => c.image_url) || order.product === 'post_instagram' || order.product === 'carrossel' || order.product === 'ad_copy' ? (
                <div style={{
                  aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center",
                  background: `linear-gradient(135deg, ${C.card} 0%, ${C.cardHover} 100%)`,
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>◐</div>
                    <div style={{ fontFamily: FF, fontSize: 11, color: C.faint }}>Gerando imagem...</div>
                  </div>
                </div>
              ) : null}

              {/* Card header */}
              <div style={{ padding: "18px 20px 0" }}>
                <div style={{ fontFamily: FF, fontSize: 11, fontWeight: 700, color: C.lime, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                  Option {label}
                </div>
                <div style={{ fontFamily: FF, fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 12 }}>
                  {choice.label}
                </div>
              </div>

              {/* Preview */}
              <div style={{ padding: "0 20px", marginBottom: 12 }}>
                <pre style={{
                  fontFamily: FF, fontSize: 12, color: C.sub, lineHeight: 1.6,
                  whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
                  maxHeight: isExpanded ? "none" : 96, overflow: "hidden",
                }}>
                  {isExpanded ? getFullText(choice) : getPreview(choice)}
                </pre>
              </div>

              {/* Expand toggle */}
              <div style={{ padding: "0 20px 14px" }}>
                <button onClick={(e) => { e.stopPropagation(); setExpanded(isExpanded ? null : choice.id); }} style={{
                  fontFamily: FF, background: "none", border: "none", color: C.lime,
                  fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0,
                }}>
                  {isExpanded ? "Show less ↑" : "See full ↓"}
                </button>
              </div>

              {/* Select button */}
              <div style={{
                borderTop: `1px solid ${isActive ? C.borderActive : C.border}`,
                padding: "14px 20px", display: "flex", alignItems: "center", gap: 10,
              }} onClick={() => setSelected(choice.id)}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: `2px solid ${isActive ? C.lime : C.faint}`,
                  background: isActive ? C.lime : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s", flexShrink: 0,
                }}>
                  {isActive && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.dark }} />}
                </div>
                <span style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, color: isActive ? C.lime : C.faint }}>
                  {isActive ? "SELECTED" : "Select"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, color: C.sub, display: "block", marginBottom: 8 }}>
          Any adjustments? (optional)
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder='E.g. "Make the headline more direct" or "Change the CTA to something bolder"'
          rows={3}
          style={{
            fontFamily: FF, width: "100%", boxSizing: "border-box",
            background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10,
            padding: "12px 16px", fontSize: 13, color: C.white, resize: "vertical",
            outline: "none",
          }}
        />
      </div>

      {/* Approve button */}
      <button
        onClick={handleApprove}
        disabled={!selected || submitting}
        style={{
          fontFamily: FF, width: "100%",
          background: selected ? C.lime : "#333",
          color: selected ? C.dark : "#666",
          border: "none", borderRadius: 12, padding: "16px",
          fontSize: 15, fontWeight: 700,
          cursor: selected ? "pointer" : "not-allowed",
          transition: "all 0.2s",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? "Approving..." : "Approve and finalize →"}
      </button>
    </div>
  );
}
