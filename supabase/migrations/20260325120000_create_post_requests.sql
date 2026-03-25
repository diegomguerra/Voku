-- Tabela de rastreamento de geração de imagens
CREATE TABLE IF NOT EXISTS post_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  choice_id uuid REFERENCES choices(id) ON DELETE SET NULL,
  slug text NOT NULL,
  engine text NOT NULL,
  prompt_used text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'done', 'failed')),
  image_url text,
  storage_path text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_post_requests_order ON post_requests(order_id);
CREATE INDEX idx_post_requests_status ON post_requests(status);

-- Adicionar coluna image_url na tabela choices (para exibir no painel do cliente)
ALTER TABLE choices ADD COLUMN IF NOT EXISTS image_url text;

-- Bucket para imagens geradas (público para exibição no painel)
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: qualquer um pode ler imagens geradas (bucket público)
CREATE POLICY "generated-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated-images');

-- Policy: service role pode inserir/atualizar
CREATE POLICY "generated-images: service insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'generated-images');

CREATE POLICY "generated-images: service update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'generated-images');
