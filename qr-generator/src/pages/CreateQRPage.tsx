import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createQRCode, uploadFile, buildQRData, QRContent } from '../lib/qrGenerator';
import { checkSubscriptionStatus } from '../lib/subscriptionCheck';
import { createCheckoutSession } from '../lib/stripe';
import { useSEO } from '../hooks/useSEO';
import { getLandingVariantOrDefault } from '../utils/variantUtils';
import { checkoutVariants } from '../utils/checkoutVariants';
import {
  Globe,
  FileText,
  Image,
  Video,
  Wifi,
  Menu as MenuIcon,
  Briefcase,
  User,
  Music,
  Smartphone,
  Link as LinkIcon,
  Ticket,
  Facebook,
  Instagram,
  Share2,
  MessageCircle,
  ArrowLeft,
  ArrowRight,
  Smartphone as Phone,
  BarChart3,
  TrendingUp,
  Zap,
  Shield,
  Download,
  Check,
  Palette,
  Settings,
  QrCode
} from 'lucide-react';

const QR_TYPES = [
  { id: 'website', name: 'Website', icon: Globe, description: 'Link to any website URL' },
  { id: 'pdf', name: 'PDF', icon: FileText, description: 'Show a PDF' },
  { id: 'images', name: 'Images', icon: Image, description: 'Share multiple images' },
  { id: 'video', name: 'Video', icon: Video, description: 'Show a video' },
  { id: 'wifi', name: 'WiFi', icon: Wifi, description: 'Connect to a Wi-Fi network' },
  { id: 'menu', name: 'Menu', icon: MenuIcon, description: 'Create a restaurant menu' },
  { id: 'business', name: 'Business', icon: Briefcase, description: 'Share business information' },
  { id: 'vcard', name: 'vCard', icon: User, description: 'Share a digital business card' },
  { id: 'mp3', name: 'MP3', icon: Music, description: 'Share an audio file' },
  { id: 'apps', name: 'Apps', icon: Smartphone, description: 'Redirect to an app store' },
  { id: 'links', name: 'List of Links', icon: LinkIcon, description: 'Share multiple links' },
  { id: 'coupon', name: 'Coupon', icon: Ticket, description: 'Share a coupon' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, description: 'Share your Facebook page' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, description: 'Share your Instagram' },
  { id: 'social', name: 'Social Media', icon: Share2, description: 'Share your social channels' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, description: 'Get WhatsApp messages' },
];

export function CreateQRPage() {
  useSEO({
    title: 'Create QR Code - generatecodeqr',
    description: 'Create custom QR codes for websites, vCard, WiFi, social media, and more. Dynamic QR codes with analytics tracking.',
    url: 'https://qrgenerator-liart.vercel.app/create-qr'
  });
  
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [qrName, setQrName] = useState('');
  const [content, setContent] = useState<QRContent>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [canCreateQR, setCanCreateQR] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [enableTracking, setEnableTracking] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState(''); // Generated QR code image URL
  const [showPaywall, setShowPaywall] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get landing page variant from cookie to apply premium theme and checkout design
  const landingVariant = getLandingVariantOrDefault();
  const usePremiumTheme = landingVariant !== 'control';
  const checkoutConfig = checkoutVariants[landingVariant];
  
  // Icon mapping for checkout features
  const getCheckoutIcon = (iconName: string) => {
    switch (iconName) {
      case 'qr': return QrCode;
      case 'palette': return Palette;
      case 'analytics': return BarChart3;
      case 'settings': return Settings;
      case 'shield': return Shield;
      case 'zap': return Zap;
      case 'download': return Download;
      default: return Check;
    }
  };
  
  // Hero icon mapping
  const getHeroIcon = (iconName: string) => {
    switch (iconName) {
      case 'check': return Check;
      case 'zap': return Zap;
      case 'palette': return Palette;
      case 'ticket': return Ticket;
      case 'bar-chart': return BarChart3;
      default: return Check;
    }
  };

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'images' | 'video' | 'mp3') {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);

    try {
      const publicUrl = await uploadFile(file, user.id, 'documents');
      setUploadProgress(`Upload complete!`);
      
      // Update content with the uploaded file URL
      if (type === 'pdf') {
        setContent({ ...content, url: publicUrl, pdfUrl: publicUrl });
      } else if (type === 'images') {
        setContent({ ...content, url: publicUrl, imageUrl: publicUrl });
      } else if (type === 'video') {
        setContent({ ...content, url: publicUrl, videoUrl: publicUrl });
      } else if (type === 'mp3') {
        setContent({ ...content, url: publicUrl, audioUrl: publicUrl });
      }
      
      setTimeout(() => {
        setUploadProgress('');
        setUploading(false);
      }, 2000);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to upload file');
      setUploadProgress('');
      setUploading(false);
    }
  }

  // Check for payment success/cancel in URL params
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      // Payment successful - verify subscription and show success message
      if (user) {
        checkSubscriptionStatus(user.id).then(status => {
          setCanCreateQR(status.canCreateQR);
          setSubscriptionMessage(status.canCreateQR 
            ? 'Payment successful! Your subscription is now active. You can now save your QR code.' 
            : 'Payment processing... Please wait a moment.');
          setSubscriptionChecked(true);
          // Remove the payment parameter from URL
          searchParams.delete('payment');
          searchParams.delete('session_id');
          setSearchParams(searchParams, { replace: true });
        });
      }
    } else if (paymentStatus === 'canceled') {
      // Payment canceled - explicitly verify subscription is NOT active
      if (user) {
        checkSubscriptionStatus(user.id).then(status => {
          // Explicitly set to false - no subscription means no access
          setCanCreateQR(false);
          setSubscriptionMessage('Checkout was canceled. Please subscribe to unlock QR codes.');
          setSubscriptionChecked(true);
          setError('Payment was canceled. You can try again when ready.');
          // Remove the payment parameter from URL
          searchParams.delete('payment');
          searchParams.delete('session_id');
          setSearchParams(searchParams, { replace: true });
        });
      } else {
        setError('Payment was canceled. You can try again when ready.');
        searchParams.delete('payment');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, user]);

  useEffect(() => {
    // Only check subscription when user tries to save (not blocking the build process)
    async function verifySubscription() {
      if (!user) {
        setSubscriptionChecked(true);
        setCanCreateQR(false);
        setSubscriptionMessage('Please log in to save QR codes');
        return;
      }

      const status = await checkSubscriptionStatus(user.id);
      setCanCreateQR(status.canCreateQR);
      setSubscriptionMessage(status.message || '');
      setSubscriptionChecked(true);
    }

    verifySubscription();
    
    // Re-check subscription status every 5 seconds if not active (only when on paywall step)
    // Only check if subscription was already verified (to avoid race conditions with canceled payments)
    const interval = setInterval(async () => {
      if (user && step === 3 && !canCreateQR && subscriptionChecked) {
        const status = await checkSubscriptionStatus(user.id);
        // Double-check: only set to true if status is explicitly active
        if (status.canCreateQR && status.hasActiveSubscription) {
          setCanCreateQR(true);
          setSubscriptionMessage('Payment successful! Your subscription is now active.');
          clearInterval(interval);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, canCreateQR, step]);

  useEffect(() => {
    // Only auto-close paywall if subscription is verified as active
    if (canCreateQR && showPaywall && subscriptionChecked) {
      setShowPaywall(false);
      setStep(2);
    }
  }, [canCreateQR, showPaywall, subscriptionChecked]);

  // Generate Live Preview QR code when in step 2 and content changes
  useEffect(() => {
    if (step === 2 && selectedType && content) {
      try {
        // Build QR data without tracking (for preview)
        const qrData = buildQRData(selectedType, content);
        
        // Only generate preview if there's valid data
        if (qrData && qrData.trim() !== '') {
          const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&format=png`;
          setPreviewUrl(qrApiUrl);
        } else {
          setPreviewUrl('');
        }
      } catch (error) {
        console.error('Error generating preview:', error);
        setPreviewUrl('');
      }
    } else {
      setPreviewUrl('');
    }
  }, [step, selectedType, content]);

  // Generate QR code preview for step 3 (subscription page)
  useEffect(() => {
    if (step === 3 && !qrCodeImageUrl && selectedType && content) {
      try {
        const qrData = buildQRData(selectedType, content);
        if (qrData && qrData.trim() !== '') {
          const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}&format=png`;
          setQrCodeImageUrl(qrApiUrl);
        }
      } catch (error) {
        console.error('Error generating QR preview:', error);
      }
    }
  }, [step, selectedType, content, qrCodeImageUrl]);

  async function handleCreateQR() {
    if (!user) {
      setError('You must be logged in to create QR codes');
      return;
    }

    // Validate content based on type
    if (selectedType === 'website' && !content.url) {
      setError('Please enter a website URL');
      return;
    }
    if (selectedType === 'pdf' && !content.url && !content.pdfUrl) {
      setError('Please enter a PDF URL');
      return;
    }
    if (selectedType === 'images' && !content.url && !content.imageUrl && !content.images?.[0]?.url) {
      setError('Please enter at least one image URL');
      return;
    }
    if (selectedType === 'video' && !content.url && !content.videoUrl) {
      setError('Please enter a video URL');
      return;
    }
    if (selectedType === 'vcard' && (!content.firstName || !content.phone)) {
      setError('Please fill in at least first name and phone number');
      return;
    }
    if (selectedType === 'wifi' && (!content.ssid || !content.password)) {
      setError('Please enter WiFi network name and password');
      return;
    }
    if (selectedType === 'whatsapp' && !content.phone) {
      setError('Please enter a phone number');
      return;
    }
    if (selectedType === 'facebook' && !content.pageId) {
      setError('Please enter a Facebook page ID or username');
      return;
    }
    if (selectedType === 'instagram' && !content.username) {
      setError('Please enter an Instagram username');
      return;
    }
    if (selectedType === 'social' && !content.url && !content.facebookUrl && !content.instagramUrl) {
      setError('Please enter at least one social media URL');
      return;
    }
    if (selectedType === 'links' && (!content.links || content.links.length === 0)) {
      setError('Please add at least one link');
      return;
    }
    if (selectedType === 'menu' && !content.url && !content.menuUrl) {
      setError('Please enter a menu URL');
      return;
    }
    if (selectedType === 'business' && !content.url && !content.website && !content.phone) {
      setError('Please enter at least a website URL or phone number');
      return;
    }
    if (selectedType === 'mp3' && !content.url && !content.audioUrl) {
      setError('Please enter an audio file URL');
      return;
    }
    if (selectedType === 'apps' && !content.appId) {
      setError('Please enter an app ID');
      return;
    }
    if (selectedType === 'coupon' && !content.url && !content.code && !content.text) {
      setError('Please enter a coupon code, URL, or text');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Always create QR code, even without subscription
      const result = await createQRCode(
        user.id,
        qrName || `${selectedType} QR Code`,
        selectedType,
        content,
        undefined,
        undefined,
        enableTracking
      );
      
      // Generate QR code preview for step 3
      try {
        const qrData = buildQRData(selectedType, content);
        if (qrData && qrData.trim() !== '') {
          const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}&format=png`;
          setQrCodeImageUrl(qrApiUrl);
        }
      } catch (err) {
        console.error('Error generating QR preview:', err);
      }
      
      // Always show step 3 (paywall if no subscription, success message if has subscription)
      setShowPaywall(true);
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create QR code. Please try again.');
      console.error('QR creation error:', err);
    } finally {
      setLoading(false);
    }
  }

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Select a type of QR code</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QR_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id);
                    setStep(2);
                  }}
                  className="p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:shadow-lg transition text-center"
                >
                  <Icon className="w-10 h-10 mx-auto mb-3 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 mb-1">{type.name}</h3>
                  <p className="text-xs text-gray-600">{type.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Content</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Name</label>
              <input
                type="text"
                value={qrName}
                onChange={(e) => setQrName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter a name for your QR code"
              />
            </div>

            {selectedType === 'website' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                <input
                  type="url"
                  value={content.url || ''}
                  onChange={(e) => setContent({ ...content, url: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com"
                />
              </div>
            )}

            {selectedType === 'vcard' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={content.firstName || ''}
                      onChange={(e) => setContent({ ...content, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={content.lastName || ''}
                      onChange={(e) => setContent({ ...content, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={content.phone || ''}
                    onChange={(e) => setContent({ ...content, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={content.email || ''}
                    onChange={(e) => setContent({ ...content, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company (optional)</label>
                  <input
                    type="text"
                    value={content.company || ''}
                    onChange={(e) => setContent({ ...content, company: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website (optional)</label>
                  <input
                    type="url"
                    value={content.website || ''}
                    onChange={(e) => setContent({ ...content, website: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address (optional)</label>
                  <input
                    type="text"
                    value={content.address || ''}
                    onChange={(e) => setContent({ ...content, address: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </>
            )}

            {selectedType === 'wifi' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Network Name (SSID)</label>
                  <input
                    type="text"
                    value={content.ssid || ''}
                    onChange={(e) => setContent({ ...content, ssid: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="MyWiFi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="text"
                    value={content.password || ''}
                    onChange={(e) => setContent({ ...content, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="WiFi password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Encryption</label>
                  <select
                    value={content.encryption || 'WPA'}
                    onChange={(e) => setContent({ ...content, encryption: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None</option>
                  </select>
                </div>
              </>
            )}

            {selectedType === 'whatsapp' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={content.phone || ''}
                    onChange={(e) => setContent({ ...content, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pre-filled Message (optional)</label>
                  <textarea
                    value={content.message || ''}
                    onChange={(e) => setContent({ ...content, message: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Hello!"
                  />
                </div>
              </>
            )}

            {selectedType === 'facebook' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Page ID or Username</label>
                <input
                  type="text"
                  value={content.pageId || ''}
                  onChange={(e) => setContent({ ...content, pageId: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="yourpage"
                />
              </div>
            )}

            {selectedType === 'instagram' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Username</label>
                <input
                  type="text"
                  value={content.username || ''}
                  onChange={(e) => setContent({ ...content, username: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="@yourusername"
                />
              </div>
            )}

            {selectedType === 'pdf' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF</label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handleFileUpload(e, 'pdf')}
                    disabled={uploading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  />
                  {uploadProgress && (
                    <p className="text-sm text-green-600 mt-2">{uploadProgress}</p>
                  )}
                </div>
                  <div className="flex items-center">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-4 text-sm text-gray-500">OR</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PDF URL</label>
                  <input
                    type="url"
                    value={content.url || content.pdfUrl || ''}
                    onChange={(e) => setContent({ ...content, url: e.target.value, pdfUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/document.pdf"
                  />
                </div>
              </div>
            )}

            {selectedType === 'images' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'images')}
                    disabled={uploading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  />
                  {uploadProgress && (
                    <p className="text-sm text-green-600 mt-2">{uploadProgress}</p>
                  )}
                </div>
                  <div className="flex items-center">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-4 text-sm text-gray-500">OR</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    type="url"
                    value={content.url || content.imageUrl || ''}
                    onChange={(e) => setContent({ ...content, url: e.target.value, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-600 mt-1">Enter URL to first image (more images can be added later)</p>
                </div>
              </div>
            )}

            {selectedType === 'video' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Video</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, 'video')}
                    disabled={uploading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  />
                  {uploadProgress && (
                    <p className="text-sm text-green-600 mt-2">{uploadProgress}</p>
                  )}
                </div>
                  <div className="flex items-center">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-4 text-sm text-gray-500">OR</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                  <input
                    type="url"
                    value={content.url || content.videoUrl || ''}
                    onChange={(e) => setContent({ ...content, url: e.target.value, videoUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              </div>
            )}

            {selectedType === 'menu' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Menu URL</label>
                <input
                  type="url"
                  value={content.url || content.menuUrl || ''}
                  onChange={(e) => setContent({ ...content, url: e.target.value, menuUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com/menu"
                />
              </div>
            )}

            {selectedType === 'business' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={content.businessName || ''}
                    onChange={(e) => setContent({ ...content, businessName: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="My Business"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                  <input
                    type="url"
                    value={content.url || content.website || ''}
                    onChange={(e) => setContent({ ...content, url: e.target.value, website: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://mybusiness.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={content.phone || ''}
                    onChange={(e) => setContent({ ...content, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="+1234567890"
                  />
                </div>
              </>
            )}

            {selectedType === 'mp3' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Audio File</label>
                  <input
                    type="file"
                    accept="audio/*,.mp3"
                    onChange={(e) => handleFileUpload(e, 'mp3')}
                    disabled={uploading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  />
                  {uploadProgress && (
                    <p className="text-sm text-green-600 mt-2">{uploadProgress}</p>
                  )}
                </div>
                  <div className="flex items-center">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-4 text-sm text-gray-500">OR</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Audio File URL</label>
                  <input
                    type="url"
                    value={content.url || content.audioUrl || ''}
                    onChange={(e) => setContent({ ...content, url: e.target.value, audioUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/audio.mp3"
                  />
                </div>
              </div>
            )}

            {selectedType === 'apps' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">App Store</label>
                  <select
                    value={content.store || 'ios'}
                    onChange={(e) => setContent({ ...content, store: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="ios">Apple App Store</option>
                    <option value="android">Google Play Store</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">App ID</label>
                  <input
                    type="text"
                    value={content.appId || ''}
                    onChange={(e) => setContent({ ...content, appId: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="123456789"
                  />
                  <p className="text-xs text-gray-600 mt-1">Enter the app ID from the store</p>
                </div>
              </>
            )}

            {selectedType === 'coupon' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code</label>
                  <input
                    type="text"
                    value={content.code || ''}
                    onChange={(e) => setContent({ ...content, code: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="SAVE20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Coupon URL (optional)</label>
                  <input
                    type="url"
                    value={content.url || ''}
                    onChange={(e) => setContent({ ...content, url: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/redeem"
                  />
                </div>
              </>
            )}

            {selectedType === 'social' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL (optional)</label>
                  <input
                    type="url"
                    value={content.facebookUrl || ''}
                    onChange={(e) => setContent({ ...content, facebookUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL (optional)</label>
                  <input
                    type="url"
                    value={content.instagramUrl || ''}
                    onChange={(e) => setContent({ ...content, instagramUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://instagram.com/yourprofile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter/X URL (optional)</label>
                  <input
                    type="url"
                    value={content.twitterUrl || ''}
                    onChange={(e) => setContent({ ...content, twitterUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary URL</label>
                  <input
                    type="url"
                    value={content.url || ''}
                    onChange={(e) => setContent({ ...content, url: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://yourwebsite.com"
                  />
                  <p className="text-xs text-gray-600 mt-1">Enter at least one social media URL or your website</p>
                </div>
              </>
            )}

            {selectedType === 'links' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Links Collection
                  </label>
                  
                  {(content.links || []).length > 0 && (
                    <div className="space-y-3 mb-4">
                      {content.links.map((link: { url: string; title: string }, index: number) => (
                        <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {link.title || `Link ${index + 1}`}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {link.url}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedLinks = (content.links as Array<{ url: string; title: string }>).filter((_, i: number) => i !== index);
                              setContent({ ...content, links: updatedLinks });
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-purple-50">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Add New Link</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Link Title (optional)
                        </label>
                        <input
                          type="text"
                          id="new-link-title"
                          placeholder="e.g., My Website"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          URL *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            id="new-link-url"
                            placeholder="https://example.com"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white text-gray-900"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const titleInput = document.getElementById('new-link-title') as HTMLInputElement;
                              const urlInput = document.getElementById('new-link-url') as HTMLInputElement;
                              
                              if (!urlInput.value.trim()) {
                                setError('Please enter a URL');
                                return;
                              }
                              
                              let formattedUrl = urlInput.value.trim();
                              if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
                                formattedUrl = `https://${formattedUrl}`;
                              }
                              
                              const currentLinks = content.links || [];
                              const newLink = {
                                title: titleInput.value.trim() || formattedUrl,
                                url: formattedUrl
                              };
                              
                              // Check for duplicates
                              if (currentLinks.some((link: { url: string }) => link.url === formattedUrl)) {
                                setError('This link already exists!');
                                return;
                              }
                              
                              setContent({
                                ...content,
                                links: [...currentLinks, newLink]
                              });
                              
                              // Clear inputs
                              titleInput.value = '';
                              urlInput.value = '';
                              setError('');
                            }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      💡 Add multiple links to create a links collection QR code
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Tracking Toggle */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-medium text-gray-900">Enable Analytics Tracking</span>
                  <p className="text-sm text-gray-600 mt-1">
                    Track scans, views, and user analytics for this QR code
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={enableTracking}
                    onChange={(e) => setEnableTracking(e.target.checked)}
                    className="w-12 h-6 rounded-full bg-gray-300 checked:bg-purple-600 transition relative appearance-none cursor-pointer
                    before:absolute before:left-1 before:top-1 before:w-4 before:h-4 before:bg-white before:rounded-full before:transition-all
                    checked:before:left-7"
                  />
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-6">
              <button
                onClick={() => setStep(1)}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleCreateQR}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition"
              >
                {loading ? 'Creating...' : 'Generate QR Code'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (step === 3) {
      const HeroIcon = getHeroIcon(checkoutConfig.heroIcon);
      const isSplitLayout = checkoutConfig.layout === 'split';
      const isStackedLayout = checkoutConfig.layout === 'stacked';
      
      // Extract accent color from heroIconBg for checkmarks
      const accentColor = checkoutConfig.heroIconBg.includes('green') ? 'text-green-400' :
                         checkoutConfig.heroIconBg.includes('blue') ? 'text-blue-400' :
                         checkoutConfig.heroIconBg.includes('pink') ? 'text-pink-400' :
                         checkoutConfig.heroIconBg.includes('orange') ? 'text-orange-400' :
                         checkoutConfig.heroIconBg.includes('purple') ? 'text-purple-400' :
                         checkoutConfig.heroIconBg.includes('teal') ? 'text-teal-400' :
                         'text-cyan-400';
      
      // Pricing badge color
      const badgeColor = checkoutConfig.heroIconBg.includes('green') ? 'bg-green-900/50 text-green-300' :
                        checkoutConfig.heroIconBg.includes('blue') ? 'bg-blue-900/50 text-blue-300' :
                        checkoutConfig.heroIconBg.includes('pink') ? 'bg-pink-900/50 text-pink-300' :
                        checkoutConfig.heroIconBg.includes('orange') ? 'bg-orange-900/50 text-orange-300' :
                        checkoutConfig.heroIconBg.includes('purple') ? 'bg-purple-900/50 text-purple-300' :
                        checkoutConfig.heroIconBg.includes('teal') ? 'bg-teal-900/50 text-teal-300' :
                        'bg-cyan-900/50 text-cyan-300';
      
      // Message box color
      const messageColor = checkoutConfig.heroIconBg.includes('green') ? 'bg-green-900/50 border border-green-500/50 text-green-300' :
                          checkoutConfig.heroIconBg.includes('blue') ? 'bg-blue-900/50 border border-blue-500/50 text-blue-300' :
                          checkoutConfig.heroIconBg.includes('pink') ? 'bg-pink-900/50 border border-pink-500/50 text-pink-300' :
                          checkoutConfig.heroIconBg.includes('orange') ? 'bg-orange-900/50 border border-orange-500/50 text-orange-300' :
                          checkoutConfig.heroIconBg.includes('purple') ? 'bg-purple-900/50 border border-purple-500/50 text-purple-300' :
                          checkoutConfig.heroIconBg.includes('teal') ? 'bg-teal-900/50 border border-teal-500/50 text-teal-300' :
                          'bg-cyan-900/50 border border-cyan-500/50 text-cyan-300';
      
      if (isSplitLayout) {
        // Split layout: Benefits on left, Pricing on right
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-gradient-to-br ${checkoutConfig.heroIconBg}`}>
                <HeroIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className={`text-4xl font-bold ${usePremiumTheme ? 'text-white' : 'text-gray-900'}`}>
                {checkoutConfig.heroTitle}
              </h2>
              <p className={`text-lg max-w-2xl mx-auto ${usePremiumTheme ? 'text-white/70' : 'text-gray-600'}`}>
                {checkoutConfig.heroDescription}
              </p>
            </div>

            {/* QR Code Preview with Blur if no subscription */}
            {qrCodeImageUrl && (
              <div className="flex justify-center">
                <div className={`relative rounded-2xl p-6 ${usePremiumTheme ? 'bg-slate-900/60 border border-white/10' : 'bg-white border border-gray-200'}`}>
                  <h3 className={`text-lg font-semibold mb-4 text-center ${usePremiumTheme ? 'text-white' : 'text-gray-900'}`}>
                    Your QR Code Preview
                  </h3>
                  <div className="relative inline-block">
                    <img
                      src={qrCodeImageUrl}
                      alt="QR Code Preview"
                      className={`w-64 h-64 object-contain transition ${!canCreateQR ? 'blur-md' : ''}`}
                    />
                    {!canCreateQR && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`text-center px-4 py-2 rounded-lg ${usePremiumTheme ? 'bg-slate-800/90 text-white' : 'bg-white/90 text-gray-900'}`}>
                          <p className="text-sm font-semibold">Subscribe to unlock</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Split Layout: Benefits Left, Pricing Right */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Benefits Section - Left */}
              <div className={`bg-gradient-to-br ${checkoutConfig.benefitsBg} rounded-3xl p-8 text-white shadow-2xl`}>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{checkoutConfig.benefitsTitle}</h3>
                  <p className="text-white/80">{checkoutConfig.benefitsDescription}</p>
                </div>
                <div className="space-y-4">
                  {checkoutConfig.features.map((feature, index) => {
                    const FeatureIcon = getCheckoutIcon(feature.icon);
                    return (
                      <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-start gap-3">
                          <FeatureIcon className="w-6 h-6 text-white/90 flex-shrink-0 mt-1" />
                          <div>
                            <h4 className="font-semibold mb-1">{feature.title}</h4>
                            <p className="text-sm text-white/80">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pricing Section - Right */}
              <div className={`border-2 rounded-2xl p-8 shadow-xl ${checkoutConfig.pricingCardBg} ${checkoutConfig.pricingCardBorder}`}>
                <div className="text-center mb-6">
                  <div className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${badgeColor}`}>
                    {checkoutConfig.pricingTitle}
                  </div>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className={`text-5xl font-bold ${usePremiumTheme ? 'text-white' : 'text-gray-900'}`}>
                      $5
                    </span>
                    <span className={`text-xl ${usePremiumTheme ? 'text-white/70' : 'text-gray-600'}`}>
                      /month
                    </span>
                  </div>
                  <p className={usePremiumTheme ? 'text-white/70' : 'text-gray-600'}>
                    {checkoutConfig.pricingDescription}
                  </p>
                </div>

                <div className="space-y-3 mb-8">
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
                      <span className={usePremiumTheme ? 'text-white' : 'text-gray-900'}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {subscriptionMessage && (
                  <div className={`rounded-xl p-4 text-sm mb-6 ${messageColor}`}>
                    {subscriptionMessage}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={async () => {
                      if (!user) {
                        setError('Please log in to subscribe');
                        navigate('/login');
                        return;
                      }
                      
                      setCheckoutLoading(true);
                      setError('');
                      
                      try {
                        await createCheckoutSession(user.id);
                      } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
                        setCheckoutLoading(false);
                        console.error('Checkout error:', err);
                      }
                    }}
                    disabled={checkoutLoading}
                    className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl transition shadow-lg bg-gradient-to-r ${checkoutConfig.ctaButtonBg} text-slate-900`}
                  >
                    {checkoutLoading ? 'Loading...' : checkoutConfig.ctaLabel}
                    {!checkoutLoading && <ArrowRight className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => {
                      setShowPaywall(false);
                      setStep(2);
                    }}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 border-2 rounded-xl transition font-semibold ${
                      usePremiumTheme 
                        ? 'border-white/20 hover:bg-white/10 text-white' 
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Continue Editing
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      if (isStackedLayout) {
        // Stacked layout: Larger elements, more vertical spacing
        return (
          <div className="space-y-10">
            {/* Hero Section - Larger */}
            <div className="text-center space-y-6">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 bg-gradient-to-br ${checkoutConfig.heroIconBg}`}>
                <HeroIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className={`text-5xl font-bold ${usePremiumTheme ? 'text-white' : 'text-gray-900'}`}>
                {checkoutConfig.heroTitle}
              </h2>
              <p className={`text-xl max-w-3xl mx-auto ${usePremiumTheme ? 'text-white/70' : 'text-gray-600'}`}>
                {checkoutConfig.heroDescription}
              </p>
            </div>

            {/* QR Code Preview with Blur if no subscription */}
            {qrCodeImageUrl && (
              <div className="flex justify-center">
                <div className={`relative rounded-2xl p-8 ${usePremiumTheme ? 'bg-slate-900/60 border border-white/10' : 'bg-white border border-gray-200'}`}>
                  <h3 className={`text-xl font-semibold mb-6 text-center ${usePremiumTheme ? 'text-white' : 'text-gray-900'}`}>
                    Your QR Code Preview
                  </h3>
                  <div className="relative inline-block">
                    <img
                      src={qrCodeImageUrl}
                      alt="QR Code Preview"
                      className={`w-80 h-80 object-contain transition ${!canCreateQR ? 'blur-md' : ''}`}
                    />
                    {!canCreateQR && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`text-center px-6 py-3 rounded-lg ${usePremiumTheme ? 'bg-slate-800/90 text-white' : 'bg-white/90 text-gray-900'}`}>
                          <p className="text-base font-semibold">Subscribe to unlock</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Benefits Section - Larger */}
            <div className={`bg-gradient-to-br ${checkoutConfig.benefitsBg} rounded-3xl p-10 text-white shadow-2xl`}>
              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold mb-3">{checkoutConfig.benefitsTitle}</h3>
                <p className="text-lg text-white/80 max-w-2xl mx-auto">{checkoutConfig.benefitsDescription}</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-6">
                {checkoutConfig.features.map((feature, index) => {
                  const FeatureIcon = getCheckoutIcon(feature.icon);
                  return (
                    <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <FeatureIcon className="w-10 h-10 mb-4 text-white/90" />
                      <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                      <p className="text-sm text-white/80">{feature.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing Card - Larger */}
            <div className={`border-2 rounded-3xl p-10 shadow-xl ${checkoutConfig.pricingCardBg} ${checkoutConfig.pricingCardBorder}`}>
              <div className="text-center mb-8">
                <div className={`inline-block text-sm font-semibold px-4 py-2 rounded-full mb-6 ${badgeColor}`}>
                  {checkoutConfig.pricingTitle}
                </div>
                <div className="flex items-baseline justify-center gap-3 mb-3">
                  <span className={`text-6xl font-bold ${usePremiumTheme ? 'text-white' : 'text-gray-900'}`}>
                    $5
                  </span>
                  <span className={`text-2xl ${usePremiumTheme ? 'text-white/70' : 'text-gray-600'}`}>
                    /month
                  </span>
                </div>
                <p className={`text-lg ${usePremiumTheme ? 'text-white/70' : 'text-gray-600'}`}>
                  {checkoutConfig.pricingDescription}
                </p>
              </div>

              <div className="space-y-4 mb-10">
                {[
                  'Unlimited dynamic QR codes',
                  'Real-time analytics dashboard',
                  'Unlimited scans & tracking',
                  'Edit content anytime',
                  'Multiple download formats',
                  'Priority support'
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-4">
                    <Check className={`w-6 h-6 flex-shrink-0 ${accentColor}`} />
                    <span className={`text-lg ${usePremiumTheme ? 'text-white' : 'text-gray-900'}`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {subscriptionMessage && (
                <div className={`rounded-xl p-5 text-base mb-8 ${messageColor}`}>
                  {subscriptionMessage}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setShowPaywall(false);
                    setStep(2);
                  }}
                  className={`flex items-center justify-center gap-2 px-8 py-4 border-2 rounded-xl transition font-semibold text-lg ${
                    usePremiumTheme 
                      ? 'border-white/20 hover:bg-white/10 text-white' 
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Continue Editing
                </button>
                <button
                  onClick={async () => {
                    if (!user) {
                      setError('Please log in to subscribe');
                      navigate('/login');
                      return;
                    }
                    
                    setCheckoutLoading(true);
                    setError('');
                    
                    try {
                      await createCheckoutSession(user.id);
                    } catch (err: any) {
                      setError(err.message || 'Failed to start checkout. Please try again.');
                      setCheckoutLoading(false);
                      console.error('Checkout error:', err);
                    }
                  }}
                  disabled={checkoutLoading}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl transition shadow-lg text-lg bg-gradient-to-r ${checkoutConfig.ctaButtonBg} text-slate-900`}
                >
                  {checkoutLoading ? 'Loading...' : checkoutConfig.ctaLabel}
                  {!checkoutLoading && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        );
      }
      
      // Centered layout (default)
      return (
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-gradient-to-br ${checkoutConfig.heroIconBg}`}>
              <HeroIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className={`text-4xl font-bold ${usePremiumTheme ? 'text-white' : 'text-gray-900'}`}>
              {checkoutConfig.heroTitle}
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${usePremiumTheme ? 'text-white/70' : 'text-gray-600'}`}>
              {checkoutConfig.heroDescription}
            </p>
          </div>

          {/* QR Code Preview with Blur if no subscription */}
          {qrCodeImageUrl && (
            <div className="flex justify-center">
              <div className={`relative rounded-2xl p-6 ${usePremiumTheme ? 'bg-slate-900/60 border border-white/10' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 text-center ${usePremiumTheme ? 'text-white' : 'text-gray-900'}`}>
                  Your QR Code Preview
                </h3>
                <div className="relative inline-block">
                  <img
                    src={qrCodeImageUrl}
                    alt="QR Code Preview"
                    className={`w-64 h-64 object-contain transition ${!canCreateQR ? 'blur-md' : ''}`}
                  />
                  {!canCreateQR && (
                    <button
                      onClick={async () => {
                        if (!user) {
                          setError('Please log in to subscribe');
                          navigate('/login');
                          return;
                        }
                        
                        setCheckoutLoading(true);
                        setError('');
                        
                        try {
                          await createCheckoutSession(user.id);
                        } catch (err: unknown) {
                          setError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
                          setCheckoutLoading(false);
                          console.error('Checkout error:', err);
                        }
                      }}
                      disabled={checkoutLoading}
                      className="absolute inset-0 flex items-center justify-center cursor-pointer hover:opacity-90 transition"
                      title="Click to subscribe and unlock QR code"
                    >
                      <div className={`text-center px-4 py-2 rounded-lg ${usePremiumTheme ? 'bg-slate-800/90 text-white' : 'bg-white/90 text-gray-900'}`}>
                        <p className="text-sm font-semibold">{checkoutLoading ? 'Loading...' : 'Subscribe to unlock'}</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Visual Benefits */}
          <div className={`bg-gradient-to-br ${checkoutConfig.benefitsBg} rounded-3xl p-8 text-white shadow-2xl`}>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">{checkoutConfig.benefitsTitle}</h3>
              <p className="text-white/80">{checkoutConfig.benefitsDescription}</p>
            </div>

            {/* Feature Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {checkoutConfig.features.map((feature, index) => {
                const FeatureIcon = getCheckoutIcon(feature.icon);
                return (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                    <FeatureIcon className="w-8 h-8 mb-3 text-white/90" />
                    <h4 className="font-semibold mb-2">{feature.title}</h4>
                    <p className="text-sm text-white/80">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Card */}
          <div className={`border-2 rounded-2xl p-8 shadow-xl ${checkoutConfig.pricingCardBg} ${checkoutConfig.pricingCardBorder}`}>
            <div className="text-center mb-6">
              <div className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${badgeColor}`}>
                {checkoutConfig.pricingTitle}
              </div>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className={`text-5xl font-bold ${usePremiumTheme ? 'text-white' : 'text-gray-900'}`}>
                  $5
                </span>
                <span className={`text-xl ${usePremiumTheme ? 'text-white/70' : 'text-gray-600'}`}>
                  /month
                </span>
              </div>
              <p className={usePremiumTheme ? 'text-white/70' : 'text-gray-600'}>
                {checkoutConfig.pricingDescription}
              </p>
            </div>

            <div className="space-y-3 mb-8">
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
                  <span className={usePremiumTheme ? 'text-white' : 'text-gray-900'}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {subscriptionMessage && (
              <div className={`rounded-xl p-4 text-sm mb-6 ${messageColor}`}>
                {subscriptionMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowPaywall(false);
                  setStep(2);
                }}
                className={`flex items-center justify-center gap-2 px-6 py-3 border-2 rounded-xl transition font-semibold ${
                  usePremiumTheme 
                    ? 'border-white/20 hover:bg-white/10 text-white' 
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                Continue Editing
              </button>
              <button
                onClick={async () => {
                  if (!user) {
                    setError('Please log in to subscribe');
                    navigate('/login');
                    return;
                  }
                  
                  setCheckoutLoading(true);
                  setError('');
                  
                  try {
                    await createCheckoutSession(user.id);
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
                    setCheckoutLoading(false);
                    console.error('Checkout error:', err);
                  }
                }}
                disabled={checkoutLoading}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl transition shadow-lg bg-gradient-to-r ${checkoutConfig.ctaButtonBg} text-slate-900`}
              >
                {checkoutLoading ? 'Loading...' : checkoutConfig.ctaLabel}
                {!checkoutLoading && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`min-h-screen ${
      usePremiumTheme && step === 3
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white'
        : 'bg-gray-50 text-gray-900'
    }`}>
      {usePremiumTheme && step === 3 && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.08),_transparent_60%)]" />
      )}
      <div className={`container mx-auto px-4 sm:px-6 py-8 sm:py-12 ${usePremiumTheme && step === 3 ? 'relative' : ''}`}>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center space-x-2 mb-4 text-sm sm:text-base ${
                usePremiumTheme && step === 3
                  ? 'text-cyan-400 hover:text-cyan-300'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className={`text-3xl sm:text-4xl font-bold text-balance ${
              usePremiumTheme && step === 3 ? 'text-white' : 'text-gray-900'
            }`}>
              Create QR Code
            </h1>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8 sm:mb-10 space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="font-medium hidden md:inline">Type of QR code</span>
            </div>
            <div className="w-12 border-t-2 border-gray-200"></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="font-medium hidden md:inline">Content</span>
            </div>
            <div className="w-12 border-t-2 border-gray-200"></div>
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="font-medium hidden md:inline">Activate subscription</span>
            </div>
          </div>

          {/* Subscription Required Banner - Only show when on paywall step */}
          {step === 3 && subscriptionChecked && showPaywall && (
            <div className={`rounded-2xl shadow-xl p-5 sm:p-6 mb-6 sm:mb-8 ${
              usePremiumTheme
                ? 'bg-slate-900/80 border border-white/10 text-white'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              <div className="flex flex-col gap-4 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold">Your QR Code is Ready!</h3>
                  <p className={`text-sm sm:text-base ${
                    usePremiumTheme ? 'text-white/70' : 'text-gray-600'
                  }`}>
                    Subscribe now to save and unlock analytics. Only $5/month - honest pricing, no hidden fees.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!user) {
                      setError('Please log in to subscribe');
                      navigate('/login');
                      return;
                    }
                    
                    setCheckoutLoading(true);
                    setError('');
                    
                    try {
                      await createCheckoutSession(user.id);
                      // createCheckoutSession will redirect to Stripe, so we don't need to do anything else
                    } catch (err: any) {
                      setError(err.message || 'Failed to start checkout. Please try again.');
                      setCheckoutLoading(false);
                      console.error('Checkout error:', err);
                    }
                  }}
                  disabled={checkoutLoading}
                  className={`disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-5 py-3 rounded-xl transition text-center shadow ${
                    usePremiumTheme
                      ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-900'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {checkoutLoading ? 'Loading...' : 'Subscribe Now - $5/month'}
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className={`rounded-2xl shadow-lg p-6 sm:p-8 ${
            usePremiumTheme && step === 3
              ? 'bg-slate-900/80 border border-white/10'
              : 'bg-white border border-gray-200'
          }`}>
            {!subscriptionChecked ? (
              <div className="text-center py-8">
                <p className={usePremiumTheme && step === 3 ? 'text-white/70' : 'text-gray-600'}>
                  Checking subscription status...
                </p>
              </div>
            ) : (
              renderStepContent()
            )}
          </div>

          {/* Mobile Preview */}
          {step === 2 && (
            <div className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-lg p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
              <div className="flex justify-center">
                <div className="relative">
                  <Phone className="w-64 h-auto text-gray-300" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center p-2 shadow-md overflow-hidden">
                      {!previewUrl ? (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <p className="text-xs text-gray-400 text-center">Fill in the form<br />to see preview</p>
                        </div>
                      ) : (
                        <div className="relative w-full h-full">
                          <img
                            src={previewUrl}
                            alt="QR Code Preview"
                            className="w-full h-full object-contain transition"
                            onError={() => setPreviewUrl('')}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
