# Troubleshooting Checkout Function

If you're getting errors when trying to create a checkout session, check these:

## Common Issues & Fixes

### 1. "STRIPE_SECRET_KEY not configured"

**Problem:** The secret key is not set in Supabase Edge Function secrets.

**Fix:**
1. Go to Supabase Dashboard → Edge Functions → Manage secrets
2. Get your Stripe secret key from: https://dashboard.stripe.com/test/apikeys
3. Add: `STRIPE_SECRET_KEY` = `<your_stripe_secret_key>`
4. Save
5. Redeploy the function (or it will pick up secrets automatically)

### 2. "Invalid API Key"

**Problem:** The Stripe secret key is incorrect or formatted wrong.

**Fix:**
- Verify the key starts with `sk_test_` (for test mode) or `sk_live_` (for production)
- Make sure there are no extra spaces or quotes
- Get a fresh key from https://dashboard.stripe.com/test/apikeys

### 3. CORS Errors

**Problem:** Browser blocks the request due to CORS.

**Fix:**
- The function already includes CORS headers
- Make sure you're calling it from the same domain or localhost
- Check browser console for specific CORS error messages

### 4. "Failed to create checkout session"

**Problem:** Stripe API error (often due to invalid request).

**Fix:**
- Check Supabase Edge Function logs for detailed error
- Verify the Stripe account is active
- Make sure you're using test keys with test mode enabled in Stripe Dashboard

### 5. Function Returns 500 Error

**Check the logs:**
1. Go to Supabase Dashboard → Edge Functions
2. Click on `create-checkout` function
3. Go to "Logs" tab
4. Look for error messages

### 6. Testing the Function Directly

You can test the function using curl:

```bash
curl -X POST https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"userId": "test-user-id", "amount": 500}'
```

Replace `YOUR_ANON_KEY` with your Supabase anon key.

### 7. Verify Function is Deployed

1. Go to Supabase Dashboard → Edge Functions
2. Verify `create-checkout` is listed and shows "Active"
3. Check the function URL matches: `https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/create-checkout`

### 8. Update Function Code

If you need to update the function:
1. Go to Supabase Dashboard → Edge Functions → create-checkout
2. Click "Edit"
3. Paste the updated code from `supabase/functions/create-checkout/index.ts`
4. Click "Deploy"

## Quick Verification Checklist

- [ ] Function is deployed and active in Supabase Dashboard
- [ ] `STRIPE_SECRET_KEY` is set in Edge Function secrets
- [ ] Stripe key is correct (test key starts with `sk_test_`)
- [ ] Function logs show no errors
- [ ] Frontend is calling the function with correct `userId`
- [ ] Browser console shows no CORS errors

## Debug Steps

1. **Check Supabase Logs:**
   - Dashboard → Edge Functions → create-checkout → Logs
   - Look for error messages when you try to subscribe

2. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Try to subscribe and see what errors appear

3. **Check Network Tab:**
   - Open browser DevTools → Network tab
   - Try to subscribe
   - Find the request to `create-checkout`
   - Check the response status and body

4. **Test with Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/test
   - Verify your API keys are active
   - Check if there are any account issues

## Still Having Issues?

1. Check the exact error message in:
   - Supabase Edge Function logs
   - Browser console
   - Network tab response

2. Verify all setup steps from `STRIPE_SETUP.md` are completed

3. Make sure you're using **test mode** keys if testing locally

