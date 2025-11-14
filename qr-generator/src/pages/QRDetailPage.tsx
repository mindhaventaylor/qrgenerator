import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { checkSubscriptionStatus } from '../lib/subscriptionCheck';
import { createCheckoutSession } from '../lib/stripe';
import { buildQRData } from '../lib/qrGenerator';
import { useSEO } from '../hooks/useSEO';
import { Download, Palette, Image as ImageIcon, Lock, ArrowLeft, Save, Upload, Shapes } from 'lucide-react';
import { applyQRShapes, BodyShape, EyeShape, OuterBorderShape } from '../lib/qrShapeModifier';

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
  
  // Shape customization state
  const [bodyShape, setBodyShape] = useState<BodyShape>('square');
  const [eyeFrameShape, setEyeFrameShape] = useState<EyeShape>('square');
  const [eyeBallShape, setEyeBallShape] = useState<EyeShape>('square');
  const [outerBorderShape, setOuterBorderShape] = useState<OuterBorderShape>('none');
  const [shapedQRPreviewUrl, setShapedQRPreviewUrl] = useState<string | null>(null);

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
      setShapedQRPreviewUrl(null);
    }
  }, [foregroundColor, backgroundColor, hasActiveSubscription, qrCode]);

  // Apply shapes to QR code preview
  useEffect(() => {
    let currentUrl: string | null = null;
    
    if (hasActiveSubscription && customQRPreviewUrl && (bodyShape !== 'square' || eyeFrameShape !== 'square' || eyeBallShape !== 'square' || outerBorderShape !== 'none')) {
      applyQRShapes(customQRPreviewUrl, {
        bodyShape,
        eyeFrameShape,
        eyeBallShape,
        outerBorderShape,
        foregroundColor,
        backgroundColor
      }).then(blob => {
        // Clean up previous URL if it exists
        setShapedQRPreviewUrl(prev => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return null;
        });
        
        const url = URL.createObjectURL(blob);
        currentUrl = url;
        setShapedQRPreviewUrl(url);
      }).catch(error => {
        console.error('Error applying shapes:', error);
        setShapedQRPreviewUrl(prev => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return null;
        });
      });
    } else {
      setShapedQRPreviewUrl(prev => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
    }
    
    // Cleanup function
    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [customQRPreviewUrl, bodyShape, eyeFrameShape, eyeBallShape, outerBorderShape, foregroundColor, backgroundColor, hasActiveSubscription]);

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
        setBodyShape(data.customization.bodyShape || 'square');
        setEyeFrameShape(data.customization.eyeFrameShape || 'square');
        setEyeBallShape(data.customization.eyeBallShape || 'square');
        setOuterBorderShape(data.customization.outerBorderShape || 'none');
      }
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

      // Apply shapes if needed
      let finalImageUrl = qrImageUrl;
      if (bodyShape !== 'square' || eyeFrameShape !== 'square' || eyeBallShape !== 'square' || outerBorderShape !== 'none') {
        try {
          const shapedBlob = await applyQRShapes(qrImageUrl, {
            bodyShape,
            eyeFrameShape,
            eyeBallShape,
            outerBorderShape,
            foregroundColor,
            backgroundColor
          });
          
          // Upload shaped QR code
          const timestamp = Date.now();
          const fileName = `${timestamp}_shaped.png`;
          const filePath = `${user.id}/${fileName}`;
          
          const { error: shapedUploadError } = await supabase.storage
            .from('qr-images')
            .upload(filePath, shapedBlob, {
              contentType: 'image/png',
              upsert: true
            });
          
          if (!shapedUploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('qr-images')
              .getPublicUrl(filePath);
            finalImageUrl = publicUrl;
          }
        } catch (error) {
          console.error('Error applying shapes:', error);
        }
      }

      const customization = {
        foregroundColor,
        backgroundColor,
        showLogo,
        logoUrl,
        bodyShape,
        eyeFrameShape,
        eyeBallShape,
        outerBorderShape
      };

      const { error } = await supabase
        .from('qr_codes')
        .update({ 
          customization,
          qr_image_url: finalImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', qrCode.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Reload QR code to get updated customization
      await loadQRCode();
    } catch (error) {
      console.error('Error saving customization:', error);
      alert('Failed to save customization. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function addLogoToQR(imageUrl: string, logoImageUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const qrImg = new Image();
      const logoImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      logoImg.crossOrigin = 'anonymous';
      
      let qrLoaded = false;
      let logoLoaded = false;
      
      const tryDraw = () => {
        if (!qrLoaded || !logoLoaded) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size to QR code size
        canvas.width = qrImg.width;
        canvas.height = qrImg.height;

        // Draw QR code
        ctx.drawImage(qrImg, 0, 0);

        // Calculate logo size (about 20% of QR code size)
        const logoSize = Math.min(qrImg.width, qrImg.height) * 0.2;
        const logoX = (canvas.width - logoSize) / 2;
        const logoY = (canvas.height - logoSize) / 2;

        // Draw white background square for logo
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);

        // Draw logo centered
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

      qrImg.onload = () => {
        qrLoaded = true;
        tryDraw();
      };

      logoImg.onload = () => {
        logoLoaded = true;
        tryDraw();
      };

      qrImg.onerror = () => {
        reject(new Error('Failed to load QR code image'));
      };

      logoImg.onerror = () => {
        reject(new Error('Failed to load logo image'));
      };

      qrImg.src = imageUrl;
      logoImg.src = logoImageUrl;
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
    if (!qrCode?.qr_image_url || !user) return;

    // Check subscription status before allowing download
    if (!hasActiveSubscription) {
      // Prompt user to subscribe
      const subscribe = window.confirm('You need an active subscription to download QR codes. Would you like to subscribe now?');
      if (subscribe) {
        setCheckoutLoading(true);
        try {
          await createCheckoutSession(user.id);
        } catch (err) {
          console.error('Checkout error:', err);
          setCheckoutLoading(false);
        }
      }
      return;
    }

    try {
      let blob: Blob;
      
      // Start with the customized QR code (which includes color customizations)
      let qrImageUrl = qrCode.qr_image_url;
      
      // If there's a shaped preview URL (with colors and shapes), use that
      if (shapedQRPreviewUrl) {
        qrImageUrl = shapedQRPreviewUrl;
      } else if (customQRPreviewUrl) {
        qrImageUrl = customQRPreviewUrl;
      }

      // Convert QR image URL to object URL for processing
      const qrResponse = await fetch(qrImageUrl);
      const qrBlob = await qrResponse.blob();
      const qrObjectUrl = URL.createObjectURL(qrBlob);

      try {
        // If logo should be shown and logo URL exists, add logo to QR code
        if (showLogo && logoUrl) {
          blob = await addLogoToQR(qrObjectUrl, logoUrl);
        } else {
          // Otherwise, just use the QR code as-is
          blob = qrBlob;
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${qrCode.name || 'qr-code'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } finally {
        URL.revokeObjectURL(qrObjectUrl);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download QR code. Please try again.');
    }
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.08),_transparent_60%)]" />
        <div className="text-center relative z-10">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent"></div>
          <p className="mt-4 text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.08),_transparent_60%)]" />
        <div className="text-center relative z-10">
          <p className="text-white/70 mb-4">QR code not found</p>
          <Link to="/dashboard" className="text-cyan-400 hover:text-cyan-300">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white relative">
      {/* Radial gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.08),_transparent_60%)]" />
      
      <div className="container mx-auto px-6 py-12 max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-cyan-400 hover:text-cyan-300 mb-4 inline-block">
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">{qrCode.name}</h1>
          <p className="text-white/70 mt-2">
            Created {new Date(qrCode.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code Preview */}
          <div className="bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-2xl overflow-hidden">
            <h2 className="text-xl font-semibold text-white mb-4">QR Code Preview</h2>
            
            {hasActiveSubscription ? (
              <>
                <div className="flex justify-center mb-4">
                  <div 
                    className="p-4 rounded-lg relative"
                    style={{ backgroundColor }}
                  >
                    {qrCode.qr_image_url ? (
                      <>
                        {shapedQRPreviewUrl ? (
                          <img
                            src={shapedQRPreviewUrl}
                            alt={qrCode.name}
                            className="w-48 h-48 sm:w-64 sm:h-64 object-contain max-w-full"
                          />
                        ) : customQRPreviewUrl ? (
                          <img
                            src={customQRPreviewUrl}
                            alt={qrCode.name}
                            className="w-48 h-48 sm:w-64 sm:h-64 object-contain max-w-full"
                          />
                        ) : (
                          <img
                            src={qrCode.qr_image_url}
                            alt={qrCode.name}
                            className="w-48 h-48 sm:w-64 sm:h-64 object-contain max-w-full"
                          />
                        )}
                        {showLogo && logoUrl && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain bg-white rounded p-1" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-48 h-48 sm:w-64 sm:h-64 bg-slate-800 rounded-lg flex items-center justify-center">
                        <p className="text-white/40 text-sm">No preview available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Download Button */}
                <button
                  onClick={handleDownloadQR}
                  className="w-full flex items-center justify-center space-x-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-semibold px-6 py-3 rounded-lg transition"
                >
                  <Download className="w-5 h-5" />
                  <span>Download QR Code</span>
                </button>
              </>
            ) : (
              <>
                {/* Blurred QR Code Preview for Non-Subscribers */}
                <div className="flex justify-center mb-4 relative">
                  <div className="p-4 rounded-lg bg-white relative">
                    {qrCode.qr_image_url ? (
                      <>
                        <img
                          src={qrCode.qr_image_url}
                          alt={qrCode.name}
                          className="w-64 h-64 object-contain blur-md opacity-50"
                          style={{
                            filter: 'blur(12px)',
                            pointerEvents: 'none'
                          }}
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg">
                          <div className="text-center p-6">
                            <Lock className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                            <p className="text-white font-semibold mb-2">Subscription Required</p>
                            <p className="text-white/70 text-sm">Subscribe to view and download QR codes</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-64 h-64 bg-slate-800 rounded-lg flex items-center justify-center">
                        <p className="text-white/40">No preview available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Subscribe Button */}
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
                  className="w-full flex items-center justify-center space-x-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-5 h-5" />
                  <span>{checkoutLoading ? 'Loading...' : 'Subscribe to Unlock - $5/month'}</span>
                </button>
              </>
            )}
          </div>

          {/* Customization Options */}
          <div className="bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-2xl overflow-hidden">
            <h2 className="text-xl font-semibold text-white mb-4">Customization</h2>

            {/* Color Customization - Requires Subscription */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white flex items-center">
                  <Palette className="w-4 h-4 mr-2 text-cyan-400" />
                  Colors
                </label>
                {!hasActiveSubscription && (
                  <span className="text-xs text-white/50 flex items-center">
                    <Lock className="w-3 h-3 mr-1" />
                    Premium
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Foreground Color</label>
                  <div className="flex items-center space-x-2 min-w-0">
                    <input
                      type="color"
                      value={foregroundColor}
                      onChange={(e) => setForegroundColor(e.target.value)}
                      disabled={!hasActiveSubscription}
                      className={`w-12 h-10 sm:w-16 sm:h-10 rounded border border-white/10 cursor-pointer flex-shrink-0 ${!hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <input
                      type="text"
                      value={foregroundColor}
                      onChange={(e) => setForegroundColor(e.target.value)}
                      disabled={!hasActiveSubscription}
                      className={`flex-1 min-w-0 px-2 sm:px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white text-sm ${!hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-white/70 mb-1">Background Color</label>
                  <div className="flex items-center space-x-2 min-w-0">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      disabled={!hasActiveSubscription}
                      className={`w-12 h-10 sm:w-16 sm:h-10 rounded border border-white/10 cursor-pointer flex-shrink-0 ${!hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      disabled={!hasActiveSubscription}
                      className={`flex-1 min-w-0 px-2 sm:px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white text-sm ${!hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Shape Customization - Requires Subscription */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white flex items-center">
                  <Shapes className="w-4 h-4 mr-2 text-cyan-400" />
                  Shapes
                </label>
                {!hasActiveSubscription && (
                  <span className="text-xs text-white/50 flex items-center">
                    <Lock className="w-3 h-3 mr-1" />
                    Premium
                  </span>
                )}
              </div>
              
              {hasActiveSubscription && qrCode ? (() => {
                // Shape preview component with QR code preview
                const ShapePreview = ({ shape, label, type }: { shape: string; label: string; type: 'body' | 'eye' | 'eye-ball' | 'border' }) => {
                  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
                  const [loading, setLoading] = useState(false);
                  
                  const isSelected = 
                    (type === 'body' && bodyShape === shape) ||
                    (type === 'eye' && eyeFrameShape === shape) ||
                    (type === 'eye-ball' && eyeBallShape === shape) ||
                    (type === 'border' && outerBorderShape === shape);
                  
                  const handleClick = () => {
                    if (!hasActiveSubscription) return;
                    if (type === 'body') setBodyShape(shape as BodyShape);
                    else if (type === 'eye') setEyeFrameShape(shape as EyeShape);
                    else if (type === 'eye-ball') setEyeBallShape(shape as EyeShape);
                    else if (type === 'border') setOuterBorderShape(shape as OuterBorderShape);
                  };

                  // Generate preview for this specific shape
                  useEffect(() => {
                    if (hasActiveSubscription && qrCode && customQRPreviewUrl) {
                      setLoading(true);
                      
                      const shapeOptions = {
                        bodyShape: type === 'body' ? (shape as BodyShape) : bodyShape,
                        eyeFrameShape: type === 'eye' ? (shape as EyeShape) : eyeFrameShape,
                        eyeBallShape: type === 'eye-ball' ? (shape as EyeShape) : eyeBallShape,
                        outerBorderShape: type === 'border' ? (shape as OuterBorderShape) : outerBorderShape,
                        foregroundColor,
                        backgroundColor
                      };

                      const timeoutId = setTimeout(() => {
                        applyQRShapes(customQRPreviewUrl, shapeOptions).then(blob => {
                          if (previewUrl) {
                            URL.revokeObjectURL(previewUrl);
                          }
                          const url = URL.createObjectURL(blob);
                          setPreviewUrl(url);
                          setLoading(false);
                        }).catch(error => {
                          console.error('Error generating shape preview:', error);
                          if (previewUrl) {
                            URL.revokeObjectURL(previewUrl);
                          }
                          setPreviewUrl(null);
                          setLoading(false);
                        });
                      }, 100);

                      return () => {
                        clearTimeout(timeoutId);
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                        }
                      };
                    }

                    return () => {
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                      }
                    };
                  }, [customQRPreviewUrl, foregroundColor, backgroundColor, bodyShape, eyeFrameShape, eyeBallShape, outerBorderShape, shape, type]);

                  return (
                    <button
                      onClick={handleClick}
                      disabled={!hasActiveSubscription}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition min-w-0 w-full ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-400/20'
                          : 'border-white/10 hover:border-white/30 bg-slate-900/60'
                      } ${!hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 flex items-center justify-center bg-white rounded p-1 sm:p-2">
                        {loading ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-cyan-400 border-t-transparent"></div>
                          </div>
                        ) : previewUrl ? (
                          <img src={previewUrl} alt={label} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded"></div>
                        )}
                      </div>
                      <span className={`text-xs font-medium truncate block ${isSelected ? 'text-cyan-400' : 'text-white/70'}`}>
                        {label}
                      </span>
                    </button>
                  );
                };

                return (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Body Shape</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 overflow-x-hidden">
                        <ShapePreview shape="square" label="Square" type="body" />
                        <ShapePreview shape="rounded" label="Rounded" type="body" />
                        <ShapePreview shape="circle" label="Circle" type="body" />
                        <ShapePreview shape="dots" label="Dots" type="body" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Eye Frame Shape</label>
                      <div className="grid grid-cols-3 gap-2 overflow-x-hidden">
                        <ShapePreview shape="square" label="Square" type="eye" />
                        <ShapePreview shape="rounded" label="Rounded" type="eye" />
                        <ShapePreview shape="circle" label="Circle" type="eye" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Eye Ball Shape</label>
                      <div className="grid grid-cols-3 gap-2 overflow-x-hidden">
                        <ShapePreview shape="square" label="Square" type="eye-ball" />
                        <ShapePreview shape="rounded" label="Rounded" type="eye-ball" />
                        <ShapePreview shape="circle" label="Circle" type="eye-ball" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-white/70 mb-1">Outer Border</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 overflow-x-hidden">
                        <ShapePreview shape="none" label="None" type="border" />
                        <ShapePreview shape="square" label="Square" type="border" />
                        <ShapePreview shape="rounded" label="Rounded" type="border" />
                        <ShapePreview shape="circle" label="Circle" type="border" />
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="space-y-3">
                  <p className="text-sm text-white/50">Subscribe to unlock shape customization</p>
                </div>
              )}
            </div>

            {/* Logo Removal - Requires Subscription */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2 text-cyan-400" />
                  Logo
                </label>
                {!hasActiveSubscription && (
                  <span className="text-xs text-white/50 flex items-center">
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
                  <span className={`text-sm ${!hasActiveSubscription ? 'text-white/40' : 'text-white/70'}`}>
                    Show logo on QR code
                  </span>
                </label>
                
                {showLogo && (
                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <Upload className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-white/70">Upload Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={!hasActiveSubscription}
                        className={`hidden ${!hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </label>
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo preview" className="mt-2 w-16 h-16 object-contain border border-white/10 rounded" />
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
                className="w-full flex items-center justify-center space-x-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Saving...' : 'Save Customization'}</span>
              </button>
            ) : (
              <div className="bg-slate-800/60 border border-white/10 rounded-lg p-4">
                <p className="text-sm text-white/70 mb-3">
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
                  className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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

