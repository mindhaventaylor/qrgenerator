import { useState, useEffect } from 'react';
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
    title: 'Billing & Subscription - QR Generator AI',
    description: 'Manage your subscription and billing. Simple $5/month pricing with no hidden fees. Cancel anytime.',
    url: 'https://qrgenerator-liart.vercel.app/billing'
  });
  
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchParams] = useSearchParams();

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

  async function loadSubscription() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;
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
      alert('No Stripe customer ID found');
      return;
    }

    setProcessing(true);
    try {
      await createPortalSession(user!.id, subscription.stripe_customer_id);
    } catch (error: any) {
      console.error('Portal error:', error);
      alert(error.message || 'Failed to open subscription management. Please try again.');
      setProcessing(false);
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <Link to="/dashboard" className="text-purple-600 hover:text-purple-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Subscription & Billing</h1>
          <p className="text-gray-600 mb-8 text-lg">
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
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-600 text-white rounded-full p-3">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-purple-900 mb-1">What's Included</h3>
                <p className="text-purple-700">
                  Unlimited QR codes, all types, advanced analytics, and custom branding. 
                  All for a simple $5/month subscription.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-1 max-w-2xl mx-auto gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden ${
                  plan.popular ? 'ring-2 ring-purple-600' : ''
                }`}
              >
                {plan.popular && (
                  <div className="bg-purple-600 text-white text-center py-2 text-sm font-semibold">
                    Monthly Plan
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-800">${plan.price}</span>
                    <span className="text-gray-600 text-xl">/{plan.period}</span>
                  </div>
                  <p className="text-lg text-gray-700 mb-2 font-medium">{plan.billing}</p>
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                  {plan.highlight && (
                    <div className="bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm mb-6">
                      {plan.highlight}
                    </div>
                  )}

                  <button
                    onClick={handleSubscribe}
                    disabled={processing || subscription?.status === 'active'}
                    className={`w-full py-4 rounded-lg font-semibold text-lg transition flex items-center justify-center space-x-2 ${
                      plan.popular
                        ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-purple-400 disabled:cursor-not-allowed'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed'
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

          <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">All Plans Include</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Subscription Info */}
          {subscription?.status === 'active' && (
            <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Current Subscription</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-600 text-white rounded-full p-2">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Active Subscription</p>
                      <p className="text-sm text-gray-600">
                        {subscription.plan_type === 'monthly' ? 'Monthly Plan' : subscription.plan_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold text-green-600 capitalize">{subscription.status}</p>
                  </div>
                </div>

                {subscription.current_period_end && (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Next billing date</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleManageSubscription}
                  disabled={processing}
                  className="w-full flex items-center justify-center space-x-2 py-4 rounded-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white disabled:bg-purple-400 disabled:cursor-not-allowed transition"
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
