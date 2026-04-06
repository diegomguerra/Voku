"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-2.5 h-2.5 bg-accent rounded-sm" />
            <div className="w-2.5 h-2.5 bg-accent rounded-sm" />
            <div className="w-2.5 h-2.5 bg-accent rounded-sm" />
            <div className="w-2.5 h-2.5 bg-accent rounded-sm" />
          </div>
          <span className="text-lg font-bold tracking-tight">VOKU</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#servicos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Serviços</a>
          <a href="#processo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Processo</a>
          <a href="#sobre" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sobre</a>
          <div className="flex items-center gap-1 border border-border rounded-full overflow-hidden text-xs">
            <span className="bg-foreground text-background px-3 py-1.5 font-medium">PT</span>
            <span className="px-3 py-1.5 text-muted-foreground">EN</span>
            <span className="px-3 py-1.5 text-muted-foreground">ES</span>
          </div>
          <a href="#comecar" className="btn-outline text-xs py-2.5 px-5">Começar projeto</a>
        </div>

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-background border-t border-border px-6 py-6 flex flex-col gap-4">
          <a href="#servicos" className="text-sm" onClick={() => setIsOpen(false)}>Serviços</a>
          <a href="#processo" className="text-sm" onClick={() => setIsOpen(false)}>Processo</a>
          <a href="#sobre" className="text-sm" onClick={() => setIsOpen(false)}>Sobre</a>
          <a href="#comecar" className="btn-primary text-center text-xs" onClick={() => setIsOpen(false)}>Começar projeto</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
