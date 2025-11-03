import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';

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
        .select('content, name')
        .eq('id', id)
        .eq('type', 'vcard')
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setVcardContent(data.content || {});
        setQrName(data.name || 'Contact');
      } else {
        setError('QR code not found');
      }
    } catch (err: any) {
      console.error('Error loading QR code:', err);
      setError(err.message || 'Failed to load contact information');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Loading contact information...</div>
      </div>
    );
  }

  if (error || !vcardContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Contact information not found'}</p>
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

