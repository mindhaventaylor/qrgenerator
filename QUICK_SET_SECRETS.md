# Quick: Set All Secrets

## What You Need

1. ✅ Supabase CLI installed (you have it via `npx`)
2. ✅ Logged in: `npx supabase login` (do this first if you haven't)
3. ✅ Project linked: `npx supabase link --project-ref pstoxizwwgbpwrcdknto`
4. ✅ Your service_role key from: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api

## Option 1: Use the Script (Easiest)

```bash
cd /home/caio/development/sites/qrgenerator
./set_all_secrets.sh
```

The script will:
- Ask for your service_role key
- Set all 4 secrets automatically:
  - ✅ STRIPE_SECRET_KEY
  - ✅ STRIPE_WEBHOOK_SECRET
  - ✅ SUPABASE_URL
  - ✅ SUPABASE_SERVICE_ROLE_KEY

## Option 2: Manual Commands

If you prefer to run commands manually:

```bash
# Get your keys from:
# - Stripe Dashboard: https://dashboard.stripe.com/test/apikeys
# - Supabase Dashboard: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api
# Then run these (replace with your actual keys):

npx supabase secrets set STRIPE_SECRET_KEY=<YOUR_STRIPE_SECRET_KEY>

npx supabase secrets set STRIPE_WEBHOOK_SECRET=<YOUR_WEBHOOK_SECRET>

npx supabase secrets set SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co

npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY>
```

## After Setting Secrets

Deploy the function:
```bash
npx supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
```

## Secrets Summary

These are the 4 secrets your Edge Functions need:

1. **STRIPE_SECRET_KEY** - Your Stripe secret key (test mode)
2. **STRIPE_WEBHOOK_SECRET** - Your Stripe webhook signing secret
3. **SUPABASE_URL** - Your Supabase project URL
4. **SUPABASE_SERVICE_ROLE_KEY** - Your Supabase service_role key (secret)

All are already in the script except the service_role key (which you need to get from Supabase Dashboard).

