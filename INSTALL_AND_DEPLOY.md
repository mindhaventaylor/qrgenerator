# Install Supabase CLI and Deploy Webhook

## Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

If you get permission errors, try:
```bash
sudo npm install -g supabase
```

## Step 2: Login

```bash
supabase login
```

This will open a browser window for authentication.

## Step 3: Link Your Project

```bash
cd /home/caio/development/sites/qrgenerator
supabase link --project-ref pstoxizwwgbpwrcdknto
```

## Step 4: Set Secrets

You need your **service_role** key:
1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api
2. Copy the **service_role** key (the secret one)

Then run:
```bash
# Get your Stripe keys from: https://dashboard.stripe.com/test/apikeys
supabase secrets set STRIPE_SECRET_KEY=<your_stripe_secret_key>
supabase secrets set STRIPE_WEBHOOK_SECRET=<your_webhook_secret>
supabase secrets set SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<paste_your_service_role_key_here>
```

## Step 5: Deploy Function

```bash
supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
```

This will deploy the function without authentication required.

## Step 6: Update Stripe Webhook URL

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click your webhook endpoint
3. Update URL to (remove any query parameters):
   ```
   https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/stripe-webhook
   ```
4. Save

## Step 7: Test

Make a test payment - should work now!

---

## Troubleshooting

### "Permission denied" when installing CLI
```bash
sudo npm install -g supabase
```

### "Command not found" after install
```bash
# Check if npm global bin is in PATH
echo $PATH | grep npm

# Or use npx
npx supabase login
```

### Config file not working
Make sure the file is named exactly:
- `supabase/functions/stripe-webhook/supabase.functions.config.json`
- NOT `.supabase/config.json` (that's for different config)

