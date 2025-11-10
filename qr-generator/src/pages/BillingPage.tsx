import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { createCheckoutSession, createPortalSession } from '../lib/stripe';
import { useSEO } from '../hooks/useSEO';
import { Check, Loader2, Calendar, Settings, BarChart3, TrendingUp, Users, Zap, Shield, Globe, Download } from 'lucide-react';

const PLANS_STANDARD = [
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

const PLANS_ONETIME = [
  {
    id: 'monthly',
    name: '1 Month of Analytics',
    price: 5.00,
    period: 'one-time',
    billing: 'One-time payment - $5 for 1 month',
    description: 'Full access for 30 days, then $5/month to continue',
    popular: true,
    highlight: 'No commitment - pay once, use for a month'
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
  
  // Get variant from URL (default to 'standard', test with ?variant=onetime)
  const variant = searchParams.get('variant') || 'standard';

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
            {variant === 'onetime' ? 'Get Started - One Month Access' : 'Subscription & Billing'}
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mb-8 sm:mb-10 max-w-3xl text-pretty">
            {variant === 'onetime' 
              ? 'Pay $5 once for full access to analytics and QR code creation for 30 days. Continue for $5/month if you want to keep going—or stop anytime.'
              : 'Simple, transparent pricing at $5/month. Cancel anytime.'}
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


          {/* Visual Benefits Section */}
          <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 rounded-3xl p-8 sm:p-12 mb-10 text-white shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Get</h2>
              <p className="text-purple-100 text-lg max-w-2xl mx-auto">
                {variant === 'onetime'
                  ? 'See exactly what your $5 unlocks—powerful analytics, unlimited QR codes, and professional features for 30 days.'
                  : 'See exactly what your $5/month unlocks—powerful analytics, unlimited QR codes, and professional features.'}
              </p>
            </div>

            {/* Dashboard Preview */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 mb-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6" />
                <h3 className="text-xl font-semibold">Real-Time Analytics Dashboard</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold mb-1">12.4K</div>
                  <div className="text-sm text-purple-100">Total Scans</div>
                  <div className="text-xs text-green-300 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +24% this month
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold mb-1">847</div>
                  <div className="text-sm text-purple-100">QR Codes</div>
                  <div className="text-xs text-purple-200 mt-1">Active campaigns</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold mb-1">68%</div>
                  <div className="text-sm text-purple-100">Mobile Users</div>
                  <div className="text-xs text-purple-200 mt-1">Most common device</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold mb-1">42%</div>
                  <div className="text-sm text-purple-100">Click Rate</div>
                  <div className="text-xs text-green-300 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Above average
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-100">Top Performing QR Code</span>
                  <span className="font-semibold">Restaurant Menu QR</span>
                </div>
                <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <div className="mt-2 text-xs text-purple-200">3,240 scans in the last 30 days</div>
              </div>
            </div>

            {/* Feature Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <Globe className="w-8 h-8 mb-3 text-purple-200" />
                <h4 className="font-semibold mb-2">Unlimited QR Codes</h4>
                <p className="text-sm text-purple-100">Create as many QR codes as you need. No limits, no restrictions.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <BarChart3 className="w-8 h-8 mb-3 text-purple-200" />
                <h4 className="font-semibold mb-2">Advanced Analytics</h4>
                <p className="text-sm text-purple-100">Track scans, locations, devices, and engagement in real-time.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <Zap className="w-8 h-8 mb-3 text-purple-200" />
                <h4 className="font-semibold mb-2">Dynamic Updates</h4>
                <p className="text-sm text-purple-100">Change QR code content anytime without reprinting.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <Download className="w-8 h-8 mb-3 text-purple-200" />
                <h4 className="font-semibold mb-2">Multiple Formats</h4>
                <p className="text-sm text-purple-100">Download as PNG, SVG, PDF, or EPS for any use case.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <Shield className="w-8 h-8 mb-3 text-purple-200" />
                <h4 className="font-semibold mb-2">Enterprise Security</h4>
                <p className="text-sm text-purple-100">Bank-level encryption and privacy-first tracking.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <Users className="w-8 h-8 mb-3 text-purple-200" />
                <h4 className="font-semibold mb-2">Priority Support</h4>
                <p className="text-sm text-purple-100">Get help when you need it with dedicated support.</p>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="bg-white/80 backdrop-blur-sm border border-purple-100 rounded-2xl p-6 sm:p-8 shadow-lg mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-5 space-y-4 sm:space-y-0">
              <div className="bg-purple-600/90 text-white rounded-full p-3 sm:p-4 w-fit">
                <Check className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-semibold text-purple-900">What's Included</h3>
                <p className="text-purple-700 text-sm sm:text-base leading-relaxed">
                  {variant === 'onetime' ? (
                    <>
                      Unlimited QR codes, all types, advanced analytics, and custom branding. 
                      Pay $5 once for 30 days of full access. Continue for $5/month if you want to keep going.
                    </>
                  ) : (
                    <>
                      Unlimited QR codes, all types, advanced analytics, and custom branding. 
                      All for a simple $5/month subscription.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {(variant === 'onetime' ? PLANS_ONETIME : PLANS_STANDARD).map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100/60 ${
                  plan.popular ? 'ring-2 ring-purple-600' : ''
                }`}
              >
                {plan.popular && (
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2 text-xs sm:text-sm font-semibold tracking-wide uppercase">
                    {variant === 'onetime' ? 'Try It Once' : 'Monthly Plan'}
                  </div>
                )}
                <div className="p-6 sm:p-8">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-4xl sm:text-5xl font-bold text-gray-900">${plan.price}</span>
                      {variant === 'onetime' ? (
                        <span className="text-gray-600 text-lg sm:text-xl">one-time</span>
                      ) : (
                        <span className="text-gray-600 text-lg sm:text-xl">/{plan.period}</span>
                      )}
                    </div>
                    <p className="text-base sm:text-lg text-gray-700 font-medium">{plan.billing}</p>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                    {plan.highlight && (
                      <div className={`px-4 py-3 rounded-lg text-sm font-medium border shadow-sm ${
                        variant === 'onetime' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-purple-50 text-purple-700 border-purple-100'
                      }`}>
                        {variant === 'onetime' ? (
                          <div>
                            <div className="font-bold mb-1">✓ One-time payment - No recurring charges</div>
                            <div className="text-xs opacity-80">After 30 days, you can choose to continue for $5/month or stop</div>
                          </div>
                        ) : (
                          plan.highlight
                        )}
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
                      <span>{variant === 'onetime' ? 'Get Started - $5 One-Time' : 'Subscribe Now - $5/month'}</span>
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
