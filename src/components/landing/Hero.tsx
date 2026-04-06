"use client";

import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="min-h-screen pt-20 grid grid-cols-1 lg:grid-cols-2">
      {/* Left - Light side */}
      <div className="flex flex-col justify-center px-8 md:px-16 lg:px-20 py-20">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-subheading mb-8 flex items-center gap-3"
        >
          <span className="w-8 h-px bg-muted-foreground" />
          ESTÚDIO DE MÍDIA · IA
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-display"
        >
          SEU
          <br />
          <span className="text-foreground/30">CONTEÚDO.</span>
          <br />
          <span className="font-black">PRONTO.</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <div className="w-full h-px bg-border mb-8" />
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            Pacotes fixos. Preço visível. Entrega em até 48h. Sem
            reunião, sem proposta, sem surpresa.
          </p>
        </motion.div>
      </div>

      {/* Right - Dark side */}
      <div className="surface-dark flex flex-col">
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-subheading text-surface-dark-foreground/50 mb-4"
          >
            BRIEFING PRONTO EM
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-6xl md:text-8xl lg:text-9xl font-black text-accent leading-none"
          >
            minutos
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-sm text-surface-dark-foreground/50 max-w-sm"
          >
            Nossa IA organiza tudo. Você responde 2 perguntas.
          </motion.p>
        </div>

        {/* Bottom green card */}
        <div className="surface-lime px-8 md:px-16 lg:px-20 py-12">
          <h3 className="text-lg md:text-xl font-bold leading-tight max-w-md mb-3">
            Parece escrito por alguém que conhece sua marca há anos.
          </h3>
          <p className="text-xs uppercase tracking-[0.15em] opacity-70 mb-8">
            SEM REUNIÃO · PREÇO FIXO · REVISÃO INCLUSA
          </p>
          <a href="#comecar" className="block w-full bg-foreground text-background text-center py-4 font-semibold text-sm hover:opacity-90 transition-opacity">
            Começar projeto →
          </a>
          <a href="#planos" className="block text-center mt-4 text-sm opacity-70 hover:opacity-100 transition-opacity">
            Ver planos ↓
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
