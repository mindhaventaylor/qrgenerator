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
    console.log('=== CREATE-PORTAL-SESSION FUNCTION CALLED ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));
    
    // Parse request body
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      requestBody = JSON.parse(bodyText);
      console.log('Parsed request body:', JSON.stringify(requestBody, null, 2));
    } catch (e: any) {
      console.error('=== JSON PARSE ERROR ===');
      console.error('Error:', e.message);
      console.error('Stack:', e.stack);
      return new Response(
        JSON.stringify({ error: { message: 'Invalid JSON in request body', details: e.message } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, stripeCustomerId } = requestBody;
    
    console.log('=== REQUEST VALIDATION ===');
    console.log('User ID:', userId);
    console.log('Stripe Customer ID:', stripeCustomerId);

    if (!userId || !stripeCustomerId) {
      console.error('=== VALIDATION FAILED ===');
      console.error('Missing userId:', !userId);
      console.error('Missing stripeCustomerId:', !stripeCustomerId);
      return new Response(
        JSON.stringify({ error: { message: 'User ID and Stripe Customer ID are required' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Stripe secret key
    console.log('=== CHECKING STRIPE CONFIGURATION ===');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    console.log('Stripe Secret Key present:', !!stripeSecretKey);
    console.log('Stripe Secret Key length:', stripeSecretKey?.length || 0);
    console.log('Stripe Secret Key prefix:', stripeSecretKey?.substring(0, 7) || 'N/A');
    
    if (!stripeSecretKey) {
      console.error('=== STRIPE CONFIGURATION ERROR ===');
      console.error('STRIPE_SECRET_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: { message: 'Stripe not configured. Please contact support.' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    console.log('=== INITIALIZING STRIPE ===');
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });
    console.log('Stripe initialized successfully');

    // Get origin from request headers or use default
    const origin = req.headers.get('origin') || 
                   req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                   'https://generatecodeqr.com';
    
    const returnUrl = `${origin}/billing`;
    
    console.log('=== PORTAL SESSION CONFIGURATION ===');
    console.log('Origin:', origin);
    console.log('Referer:', req.headers.get('referer'));
    console.log('Return URL:', returnUrl);
    console.log('Customer ID:', stripeCustomerId);

    // Verify customer exists in Stripe before creating portal session
    console.log('=== VERIFYING STRIPE CUSTOMER ===');
    try {
      const customer = await stripe.customers.retrieve(stripeCustomerId);
      console.log('Customer verified successfully');
      console.log('Customer ID:', customer.id);
      console.log('Customer email:', (customer as any).email || 'N/A');
      console.log('Customer deleted:', (customer as any).deleted || false);
      
      if ((customer as any).deleted) {
        console.error('Customer has been deleted in Stripe');
        throw new Error('Customer has been deleted');
      }
    } catch (customerError: any) {
      console.error('=== CUSTOMER VERIFICATION ERROR ===');
      console.error('Error type:', customerError.type);
      console.error('Error code:', customerError.code);
      console.error('Error message:', customerError.message);
      console.error('Error statusCode:', customerError.statusCode);
      console.error('Error stack:', customerError.stack);
      
      if (customerError.code === 'resource_missing') {
        console.error('Customer not found in Stripe');
        return new Response(
          JSON.stringify({ 
            error: { 
              message: 'Stripe customer not found. Please contact support.',
              details: 'Invalid customer ID',
              code: 'customer_not_found'
            } 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw customerError;
    }

    // Create Stripe Customer Portal Session
    console.log('=== CREATING PORTAL SESSION ===');
    console.log('Session parameters:', {
      customer: stripeCustomerId,
      return_url: returnUrl
    });
    
    let session;
    try {
      session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
      });
    } catch (sessionError: any) {
      console.error('=== PORTAL SESSION CREATION ERROR ===');
      console.error('Error type:', sessionError.type);
      console.error('Error code:', sessionError.code);
      console.error('Error message:', sessionError.message);
      console.error('Error statusCode:', sessionError.statusCode);
      console.error('Error raw:', JSON.stringify(sessionError, Object.getOwnPropertyNames(sessionError)));
      throw sessionError;
    }

    console.log('=== PORTAL SESSION CREATED SUCCESSFULLY ===');
    console.log('Session ID:', session.id);
    console.log('Portal URL:', session.url);
    console.log('Session created at:', session.created);

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('=== PORTAL SESSION CREATION ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Error type (Stripe):', error.type);
    console.error('Error code:', error.code);
    console.error('Error statusCode:', error.statusCode);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Log environment check
    console.log('=== ENVIRONMENT CHECK ===');
    console.log('Has STRIPE_SECRET_KEY:', !!Deno.env.get('STRIPE_SECRET_KEY'));
    console.log('STRIPE_SECRET_KEY length:', Deno.env.get('STRIPE_SECRET_KEY')?.length || 0);
    console.log('STRIPE_SECRET_KEY prefix:', Deno.env.get('STRIPE_SECRET_KEY')?.substring(0, 7) || 'N/A');

    // Provide more specific error messages
    let statusCode = 500;
    let errorMessage = error.message || 'Failed to create portal session';
    let errorDetails = error.type || 'Unknown error';
    let errorCode = error.code || 'PORTAL_SESSION_ERROR';

    if (error.type === 'StripeInvalidRequestError') {
      console.error('Stripe Invalid Request Error detected');
      if (error.code === 'resource_missing') {
        statusCode = 404;
        errorMessage = 'Customer not found in Stripe. Please contact support.';
        errorDetails = 'customer_not_found';
        errorCode = 'customer_not_found';
      } else if (error.message?.includes('customer')) {
        statusCode = 400;
        errorMessage = 'Invalid customer ID. Please contact support.';
        errorDetails = 'invalid_customer';
        errorCode = 'invalid_customer';
      } else if (error.message?.includes('billing_portal') || error.message?.includes('portal')) {
        statusCode = 400;
        errorMessage = 'Stripe Billing Portal not configured. Please contact support.';
        errorDetails = 'billing_portal_not_configured';
        errorCode = 'billing_portal_error';
      }
    } else if (error.type === 'StripeAuthenticationError') {
      console.error('Stripe Authentication Error detected');
      statusCode = 500;
      errorMessage = 'Stripe authentication failed. Please contact support.';
      errorDetails = 'stripe_auth_error';
      errorCode = 'stripe_auth_error';
    } else if (error.type === 'StripeAPIError') {
      console.error('Stripe API Error detected');
      statusCode = 502;
      errorMessage = 'Stripe API error. Please try again later.';
      errorDetails = 'stripe_api_error';
      errorCode = 'stripe_api_error';
    } else if (error.type === 'StripeConnectionError') {
      console.error('Stripe Connection Error detected');
      statusCode = 503;
      errorMessage = 'Cannot connect to Stripe. Please try again later.';
      errorDetails = 'stripe_connection_error';
      errorCode = 'stripe_connection_error';
    }

    console.error('=== FINAL ERROR RESPONSE ===');
    console.error('Status Code:', statusCode);
    console.error('Error Message:', errorMessage);
    console.error('Error Details:', errorDetails);
    console.error('Error Code:', errorCode);

    return new Response(
      JSON.stringify({ 
        error: { 
          message: errorMessage,
          details: errorDetails,
          code: errorCode,
          type: error.type,
          originalCode: error.code,
          statusCode: error.statusCode
        } 
      }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

