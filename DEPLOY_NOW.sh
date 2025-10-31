#!/bin/bash
# Script to deploy stripe-webhook function with auth disabled

cd /home/caio/development/sites/qrgenerator

echo "Step 1: Logging into Supabase..."
npx supabase login

echo ""
echo "Step 2: Linking project..."
npx supabase link --project-ref pstoxizwwgbpwrcdknto

echo ""
echo "Step 3: Setting secrets..."
echo "You'll need:"
echo "  - Service role key: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api"
echo "  - Stripe keys: https://dashboard.stripe.com/test/apikeys"
read -p "Press Enter to continue..."

read -p "Enter your STRIPE_SECRET_KEY: " STRIPE_KEY
read -p "Enter your STRIPE_WEBHOOK_SECRET: " WEBHOOK_SECRET

npx supabase secrets set STRIPE_SECRET_KEY=$STRIPE_KEY

npx supabase secrets set STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET

npx supabase secrets set SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co

read -p "Enter your SUPABASE_SERVICE_ROLE_KEY: " SERVICE_KEY
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY

echo ""
echo "Step 4: Deploying stripe-webhook function..."
npx supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt

echo ""
echo "Done! The function should now be public (no auth required)."
echo ""
echo "Next steps:"
echo "1. Update Stripe webhook URL to: https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/stripe-webhook"
echo "2. Remove any ?apikey= parameters"
echo "3. Test a payment"

