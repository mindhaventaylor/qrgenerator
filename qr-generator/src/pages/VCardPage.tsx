import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import { checkSubscriptionStatus } from '../lib/subscriptionCheck';
import { createCheckoutSession } from '../lib/stripe';
import { getLandingVariantOrDefault } from '../utils/variantUtils';
import { checkoutVariants } from '../utils/checkoutVariants';
import { Check, ArrowRight, QrCode } from 'lucide-react';

interface VCardContent {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  company?: string;
  website?: string;
  address?: string;
}

export function VCardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vcardContent, setVcardContent] = useState<VCardContent | null>(null);
  const [qrName, setQrName] = useState('');
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Get landing page variant for premium theme
  const landingVariant = getLandingVariantOrDefault();
  const usePremiumTheme = landingVariant !== 'control';
  const checkoutConfig = checkoutVariants[landingVariant];

  useSEO({
    title: 'Contact Card - generatecodeqr',
    description: 'View contact information',
  });

  useEffect(() => {
    if (id) {
      loadQRCode();
    } else {
      setError('Invalid QR code ID');
      setLoading(false);
    }
  }, [id]);

  async function loadQRCode() {
    if (!id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('qr_codes')
        .select('content, name, user_id')
        .eq('id', id)
        .eq('type', 'vcard')
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setVcardContent(data.content || {});
        setQrName(data.name || 'Contact');
        
        // Check subscription status of QR code creator
        if (data.user_id) {
          const subscriptionStatus = await checkSubscriptionStatus(data.user_id);
          setHasActiveSubscription(subscriptionStatus.hasActiveSubscription);
        } else {
          setHasActiveSubscription(false);
        }
      } else {
        setError('QR code not found');
      }
    } catch (err: unknown) {
      console.error('Error loading QR code:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contact information');
    } finally {
      setLoading(false);
      setCheckingSubscription(false);
    }
  }

  function downloadVCard() {
    if (!vcardContent) return;

    const vcardName = `${vcardContent.firstName || ''} ${vcardContent.lastName || ''}`.trim() || 'Contact';
    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${vcardName}`,
      vcardContent.phone ? `TEL:${vcardContent.phone}` : '',
      vcardContent.email ? `EMAIL:${vcardContent.email}` : '',
      vcardContent.company ? `ORG:${vcardContent.company}` : '',
      vcardContent.website ? `URL:${vcardContent.website}` : '',
      vcardContent.address ? `ADR:;;${vcardContent.address};;;;` : '',
      'END:VCARD'
    ].filter(line => line);

    const vcard = vcardLines.join('\n');
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${vcardName.replace(/[^a-z0-9]/gi, '_')}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  const vcardName = vcardContent ? `${vcardContent.firstName || ''} ${vcardContent.lastName || ''}`.trim() || 'Contact' : '';
  const initials = vcardContent 
    ? `${(vcardContent.firstName?.[0] || '').toUpperCase()}${(vcardContent.lastName?.[0] || '').toUpperCase()}` 
    : '';

  if (loading || checkingSubscription) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${usePremiumTheme 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800' 
        : 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'
      }`}>
        <div className={`text-xl ${usePremiumTheme ? 'text-white' : 'text-white'}`}>
          Loading contact information...
        </div>
      </div>
    );
  }

  if (error || !vcardContent) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${usePremiumTheme 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800' 
        : 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'
      }`}>
        <div className={`rounded-lg p-8 max-w-md w-full mx-4 ${usePremiumTheme 
          ? 'bg-slate-900/80 border border-white/10' 
          : 'bg-white'
        }`}>
          <h1 className={`text-2xl font-bold mb-4 ${usePremiumTheme ? 'text-white' : 'text-gray-800'}`}>
            Error
          </h1>
          <p className={`mb-6 ${usePremiumTheme ? 'text-white/70' : 'text-gray-600'}`}>
            {error || 'Contact information not found'}
          </p>
          <button
            onClick={() => navigate('/')}
            className={`w-full px-6 py-3 rounded-lg transition ${
              usePremiumTheme
                ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-900'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Show paywall if creator doesn't have active subscription
  if (!hasActiveSubscription) {
    const accentColor = checkoutConfig.heroIconBg.includes('green') ? 'text-green-400' :
                       checkoutConfig.heroIconBg.includes('blue') ? 'text-blue-400' :
                       checkoutConfig.heroIconBg.includes('pink') ? 'text-pink-400' :
                       checkoutConfig.heroIconBg.includes('orange') ? 'text-orange-400' :
                       checkoutConfig.heroIconBg.includes('purple') ? 'text-purple-400' :
                       checkoutConfig.heroIconBg.includes('teal') ? 'text-teal-400' :
                       'text-cyan-400';
    
    return (
      <div className={`min-h-screen ${usePremiumTheme 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white' 
        : 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white'
      } flex items-center justify-center p-4`}>
        {usePremiumTheme && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.08),_transparent_60%)]" />
        )}
        <div className={`relative max-w-2xl w-full rounded-3xl shadow-2xl p-8 sm:p-10 ${
          usePremiumTheme 
            ? 'bg-slate-900/80 border border-white/10' 
            : 'bg-white/10 backdrop-blur-sm border border-white/20'
        }`}>
          <div className="text-center mb-8">
            <QrCode className={`w-16 h-16 mx-auto mb-4 ${usePremiumTheme ? 'text-cyan-400' : 'text-purple-300'}`} />
            <h1 className={`text-3xl sm:text-4xl font-bold mb-4 ${usePremiumTheme ? 'text-white' : 'text-white'}`}>
              Subscribe to View Content
            </h1>
            <p className={`text-lg ${usePremiumTheme ? 'text-white/70' : 'text-white/80'}`}>
              This QR code requires an active subscription to view its content.
            </p>
          </div>

          <div className={`bg-gradient-to-br ${checkoutConfig.benefitsBg} rounded-2xl p-6 mb-6`}>
            <h2 className="text-xl font-bold mb-4 text-center">What You Get</h2>
            <div className="space-y-3">
              {[
                'Unlimited dynamic QR codes',
                'Real-time analytics dashboard',
                'Unlimited scans & tracking',
                'Edit content anytime',
                'Multiple download formats',
                'Priority support'
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <Check className={`w-5 h-5 flex-shrink-0 ${accentColor}`} />
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`border-2 rounded-2xl p-6 mb-6 ${usePremiumTheme 
            ? 'bg-slate-800/60 border-white/10' 
            : 'bg-white/10 border-white/20'
          }`}>
            <div className="text-center mb-4">
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className={`text-4xl font-bold ${usePremiumTheme ? 'text-white' : 'text-white'}`}>
                  $5
                </span>
                <span className={`text-xl ${usePremiumTheme ? 'text-white/70' : 'text-white/80'}`}>
                  /month
                </span>
              </div>
              <p className={usePremiumTheme ? 'text-white/70' : 'text-white/80'}>
                Cancel anytime • No hidden fees
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              setCheckoutLoading(true);
              try {
                // Get the QR code creator's user_id
                const { data } = await supabase
                  .from('qr_codes')
                  .select('user_id')
                  .eq('id', id)
                  .single();
                
                if (data?.user_id) {
                  await createCheckoutSession(data.user_id);
                } else {
                  alert('Unable to find QR code creator. Please contact support.');
                }
              } catch (err: unknown) {
                console.error('Checkout error:', err);
                alert(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
              } finally {
                setCheckoutLoading(false);
              }
            }}
            disabled={checkoutLoading}
            className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl transition shadow-lg bg-gradient-to-r ${checkoutConfig.ctaButtonBg} text-slate-900`}
          >
            {checkoutLoading ? 'Loading...' : 'Subscribe to View - $5/month'}
            {!checkoutLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold mb-4">
            {initials || '?'}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{vcardName}</h1>
          <p className="text-gray-600">Contact Information</p>
        </div>

        <div className="space-y-4 mb-8">
          {vcardContent.phone && (
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white text-2xl mr-4">
                📞
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</div>
                <a
                  href={`tel:${vcardContent.phone}`}
                  className="text-lg text-gray-800 hover:text-purple-600 transition"
                >
                  {vcardContent.phone}
                </a>
              </div>
            </div>
          )}

          {vcardContent.email && (
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white text-2xl mr-4">
                ✉️
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</div>
                <a
                  href={`mailto:${vcardContent.email}`}
                  className="text-lg text-gray-800 hover:text-purple-600 transition break-all"
                >
                  {vcardContent.email}
                </a>
              </div>
            </div>
          )}

          {vcardContent.company && (
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white text-2xl mr-4">
                🏢
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Company</div>
                <div className="text-lg text-gray-800">{vcardContent.company}</div>
              </div>
            </div>
          )}

          {vcardContent.website && (
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white text-2xl mr-4">
                🌐
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Website</div>
                <a
                  href={vcardContent.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg text-gray-800 hover:text-purple-600 transition break-all"
                >
                  {vcardContent.website}
                </a>
              </div>
            </div>
          )}

          {vcardContent.address && (
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white text-2xl mr-4">
                📍
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</div>
                <div className="text-lg text-gray-800">{vcardContent.address}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={downloadVCard}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Save to Contacts
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

