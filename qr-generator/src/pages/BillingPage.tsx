import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { createCheckoutSession, createPortalSession } from '../lib/stripe';
import { useSEO } from '../hooks/useSEO';
import { Check, Loader2, Calendar, Settings } from 'lucide-react';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 5.00,
    period: 'month',
    billing: 'Charged monthly - $5.00/month',
    description: 'All features included',
    popular: true,
    highlight: 'Cancel anytime'
  }
];

const FEATURES = [
  'Unlimited dynamic QR codes',
  'Access to all QR types',
  'Unlimited modifications',
  'Unlimited scans',
  'Multiple download formats',
  'Premium customer support',
  'Cancel anytime'
];

export function BillingPage() {
  useSEO({
    title: 'Billing & Subscription - generatecodeqr',
    description: 'Manage your subscription and billing. Simple $5/month pricing with no hidden fees. Cancel anytime.',
    url: 'https://qrgenerator-liart.vercel.app/billing'
  });
  
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchParams] = useSearchParams();
  const conversionTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    loadSubscription();
    
    // Check for success or canceled query params
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success) {
      // Reload subscription multiple times as webhook processes
      const intervals = [1000, 3000, 5000, 10000]; // Check at 1s, 3s, 5s, 10s
      
      intervals.forEach((delay) => {
        setTimeout(() => {
          loadSubscription();
        }, delay);
      });
    }
  }, [user, searchParams]);

  // Track Google Ads conversion immediately when payment success page loads
  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    
    // Fire conversion immediately on success page load (Google Ads requirement)
    // Don't wait for subscription status - conversion should fire on thank you page
    if (success && sessionId && conversionTrackedRef.current !== sessionId) {
      // Check if we've already tracked this session (prevent duplicates)
      const previouslyTracked = localStorage.getItem('google_ads_conversion_tracked');
      if (previouslyTracked === sessionId) {
        return; // Already tracked
      }
      
      // Method 1: Try to fire conversion via gtag function
      const fireConversion = () => {
        if (window.gtag) {
          // Fire Google Ads conversion event for Purchase
          window.gtag('event', 'conversion', {
            'send_to': 'AW-17675352374/sH8pCJqBsLkbELbyoexB',
            'value': 1.0,
            'currency': 'USD',
            'transaction_id': sessionId
          });
          
          // Fire WhatsApp conversion event
          window.gtag('event', 'conversion', {
            'send_to': 'AW-725659273/xzFKCL3ym60ZEIndgtoC'
          });
          
          // Mark this session as tracked
          conversionTrackedRef.current = sessionId;
          localStorage.setItem('google_ads_conversion_tracked', sessionId);
          
          console.log('Google Ads conversion tracked:', {
            send_to: 'AW-17675352374/sH8pCJqBsLkbELbyoexB',
            value: 1.0,
            currency: 'USD',
            transaction_id: sessionId
          });
          console.log('WhatsApp conversion tracked:', {
            send_to: 'AW-725659273/xzFKCL3ym60ZEIndgtoC'
          });
        } else {
          // Retry after a short delay if gtag isn't loaded yet
          setTimeout(fireConversion, 100);
        }
      };
      
      // Method 2: Also inject inline script as fallback (more reliable for Google Ads)
      // This ensures the conversion fires even if React hasn't fully loaded
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = `
        (function() {
          function fireConversion() {
            if (typeof gtag !== 'undefined') {
              gtag('event', 'conversion', {
                'send_to': 'AW-17675352374/sH8pCJqBsLkbELbyoexB',
                'value': 1.0,
                'currency': 'USD',
                'transaction_id': '${sessionId}'
              });
              gtag('event', 'conversion', {
                'send_to': 'AW-725659273/xzFKCL3ym60ZEIndgtoC'
              });
            } else if (window.dataLayer) {
              // Fallback: push to dataLayer if gtag not available yet
              window.dataLayer.push({
                'event': 'conversion',
                'send_to': 'AW-17675352374/sH8pCJqBsLkbELbyoexB',
                'value': 1.0,
                'currency': 'USD',
                'transaction_id': '${sessionId}'
              });
              window.dataLayer.push({
                'event': 'conversion',
                'send_to': 'AW-725659273/xzFKCL3ym60ZEIndgtoC'
              });
            } else {
              // Retry if neither is available
              setTimeout(fireConversion, 50);
            }
          }
          fireConversion();
        })();
      `;
      document.head.appendChild(script);
      
      // Also try method 1
      fireConversion();
    }
  }, [searchParams]);

  async function loadSubscription() {
    if (!user) return;

    try {
      console.log('=== LOADING SUBSCRIPTION ===');
      console.log('User ID:', user.id);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Subscription query error:', error);
        throw error;
      }
      
      console.log('=== SUBSCRIPTION DATA FROM DB ===');
      console.log('Raw data:', JSON.stringify(data, null, 2));
      console.log('Has stripe_customer_id:', !!data?.stripe_customer_id);
      console.log('stripe_customer_id value:', data?.stripe_customer_id);
      console.log('All subscription fields:', data ? Object.keys(data) : 'null');
      
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    if (!user) {
      alert('Please log in to subscribe');
      return;
    }

    if (subscription?.status === 'active') {
      alert('You already have an active subscription');
      return;
    }

    setProcessing(true);
    try {
      await createCheckoutSession(user.id);
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(error.message || 'Failed to start checkout. Please try again.');
      setProcessing(false);
    }
  }

  async function handleManageSubscription() {
    if (!subscription?.stripe_customer_id) {
      alert('No Stripe customer ID found. Please contact support if this issue persists.');
      return;
    }

    if (!user) {
      alert('You must be logged in to manage your subscription');
      return;
    }

    setProcessing(true);
    
    try {
      console.log('=== MANAGING SUBSCRIPTION ===');
      console.log('User ID:', user.id);
      console.log('Subscription object:', JSON.stringify(subscription, null, 2));
      console.log('Stripe Customer ID from DB:', subscription.stripe_customer_id);
      console.log('Stripe Customer ID type:', typeof subscription.stripe_customer_id);
      console.log('Stripe Customer ID length:', subscription.stripe_customer_id?.length);
      
      await createPortalSession(user.id, subscription.stripe_customer_id);
      // Note: createPortalSession redirects to Stripe Portal, so we don't reset processing here
      // If we reach here, the redirect didn't happen and there was an error
      // But the error should have been thrown, so this is just a safety net
    } catch (error: any) {
      console.error('Portal error:', error);
      const errorMessage = error.message || 'Failed to open subscription management. Please try again.';
      alert(errorMessage);
      setProcessing(false);
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-purple-50">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/dashboard"
            className="text-purple-600 hover:text-purple-700 mb-6 inline-flex items-center text-sm font-medium tracking-wide"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 text-balance">
            Subscription & Billing
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mb-8 sm:mb-10 max-w-3xl text-pretty">
            Simple, transparent pricing at $5/month. Cancel anytime.
          </p>

          {/* Success Message */}
          {searchParams.get('success') && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg mb-6">
              <p className="font-semibold mb-2">Payment successful!</p>
              <p className="text-sm">
                {subscription?.status === 'active' 
                  ? 'Your subscription is now active. You can create QR codes.'
                  : 'Processing your subscription... Please wait a few seconds.'}
              </p>
              {subscription?.status !== 'active' && (
                <button
                  onClick={loadSubscription}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Refresh Status
                </button>
              )}
            </div>
          )}

          {/* Canceled Message */}
          {searchParams.get('canceled') && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-lg mb-6">
              <p>Checkout was canceled. You can try again anytime.</p>
            </div>
          )}


          {/* Pricing Info */}
          <div className="bg-white/80 backdrop-blur-sm border border-purple-100 rounded-2xl p-6 sm:p-8 shadow-lg mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-5 space-y-4 sm:space-y-0">
              <div className="bg-purple-600/90 text-white rounded-full p-3 sm:p-4 w-fit">
                <Check className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-semibold text-purple-900">What's Included</h3>
                <p className="text-purple-700 text-sm sm:text-base leading-relaxed">
                  Unlimited QR codes, all types, advanced analytics, and custom branding. 
                  All for a simple $5/month subscription.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100/60 ${
                  plan.popular ? 'ring-2 ring-purple-600' : ''
                }`}
              >
                {plan.popular && (
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2 text-xs sm:text-sm font-semibold tracking-wide uppercase">
                    Monthly Plan
                  </div>
                )}
                <div className="p-6 sm:p-8">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-4xl sm:text-5xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-600 text-lg sm:text-xl">/{plan.period}</span>
                    </div>
                    <p className="text-base sm:text-lg text-gray-700 font-medium">{plan.billing}</p>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                    {plan.highlight && (
                      <div className="bg-purple-50 text-purple-700 px-4 py-3 rounded-lg text-sm font-medium border border-purple-100 shadow-sm">
                        {plan.highlight}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSubscribe}
                    disabled={processing || subscription?.status === 'active'}
                    className={`w-full mt-6 py-3.5 rounded-xl font-semibold text-base sm:text-lg transition flex items-center justify-center space-x-2 shadow ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:from-purple-400 disabled:to-indigo-400 disabled:cursor-not-allowed'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:bg-gray-200 disabled:cursor-not-allowed'
                    }`}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : subscription?.plan_type === plan.id && subscription?.status === 'active' ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Currently Subscribed</span>
                      </>
                    ) : (
                      <span>Subscribe Now - $5/month</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mt-10 border border-purple-100/60">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-balance">All Plans Include</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Subscription Info */}
          {subscription?.status === 'active' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mt-10 border border-purple-100/60">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Subscription</h2>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                    <div className="bg-purple-600 text-white rounded-full p-2.5">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-base sm:text-lg">Active Subscription</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {subscription.plan_type === 'monthly' ? 'Monthly Plan' : subscription.plan_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 sm:text-right">
                    <p>Status</p>
                    <p className="font-semibold text-green-600 capitalize mt-1">{subscription.status}</p>
                  </div>
                </div>

                {subscription.current_period_end && (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Next billing date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleManageSubscription}
                  disabled={processing}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:from-purple-400 disabled:to-indigo-400 disabled:cursor-not-allowed transition shadow"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Settings className="w-5 h-5" />
                      <span>Manage Subscription</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
