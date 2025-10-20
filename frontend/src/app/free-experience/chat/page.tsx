'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FreeExperienceChatPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to registration since anonymous chat doesn't exist
    router.push('/register');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Redirecting to sign up...</h1>
        <p className="text-gray-300">Please create an account to chat with Jules.</p>
      </div>
    </div>
  );
}