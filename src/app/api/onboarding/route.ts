import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://voku.one";

function emailWelcome(name: string): string {
  return `
<div style="font-family: 'Helvetica Neue', sans-serif; background: #FAF8F3; padding: 40px; max-width: 560px; margin: 0 auto;">
  <div style="background: #111; color: #C8F135; font-family: Georgia, serif; font-style: italic; font-size: 24px; padding: 8px 20px; border-radius: 8px; display: inline-block; margin-bottom: 24px;">Voku</div>
  <h1 style="color: #111; font-size: 22px; margin: 0 0 12px;">Oi ${name}! Bem-vindo à Voku.</h1>
  <p style="color: #3D3D3D; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
    Você acaba de entrar na plataforma de marketing com IA mais simples do Brasil. Seus 10 créditos grátis já estão disponíveis.
  </p>
  <div style="display: flex; gap: 12px; margin-bottom: 28px;">
    ${[
      { icon: "🖥️", title: "Landing Page", desc: "Página de vendas completa em minutos" },
      { icon: "📱", title: "Posts", desc: "12 posts prontos com legenda e hashtags" },
      { icon: "📣", title: "Copy de Ads", desc: "Anúncios para Meta em 3 variações" },
    ].map(c => `
      <div style="flex: 1; background: #FFFFFF; border: 1px solid #E8E5DE; border-radius: 12px; padding: 16px; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 8px;">${c.icon}</div>
        <div style="font-size: 13px; font-weight: 700; color: #111; margin-bottom: 4px;">${c.title}</div>
        <div style="font-size: 11px; color: #6B6B6B;">${c.desc}</div>
      </div>
    `).join("")}
  </div>
  <a href="${APP_URL}/cliente/pedidos" style="display: inline-block; background: #111; color: #C8F135; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none;">
    Criar meu primeiro projeto →
  </a>
  <p style="color: #A0A0A0; font-size: 12px; margin-top: 20px;">
    PS: Você tem 10 créditos grátis — suficiente para 1 post completo ou 2 copies de anúncio.
  </p>
  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #E8E5DE; color: #A0A0A0; font-size: 11px;">
    Voku LLC · Wyoming, USA · voku.one
  </div>
</div>`;
}

function emailTipDay1(name: string): string {
  return `
<div style="font-family: 'Helvetica Neue', sans-serif; background: #FAF8F3; padding: 40px; max-width: 560px; margin: 0 auto;">
  <div style="background: #111; color: #C8F135; font-family: Georgia, serif; font-style: italic; font-size: 24px; padding: 8px 20px; border-radius: 8px; display: inline-block; margin-bottom: 24px;">Voku</div>
  <h1 style="color: #111; font-size: 22px; margin: 0 0 12px;">A dica que muda tudo, ${name}.</h1>
  <p style="color: #3D3D3D; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
    Sabia que você pode pedir <strong>tudo</strong> pelo chat da Voku? É como ter um diretor de marketing disponível 24h.
  </p>
  <div style="background: #FFFFFF; border: 1px solid #E8E5DE; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <div style="font-size: 12px; color: #A0A0A0; margin-bottom: 8px;">Exemplo de conversa:</div>
    <div style="background: #111; color: #fff; padding: 8px 12px; border-radius: 12px 12px 4px 12px; font-size: 13px; display: inline-block; margin-bottom: 8px;">Preciso de 5 posts sobre nutrição esportiva para Instagram</div>
    <div style="background: #FAF8F3; color: #3D3D3D; padding: 8px 12px; border-radius: 4px 12px 12px 12px; font-size: 13px; display: inline-block;">Legal! Qual o tom da marca? Mais técnico ou mais acessível? 🤔</div>
  </div>
  <p style="color: #3D3D3D; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
    <strong>Dica de ouro:</strong> Quanto mais contexto você der sobre seu negócio, melhor a IA entrega. Conte sobre seu público, tom e objetivo.
  </p>
  <a href="${APP_URL}/cliente/pedidos" style="display: inline-block; background: #111; color: #C8F135; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none;">
    Testar agora →
  </a>
  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #E8E5DE; color: #A0A0A0; font-size: 11px;">Voku LLC · Wyoming, USA · voku.one</div>
</div>`;
}

function emailCaseDay3(name: string): string {
  return `
<div style="font-family: 'Helvetica Neue', sans-serif; background: #FAF8F3; padding: 40px; max-width: 560px; margin: 0 auto;">
  <div style="background: #111; color: #C8F135; font-family: Georgia, serif; font-style: italic; font-size: 24px; padding: 8px 20px; border-radius: 8px; display: inline-block; margin-bottom: 24px;">Voku</div>
  <h1 style="color: #111; font-size: 22px; margin: 0 0 12px;">Como a Clínica Vitale criou uma LP em 2 minutos</h1>
  <p style="color: #3D3D3D; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">Oi ${name}, quero te mostrar o que é possível com a Voku.</p>
  <div style="background: #FFFFFF; border: 1px solid #E8E5DE; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <div style="font-size: 13px; font-weight: 700; color: #B45309; margin-bottom: 12px;">❌ ANTES</div>
    <p style="font-size: 13px; color: #6B6B6B; line-height: 1.6; margin: 0 0 16px;">Gastava dias tentando criar conteúdo. Pagava R$2.500/mês para uma agência que entregava com atraso.</p>
    <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 12px;">✓ DEPOIS (com Voku)</div>
    <p style="font-size: 13px; color: #6B6B6B; line-height: 1.6; margin: 0;">3 landing pages criadas, 12 posts/mês, copy de anúncios em 3 variações. Economia de 8h semanais.</p>
  </div>
  <a href="${APP_URL}/cliente/pedidos" style="display: inline-block; background: #111; color: #C8F135; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none;">
    Ver meus projetos →
  </a>
  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #E8E5DE; color: #A0A0A0; font-size: 11px;">Voku LLC · Wyoming, USA · voku.one</div>
</div>`;
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, email, name } = await req.json();
    const firstName = name?.split(" ")[0] || "você";

    // Day 0 — Welcome (immediate)
    await resend.emails.send({
      from: "Voku <ola@voku.one>",
      to: email,
      subject: `Bem-vindo à Voku, ${firstName}! Seus 10 créditos estão esperando 🎉`,
      html: emailWelcome(firstName),
    });

    // Queue day 1 and day 3
    const now = new Date();
    const day1 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const day3 = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    await supabase.from("email_queue").insert([
      { user_id, email, name: firstName, template: "tip_day1", scheduled_for: day1.toISOString() },
      { user_id, email, name: firstName, template: "case_day3", scheduled_for: day3.toISOString() },
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Erro no onboarding" }, { status: 500 });
  }
}
