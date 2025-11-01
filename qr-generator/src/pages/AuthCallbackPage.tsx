import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { QrCode } from 'lucide-react';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        console.log('OAuth callback triggered');
        
        // Wait a moment for Supabase to process the hash fragment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the session - Supabase should have automatically extracted tokens from hash
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        console.log('Session data:', { hasSession: !!data?.session, hasUser: !!data?.session?.user });
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
          setTimeout(() => navigate('/login?error=auth_failed'), 2000);
          return;
        }

        // Check if user is authenticated
        if (data?.session?.user) {
          // Success! Redirect to dashboard
          console.log('OAuth login successful for user:', data.session.user.email);
          navigate('/dashboard');
        } else {
          // No session, redirect to login
          console.log('No session found in callback');
          setError('No session found');
          setTimeout(() => navigate('/login?error=no_session'), 2000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setTimeout(() => navigate('/login?error=callback_failed'), 2000);
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <QrCode className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-white mb-2">Completing sign in...</h2>
        {error && (
          <p className="text-red-300 text-sm mt-2">Error: {error}</p>
        )}
        {!error && <p className="text-gray-300">Please wait</p>}
      </div>
    </div>
  );
}

