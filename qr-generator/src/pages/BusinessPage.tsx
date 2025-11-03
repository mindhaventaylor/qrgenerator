import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';

interface BusinessContent {
  businessName?: string;
  website?: string;
  url?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export function BusinessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [businessContent, setBusinessContent] = useState<BusinessContent | null>(null);
  const [qrName, setQrName] = useState('');

  useSEO({
    title: 'Business Information - generatecodeqr',
    description: 'View business information',
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
        .select('content, name')
        .eq('id', id)
        .eq('type', 'business')
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setBusinessContent(data.content || {});
        setQrName(data.name || 'Business');
      } else {
        setError('QR code not found');
      }
    } catch (err: any) {
      console.error('Error loading QR code:', err);
      setError(err.message || 'Failed to load business information');
    } finally {
      setLoading(false);
    }
  }

  const businessName = businessContent?.businessName || 'Business';
  const websiteUrl = businessContent?.website || businessContent?.url;
  const initials = businessName.substring(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Loading business information...</div>
      </div>
    );
  }

  if (error || !businessContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Business information not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
          >
            Go Home
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
            {initials}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{businessName}</h1>
          <p className="text-gray-600">Business Information</p>
        </div>

        <div className="space-y-4 mb-8">
          {websiteUrl && (
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white text-2xl mr-4">
                🌐
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Website</div>
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg text-gray-800 hover:text-purple-600 transition break-all"
                >
                  {websiteUrl}
                </a>
              </div>
            </div>
          )}

          {businessContent.phone && (
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white text-2xl mr-4">
                📞
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</div>
                <a
                  href={`tel:${businessContent.phone}`}
                  className="text-lg text-gray-800 hover:text-purple-600 transition"
                >
                  {businessContent.phone}
                </a>
              </div>
            </div>
          )}

          {businessContent.email && (
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white text-2xl mr-4">
                ✉️
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</div>
                <a
                  href={`mailto:${businessContent.email}`}
                  className="text-lg text-gray-800 hover:text-purple-600 transition break-all"
                >
                  {businessContent.email}
                </a>
              </div>
            </div>
          )}

          {businessContent.address && (
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white text-2xl mr-4">
                📍
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</div>
                <div className="text-lg text-gray-800">{businessContent.address}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition text-center"
            >
              Visit Website
            </a>
          )}
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

