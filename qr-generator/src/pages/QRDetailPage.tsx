import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { checkSubscriptionStatus } from '../lib/subscriptionCheck';
import { createCheckoutSession } from '../lib/stripe';
import { buildQRData } from '../lib/qrGenerator';
import { useSEO } from '../hooks/useSEO';
import { Download, Palette, Image as ImageIcon, Lock, ArrowLeft, Save } from 'lucide-react';

interface QRCode {
  id: string;
  name: string;
  type: string;
  qr_image_url: string;
  customization: any;
  content: any;
  created_at: string;
}

export function QRDetailPage() {
  useSEO({
    title: 'QR Code Details - Customize Your QR Code',
    description: 'Customize your QR code colors, design, and remove logo. Download your QR code for free.',
    url: 'https://qrgenerator-liart.vercel.app/qr/:id'
  });

  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState<QRCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Customization state
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [showLogo, setShowLogo] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [customQRPreviewUrl, setCustomQRPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkSubscription();
      loadQRCode();
    }
  }, [user, id]);

  async function checkSubscription() {
    if (!user) return;
    
    try {
      const status = await checkSubscriptionStatus(user.id);
      setHasActiveSubscription(status.hasActiveSubscription);
      setSubscriptionChecked(true);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasActiveSubscription(false);
      setSubscriptionChecked(true);
    }
  }

  function generateCustomQRPreview(qrCodeData: QRCode, fgColor: string, bgColor: string) {
    if (!hasActiveSubscription || !qrCodeData) return;

    try {
      // Build QR data from the stored content
      const qrData = buildQRData(qrCodeData.type, qrCodeData.content);
      
      // Convert hex colors to format without # for API
      const fgColorClean = fgColor.replace('#', '');
      const bgColorClean = bgColor.replace('#', '');
      
      // Generate QR code with custom colors using the API
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}&format=png&color=${fgColorClean}&bgcolor=${bgColorClean}`;
      
      setCustomQRPreviewUrl(qrApiUrl);
    } catch (error) {
      console.error('Error generating custom QR preview:', error);
      setCustomQRPreviewUrl(null);
    }
  }

  // Regenerate preview when colors change (only for subscribers)
  useEffect(() => {
    if (hasActiveSubscription && qrCode) {
      generateCustomQRPreview(qrCode, foregroundColor, backgroundColor);
    } else {
      setCustomQRPreviewUrl(null);
    }
  }, [foregroundColor, backgroundColor, hasActiveSubscription, qrCode]);

  async function loadQRCode() {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setQrCode(data);
      
      // Load customization settings if they exist
      if (data.customization) {
        setForegroundColor(data.customization.foregroundColor || '#000000');
        setBackgroundColor(data.customization.backgroundColor || '#FFFFFF');
        setShowLogo(data.customization.showLogo !== false);
        setLogoUrl(data.customization.logoUrl || '');
      }
      
      // Generate preview with custom colors if customization exists (will be handled by useEffect after subscription check)
    } catch (error) {
      console.error('Error loading QR code:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveCustomization() {
    if (!qrCode || !user) return;

    setSaving(true);
    try {
      // If colors are customized, regenerate the QR code with new colors
      let qrImageUrl = qrCode.qr_image_url;
      
      if (foregroundColor !== '#000000' || backgroundColor !== '#FFFFFF') {
        // Build QR data
        const qrData = buildQRData(qrCode.type, qrCode.content);
        
        // Convert hex colors to format without # for API
        const fgColor = foregroundColor.replace('#', '');
        const bgColor = backgroundColor.replace('#', '');
        
        // Generate QR code with custom colors
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}&format=png&color=${fgColor}&bgcolor=${bgColor}`;
        
        // Fetch the new QR code image
        const response = await fetch(qrApiUrl);
        if (!response.ok) {
          throw new Error('Failed to regenerate QR code with custom colors');
        }
        
        const blob = await response.blob();
        
        // Upload new QR code to storage
        const timestamp = Date.now();
        const fileName = `${timestamp}.png`;
        const filePath = `${user.id}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('qr-images')
          .upload(filePath, blob, {
            contentType: 'image/png',
            upsert: true
          });
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('qr-images')
          .getPublicUrl(filePath);
        
        qrImageUrl = publicUrl;
      }

      const customization = {
        foregroundColor,
        backgroundColor,
        showLogo,
        logoUrl
      };

      const { error } = await supabase
        .from('qr_codes')
        .update({ 
          customization,
          qr_image_url: qrImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', qrCode.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Reload QR code to get updated customization
      await loadQRCode();
      alert('Customization saved successfully!');
    } catch (error) {
      console.error('Error saving customization:', error);
      alert('Failed to save customization. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function addLogoToQR(imageUrl: string, logoUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      
      qrImg.onload = () => {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        
        logoImg.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          const qrSize = Math.max(qrImg.width, qrImg.height);
          canvas.width = qrSize;
          canvas.height = qrSize;

          // Draw QR code
          ctx.drawImage(qrImg, 0, 0, qrSize, qrSize);

          // Draw logo in center
          const logoSize = qrSize * 0.2; // 20% of QR code size
          const logoX = (qrSize - logoSize) / 2;
          const logoY = (qrSize - logoSize) / 2;
          
          // Draw white background for logo
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
          
          // Draw logo
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, 'image/png');
        };

        logoImg.onerror = () => {
          reject(new Error('Failed to load logo image'));
        };

        logoImg.src = logoUrl;
      };

      qrImg.onerror = () => {
        reject(new Error('Failed to load QR code image'));
      };

      qrImg.src = imageUrl;
    });
  }

  async function addBrandingToQR(imageUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size: QR code + padding + branding area
        const qrSize = Math.max(img.width, img.height);
        const padding = 20;
        const brandingHeight = 40;
        canvas.width = qrSize + (padding * 2);
        canvas.height = qrSize + (padding * 2) + brandingHeight;

        // Fill white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR code centered
        const qrX = padding;
        const qrY = padding;
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

        // Add branding text at the bottom
        ctx.fillStyle = '#6B7280'; // Gray color
        ctx.font = '14px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const brandText = 'Generated by generatecodeqr';
        const textY = canvas.height - brandingHeight / 2;
        ctx.fillText(brandText, canvas.width / 2, textY);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png');
      };

      img.onerror = () => {
        reject(new Error('Failed to load QR code image'));
      };

      img.src = imageUrl;
    });
  }

  async function handleDownloadQR() {
    if (!qrCode?.qr_image_url) return;

    try {
      // Check subscription status
      const subscriptionStatus = await checkSubscriptionStatus(user!.id);
      const hasActiveSubscription = subscriptionStatus.hasActiveSubscription;

      let blob: Blob;
      
      // Start with the customized QR code (which includes color customizations)
      let qrImageUrl = qrCode.qr_image_url;
      
      // If there's a custom preview URL (with colors), use that instead
      if (customQRPreviewUrl && hasActiveSubscription) {
        qrImageUrl = customQRPreviewUrl;
      }

      // Fetch the QR code image
      const response = await fetch(qrImageUrl);
      blob = await response.blob();

      // Apply logo if enabled and logo URL exists (only for subscribers)
      if (hasActiveSubscription && showLogo && logoUrl) {
        // Convert blob to object URL for logo overlay
        const qrObjectUrl = URL.createObjectURL(blob);
        try {
          blob = await addLogoToQR(qrObjectUrl, logoUrl);
        } finally {
          URL.revokeObjectURL(qrObjectUrl);
        }
      }

      // Add branding for free users
      if (!hasActiveSubscription) {
        // Convert blob to object URL for branding
        const qrObjectUrl = URL.createObjectURL(blob);
        try {
          blob = await addBrandingToQR(qrObjectUrl);
        } finally {
          URL.revokeObjectURL(qrObjectUrl);
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${qrCode.name || 'qr-code'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download QR code. Please try again.');
    }
  }

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  if (loading || !subscriptionChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">QR code not found</p>
          <Link to="/dashboard" className="text-purple-600 hover:text-purple-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-purple-600 hover:text-purple-700 mb-4 inline-block">
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{qrCode.name}</h1>
          <p className="text-gray-600 mt-2">
            Created {new Date(qrCode.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code Preview */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">QR Code Preview</h2>
            <div className="flex justify-center mb-4">
              <div 
                className="p-4 rounded-lg relative"
                style={{ backgroundColor }}
              >
                {qrCode.qr_image_url ? (
                  <>
                    {customQRPreviewUrl && hasActiveSubscription ? (
                      <img
                        src={customQRPreviewUrl}
                        alt={qrCode.name}
                        className="w-64 h-64 object-contain"
                      />
                    ) : (
                      <img
                        src={qrCode.qr_image_url}
                        alt={qrCode.name}
                        className="w-64 h-64 object-contain"
                      />
                    )}
                    {showLogo && logoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain bg-white rounded p-1" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">No preview available</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Free Download Button */}
            <button
              onClick={handleDownloadQR}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              <Download className="w-5 h-5" />
              <span>Download QR Code (Free)</span>
            </button>
          </div>

          {/* Customization Options */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Customization</h2>

            {/* Color Customization - Requires Subscription */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Palette className="w-4 h-4 mr-2" />
                  Colors
                </label>
                {!hasActiveSubscription && (
                  <span className="text-xs text-gray-500 flex items-center">
                    <Lock className="w-3 h-3 mr-1" />
                    Premium
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Foreground Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={foregroundColor}
                      onChange={(e) => setForegroundColor(e.target.value)}
                      disabled={!hasActiveSubscription}
                      className={`w-16 h-10 rounded border border-gray-300 cursor-pointer ${!hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <input
                      type="text"
                      value={foregroundColor}
                      onChange={(e) => setForegroundColor(e.target.value)}
                      disabled={!hasActiveSubscription}
                      className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg ${!hasActiveSubscription ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Background Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      disabled={!hasActiveSubscription}
                      className={`w-16 h-10 rounded border border-gray-300 cursor-pointer ${!hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      disabled={!hasActiveSubscription}
                      className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg ${!hasActiveSubscription ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Removal - Requires Subscription */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Logo
                </label>
                {!hasActiveSubscription && (
                  <span className="text-xs text-gray-500 flex items-center">
                    <Lock className="w-3 h-3 mr-1" />
                    Premium
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    disabled={!hasActiveSubscription}
                    className={`rounded ${!hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <span className={`text-sm ${!hasActiveSubscription ? 'text-gray-400' : 'text-gray-700'}`}>
                    Show logo on QR code
                  </span>
                </label>
                
                {showLogo && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={!hasActiveSubscription}
                      className={`text-sm ${!hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo preview" className="mt-2 w-16 h-16 object-contain border border-gray-300 rounded" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button - Requires Subscription */}
            {hasActiveSubscription ? (
              <button
                onClick={handleSaveCustomization}
                disabled={saving}
                className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Saving...' : 'Save Customization'}</span>
              </button>
            ) : (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-900 mb-3">
                  Subscribe to unlock customization features
                </p>
                <button
                  onClick={async () => {
                    if (!user) {
                      navigate('/login');
                      return;
                    }
                    
                    setCheckoutLoading(true);
                    try {
                      await createCheckoutSession(user.id);
                    } catch (err) {
                      console.error('Checkout error:', err);
                      setCheckoutLoading(false);
                    }
                  }}
                  disabled={checkoutLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? 'Loading...' : 'Subscribe Now - $5/month'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

