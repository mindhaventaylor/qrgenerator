import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createQRCode, uploadFile, buildQRData } from '../lib/qrGenerator';
import { checkSubscriptionStatus } from '../lib/subscriptionCheck';
import { useSEO } from '../hooks/useSEO';
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
  Smartphone as Phone
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
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [canCreateQR, setCanCreateQR] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [enableTracking, setEnableTracking] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

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
    } catch (error: any) {
      setError(error.message || 'Failed to upload file');
      setUploadProgress('');
      setUploading(false);
    }
  }

  useEffect(() => {
    async function verifySubscription() {
      if (!user) {
        setSubscriptionChecked(true);
        setCanCreateQR(false);
        setSubscriptionMessage('Please log in to create QR codes');
        return;
      }

      const status = await checkSubscriptionStatus(user.id);
      setCanCreateQR(status.canCreateQR);
      setSubscriptionMessage(status.message || '');
      setSubscriptionChecked(true);
    }

    verifySubscription();
    
    // Re-check subscription status every 5 seconds if not active
    const interval = setInterval(async () => {
      if (user && !canCreateQR) {
        const status = await checkSubscriptionStatus(user.id);
        if (status.canCreateQR) {
          setCanCreateQR(true);
          setSubscriptionMessage('');
          clearInterval(interval);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, canCreateQR]);

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

  async function handleCreateQR() {
    if (!user) {
      setError('You must be logged in to create QR codes');
      return;
    }

    // Check subscription status before creating
    if (!canCreateQR) {
      setError('You need an active subscription to create QR codes. Please subscribe to continue.');
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
    if (selectedType === 'links' && !content.links?.[0]?.url && !content.url) {
      setError('Please enter at least one link');
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
      const result = await createQRCode(
        user.id,
        qrName || `${selectedType} QR Code`,
        selectedType,
        content,
        undefined,
        undefined,
        enableTracking
      );

      // Success - navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create QR code. Please try again.');
      console.error('QR creation error:', err);
    } finally {
      setLoading(false);
    }
  }

  function renderStepContent() {
    if (step === 1) {
      return (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">1. Select a type of QR code</h2>
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
                  <h3 className="font-semibold text-gray-800 mb-1">{type.name}</h3>
                  <p className="text-xs text-gray-500">{type.description}</p>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6">2. Content</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Name</label>
              <input
                type="text"
                value={qrName}
                onChange={(e) => setQrName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={content.lastName || ''}
                      onChange={(e) => setContent({ ...content, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={content.email || ''}
                    onChange={(e) => setContent({ ...content, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company (optional)</label>
                  <input
                    type="text"
                    value={content.company || ''}
                    onChange={(e) => setContent({ ...content, company: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website (optional)</label>
                  <input
                    type="url"
                    value={content.website || ''}
                    onChange={(e) => setContent({ ...content, website: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address (optional)</label>
                  <input
                    type="text"
                    value={content.address || ''}
                    onChange={(e) => setContent({ ...content, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="MyWiFi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="text"
                    value={content.password || ''}
                    onChange={(e) => setContent({ ...content, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="WiFi password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Encryption</label>
                  <select
                    value={content.encryption || 'WPA'}
                    onChange={(e) => setContent({ ...content, encryption: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pre-filled Message (optional)</label>
                  <textarea
                    value={content.message || ''}
                    onChange={(e) => setContent({ ...content, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-sm text-gray-500">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PDF URL</label>
                  <input
                    type="url"
                    value={content.url || content.pdfUrl || ''}
                    onChange={(e) => setContent({ ...content, url: e.target.value, pdfUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-sm text-gray-500">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    type="url"
                    value={content.url || content.imageUrl || ''}
                    onChange={(e) => setContent({ ...content, url: e.target.value, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter URL to first image (more images can be added later)</p>
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
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-sm text-gray-500">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                  <input
                    type="url"
                    value={content.url || content.videoUrl || ''}
                    onChange={(e) => setContent({ ...content, url: e.target.value, videoUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="My Business"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                  <input
                    type="url"
                    value={content.url || content.website || ''}
                    onChange={(e) => setContent({ ...content, url: e.target.value, website: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://mybusiness.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={content.phone || ''}
                    onChange={(e) => setContent({ ...content, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-sm text-gray-500">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Audio File URL</label>
                  <input
                    type="url"
                    value={content.url || content.audioUrl || ''}
                    onChange={(e) => setContent({ ...content, url: e.target.value, audioUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="123456789"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the app ID from the store</p>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="SAVE20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Coupon URL (optional)</label>
                  <input
                    type="url"
                    value={content.url || ''}
                    onChange={(e) => setContent({ ...content, url: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL (optional)</label>
                  <input
                    type="url"
                    value={content.instagramUrl || ''}
                    onChange={(e) => setContent({ ...content, instagramUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://instagram.com/yourprofile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter/X URL (optional)</label>
                  <input
                    type="url"
                    value={content.twitterUrl || ''}
                    onChange={(e) => setContent({ ...content, twitterUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary URL</label>
                  <input
                    type="url"
                    value={content.url || ''}
                    onChange={(e) => setContent({ ...content, url: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://yourwebsite.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter at least one social media URL or your website</p>
                </div>
              </>
            )}

            {selectedType === 'links' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Links</label>
                <input
                  type="url"
                  value={content.links?.[0]?.url || content.url || ''}
                  onChange={(e) => setContent({ ...content, url: e.target.value, links: [{ url: e.target.value, title: 'Link 1' }] })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com"
                />
                <p className="text-xs text-gray-500 mt-1">Add your first link (more can be added later)</p>
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
                  <span className="font-medium text-gray-800">Enable Analytics Tracking</span>
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
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Create QR Code</h1>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8 space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="font-medium hidden md:inline">Type of QR code</span>
            </div>
            <div className="w-12 border-t-2 border-gray-300"></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="font-medium hidden md:inline">Content</span>
            </div>
          </div>

          {/* Subscription Required Banner */}
          {subscriptionChecked && !canCreateQR && (
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Subscription Required</h3>
                  <p className="text-purple-100">
                    {subscriptionMessage || 'Please subscribe to create QR codes. Only $5/month - honest pricing, no hidden fees, no scams.'}
                  </p>
                </div>
                <Link
                  to="/billing"
                  className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-6 py-3 rounded-lg transition whitespace-nowrap"
                >
                  Subscribe Now - $5/month
                </Link>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {!subscriptionChecked ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Checking subscription status...</p>
              </div>
            ) : !canCreateQR ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Subscribe to Create QR Codes</h3>
                  <p className="text-gray-600 mb-6">
                    We believe in honest, transparent pricing. Only $5/month - no hidden fees, no scams, 
                    no credit card surprises. What you see is what you pay.
                  </p>
                  <Link
                    to="/billing"
                    className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-lg transition"
                  >
                    Subscribe Now - $5/month
                  </Link>
                </div>
              </div>
            ) : (
              renderStepContent()
            )}
          </div>

          {/* Mobile Preview */}
          {step === 2 && (
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Preview</h3>
              <div className="flex justify-center">
                <div className="relative">
                  <Phone className="w-64 h-auto text-gray-300" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {previewUrl ? (
                      <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center p-2 shadow-md">
                        <img 
                          src={previewUrl} 
                          alt="QR Code Preview" 
                          className="w-full h-full object-contain"
                          onError={() => setPreviewUrl('')}
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <p className="text-xs text-gray-500 text-center">Fill in the form<br/>to see preview</p>
                      </div>
                    )}
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
