import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

let stripePromise: Promise<Stripe | null>;

/**
 * Initialize Stripe with publishable key
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('Stripe publishable key not found');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

/**
 * Create a checkout session and redirect to Stripe
 */
export async function createCheckoutSession(userId: string): Promise<void> {
  try {
    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to subscribe');
    }

    console.log('Calling create-checkout function for user:', userId);

    // Call Supabase Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        userId,
        amount: 500, // $5.00 in cents
      }
    });

    console.log('Function response:', { data, error });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }

    if (data?.error) {
      console.error('Function returned error:', data.error);
      throw new Error(data.error.message || data.error.details || 'Failed to create checkout session');
    }

    const sessionId = data?.sessionId;
    if (!sessionId) {
      console.error('No sessionId in response:', data);
      throw new Error('No session ID returned from server');
    }

    console.log('Got session ID:', sessionId);

    // Redirect to Stripe Checkout
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe failed to initialize. Please check your publishable key.');
    }

    const { error: redirectError } = await stripe.redirectToCheckout({
      sessionId: sessionId
    });

    if (redirectError) {
      console.error('Stripe redirect error:', redirectError);
      throw new Error(redirectError.message || 'Failed to redirect to checkout');
    }
  } catch (error: any) {
    console.error('Checkout error:', error);
    throw error;
  }
}

/**
 * Create a customer portal session and redirect to Stripe
 */
export async function createPortalSession(userId: string, stripeCustomerId: string): Promise<void> {
  try {
    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('You must be logged in to manage your subscription');
    }

    console.log('=== CALLING CREATE-PORTAL-SESSION ===');
    console.log('User ID:', userId);
    console.log('Stripe Customer ID:', stripeCustomerId);

    // Call Supabase Edge Function to create portal session
    let data, error;
    try {
      const result = await supabase.functions.invoke('create-portal-session', {
        body: {
          userId,
          stripeCustomerId,
        }
      });
      data = result.data;
      error = result.error;
    } catch (invokeError: any) {
      console.error('=== INVOKE EXCEPTION ===');
      console.error('Invoke error:', invokeError);
      error = invokeError;
      // Try to extract response if available
      if (invokeError.response) {
        try {
          const errorText = await invokeError.response.text();
          console.error('Response text:', errorText);
          try {
            data = JSON.parse(errorText);
          } catch {
            data = { error: { message: errorText } };
          }
        } catch (e) {
          console.error('Could not read response:', e);
        }
      }
    }

    console.log('=== FUNCTION RESPONSE ===');
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('Error:', error);
    console.log('Error type:', typeof error);
    
    // Extract response body from error context
    let responseBody = null;
    if (error && (error as any).context) {
      const response = (error as any).context as Response;
      if (response) {
        console.log('=== RESPONSE DETAILS ===');
        console.log('Response status:', response.status);
        console.log('Response statusText:', response.statusText);
        console.log('Response URL:', response.url);
        
        // Try to read response body synchronously
        try {
          // Clone the response so we can read it without consuming it
          const clonedResponse = response.clone();
          clonedResponse.text().then((text) => {
            console.log('=== ACTUAL ERROR RESPONSE BODY (async) ===');
            console.log(text);
            try {
              const json = JSON.parse(text);
              console.log('Parsed error JSON:', JSON.stringify(json, null, 2));
              if (json.error) {
                console.error('Error from function:', json.error.message || json.error);
              }
            } catch (e) {
              console.log('Response is not JSON:', text);
            }
          }).catch((e) => {
            console.error('Failed to read response body (async):', e);
          });
        } catch (e) {
          console.error('Could not access response:', e);
        }
      }
    }
    
    if (error) {
      console.error('=== SUPABASE FUNCTION ERROR ===');
      console.error('Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('Error status:', error.status);
      console.error('Error statusCode:', (error as any).statusCode);
      console.error('Error message:', error.message);
      console.error('Error context:', error.context);
      console.error('Error details:', error);
      
      // Try to get the response body synchronously if possible
      let errorMessage = error.message || 'Failed to create portal session';
      
      // Check if data contains error information
      if (data && (data as any).error) {
        const funcError = (data as any).error;
        console.error('Function returned error in data:', funcError);
        errorMessage = funcError.message || funcError.details || errorMessage;
        
        // Check for specific error codes
        if (funcError.code === 'customer_not_found' || funcError.message?.includes('No such customer')) {
          errorMessage = 'Stripe customer not found. Your subscription may need to be recreated. Please contact support.';
        }
      }
      
      // Check for specific error types
      const statusCode = error.status || (error as any).statusCode || ((error as any).context as Response)?.status;
      
      console.error('=== DETERMINED STATUS CODE ===');
      console.error('Status Code:', statusCode);
      
      if (statusCode === 401 || statusCode === 403) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (statusCode === 404) {
        throw new Error('Function not found. Please contact support.');
      } else if (statusCode === 400) {
        const errorMsg = (data as any)?.error?.message || errorMessage || 'Invalid request. Please check your subscription details.';
        throw new Error(errorMsg);
      } else if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
        // For 500 errors, try to get more details from the response
        let detailedMsg = (data as any)?.error?.message || 
                         (data as any)?.error?.details || 
                         errorMessage;
        
        // Check for specific Stripe errors
        if (detailedMsg?.includes('No such customer')) {
          detailedMsg = 'Stripe customer not found. Your subscription may need to be recreated. Please contact support.';
        } else if (detailedMsg?.includes('customer')) {
          detailedMsg = 'Invalid Stripe customer. Please contact support.';
        } else if (detailedMsg?.includes('billing_portal') || detailedMsg?.includes('portal')) {
          detailedMsg = 'Stripe Billing Portal is not activated. Please contact support.';
        }
        
        throw new Error(detailedMsg || 'Server error. Please check Supabase function logs for details.');
      }
      
      throw new Error(errorMessage || `Failed to create portal session (${statusCode || 'unknown'})`);
    }

    if (data?.error) {
      console.error('Function returned error:', data.error);
      const errorMsg = data.error.message || data.error.details || 'Failed to create portal session';
      const errorCode = data.error.code || 'UNKNOWN_ERROR';
      
      // Provide user-friendly messages
      if (errorCode === 'customer_not_found') {
        throw new Error('Your subscription account was not found. Please contact support.');
      } else if (errorCode === 'invalid_customer') {
        throw new Error('Invalid subscription account. Please contact support.');
      } else if (errorCode === 'stripe_auth_error') {
        throw new Error('Payment system error. Please contact support.');
      }
      
      throw new Error(errorMsg);
    }

    const portalUrl = data?.url;
    if (!portalUrl) {
      console.error('No portal URL in response:', data);
      throw new Error('No portal URL returned from server');
    }

    console.log('Got portal URL, redirecting to:', portalUrl);

    // Redirect to Stripe Customer Portal
    window.location.href = portalUrl;
  } catch (error: any) {
    console.error('Portal session error:', error);
    throw error;
  }
}

