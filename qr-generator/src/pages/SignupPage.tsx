import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSEO } from '../hooks/useSEO';
import { supabase } from '../lib/supabase';
import { QrCode, Mail, Lock, User, Chrome } from 'lucide-react';

export function SignupPage() {
  useSEO({
    title: 'Sign Up - generatecodeqr | Start Creating QR Codes Today',
    description: 'Sign up for generatecodeqr and start creating dynamic QR codes with advanced analytics. Simple $5/month pricing - no trials, no hidden fees.',
    url: 'https://qrgenerator-liart.vercel.app/signup'
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect if user is already logged in (prevents showing signup page to logged-in users)
  useEffect(() => {
    if (user && !loading) {
      // User is already logged in, redirect immediately to create-qr
      navigate('/create-qr', { replace: true });
    }
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName
      });

      // Check if signup was successful
      if (result?.user) {
        // Supabase automatically logs in the user after signup (if email confirmation is disabled)
        // Check if we have a session immediately
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Session exists, redirect immediately
          navigate('/create-qr', { replace: true });
        } else {
          // Wait for auth state change to propagate, then redirect
          // The useEffect above will catch this when user becomes available
          setTimeout(() => {
            navigate('/create-qr', { replace: true });
          }, 500);
        }
        
        // Keep loading true to prevent form interaction during redirect
        // The redirect will happen before loading is set to false
      } else {
        // If no user but no error thrown, something unexpected happened
        setError('Failed to create account. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      // Display the error message
      const errorMessage = err?.message || err?.error?.message || 'Failed to create account. Please try again.';
      setError(errorMessage);
      setLoading(false);
      console.error('Signup error:', err);
    }
  }

  async function handleGoogleSignIn() {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-6 py-12 relative">
      {/* Apply page5 radial gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.08),_transparent_60%)]" />
      
      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-white hover:opacity-80 transition">
            <QrCode className="w-10 h-10 text-cyan-400" />
            <span className="text-3xl font-bold">generatecodeqr</span>
          </Link>
        </div>

        {/* Signup Form */}
        <div className="bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Create Account</h1>
          
          {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg mb-4">
              <div className="font-semibold mb-1">Error:</div>
              <div>{error}</div>
            </div>
          )}

          {/* Google Sign In - Top */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 rounded-lg transition flex items-center justify-center space-x-2 mb-6"
          >
            <Chrome className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-white/30"></div>
            <span className="px-4 text-white/70 text-sm">OR</span>
            <div className="flex-1 border-t border-white/30"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="First name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-10 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Create a password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:bg-cyan-400/50 disabled:opacity-50 text-slate-900 font-bold py-3 rounded-lg transition transform hover:scale-105"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-white/70 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold">
              Sign In
            </Link>
          </p>

          <p className="text-center text-white/50 text-xs mt-4">
            By signing up, you agree to our{' '}
            <Link to="/terms" className="text-cyan-400 hover:text-cyan-300">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
