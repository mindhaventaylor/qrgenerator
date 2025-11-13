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
  Power,
  Lock,
  Trash2,
  Copy
} from 'lucide-react';
import { createCheckoutSession } from '../lib/stripe';

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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  async function handleDownloadQR(qrImageUrl: string, qrName: string) {
    if (!user) {
      alert('Please log in to download QR codes.');
      navigate('/login');
      return;
    }

    // Check subscription status before allowing download
    if (!hasActiveSubscription) {
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

    // Re-verify subscription status immediately before download
    try {
      const subscriptionStatus = await checkSubscriptionStatus(user.id);
      if (!subscriptionStatus.hasActiveSubscription || !subscriptionStatus.canCreateQR) {
        alert('Please subscribe to download QR codes.');
        navigate('/billing');
        return;
      }
    } catch (error) {
      console.error('Error verifying subscription before download:', error);
      alert('Unable to verify subscription status. Please try again.');
      return;
    }

    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
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

  async function handleDeleteQR(qrId: string, qrName: string) {
    if (!window.confirm(`Are you sure you want to delete "${qrName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', qrId)
        .eq('user_id', user!.id);

      if (error) throw error;

      // Reload QR codes to reflect changes
      loadQRCodes();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete QR code. Please try again.');
    }
  }

  async function handleCopyLink(qrId: string) {
    try {
      // Get the QR code URL - this would be the public URL if you have one
      // For now, we'll copy the dashboard URL or the QR detail URL
      const qrUrl = `${window.location.origin}/qr/${qrId}`;
      await navigator.clipboard.writeText(qrUrl);
      setOpenMenuId(null);
    } catch (error) {
      console.error('Copy error:', error);
      alert('Failed to copy link. Please try again.');
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const sidebarItems = [
    { icon: Plus, label: 'Create QR Code', path: '/create-qr' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: QrCode, label: 'My QR Codes', path: '/dashboard', active: true },
    { icon: User, label: 'My Account', path: '/account' },
    { icon: CreditCard, label: 'Billing', path: '/billing' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex relative">
      {/* Radial gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.08),_transparent_60%)]" />
      
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900/80 border-r border-white/10 backdrop-blur-md transform transition-transform duration-300 ease-in-out relative
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <QrCode className="w-8 h-8 text-cyan-400" />
              <span className="text-xl font-bold text-white">generatecodeqr</span>
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
                    ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Subscription Status */}
          {subscription?.status !== 'active' && (
            <div className="p-4 border-t border-white/10">
              <div className="bg-slate-800/60 border border-white/10 rounded-lg p-4">
                <p className="text-sm font-semibold text-white mb-2">
                  Subscription Required
                </p>
                <Link
                  to="/billing"
                  className="block w-full bg-cyan-400 hover:bg-cyan-300 text-slate-900 text-center py-2 rounded-lg text-sm font-medium transition"
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
        <header className="bg-slate-900/80 border-b border-white/10 backdrop-blur-md px-6 py-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-white/70 hover:text-white"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="text-2xl font-bold text-white">My QR Codes</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/create-qr"
                className="flex items-center space-x-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 px-4 py-2 rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden md:inline">Create QR Code</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">Log Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="px-6 py-4 bg-slate-900/80 border-b border-white/10 backdrop-blur-md relative">
          <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search QR codes..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
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
            <div className="text-center py-12 relative">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent"></div>
              <p className="mt-4 text-white/70">Loading QR codes...</p>
            </div>
          ) : filteredQRCodes.length === 0 ? (
            <div className="text-center py-12 relative">
              <QrCode className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No QR codes yet</h3>
              <p className="text-white/70 mb-6">Create your first QR code to get started</p>
              <Link
                to="/create-qr"
                className="inline-flex items-center space-x-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 px-6 py-3 rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                <span>Create QR Code</span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 relative">
              {filteredQRCodes.map((qr) => (
                <div key={qr.id} className="bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-2xl p-6 hover:shadow-2xl transition hover:border-cyan-400/50 cursor-pointer" onClick={() => navigate(`/qr/${qr.id}`)}>
                  <div className="flex items-start space-x-4">
                    {/* QR Code Image */}
                    <div className="flex-shrink-0 relative">
                      {qr.qr_image_url ? (
                        hasActiveSubscription ? (
                          <img
                            src={qr.qr_image_url}
                            alt={qr.name || 'QR Code'}
                            className="w-24 h-24 rounded-lg border border-white/10 transition"
                          />
                        ) : (
                          <div className="relative">
                            <img
                              src={qr.qr_image_url}
                              alt={qr.name || 'QR Code'}
                              className="w-24 h-24 rounded-lg border border-white/10 transition blur-md opacity-50"
                              style={{
                                filter: 'blur(12px)',
                                pointerEvents: 'none'
                              }}
                            />
                            {/* Lock Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 rounded-lg border border-white/10">
                              <Lock className="w-6 h-6 text-cyan-400" />
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="w-24 h-24 rounded-lg border border-white/10 bg-slate-800 flex items-center justify-center">
                          <QrCode className="w-8 h-8 text-white/30" />
                        </div>
                      )}
                    </div>

                    {/* QR Code Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white truncate">{qr.name || 'Unnamed QR Code'}</h3>
                          <p className="text-sm text-white/70 mt-1">
                            {qr.type ? (qr.type.charAt(0).toUpperCase() + qr.type.slice(1)) : 'Unknown Type'}
                          </p>
                          <p className="text-xs text-white/50 mt-1">
                            Created {qr.created_at ? new Date(qr.created_at).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                        <div className="relative">
                          <button 
                            className="text-white/40 hover:text-white/70 p-1 rounded-lg hover:bg-white/10 transition" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenMenuId(openMenuId === qr.id ? null : qr.id);
                            }}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {openMenuId === qr.id && (
                            <div className="absolute right-0 top-10 z-50 bg-slate-800 border border-white/10 rounded-lg shadow-2xl min-w-[180px] py-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyLink(qr.id);
                                }}
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition text-left"
                              >
                                <Copy className="w-4 h-4" />
                                <span>Copy Link</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/qr/${qr.id}`);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition text-left"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View Details</span>
                              </button>
                              <div className="border-t border-white/10 my-1"></div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQR(qr.id, qr.name);
                                }}
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition text-left"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {qr.is_tracked !== false && qr.scan_count > 0 && (
                        <div className="mt-4 flex items-center space-x-4">
                          <div className="flex items-center text-sm text-white/70">
                            <BarChart3 className="w-4 h-4 mr-1 text-cyan-400" />
                            <span className="font-medium">{qr.scan_count} scans</span>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center space-x-2 flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        {qr.qr_image_url && (
                          hasActiveSubscription ? (
                            <button
                              onClick={() => handleDownloadQR(qr.qr_image_url, qr.name)}
                              className="flex items-center space-x-1 px-3 py-2 rounded-lg transition text-sm font-medium bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 border border-cyan-400/30"
                              title="Download QR code"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </button>
                          ) : (
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
                              className="flex items-center space-x-1 px-3 py-2 rounded-lg transition text-sm font-medium bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 border border-cyan-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Subscribe to download QR codes"
                            >
                              <Lock className="w-4 h-4" />
                              <span>{checkoutLoading ? 'Loading...' : 'Subscribe'}</span>
                            </button>
                          )
                        )}
                        <button
                          onClick={() => handleToggleActive(qr.id, qr.is_active !== false)}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition text-sm font-medium border ${
                            qr.is_active !== false
                              ? 'bg-green-400/20 text-green-400 hover:bg-green-400/30 border-green-400/30'
                              : 'bg-orange-400/20 text-orange-400 hover:bg-orange-400/30 border-orange-400/30'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                          <span>{qr.is_active !== false ? 'Active' : 'Inactive'}</span>
                        </button>
                        {qr.is_tracked !== false && (
                          <Link
                            to={`/analytics/${qr.id}`}
                            className="flex items-center space-x-1 px-3 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition text-sm font-medium border border-white/10"
                            onClick={(e) => e.stopPropagation()}
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
