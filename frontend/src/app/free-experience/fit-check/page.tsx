'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { track } from '@/analytics/client';

interface FitCheckResponse {
  id: string;
  analysis: {
    overallRating: number;
    feedback: string;
  };
  eventContext: string;
  createdAt: string;
  originalImageUrl?: string;
}

export default function AnonymousFitCheckPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [eventContext, setEventContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<FitCheckResponse | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Function to format fit check feedback with proper line breaks
  const formatFitCheckFeedback = (text: string) => {
    return text
      .replace('**Honest Feedback:**', '\n\n**Honest Feedback:**')
      .replace('**Specific Compliments:**', '\n\n**Specific Compliments:**')
      .replace('**Specific Improvements:**', '\n\n**Specific Improvements:**')
      .replace('**Suggestions for Alternatives:**', '\n\n**Suggestions for Alternatives:**')
      .replace('**Overall Appeal:**', '\n\n**Overall Appeal:**');
  };

  // Track page view
  useEffect(() => {
    track('page_visited', {
      page: '/free-experience/fit-check',
      category: 'fit_check',
      action: 'fit_check_page_visited'
    });
  }, []);

  // Initialize anonymous session
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await fetch('/api/anonymous/usage');
        if (response.ok) {
          const data = await response.json();
          const sessionIdFromHeader = response.headers.get('X-Anonymous-Session-ID');
          setSessionId(sessionIdFromHeader);
          setUsageInfo(data.usage);
        } else if (response.status === 400) {
          // Handle rate limit or session error
          const errorData = await response.json();
          if (errorData.upgradeRequired) {
            setError(errorData.message);
          }
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };
    initSession();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Check if it's a HEIC/HEIF file
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const isHEIC = ['heic', 'heif'].includes(fileExtension || '');
      
      if (isHEIC) {
        // For HEIC files, we can't show a preview, but we can still upload them
        // Set a special marker so we can show a placeholder in the UI
        setSelectedImage('HEIC_FILE_PLACEHOLDER');
      } else {
        // For regular files, show normal preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };


  const handleSubmit = async () => {
    if (!selectedImage) {
      setError('Please select an image');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Track fit check start
    track('fit_check_started', {
      category: 'fit_check',
      action: 'fit_check_started',
      has_image: !!selectedImage,
      event_context: eventContext || 'general'
    });

    try {
      // First, upload the image to Cloudinary
      const formData = new FormData();
      if (selectedFile) {
        formData.append('image', selectedFile);
      } else if (selectedImage !== 'HEIC_FILE_PLACEHOLDER') {
        // Fallback to base64 conversion if needed
        const file = dataURLtoFile(selectedImage, 'outfit.jpg');
        formData.append('image', file);
      } else {
        // This shouldn't happen since we always have selectedFile for HEIC
        setError('Please select a valid image file');
        return;
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
          setError(errorData.message || 'You\'ve used your free fit check! Sign up to get unlimited fit checks.');
          return;
        }
        // Show specific upload error to user
        setError(errorData.message || 'Failed to upload image. Please try again.');
        return;
      }

      const uploadData = await uploadResponse.json();

      // Then submit the fit check
      const fitCheckResponse = await fetch('/api/fit-check/anonymous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Anonymous-Session-ID': sessionId || '',
        },
        body: JSON.stringify({
          imageUrl: uploadData.imageUrl,
          eventContext: eventContext.trim() || undefined,
        }),
      });

      if (!fitCheckResponse.ok) {
        const errorData = await fitCheckResponse.json();
        if (fitCheckResponse.status === 429) {
          // Show the backend message for rate limiting
          setError(errorData.message || 'You\'ve used your free fit check! Sign up to get unlimited fit checks.');
          return;
        }
        // Show specific error to user
        setError(errorData.error || errorData.message || 'Failed to submit fit check. Please try again.');
        return;
      }

      const fitCheckData = await fitCheckResponse.json();
      setFeedback(fitCheckData.fitCheck);

      // Track fit check completion
      track('fit_check_completed', {
        event_context: eventContext || 'general',
        rating: fitCheckData.fitCheck.analysis.overallRating,
        category: 'fit_check',
        action: 'fit_check_completed'
      });

    } catch (error: any) {
      console.error('Error submitting fit check:', error);
      setError(error.message || 'Error submitting fit check. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };


  if (feedback && feedback.analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Jules' Feedback</h1>
            <p className="text-gray-300">Here's what Jules thinks about your outfit</p>
          </div>

          {/* Feedback Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 border border-white/20">
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
                {formatFitCheckFeedback(feedback.analysis.feedback)}
              </ReactMarkdown>
            </div>
          </div>

          {/* Upgrade Prompt */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-6 mb-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-blue-300 mb-3">
                Want to save this fit check?
              </h3>
              <p className="text-gray-300 mb-4">
                Sign up to save your fit checks, get unlimited feedback, and build your style profile!
              </p>
              <div className="space-y-3">
                <Link
                  href="/register?feature=fit-check"
                  onClick={() => track('signup_clicked', {
                    source: 'fit_check_results',
                    button_text: 'Sign Up to Save',
                    category: 'conversion',
                    action: 'signup_from_fit_check'
                  })}
                  className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Sign Up to Save
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Rate My Fit</h1>
          <p className="text-gray-300">Upload a photo and get instant feedback on your outfit</p>
        </div>

        {/* Usage Counter */}
        {usageInfo && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-blue-300">
                Free fit checks remaining: {usageInfo.fitChecks.remaining}
              </span>
              {usageInfo.fitChecks.remaining === 0 && (
                <span className="text-red-300 font-semibold">
                  Limit reached - Sign up for unlimited!
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-300 mb-3">{error}</p>
            {error.includes('free fit check') && (
              <button
                onClick={() => {
                  // Track the sign-up click
                  track('signup_clicked', {
                    source: 'fit_check_upgrade_prompt',
                    button_text: 'Sign Up to Continue',
                    category: 'conversion',
                    action: 'signup_from_fit_check_upgrade'
                  });
                  
                  // Store fit check data for after registration
                  if (feedback && feedback.analysis) {
                    localStorage.setItem('pendingFitCheck', JSON.stringify({
                      analysis: feedback.analysis,
                      originalImageUrl: feedback.originalImageUrl || selectedImage,
                      eventContext: feedback.eventContext,
                      timestamp: new Date().toISOString()
                    }));
                  }
                  window.location.href = '/register?source=anonymous-fit-check&redirect=fit-check';
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
              >
                Sign Up to Continue
              </button>
            )}
          </div>
        )}

        {/* Fit Check Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 border border-white/20">
          {/* Context Input */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">
              What's the occasion? (Optional)
            </label>
            <input
              type="text"
              value={eventContext}
              onChange={(e) => setEventContext(e.target.value)}
              placeholder="e.g., First date, Job interview, Casual Friday..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>


          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">
              Upload Your Photo
            </label>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
              {selectedImage ? (
                <div className="space-y-4">
                  {selectedImage === 'HEIC_FILE_PLACEHOLDER' ? (
                    <div className="w-full max-w-64 h-64 mx-auto rounded-lg bg-gray-700/50 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center">
                      <div className="text-gray-400 text-center">
                        <div className="text-4xl mb-2">📱</div>
                        <p className="text-sm">HEIC file uploaded.</p>
                        <p className="text-xs text-gray-400 mt-1">Unable to preview, but upload will work perfectly!</p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={selectedImage}
                      alt="Selected outfit"
                      className="max-w-full max-h-64 mx-auto rounded-lg"
                    />
                  )}
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-red-400 hover:text-red-300 underline"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p>Click to upload or drag and drop</p>
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  
                  {/* Add Photo Button */}
                  <label
                    htmlFor="image-upload"
                    className="block w-full px-6 py-3 rounded-lg transition-colors cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold touch-manipulation mobile-button text-center"
                  >
                    📱 Add a Photo
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              onClick={handleSubmit}
              disabled={!selectedImage || isLoading || (usageInfo?.fitChecks.remaining === 0)}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Analyzing...' : 'Get Jules\' Feedback'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}


