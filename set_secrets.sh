#!/bin/bash
# Script to set Supabase Edge Function secrets
# Run this AFTER you've logged in: npx supabase login

echo "Setting Supabase Edge Function secrets..."

# You need to provide your service_role key
# Get it from: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api

read -p "Enter your SUPABASE_SERVICE_ROLE_KEY: " SERVICE_KEY
read -p "Enter your STRIPE_SECRET_KEY: " STRIPE_KEY
read -p "Enter your STRIPE_WEBHOOK_SECRET: " WEBHOOK_SECRET

echo ""
echo "Setting secrets..."

npx supabase secrets set STRIPE_SECRET_KEY=$STRIPE_KEY

npx supabase secrets set STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET

npx supabase secrets set SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co

npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY

echo ""
echo "✅ All secrets set!"
echo ""
echo "Next step: Deploy the function"
echo "npx supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt"

