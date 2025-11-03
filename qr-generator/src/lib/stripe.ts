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
      
      // If there's an error but data also contains error info, merge them
      if (error && data && (data as any).error) {
        console.log('Both error object and data.error present, using data.error');
        // The data.error might have more details
      }
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
            const parsedData = JSON.parse(errorText);
            data = parsedData;
            // Also set error message if available
            if (parsedData.error) {
              console.log('Extracted error from response:', parsedData.error.message);
            }
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
    
    // Extract response body from error context - SYNCHRONOUSLY
    let responseBody: any = null;
    let errorMessageFromResponse = null;
    
    if (error && (error as any).context) {
      const response = (error as any).context as Response;
      if (response) {
        console.log('=== RESPONSE DETAILS ===');
        console.log('Response status:', response.status);
        console.log('Response statusText:', response.statusText);
        console.log('Response URL:', response.url);
        
        // Try to read response body - we need this synchronously
        try {
          // Clone and try to get text immediately (though this might not work)
          const clonedResponse = response.clone();
          // Store for async logging but also try to use it
          clonedResponse.text().then((text) => {
            console.log('=== ACTUAL ERROR RESPONSE BODY (async) ===');
            console.log(text);
            try {
              const json = JSON.parse(text);
              console.log('Parsed error JSON:', JSON.stringify(json, null, 2));
              if (json.error) {
                console.error('Error from function:', json.error.message || json.error);
                // Store for potential use
                errorMessageFromResponse = json.error.message;
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
    
    // Also check if data already has the error (from the invoke response)
    if (data && (data as any).error) {
      responseBody = (data as any).error;
      errorMessageFromResponse = (data as any).error.message || (data as any).error.details;
      console.log('Error found in data object:', errorMessageFromResponse);
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
      
      // PRIORITIZE: Check if data contains error information FIRST (most reliable)
      if (data && (data as any).error) {
        const funcError = (data as any).error;
        console.error('Function returned error in data:', funcError);
        const funcErrorMessage = funcError.message || funcError.details || '';
        
        if (funcErrorMessage) {
          errorMessage = funcErrorMessage;
          console.log('Using error message from data.error:', errorMessage);
          
          // Check for specific error codes and customize message
          if (funcError.code === 'customer_not_found' || funcErrorMessage.includes('No such customer')) {
            errorMessage = 'Stripe customer not found. Your subscription may need to be recreated. Please contact support.';
          } else if (funcErrorMessage.includes('No configuration provided') || funcErrorMessage.includes('billing portal') || funcErrorMessage.includes('portal')) {
            if (funcErrorMessage.includes('live mode')) {
              errorMessage = 'Stripe Billing Portal is not activated in live mode. Please activate it at: https://dashboard.stripe.com/settings/billing/portal';
            } else if (funcErrorMessage.includes('test mode')) {
              errorMessage = 'Stripe Billing Portal is not activated in test mode. Please activate it at: https://dashboard.stripe.com/test/settings/billing/portal';
            } else {
              errorMessage = 'Stripe Billing Portal is not activated. Please activate it in Stripe Dashboard → Settings → Billing → Customer Portal.';
            }
          }
        }
      } else if (errorMessageFromResponse) {
        // Fallback to async extracted message
        errorMessage = errorMessageFromResponse;
        console.log('Using error message from async response:', errorMessage);
        
        // Apply same error message formatting
        if (errorMessage.includes('No configuration provided') || errorMessage.includes('billing portal') || errorMessage.includes('portal')) {
          if (errorMessage.includes('live mode')) {
            errorMessage = 'Stripe Billing Portal is not activated in live mode. Please activate it at: https://dashboard.stripe.com/settings/billing/portal';
          } else if (errorMessage.includes('test mode')) {
            errorMessage = 'Stripe Billing Portal is not activated in test mode. Please activate it at: https://dashboard.stripe.com/test/settings/billing/portal';
          }
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
        // For 500 errors, use the already-formatted errorMessage (from data.error check above)
        // If errorMessage wasn't set from data.error, try to get more details
        let detailedMsg = errorMessage; // Use already-formatted message
        
        if (detailedMsg === 'Failed to create portal session' || !detailedMsg || detailedMsg === error.message) {
          // Fallback: try to get details if we don't have a formatted message yet
          detailedMsg = (data as any)?.error?.message || 
                       (data as any)?.error?.details || 
                       errorMessage;
          
          // Check for specific Stripe errors
          if (detailedMsg?.includes('No such customer')) {
            detailedMsg = 'Stripe customer not found. Your subscription may need to be recreated. Please contact support.';
          } else if (detailedMsg?.includes('customer')) {
            detailedMsg = 'Invalid Stripe customer. Please contact support.';
          } else if (detailedMsg?.includes('No configuration provided') || detailedMsg?.includes('billing portal') || detailedMsg?.includes('portal')) {
            // Specific error for unactivated Billing Portal
            if (detailedMsg.includes('live mode')) {
              detailedMsg = 'Stripe Billing Portal is not activated in live mode. Please activate it at: https://dashboard.stripe.com/settings/billing/portal';
            } else if (detailedMsg.includes('test mode')) {
              detailedMsg = 'Stripe Billing Portal is not activated in test mode. Please activate it at: https://dashboard.stripe.com/test/settings/billing/portal';
            } else {
              detailedMsg = 'Stripe Billing Portal is not activated. Please activate it in your Stripe Dashboard at Settings → Billing → Customer Portal.';
            }
          }
        }
        
        throw new Error(detailedMsg || 'Server error. Please check Supabase function logs for details.');
      }
      
      throw new Error(errorMessage || `Failed to create portal session (${statusCode || 'unknown'})`);
    }

    // Check for error in data (this happens when function returns error JSON but status is non-2xx)
    if (data?.error) {
      console.error('Function returned error in data:', data.error);
      const errorMsg = data.error.message || data.error.details || 'Failed to create portal session';
      const errorCode = data.error.code || 'UNKNOWN_ERROR';
      
      // Provide user-friendly messages
      if (errorCode === 'customer_not_found') {
        throw new Error('Your subscription account was not found. Please contact support.');
      } else if (errorCode === 'invalid_customer') {
        throw new Error('Invalid subscription account. Please contact support.');
      } else if (errorCode === 'stripe_auth_error') {
        throw new Error('Payment system error. Please contact support.');
      } else if (errorMsg.includes('No configuration provided') || errorMsg.includes('billing portal') || errorMsg.includes('portal')) {
        // Specific error for unactivated Billing Portal - this is the most common issue
        if (errorMsg.includes('live mode')) {
          throw new Error('Stripe Billing Portal is not activated in live mode. Please activate it at: https://dashboard.stripe.com/settings/billing/portal');
        } else if (errorMsg.includes('test mode')) {
          throw new Error('Stripe Billing Portal is not activated in test mode. Please activate it at: https://dashboard.stripe.com/test/settings/billing/portal');
        } else {
          throw new Error('Stripe Billing Portal is not activated. Please activate it at: https://dashboard.stripe.com/settings/billing/portal');
        }
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

