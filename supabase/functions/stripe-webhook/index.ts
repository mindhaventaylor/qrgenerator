import Stripe from 'https://esm.sh/stripe@14.21.0';

Deno.serve(async (req) => {
  // Allow OPTIONS requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'stripe-signature, content-type',
      },
    });
  }

  console.log('Webhook received:', req.method, req.url);

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  console.log('Environment check:', {
    hasStripeKey: !!stripeSecretKey,
    hasWebhookSecret: !!webhookSecret,
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
  });

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    return new Response(
      JSON.stringify({ error: 'Missing required environment variables' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const signature = req.headers.get('stripe-signature');
  console.log('Signature present:', !!signature);
  
  if (!signature) {
    console.error('No Stripe signature header found');
    return new Response(
      JSON.stringify({ error: 'No signature found' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    console.log('Stripe webhook event:', event.type);

    // Handle different event types
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;

      console.log('Session data:', {
        client_reference_id: session.client_reference_id,
        metadata: session.metadata,
        subscription: session.subscription,
        mode: session.mode
      });

      if (!userId) {
        console.error('No user ID in checkout session');
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      console.log('User ID found:', userId);

      // Get subscription from Stripe
      const subscriptionId = session.subscription as string;
      if (!subscriptionId) {
        console.error('No subscription ID in checkout session');
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      console.log('Subscription ID found:', subscriptionId);

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Create or update subscription in database
      const subscriptionData = {
        user_id: userId,
        plan_type: 'monthly',
        status: 'active',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: subscription.customer as string,
      };

      // Check if subscription exists
      console.log('Checking existing subscriptions for user:', userId);
      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}`, {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!checkResponse.ok) {
        console.error('Error checking subscriptions:', await checkResponse.text());
        throw new Error('Failed to check existing subscriptions');
      }

      const existing = await checkResponse.json();
      console.log('Existing subscriptions found:', existing.length);

      if (existing && existing.length > 0) {
        // Update existing subscription
        console.log('Updating subscription:', existing[0].id);
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/subscriptions?id=eq.${existing[0].id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(subscriptionData),
        });

        if (!updateResponse.ok) {
          console.error('Error updating subscription:', await updateResponse.text());
          throw new Error('Failed to update subscription');
        }
        console.log('Subscription updated successfully');
      } else {
        // Create new subscription
        console.log('Creating new subscription for user:', userId);
        const createResponse = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(subscriptionData),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('Error creating subscription:', errorText);
          throw new Error(`Failed to create subscription: ${errorText}`);
        }
        const created = await createResponse.json();
        console.log('Subscription created successfully:', created);
      }

      // Create payment record
      console.log('Creating payment record for user:', userId);
      const paymentResponse = await fetch(`${supabaseUrl}/rest/v1/payments`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          amount: (session.amount_total || 500) / 100, // Convert cents to dollars
          currency: 'USD',
          payment_method: 'card',
          status: 'completed',
          invoice_url: session.invoice?.toString(),
        }),
      });

      if (!paymentResponse.ok) {
        console.error('Error creating payment:', await paymentResponse.text());
        // Don't throw - payment record is less critical
      } else {
        console.log('Payment record created successfully');
      }
    } else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const userResponse = await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?stripe_customer_id=eq.${customerId}`,
          {
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
          }
        );

        const subs = await userResponse.json();
        if (subs && subs.length > 0) {
          // Update subscription period
          await fetch(`${supabaseUrl}/rest/v1/subscriptions?id=eq.${subs[0].id}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              status: 'active',
            }),
          });
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find and update subscription status
      const userResponse = await fetch(
        `${supabaseUrl}/rest/v1/subscriptions?stripe_customer_id=eq.${customerId}`,
        {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
        }
      );

      const subs = await userResponse.json();
      if (subs && subs.length > 0) {
        await fetch(`${supabaseUrl}/rest/v1/subscriptions?id=eq.${subs[0].id}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'cancelled',
          }),
        });
      }
    }

    console.log('Webhook processing completed successfully');
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
});

