# Fix Webhook 401 Error - Summary

## The Problem

Your Stripe webhook is getting 401 "Missing authorization header" errors because Supabase Edge Functions require authentication by default, but Stripe webhooks don't send Supabase auth headers.

## The Solution

Deploy the webhook function with the `--no-verify-jwt` flag to disable authentication at the infrastructure level.

## Quick Deploy (3 Steps)

### 1. Login to Supabase
```bash
npx supabase login
```

### 2. Set Secrets (if not already set)
```bash
# Get your service_role key from: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api

npx supabase secrets set STRIPE_SECRET_KEY=<your_stripe_secret_key>
npx supabase secrets set STRIPE_WEBHOOK_SECRET=<your_webhook_secret>
npx supabase secrets set SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key_here>
```

### 3. Deploy with --no-verify-jwt Flag
```bash
npx supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
```

## Or Use the Script

```bash
cd /home/caio/development/sites/qrgenerator
./DEPLOY_NOW.sh
```

This script will guide you through all steps including login and deployment.

## After Deployment

1. **Update Stripe Webhook URL**: Remove any `?apikey=` parameters
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Update URL to: `https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/stripe-webhook`
   - Save

2. **Test**: Make a test payment and check that webhook events return 200 instead of 401

## Why This Works

The `--no-verify-jwt` flag tells Supabase to skip JWT authentication checks for this specific function, allowing Stripe webhooks (which don't have Supabase auth headers) to reach your function.

**Security is maintained** because:
- ✅ Your function code verifies Stripe signature using `STRIPE_WEBHOOK_SECRET`
- ✅ Only Stripe can send valid requests
- ✅ All webhook requests are logged

## Still Getting 401?

1. Check deployment was successful
2. Verify Stripe webhook URL doesn't have any query parameters
3. Make sure you used `--no-verify-jwt` flag during deployment
4. Check Supabase function logs for errors

## More Info

- Full deployment guide: `DEPLOY_STEPS.md`
- All secrets setup: `QUICK_SET_SECRETS.md`
- Troubleshooting: `QUICK_FIX_WEBHOOK.md`
