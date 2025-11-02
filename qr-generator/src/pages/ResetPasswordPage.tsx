import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import { QrCode, Lock, ArrowLeft } from 'lucide-react';

export function ResetPasswordPage() {
  useSEO({
    title: 'Reset Password - generatecodeqr',
    description: 'Reset your generatecodeqr account password',
    url: 'https://qrgenerator-liart.vercel.app/reset-password'
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a valid session (user clicked the reset link)
    async function checkSession() {
      // First check for errors in URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const urlError = hashParams.get('error');
      
      if (urlError) {
        // Redirect to error page with error details
        const errorCode = hashParams.get('error_code');
        const errorDesc = hashParams.get('error_description');
        const errorParams = new URLSearchParams();
        errorParams.set('error', urlError);
        if (errorCode) errorParams.set('error_code', errorCode);
        if (errorDesc) errorParams.set('error_description', errorDesc);
        navigate(`/auth/error?${errorParams.toString()}`);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setValidToken(true);
      } else {
        // Check URL hash for access token (Supabase puts it there)
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        if (accessToken && type === 'recovery') {
          // Set the session from the token
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || ''
          });
          if (!setSessionError) {
            setValidToken(true);
          } else {
            // Redirect to error page
            navigate('/auth/error?error=access_denied&error_description=Invalid or expired reset link');
          }
        } else {
          // No token found, redirect to error page
          navigate('/auth/error?error=access_denied&error_description=Invalid or expired reset link');
        }
      }
    }
    checkSession();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Get the session to ensure we have the right user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Invalid session. Please request a new reset link.');
      }

      // Update password using context function
      await resetPassword(password);
      
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  if (!validToken && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2 text-white hover:opacity-80 transition">
              <QrCode className="w-10 h-10 text-purple-400" />
              <span className="text-3xl font-bold">generatecodeqr</span>
            </Link>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
            <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
            <Link to="/forgot-password" className="block text-center text-purple-400 hover:text-purple-300">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <Link to="/login" className="inline-flex items-center text-purple-400 hover:text-purple-300 transition mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Create New Password</h1>
            <p className="text-gray-300 text-sm">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success ? (
            <div className="bg-green-500/20 border border-green-500 text-green-100 px-4 py-3 rounded-lg mb-4">
              <p className="font-semibold mb-2">Password reset successfully!</p>
              <p className="text-sm">Redirecting you to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/20 border border-white/30 rounded-lg px-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter new password"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/20 border border-white/30 rounded-lg px-10 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition transform hover:scale-105"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <p className="text-center text-gray-300 mt-6 text-sm">
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

