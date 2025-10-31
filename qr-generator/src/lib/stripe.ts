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

    console.log('Calling create-portal-session function for user:', userId);

    // Call Supabase Edge Function to create portal session
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: {
        userId,
        stripeCustomerId,
      }
    });

    console.log('Function response:', { data, error });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to create portal session');
    }

    if (data?.error) {
      console.error('Function returned error:', data.error);
      throw new Error(data.error.message || data.error.details || 'Failed to create portal session');
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

