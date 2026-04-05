-- Add per-post images column to choices
ALTER TABLE choices ADD COLUMN IF NOT EXISTS post_images jsonb DEFAULT '{}';

-- Extend brand_contexts with visual identity fields
ALTER TABLE brand_contexts ADD COLUMN IF NOT EXISTS cor_primaria text;
ALTER TABLE brand_contexts ADD COLUMN IF NOT EXISTS cor_secundaria text;
ALTER TABLE brand_contexts ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE brand_contexts ADD COLUMN IF NOT EXISTS estilo_visual text;
ALTER TABLE brand_contexts ADD COLUMN IF NOT EXISTS visao_imagem_padrao text;
ALTER TABLE brand_contexts ADD COLUMN IF NOT EXISTS fonte_preferida text;
ALTER TABLE brand_contexts ADD COLUMN IF NOT EXISTS preferred_tone text;
ALTER TABLE brand_contexts ADD COLUMN IF NOT EXISTS last_approved_style jsonb;
