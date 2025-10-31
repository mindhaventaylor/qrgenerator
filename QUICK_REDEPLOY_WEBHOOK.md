# Quick Redeploy Webhook

## Just run this:

```bash
npx supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
```

## Then check logs:

Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto
→ Edge Functions → stripe-webhook → Logs

You should now see:
- Session data with client_reference_id, metadata, subscription, and mode
- Whether user ID and subscription ID were found
- Detailed error messages if something fails

## Most likely issues:

1. **No user ID** - Check that create-checkout is passing userId
2. **No subscription ID** - Happens when mode is 'payment' instead of 'subscription'
3. **Database error** - Look for "Error creating subscription" messages

