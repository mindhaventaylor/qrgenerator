# Emergency Schema Fix

## The Problem

Supabase's API can't find the `plan_type` column even though it exists in the database. This is a schema cache issue.

## The Nuclear Option - Restart Everything

### Step 1: Run These SQL Commands in Supabase SQL Editor

```sql
-- First, check what columns actually exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;
```

### Step 2: If plan_type is missing, your table is broken

If plan_type doesn't show up, you need to recreate the table:

**⚠️ WARNING: This will delete all subscriptions data!**

```sql
-- Drop the table and recreate it properly
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Recreate subscriptions table
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
```

### Step 3: Restart Supabase Project

1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/general
2. Scroll down to "Restart project"
3. Click **"Restart project"**
4. Wait 1-2 minutes

### Step 4: Test Again

After restart, test the webhook again.

## Alternative: Check If Table Has Different Name

Run this to see all tables:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Maybe your table is named differently?

