-- Vitrine items
CREATE TABLE IF NOT EXISTS vitrine_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('landing_page', 'copy', 'post', 'carrossel', 'email', 'app', 'reels')),
  titulo text NOT NULL,
  descricao text,
  nicho text,
  formato text,
  conteudo_preview text,
  url_publica text,
  credits_bonus_paid boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vitrine_items_tipo_idx ON vitrine_items(tipo);
CREATE INDEX IF NOT EXISTS vitrine_items_nicho_idx ON vitrine_items(nicho);
ALTER TABLE vitrine_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vitrine_items: public read" ON vitrine_items FOR SELECT USING (true);
CREATE POLICY "vitrine_items: owner write" ON vitrine_items FOR ALL USING (auth.uid() = user_id);

-- Marketplace templates
CREATE TABLE IF NOT EXISTS marketplace_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text NOT NULL,
  tipo text NOT NULL,
  nicho text,
  conteudo jsonb NOT NULL,
  preco_creditos integer NOT NULL DEFAULT 10,
  vendas integer DEFAULT 0,
  aprovado boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS marketplace_templates_tipo_idx ON marketplace_templates(tipo);
CREATE INDEX IF NOT EXISTS marketplace_templates_aprovado_idx ON marketplace_templates(aprovado);
ALTER TABLE marketplace_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketplace: public read approved" ON marketplace_templates FOR SELECT USING (aprovado = true);
CREATE POLICY "marketplace: owner write" ON marketplace_templates FOR ALL USING (auth.uid() = user_id);

-- Marketplace purchases
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES marketplace_templates(id) ON DELETE CASCADE,
  preco_creditos integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(buyer_user_id, template_id)
);
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases: owner only" ON marketplace_purchases FOR ALL USING (auth.uid() = buyer_user_id);
