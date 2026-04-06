"use client";
import { motion } from "framer-motion";
const showcaseReels = "/images/portfolio/showcase-reels-skincare.jpg";
const showcasePostFood = "/images/portfolio/showcase-post-food.jpg";
const showcaseLanding = "/images/portfolio/showcase-landing-fashion.jpg";
const showcaseCarousel = "/images/portfolio/showcase-carousel-fitness.jpg";
const showcaseStories = "/images/portfolio/showcase-stories-realestate.jpg";
const showcaseEmail = "/images/portfolio/showcase-email-beauty.jpg";
const interiorPost = "/images/portfolio/portfolio-interior-post.jpg";
const interiorLanding = "/images/portfolio/portfolio-interior-landing.jpg";

type ShowcaseItem = {
  type: string;
  niche: string;
  title: string;
  image: string;
  span: string;
};

const showcaseItems: ShowcaseItem[] = [
  {
    type: "REELS",
    niche: "SKINCARE",
    title: "Reels de produto com sérum anti-aging para marca de beleza.",
    image: showcaseReels,
    span: "md:col-span-1 md:row-span-2",
  },
  {
    type: "POST INSTAGRAM",
    niche: "GASTRONOMIA",
    title: "Post de feed para restaurante gourmet com fotografia de produto.",
    image: showcasePostFood,
    span: "md:col-span-1 md:row-span-1",
  },
  {
    type: "LANDING PAGE",
    niche: "MODA",
    title: "Landing page e-commerce para marca de streetwear.",
    image: showcaseLanding,
    span: "md:col-span-2 md:row-span-1",
  },
  {
    type: "CARROSSEL",
    niche: "FITNESS",
    title: "Carrossel educativo com dicas de treino para personal trainer.",
    image: showcaseCarousel,
    span: "md:col-span-1 md:row-span-1",
  },
  {
    type: "STORIES",
    niche: "IMOBILIÁRIO",
    title: "Stories de lançamento imobiliário com CTA de swipe up.",
    image: showcaseStories,
    span: "md:col-span-1 md:row-span-2",
  },
  {
    type: "EMAIL MARKETING",
    niche: "BELEZA",
    title: "Newsletter de lançamento para marca premium de skincare.",
    image: showcaseEmail,
    span: "md:col-span-1 md:row-span-1",
  },
  {
    type: "POST INSTAGRAM",
    niche: "ARQUITETURA",
    title: "Post de feed para estúdio de design de interiores corporativo.",
    image: interiorPost,
    span: "md:col-span-1 md:row-span-1",
  },
  {
    type: "LANDING PAGE",
    niche: "INTERIORES",
    title: "Landing page para captação de leads no segmento corporativo.",
    image: interiorLanding,
    span: "md:col-span-2 md:row-span-1",
  },
];

const contentTypes = ["Posts", "Reels", "Stories", "Carrosséis", "Landing Pages", "E-mails"];

const Portfolio = () => {
  return (
    <section id="portfolio" className="py-24 px-6 md:px-16 lg:px-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <p className="text-subheading mb-4">O QUE CRIAMOS</p>
        <h2 className="text-heading max-w-4xl">
          CONTEÚDO QUE VENDE. PARA QUALQUER SEGMENTO.
        </h2>
        <p className="text-sm text-muted-foreground mt-4 max-w-xl">
          Da ideia ao post pronto. Criamos peças visuais com IA — revisadas por humanos — que funcionam em qualquer plataforma e nicho.
        </p>

        {/* Content type pills */}
        <div className="flex flex-wrap gap-2 mt-6">
          {contentTypes.map((type) => (
            <span
              key={type}
              className="text-[10px] uppercase tracking-wider font-semibold border border-border text-muted-foreground px-3 py-1.5 rounded-full"
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Showcase grid */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 auto-rows-[260px] gap-3"
      >
        {showcaseItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className={`${item.span} relative rounded-lg overflow-hidden group cursor-pointer`}
          >
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              width={864}
              height={1080}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Badges always visible */}
            <div className="absolute top-3 left-3 z-10 flex gap-1.5">
              <span className="text-[10px] bg-accent text-accent-foreground px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                {item.type}
              </span>
              <span className="text-[10px] bg-foreground/80 text-background px-2.5 py-1 rounded-full font-medium uppercase tracking-wider">
                {item.niche}
              </span>
            </div>

            {/* Text on hover */}
            <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-10">
              <h3 className="text-sm md:text-base font-bold leading-tight text-background">
                {item.title}
              </h3>
            </div>

            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent pointer-events-none" />
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom CTA */}
      <div className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <p className="text-xs text-muted-foreground">
            Gerado com <span className="text-foreground font-medium">Fal.ai</span> + <span className="text-foreground font-medium">Ideogram</span> · Revisado pela equipe VOKU
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Isto é apenas uma amostra. Criamos conteúdo sob medida para <span className="text-foreground font-medium">qualquer segmento</span>.
          </p>
        </div>
        <a
          href="#comecar"
          className="inline-flex items-center gap-2 bg-foreground text-background text-xs font-semibold px-6 py-3 rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-300 shrink-0"
        >
          Quero conteúdo assim
          <span>→</span>
        </a>
      </div>
    </section>
  );
};

export default Portfolio;
