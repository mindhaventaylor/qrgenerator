# Checking Subscription Status After Payment

If you're seeing "Subscription Required" after paying, here's how to verify and fix it:

## Quick Check Steps

### 1. Check Supabase Database

1. Go to Supabase Dashboard → Table Editor
2. Open the `subscriptions` table
3. Find your user's subscription (by `user_id`)
4. Check:
   - Does the record exist?
   - What is the `status` field? (should be `'active'`)
   - Is `stripe_subscription_id` set?

### 2. Check Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/payments
2. Find your recent payment
3. Check if it's completed
4. Go to Subscriptions tab
5. Verify the subscription exists and is active

### 3. Check Webhook Events

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Check "Recent events"
4. Look for:
   - `checkout.session.completed` - should be successful
   - `invoice.payment_succeeded` - should be successful

### 4. Check Webhook Logs in Supabase

1. Go to Supabase Dashboard → Edge Functions
2. Click on `stripe-webhook` function
3. Go to "Logs" tab
4. Check for:
   - Successful webhook events
   - Any errors processing the webhook

## Manual Fix (If Webhook Didn't Fire)

If the payment succeeded but webhook didn't run, you can manually update the subscription:

### Option 1: Via Supabase Dashboard

1. Go to Table Editor → `subscriptions`
2. Find or create a record for your user
3. Set:
   - `user_id`: Your user UUID
   - `plan_type`: `'monthly'`
   - `status`: `'active'`
   - `current_period_start`: Current date
   - `current_period_end`: Date one month from now

### Option 2: Via SQL

```sql
-- Update existing subscription
UPDATE subscriptions
SET 
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month',
  plan_type = 'monthly'
WHERE user_id = 'your-user-id-here';

-- Or create new if doesn't exist
INSERT INTO subscriptions (user_id, plan_type, status, current_period_start, current_period_end)
VALUES (
  'your-user-id-here',
  'monthly',
  'active',
  NOW(),
  NOW() + INTERVAL '1 month'
)
ON CONFLICT (user_id) DO UPDATE
SET status = 'active', current_period_start = NOW(), current_period_end = NOW() + INTERVAL '1 month';
```

## Verify Webhook is Set Up

1. **Check webhook URL:**
   - Should be: `https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/stripe-webhook`
   - Verify in Stripe Dashboard → Webhooks

2. **Check webhook secret:**
   - Go to Supabase → Edge Functions → Manage secrets
   - Verify `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe

3. **Test webhook:**
   - In Stripe Dashboard → Webhooks → Your endpoint
   - Click "Send test webhook"
   - Choose `checkout.session.completed`
   - Check Supabase logs to see if it's received

## Common Issues

### Issue: Payment succeeded but no subscription record
- **Cause:** Webhook didn't fire or failed
- **Fix:** Check webhook configuration and logs

### Issue: Subscription exists but status is not 'active'
- **Cause:** Webhook didn't update status
- **Fix:** Manually update via SQL or dashboard

### Issue: Webhook errors in logs
- **Cause:** Missing environment variables or database permissions
- **Fix:** Check Edge Function secrets and RLS policies

## After Manual Fix

1. Refresh your browser
2. The app should now recognize your active subscription
3. You should be able to create QR codes

## Testing Subscription Check

You can test if the subscription check works by:
1. Opening browser console (F12)
2. Typing: `supabase.from('subscriptions').select('*').eq('user_id', 'your-user-id').single()`
3. Check what it returns

