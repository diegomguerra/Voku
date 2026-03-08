import { PRODUCTS } from '@/lib/products'

export default function Home() {
  const products = Object.values(PRODUCTS)

  return (
    <main className="min-h-screen bg-voku-bg text-voku-text">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        <div className="text-voku-accent text-xl font-bold tracking-wider mb-8">
          ✦ VOKU
        </div>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          Marketing assets,<br />
          <span className="text-voku-accent">delivered fast.</span>
        </h1>
        <p className="text-voku-muted text-lg leading-relaxed max-w-xl mb-10">
          Landing page copy, content packs e sequências de e-mail criados com IA
          e revisados por especialistas. Entregue em 24–48h.
        </p>
        <a
          href="#products"
          className="inline-block bg-voku-accent text-voku-bg font-bold text-sm px-8 py-4 rounded-lg hover:opacity-90 transition-opacity"
        >
          Ver produtos →
        </a>
      </section>

      {/* Products */}
      <section id="products" className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-sm text-voku-muted tracking-widest uppercase mb-8">
          Produtos
        </h2>
        <div className="grid gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-voku-surface border border-voku-border rounded-xl p-8"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                  <p className="text-voku-muted text-sm">{product.description}</p>
                </div>
                <div className="text-right shrink-0 ml-6">
                  <div className="text-voku-accent font-bold text-2xl">
                    ${product.usd}
                  </div>
                  <div className="text-voku-muted text-xs mt-1">
                    ou R${product.brl}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-voku-border">
                <span className="text-xs text-voku-muted">
                  Entrega em {product.deadline_hours}h
                </span>
                <span className="text-xs text-voku-muted">·</span>
                <span className="text-xs text-voku-muted">
                  Formatos: {product.output_formats.join(', ').toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-voku-border py-8">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between text-xs text-voku-muted">
          <span>✦ Voku LLC · Wyoming, USA</span>
          <span>voku.one</span>
        </div>
      </footer>
    </main>
  )
}
