"use client";

const items = [
  "REVISÃO INCLUSA",
  "PREÇO FIXO EM BRL",
  "ENTREGA GARANTIDA",
  "ÁREA DO CLIENTE",
  "BRIEFING EM MINUTOS",
  "ESTÚDIO DE MÍDIA · IA",
  "LANDING PAGE COPY",
  "SOCIAL MEDIA PACK",
  "EMAIL NURTURE",
  "SEM REUNIÃO",
];

const Marquee = () => {
  const repeated = [...items, ...items];

  return (
    <div className="surface-dark py-3 overflow-hidden border-y border-accent/30">
      <div className="animate-marquee flex whitespace-nowrap">
        {repeated.map((item, i) => (
          <span key={i} className="text-accent text-xs uppercase tracking-[0.15em] font-medium mx-6 flex items-center gap-6">
            {item}
            <span className="text-accent/40">·</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
