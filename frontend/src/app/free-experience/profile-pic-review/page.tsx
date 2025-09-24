'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@/analytics/client';

export default function FreeExperienceProfilePicReviewPage() {
  const router = useRouter();

  useEffect(() => {
    // Track that user came from free experience
    track('page_visited', {
      page: '/free-experience/profile-pic-review',
      category: 'free_experience',
      action: 'profile_pic_review_accessed_from_free_experience'
    });

    // Redirect to the main profile pic review page
    router.replace('/profile-pic-review');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg">Redirecting to Profile Pic Review...</p>
      </div>
    </div>
  );
}
