"use client";
const Footer = () => {
  return (
    <footer className="surface-dark py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-2 h-2 bg-accent rounded-sm" />
                <div className="w-2 h-2 bg-accent rounded-sm" />
                <div className="w-2 h-2 bg-accent rounded-sm" />
                <div className="w-2 h-2 bg-accent rounded-sm" />
              </div>
              <span className="text-surface-dark-foreground font-bold">VOKU</span>
            </div>
            <p className="text-xs text-surface-dark-foreground/40 leading-relaxed max-w-xs">
              Estúdio de mídia com IA. Conteúdo profissional
              para times que não podem esperar.
            </p>
          </div>

          {/* Produtos */}
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-surface-dark-foreground/40 mb-4 font-medium">Produtos</p>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-surface-dark-foreground/60 hover:text-surface-dark-foreground transition-colors">Landing Page Copy</a></li>
              <li><a href="#" className="text-sm text-surface-dark-foreground/60 hover:text-surface-dark-foreground transition-colors">Social Media Pack</a></li>
              <li><a href="#" className="text-sm text-surface-dark-foreground/60 hover:text-surface-dark-foreground transition-colors">Email Nurture</a></li>
            </ul>
          </div>

          {/* Estúdio */}
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-surface-dark-foreground/40 mb-4 font-medium">Estúdio</p>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-surface-dark-foreground/60 hover:text-surface-dark-foreground transition-colors">Conta Suabase</a></li>
              <li><a href="#" className="text-sm text-surface-dark-foreground/60 hover:text-surface-dark-foreground transition-colors">Área do Cliente</a></li>
              <li><a href="#" className="text-sm text-surface-dark-foreground/60 hover:text-surface-dark-foreground transition-colors">Workana · Fiverr</a></li>
            </ul>
          </div>

          {/* Empty or social */}
          <div />
        </div>

        <div className="border-t border-surface-dark-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-dark-foreground/30">
            Estúdio de Mídia com IA · EN · PT · ES · voku.one
          </p>
          <p className="text-xs text-surface-dark-foreground/30">
            voku.one © 2025
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
