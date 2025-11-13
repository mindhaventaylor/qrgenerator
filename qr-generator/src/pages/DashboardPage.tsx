import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import { checkSubscriptionStatus } from '../lib/subscriptionCheck';
import { QRContent } from '../lib/qrGenerator';
import {
  QrCode,
  Plus,
  Folder,
  BarChart3,
  User,
  CreditCard,
  LogOut,
  Search,
  Download,
  Eye,
  MoreVertical,
  Menu,
  X,
  Power
} from 'lucide-react';

interface QRCodeItem {
  id: string;
  name: string;
  type: string;
  qr_image_url: string;
  scan_count: number;
  created_at: string;
  is_active: boolean;
  is_tracked?: boolean;
  content: QRContent;
  customization?: {
    foregroundColor?: string;
    backgroundColor?: string;
    showLogo?: boolean;
    logoUrl?: string;
  };
}

interface Subscription {
  plan_type: string;
  status: string;
  current_period_end: string;
}

export function DashboardPage() {
  useSEO({
    title: 'My QR Codes - Dashboard | generatecodeqr',
    description: 'Manage your QR codes, view analytics, and track performance. Create unlimited dynamic QR codes with advanced tracking.',
    url: 'https://qrgenerator-liart.vercel.app/dashboard'
  });
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromBilling = searchParams.get('from') === 'billing';
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // CRITICAL SECURITY: Always start as false - no subscription until proven otherwise
  // This ensures blur is ALWAYS shown until subscription is confirmed
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [subscriptionVerified, setSubscriptionVerified] = useState<boolean>(false); // Track if we've verified
  const [mountKey, setMountKey] = useState(0); // Force remount key

  // Effect that runs when user or location changes (including navigation)
  useEffect(() => {
    // CRITICAL SECURITY: Always start with false to ensure blur is shown until verified
    // This is the default state - no subscription until proven otherwise
    setHasActiveSubscription(false);
    setSubscriptionVerified(false);
    
    // Check if we're coming from billing page
    const fromBillingParam = new URLSearchParams(location.search).get('from') === 'billing';
    
    // Check if we're coming from an external site (like Stripe)
    const referrer = document.referrer;
    const isFromExternal = referrer && (referrer.includes('stripe.com') || referrer.includes('checkout.stripe'));
    const isFromBilling = referrer && referrer.includes('/billing');
    
    // If coming from billing or external, force extra reset and delay
    const needsExtraReset = fromBillingParam || isFromBilling || isFromExternal;
    
    // Force a small delay to ensure state is reset before loading
    const timer = setTimeout(() => {
      if (needsExtraReset) {
        // If coming from billing/external, force extra reset with longer delay
        setHasActiveSubscription(false);
        setSubscriptionVerified(false);
        setTimeout(() => {
          setHasActiveSubscription(false); // Double reset
          setSubscriptionVerified(false);
          loadQRCodes();
          loadSubscription();
        }, 150);
      } else {
        loadQRCodes();
        loadSubscription();
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [user, location.key, location.pathname, location.search]);
  
  // Additional effect that runs on every mount to ensure fresh state
  useEffect(() => {
    // CRITICAL SECURITY: Reset subscription state immediately on mount
    setHasActiveSubscription(false);
    setSubscriptionVerified(false);
    
    // Small delay to ensure this runs after any cached state
    const timer = setTimeout(() => {
      if (user) {
        loadSubscription();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [mountKey]);
  
  // Separate effect for event listeners that persist across navigation
  useEffect(() => {
    // Refresh subscription every 30 seconds to catch webhook updates
    const interval = setInterval(() => {
      if (user) {
        loadSubscription();
      }
    }, 30000);
    
    // Re-check subscription when page becomes visible (e.g., returning from Stripe)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Reset to false first, then check
        setHasActiveSubscription(false);
        loadSubscription();
      }
    };
    
    // Re-check subscription when window regains focus (e.g., returning from Stripe)
    const handleFocus = () => {
      if (user) {
        // Reset to false first, then check
        setHasActiveSubscription(false);
        loadSubscription();
      }
    };
    
    // Re-check when page is shown (e.g., navigating back from billing or Stripe)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (user) {
        // Always reset and force remount key change to ensure fresh state
        setHasActiveSubscription(false);
        setMountKey(prev => prev + 1);
        
        // If page was restored from cache (back/forward navigation), force full reset
        if (e.persisted) {
          // Force a small delay to ensure state is cleared
          setTimeout(() => {
            setHasActiveSubscription(false);
            loadQRCodes();
            loadSubscription();
          }, 50);
        } else {
          setTimeout(() => {
            setHasActiveSubscription(false);
            loadSubscription();
          }, 50);
        }
      }
    };
    
    // Detect browser back/forward navigation
    const handlePopState = () => {
      if (user) {
        // Force remount and reset
        setHasActiveSubscription(false);
        setMountKey(prev => prev + 1);
        setTimeout(() => {
          setHasActiveSubscription(false);
          loadSubscription();
        }, 50);
      }
    };
    
    // Detect when coming back from external site (like Stripe)
    const checkReferrer = () => {
      // If referrer is from Stripe or external, force reset
      const referrer = document.referrer;
      if (referrer && (referrer.includes('stripe.com') || referrer.includes('checkout.stripe'))) {
        setHasActiveSubscription(false);
        setMountKey(prev => prev + 1);
        setTimeout(() => {
          setHasActiveSubscription(false);
          loadSubscription();
        }, 100);
      }
    };
    
    // Check referrer on mount
    checkReferrer();
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user]);

  async function loadQRCodes() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQrCodes(data || []);
    } catch (error) {
      console.error('Error loading QR codes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubscription() {
    if (!user) {
      setHasActiveSubscription(false);
      setSubscription(null);
      setSubscriptionVerified(false);
      return;
    }

    // CRITICAL SECURITY: Always start with false to ensure blur is shown until verified
    // This is the default state - no subscription until proven otherwise
    // Reset multiple times to ensure it sticks
    setHasActiveSubscription(false);
    setSubscriptionVerified(false);
    
    // Small delay to ensure state is reset before checking
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Reset again after delay to be absolutely sure
    setHasActiveSubscription(false);
    setSubscriptionVerified(false);

    try {
      // Step 1: Always check subscription status first - this is the source of truth
      const subscriptionStatus = await checkSubscriptionStatus(user.id);
      
      // Step 2: Fetch subscription data from database directly
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        // On error, default to false (no access)
        setHasActiveSubscription(false);
        setSubscription(null);
        setSubscriptionVerified(true); // Mark as verified (even if false)
        return;
      }
      
      // Step 3: If no subscription exists in database, definitely false
      if (!data) {
        setHasActiveSubscription(false);
        setSubscription(null);
        setSubscriptionVerified(true); // Mark as verified (even if false)
        return;
      }
      
      setSubscription(data);
      
      // Step 4: Verify database status is exactly 'active'
      const dbStatusIsActive = data.status === 'active';
      
      // Step 5: Verify checkSubscriptionStatus confirms active
      const checkStatusIsActive = subscriptionStatus.hasActiveSubscription === true && 
                                   subscriptionStatus.canCreateQR === true;
      
      // Step 6: ONLY set to true if ALL conditions are met:
      // - Database has subscription
      // - Database status is exactly 'active'
      // - checkSubscriptionStatus confirms active
      // - checkSubscriptionStatus confirms canCreateQR
      if (dbStatusIsActive && checkStatusIsActive && 
          subscriptionStatus.hasActiveSubscription === true && 
          subscriptionStatus.canCreateQR === true) {
        // All checks passed - user has active subscription
        setHasActiveSubscription(true);
      } else {
        // Any check failed - no active subscription
        setHasActiveSubscription(false);
      }
      
      // Step 7: Final safety check - if ANY condition fails, force to false
      if (!dbStatusIsActive || !checkStatusIsActive || 
          !subscriptionStatus.hasActiveSubscription || 
          !subscriptionStatus.canCreateQR) {
        setHasActiveSubscription(false);
      }
      
      // Mark as verified after all checks
      setSubscriptionVerified(true);
    } catch (error) {
      console.error('Error loading subscription:', error);
      // On ANY error, default to false (no access)
      setHasActiveSubscription(false);
      setSubscription(null);
      setSubscriptionVerified(true); // Mark as verified (even if false)
    }
  }


  const filteredQRCodes = qrCodes.filter(qr => {
    // Search filter
    const matchesSearch = 
      (qr.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (qr.type?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      statusFilter === 'All Status' ||
      (statusFilter === 'Active' && qr.is_active !== false) ||
      (statusFilter === 'Inactive' && qr.is_active === false);
    
    // Type filter
    const matchesType = 
      typeFilter === 'All Types' ||
      (qr.type?.toLowerCase() === typeFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesType;
  });

  async function handleSignOut() {
    await signOut();
    navigate('/');
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

  async function handleDownloadQR(qrImageUrl: string, qrName: string, qrCustomization?: QRCodeItem['customization']) {
    // Download is now free - no subscription check needed
    if (!user) {
      alert('Please log in to download QR codes.');
      navigate('/login');
      return;
    }

    try {
      // Check subscription status
      const subscriptionStatus = await checkSubscriptionStatus(user.id);
      const hasActiveSubscription = subscriptionStatus.hasActiveSubscription;

      let blob: Blob;
      
      // Fetch the QR code image (which should already include color customizations if saved)
      const response = await fetch(qrImageUrl);
      blob = await response.blob();

      // Apply logo if enabled and logo URL exists (only for subscribers)
      if (hasActiveSubscription && qrCustomization?.showLogo && qrCustomization?.logoUrl) {
        // Convert blob to object URL for logo overlay
        const qrObjectUrl = URL.createObjectURL(blob);
        try {
          blob = await addLogoToQR(qrObjectUrl, qrCustomization.logoUrl);
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
      link.download = `${qrName || 'qr-code'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download QR code. Please try again.');
    }
  }

  async function handleToggleActive(qrId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ is_active: !currentStatus })
        .eq('id', qrId);

      if (error) throw error;

      // Reload QR codes to reflect changes
      loadQRCodes();
    } catch (error) {
      console.error('Toggle active error:', error);
      alert('Failed to update QR code status. Please try again.');
    }
  }

  const sidebarItems = [
    { icon: Plus, label: 'Create QR Code', path: '/create-qr' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: QrCode, label: 'My QR Codes', path: '/dashboard', active: true },
    { icon: User, label: 'My Account', path: '/account' },
    { icon: CreditCard, label: 'Billing', path: '/billing' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <QrCode className="w-8 h-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-900">generatecodeqr</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  item.active
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Subscription Status */}
          {subscription?.status !== 'active' && (
            <div className="p-4 border-t border-gray-200">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-900 mb-2">
                  Subscription Required
                </p>
                <Link
                  to="/billing"
                  className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-2 rounded-lg text-sm font-medium transition"
                >
                  Subscribe Now - $5/month
                </Link>
              </div>
            </div>
          )}

        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="text-2xl font-bold text-gray-900">My QR Codes</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/create-qr"
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden md:inline">Create QR Code</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">Log Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search QR codes..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option>All Types</option>
                <option>Website</option>
                <option>vCard</option>
                <option>WiFi</option>
              </select>
            </div>
          </div>
        </div>

        {/* QR Codes Grid */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading QR codes...</p>
            </div>
          ) : filteredQRCodes.length === 0 ? (
            <div className="text-center py-12">
              <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No QR codes yet</h3>
              <p className="text-gray-500 mb-6">Create your first QR code to get started</p>
              <Link
                to="/create-qr"
                className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                <span>Create QR Code</span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredQRCodes.map((qr) => (
                <div key={qr.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
                  <div className="flex items-start space-x-4">
                    {/* QR Code Image */}
                    <div className="flex-shrink-0 relative">
                      {qr.qr_image_url ? (
                        <Link to={`/qr/${qr.id}`}>
                          <img
                            src={qr.qr_image_url}
                            alt={qr.name || 'QR Code'}
                            className="w-24 h-24 rounded-lg border border-gray-200 transition hover:shadow-lg cursor-pointer"
                          />
                        </Link>
                      ) : (
                        <div className="w-24 h-24 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                          <QrCode className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* QR Code Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <Link to={`/qr/${qr.id}`} className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 truncate hover:text-purple-600 transition">
                            {qr.name || 'Unnamed QR Code'}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {qr.type ? (qr.type.charAt(0).toUpperCase() + qr.type.slice(1)) : 'Unknown Type'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Created {qr.created_at ? new Date(qr.created_at).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </Link>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>

                      {qr.is_tracked !== false && qr.scan_count > 0 && (
                        <div className="mt-4 flex items-center space-x-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <BarChart3 className="w-4 h-4 mr-1 text-purple-600" />
                            <span className="font-medium">{qr.scan_count} scans</span>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center space-x-2 flex-wrap gap-2">
                        {qr.qr_image_url && (
                          <button
                            onClick={() => handleDownloadQR(qr.qr_image_url, qr.name, qr.customization)}
                            className="flex items-center space-x-1 px-3 py-2 rounded-lg transition text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200"
                            title="Download QR code (Free)"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleActive(qr.id, qr.is_active !== false)}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition text-sm font-medium ${
                            qr.is_active !== false
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                          <span>{qr.is_active !== false ? 'Active' : 'Inactive'}</span>
                        </button>
                        <Link
                          to={`/qr/${qr.id}`}
                          className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </Link>
                        {qr.is_tracked !== false && (
                          <Link
                            to={`/analytics/${qr.id}`}
                            className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                          >
                            <BarChart3 className="w-4 h-4" />
                            <span>Analytics</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
