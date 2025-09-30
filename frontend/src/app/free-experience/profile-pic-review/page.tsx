'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, default as api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import { track } from '@/analytics/client';

interface ProfilePicReview {
  id: string;
  originalImageUrl: string;
  advice: string;
  rating: number;
  createdAt: string;
  specificQuestion?: string;
  analysis?: {
    overallRating: number;
    feedback: string;
  };
}

export default function FreeExperienceProfilePicReviewPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [specificQuestion, setSpecificQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<ProfilePicReview | null>(null);
  const [showConversionPrompt, setShowConversionPrompt] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [usageInfo, setUsageInfo] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Function to convert star emojis to visual star icons
  const renderStarRating = (text: string) => {
    return text.replace(/(\*\*Overall Rating:\*\*)\s*([⭐]+)/g, (match, label, stars) => {
      const starCount = stars.length;
      const filledStars = '★'.repeat(starCount);
      const emptyStars = '☆'.repeat(10 - starCount);
      return `${label} ${filledStars}${emptyStars}`;
    });
  };

  useEffect(() => {
    // Track that user came from free experience
    track('page_visited', {
      page: '/free-experience/profile-pic-review',
      category: 'free_experience',
      action: 'profile_pic_review_accessed_from_free_experience'
    });

    // Initialize anonymous session
    const initSession = async () => {
      try {
        const response = await fetch('/api/anonymous/usage');
        if (response.ok) {
          const data = await response.json();
          const sessionIdFromHeader = response.headers.get('X-Anonymous-Session-ID');
          setSessionId(sessionIdFromHeader || '');
          setUsageInfo(data.usage);
        } else if (response.status === 400) {
          // Handle rate limit or session error
          const errorData = await response.json();
          console.error('Session initialization failed:', errorData);
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };
    initSession();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      alert('Please select an image');
      return;
    }

    if (!sessionId) {
      alert('Session not ready. Please refresh the page and try again.');
      return;
    }

    setIsLoading(true);
    try {
      // First, upload the image to Cloudinary
      const formData = new FormData();
      if (selectedFile) {
        formData.append('image', selectedFile);
      } else {
        const file = dataURLtoFile(selectedImage, 'profile-pic.jpg');
        formData.append('image', file);
      }

      const uploadResponse = await fetch('/api/images/anonymous', {
        method: 'POST',
        headers: {
          'X-Anonymous-Session-ID': sessionId || '',
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        if (uploadResponse.status === 429) {
          // Show the backend message for rate limiting
          setError(errorData.message || 'You\'ve used your free image upload! Sign up to get unlimited uploads.');
          return;
        }
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const uploadData = await uploadResponse.json();

      // Then submit the profile pic review with the image URL using anonymous endpoint
      const response = await fetch('/api/profile-pic-review/anonymous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Anonymous-Session-ID': sessionId || '',
        },
        body: JSON.stringify({
          imageUrl: uploadData.imageUrl,
          specificQuestion: specificQuestion.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          // Show the backend message for rate limiting
          setError(errorData.message || 'You\'ve used your free profile pic review! Sign up to get unlimited reviews.');
          return;
        }
        throw new Error(errorData.message || 'Failed to submit profile pic review');
      }

      const responseData = await response.json();
      setFeedback(responseData.profilePicReview);
      setShowConversionPrompt(true);

      // Track profile pic review upload success
      track('anonymous_profile_pic_review_uploaded', { 
        has_specific_question: !!specificQuestion,
        rating: responseData.profilePicReview.rating
      });
    } catch (error) {
      console.error('Error submitting profile pic review:', error);
      alert('Error submitting profile pic review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert data URL to file
  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex flex-col">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="/Jules_Logo_White_Final_NoOutline.png"
              alt="Jules"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              style={{ transform: 'scale(3.75) translateX(10px)', transformOrigin: 'center' }}
            />
          </div>
          <Link
            href="/free-experience"
            className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto">
          <div className="w-full max-w-2xl mx-auto">
            {!feedback ? (
              <div className="space-y-6 pb-20">
                {/* Page Title */}
                <div className="text-center">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    FREE Profile Pic Review
                  </h1>
                  <p className="text-gray-300 text-sm sm:text-base">
                    Get honest feedback on your dating profile pictures
                  </p>
                </div>

                {/* Specific Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    What specific feedback do you want? <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={specificQuestion}
                    onChange={(e) => setSpecificQuestion(e.target.value)}
                    placeholder="e.g., Is this good for a first photo? How's my smile? Does this show my personality?"
                    className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mobile-input"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload your profile picture
                  </label>
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-4 sm:p-8 text-center">
                    {selectedImage ? (
                      <div className="space-y-4">
                        <img
                          src={selectedImage}
                          alt="Selected profile picture"
                          className="w-full max-w-48 sm:max-w-64 h-48 sm:h-64 mx-auto rounded-lg object-cover"
                        />
                        <button
                          onClick={() => setSelectedImage(null)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove photo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="block w-full px-4 sm:px-6 py-3 rounded-lg transition-colors cursor-pointer bg-white/20 hover:bg-white/30 text-white border border-white/30 touch-manipulation mobile-button"
                        >
                          📱 Add a Photo
                        </label>
                        
                        <p className="text-sm text-gray-400 mt-2">
                          Choose a photo from your gallery
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button - Sticky on Mobile */}
                <div className="sticky bottom-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 pt-4 pb-2 -mx-4 px-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedImage || isLoading || !sessionId}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mobile-button"
                  >
                    {!sessionId ? 'Initializing...' : isLoading ? 'Analyzing...' : 'Get FREE Profile Pic Review'}
                  </button>
                </div>
              </div>
            ) : (
              /* Feedback Display */
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Jules's Feedback</h2>
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {feedback.rating}/10
                    </div>
                  </div>
                  
                  {/* Feedback Text */}
                  <div className="mb-6">
                    <div className="text-white leading-relaxed prose prose-invert max-w-none [&_*]:text-gray-300">
                      <ReactMarkdown
                        components={{
                          h1: ({children}) => <h1 className="text-xl font-bold text-white mb-3">{children}</h1>,
                          h2: ({children}) => <h2 className="text-lg font-bold text-white mb-2">{children}</h2>,
                          h3: ({children}) => <h3 className="text-base font-bold text-white mb-2">{children}</h3>,
                          p: ({children}) => <p className="text-white mb-3">{children}</p>,
                          strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                          ul: ({children}) => <ul className="list-disc list-inside text-white mb-3 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside text-white mb-3 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-white">{children}</li>
                        }}
                      >
                        {renderStarRating(feedback.analysis?.feedback || feedback.advice)}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                  </div>
                </div>

                {/* Conversion Prompt */}
                {showConversionPrompt && (
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-lg p-6 border border-blue-500/30">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-3">
                        🎯 Ready to unlock the full Jules experience?
                      </h3>
                      <p className="text-gray-300 mb-4">
                        You've used your free profile pic review! Sign up to get unlimited profile pic reviews, dating advice, and outfit feedback.
                      </p>
                      <div className="flex justify-center">
                        <Link
                          href="/register"
                          onClick={() => track('conversion_prompt_clicked', {
                            source: 'profile_pic_review',
                            action: 'signup_from_conversion_prompt'
                          })}
                          className="w-full max-w-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-center"
                        >
                          Sign Up FREE
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
