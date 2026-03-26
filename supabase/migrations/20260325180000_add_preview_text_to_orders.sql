-- Add preview_text column to orders for content preview in client area
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preview_text TEXT;
