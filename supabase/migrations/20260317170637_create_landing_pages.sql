CREATE TABLE IF NOT EXISTS landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  design text DEFAULT 'minimal',
  html_path text NOT NULL,
  published boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "landing_pages: owner only" ON landing_pages
  FOR ALL USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-pages', 'landing-pages', true)
ON CONFLICT (id) DO NOTHING;
