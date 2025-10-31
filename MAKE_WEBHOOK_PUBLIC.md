# Make Webhook Function Public (Fix 401 Error)

## The Problem

Supabase Edge Functions require authentication by default. Stripe webhooks don't send Supabase auth headers, causing 401 errors.

## Solution: Disable Authentication for Webhook Function

You have **two options**:

---

## Option 1: Deploy via Supabase Dashboard (Workaround)

Since Dashboard doesn't support config files directly, you need to:

1. **Use the CLI method** (Option 2 below) **OR**
2. **Add anon key to webhook URL** (Quick fix, less secure)

### Quick Fix (Temporary):

Update your Stripe webhook URL to include the anon key:
```
https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/stripe-webhook?apikey=YOUR_ANON_KEY
```

**Note:** This works but exposes your anon key in the URL. Only use for testing.

---

## Option 2: Deploy via CLI with Config File (Recommended)

### Step 1: Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

### Step 3: Link Your Project

```bash
cd /home/caio/development/sites/qrgenerator
supabase link --project-ref pstoxizwwgbpwrcdknto
```

### Step 4: Set Secrets via CLI

```bash
supabase secrets set STRIPE_SECRET_KEY=<your_stripe_secret_key>
supabase secrets set STRIPE_WEBHOOK_SECRET=<your_webhook_secret>
supabase secrets set SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co
```

**Get your Service Role Key:**
1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api
2. Copy the **service_role** key
3. Set it:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 5: Deploy Function with Auth Disabled

The config file is already created at:
`supabase/functions/stripe-webhook/.supabase/config.json`

Now deploy:

```bash
supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
```

The `{"auth": false}` config will make the function public (no auth required).

---

## Option 3: Manual Configuration via Dashboard (If Available)

Some Supabase projects have a "Function Settings" option:

1. Go to **Supabase Dashboard** → **Edge Functions** → **stripe-webhook**
2. Look for **Settings** or **Configuration** tab
3. Find **"Require Authentication"** or **"Auth"** option
4. **Disable** it (set to `false`)
5. Save/Redeploy

---

## Verify It Works

After deploying:

1. **Test the webhook endpoint:**
   ```bash
   curl -X POST https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/stripe-webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```
   Should return a response (even if it's an error about missing signature).

2. **Check Stripe webhook:**
   - Go to Stripe Dashboard → Webhooks
   - Click "Send test webhook"
   - Should show **200** status instead of **401**

3. **Check Supabase logs:**
   - Go to Supabase Dashboard → Edge Functions → stripe-webhook → Logs
   - Should see "Webhook received" messages

---

## Important Notes

- **Security:** Making the webhook public is safe because Stripe signs all requests with the `stripe-signature` header, which we verify in the function code.

- **Other Functions:** Only disable auth for the webhook function. Other functions (like `create-checkout`) should keep auth enabled.

- **After Deployment:** Update your Stripe webhook URL to remove any `apikey` query parameter if you used Option 1.

---

## Still Getting 401?

1. **Verify config file exists:**
   - Check: `supabase/functions/stripe-webhook/.supabase/config.json`
   - Content should be: `{"auth": false}`

2. **Redeploy via CLI:**
   ```bash
   supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
   ```

3. **Check function settings in Dashboard:**
   - There might be a toggle to disable auth in the function settings

4. **Contact Support:**
   - If none of the above works, Supabase might need to enable public access for your function manually

