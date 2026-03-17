-- Affiliates
CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  codigo text NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  total_indicados integer DEFAULT 0,
  total_ganho_creditos integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliates: owner only" ON affiliates FOR ALL USING (auth.uid() = user_id);

-- Affiliate referrals
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan_purchased text,
  creditos_gerados integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals: affiliate owner" ON affiliate_referrals
  FOR ALL USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- Referral tracking on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by text;

-- Email queue for onboarding
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  template text NOT NULL CHECK (template IN ('welcome', 'tip_day1', 'case_day3')),
  scheduled_for timestamptz NOT NULL,
  sent boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_queue_pending_idx ON email_queue(sent, scheduled_for);
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_queue: service only" ON email_queue FOR ALL USING (false);
