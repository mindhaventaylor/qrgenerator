# Deploy Stripe Customer Portal Function

## Quick Deploy

Just run this command:

```bash
npx supabase functions deploy create-portal-session --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt
```

## What It Does

This function creates a Stripe Customer Portal session that allows users to:
- Update payment methods
- View billing history
- Cancel subscriptions
- Update billing details

## Prerequisites

Make sure you have these secrets set:
- ✅ STRIPE_SECRET_KEY

Already set if you followed the stripe-webhook deployment.

## How It Works

1. User clicks "Manage Subscription" on billing page
2. Frontend calls `createPortalSession()` function
3. Edge function creates portal session with Stripe
4. User is redirected to Stripe's secure portal
5. User returns to billing page after making changes

## Testing

After deploying:
1. Subscribe to a plan
2. Go to billing page
3. Click "Manage Subscription"
4. Should redirect to Stripe portal
5. Try canceling subscription
6. Return to your app
7. Subscription should show as cancelled

## Security

✅ Uses Stripe's secure hosted portal  
✅ No payment methods stored in your database  
✅ All sensitive operations handled by Stripe  
✅ User can only access their own portal

