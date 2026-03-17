import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://voku.one";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function emailTipDay1(name: string): { subject: string; html: string } {
  return {
    subject: "A dica que vai fazer você criar 10x mais rápido 💡",
    html: `<div style="font-family:'Helvetica Neue',sans-serif;background:#FAF8F3;padding:40px;max-width:560px;margin:0 auto;">
      <div style="background:#111;color:#C8F135;font-family:Georgia,serif;font-style:italic;font-size:24px;padding:8px 20px;border-radius:8px;display:inline-block;margin-bottom:24px;">Voku</div>
      <h1 style="color:#111;font-size:22px;margin:0 0 12px;">A dica que muda tudo, ${name}.</h1>
      <p style="color:#3D3D3D;font-size:14px;line-height:1.7;margin:0 0 16px;">Sabia que você pode pedir <strong>tudo</strong> pelo chat da Voku? É como ter um diretor de marketing disponível 24h.</p>
      <p style="color:#3D3D3D;font-size:14px;line-height:1.7;margin:0 0 24px;"><strong>Dica de ouro:</strong> Quanto mais contexto você der sobre seu negócio, melhor a IA entrega.</p>
      <a href="${APP_URL}/cliente/pedidos" style="display:inline-block;background:#111;color:#C8F135;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;">Testar agora →</a>
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #E8E5DE;color:#A0A0A0;font-size:11px;">Voku LLC · Wyoming, USA · voku.one</div>
    </div>`,
  };
}

function emailCaseDay3(name: string): { subject: string; html: string } {
  return {
    subject: "Como a Clínica Vitale criou uma LP em 2 minutos com a Voku",
    html: `<div style="font-family:'Helvetica Neue',sans-serif;background:#FAF8F3;padding:40px;max-width:560px;margin:0 auto;">
      <div style="background:#111;color:#C8F135;font-family:Georgia,serif;font-style:italic;font-size:24px;padding:8px 20px;border-radius:8px;display:inline-block;margin-bottom:24px;">Voku</div>
      <h1 style="color:#111;font-size:22px;margin:0 0 12px;">Como a Clínica Vitale criou uma LP em 2 minutos</h1>
      <p style="color:#3D3D3D;font-size:14px;line-height:1.7;margin:0 0 20px;">Oi ${name}, quero te mostrar o que é possível com a Voku.</p>
      <div style="background:#fff;border:1px solid #E8E5DE;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:700;color:#B45309;margin-bottom:12px;">❌ ANTES</div>
        <p style="font-size:13px;color:#6B6B6B;line-height:1.6;margin:0 0 16px;">Gastava dias criando conteúdo. Pagava R$2.500/mês para uma agência.</p>
        <div style="font-size:13px;font-weight:700;color:#166534;margin-bottom:12px;">✓ DEPOIS (com Voku)</div>
        <p style="font-size:13px;color:#6B6B6B;line-height:1.6;margin:0;">3 LPs criadas, 12 posts/mês, economia de 8h semanais.</p>
      </div>
      <a href="${APP_URL}/cliente/pedidos" style="display:inline-block;background:#111;color:#C8F135;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;">Ver meus projetos →</a>
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #E8E5DE;color:#A0A0A0;font-size:11px;">Voku LLC · Wyoming, USA · voku.one</div>
    </div>`,
  };
}

const TEMPLATE_MAP: Record<string, (name: string) => { subject: string; html: string }> = {
  tip_day1: emailTipDay1,
  case_day3: emailCaseDay3,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Fetch pending emails
  const { data: pending } = await supabase
    .from("email_queue")
    .select("*")
    .eq("sent", false)
    .lte("scheduled_for", new Date().toISOString())
    .limit(50);

  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  let sent = 0;

  for (const item of pending) {
    const builder = TEMPLATE_MAP[item.template];
    if (!builder) continue;

    const { subject, html } = builder(item.name || "você");

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Voku <ola@voku.one>",
          to: item.email,
          subject,
          html,
        }),
      });

      await supabase
        .from("email_queue")
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq("id", item.id);

      sent++;
    } catch (e) {
      console.error(`Failed to send email ${item.id}:`, e);
    }
  }

  return new Response(JSON.stringify({ processed: sent }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
