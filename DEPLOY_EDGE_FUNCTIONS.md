# Deploy Supabase Edge Functions - Two Methods

## Method 1: Deploy via Supabase Dashboard (Easier - Recommended)

### Step 1: Go to Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar

### Step 2: Create the `create-checkout` Function

1. Click **Create a new function**
2. Function name: `create-checkout`
3. Copy the entire contents of `supabase/functions/create-checkout/index.ts`
4. Paste it into the code editor
5. Click **Deploy function**

### Step 3: Create the `stripe-webhook` Function

1. Click **Create a new function** again
2. Function name: `stripe-webhook`
3. Copy the entire contents of `supabase/functions/stripe-webhook/index.ts`
4. Paste it into the code editor
5. Click **Deploy function**

### Step 4: Set Environment Variables (Secrets)

1. In the Edge Functions page, click **Manage secrets**
2. Add these secrets:

```
STRIPE_SECRET_KEY=<your_stripe_secret_key>

STRIPE_WEBHOOK_SECRET=<your_webhook_secret>
```

**Note:** Get your keys from:
- Stripe Dashboard: https://dashboard.stripe.com/test/apikeys
- Webhook secret: https://dashboard.stripe.com/test/webhooks (after creating webhook endpoint)

**Note:** You'll need to update `STRIPE_WEBHOOK_SECRET` after creating the webhook in Stripe Dashboard.

3. Click **Save** for each secret

### Step 5: Test the Functions

Once deployed, you can test them:
- Function URLs will be:
  - `https://yjmfghmcrleysafgrmeb.supabase.co/functions/v1/create-checkout`
  - `https://yjmfghmcrleysafgrmeb.supabase.co/functions/v1/stripe-webhook`

---

## Method 2: Install Supabase CLI (Alternative)

### Step 1: Install Supabase CLI

**On Linux:**
```bash
# Using npm
npm install -g supabase

# Or using Homebrew (if you have it)
brew install supabase/tap/supabase
```

**On macOS:**
```bash
brew install supabase/tap/supabase
```

**On Windows:**
```bash
# Using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or using npm
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window to authenticate.

### Step 3: Link Your Project

From the project root:
```bash
cd /home/caio/development/sites/qrgenerator
supabase link --project-ref yjmfghmcrleysafgrmeb
```

### Step 4: Set Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=<your_stripe_secret_key>

supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 5: Deploy Functions

```bash
# Deploy create-checkout
supabase functions deploy create-checkout

# Deploy stripe-webhook (no auth required for Stripe webhooks)
supabase functions deploy stripe-webhook --no-verify-jwt
```

---

## Which Method to Use?

**Use Method 1 (Dashboard)** if:
- ✅ You want the easiest setup
- ✅ You're not comfortable with CLI
- ✅ You just want to get it working quickly

**Use Method 2 (CLI)** if:
- ✅ You plan to deploy frequently
- ✅ You prefer command-line tools
- ✅ You want version control for deployments

---

## Verify Deployment

After deploying either method:

1. Go to Supabase Dashboard → Edge Functions
2. You should see both functions listed:
   - `create-checkout`
   - `stripe-webhook`
3. Click on each function to see logs and details

---

## Troubleshooting

### Function not deploying?
- Check that you copied the entire code correctly
- Verify there are no syntax errors
- Check the function logs in the dashboard

### Secrets not working?
- Make sure secrets are set in the Edge Functions section (not project settings)
- Verify secret names match exactly: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- Restart the function after setting secrets

### Function errors?
- Check the function logs in Supabase Dashboard
- Verify all environment variables are set
- Make sure the Stripe keys are correct (test mode vs production)

