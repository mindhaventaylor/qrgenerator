import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { QrCode } from 'lucide-react';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Handle OAuth callback from Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          navigate('/login?error=auth_failed');
          return;
        }

        // Check if user is authenticated
        if (data?.session?.user) {
          // Success! Redirect to dashboard
          console.log('OAuth login successful');
          navigate('/dashboard');
        } else {
          // No session, redirect to login
          console.log('No session found');
          navigate('/login?error=no_session');
        }
      } catch (error) {
        console.error('Callback error:', error);
        navigate('/login?error=callback_failed');
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <QrCode className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-white mb-2">Completing sign in...</h2>
        <p className="text-gray-300">Please wait</p>
      </div>
    </div>
  );
}

