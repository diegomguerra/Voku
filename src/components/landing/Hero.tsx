"use client";


const Hero = () => {
  return (
    <section className="min-h-screen pt-20 grid grid-cols-1 lg:grid-cols-2">
      {/* Left - Light side */}
      <div className="flex flex-col justify-center px-8 md:px-16 lg:px-20 py-20">
        <p
          
          
          
          className="text-subheading mb-8 flex items-center gap-3"
        >
          <span className="w-8 h-px bg-muted-foreground" />
          ESTÚDIO DE MÍDIA · IA
        </p>

        <h1
          
          
          
          className="text-display"
        >
          SEU
          <br />
          <span className="text-foreground/30">CONTEÚDO</span>
          <br />
          <span className="font-black">PRONTO.</span>
        </h1>

        <div
          
          
          
          className="mt-12"
        >
          <div className="w-full h-px bg-border mb-8" />
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            Pacotes fixos. Preço visível. Entrega em até 48h. Sem
            reunião, sem proposta, sem surpresa.
          </p>
        </div>
      </div>

      {/* Right - Dark side */}
      <div className="surface-dark flex flex-col">
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-20">
          <p
            
            
            
            className="text-subheading text-surface-dark-foreground/50 mb-4"
          >
            BRIEFING PRONTO EM
          </p>
          <h2
            
            
            
            className="text-6xl md:text-8xl lg:text-9xl font-black text-accent leading-none"
          >
            minutos
          </h2>
          <p
            
            
            
            className="mt-6 text-sm text-surface-dark-foreground/50 max-w-sm"
          >
            Nossa IA organiza tudo. Você responde 2 perguntas.
          </p>
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
