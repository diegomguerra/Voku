CREATE TABLE IF NOT EXISTS editorial_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nicho text NOT NULL,
  objetivo text NOT NULL,
  tom text,
  pilares text[] DEFAULT '{}',
  posts jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE editorial_calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "editorial_calendars: owner only" ON editorial_calendars
  FOR ALL USING (auth.uid() = user_id);
