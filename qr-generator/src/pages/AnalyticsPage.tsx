import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import { BarChart3, TrendingUp, Users, Globe, Calendar } from 'lucide-react';

export function AnalyticsPage() {
  useSEO({
    title: 'QR Code Analytics - Track Your QR Code Performance',
    description: 'View detailed analytics for your QR codes. Track scans, locations, devices, and more with real-time data.',
    url: 'https://qrgenerator-liart.vercel.app/analytics'
  });
  const { qrId } = useParams();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [selectedQR, setSelectedQR] = useState(qrId || '');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7days');

  useEffect(() => {
    loadQRCodes();
  }, [user]);

  useEffect(() => {
    if (selectedQR) {
      loadAnalytics();
    }
  }, [selectedQR, dateRange]);

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
      
      if (data && data.length > 0 && !selectedQR) {
        setSelectedQR(data[0].id);
      }
    } catch (error) {
      console.error('Error loading QR codes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics() {
    if (!selectedQR) return;

    try {
      const { data: scans, error } = await supabase
        .from('qr_scans')
        .select('*')
        .eq('qr_code_id', selectedQR)
        .order('scanned_at', { ascending: false });

      if (error) throw error;

      // Process analytics data
      const totalScans = scans?.length || 0;
      const uniqueIPs = new Set(scans?.map(s => s.ip_address)).size;
      
      const osCounts: any = {};
      const countryCounts: any = {};
      
      scans?.forEach(scan => {
        osCounts[scan.operating_system] = (osCounts[scan.operating_system] || 0) + 1;
        if (scan.country) {
          countryCounts[scan.country] = (countryCounts[scan.country] || 0) + 1;
        }
      });

      setAnalytics({
        totalScans,
        uniqueScans: uniqueIPs,
        osCounts,
        countryCounts,
        recentScans: scans?.slice(0, 10) || []
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <Link to="/dashboard" className="text-purple-600 hover:text-purple-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        </div>

        {/* QR Code Selector and Filters */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select QR Code</label>
              <select
                value={selectedQR}
                onChange={(e) => setSelectedQR(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {qrCodes.map(qr => (
                  <option key={qr.id} value={qr.id}>{qr.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Scans</h3>
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics?.totalScans || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Unique Scans</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics?.uniqueScans || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Countries</h3>
              <Globe className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {Object.keys(analytics?.countryCounts || {}).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Platforms</h3>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {Object.keys(analytics?.osCounts || {}).length}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Scans by Operating System</h3>
            <div className="space-y-3">
              {Object.entries(analytics?.osCounts || {}).map(([os, count]: [string, any]) => (
                <div key={os}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{os}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(count / (analytics?.totalScans || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Countries</h3>
            <div className="space-y-3">
              {Object.entries(analytics?.countryCounts || {})
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 5)
                .map(([country, count]: [string, any]) => (
                  <div key={country}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{country || 'Unknown'}</span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / (analytics?.totalScans || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Recent Scans Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Scans</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Browser</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics?.recentScans?.map((scan: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(scan.scanned_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {scan.city || 'Unknown'}, {scan.country || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {scan.device_type || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {scan.operating_system || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {scan.browser || 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
