import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { QrCode, AlertCircle, Mail, ArrowLeft } from 'lucide-react';

export function AuthErrorPage() {
  useSEO({
    title: 'Authentication Error - generatecodeqr',
    description: 'There was an error with your authentication request',
    url: 'https://qrgenerator-liart.vercel.app/auth/error'
  });

  const [searchParams] = useSearchParams();
  const [errorType, setErrorType] = useState<string>('');
  const [errorDescription, setErrorDescription] = useState<string>('');

  useEffect(() => {
    // Check URL hash for errors (Supabase puts errors in hash)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    
    // Also check regular search params
    const error = hashParams.get('error') || searchParams.get('error');
    const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
    const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');

    if (error) {
      setErrorType(error);
    }
    if (errorDesc) {
      // Decode URL-encoded description
      setErrorDescription(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
    }

    // Clean up URL
    if (error || errorCode) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  const isExpiredLink = errorType === 'access_denied' || errorDescription.toLowerCase().includes('expired');
  const isInvalidLink = errorDescription.toLowerCase().includes('invalid');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-white hover:opacity-80 transition">
            <QrCode className="w-10 h-10 text-purple-400" />
            <span className="text-3xl font-bold">generatecodeqr</span>
          </Link>
        </div>

        {/* Error Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isExpiredLink ? 'Link Expired' : 'Authentication Error'}
            </h1>
            <p className="text-gray-300 text-sm">
              {isExpiredLink 
                ? 'This password reset link has expired. Please request a new one.'
                : errorDescription || 'There was an issue with your authentication request.'}
            </p>
          </div>

          {errorDescription && (
            <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-6">
              <p className="text-sm">{errorDescription}</p>
            </div>
          )}

          <div className="space-y-4">
            {(isExpiredLink || isInvalidLink) && (
              <Link
                to="/forgot-password"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center space-x-2"
              >
                <Mail className="w-5 h-5" />
                <span>Request New Reset Link</span>
              </Link>
            )}

            <Link
              to="/login"
              className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Login</span>
            </Link>
          </div>

          <p className="text-center text-gray-300 mt-6 text-sm">
            Need help?{' '}
            <Link to="/contact" className="text-purple-400 hover:text-purple-300 font-semibold">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

