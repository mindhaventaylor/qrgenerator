# Login and Deploy - Step by Step

## Step 1: Login to Supabase

Run this command in your terminal:
```bash
npx supabase login
```

This will:
1. Open your browser
2. Ask you to log in to Supabase
3. Ask you to authorize the CLI
4. Return to the terminal with a success message

## Step 2: Link Your Project

After login succeeds, run:
```bash
cd /home/caio/development/sites/qrgenerator
npx supabase link --project-ref pstoxizwwgbpwrcdknto
```

## Step 3: Get Your Service Role Key

1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api
2. Find **"service_role"** key (the secret one, not anon)
3. Copy it

## Step 4: Set All Secrets

Get your keys:
- Stripe keys from: https://dashboard.stripe.com/test/apikeys
- Service role key from: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api

Run these commands (replace with your actual keys):

```bash
npx supabase secrets set STRIPE_SECRET_KEY=<your_stripe_secret_key>

npx supabase secrets set STRIPE_WEBHOOK_SECRET=<your_webhook_secret>

npx supabase secrets set SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co

npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY>
```

## Step 5: Deploy the Function

```bash
npx supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
```

You should see a success message!

## Step 6: Update Stripe Webhook

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click your webhook endpoint
3. Update URL to (remove `?apikey=` if present):
   ```
   https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/stripe-webhook
   ```
4. Save

## Step 7: Test

Make a test payment - the 401 error should be gone!

