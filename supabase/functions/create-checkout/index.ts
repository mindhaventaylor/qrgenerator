import Stripe from 'https://esm.sh/stripe@14.21.0';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: { message: 'Invalid JSON in request body' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, amount = 500, currency = 'usd' } = requestBody;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: { message: 'User ID is required' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate currency (must be 3-letter lowercase code)
    // Log the received currency for debugging
    console.log('=== CURRENCY VALIDATION ===');
    console.log('Received currency from request:', currency, 'Type:', typeof currency);
    console.log('Received amount:', amount);
    
    let validCurrency = 'usd'; // Default
    if (typeof currency === 'string' && currency.length === 3) {
      validCurrency = currency.toLowerCase();
      console.log('Currency validated:', validCurrency);
    } else if (currency) {
      console.warn('Invalid currency format:', currency, 'Length:', currency?.length, 'Using default USD');
    } else {
      console.warn('No currency provided, using default USD');
    }
    
    console.log('Final currency to use:', validCurrency, 'Final amount:', amount);

    // Get Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: { message: 'Stripe not configured. Please contact support.' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get origin from request headers or use default
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
    
    console.log('Creating checkout session for user:', userId, 'Origin:', origin);
    console.log('Currency:', validCurrency, 'Amount:', amount, 'Request currency:', currency);

    // Create Stripe Checkout Session with dynamic currency
    console.log('Creating session with currency:', validCurrency, 'amount:', amount);
    
    // Determine locale based on currency
    const currencyLocaleMap: Record<string, string> = {
      'brl': 'pt-BR',
      'usd': 'en',
      'eur': 'auto',
      'gbp': 'en-GB',
      'cad': 'en-CA',
      'aud': 'en-AU',
      'mxn': 'es-MX',
      'ars': 'es-AR',
      'jpy': 'ja',
      'cny': 'zh-CN',
      'inr': 'en-IN',
      'krw': 'ko',
      'rub': 'ru',
      'pln': 'pl',
      'try': 'tr',
      'twd': 'zh-TW',
      'nzd': 'en-NZ',
    };
    
    const locale = currencyLocaleMap[validCurrency] || 'auto';
    
    console.log('Creating checkout with currency:', validCurrency, 'locale:', locale, 'amount:', amount);
    
    const sessionParams: any = {
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: validCurrency,
            product_data: {
              name: 'QR Generator Subscription',
              description: 'Monthly subscription - Unlimited QR codes',
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: amount, // Amount in smallest currency unit (cents for USD, etc.)
          },
          quantity: 1,
        },
      ],
      locale: locale, // Set locale to match currency
      success_url: `${origin}/create-qr?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/create-qr?payment=canceled`,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        currency: validCurrency,
      },
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
    };
    
    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Checkout session created:', session.id);
    console.log('Session currency:', session.currency);
    console.log('Line items:', session.line_items?.data?.map(item => ({
      currency: item.price?.currency,
      amount: item.amount_total,
      unit_amount: item.price?.unit_amount
    })));

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Checkout creation error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
    });

    return new Response(
      JSON.stringify({ 
        error: { 
          message: error.message || 'Failed to create checkout session',
          details: error.type || 'Unknown error'
        } 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

