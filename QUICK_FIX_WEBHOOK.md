# Quick Fix: Webhook 401 Error

## Problem
Supabase requires auth headers, but Stripe doesn't send them.

## Quick Fix (Temporary - For Testing)

### Step 1: Get Your Anon Key
1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api
2. Copy the **anon public** key (not service_role)

### Step 2: Update Stripe Webhook URL
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Click **"Update"** or **"Settings"**
4. Change the endpoint URL from:
   ```
   https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/stripe-webhook
   ```
   To:
   ```
   https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/stripe-webhook?apikey=YOUR_ANON_KEY_HERE
   ```
   Replace `YOUR_ANON_KEY_HERE` with your actual anon key.

5. Click **Save**

### Step 3: Test
- Make a test payment
- Check Stripe webhook events - should show 200 instead of 401

## Permanent Fix (Recommended)

Deploy with `--no-verify-jwt` flag to disable auth for webhooks:

```bash
npx supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
```

This allows Stripe webhooks (which don't send Supabase auth headers) to reach your function. Security is maintained through Stripe's webhook signature verification.

See `DEPLOY_STEPS.md` for full deployment instructions.

