"use client";


import { ArrowRight } from "lucide-react";

const plans = [
  {
    name: "STARTER",
    price: "R$149",
    period: "/mês",
    credits: "100 créditos/mês",
    href: "https://buy.stripe.com/fZu7sE33MgDL7Zu1324gg06",
    features: [
      "Landing pages, posts e e-mails",
      "Revisão inclusa em todos os projetos",
      "Área do cliente com aprovação",
      "Entrega em 24-48h",
    ],
    highlighted: false,
  },
  {
    name: "PRO",
    price: "R$397",
    period: "/mês",
    credits: "300 créditos/mês",
    href: "https://buy.stripe.com/bJe14g47Q73bfrW6nm4gg0a",
    features: [
      "Landing pages, posts e e-mails",
      "Revisão inclusa em todos os projetos",
      "Área do cliente com aprovação",
      "Entrega em 24-48h",
      "Suporte prioritário por e-mail",
    ],
    highlighted: false,
  },
  {
    name: "BUSINESS",
    price: "R$897",
    period: "/mês",
    credits: "500 créditos/mês",
    href: "https://buy.stripe.com/6oUfZa7k20ENcfKcLK4gg07",
    features: [
      "Landing pages, posts e e-mails",
      "Revisão inclusa em todos os projetos",
      "Área do cliente com aprovação",
      "Volante para múltiplos projetos",
      "Cota para portfolios exclusivos",
      "Prioridade máxima de entrega",
    ],
    highlighted: true,
  },
  {
    name: "ENTERPRISE",
    price: "R$1.997",
    period: "/mês",
    credits: "2.000 créditos/mês",
    href: "https://buy.stripe.com/5kQcMY6fYdrz4Ni7rq4gg09",
    features: [
      "Landing pages, posts e e-mails",
      "Revisão inclusa em todos os projetos",
      "Área do cliente com aprovação",
      "Volante para múltiplos projetos",
      "Onboarding dedicado",
      "SLA garantido",
    ],
    highlighted: false,
  },
];

const creditPacks = [
  { credits: 50, price: "R$49", href: "https://buy.stripe.com/eVq8wI33M87fcfKfXW4gg01" },
  { credits: 200, price: "R$149", href: "https://buy.stripe.com/8x200ceMugDLenSaDC4gg08" },
  { credits: 500, price: "R$297", href: "https://buy.stripe.com/6oU9AMdIq1IRgw02764gg02" },
];

const Pricing = () => {
  return (
    <section id="planos" className="py-24 px-6 md:px-16 lg:px-20 max-w-7xl mx-auto">
      <p className="text-subheading mb-4">PLANOS</p>
      <h2 className="text-heading mb-4">ESCOLHA. COMECE. CRIE.</h2>
      <p className="text-sm text-muted-foreground mb-12 max-w-lg">
        Créditos mensais para gerar copy, posts e e-mails com a identidade da sua marca. Sem
        contrato longo. Cancele quando quiser.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
        {plans.map((plan, i) => (
          <div
            key={plan.name}
            
            
            
            
            className={`p-6 rounded-sm border flex flex-col ${
              plan.highlighted
                ? "surface-lime border-accent"
                : "bg-background border-border"
            }`}
          >
            <p className={`text-subheading mb-2 ${plan.highlighted ? "text-accent-foreground/60" : ""}`}>
              {plan.name}
            </p>
            <div className="mb-1">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className={`text-sm ${plan.highlighted ? "text-accent-foreground/60" : "text-muted-foreground"}`}>
                {plan.period}
              </span>
            </div>
            <p className={`text-xs mb-6 ${plan.highlighted ? "text-accent-foreground/60" : "text-muted-foreground"}`}>
              {plan.credits}
            </p>

            <ul className="flex-1 space-y-2 mb-8">
              {plan.features.map((f) => (
                <li key={f} className={`text-xs leading-relaxed ${plan.highlighted ? "text-accent-foreground/80" : "text-muted-foreground"}`}>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={plan.href}
              className={`flex items-center gap-1 text-xs font-semibold group ${
                plan.highlighted ? "text-accent-foreground" : "text-foreground"
              }`}
            >
              Começar agora
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        ))}
      </div>

      {/* Credit packs */}
      <div className="border-t border-border pt-12">
        <h3 className="text-lg font-bold mb-2">PRECISA DE MAIS?</h3>
        <p className="text-sm text-muted-foreground mb-8">
          Compre créditos avulsos sem alterar seu plano. Pagamento único.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {creditPacks.map((pack) => (
            <div key={pack.credits} className="border border-border p-6 rounded-sm">
              <p className="text-3xl font-bold mb-1">{pack.credits}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">CRÉDITOS</p>
              <p className="text-2xl font-bold mb-4">{pack.price}</p>
              <a href={pack.href} className="flex items-center gap-1 text-xs font-semibold group">
                COMPRAR
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
