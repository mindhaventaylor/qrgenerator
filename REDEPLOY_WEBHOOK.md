# Redeploy Webhook Function - Debugging

## What Changed

I've added detailed logging and error handling to the stripe-webhook function to help diagnose why subscriptions aren't being created.

**Changes:**
1. ✅ Fixed: Changed `constructEvent` to `constructEventAsync` (async function for Deno)
2. ✅ Added: Detailed logging at each step
3. ✅ Added: Error handling for all database operations
4. ✅ Added: Logs showing success/failure messages

## Redeploy Now

```bash
# Make sure you're logged in and linked
npx supabase login
npx supabase link --project-ref pstoxizwwgbpwrcdknto

# Redeploy with no auth (required for Stripe webhooks)
npx supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
```

## After Redeploying

1. Make a test payment to trigger the webhook
2. Check the logs in Supabase Dashboard:
   - Go to: **Edge Functions** → **stripe-webhook** → **Logs**
   - Look for detailed messages showing what's happening

## What to Look For in Logs

You should see logs like:
```
Webhook received: POST https://...
Environment check: {...}
Signature present: true
Stripe webhook event: checkout.session.completed
Checking existing subscriptions for user: <user-id>
Existing subscriptions found: 0
Creating new subscription for user: <user-id>
Subscription created successfully: {...}
Creating payment record for user: <user-id>
Payment record created successfully
```

## If You See Errors

Common issues:

1. **"Failed to create subscription: ..."**
   - Check if the `stripe_subscription_id` and `stripe_customer_id` columns exist
   - Run the migration: `supabase/migrations/add_stripe_fields.sql`

2. **"No user ID in checkout session"**
   - The checkout session isn't being created with the user ID
   - Check the create-checkout function

3. **"Failed to check existing subscriptions"**
   - RLS policies might be too restrictive
   - Check that service_role can access subscriptions

## Quick Test

After redeploying, trigger a webhook from Stripe:
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select "checkout.session.completed"
5. Send the webhook
6. Check logs for any errors

## Verify Database Columns

Run this SQL in Supabase SQL Editor to check:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions';
```

You should see:
- stripe_subscription_id (text)
- stripe_customer_id (text)

If missing, run:
```sql
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
```

