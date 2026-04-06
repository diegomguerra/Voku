"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "24h", label: "Landing Page" },
  { value: "48h", label: "Social Pack" },
  { value: "100%", label: "Revisão inclusa" },
];

const steps = [
  {
    number: "01",
    title: "Cole o @ ou o link",
    description: "Nossa IA já conhece sua marca antes de começar.",
  },
  {
    number: "02",
    title: "2 perguntas. Briefing feito.",
    description: "Nada de formulário longo. Conversa direta, conteúdo completo.",
  },
  {
    number: "03",
    title: "Receba as opções",
    description: "Você escolhe, faz a aprova — não recebe arquivo final sem ver antes.",
  },
  {
    number: "04",
    title: "Aprovado. Entregue.",
    description: "Download do arquivo final. Pronto para publicar.",
  },
];

const Process = () => {
  return (
    <section id="processo" className="surface-dark py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left */}
          <div>
            <p className="text-subheading text-surface-dark-foreground/40 mb-4">PROCESSO</p>
            <h2 className="text-heading text-surface-dark-foreground mb-8">
              DO ZERO AO PRONTO.
            </h2>
            <p className="text-sm text-surface-dark-foreground/50 mb-12 max-w-sm">
              Sem formulário longo. Sem reunião. Conversa direta com IA que já conhece sua
              marca.
            </p>

            <div className="flex gap-8">
              {stats.map((stat) => (
                <div key={stat.value}>
                  <p className="text-3xl md:text-4xl font-bold text-accent">{stat.value}</p>
                  <p className="text-xs text-surface-dark-foreground/40 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Steps */}
          <div className="space-y-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border-t border-surface-dark-foreground/10 pt-6"
              >
                <p className="text-xs text-accent font-bold mb-2">{step.number}</p>
                <h3 className="text-lg font-bold text-surface-dark-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-surface-dark-foreground/50">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;
