# Deploy Webhook Function - Quick Steps

## The Problem
Supabase is rejecting Stripe webhooks with 401 because auth is required. We need to deploy the function via CLI with `auth: false`.

## Solution (3 Steps)

### ✅ File Created
I've created: `supabase/functions/stripe-webhook/supabase.functions.config.json` with `{"auth": false}`

This file will disable authentication when deployed via CLI.

---

## Option 1: Run the Script (Easiest)

```bash
cd /home/caio/development/sites/qrgenerator
./DEPLOY_NOW.sh
```

The script will guide you through:
- Login to Supabase
- Link your project
- Set all secrets
- Deploy the function

---

## Option 2: Manual Commands

### Step 1: Login
```bash
npx supabase login
```

### Step 2: Link Project
```bash
cd /home/caio/development/sites/qrgenerator
npx supabase link --project-ref pstoxizwwgbpwrcdknto
```

### Step 3: Set Secrets

**Get your service_role key:**
1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api
2. Copy the **service_role** key (the secret one)

**Set all secrets:**
```bash
npx supabase secrets set STRIPE_SECRET_KEY=<your_stripe_secret_key>

npx supabase secrets set STRIPE_WEBHOOK_SECRET=<your_webhook_secret>

npx supabase secrets set SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co

npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<paste_your_service_role_key_here>
```

### Step 4: Deploy
```bash
npx supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
```

---

## After Deployment

### Update Stripe Webhook URL

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. Update URL to (remove `?apikey=` if present):
   ```
   https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/stripe-webhook
   ```
4. Save

### Test

Make a test payment - the 401 error should be gone!

---

## Why This Works

The `--no-verify-jwt` flag tells Supabase to skip JWT authentication checks for this function. This allows Stripe webhooks (which don't have Supabase auth headers) to reach your function.

**Note:** We're using the CLI flag rather than the config file for more reliable deployment.

Your function is still secure because:
- ✅ It verifies Stripe signature using `STRIPE_WEBHOOK_SECRET`
- ✅ Only Stripe can send valid requests
- ✅ All requests are logged

---

## Troubleshooting

### "Not logged in"
Run: `npx supabase login`

### "Project not linked"
Run: `npx supabase link --project-ref pstoxizwwgbpwrcdknto`

### Still getting 401 after deployment
1. Check deployment was successful: `npx supabase functions list --project-ref pstoxizwwgbpwrcdknto`
2. Verify config file exists: `cat supabase/functions/stripe-webhook/supabase.functions.config.json`
3. Try redeploying with --no-verify-jwt: `npx supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt`

