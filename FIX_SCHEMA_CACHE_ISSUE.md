# Fix Schema Cache Issue

## The Problem

Supabase error: "Could not find the 'plan_type' column of 'subscriptions' in the schema cache"

This means the database columns exist but Supabase hasn't refreshed its schema cache.

## The Fix

Run these SQL commands in Supabase SQL Editor:

### Step 1: Verify Columns Exist

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;
```

You should see all these columns:
- id
- user_id
- plan_type
- status
- trial_end_date
- current_period_start
- current_period_end
- cancel_at_period_end
- created_at
- updated_at
- stripe_subscription_id
- stripe_customer_id

### Step 2: If Stripe Columns Are Missing

Run the migration:

```sql
-- Add Stripe-related columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
```

### Step 3: Refresh Supabase API Cache

This is the key fix - run this to refresh Supabase's schema cache:

```sql
NOTIFY pgrst, 'reload schema';
```

### Step 4: If NOTIFY Doesn't Work

Sometimes you need to restart the API:

1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api
2. Click **"Restart Project"** (under "Infrastructure")
3. Wait 30 seconds for it to restart

## After Fixing

Redeploy the webhook and test again:

```bash
npx supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
```

## Quick Copy-Paste Fix

Just run this in Supabase SQL Editor:

```sql
-- Add Stripe columns if missing
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
```

