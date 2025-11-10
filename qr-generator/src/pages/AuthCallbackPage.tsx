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
          const user = data.session.user;
          console.log('OAuth login successful for user:', user.email);
          
          // Check if profile exists to determine if this is a new user or existing user
          let isNewUser = false;
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', user.id)
              .maybeSingle();
            
            if (!profileData && !profileError) {
              // Profile doesn't exist - this is a new user
              isNewUser = true;
              console.log('New user detected, creating profile for user:', user.id);
              
              // Create profile for new user
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  email: user.email || '',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
              
              if (insertError) {
                console.error('Failed to create profile:', insertError);
                // Don't block the flow, just log the error
              } else {
                console.log('Profile created successfully');
              }
            } else if (profileData) {
              // Profile exists - this is an existing user
              isNewUser = false;
              console.log('Existing user detected');
            }
          } catch (profileCheckError) {
            console.error('Error checking/creating profile:', profileCheckError);
            // If we can't determine, assume existing user and redirect to dashboard
            isNewUser = false;
          }
          
          // Redirect based on whether this is a new user or existing user
          if (isNewUser) {
            // New user signup - redirect to create QR code
            navigate('/create-qr');
          } else {
            // Existing user login - redirect to dashboard
            navigate('/dashboard');
          }
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

