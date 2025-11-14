# Fix: Login First, Then Set Secrets

## The Error
"Access token not provided" means you need to login first.

## Steps to Fix

### Step 1: Login to Supabase
```bash
npx supabase login
```

This will open your browser for authentication. After you authorize, you'll be logged in.

### Step 2: Link Your Project (if not already linked)
```bash
cd /home/caio/development/sites/qrgenerator
npx supabase link --project-ref pstoxizwwgbpwrcdknto
```

### Step 3: Set Secrets (with corrected URL)

⚠️ **Note:** You used `.supabase.com` but it should be `.supabase.co`

Run these commands:

```bash
npx supabase secrets set STRIPE_SECRET_KEY=<your_stripe_secret_key>

npx supabase secrets set STRIPE_WEBHOOK_SECRET=<your_webhook_secret>

npx supabase secrets set SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co

npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY>
```

**Important:** 
- The URL should be `.supabase.co` not `.supabase.com`
- Replace `<YOUR_SERVICE_ROLE_KEY>` with your actual key from: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api

## Quick Copy-Paste (after login):

```bash
cd /home/caio/development/sites/qrgenerator

npx supabase secrets set STRIPE_SECRET_KEY=<your_stripe_secret_key>

npx supabase secrets set STRIPE_WEBHOOK_SECRET=<your_webhook_secret>

npx supabase secrets set SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co

# Get your service_role key from: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api
# Then run:
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<paste_your_key_here>
```
















