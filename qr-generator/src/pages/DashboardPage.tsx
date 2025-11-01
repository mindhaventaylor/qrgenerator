import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
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
  content: any;
}

interface Subscription {
  plan_type: string;
  status: string;
  current_period_end: string;
}

export function DashboardPage() {
  useSEO({
    title: 'My QR Codes - Dashboard | QR Generator AI',
    description: 'Manage your QR codes, view analytics, and track performance. Create unlimited dynamic QR codes with advanced tracking.',
    url: 'https://qrgenerator-liart.vercel.app/dashboard'
  });
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadQRCodes();
    loadSubscription();
    
    // Refresh subscription every 30 seconds to catch webhook updates
    const interval = setInterval(() => {
      if (user) {
        loadSubscription();
      }
    }, 30000);
    
    return () => clearInterval(interval);
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
    }
  }


  const filteredQRCodes = qrCodes.filter(qr =>
    (qr.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (qr.type?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  async function handleDownloadQR(qrImageUrl: string, qrName: string) {
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

  const sidebarItems = [
    { icon: Plus, label: 'Create QR Code', path: '/create-qr' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: QrCode, label: 'My QR Codes', path: '/dashboard', active: true },
    { icon: User, label: 'My Account', path: '/account' },
    { icon: CreditCard, label: 'Billing', path: '/billing' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
              <span className="text-xl font-bold text-gray-800">QR generator.ai</span>
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

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Log Out</span>
            </button>
          </div>
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
              <h1 className="text-2xl font-bold text-gray-800">My QR Codes</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/create-qr"
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden md:inline">Create QR Code</span>
              </Link>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
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
                    <div className="flex-shrink-0">
                      {qr.qr_image_url ? (
                        <img
                          src={qr.qr_image_url}
                          alt={qr.name || 'QR Code'}
                          className="w-24 h-24 rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                          <QrCode className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* QR Code Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 truncate">{qr.name || 'Unnamed QR Code'}</h3>
                          <p className="text-sm text-gray-500">
                            {qr.type ? (qr.type.charAt(0).toUpperCase() + qr.type.slice(1)) : 'Unknown Type'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Created {qr.created_at ? new Date(qr.created_at).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>

                      {qr.is_tracked !== false && qr.scan_count > 0 && (
                        <div className="mt-4 flex items-center space-x-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <BarChart3 className="w-4 h-4 mr-1" />
                            <span>{qr.scan_count} scans</span>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center space-x-2 flex-wrap gap-2">
                        {qr.qr_image_url && (
                          <button
                            onClick={() => handleDownloadQR(qr.qr_image_url, qr.name)}
                            className="flex items-center space-x-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleActive(qr.id, qr.is_active !== false)}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-lg hover:opacity-80 transition text-sm ${
                            qr.is_active !== false
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          }`}
                        >
                          <Power className={`w-4 h-4 ${qr.is_active !== false ? '' : 'text-orange-600'}`} />
                          <span>{qr.is_active !== false ? 'Active' : 'Inactive'}</span>
                        </button>
                        {qr.is_tracked !== false && (
                          <Link
                            to={`/analytics/${qr.id}`}
                            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
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
