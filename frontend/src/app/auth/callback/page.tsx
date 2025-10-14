'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trackRegistration } from '@/lib/metaPixel';

function AuthCallbackContent() {
  const [status, setStatus] = useState('Processing...');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      setStatus('Authentication failed. Please try again.');
      setTimeout(() => {
        router.push('/login?error=auth_failed');
      }, 2000);
      return;
    }

    if (token) {
      // Store the token
      localStorage.setItem('token', token);
      
      // Fetch user data
      fetchUserData(token);
    } else {
      setStatus('No authentication token received.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  }, [searchParams, router]);

  const fetchUserData = async (token: string) => {
    try {
      setStatus('Fetching user data...');
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://jules-dating.onrender.com';
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const user = await response.json();
        
        // Ensure user data is properly structured
        const userData = {
          ...user,
          onboarding: user.onboarding || {
            completed: false,
            name: user.name,
            email: user.email
          }
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Track Meta Pixel CompleteRegistration event for OAuth login
        trackRegistration({
          email: userData.email,
          name: userData.name,
          source: 'google_oauth',
          landingSource: localStorage.getItem('landing_source') || 'direct'
        });
        
        setStatus('Authentication successful!');
        
        // Redirect based on whether user has completed onboarding
        setTimeout(() => {
          if (userData.onboarding?.completed || userData.settings?.aboutMe) {
            router.push('/chat');
          } else {
            router.push('/onboarding');
          }
        }, 1000);
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setStatus('Error fetching user data. Please try again.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 w-full max-w-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Authenticating...</h2>
        <p className="text-gray-300">{status}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
} 