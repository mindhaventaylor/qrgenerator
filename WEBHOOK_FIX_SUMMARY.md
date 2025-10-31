# Webhook 401 Error - Fixed!

## Problem
Stripe webhooks were getting 401 "Missing authorization header" errors because Supabase Edge Functions require authentication by default, but Stripe doesn't send Supabase auth headers.

## Solution Applied
Added `--no-verify-jwt` flag to all deployment commands to disable JWT authentication for the webhook function.

## Files Updated

All documentation and scripts have been updated to include the `--no-verify-jwt` flag:

1. ✅ `DEPLOY_NOW.sh` - Main deployment script
2. ✅ `QUICK_SET_SECRETS.md` - Quick setup guide
3. ✅ `DEPLOY_STEPS.md` - Step-by-step deployment guide
4. ✅ `QUICK_FIX_WEBHOOK.md` - Quick fix guide
5. ✅ `MAKE_WEBHOOK_PUBLIC.md` - Detailed public webhook setup
6. ✅ `DEPLOY_WEBHOOK_CLI.md` - CLI deployment guide
7. ✅ `LOGIN_AND_DEPLOY.md` - Login and deploy guide
8. ✅ `INSTALL_AND_DEPLOY.md` - Full install and deploy guide
9. ✅ `STRIPE_SETUP.md` - Stripe integration setup
10. ✅ `DEPLOY_EDGE_FUNCTIONS.md` - Edge functions deployment
11. ✅ `set_secrets.sh` - Secrets setup script
12. ✅ `set_all_secrets.sh` - Full secrets setup script
13. ✅ `FIX_WEBHOOK_401.md` - New summary guide

## Next Steps to Deploy

You have two options:

### Option 1: Use the Script (Recommended)
```bash
cd /home/caio/development/sites/qrgenerator
./DEPLOY_NOW.sh
```

### Option 2: Manual Deployment
```bash
# 1. Login
npx supabase login

# 2. Link project
npx supabase link --project-ref pstoxizwwgbpwrcdknto

# 3. Set secrets (get keys from Supabase and Stripe dashboards)
npx supabase secrets set STRIPE_SECRET_KEY=<your_stripe_secret_key>
npx supabase secrets set STRIPE_WEBHOOK_SECRET=<your_webhook_secret>
npx supabase secrets set SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>

# 4. Deploy with --no-verify-jwt flag
npx supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
```

## After Deployment

1. **Update Stripe Webhook URL**: Remove any `?apikey=` parameters
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Update URL to: `https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/stripe-webhook`
   - Save

2. **Test**: Make a test payment and verify webhook events return 200 instead of 401

## Security Note

Making the webhook public is safe because:
- ✅ Stripe signs all webhook requests with `stripe-signature` header
- ✅ Your function code verifies this signature using `STRIPE_WEBHOOK_SECRET`
- ✅ Only Stripe can generate valid signatures
- ✅ All requests are logged for monitoring

## All Documentation

For more details, see:
- `FIX_WEBHOOK_401.md` - Quick summary
- `DEPLOY_STEPS.md` - Detailed deployment steps
- `QUICK_SET_SECRETS.md` - Secrets setup
- `QUICK_FIX_WEBHOOK.md` - Quick fix guide

