-- RECREATE SUBSCRIPTIONS TABLE WITH ALL COLUMNS
-- WARNING: This deletes all subscription data!

-- Drop everything related to subscriptions
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Recreate subscriptions table with all columns
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'quarterly', 'annually')),
    status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'trial', 'expired', 'cancelled')),
    trial_end_date TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- Re-enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can insert subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the table was created
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

