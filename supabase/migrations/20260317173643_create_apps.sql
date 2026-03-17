CREATE TABLE IF NOT EXISTS apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  descricao text NOT NULL,
  tipo text NOT NULL DEFAULT 'outro',
  html_path text NOT NULL,
  publico boolean DEFAULT false,
  titulo text,
  preview_descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS apps_user_id_idx ON apps(user_id);
CREATE INDEX IF NOT EXISTS apps_publico_idx ON apps(publico);
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apps: owner read/write" ON apps
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "apps: public read" ON apps
  FOR SELECT USING (publico = true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('apps', 'apps', true)
ON CONFLICT (id) DO NOTHING;
