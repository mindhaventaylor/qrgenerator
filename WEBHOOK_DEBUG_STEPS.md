# Webhook Debugging - Quick Steps

## ✅ What I Fixed

1. **Async Webhook Issue**: Changed `constructEvent` → `constructEventAsync` for Deno compatibility
2. **Added Logging**: Now you can see exactly where it's failing
3. **Added Error Handling**: Better error messages to diagnose issues

## 🚀 Redeploy Command

```bash
npx supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
```

## 🔍 How to Debug

After redeploying, check the logs:

1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto
2. Navigate to: **Edge Functions** → **stripe-webhook** → **Logs**
3. Look for detailed messages

## 🐛 Common Issues & Fixes

### Issue 1: "No user ID in checkout session"
**Cause:** Checkout session wasn't created with user ID  
**Fix:** Make sure you're calling the create-checkout function with a valid userId

### Issue 2: "Failed to create subscription"
**Cause:** Database columns missing or RLS blocking  
**Fix:** Run migration:
```sql
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
```

### Issue 3: "No subscription ID in checkout session"
**Cause:** Stripe checkout didn't return a subscription ID  
**Fix:** This can happen with one-time payments instead of subscriptions

## 🧪 Test the Webhook

Trigger a test webhook from Stripe:
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click your webhook endpoint
3. Click "Send test webhook"
4. Select event: "checkout.session.completed"
5. Send
6. Check Supabase logs

## 📋 Checklist

- [ ] Redeployed function with new code
- [ ] Database has stripe_subscription_id column
- [ ] Database has stripe_customer_id column
- [ ] RLS allows service_role to INSERT/UPDATE
- [ ] Test webhook sent and logs checked
- [ ] Real payment attempted and logs checked

## 🔗 Related Files

- `supabase/functions/stripe-webhook/index.ts` - Main webhook handler
- `supabase/functions/create-checkout/index.ts` - Creates checkout session
- `REDEPLOY_WEBHOOK.md` - Detailed redeploy instructions
- `FIX_WEBHOOK_401.md` - Original 401 fix

## 📞 Need More Help?

1. Check Supabase logs for specific error messages
2. Check Stripe webhook event details in Stripe Dashboard
3. Verify all environment variables are set
4. Check database schema matches what the function expects

