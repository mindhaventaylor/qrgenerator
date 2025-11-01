import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { QrCode } from 'lucide-react';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get the full URL with hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          console.error('Auth error:', error, errorDescription);
          navigate('/login?error=auth_failed');
          return;
        }

        // Supabase will handle the session automatically
        // Just wait a moment for the session to be set
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Success! Redirect to dashboard
          navigate('/dashboard');
        } else {
          // No user, redirect to login
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

