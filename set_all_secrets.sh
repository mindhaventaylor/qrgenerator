#!/bin/bash
# Script to set ALL Supabase Edge Function secrets automatically
# Run this AFTER: npx supabase login && npx supabase link --project-ref pstoxizwwgbpwrcdknto

echo "🚀 Setting Supabase Edge Function secrets..."
echo ""

# Check if we need service role key
echo "📋 You need your SUPABASE_SERVICE_ROLE_KEY"
echo "   Get it from: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api"
echo "   (Look for 'service_role' key - the secret one)"
echo ""
read -p "Enter your SUPABASE_SERVICE_ROLE_KEY: " SERVICE_KEY

if [ -z "$SERVICE_KEY" ]; then
  echo "❌ Error: Service role key is required!"
  exit 1
fi

echo ""
echo "📋 You also need your Stripe keys"
echo "   Get them from: https://dashboard.stripe.com/test/apikeys"
echo ""
read -p "Enter your STRIPE_SECRET_KEY: " STRIPE_KEY
read -p "Enter your STRIPE_WEBHOOK_SECRET: " WEBHOOK_SECRET

if [ -z "$STRIPE_KEY" ] || [ -z "$WEBHOOK_SECRET" ]; then
  echo "❌ Error: Stripe keys are required!"
  exit 1
fi

echo ""
echo "Setting secrets..."

# Set STRIPE_SECRET_KEY
echo "  ✓ Setting STRIPE_SECRET_KEY..."
npx supabase secrets set STRIPE_SECRET_KEY=$STRIPE_KEY

# Set STRIPE_WEBHOOK_SECRET
echo "  ✓ Setting STRIPE_WEBHOOK_SECRET..."
npx supabase secrets set STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET

# Set SUPABASE_URL
echo "  ✓ Setting SUPABASE_URL..."
npx supabase secrets set SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co

# Set SUPABASE_SERVICE_ROLE_KEY
echo "  ✓ Setting SUPABASE_SERVICE_ROLE_KEY..."
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY

echo ""
echo "✅ All secrets set successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Deploy the webhook function:"
echo "      npx supabase functions deploy stripe-webhook --project-ref pstoxizwwgbpwrcdknto --no-verify-jwt"
echo ""
echo "   2. Update Stripe webhook URL to:"
echo "      https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/stripe-webhook"
echo "      (Remove any ?apikey= parameters)"

