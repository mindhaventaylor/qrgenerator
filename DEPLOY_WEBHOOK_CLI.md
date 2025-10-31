# Deploy Webhook Without Authentication - CLI Method

## What You Need to Do

**No code changes needed** - your function code is fine!  
**No SQL needed** - this is an infrastructure setting.

You need to **deploy the function via CLI** with the config file to disable authentication.

---

## Quick Steps

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login

```bash
supabase login
```

### 3. Link Project

```bash
cd /home/caio/development/sites/qrgenerator
supabase link --project-ref pstoxizwwgbpwrcdknto
```

### 4. Set Secrets

```bash
# Get your service_role key from: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api

supabase secrets set STRIPE_SECRET_KEY=<your_stripe_secret_key>
supabase secrets set STRIPE_WEBHOOK_SECRET=<your_webhook_secret>
supabase secrets set SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key_here>
```

### 5. Deploy Function

```bash
supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
```

The `config.toml` file we created will automatically disable auth for this function.

### 6. Update Stripe Webhook URL

Remove the `?apikey=` from your Stripe webhook URL:

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Update URL to: `https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/stripe-webhook`
3. Save

### 7. Test

Make a test payment - should work now!

---

## Files Created

✅ `supabase/config.toml` - Disables auth for stripe-webhook  
✅ `supabase/functions/stripe-webhook/.supabase/config.json` - Alternative config

Both config files work, but `config.toml` is the recommended approach.

---

## Why This Works

The `verify_jwt = false` setting in `config.toml` tells Supabase to skip authentication checks at the infrastructure level, allowing Stripe webhooks (which don't have Supabase auth headers) to reach your function code.

Your function code is secure because it still verifies the Stripe signature using `STRIPE_WEBHOOK_SECRET`.

