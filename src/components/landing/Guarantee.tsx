"use client";

import { motion } from "framer-motion";

const Guarantee = () => {
  return (
    <section className="surface-lime py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-subheading text-accent-foreground/50 mb-4">GARANTIA</p>
          <h2 className="text-heading text-accent-foreground mb-6 max-w-2xl mx-auto">
            NÃO GOSTOU? REFAZEMOS.
          </h2>
          <p className="text-sm text-accent-foreground/70 max-w-md mx-auto mb-10">
            Cada projeto inclui revisão por padrão. Se o resultado não atende,
            refazemos sem custo extra e sem questionamento.
          </p>
          <a href="#comecar" className="inline-block bg-foreground text-background font-semibold py-4 px-10 text-sm hover:opacity-90 transition-opacity rounded-sm">
            Começar projeto →
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Guarantee;
