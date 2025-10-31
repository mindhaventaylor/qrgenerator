# Stripe Payment Integration Setup

This guide will help you configure Stripe payments for the QR Generator application.

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Supabase project with Edge Functions enabled

## Step 1: Stripe Account Setup

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** and **Secret key** (test mode)
3. You'll use these in Step 3

## Step 2: Update Database Schema

Run this SQL in your Supabase SQL Editor to add Stripe fields:

```sql
-- Add Stripe-related columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
```

Or run the migration file:
- `supabase/migrations/add_stripe_fields.sql`

## Step 3: Configure Environment Variables

### In Supabase Dashboard (for Edge Functions):

1. Go to your Supabase project → **Settings** → **Edge Functions** → **Secrets**
2. Add the following secrets:

```
STRIPE_SECRET_KEY=<your_stripe_secret_key>

STRIPE_WEBHOOK_SECRET=<your_webhook_secret>
```

**Note:** You'll get these keys from:
- Secret key: https://dashboard.stripe.com/test/apikeys
- Webhook secret: After creating the webhook endpoint in Step 5

### In Your Local .env File:

Already added to `.env`:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51S6dfkRzyGIanNct9Aj5XTOf3fwHdHpmFidCk9r4xLd1DFR3IKENCytUVkSHmNXCvvkfvO5nZdJBo4rSLN7qANGn005dTnjPGY
```

### For Vercel Deployment:

Add to Vercel project settings → Environment Variables:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51S6dfkRzyGIanNct9Aj5XTOf3fwHdHpmFidCk9r4xLd1DFR3IKENCytUVkSHmNXCvvkfvO5nZdJBo4rSLN7qANGn005dTnjPGY
```

## Step 4: Deploy Supabase Edge Functions

### Deploy create-checkout function:

```bash
cd supabase/functions/create-checkout
supabase functions deploy create-checkout
```

Or using Supabase CLI:￼
```bash
supabase functions deploy create-checkout --project-ref YOUR_PROJECT_REF
```

### Deploy stripe-webhook function:

```bash
supabase functions deploy stripe-webhook --project-ref YOUR_PROJECT_REF --no-verify-jwt
```

## Step 5: Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **Add endpoint**
3. Set **Endpoint URL** to:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
   ```
   Replace `YOUR_PROJECT_REF` with your Supabase project reference.
4. Select events to listen to:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Update the `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets (Step 3)

## Step 6: Test the Integration

### Test Mode

1. Make sure you're using **test mode** keys in Stripe dashboard
2. Go to your app's billing page
3. Click "Subscribe Now"
4. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
5. Complete checkout
6. Verify subscription is created in your database

### Verify Webhook

1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Check "Recent events" - you should see successful events
4. If events fail, check the error messages

## Step 7: Production Setup

When ready for production:

1. Switch to **Live mode** in Stripe dashboard
2. Get your **live** API keys
3. Update all environment variables with live keys
4. Create a **live mode** webhook endpoint
5. Deploy Edge Functions with production keys

## Troubleshooting

### Checkout doesn't redirect
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
- Check browser console for errors
- Ensure Edge Function `create-checkout` is deployed

### Webhook not working
- Verify webhook URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check Supabase Edge Function logs: `supabase functions logs stripe-webhook`
- Verify database has `stripe_subscription_id` and `stripe_customer_id` columns

### Subscription not updating in database
- Check webhook events in Stripe dashboard
- Verify Edge Function has correct database permissions
- Check RLS policies allow Edge Function to write to subscriptions table

### Payment succeeded but subscription not active
- Check webhook received `checkout.session.completed` event
- Verify user ID is passed correctly in checkout session metadata
- Check Edge Function logs for errors

## File Structure

```
qr-generator/
├── src/
│   └── lib/
│       └── stripe.ts                    # Frontend Stripe integration
├── supabase/
│   └── functions/
│       ├── create-checkout/
│       │   └── index.ts                 # Creates Stripe checkout session
│       └── stripe-webhook/
│           └── index.ts                 # Handles Stripe webhooks
└── .env                                  # Frontend Stripe key
```

## Security Notes

- Never commit `.env` files or Stripe secret keys
- Always use environment variables for secrets
- Use test mode keys during development
- Rotate keys if exposed

## Support

For issues:
1. Check Supabase Edge Function logs
2. Check Stripe Dashboard → Webhooks → Recent events
3. Verify all environment variables are set correctly
4. Ensure database schema is updated

