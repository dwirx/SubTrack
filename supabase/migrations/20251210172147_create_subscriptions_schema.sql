CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Entertainment', 'Productivity', 'Cloud', 'Gaming', 'Reading', 'Fitness', 'Other')),
  plan_name text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'IDR',
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'once')),
  start_date date NOT NULL,
  next_billing_date date,
  payment_method text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'cancelled')),
  auto_renew boolean DEFAULT true,
  notes text,
  is_shared boolean DEFAULT false,
  shared_with_count integer CHECK (shared_with_count > 0),
  paid_by_company boolean DEFAULT false,
  icon_emoji text,
  custom_data jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();;
