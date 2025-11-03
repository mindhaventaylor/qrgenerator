import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import { useAuth } from '../contexts/AuthContext';

interface LinkItem {
  url: string;
  title: string;
}

interface LinksContent {
  links?: LinkItem[];
  url?: string;
  title?: string;
}

export function LinksPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linksContent, setLinksContent] = useState<LinksContent | null>(null);
  const [qrName, setQrName] = useState('');
  const [qrUserId, setQrUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [addingLink, setAddingLink] = useState(false);

  useSEO({
    title: 'Links Collection - generatecodeqr',
    description: 'View and access your links collection',
  });

  useEffect(() => {
    if (id) {
      loadQRCode();
    } else {
      setError('Invalid QR code ID');
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (qrUserId && user) {
      setIsOwner(qrUserId === user.id);
    } else {
      setIsOwner(false);
    }
  }, [qrUserId, user]);

  async function loadQRCode() {
    if (!id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('qr_codes')
        .select('content, name, user_id')
        .eq('id', id)
        .eq('type', 'links')
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setLinksContent(data.content || {});
        setQrName(data.name || 'Links');
        setQrUserId(data.user_id);
        
        // Normalize links - handle both array and single link formats
        const content = data.content || {};
        if (!content.links && (content.url || content.title)) {
          // Convert single link to array format
          content.links = [{ url: content.url || '', title: content.title || 'Link' }];
          setLinksContent(content);
        }
      } else {
        setError('QR code not found');
      }
    } catch (err: any) {
      console.error('Error loading QR code:', err);
      setError(err.message || 'Failed to load links');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLink() {
    if (!newLink.url.trim()) {
      alert('Please enter a URL');
      return;
    }

    if (!id || !isOwner) {
      alert('You must be the owner to add links');
      return;
    }

    setAddingLink(true);
    try {
      const currentLinks = linksContent?.links || [];
      const updatedLinks = [...currentLinks, {
        title: newLink.title.trim() || newLink.url,
        url: newLink.url.trim()
      }];

      const { error: updateError } = await supabase
        .from('qr_codes')
        .update({
          content: {
            ...linksContent,
            links: updatedLinks
          }
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setLinksContent({
        ...linksContent,
        links: updatedLinks
      });

      // Reset form
      setNewLink({ title: '', url: '' });
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Error adding link:', err);
      alert('Failed to add link: ' + err.message);
    } finally {
      setAddingLink(false);
    }
  }

  function validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  function formatUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  }

  const links = linksContent?.links || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Loading links...</div>
      </div>
    );
  }

  if (error || !linksContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Links not found'}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold mb-4">
              🔗
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{qrName}</h1>
            <p className="text-gray-600">
              {links.length} {links.length === 1 ? 'Link' : 'Links'} Available
            </p>
          </div>

          {links.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No links available</p>
              {isOwner && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
                >
                  Add First Link
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {links.map((link, index) => (
                  <a
                    key={index}
                    href={formatUrl(link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-gray-50 hover:bg-purple-50 rounded-lg transition-all border-2 border-transparent hover:border-purple-300 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-purple-600 transition truncate">
                          {link.title || link.url}
                        </h3>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {link.url}
                        </p>
                      </div>
                      <div className="ml-4 text-purple-600 group-hover:text-purple-700">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              {isOwner && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition mb-4"
                >
                  {showAddForm ? 'Cancel' : '+ Add More Links'}
                </button>
              )}
            </>
          )}

          {showAddForm && isOwner && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg border-2 border-purple-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Link</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link Title (optional)
                  </label>
                  <input
                    type="text"
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    placeholder="e.g., My Website"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL *
                  </label>
                  <input
                    type="url"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <button
                  onClick={handleAddLink}
                  disabled={addingLink || !newLink.url.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  {addingLink ? 'Adding...' : 'Add Link'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

