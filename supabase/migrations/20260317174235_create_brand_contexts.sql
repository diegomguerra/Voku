CREATE TABLE IF NOT EXISTS brand_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nome_marca text,
  tom text,
  personalidade text,
  palavras_chave text[],
  palavras_proibidas text[],
  exemplos_conteudo text,
  arquivos_path text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE brand_contexts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brand_contexts: owner only" ON brand_contexts
  FOR ALL USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', false)
ON CONFLICT (id) DO NOTHING;
